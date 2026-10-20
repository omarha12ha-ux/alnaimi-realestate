// Waits for the localhost.run tunnel to announce its public URL, then writes it
// to a file and prints it. Used by start-preview.bat, which starts ssh with its
// output redirected to a log: ssh block-buffers when it is not attached to a
// console, so the URL can take a few seconds to appear.
//
//   node scripts/find-tunnel-url.cjs [logPath] [outPath]

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");

const logPath = process.argv[2] || path.join(os.tmpdir(), "alnaimi-tunnel.txt");
const outPath = process.argv[3] || path.join(os.homedir(), "Desktop", "ALNAIMI-LIVE-LINK.txt");

const URL_RE = /https:\/\/[a-z0-9-]+\.lhr\.life/;
const DEADLINE = Date.now() + 90000;

function stripAnsi(s) {
  return s.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
}

function attempt() {
  let raw = "";
  try {
    raw = fs.readFileSync(logPath, "utf8");
  } catch {
    return null;
  }
  const m = stripAnsi(raw).match(URL_RE);
  return m ? m[0] : null;
}

function poll() {
  const url = attempt();
  if (url) {
    try {
      fs.writeFileSync(outPath, url, "utf8");
    } catch (e) {
      console.error("could not write " + outPath + ": " + e.message);
    }
    console.log("\n  ============================================");
    console.log("   LIVE LINK:  " + url);
    console.log("  ============================================\n");
    console.log("  Open it on your phone too - works anywhere");
    console.log("  while this window stays open.\n");
    // open in the default browser; failures are not fatal
    execFile("cmd", ["/c", "start", "", url], () => {});
    return;
  }
  if (Date.now() > DEADLINE) {
    console.error("Tunnel URL did not appear within 90s. Check " + logPath);
    process.exit(2);
  }
  setTimeout(poll, 1500);
}

console.log("Waiting for the public tunnel link...");
poll();
