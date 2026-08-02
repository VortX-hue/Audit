// app/api/paypal/verify-subscription/route.ts
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
    return NextResponse.json({ error: "Missing subscription ID." }, { status: 400 });
  }

  try {
    // Never trust the client's claim that payment succeeded — always
    // re-check the subscription's real status directly with PayPal.
    const subscription = await getPayPalSubscription(subscriptionID);

    const isActive = subscription.status === "ACTIVE";
    const matchesProPlan = subscription.plan_id === process.env.PAYPAL_PRO_PLAN_ID;

    if (!isActive || !matchesProPlan) {
      return NextResponse.json(
        { error: "Subscription could not be verified.", plan: "free" },
        { status: 400 }
      );
    }

    const { error: dbError } = await supabase.from("subscriptions").upsert({
      user_id: userId,
      paypal_subscription_id: subscriptionID,
      plan_id: subscription.plan_id,
      status: "active",
      updated_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("Failed to persist subscription:", dbError.message);
      return NextResponse.json(
        { error: "Subscription verified but couldn't be saved. Contact support." },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan: "pro" });
  } catch (err) {
    console.error("Subscription verification failed:", err);
    return NextResponse.json(
      { error: "Something went wrong verifying your subscription." },
      { status: 500 }
    );
  }
}