export interface SwpInput {
  initialCorpus: number;
  monthlyWithdrawal: number;
  annualReturnPercent: number;
  tenureMonths: number;
}

export interface SwpRow {
  month: number;
  withdrawal: number;
  growth: number;
  balance: number;
}

export function simulateSwp(input: SwpInput): SwpRow[] {
  const { initialCorpus, monthlyWithdrawal, annualReturnPercent, tenureMonths } = input;
  const monthlyRate = annualReturnPercent / 12 / 100;

  const schedule: SwpRow[] = [];
  let balance = initialCorpus;

  for (let month = 1; month <= tenureMonths && balance > 0; month++) {
    const growth = balance * monthlyRate;
    balance = balance + growth - monthlyWithdrawal;
    balance = Math.max(balance, 0);

    schedule.push({ month, withdrawal: monthlyWithdrawal, growth, balance });
  }

  return schedule;
}

export function corpusDepletionMonth(input: SwpInput): number | null {
  const schedule = simulateSwp(input);
  const depletedRow = schedule.find((row) => row.balance === 0);
  return depletedRow ? depletedRow.month : null;
}
