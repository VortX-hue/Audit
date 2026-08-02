// app/api/subscription/status/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ isPro: false });
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to check subscription status:", error.message);
    return NextResponse.json({ isPro: false });
  }

  return NextResponse.json({ isPro: data?.status === "active" });
}