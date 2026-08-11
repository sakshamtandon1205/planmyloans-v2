/**
 * Compounds a lumpsum forward at an annual rate, converted to its
 * monthly-compounding equivalent. Shared by the Planner's chart/summary
 * figures and the strategy engine's interest-offset calculations.
 */
export function calculateMfFutureValue(lumpsum: number, annualReturnPercent: number, months: number): number {
  const monthlyRate = Math.pow(1 + annualReturnPercent / 100, 1 / 12) - 1;
  return lumpsum * Math.pow(1 + monthlyRate, months);
}
