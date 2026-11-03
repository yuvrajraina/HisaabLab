export type AmortizationRow = {
  month: number; payment: number; principal: number; interest: number; balance: number;
};

const finite = (value: number, name: string) => {
  if (!Number.isFinite(value)) throw new Error(`${name} must be a finite number.`);
  return value;
};

export function emi(principal: number, annualRate: number, months: number): number {
  finite(principal, 'Principal'); finite(annualRate, 'Rate'); finite(months, 'Months');
  if (principal < 0 || annualRate < 0 || months <= 0) throw new Error('Principal and rate cannot be negative, and tenure must be positive.');
  if (principal === 0) return 0;
  const r = annualRate / 1200;
  if (r === 0) return principal / months;
  return principal * r * (1 + r) ** months / ((1 + r) ** months - 1);
}

export function amortize(principal: number, annualRate: number, months: number, payment = emi(principal, annualRate, months)): AmortizationRow[] {
  finite(payment, 'Payment');
  if (payment <= 0 && principal > 0) throw new Error('Payment must be positive.');
  const r = annualRate / 1200;
  const rows: AmortizationRow[] = [];
  let balance = principal;
  for (let month = 1; month <= Math.ceil(months) && balance > 0.005; month++) {
    const interest = balance * r;
    if (payment <= interest && r > 0) throw new Error('Payment is too low and would cause negative amortization.');
    const actualPayment = Math.min(payment, balance + interest);
    const principalPaid = actualPayment - interest;
    balance = Math.max(0, balance - principalPaid);
    rows.push({ month, payment: actualPayment, principal: principalPaid, interest, balance });
  }
  return rows;
}

export function balanceAfterPayments(principal: number, annualRate: number, monthsPaid: number, payment: number): number {
  if (monthsPaid <= 0) return principal;
  const r = annualRate / 1200;
  if (r === 0) return Math.max(0, principal - payment * monthsPaid);
  return Math.max(0, principal * (1 + r) ** monthsPaid - payment * (((1 + r) ** monthsPaid - 1) / r));
}

export type PrepaymentInput = {
  principal: number; annualRate: number; tenureMonths: number; paidMonths: number;
  monthlyExtra: number; lumpSum: number; lumpMonth: number;
};

export function prepaymentPlan(input: PrepaymentInput) {
  const payment = emi(input.principal, input.annualRate, input.tenureMonths);
  const outstanding = balanceAfterPayments(input.principal, input.annualRate, input.paidMonths, payment);
  const baseline = amortize(outstanding, input.annualRate, Math.max(1, input.tenureMonths - input.paidMonths), payment);
  const r = input.annualRate / 1200;
  const accelerated: AmortizationRow[] = [];
  let balance = outstanding;
  for (let month = 1; month <= 1200 && balance > 0.005; month++) {
    const interest = balance * r;
    const lump = month === Math.max(1, input.lumpMonth) ? Math.min(Math.max(0, input.lumpSum), balance) : 0;
    balance -= lump;
    const scheduled = Math.min(payment + Math.max(0, input.monthlyExtra), balance + interest);
    const principalPaid = Math.max(0, scheduled - interest) + lump;
    balance = Math.max(0, balance - Math.max(0, scheduled - interest));
    accelerated.push({ month, payment: scheduled + lump, principal: principalPaid, interest, balance });
  }
  const sumInterest = (rows: AmortizationRow[]) => rows.reduce((sum, row) => sum + row.interest, 0);
  return {
    payment, outstanding, baseline, accelerated,
    baselineInterest: sumInterest(baseline), acceleratedInterest: sumInterest(accelerated),
    interestSaved: sumInterest(baseline) - sumInterest(accelerated),
    monthsSaved: baseline.length - accelerated.length
  };
}

export function prepaymentChoices(principal: number, annualRate: number, remainingMonths: number, lumpSum: number, fee = 0) {
  const oldEmi = emi(principal, annualRate, remainingMonths);
  const newPrincipal = Math.max(0, principal - lumpSum + fee);
  const reducedEmi = emi(newPrincipal, annualRate, remainingMonths);
  const shortened = newPrincipal === 0 ? [] : amortize(newPrincipal, annualRate, 1200, oldEmi);
  const reduced = newPrincipal === 0 ? [] : amortize(newPrincipal, annualRate, remainingMonths, reducedEmi);
  const baseInterest = amortize(principal, annualRate, remainingMonths, oldEmi).reduce((s, r) => s + r.interest, 0);
  const shortInterest = shortened.reduce((s, r) => s + r.interest, 0);
  const reducedInterest = reduced.reduce((s, r) => s + r.interest, 0);
  return { oldEmi, newPrincipal, reducedEmi, shortenedMonths: shortened.length, shortInterest, reducedInterest, baseInterest };
}

