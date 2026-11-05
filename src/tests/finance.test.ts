import { describe, expect, it } from 'vitest';
import {
  affordability, amortize, balanceTransfer, downPaymentPlan, emi, prepaymentChoices,
  prepaymentPlan, propertyProjection, rentVsBuy, variableRateLoan
} from '../lib/finance';

describe('loan mathematics', () => {
  it('handles zero-interest EMI', () => expect(emi(1_200_000, 0, 120)).toBe(10_000));

  it('matches an independently calculated EMI reference', () => {
    // ₹50 lakh, 8.5% nominal annual rate, 240 monthly payments.
    expect(emi(5_000_000, 8.5, 240)).toBeCloseTo(43_391.17, 1);
  });

  it('matches the published 15, 20, 25 and 30-year tenure comparison', () => {
    const principal = 5_000_000;
    const scenarios = [
      { months: 180, monthlyPayment: 49_237, totalInterest: 3_862_656 },
      { months: 240, monthlyPayment: 43_391, totalInterest: 5_413_879 },
      { months: 300, monthlyPayment: 40_261, totalInterest: 7_078_406 },
      { months: 360, monthlyPayment: 38_446, totalInterest: 8_840_443 }
    ];

    for (const scenario of scenarios) {
      const payment = emi(principal, 8.5, scenario.months);
      expect(Math.round(payment)).toBe(scenario.monthlyPayment);
      expect(Math.round(payment * scenario.months - principal)).toBe(scenario.totalInterest);
    }
  });

  it('amortises to approximately zero and reconciles cash flows', () => {
    const principal = 2_500_000; const payment = emi(principal, 7.75, 180);
    const rows = amortize(principal, 7.75, 180, payment);
    expect(rows.at(-1)?.balance).toBe(0);
    const interest = rows.reduce((s, row) => s + row.interest, 0);
    const principalPaid = rows.reduce((s, row) => s + row.principal, 0);
    const total = rows.reduce((s, row) => s + row.payment, 0);
    expect(principalPaid).toBeCloseTo(principal, 4);
    expect(total).toBeCloseTo(principalPaid + interest, 4);
  });

  it('supports one-time and recurring prepayment', () => {
    const base = { principal: 3_000_000, annualRate: 8, tenureMonths: 240, paidMonths: 24 };
    const noExtra = prepaymentPlan({ ...base, monthlyExtra: 0, lumpSum: 0, lumpMonth: 12 });
    const lump = prepaymentPlan({ ...base, monthlyExtra: 0, lumpSum: 300_000, lumpMonth: 12 });
    const recurring = prepaymentPlan({ ...base, monthlyExtra: 5_000, lumpSum: 0, lumpMonth: 12 });
    expect(lump.interestSaved).toBeGreaterThan(0);
    expect(recurring.interestSaved).toBeGreaterThan(0);
    expect(lump.accelerated.length).toBeLessThan(noExtra.accelerated.length);
  });

  it('caps a prepayment that exceeds remaining principal and fully repays', () => {
    const result = prepaymentPlan({ principal: 1_000_000, annualRate: 8, tenureMonths: 120, paidMonths: 0, monthlyExtra: 0, lumpSum: 2_000_000, lumpMonth: 1 });
    expect(result.accelerated).toHaveLength(1);
    expect(result.accelerated[0].balance).toBe(0);
  });

  it('shows shorter tenure has lower interest than reduced EMI', () => {
    const result = prepaymentChoices(4_000_000, 8.5, 180, 500_000);
    expect(result.shortenedMonths).toBeLessThan(180);
    expect(result.shortInterest).toBeLessThan(result.reducedInterest);
    expect(result.reducedEmi).toBeLessThan(result.oldEmi);
  });
});

describe('comparison engines', () => {
  it('balance transfer with zero fees captures interest savings', () => {
    const result = balanceTransfer(4_000_000, 9, 180, 8, 180, 0);
    expect(result.netSavings).toBeGreaterThan(0);
    expect(result.netSavings).toBeCloseTo(result.oldInterest - result.newInterest, 6);
  });

  it('can make a balance transfer financially unfavourable', () => {
    const result = balanceTransfer(1_000_000, 8, 24, 7.9, 24, 100_000);
    expect(result.netSavings).toBeLessThan(0);
  });

  it('compares fixed and changed floating rates', () => {
    const unchanged = variableRateLoan(3_000_000, 180, 8, [], 'emi');
    const increased = variableRateLoan(3_000_000, 180, 8, [{ month: 25, rate: 11 }], 'emi');
    const interest = (rows: typeof unchanged) => rows.reduce((s, row) => s + row.interest, 0);
    expect(interest(increased)).toBeGreaterThan(interest(unchanged));
    expect(increased).toHaveLength(180);
  });

  it('handles flat and negative property appreciation', () => {
    expect(propertyProjection(8_000_000, 0, 10, 5).futureValue).toBe(8_000_000);
    expect(propertyProjection(8_000_000, -2, 10, 5).futureValue).toBeLessThan(8_000_000);
  });

  it('keeps rent-vs-buy equivalent zero cash flows equal', () => {
    const result = rentVsBuy({ price: 0, downPercent: 0, loanRate: 0, loanYears: 20, rentMonthly: 0, rentIncrease: 0, appreciation: 0, maintenanceAnnual: 0, propertyTaxAnnual: 0, buyingCosts: 0, sellingPercent: 0, investmentReturn: 0, years: 5 });
    expect(result.homeownerNetWorth).toBe(0);
    expect(result.renterNetWorth).toBe(0);
    expect(result.difference).toBe(0);
  });

  it('handles a savings target with zero investment return', () => {
    const result = downPaymentPlan(5_000_000, 20, 100_000, 10_000, 0, 5, 0);
    expect(result.projected).toBe(700_000);
    expect(result.target).toBe(1_000_000);
    expect(result.neededMonthly).toBe(15_000);
  });

  it('calculates affordability without implying approval', () => {
    const result = affordability(100_000, 10_000, 10_000, 1_000_000, 8.5, 240, 40);
    expect(result.affordableEmi).toBe(20_000);
    expect(result.maxLoan).toBeGreaterThan(0);
  });
});

describe('validation', () => {
  it('rejects invalid and missing numeric input', () => {
    expect(() => emi(Number.NaN, 8, 120)).toThrow(/finite/);
    expect(() => emi(1_000_000, -1, 120)).toThrow(/cannot be negative/);
    expect(() => emi(1_000_000, 8, 0)).toThrow(/tenure/);
  });

  it('rejects negative amortisation', () => {
    expect(() => amortize(1_000_000, 12, 12, 1)).toThrow(/negative amortization/);
  });
});
