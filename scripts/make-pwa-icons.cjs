// Generates the PWA icon set as real PNG files, with no image dependencies.
// PNG = signature + IHDR + IDAT(zlib) + IEND, each chunk CRC32'd.
// The icon is the brand mark drawn from pixels: navy field, gold house, light
// doorway. Drawn at 4x then box-filtered down so edges are not jagged.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const NAVY = [0x0a, 0x19, 0x2f];
const GOLD = [0xc9, 0xa2, 0x27];
const LIGHT = [0xfd, 0xfc, 0xfb];

// ---- minimal PNG writer ---------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // raw scanlines, each prefixed with filter type 0
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const o = y * (1 + width * 4);
    raw[o] = 0;
    rgba.copy(raw, o + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- the artwork -----------------------------------------------------------
// Works in a normalised 0..1 space so one function covers every icon size.
function sample(x, y, inset) {
  // inset leaves a safe margin for the maskable icon
  const lo = inset;
  const hi = 1 - inset;
  if (x < lo || x > hi || y < lo || y > hi) return null; // transparent

  const u = (x - inset) / (hi - inset);
  const v = (y - inset) / (hi - inset);

  // rounded-square navy field
  const r = 0.18;
  const cx = Math.min(Math.max(u, r), 1 - r);
  const cy = Math.min(Math.max(v, r), 1 - r);
  const inside = (u - cx) ** 2 + (v - cy) ** 2 <= r * r || (u >= r && u <= 1 - r && v >= r) || (u >= lo && u <= hi && ((u >= r && u <= 1 - r) || (v >= r && v <= 1 - r)));
  const inField = (u >= 0 && u <= 1 && v >= 0 && v <= 1) && (inside || (u > 0 && u < 1 && v > 0 && v < 1));
  if (!inField) return null;

  // house: roof triangle + body + door
  const bodyTop = 0.46;
  const roofTop = 0.22;
  const halfBase = 0.40;
  const center = 0.5;

  const inRoof = v >= roofTop && v <= bodyTop && Math.abs(u - center) <= (v - roofTop) * 1.15 + 0.02;
  const inBody = v > bodyTop && v <= 0.80 && Math.abs(u - center) <= halfBase - 0.04;
  const inDoor = v > 0.60 && v <= 0.80 && Math.abs(u - center) <= 0.09;

  if (inDoor) return LIGHT;
  if (inBody || inRoof) return GOLD;
  return NAVY;
}

function render(size, inset = 0) {
  const SS = 4; // supersampling factor
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let acc = [0, 0, 0, 0];
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = (x + (sx + 0.5) / SS) / size;
          const py = (y + (sy + 0.5) / SS) / size;
          const c = sample(px, py, inset);
          if (c) {
            acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]; acc[3] += 255;
          }
        }
      }
      const n = SS * SS;
      const o = (y * size + x) * 4;
      const a = acc[3] / n;
      // un-premultiply so edge pixels keep their colour
      const w = a > 0 ? 255 / a : 0;
      buf[o] = Math.round(Math.min(255, acc[0] * w / n));
      buf[o + 1] = Math.round(Math.min(255, acc[1] * w / n));
      buf[o + 2] = Math.round(Math.min(255, acc[2] * w / n));
      buf[o + 3] = Math.round(a);
    }
  }
  return buf;
}

const outDir = path.join(__dirname, "..", "public");
const targets = [
  ["icon-192.png", 192, 0.04],
  ["icon-512.png", 512, 0.04],
  ["icon-maskable-512.png", 512, 0.14],
  ["apple-touch-icon.png", 180, 0.06],
];

for (const [name, size, inset] of targets) {
  const png = encodePng(size, size, render(size, inset));
  fs.writeFileSync(path.join(outDir, name), png);
  console.log(`  ${name.padEnd(26)} ${size}x${size}  ${png.length} bytes`);
}
console.log("\nicons written to public/");
