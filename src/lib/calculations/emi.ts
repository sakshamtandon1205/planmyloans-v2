export interface EmiInput {
  principal: number;
  annualRatePercent: number;
  tenureMonths: number;
}

export interface AmortizationRow {
  month: number;
  emi: number;
  interest: number;
  principalPaid: number;
  balance: number;
}

export function calculateEmi({ principal, annualRatePercent, tenureMonths }: EmiInput): number {
  const monthlyRate = annualRatePercent / 12 / 100;

  if (monthlyRate === 0) {
    return principal / tenureMonths;
  }

  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function generateAmortizationSchedule(input: EmiInput): AmortizationRow[] {
  const { principal, annualRatePercent, tenureMonths } = input;
  const monthlyRate = annualRatePercent / 12 / 100;
  const emi = calculateEmi(input);

  const schedule: AmortizationRow[] = [];
  let balance = principal;

  for (let month = 1; month <= tenureMonths; month++) {
    const interest = balance * monthlyRate;
    const principalPaid = emi - interest;
    balance = Math.max(balance - principalPaid, 0);

    schedule.push({ month, emi, interest, principalPaid, balance });
  }

  return schedule;
}