export function affordability(income: number, existingEmis: number, commitments: number, downPayment: number, rate: number, months: number, threshold: number) {
  const affordableEmi = Math.max(0, income * threshold / 100 - existingEmis - commitments);
  const unitEmi = emi(100000, rate, months);
  const maxLoan = unitEmi ? affordableEmi / unitEmi * 100000 : 0;
  return { affordableEmi, maxLoan, homeBudget: maxLoan + downPayment, ratio: income ? (affordableEmi + existingEmis + commitments) / income * 100 : 0 };
}

export function balanceTransfer(principal: number, oldRate: number, oldMonths: number, newRate: number, newMonths: number, fees: number) {
  const oldEmi = emi(principal, oldRate, oldMonths);
  const newEmi = emi(principal, newRate, newMonths);
  const oldInterest = oldEmi * oldMonths - principal;
  const newInterest = newEmi * newMonths - principal;
  const netSavings = oldInterest - newInterest - fees;
  const monthlySaving = oldEmi - newEmi;
  const breakEvenMonths = monthlySaving > 0 ? fees / monthlySaving : Infinity;
  return { oldEmi, newEmi, oldInterest, newInterest, netSavings, monthlySaving, breakEvenMonths };
}

export type RateChange = { month: number; rate: number };
export function variableRateLoan(principal: number, months: number, initialRate: number, changes: RateChange[], response: 'emi' | 'tenure' = 'emi') {
  let balance = principal;
  let rate = initialRate;
  let payment = emi(principal, rate, months);
  const rows: AmortizationRow[] = [];
  for (let month = 1; month <= 1200 && balance > 0.005; month++) {
    const change = changes.find((item) => item.month === month);
    if (change) {
      rate = change.rate;
      if (response === 'emi') payment = emi(balance, rate, Math.max(1, months - month + 1));
    }
    const interest = balance * rate / 1200;
    if (payment <= interest) throw new Error('The selected rate path causes negative amortization.');
    const actual = Math.min(payment, balance + interest);
    const principalPaid = actual - interest;
    balance = Math.max(0, balance - principalPaid);
    rows.push({ month, payment: actual, principal: principalPaid, interest, balance });
    if (response === 'emi' && month >= months) break;
  }
  return rows;
}

export function propertyProjection(currentValue: number, annualRate: number, years: number, inflationRate: number, annualCosts = 0, sellingCostPercent = 0) {
  const yearly = Array.from({ length: Math.floor(years) + 1 }, (_, year) => ({ year, value: currentValue * (1 + annualRate / 100) ** year }));
  const futureValue = currentValue * (1 + annualRate / 100) ** years;
  const inflationAdjusted = futureValue / (1 + inflationRate / 100) ** years;
  const holdingCosts = annualCosts * years;
  const sellingCosts = futureValue * sellingCostPercent / 100;
  return { yearly, futureValue, inflationAdjusted, growth: futureValue - currentValue, growthPercent: currentValue ? (futureValue / currentValue - 1) * 100 : 0, holdingCosts, sellingCosts };
}

export function futureValueWithContributions(initial: number, monthly: number, annualReturn: number, months: number) {
  const r = annualReturn / 1200;
  if (r === 0) return initial + monthly * months;
  return initial * (1 + r) ** months + monthly * (((1 + r) ** months - 1) / r);
}

export function downPaymentPlan(propertyPrice: number, downPercent: number, savings: number, monthly: number, annualReturn: number, years: number, propertyInflation: number) {
  const months = Math.round(years * 12);
  const futureProperty = propertyPrice * (1 + propertyInflation / 100) ** years;
  const target = futureProperty * downPercent / 100;
  const projected = futureValueWithContributions(savings, monthly, annualReturn, months);
  const r = annualReturn / 1200;
  const initialFuture = savings * (1 + r) ** months;
  const annuityFactor = r === 0 ? months : ((1 + r) ** months - 1) / r;
  const neededMonthly = Math.max(0, (target - initialFuture) / Math.max(1, annuityFactor));
  let timeMonths = 0;
  while (timeMonths < 1200 && futureValueWithContributions(savings, monthly, annualReturn, timeMonths) < propertyPrice * (1 + propertyInflation / 1200) ** timeMonths * downPercent / 100) timeMonths++;
  return { futureProperty, target, projected, gap: projected - target, neededMonthly, timeMonths: timeMonths >= 1200 ? Infinity : timeMonths };
}

