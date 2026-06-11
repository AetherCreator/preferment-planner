import { describe, it, expect } from "vitest";
import { planBake } from "./engine";

describe("planBake", () => {
  const TARGET = "2026-06-01T08:00:00Z";

  it("final step iso equals targetBakeISO", () => {
    const steps = planBake(TARGET, 72, "mild", "bread");
    const last = steps[steps.length - 1];
    expect(last.iso).toBe(TARGET);
  });

  it("first step iso is before targetBakeISO", () => {
    const steps = planBake(TARGET, 72, "mild", "bread");
    const first = new Date(steps[0].iso).getTime();
    const target = new Date(TARGET).getTime();
    expect(first).toBeLessThan(target);
  });

  it("total build duration at 78°F < total build duration at 65°F", () => {
    const stepsWarm = planBake(TARGET, 78, "mild", "bread");
    const stepsCool = planBake(TARGET, 65, "mild", "bread");

    const targetMs = new Date(TARGET).getTime();

    // Total build duration = targetTime - firstStepTime
    const durationWarm = targetMs - new Date(stepsWarm[0].iso).getTime();
    const durationCool = targetMs - new Date(stepsCool[0].iso).getTime();

    expect(durationWarm).toBeLessThan(durationCool);
  });

  it("returns array of steps with iso, action, durationMin fields", () => {
    const steps = planBake(TARGET, 72, "mild", "bread");
    expect(steps.length).toBeGreaterThan(0);
    for (const step of steps) {
      expect(typeof step.iso).toBe("string");
      expect(typeof step.action).toBe("string");
      expect(typeof step.durationMin).toBe("number");
    }
  });

  it("steps are in chronological order", () => {
    const steps = planBake(TARGET, 72, "sour", "whole wheat");
    for (let i = 1; i < steps.length; i++) {
      const prev = new Date(steps[i - 1].iso).getTime();
      const curr = new Date(steps[i].iso).getTime();
      expect(prev).toBeLessThanOrEqual(curr);
    }
  });
});
