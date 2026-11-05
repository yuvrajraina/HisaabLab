---
title: "Home Loan EMI Formula: How Interest and Amortisation Work"
seoTitle: "Home Loan EMI Formula & Amortisation Guide"
description: "Understand the home loan EMI formula, reducing-balance interest and amortisation schedule with an Indian-format worked example."
published: 2026-11-05
updated: 2026-11-05
readingMinutes: 10
relatedCalculators:
  - home-loan-emi
  - home-affordability
  - home-loan-prepayment
---

A home loan EMI is designed to repay principal and interest through a series of scheduled instalments. The payment may look constant while the composition changes every month: early instalments usually contain more interest, and later instalments send more money toward principal.

That distinction matters when comparing tenures, considering a prepayment or checking a lender’s schedule. The monthly EMI alone does not reveal the total financing cost.

## The standard home loan EMI formula

For a loan with principal **P**, monthly interest rate **r** and **n** monthly payments, the standard formula is:

**EMI = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1)**

The monthly rate is normally the entered nominal annual rate divided by 12. A 9% annual input becomes 0.75% per month, or 0.0075 in the formula. A 20-year tenure becomes 240 monthly payments.

If the rate is exactly zero, the formula’s normal denominator becomes unsuitable. The correct zero-rate result is simply principal divided by the number of months. The [Home Loan EMI Calculator](/calculators/home-loan-emi/) handles that edge case explicitly.

## Worked example: ₹50 lakh for 20 years

Consider an illustrative loan:

- principal: ₹50,00,000;
- annual interest rate: 8.5%;
- tenure: 20 years; and
- payments: monthly, at the end of each month.

The monthly rate is 8.5% ÷ 12, and the payment count is 240. Under this simplified convention, the EMI is approximately **₹43,391**.

The result is an estimate rather than a lender quotation. Actual schedules can differ because of the disbursal date, broken-period interest, daily versus monthly calculations, rate resets, fees and lender rounding.

## How reducing-balance interest works

Interest is calculated on the opening principal for each period. For the first month in the example, simplified interest is approximately:

**₹50,00,000 × 8.5% ÷ 12 = ₹35,417**

The EMI first covers that interest. The remainder—roughly ₹7,974—reduces principal. The following month starts with a slightly smaller balance, so the interest component falls and the principal component rises.

This repeats until the balance reaches zero. A robust schedule carries full precision internally and adjusts the final payment when needed instead of allowing a small negative balance caused by display rounding.

## Why the amortisation schedule matters

An amortisation schedule shows each payment’s interest, principal and closing balance. It answers questions that the EMI alone cannot:

- How much principal will remain after five or ten years?
- How much interest is still in the future rather than already paid?
- What balance should a prepayment comparison start from?
- How does a longer tenure change lifetime interest?

When reconciling a calculator with a lender statement, compare the same date, outstanding balance, annual rate, payment timing and remaining tenure. Small differences can be legitimate if the lender uses a different convention.

## Why a longer tenure lowers EMI but raises interest

Spreading repayment across more months normally reduces the required monthly payment. But principal remains outstanding for longer, giving interest more time to accrue.

This is why affordability and cost are separate questions. A lower EMI can improve monthly resilience, but it is not automatically the cheaper loan. Compare the EMI, total repayment and total interest together. The [Home Affordability Calculator](/calculators/home-affordability/) starts from household cash flow, while the EMI calculator focuses on the loan schedule itself.

## Fixed and floating rates need different expectations

A single-rate EMI schedule assumes the rate does not change. That is a useful baseline, but a floating-rate loan can reset during its tenure.

The Reserve Bank of India’s [FAQ on reset of floating interest rates](https://old.rbi.org.in/commonman/english/scripts/FAQs.aspx?Id=3687) describes communications and borrower options for covered EMI-based personal loans, including possible changes to EMI or tenor. The contract and lender’s current disclosure remain decisive.

Use the [Fixed vs Floating Rate Calculator](/calculators/fixed-vs-floating-rate/) to stress-test several hypothetical paths rather than treating one rate as a forecast.

## EMI calculation mistakes to avoid

**Using the annual rate as the monthly rate.** Convert the annual percentage consistently before applying the formula.

**Rounding the balance every month.** Repeated rounding can create a visible mismatch by the end of a long schedule.

**Comparing loans with different tenures using EMI alone.** A smaller payment may simply reflect more payments.

**Ignoring fees and insurance.** The mathematical EMI may not equal the complete monthly or upfront cost.

**Treating a floating rate as fixed forever.** Run higher-rate and lower-rate scenarios when the contract can reset.

**Using the original principal for a prepayment decision years later.** Start from the current outstanding balance and remaining schedule.

<div class="article-cta">
  <h2>Calculate EMI and inspect every month</h2>
  <p>Enter your loan amount, rate and tenure to see the estimated EMI, total interest and complete reducing-balance schedule.</p>
  <a href="/calculators/home-loan-emi/">Open the home loan EMI calculator →</a>
</div>

## Frequently asked questions

### Is home loan interest calculated on the original amount?

In a reducing-balance schedule, periodic interest is calculated on the outstanding principal for that period, not permanently on the original amount.

### Why is the interest portion high at the beginning?

The opening balance is largest at the beginning. With a broadly constant EMI, more of the early payment is needed to cover interest.

### Can two calculators show different EMIs?

Yes. Check whether both use the same annual rate conversion, payment frequency, payment timing, tenure and rounding rules. The lender’s contractual schedule controls the actual obligation.

### Does paying one extra EMI always remove one month?

Not necessarily. The effect depends on when the extra amount is applied, the remaining balance, the rate and how the lender treats the payment. Model it as a principal prepayment and confirm the revised lender schedule.

