import { type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return Response.json(
      { error: "Stripe not configured", deferred: "no live keys" },
      { status: 503 }
    );
  }

  // Dynamic import so the module only loads when the key is present
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(stripeKey);

  const origin = request.headers.get("origin") ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Preferment Planner — Pro" },
          unit_amount: 600,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/?checkout=cancel`,
  });

  return Response.json({ url: session.url });
}