export function trueOwnershipCost(input: { price: number; downPayment: number; rate: number; months: number; stampPercent: number; registration: number; brokeragePercent: number; maintenanceMonthly: number; taxAnnual: number; insuranceAnnual: number; renovation: number; escalation: number; years: number; appreciation: number; }) {
  const loan = Math.max(0, input.price - input.downPayment);
  const payment = emi(loan, input.rate, input.months);
  const schedule = amortize(loan, input.rate, input.months, payment);
  const periodMonths = Math.min(Math.round(input.years * 12), schedule.length);
  const periodRows = schedule.slice(0, periodMonths);
  const interestPaid = periodRows.reduce((s, r) => s + r.interest, 0);
  const principalPaid = periodRows.reduce((s, r) => s + r.principal, 0);
  const upfront = input.downPayment + input.price * (input.stampPercent + input.brokeragePercent) / 100 + input.registration + input.renovation;
  let recurring = 0;
  for (let y = 0; y < input.years; y++) recurring += (input.maintenanceMonthly * 12 + input.taxAnnual + input.insuranceAnnual) * (1 + input.escalation / 100) ** y;
  const remainingBalance = schedule[Math.max(0, periodMonths - 1)]?.balance ?? 0;
  const propertyValue = input.price * (1 + input.appreciation / 100) ** input.years;
  return { loan, payment, schedule, upfront, recurring, interestPaid, principalPaid, totalCashOutflow: upfront + periodRows.reduce((s, r) => s + r.payment, 0) + recurring, remainingBalance, propertyValue, equity: propertyValue - remainingBalance };
}

export function rentVsBuy(input: { price: number; downPercent: number; loanRate: number; loanYears: number; rentMonthly: number; rentIncrease: number; appreciation: number; maintenanceAnnual: number; propertyTaxAnnual: number; buyingCosts: number; sellingPercent: number; investmentReturn: number; years: number; }) {
  const down = input.price * input.downPercent / 100;
  const loan = input.price - down;
  const payment = emi(loan, input.loanRate, input.loanYears * 12);
  const schedule = amortize(loan, input.loanRate, input.loanYears * 12, payment);
  let renterInvestments = down + input.buyingCosts;
  let rent = input.rentMonthly;
  let ownershipOutflow = down + input.buyingCosts;
  let rentingOutflow = 0;
  const yearly: Array<{ year: number; buy: number; rent: number }> = [];
  const invRate = input.investmentReturn / 1200;
  for (let month = 1; month <= input.years * 12; month++) {
    if (month > 1 && (month - 1) % 12 === 0) rent *= 1 + input.rentIncrease / 100;
    const maintenance = (input.maintenanceAnnual + input.propertyTaxAnnual) / 12;
    const ownerCost = (schedule[month - 1]?.payment ?? 0) + maintenance;
    ownershipOutflow += ownerCost;
    rentingOutflow += rent;
    renterInvestments *= 1 + invRate;
    renterInvestments += Math.max(0, ownerCost - rent);
    if (rent > ownerCost) renterInvestments = Math.max(0, renterInvestments - (rent - ownerCost));
    if (month % 12 === 0) {
      const propertyValue = input.price * (1 + input.appreciation / 100) ** (month / 12);
      const balance = schedule[month - 1]?.balance ?? 0;
      const selling = propertyValue * input.sellingPercent / 100;
      yearly.push({ year: month / 12, buy: propertyValue - balance - selling, rent: renterInvestments });
    }
  }
  const last = yearly.at(-1) ?? { buy: 0, rent: renterInvestments, year: 0 };
  const finalBalance = schedule[Math.min(schedule.length, input.years * 12) - 1]?.balance ?? 0;
  return { payment, down, loan, ownershipOutflow, rentingOutflow, homeownerNetWorth: last.buy, renterNetWorth: last.rent, difference: last.buy - last.rent, finalBalance, yearly };
}
