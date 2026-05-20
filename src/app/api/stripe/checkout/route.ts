import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

function getTierPriceIds(): Record<string, string> {
  return {
    starter: process.env.STRIPE_STARTER_PRICE_ID ?? "",
    growth: process.env.STRIPE_GROWTH_PRICE_ID ?? "",
    scale: process.env.STRIPE_SCALE_PRICE_ID ?? "",
  };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tier, quantity, orgId } = (await req.json()) as {
      tier: "starter" | "growth" | "scale";
      quantity: number;
      orgId: string;
    };

    if (!tier || !quantity || !orgId) {
      return NextResponse.json(
        { error: "Missing required fields: tier, quantity, orgId" },
        { status: 400 }
      );
    }

    const priceId = getTierPriceIds()[tier];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
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
        trial_period_days: 14,
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
