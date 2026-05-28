"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { ONBOARDING_STEP } from "./constants";

export async function activateSubscription(
  sessionId: string
): Promise<{ success: true; status: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();

  // Retrieve the Stripe Checkout Session
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
  } catch (err) {
    console.error("[start/actions] Stripe session retrieval failed:", err);
    return { error: "Could not verify payment session." };
  }

  // Verify the session belongs to this user (prevent session_id theft)
  if (session.metadata?.user_id !== user.id) {
    console.error("[start/actions] User mismatch:", session.metadata?.user_id, "!==", user.id);
    return { error: "This payment session does not belong to your account." };
  }

  // Verify payment
  const subscription = session.subscription as Stripe.Subscription | null;

  if (
    session.payment_status !== "paid" &&
    !(subscription && subscription.status === "trialing")
  ) {
    return { error: "Payment has not been completed." };
  }

  if (!subscription) {
    return { error: "No subscription found on this session." };
  }

  // Map price ID to plan tier
  const firstItem = subscription.items.data[0];
  if (!firstItem) {
    return { error: "No line items found on subscription." };
  }
  const priceId = firstItem.price?.id ?? "";
  const planTier = priceId === process.env.STRIPE_FOUNDING_PRICE_ID
    ? "founding"
    : "standard";

  // Get org_id from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return { error: "No organization found for this user." };
  }

  // Upsert subscription record
  const subscriptionData = {
    org_id: profile.org_id,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: (session.customer as string) ?? "",
    plan_tier: planTier,
    student_quantity: firstItem.quantity ?? 0,
    status: subscription.status,
    current_period_start: new Date(firstItem.current_period_start * 1000).toISOString(),
    current_period_end: new Date(firstItem.current_period_end * 1000).toISOString(),
  };

  await admin
    .from("subscriptions")
    .upsert(subscriptionData, { onConflict: "stripe_subscription_id" });

  // Update org with Stripe customer ID and subscription tier
  await admin
    .from("organizations")
    .update({
      stripe_customer_id: session.customer as string,
      subscription_tier: planTier,
    })
    .eq("id", profile.org_id);

  // Advance onboarding step
  await admin
    .from("profiles")
    .update({ onboarding_step: ONBOARDING_STEP.PAID })
    .eq("id", user.id);

  return { success: true, status: subscription.status };
}
