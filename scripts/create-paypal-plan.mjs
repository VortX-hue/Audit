// scripts/create-paypal-plan.mjs
//
// One-off script: creates a PayPal Product + Subscription Plan for Auditly Pro ($19/mo).
// Run once, copy the printed plan_id into your .env.local as PAYPAL_PRO_PLAN_ID.
//
// LIVE MODE — this creates a real product/plan and, once wired up, will
// process real payments. Double check PAYPAL_CLIENT_ID/SECRET below are
// your LIVE app credentials, not sandbox ones.
//
// Usage:
//   node scripts/create-paypal-plan.mjs
//
// Requires these in your environment (or .env.local, loaded manually below):
//   PAYPAL_CLIENT_ID
//   PAYPAL_CLIENT_SECRET

import fs from "fs";
import path from "path";

// --- tiny .env.local loader (no extra dependency needed) ---
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnvLocal();

const PAYPAL_API_BASE = "https://api-m.paypal.com"; // LIVE

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET. Add them to .env.local first."
  );
  process.exit(1);
}

async function getAccessToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get access token: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function createProduct(token) {
  const res = await fetch(`${PAYPAL_API_BASE}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Auditly Pro",
      description: "Unlimited Shopify store audits with PDF export.",
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create product: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.id; // product_id
}

async function createPlan(token, productId) {
  const res = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: productId,
      name: "Auditly Pro Monthly",
      description: "Unlimited audits, $19/month.",
      billing_cycles: [
        {
          frequency: {
            interval_unit: "MONTH",
            interval_count: 1,
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0, // 0 = infinite (runs until cancelled)
          pricing_scheme: {
            fixed_price: {
              value: "19.00",
              currency_code: "USD",
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create plan: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.id; // plan_id
}

async function main() {
  console.log("Getting PayPal access token (LIVE)...");
  const token = await getAccessToken();

  console.log("Creating product...");
  const productId = await createProduct(token);
  console.log("Product created:", productId);

  console.log("Creating subscription plan...");
  const planId = await createPlan(token, productId);
  console.log("Plan created:", planId);

  console.log("\nDone! Add this to your .env.local:\n");
  console.log(`PAYPAL_PRO_PLAN_ID=${planId}`);
  console.log(`NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID=${planId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
