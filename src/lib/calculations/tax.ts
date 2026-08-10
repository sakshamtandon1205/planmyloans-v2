export interface TaxSlab {
  upTo: number | null;
  ratePercent: number;
}

export const NEW_REGIME_SLABS_FY2024_25: TaxSlab[] = [
  { upTo: 300000, ratePercent: 0 },
  { upTo: 700000, ratePercent: 5 },
  { upTo: 1000000, ratePercent: 10 },
  { upTo: 1200000, ratePercent: 15 },
  { upTo: 1500000, ratePercent: 20 },
  { upTo: null, ratePercent: 30 },
];

export function calculateSlabTax(taxableIncome: number, slabs: TaxSlab[]): number {
  let tax = 0;
  let lowerBound = 0;

  for (const slab of slabs) {
    const upperBound = slab.upTo ?? Infinity;
    if (taxableIncome <= lowerBound) break;

    const taxableInSlab = Math.min(taxableIncome, upperBound) - lowerBound;
    tax += taxableInSlab * (slab.ratePercent / 100);
    lowerBound = upperBound;
  }

  return tax;
}
