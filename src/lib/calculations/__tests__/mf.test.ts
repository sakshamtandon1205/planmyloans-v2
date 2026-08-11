import { describe, expect, it } from "vitest";
import { calculateMfFutureValue } from "../mf";

describe("calculateMfFutureValue", () => {
  it("returns the lumpsum unchanged over zero months", () => {
    expect(calculateMfFutureValue(2000000, 12, 0)).toBeCloseTo(2000000, 5);
  });

  it("returns the lumpsum unchanged at 0% return", () => {
    expect(calculateMfFutureValue(2000000, 0, 120)).toBeCloseTo(2000000, 5);
  });

  it("compounds monthly at the annual-rate-equivalent monthly rate", () => {
    const fv = calculateMfFutureValue(1000000, 12, 12);
    // One year at a 12% annual rate (monthly-compounded) should land at ~12% growth.
    expect(fv).toBeCloseTo(1120000, -2);
    expect(fv).toBeGreaterThan(1000000);
  });

  it("matches the documented worked example: ₹20L @ 12% over 20 years", () => {
    const fv = calculateMfFutureValue(2000000, 12, 240);
    const monthlyRate = Math.pow(1.12, 1 / 12) - 1;
    expect(fv).toBeCloseTo(2000000 * Math.pow(1 + monthlyRate, 240), 3);
  });
});
