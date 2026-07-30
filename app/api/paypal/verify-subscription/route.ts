// src/app/api/paypal/verify-subscription/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { getPayPalSubscription } from "@/lib/paypal";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { subscriptionID } = await req.json();
  if (!subscriptionID) {
    return NextResponse.json({ error: "Missing subscriptionID." }, { status: 400 });
  }

  try {
    // Never trust the client — ask PayPal directly what this subscription's
    // real status is.
    const subscription = await getPayPalSubscription(subscriptionID);

    const isActive = subscription.status === "ACTIVE";

    const { error: dbError } = await supabase.from("subscriptions").upsert({
      user_id: userId,
      plan: isActive ? "pro" : "free",
      paypal_subscription_id: subscriptionID,
      status: subscription.status,
      updated_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("Failed to save subscription:", dbError.message);
      return NextResponse.json(
        { error: "Payment verified, but we couldn't save your plan. Contact support." },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan: isActive ? "pro" : "free", status: subscription.status });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Couldn't verify subscription with PayPal." },
      { status: 500 }
    );
  }
}