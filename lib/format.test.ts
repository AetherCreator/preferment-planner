import { describe, it, expect } from "vitest";
import { formatTimelineStep } from "./format";

describe("formatTimelineStep", () => {
  it("includes action in output", () => {
    const result = formatTimelineStep("2026-06-01T08:00:00Z", "Bake", 0);
    expect(result).toContain("Bake");
  });

  it("omits duration string when durationMin is 0", () => {
    const result = formatTimelineStep("2026-06-01T08:00:00Z", "Bake", 0);
    expect(result).not.toMatch(/\d+[hm]/);
  });

  it("includes hours when durationMin >= 60", () => {
    const result = formatTimelineStep("2026-06-01T00:00:00Z", "Ferment", 120);
    expect(result).toContain("2h");
  });

  it("includes minutes when durationMin < 60", () => {
    const result = formatTimelineStep("2026-06-01T00:00:00Z", "Mix dough", 30);
    expect(result).toContain("30m");
  });

  it("includes both hours and minutes for non-round durations", () => {
    const result = formatTimelineStep("2026-06-01T00:00:00Z", "Rest", 90);
    expect(result).toContain("1h");
    expect(result).toContain("30m");
  });
});
