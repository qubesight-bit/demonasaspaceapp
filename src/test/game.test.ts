import { describe, expect, it } from "vitest";
import { MISSIONS, START, applyChoice, failedResource, type Resources } from "@/lib/game";

describe("lunar base rules", () => {
  const routes: {
    decisions: [string, string, string, string];
    resources: Resources;
    failed: "energy" | "safety" | null;
  }[] = [
    { decisions: ["clean", "heat", "shield", "power"], resources: { energy: 70, food: 95, safety: 50 }, failed: null },
    { decisions: ["clean", "heat", "shield", "shelter"], resources: { energy: 40, food: 80, safety: 100 }, failed: null },
    { decisions: ["clean", "heat", "bunker", "power"], resources: { energy: 90, food: 75, safety: 20 }, failed: null },
    { decisions: ["clean", "heat", "bunker", "shelter"], resources: { energy: 60, food: 60, safety: 80 }, failed: null },
    { decisions: ["clean", "cover", "shield", "power"], resources: { energy: 90, food: 90, safety: 35 }, failed: null },
    { decisions: ["clean", "cover", "shield", "shelter"], resources: { energy: 60, food: 75, safety: 95 }, failed: null },
    { decisions: ["clean", "cover", "bunker", "power"], resources: { energy: 100, food: 70, safety: 5 }, failed: "safety" },
    { decisions: ["clean", "cover", "bunker", "shelter"], resources: { energy: 80, food: 55, safety: 65 }, failed: null },
    // Both fourth choices are unreachable after defeat in mission 3.
    { decisions: ["save", "heat", "shield", "power"], resources: { energy: 0, food: 65, safety: 100 }, failed: "energy" },
    { decisions: ["save", "heat", "shield", "shelter"], resources: { energy: 0, food: 65, safety: 100 }, failed: "energy" },
    { decisions: ["save", "heat", "bunker", "power"], resources: { energy: 45, food: 45, safety: 45 }, failed: null },
    { decisions: ["save", "heat", "bunker", "shelter"], resources: { energy: 15, food: 30, safety: 100 }, failed: null },
    { decisions: ["save", "cover", "shield", "power"], resources: { energy: 45, food: 60, safety: 60 }, failed: null },
    { decisions: ["save", "cover", "shield", "shelter"], resources: { energy: 15, food: 45, safety: 100 }, failed: null },
    { decisions: ["save", "cover", "bunker", "power"], resources: { energy: 65, food: 40, safety: 30 }, failed: null },
    { decisions: ["save", "cover", "bunker", "shelter"], resources: { energy: 35, food: 25, safety: 90 }, failed: null },
  ];

  it("covers all 16 combinations of the four missions", () => {
    expect(MISSIONS).toHaveLength(4);
    expect(new Set(routes.map(({ decisions }) => decisions.join("/"))).size).toBe(16);
  });

  it.each(routes)(
    "$decisions ends with expected resources and failure $failed",
    ({ decisions, resources, failed }) => {
      let current = { ...START };
      let played = 0;
      for (const [index, id] of decisions.entries()) {
        if (failedResource(current)) break;
        const choice = MISSIONS[index]!.choices.find((candidate) => candidate.id === id);
        expect(choice).toBeDefined();
        current = applyChoice(current, choice!);
        played++;
      }
      expect(current).toEqual(resources);
      expect(failedResource(current)).toBe(failed);
      expect(played).toBe(failed === "energy" ? 3 : 4);
    },
  );

  it("solar choices apply the specified effects to real resources", () => {
    expect(MISSIONS[3]!.choices.map((choice) => choice.effects)).toEqual([
      { energy: 30, safety: -35 }, { safety: 25, food: -15 },
    ]);
    expect(applyChoice({ energy: 40, food: 60, safety: 50 }, MISSIONS[3]!.choices[0])).toEqual({ energy: 70, food: 60, safety: 15 });
    expect(applyChoice({ energy: 40, food: 60, safety: 50 }, MISSIONS[3]!.choices[1])).toEqual({ energy: 40, food: 45, safety: 75 });
  });

  it("cleaning panels gives +45 energy and -25 safety", () => {
    expect(applyChoice(START, MISSIONS[0]!.choices[0])).toEqual({
      energy: 80,
      food: 70,
      safety: 55,
    });
  });
  it("resources are clamped to 0-100", () => {
    expect(applyChoice({ energy: 90, food: 5, safety: 50 }, MISSIONS[0]!.choices[0]).energy).toBe(
      100,
    );
    expect(applyChoice({ energy: 50, food: 5, safety: 50 }, MISSIONS[0]!.choices[1]).food).toBe(0);
  });
  it("a resource at 10% or less ends the mission", () => {
    expect(failedResource({ energy: 10, food: 50, safety: 50 })).toBe("energy");
    expect(failedResource({ energy: 11, food: 50, safety: 50 })).toBeNull();
  });
});
