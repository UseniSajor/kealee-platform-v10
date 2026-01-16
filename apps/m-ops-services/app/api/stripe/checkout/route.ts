import { NextResponse } from "next/server";
import Stripe from "stripe";

type PackageKey = "A" | "B" | "C" | "D";
type BillingCycle = "monthly" | "annual";

const PACKAGE_MONTHLY: Record<PackageKey, number> = {
  A: 1750,
  B: 3750,
  C: 9500,
  D: 16500,
};

function annualFromMonthly(monthly: number) {
  return Math.round(monthly * 12 * 0.85);
}

export async function POST(req: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY is not set" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(secretKey, { apiVersion: "2024-12-18.acacia" });

    const body = (await req.json()) as {
      packageKey: PackageKey;
      billingCycle: BillingCycle;
      company?: Record<string, unknown>;
      primaryContact?: {
        name?: string;
        email?: string;
        phone?: string;
        role?: string;
      };
    };

    const packageKey = body.packageKey ?? "B";
    const billingCycle = body.billingCycle ?? "monthly";

    const monthly = PACKAGE_MONTHLY[packageKey] ?? PACKAGE_MONTHLY.B;
    const unitAmount =
      billingCycle === "annual" ? annualFromMonthly(monthly) : monthly;

    const origin = req.headers.get("origin") || "http://localhost:3005";
    const successUrl = `${origin}/signup?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/signup?checkout=canceled`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: body?.primaryContact?.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: unitAmount * 100,
            recurring:
              billingCycle === "annual"
                ? { interval: "year" }
                : { interval: "month" },
            product_data: {
              name: `Kealee Ops Services - Package ${packageKey} (GC)`,
              description:
                billingCycle === "annual"
                  ? "Annual billing (15% savings) + 14-day free trial"
                  : "Monthly billing + 14-day free trial",
            },
          },
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          packageKey,
          billingCycle,
          companyName: String(body?.company?.name ?? ""),
          companyType: String(body?.company?.type ?? ""),
          contactName: body?.primaryContact?.name ?? "",
          contactRole: body?.primaryContact?.role ?? "",
          contactPhone: body?.primaryContact?.phone ?? "",
        },
      },
      metadata: {
        packageKey,
        billingCycle,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to create checkout session";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

