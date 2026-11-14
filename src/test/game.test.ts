import { describe, expect, it } from "vitest";
import { MISSIONS, START, applyChoice, failedResource } from "@/lib/game";

describe("lunar base rules", () => {
  it("cleaning panels gives +45 energy and -25 safety", () => {
    expect(applyChoice(START, MISSIONS[0].choices[0])).toEqual({ energy: 80, food: 70, safety: 55 });
  });
  it("resources are clamped to 0-100", () => {
    expect(applyChoice({ energy: 90, food: 5, safety: 50 }, MISSIONS[0].choices[0]).energy).toBe(100);
    expect(applyChoice({ energy: 50, food: 5, safety: 50 }, MISSIONS[0].choices[1]).food).toBe(0);
  });
  it("a resource at 10% or less ends the mission", () => {
    expect(failedResource({ energy: 10, food: 50, safety: 50 })).toBe("energy");
    expect(failedResource({ energy: 11, food: 50, safety: 50 })).toBeNull();
  });
});
