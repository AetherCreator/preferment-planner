type Feature = "save_formulas" | "export_pdf" | "unlimited_plans";
type Tier = "free" | "paid";

const PAID_FEATURES: Set<Feature> = new Set([
  "save_formulas",
  "export_pdf",
  "unlimited_plans",
]);

export function isFeatureAllowed(feature: Feature | string, tier: Tier | string): boolean {
  if (tier === "paid") return true;
  return !PAID_FEATURES.has(feature as Feature);
}
