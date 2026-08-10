import { describe, expect, it } from "vitest";
import { constructionStageImageFor } from "./stage-images";

describe("construction stage images", () => {
  it.each([
    ["foundation--structure", "/images/construction-stages/foundation-structure.jpg"],
    ["walls--masonry", "/images/construction-stages/walls-masonry.jpg"],
    ["bathroom--plumbing", "/images/construction-stages/bathroom-plumbing.jpg"],
    ["electrical--wiring", "/images/construction-stages/electrical-wiring.jpg"],
    ["plastering--waterproofing", "/images/construction-stages/plastering-waterproofing.jpg"],
    ["flooring--tiling", "/images/construction-stages/flooring-tiling.jpg"],
    ["false-ceiling", "/images/construction-stages/false-ceiling.jpg"],
    ["paint--finishing", "/images/construction-stages/paint-finishing.jpg"],
    ["doors-windows-railings--glass", "/images/construction-stages/doors-windows-railings-glass.jpg"],
    ["finishing", "/images/construction-stages/finishing.jpg"],
  ])("maps %s to its matching asset", (slug, image) => {
    expect(constructionStageImageFor(slug)).toBe(image);
  });

  it("does not assign an unrelated image to an unknown stage", () => {
    expect(constructionStageImageFor("unknown-stage")).toBeNull();
  });
});
