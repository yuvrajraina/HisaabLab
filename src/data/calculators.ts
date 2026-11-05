export type CalculatorId =
  | 'home-loan-emi' | 'home-loan-prepayment' | 'prepayment-vs-tenure-reduction'
  | 'rent-vs-buy' | 'home-affordability' | 'home-loan-balance-transfer'
  | 'fixed-vs-floating-rate' | 'property-appreciation'
  | 'true-cost-of-homeownership' | 'down-payment-savings';

export type Field = {
  key: string; label: string; defaultValue: number; min: number; max: number; step?: number;
  unit?: '₹' | '%' | 'years' | 'months'; help?: string; options?: { value: number; label: string }[];
};

export type Calculator = {
  id: CalculatorId; name: string; shortName: string; path: string; category: string; icon: string;
  summary: string; description: string; title: string; fields: Field[]; formula: string;
  example: string; takeaways: string[]; assumptions: string[]; limitations: string[]; faqs: { q: string; a: string }[];
  related: CalculatorId[];
};

const f = (key: string, label: string, defaultValue: number, min: number, max: number, unit: Field['unit'] = '₹', step = 1, help?: string): Field =>
  ({ key, label, defaultValue, min, max, unit, step, help });

export const calculators: Calculator[] = [
  {
    id: 'home-loan-emi', name: 'Home Loan EMI Calculator', shortName: 'Home Loan EMI', path: '/calculators/home-loan-emi/', category: 'Home loan', icon: '⌂',
    summary: 'Estimate EMI, total interest and a complete reducing-balance repayment schedule.',
    description: 'Calculate home loan EMI, total interest and a month-by-month amortisation schedule in India. Free, private and no sign-up required.',
    title: 'Home Loan EMI Calculator India',
    fields: [f('principal','Loan amount',5000000,100000,100000000,'₹',50000),f('rate','Annual interest rate',8.5,0,30,'%',0.05,'Illustrative input—not a quoted market rate.'),f('years','Tenure',20,1,40,'years',1)],
    formula: 'For monthly rate r and n payments, EMI = P × r × (1+r)ⁿ ÷ ((1+r)ⁿ−1). At 0%, EMI is principal ÷ months. Interest is charged monthly on the opening balance.',
    example: 'For an illustrative ₹50,00,000 loan at 8.5% for 20 years, the calculator derives the EMI first, then carries the unrounded balance through all 240 monthly rows.',
    takeaways: ['See the monthly EMI before comparing lenders or property budgets.','Separate principal repayment from interest across the full schedule.','Test how a different rate or tenure changes both EMI and total interest.'],
    assumptions: ['Payments occur at the end of each month.','The annual rate is nominal and divided by 12.','The rate and EMI remain unchanged for the chosen tenure.'],
    limitations: ['Actual lender schedules can differ because of disbursal dates, daily interest, rounding or rate resets.','Insurance, fees, taxes and prepayments are excluded.'],
    faqs: [{q:'How is home-loan EMI calculated?',a:'It is the fixed payment that amortises principal plus reducing-balance interest over the selected months.'},{q:'Does a longer tenure lower the EMI?',a:'Usually yes, but it normally raises total interest because the balance remains outstanding longer.'},{q:'Can the result match my lender exactly?',a:'Treat it as an estimate; lender day-count, reset and rounding conventions may differ.'}],
    related: ['home-loan-prepayment','home-affordability','home-loan-balance-transfer']
  },
  {
    id: 'home-loan-prepayment', name: 'Home Loan Prepayment Calculator', shortName: 'Loan Prepayment', path: '/calculators/home-loan-prepayment/', category: 'Home loan', icon: '↘',
    summary: 'See how recurring and one-time prepayments change interest and payoff time.',
    description: 'Calculate how lump-sum and monthly home loan prepayments may reduce future interest and payoff time, using your current loan details.',
    title: 'Home Loan Prepayment Calculator India',
    fields: [f('principal','Original principal',5000000,100000,100000000),f('rate','Annual interest rate',8.5,0,30,'%',0.05),f('years','Original tenure',20,1,40,'years'),f('paidMonths','EMIs already paid',36,0,479,'months'),f('monthlyExtra','Additional monthly prepayment',10000,0,1000000),f('lumpSum','One-time prepayment',200000,0,10000000),f('lumpMonth','One-time payment after',6,1,240,'months')],
    formula: 'The current balance is reconstructed after paid EMIs. Each future month applies interest to the opening balance, then the scheduled EMI, recurring extra amount and any selected lump sum reduce principal.',
    example: 'An illustrative borrower with a ₹50 lakh, 20-year loan can compare the normal remaining schedule with ₹10,000 extra each month and a ₹2 lakh payment six months from now.',
    takeaways: ['Compare the remaining baseline with your chosen prepayment plan.','Measure future interest saved without counting interest already paid.','See the estimated payoff month and validate lender charges separately.'],
    assumptions: ['Prepayments are applied after interest for the selected month.','The contractual rate and scheduled EMI remain constant.','Savings are measured from today, excluding interest already paid.'],
    limitations: ['Confirm minimum prepayment amounts, timing and fees with the lender.','The model does not forecast future floating-rate changes.'],
    faqs: [{q:'What does interest saved mean?',a:'It is future baseline interest minus future interest under the selected prepayment plan.'},{q:'Can a prepayment exceed the balance?',a:'The engine caps it at the remaining principal and never produces a negative balance.'},{q:'Are prepayment charges included?',a:'No. Check your agreement and lender; rules depend on loan and borrower circumstances.'}],
    related: ['prepayment-vs-tenure-reduction','home-loan-emi','home-loan-balance-transfer']
  },
  {
    id: 'prepayment-vs-tenure-reduction', name: 'Reduce EMI vs Tenure Calculator', shortName: 'EMI vs Tenure', path: '/calculators/prepayment-vs-tenure-reduction/', category: 'Decision tool', icon: '⇄',
    summary: 'Compare lower EMI with faster payoff after a lump-sum loan prepayment.',
    description: 'Compare reducing EMI versus reducing tenure after a home loan prepayment, including monthly relief, payoff time and future interest.',
    title: 'Reduce EMI vs Tenure Calculator',
    fields: [f('principal','Outstanding principal',4000000,10000,100000000),f('rate','Annual interest rate',8.5,0,30,'%',0.05),f('months','Remaining tenure',180,1,480,'months'),f('lumpSum','Lump-sum prepayment',500000,0,50000000),f('fee','Editable lender charge',0,0,1000000)],
    formula: 'The lump sum reduces outstanding principal. Scenario A re-amortises with the old EMI until payoff; Scenario B computes a new EMI across the unchanged remaining months.',
    example: 'With ₹40 lakh outstanding and 180 months remaining, a ₹5 lakh prepayment shows the cash-flow relief from a lower EMI beside the potential interest benefit of faster payoff.',
    takeaways: ['Keeping EMI usually repays principal faster and reduces more future interest.','Keeping tenure can lower the required monthly payment and improve cash flow.','Compare both paths from the same balance, rate and prepayment amount.'],
    assumptions: ['The prepayment happens before the next monthly cycle.','Any entered fee is added to the post-payment financing cost.','The interest rate stays constant in both scenarios.'],
    limitations: ['Lenders may round EMI or tenure differently.','Tax effects and the opportunity cost of the lump sum are not modelled.'],
    faqs: [{q:'Which option usually saves more interest?',a:'Keeping EMI unchanged usually repays principal faster and therefore tends to save more interest.'},{q:'When can lower EMI be useful?',a:'It may improve monthly cash-flow resilience when flexibility matters more than fastest payoff.'}],
    related: ['home-loan-prepayment','home-loan-emi','down-payment-savings']
  },
  {
    id: 'rent-vs-buy', name: 'Rent vs Buy Calculator', shortName: 'Rent vs Buy', path: '/calculators/rent-vs-buy/', category: 'Decision tool', icon: '⚖',
    summary: 'Compare property equity with an equivalent-cash-flow renting strategy.',
    description: 'Compare renting versus buying a home in India using loan costs, rent growth, property expenses, equity and alternative investments.',
    title: 'Rent vs Buy Calculator India',
    fields: [f('price','Property price',10000000,500000,500000000),f('downPercent','Down payment',20,0,100,'%',1),f('loanRate','Loan interest rate',8.5,0,30,'%',0.05),f('loanYears','Loan tenure',20,1,40,'years'),f('rentMonthly','Comparable monthly rent',30000,0,1000000),f('rentIncrease','Annual rent increase',5, -10,30,'%',0.5),f('appreciation','Property appreciation',5,-20,30,'%',0.5),f('maintenanceAnnual','Annual maintenance',60000,0,5000000),f('propertyTaxAnnual','Annual property tax',20000,0,5000000),f('buyingCosts','Stamp duty, registration & buying costs',700000,0,50000000),f('sellingPercent','Selling costs',2,0,15,'%',0.25),f('investmentReturn','Alternative investment return',8,-20,30,'%',0.5),f('years','Comparison period',10,1,40,'years')],
    formula: 'Each month compares rent with EMI plus recurring ownership costs. The renter starts by investing avoided down payment and buying costs; monthly cash-flow differences adjust that portfolio. Buying net worth is property value less loan balance and selling costs.',
    example: 'A ₹1 crore home with 20% down is compared with ₹30,000 monthly rent over ten years. Every rate is editable and illustrative.',
    takeaways: ['Compare end net worth rather than rent with the full EMI.','Include down payment, transaction costs, maintenance and selling costs.','Stress-test holding period, appreciation, rent growth and investment returns.'],
    assumptions: ['Investment contributions occur at month end.','Maintenance and property tax are spread monthly.','Property value and rent grow at smooth assumed rates.'],
    limitations: ['Taxes, liquidity, moving costs and non-financial preferences are excluded.','Returns and appreciation are hypothetical—not forecasts.'],
    faqs: [{q:'Why include the down payment in renter investments?',a:'It is capital the renter did not tie up in the property and is necessary for equivalent starting cash flows.'},{q:'Does the winner stay the same at every holding period?',a:'No. Transaction costs, compounding, loan amortisation and rent growth can change the comparison over time.'}],
    related: ['home-affordability','true-cost-of-homeownership','property-appreciation']
  },
  {
    id: 'home-affordability', name: 'Home Affordability Calculator', shortName: 'Home Affordability', path: '/calculators/home-affordability/', category: 'Planning', icon: '◎',
    summary: 'Estimate a comfortable EMI, loan size and home budget from your cash flow.',
    description: 'Estimate an affordable home loan EMI, indicative loan amount and property budget from take-home income, commitments and down payment.',
    title: 'Home Affordability Calculator India',
    fields: [f('income','Monthly take-home income',150000,1000,10000000),f('existingEmis','Existing monthly EMIs',15000,0,5000000),f('commitments','Other recurring commitments',25000,0,5000000),f('downPayment','Available down payment',2000000,0,100000000),f('rate','Illustrative loan rate',8.5,0,30,'%',0.05),f('years','Loan tenure',20,1,40,'years'),f('threshold','Target total commitment ratio',40,5,90,'%',1)],
    formula: 'Affordable EMI = income × selected threshold − existing EMIs − other commitments. That EMI is inverted through the standard loan formula to estimate principal.',
    example: 'With ₹1.5 lakh take-home income and a 40% editable threshold, existing commitments are deducted before estimating the supported loan.',
    takeaways: ['Start with household cash flow rather than a lender maximum.','Deduct existing EMIs and recurring commitments before sizing a home loan.','Treat the result as a budgeting range, not an approval or eligibility promise.'],
    assumptions: ['Income and commitments remain stable.','The entered threshold is a personal budgeting choice, not a bank rule.','The down payment is fully available for purchase.'],
    limitations: ['Credit score, age, lender policy, taxes, emergency funds and purchase costs are not assessed.','This is not an approval or offer.'],
    faqs: [{q:'Is 40% an official bank limit?',a:'No. It is an editable illustration; lenders use their own underwriting and income definitions.'},{q:'Should I use gross or take-home income?',a:'This calculator asks for take-home income so the estimate reflects cash available to your household.'}],
    related: ['home-loan-emi','down-payment-savings','rent-vs-buy']
  },
  {
    id: 'home-loan-balance-transfer', name: 'Home Loan Balance Transfer Calculator', shortName: 'Balance Transfer', path: '/calculators/home-loan-balance-transfer/', category: 'Home loan', icon: '↗',
    summary: 'Compare old and new repayment costs after all switching expenses.',
    description: 'Calculate home loan balance transfer savings, switching costs and break-even time while comparing the old and proposed repayment schedules.',
    title: 'Home Loan Balance Transfer Calculator',
    fields: [f('principal','Outstanding loan amount',4000000,10000,100000000),f('oldRate','Current annual rate',9,0,30,'%',0.05),f('oldMonths','Remaining tenure',180,1,480,'months'),f('newRate','New annual rate',8,0,30,'%',0.05),f('newMonths','New tenure',180,1,480,'months'),f('fees','Processing & switching costs',50000,0,5000000)],
    formula: 'Both options are re-amortised from the same outstanding principal. Net savings subtract switching costs from the difference in future interest; break-even uses monthly payment savings when positive.',
    example: 'A ₹40 lakh balance at 9% with 15 years remaining is compared with 8% after ₹50,000 costs. Change the new tenure to see how extension affects total interest.',
    takeaways: ['Compare total remaining cost, not only the advertised interest rate.','Subtract processing, legal and switching costs from estimated savings.','Check that break-even occurs before you expect to repay or transfer again.'],
    assumptions: ['Rates stay fixed for comparison.','All switching costs are paid now.','No tax consequences are included.'],
    limitations: ['A longer new tenure can lower EMI while increasing total cost.','Confirm lender quotations, legal costs and loan-specific charges.'],
    faqs: [{q:'What if break-even is longer than I will keep the loan?',a:'The transfer may not recover its upfront cost within your expected holding period.'},{q:'Is lower EMI always a saving?',a:'No. A tenure extension can lower EMI but increase the number of payments and total interest.'}],
    related: ['home-loan-emi','home-loan-prepayment','fixed-vs-floating-rate']
  },
  {
    id: 'fixed-vs-floating-rate', name: 'Fixed vs Floating Rate Calculator', shortName: 'Fixed vs Floating', path: '/calculators/fixed-vs-floating-rate/', category: 'Decision tool', icon: '≈',
    summary: 'Stress-test a fixed loan against editable floating-rate paths.',
    description: 'Compare fixed and floating home loan rates across editable reset scenarios, including changes to EMI, tenure and total interest.',
    title: 'Fixed vs Floating Home Loan Rate Calculator',
    fields: [f('principal','Loan principal',5000000,100000,100000000),f('years','Loan tenure',20,1,40,'years'),f('fixedRate','Fixed annual rate',9,0,30,'%',0.05),f('floatingRate','Initial floating rate',8.5,0,30,'%',0.05),f('resetYear','Rate reset after',3,1,30,'years'),f('rateChange','Scenario rate change',1.5,0,10,'%',0.25),{key:'responseMode',label:'After a floating-rate reset',defaultValue:0,min:0,max:1,options:[{value:0,label:'Adjust EMI, keep tenure'},{value:1,label:'Keep EMI, adjust tenure'}]}],
    formula: 'The fixed schedule uses one rate. Floating scenarios reset after the chosen year. Choose whether the model recalculates EMI over the remaining term or retains EMI and adjusts payoff time; total interest is summed from monthly balances.',
    example: 'A ₹50 lakh, 20-year loan compares 9% fixed with 8.5% floating, then stresses floating rates by ±1.5 percentage points after year three.',
    takeaways: ['Compare total interest across several rate paths, not one forecast.','Model whether a reset changes EMI or extends the repayment tenure.','Include conversion fees and lender terms before making a real switch.'],
    assumptions: ['The displayed scenario paths are hypothetical.','Floating EMI adjusts at reset while original maturity remains.','No conversion or reset fees are included.'],
    limitations: ['This is a scenario tool, not a rate forecast.','Real benchmark changes can occur at different times and magnitudes.'],
    faqs: [{q:'Does floating always cost less initially?',a:'Not necessarily; pricing and future resets depend on the lender, benchmark and loan terms.'},{q:'Can tenure change instead of EMI?',a:'Yes. Select “Keep EMI, adjust tenure” to model that response. A sufficiently large increase can also create a negative-amortisation warning.'}],
    related: ['home-loan-balance-transfer','home-loan-emi','home-loan-prepayment']
  },
  {
    id: 'property-appreciation', name: 'Property Appreciation Calculator', shortName: 'Property Appreciation', path: '/calculators/property-appreciation/', category: 'Property', icon: '⌁',
    summary: 'Project nominal and inflation-adjusted property values across scenarios.',
    description: 'Estimate future property value in India across appreciation scenarios, with inflation-adjusted value, holding costs and selling costs.',
    title: 'Property Appreciation Calculator India',
    fields: [f('currentValue','Current property value',8000000,10000,500000000),f('annualRate','Expected annual appreciation',5,-30,50,'%',0.5),f('years','Projection period',10,1,50,'years'),f('initialPrice','Optional initial purchase price',7000000,0,500000000),f('annualCosts','Annual holding costs',60000,0,5000000),f('sellingPercent','Selling costs',2,0,20,'%',0.25),f('inflationRate','Inflation assumption',5,-10,30,'%',0.5)],
    formula: 'Future value = current value × (1 + annual appreciation)ʸ. Real value discounts that result by the editable inflation rate. Holding and selling costs remain separate.',
    example: 'An ₹80 lakh property growing at an illustrative 5% for ten years is shown alongside lower and higher appreciation scenarios and an inflation-adjusted value.',
    takeaways: ['Project a range instead of treating one appreciation rate as a forecast.','Compare nominal growth with inflation-adjusted purchasing power.','Keep holding and selling costs separate from gross property value.'],
    assumptions: ['Appreciation compounds annually at a constant hypothetical rate.','Annual holding cost is entered in today’s rupees without escalation.','Selling cost is a percentage of projected value.'],
    limitations: ['Property returns are uneven, location-specific and uncertain.','Taxes, improvements, vacancy and financing are excluded.'],
    faqs: [{q:'Is appreciation guaranteed?',a:'No. The calculator only compounds the assumption you enter.'},{q:'Why show inflation-adjusted value?',a:'It expresses future purchasing power in today’s-money terms under the selected inflation assumption.'}],
    related: ['rent-vs-buy','true-cost-of-homeownership','down-payment-savings']
  },
  {
    id: 'true-cost-of-homeownership', name: 'True Cost of Home Ownership Calculator', shortName: 'Ownership Cost', path: '/calculators/true-cost-of-homeownership/', category: 'Property', icon: '▦',
    summary: 'Separate upfront cash, financing, recurring expenses and property equity.',
    description: 'Calculate the true cost of home ownership in India across upfront charges, loan interest, recurring expenses and estimated property equity.',
    title: 'Cost of Home Ownership Calculator India',
    fields: [f('price','Property price',10000000,100000,500000000),f('downPayment','Down payment',2000000,0,500000000),f('rate','Loan interest rate',8.5,0,30,'%',0.05),f('loanYears','Loan tenure',20,1,40,'years'),f('stampPercent','Stamp duty assumption',6,0,20,'%',0.25),f('registration','Registration fees',30000,0,5000000),f('brokeragePercent','Brokerage',1,0,10,'%',0.25),f('maintenanceMonthly','Monthly maintenance',5000,0,500000),f('taxAnnual','Annual property tax',20000,0,5000000),f('insuranceAnnual','Annual insurance',10000,0,5000000),f('renovation','Renovation & furnishing',500000,0,50000000),f('escalation','Annual recurring-cost escalation',5,-10,30,'%',0.5),f('years','Intended ownership period',10,1,40,'years'),f('appreciation','Property appreciation assumption',5,-20,30,'%',0.5)],
    formula: 'Cash outflow equals upfront cash plus actual loan payments during the period plus recurring ownership expenses. Principal repayment is disclosed separately because it builds equity rather than being counted again as purchase price.',
    example: 'A ₹1 crore property with ₹20 lakh down displays stamp duty, registration, renovation, EMI, period interest, principal repaid and projected equity as separate lines.',
    takeaways: ['Separate upfront cash, financing cost, recurring expenses and equity.','Avoid double-counting the loan-financed portion of the purchase price.','Use editable local duty and cost assumptions instead of one national estimate.'],
    assumptions: ['Fee and duty inputs are editable illustrations.','Costs escalate annually at the entered rate.','Appreciation is hypothetical and compounds annually.'],
    limitations: ['Verify state duties and local taxes before a decision.','Income tax, opportunity cost, selling costs and major repairs are excluded.'],
    faqs: [{q:'Why not add the full purchase price to EMI payments?',a:'That would double-count the loan-financed portion. The model tracks down payment and actual financing cash flows.'},{q:'Is principal an expense?',a:'It is a cash outflow, but unlike interest it also increases your equity; both are shown separately.'}],
    related: ['rent-vs-buy','property-appreciation','home-affordability']
  },
  {
    id: 'down-payment-savings', name: 'Down Payment Savings Planner', shortName: 'Down Payment Planner', path: '/calculators/down-payment-savings/', category: 'Planning', icon: '◒',
    summary: 'Estimate your future target, savings gap and required monthly contribution.',
    description: 'Plan a home down payment in India by comparing future property cost, current savings, monthly contributions and an editable savings return.',
    title: 'Down Payment Calculator & Savings Planner',
    fields: [f('propertyPrice','Target property price today',8000000,100000,500000000),f('downPercent','Desired down payment',20,1,100,'%',1),f('savings','Current savings',500000,0,100000000),f('monthly','Monthly contribution',30000,0,5000000),f('annualReturn','Expected savings return',7,-20,30,'%',0.5),f('years','Years until purchase',5,1,30,'years'),f('propertyInflation','Property price inflation',5,-20,30,'%',0.5)],
    formula: 'Current savings compound monthly, end-of-month contributions use an ordinary-annuity formula, and the target property price grows by the chosen annual assumption.',
    example: 'For an ₹80 lakh home, 20% target, ₹5 lakh saved and ₹30,000 monthly contributions, the planner compares projected savings with an inflation-adjusted target after five years.',
    takeaways: ['Let the target rise with your property-price assumption while savings compound.','Estimate the monthly contribution required to close a projected gap.','Keep purchase costs and emergency savings outside the down payment target.'],
    assumptions: ['Contributions occur at month end.','Returns compound monthly before taxes and fees.','Property inflation compounds annually for the target date.'],
    limitations: ['Returns and property inflation are uncertain.','Taxes, investment risk, purchase costs and emergency reserves are excluded.'],
    faqs: [{q:'Does the calculator handle 0% return?',a:'Yes. It adds current savings and monthly contributions without dividing by a rate.'},{q:'Why can the target move faster than savings?',a:'The property-price assumption may grow the required down payment while you are saving.'}],
    related: ['home-affordability','property-appreciation','home-loan-emi']
  }
];

export const calculatorById = Object.fromEntries(calculators.map((item) => [item.id, item])) as Record<CalculatorId, Calculator>;
