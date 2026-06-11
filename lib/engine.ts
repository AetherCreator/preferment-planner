export interface BakeStep {
  iso: string;
  action: string;
  durationMin: number;
}

interface PrefermentType {
  name: string;
  inoculationPct: number; // % of total flour
  baseBuildMinutes: number; // total build time at 68°F baseline
  steps: { action: string; fraction: number }[]; // fraction of total build time
}

const PREFERMENTS: Record<string, PrefermentType> = {
  poolish: {
    name: "Poolish",
    inoculationPct: 30,
    baseBuildMinutes: 960, // 16h
    steps: [
      { action: "Mix poolish (equal parts flour + water + tiny yeast)", fraction: 0.05 },
      { action: "Ferment poolish at room temperature", fraction: 0.90 },
      { action: "Mix final dough with poolish + remaining ingredients", fraction: 0.05 },
    ],
  },
  biga: {
    name: "Biga",
    inoculationPct: 40,
    baseBuildMinutes: 1200, // 20h
    steps: [
      { action: "Mix stiff biga (flour + small water + small yeast)", fraction: 0.04 },
      { action: "Cold-retard biga in refrigerator", fraction: 0.88 },
      { action: "Temper biga to room temperature", fraction: 0.04 },
      { action: "Mix final dough incorporating biga", fraction: 0.04 },
    ],
  },
  levain: {
    name: "Levain (sourdough)",
    inoculationPct: 20,
    baseBuildMinutes: 480, // 8h
    steps: [
      { action: "Feed starter to build levain (flour + water + starter)", fraction: 0.05 },
      { action: "Peak levain fermentation at room temperature", fraction: 0.80 },
      { action: "Mix autolyse (flour + water, no levain)", fraction: 0.05 },
      { action: "Mix final dough: autolyse + levain + salt", fraction: 0.10 },
    ],
  },
  "old-dough": {
    name: "Pâte Fermentée (old dough)",
    inoculationPct: 25,
    baseBuildMinutes: 720, // 12h
    steps: [
      { action: "Mix old-dough preferment (flour + water + yeast + salt)", fraction: 0.06 },
      { action: "Bulk ferment old dough", fraction: 0.87 },
      { action: "Incorporate old dough into final mix", fraction: 0.07 },
    ],
  },
  sponge: {
    name: "Sponge",
    inoculationPct: 50,
    baseBuildMinutes: 240, // 4h
    steps: [
      { action: "Mix sponge (50% flour + water + yeast)", fraction: 0.08 },
      { action: "Ferment sponge until doubled and domed", fraction: 0.84 },
      { action: "Mix final dough (sponge + remaining flour/ingredients)", fraction: 0.08 },
    ],
  },
  "soaker": {
    name: "Soaker (whole grain)",
    inoculationPct: 30,
    baseBuildMinutes: 600, // 10h
    steps: [
      { action: "Mix soaker: whole grain flour + warm water (no yeast)", fraction: 0.05 },
      { action: "Hydrate soaker overnight", fraction: 0.87 },
      { action: "Mix final dough: soaker + bread flour + levain + salt", fraction: 0.08 },
    ],
  },
  "tangzhong": {
    name: "Tangzhong (roux)",
    inoculationPct: 10,
    baseBuildMinutes: 180, // 3h
    steps: [
      { action: "Cook tangzhong roux (5:1 water:flour to 65°C)", fraction: 0.10 },
      { action: "Cool tangzhong to room temperature", fraction: 0.30 },
      { action: "Mix final enriched dough with tangzhong", fraction: 0.10 },
      { action: "Bulk ferment enriched dough", fraction: 0.40 },
      { action: "Shape and proof loaves", fraction: 0.10 },
    ],
  },
  "autolyse": {
    name: "Autolyse",
    inoculationPct: 100,
    baseBuildMinutes: 60,
    steps: [
      { action: "Mix flour + water only (no salt, no yeast); rest", fraction: 0.60 },
      { action: "Add levain/yeast + salt; develop dough", fraction: 0.40 },
    ],
  },
  "yeast-water": {
    name: "Yeast Water",
    inoculationPct: 35,
    baseBuildMinutes: 2880, // 48h
    steps: [
      { action: "Prepare yeast water (fruit + water, ferment 48h)", fraction: 0.93 },
      { action: "Mix levain with yeast water + flour", fraction: 0.03 },
      { action: "Peak yeast-water levain; mix final dough", fraction: 0.04 },
    ],
  },
};

function selectPreferment(flavorProfile: string, flourType: string): PrefermentType {
  const flavor = flavorProfile.toLowerCase();
  const flour = flourType.toLowerCase();

  if (flour.includes("whole") || flour.includes("rye") || flour.includes("spelt")) {
    return PREFERMENTS["soaker"];
  }
  if (flavor.includes("sour") || flavor.includes("tangy") || flour.includes("sourdough")) {
    return PREFERMENTS["levain"];
  }
  if (flavor.includes("mild") && flour.includes("bread")) {
    return PREFERMENTS["poolish"];
  }
  if (flavor.includes("mild") && flour.includes("all-purpose")) {
    return PREFERMENTS["sponge"];
  }
  if (flavor.includes("complex") || flavor.includes("deep")) {
    return PREFERMENTS["biga"];
  }
  if (flavor.includes("rich") || flour.includes("enriched") || flour.includes("brioche")) {
    return PREFERMENTS["tangzhong"];
  }
  if (flavor.includes("quick") || flavor.includes("fast")) {
    return PREFERMENTS["autolyse"];
  }
  if (flavor.includes("old") || flavor.includes("retard")) {
    return PREFERMENTS["old-dough"];
  }
  // default
  return PREFERMENTS["poolish"];
}

// Q10 temperature compensation: fermentation rate roughly doubles per 10°C
// We use a simpler linear model: baseline 68°F; each 1°F above baseline reduces time by ~0.8%
function temperatureCompensate(baseBuildMinutes: number, roomTempF: number): number {
  const baselineF = 68;
  const compensationPerDegree = 0.008; // 0.8% per °F
  const factor = 1 - compensationPerDegree * (roomTempF - baselineF);
  const clamped = Math.max(0.4, Math.min(2.0, factor));
  return Math.round(baseBuildMinutes * clamped);
}

export function planBake(
  targetBakeISO: string,
  roomTempF: number,
  flavorProfile: string,
  flourType: string
): BakeStep[] {
  const targetMs = new Date(targetBakeISO).getTime();
  const preferment = selectPreferment(flavorProfile, flourType);
  const totalBuildMinutes = temperatureCompensate(preferment.baseBuildMinutes, roomTempF);

  const steps: BakeStep[] = [];
  let cursor = targetMs;

  // Walk backwards: last step is the bake itself, then each preferment step in reverse
  const bakeStep: BakeStep = {
    iso: targetBakeISO,
    action: "Bake",
    durationMin: 0,
  };

  // Assign durations to each step (proportional fractions of total)
  const stepDurations = preferment.steps.map((s) =>
    Math.max(5, Math.round(s.fraction * totalBuildMinutes))
  );

  // Build from bake time backwards
  const scheduledSteps: BakeStep[] = [];

  // The last scheduled step before bake ends exactly at targetMs
  for (let i = stepDurations.length - 1; i >= 0; i--) {
    const duration = stepDurations[i];
    cursor -= duration * 60 * 1000;
    scheduledSteps.unshift({
      iso: new Date(cursor).toISOString(),
      action: preferment.steps[i].action,
      durationMin: duration,
    });
  }

  scheduledSteps.push(bakeStep);
  return scheduledSteps;
}
