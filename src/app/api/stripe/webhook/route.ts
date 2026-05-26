import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";

function getTierFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_FOUNDING_PRICE_ID) return "founding";
  if (priceId === process.env.STRIPE_PRICE_ID) return "standard";
  return "unknown";
}

const adminDb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.org_id;
        const userId = session.metadata?.user_id;
        const subscriptionId = session.subscription as string;

        if (!orgId || !userId || !subscriptionId) {
          console.error("Missing metadata on checkout session", session.id);
          break;
        }

        // Retrieve the full subscription to get plan details
        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);
        const item = subscription.items.data[0];
        if (!item) {
          console.error("No line items on subscription", subscriptionId);
          break;
        }
        const priceId = item.price.id;
        const tier = getTierFromPriceId(priceId);

        await adminDb.from("subscriptions").upsert(
          {
            org_id: orgId,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: session.customer as string,
            status: subscription.status,
            plan_tier: tier,
            student_quantity: item.quantity ?? 0,
            current_period_start: item.current_period_start
              ? new Date(item.current_period_start * 1000).toISOString()
              : null,
            current_period_end: item.current_period_end
              ? new Date(item.current_period_end * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_subscription_id" }
        );

        // Update org's stripe_customer_id if not already set
        await adminDb
          .from("organizations")
          .update({ stripe_customer_id: session.customer as string })
          .eq("id", orgId)
          .is("stripe_customer_id", null);

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const item = subscription.items.data[0];
        if (!item) {
          console.error("No line items on subscription.updated", subscription.id);
          break;
        }
        const priceId = item.price.id;
        const tier = getTierFromPriceId(priceId);

        await adminDb
          .from("subscriptions")
          .update({
            status: subscription.status,
            student_quantity: item.quantity ?? 0,
            current_period_start: item.current_period_start
              ? new Date(item.current_period_start * 1000).toISOString()
              : null,
            current_period_end: item.current_period_end
              ? new Date(item.current_period_end * 1000).toISOString()
              : null,
            plan_tier: tier,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await adminDb
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        // Find the org for this subscription and deactivate it
        const { data: sub } = await adminDb
          .from("subscriptions")
          .select("org_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (sub?.org_id) {
          await adminDb
            .from("organizations")
            .update({ is_active: false })
            .eq("id", sub.org_id);
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        // Try legacy field first, fall back to Dahlia API parent structure
        const subscriptionId =
          (invoice as any).subscription as string | null ??
          (invoice.parent?.type === "subscription_details"
            ? (invoice.parent as { subscription_details?: { subscription?: string } })
                ?.subscription_details?.subscription ?? null
            : null);

        if (subscriptionId) {
          await adminDb
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);
        }

        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
        break;
    }
  } catch (err) {
    console.error(`Error handling webhook event ${event.type}:`, err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
