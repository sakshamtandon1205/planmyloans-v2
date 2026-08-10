/** ₹1,23,45,678 style grouping (Indian digit grouping), rounded to the nearest rupee. */
export function formatINR(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "–";
  const neg = n < 0;
  const abs = Math.abs(Math.round(n));
  const s = abs.toString();
  let last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  if (rest !== "") last3 = "," + last3;
  rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return (neg ? "-" : "") + "₹" + rest + last3;
}

/** Compact Cr/L display, e.g. 1.40 Cr or 20.00 L. */
export function formatLakh(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "–";
  const cr = n / 10000000;
  if (Math.abs(cr) >= 1) return cr.toFixed(2) + " Cr";
  return (n / 100000).toFixed(2) + " L";
}
