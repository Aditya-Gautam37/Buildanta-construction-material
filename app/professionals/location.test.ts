import { describe, expect, it } from "vitest";
import { formatLocation, formatLocationOrServiceArea, SERVICE_AREA } from "./location";

describe("formatLocation", () => {
  it("expands a run-together state, the exact form stored today", () => {
    expect(formatLocation("kanpur uttarpradesh")).toBe("Kanpur, Uttar Pradesh");
  });

  it.each([
    ["kanpur uttar pradesh", "Kanpur, Uttar Pradesh"],
    ["Kanpur Uttar Pradesh", "Kanpur, Uttar Pradesh"],
    ["kanpur, uttar pradesh", "Kanpur, Uttar Pradesh"],
    ["KANPUR UTTARPRADESH", "Kanpur, Uttar Pradesh"],
    ["kanpur,uttarpradesh", "Kanpur, Uttar Pradesh"],
    ["kanpur up", "Kanpur, Uttar Pradesh"],
  ])("formats %p as %p", (input, expected) => {
    expect(formatLocation(input)).toBe(expected);
  });

  it("leaves a bare city title-cased, without inventing a state", () => {
    expect(formatLocation("kanpur")).toBe("Kanpur");
  });

  it("keeps multi-word place names readable", () => {
    expect(formatLocation("kanpur nagar uttarpradesh")).toBe("Kanpur Nagar, Uttar Pradesh");
  });

  it("handles hyphenated names without dropping inner capitals", () => {
    expect(formatLocation("kanpur-nagar")).toBe("Kanpur-Nagar");
  });

  it("does not capitalise joining words mid-phrase", () => {
    expect(formatLocation("isle of wight")).toBe("Isle of Wight");
  });

  it("collapses stray whitespace", () => {
    expect(formatLocation("  kanpur   uttarpradesh  ")).toBe("Kanpur, Uttar Pradesh");
  });

  it("passes through an unknown city and state unchanged in shape", () => {
    expect(formatLocation("lucknow")).toBe("Lucknow");
  });

  it.each([null, undefined, "", "   "])("returns null for %p so the caller decides", (input) => {
    expect(formatLocation(input)).toBeNull();
  });
});

describe("formatLocationOrServiceArea", () => {
  it("falls back to the launch service area when nothing is stored", () => {
    expect(formatLocationOrServiceArea("")).toBe(SERVICE_AREA);
    expect(formatLocationOrServiceArea(null)).toBe("Kanpur, Uttar Pradesh");
  });

  it("still formats a real value", () => {
    expect(formatLocationOrServiceArea("kanpur uttarpradesh")).toBe("Kanpur, Uttar Pradesh");
  });
});
