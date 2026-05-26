import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quantity, orgId, foundingPartner } = (await req.json()) as {
      quantity: number;
      orgId: string;
      foundingPartner?: boolean;
    };

    if (!quantity || !orgId) {
      return NextResponse.json(
        { error: "Missing required fields: quantity, orgId" },
        { status: 400 }
      );
    }

    // Pick the right price: founding partner ($4.99 flat) or default (volume tiers)
    const priceId = foundingPartner
      ? process.env.STRIPE_FOUNDING_PRICE_ID
      : process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      console.error("[stripe/checkout] Missing price ID env var");
      return NextResponse.json(
        { error: "Payment not configured. Contact support." },
        { status: 500 }
      );
    }

    // Verify the authenticated user is the org_admin of the specified org
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, org_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (profile.org_id !== orgId || profile.role !== "org_admin") {
      return NextResponse.json(
        { error: "Not authorized for this organization" },
        { status: 403 }
      );
    }

    const origin = req.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity }],
      success_url: `${origin}/start?step=5&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/start?step=4`,
      metadata: { org_id: orgId, user_id: user.id },
      subscription_data: {
        metadata: { org_id: orgId },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
