// Deploys the site to Render and verifies that the public address answers.
//
//   RENDER_API_KEY=... node scripts/deploy-render.mjs
//
// It creates the service from render.yaml's blueprint, fills in the
// environment variables, starts a deploy and then polls until the service is
// live. The API key is read from the environment and is never written to a
// file.

const API = "https://api.render.com/v1";

const REPO = "omarha12ha-ux/alnaimi-realestate";
const SERVICE_NAME = "alnaimi-realestate";
const BRANCH = "main";

const ENV_VARS = {
  NODE_ENV: "production",
  ADMIN_EMAILS: "omarha12ha@gmail.com",
  VITE_ADMIN_EMAILS: "omarha12ha@gmail.com",
  ADMIN_API_TOKEN: "adf2afc4e8e824f3799fae3b1c95a7dc404d42746afbdd57425d3c65602d566d15056f03bc7feac5cfb7e7c4751d2679",
  INTERNAL_API_TOKEN: "9d83da8fbd1d5826a0c71d6b6883824d06a93d1d5c87a98eb143d81f0c4925e869c85e387f3a73d1bb586d6bf7f783f1",
  BOOKING_FEE_CENTS: "0",
  STRIPE_CURRENCY: "usd",
  WHATSAPP_PROVIDER: "simulation",
  SENDER_WHATSAPP_NUMBER: "0945430030",
  FIREBASE_SERVICE_EMAIL: "",
  FIREBASE_SERVICE_PASSWORD: "",
  DISABLE_HMR: "true",
};

const apiKey = process.env.RENDER_API_KEY;
if (!apiKey) {
  console.error("RENDER_API_KEY is not set");
  process.exit(1);
}

async function api(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data?.message || data?.error || text;
    throw new Error(`${method} ${path} -> ${res.status}: ${msg}`);
  }
  return data;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const owners = await api("GET", "/owners");
  const owner = owners[0];
  console.log("owner:", owner.name, owner.id);

  const services = await api("GET", "/services?limit=100");
  let service = services.find((s) => s.repo && s.repo.includes("alnaimi-realestate"));

  if (!service) {
    console.log("creating the service...");
    service = await api("POST", "/services", {
      name: SERVICE_NAME,
      ownerId: owner.id,
      repo: REPO,
      branch: BRANCH,
      type: "web",
      runtime: "docker",
      plan: "free",
      region: "frankfurt",
      dockerContext: ".",
      dockerfilePath: "./Dockerfile",
      healthCheckPath: "/api/health",
    });
    console.log("  created:", service.id);
  } else {
    console.log("service already exists:", service.id);
  }

  console.log("writing the environment variables...");
  await api(
    "PUT",
    `/services/${service.id}/env-vars`,
    Object.entries(ENV_VARS).map(([key, value]) => ({ key, value }))
  );

  const envList = await api("GET", `/services/${service.id}/env-vars`);
  const got = new Map(envList.map((e) => [e.envVar.key, e.envVar.value]));
  for (const key of Object.keys(ENV_VARS)) {
    console.log(`  ${got.has(key) ? "ok " : "MISS"} ${key}`);
  }

  console.log("starting the deploy...");
  const deploy = await api("POST", `/services/${service.id}/deploys`, { clearCache: "true" });
  console.log("  deploy:", deploy.id);

  let status = "";
  for (let i = 0; i < 120; i++) {
    await sleep(15000);
    const s = await api("GET", `/services/${service.id}`);
    const d = (s.deploys || [])[0];
    const state = d?.status || s.status;
    if (state !== status) {
      status = state;
      console.log(`  [${new Date().toISOString().slice(11, 19)}] ${state}`);
    }
    if (state === "live") break;
    if (state === "build_failed" || state === "update_failed" || state === "deactivated") {
      console.log("the deploy failed");
      break;
    }
  }

  const final = await api("GET", `/services/${service.id}`);
  const url = final.serviceDetails?.url || (final.url ? `https://${final.url}` : "");
  console.log("\npublic address:", url || "(none)");

  if (url) {
    for (const p of ["/api/health", "/", "/manifest.json"]) {
      try {
        const res = await fetch(url + p, { redirect: "follow" });
        console.log(`  ${p} -> ${res.status}`);
      } catch (e) {
        console.log(`  ${p} -> error: ${e.message}`);
      }
    }
  }
}

main().catch((e) => {
  console.error("failed:", e.message);
  process.exit(1);
});
