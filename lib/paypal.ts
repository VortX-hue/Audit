// src/lib/paypal.ts
//
// Server-side PayPal helpers. Never import this file from client components —
// it uses PAYPAL_CLIENT_SECRET, which must stay server-only.

const PAYPAL_API_BASE = "https://api-m.paypal.com"; // LIVE — real money moves through this

export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get PayPal access token: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

// Fetches the live subscription details from PayPal's API so we never
// trust the client-side subscriptionID blindly.
export async function getPayPalSubscription(subscriptionId: string) {
  const token = await getPayPalAccessToken();

  const res = await fetch(
    `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch PayPal subscription: ${res.status} ${text}`);
  }

  return res.json();
}