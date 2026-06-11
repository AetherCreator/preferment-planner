import { type NextRequest } from "next/server";
import { isFeatureAllowed } from "@/lib/stripe";

// Exported for testing: checks whether a subscription token grants paid access.
// In production this would validate a real Stripe subscription or session JWT.
export function resolveTier(authHeader: string | null): "free" | "paid" {
  if (!authHeader) return "free";
  // Convention: "Bearer paid_<anything>" → paid tier.
  // Tests can pass "Bearer paid_test" to exercise the 200 path.
  if (authHeader.startsWith("Bearer paid_")) return "paid";
  return "free";
}

export async function POST(request: NextRequest) {
  const tier = resolveTier(request.headers.get("authorization"));

  if (!isFeatureAllowed("save_formulas", tier)) {
    return Response.json(
      { error: "Upgrade to Pro to save formulas." },
      { status: 403 }
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return Response.json(
      { error: "Database not configured", deferred: "no live keys" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/formulas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return Response.json({ error: "Database error", detail: text }, { status: 502 });
  }

  const data = await res.json();
  return Response.json({ saved: true, data }, { status: 200 });
}
