import { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Tooltip, Legend, Filler, type ChartData
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { Calculator } from '../../data/calculators';
import {
  affordability, amortize, balanceTransfer, downPaymentPlan, emi, prepaymentChoices,
  prepaymentPlan, propertyProjection, rentVsBuy, trueOwnershipCost, variableRateLoan,
  type AmortizationRow
} from '../../lib/finance';
import { formatINR, formatNumber } from '../../lib/formatting';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

type Values = Record<string, number>;
type Metric = { label: string; value: string; tone?: 'positive' | 'warning' };
type Series = { label: string; data: number[]; color?: string };
type Result = { metrics: Metric[]; labels: string[]; series: Series[]; rows?: AmortizationRow[]; note: string };

const sum = (rows: AmortizationRow[], key: 'interest' | 'payment' | 'principal') => rows.reduce((total, row) => total + row[key], 0);
const currencyMetric = (label: string, value: number, tone?: Metric['tone']): Metric => ({ label, value: formatINR(value), tone });
const yearPoints = (rows: AmortizationRow[]) => rows.filter((row) => row.month === 1 || row.month % 12 === 0 || row.balance === 0);

function calculate(calculator: Calculator, v: Values): Result {
  switch (calculator.id) {
    case 'home-loan-emi': {
      const months = Math.round(v.years * 12); const payment = emi(v.principal, v.rate, months);
      const rows = amortize(v.principal, v.rate, months, payment); const points = yearPoints(rows);
      return { metrics: [currencyMetric('Monthly EMI',payment),currencyMetric('Total interest',sum(rows,'interest')),currencyMetric('Total repayment',sum(rows,'payment'))], labels: points.map(r => r.balance ? `Month ${r.month}` : 'Paid off'), series: [{label:'Remaining balance',data:points.map(r=>r.balance)}], rows, note:'Interest is calculated monthly on the opening balance. The final payment is adjusted to avoid a negative balance.' };
    }
    case 'home-loan-prepayment': {
      const r=prepaymentPlan({principal:v.principal,annualRate:v.rate,tenureMonths:Math.round(v.years*12),paidMonths:Math.round(v.paidMonths),monthlyExtra:v.monthlyExtra,lumpSum:v.lumpSum,lumpMonth:Math.round(v.lumpMonth)});
      const max=Math.max(r.baseline.length,r.accelerated.length); const labels=Array.from({length:Math.ceil(max/12)+1},(_,i)=>`Year ${i}`);
      const balanceAt=(rows:AmortizationRow[],i:number)=>i===0?r.outstanding:(rows[Math.min(i*12-1,rows.length-1)]?.balance??0);
      return { metrics:[currencyMetric('Current balance',r.outstanding),currencyMetric('Current EMI',r.payment),currencyMetric('Future interest — no prepayment',r.baselineInterest),currencyMetric('Future interest — with prepayment',r.acceleratedInterest),currencyMetric('Future interest saved',r.interestSaved,'positive'),{label:'Time saved',value:`${r.monthsSaved} months`,tone:'positive'},{label:'New payoff time',value:`${r.accelerated.length} months`}], labels, series:[{label:'Without prepayment',data:labels.map((_,i)=>balanceAt(r.baseline,i)),color:'#64748b'},{label:'With prepayment',data:labels.map((_,i)=>balanceAt(r.accelerated,i)),color:'#059669'}], rows:r.accelerated, note:'Savings compare future interest from today. Interest already paid is excluded.' };
    }
    case 'prepayment-vs-tenure-reduction': {
      const r=prepaymentChoices(v.principal,v.rate,Math.round(v.months),v.lumpSum,v.fee);
      return { metrics:[currencyMetric('EMI before prepayment',r.oldEmi),currencyMetric('Reduced EMI',r.reducedEmi,'positive'),{label:'Shortened tenure',value:`${r.shortenedMonths} months`,tone:'positive'},currencyMetric('Interest — shorten tenure',r.shortInterest),currencyMetric('Interest — reduce EMI',r.reducedInterest),currencyMetric('Extra interest with lower EMI',r.reducedInterest-r.shortInterest,'warning')], labels:['Original plan','Keep EMI','Reduce EMI'], series:[{label:'Future interest',data:[r.baseInterest,r.shortInterest,r.reducedInterest]}], note:'The comparison uses the same post-prepayment principal and rate. Any entered lender charge is included in that principal.' };
    }
    case 'rent-vs-buy': {
      const r=rentVsBuy({price:v.price,downPercent:v.downPercent,loanRate:v.loanRate,loanYears:v.loanYears,rentMonthly:v.rentMonthly,rentIncrease:v.rentIncrease,appreciation:v.appreciation,maintenanceAnnual:v.maintenanceAnnual,propertyTaxAnnual:v.propertyTaxAnnual,buyingCosts:v.buyingCosts,sellingPercent:v.sellingPercent,investmentReturn:v.investmentReturn,years:Math.round(v.years)});
      return { metrics:[currencyMetric('Home-loan EMI',r.payment),currencyMetric('Estimated buyer net worth',r.homeownerNetWorth),currencyMetric('Estimated renter net worth',r.renterNetWorth),currencyMetric(r.difference>=0?'Buying ahead by':'Renting ahead by',Math.abs(r.difference),r.difference>=0?'positive':'warning'),currencyMetric('Loan balance at comparison end',r.finalBalance)], labels:r.yearly.map(x=>`Year ${x.year}`),series:[{label:'Buyer net worth',data:r.yearly.map(x=>x.buy),color:'#0f766e'},{label:'Renter investment balance',data:r.yearly.map(x=>x.rent),color:'#ea580c'}],note:'Both sides start from equivalent available cash. The result is a scenario—not a universal recommendation.' };
    }
    case 'home-affordability': {
      const r=affordability(v.income,v.existingEmis,v.commitments,v.downPayment,v.rate,Math.round(v.years*12),v.threshold);
      return {metrics:[currencyMetric('Estimated affordable EMI',r.affordableEmi),currencyMetric('Indicative maximum loan',r.maxLoan),currencyMetric('Indicative home budget',r.homeBudget),{label:'Selected commitment ratio',value:`${formatNumber(r.ratio,1)}%`}],labels:['Existing EMIs','Other commitments','New EMI capacity'],series:[{label:'Monthly commitments',data:[v.existingEmis,v.commitments,r.affordableEmi]}],note:'This is a personal budgeting estimate, not a lender eligibility decision or approval.'};
    }
    case 'home-loan-balance-transfer': {
      const r=balanceTransfer(v.principal,v.oldRate,Math.round(v.oldMonths),v.newRate,Math.round(v.newMonths),v.fees);
      const sameTenureInterest=emi(v.principal,v.newRate,Math.round(v.oldMonths))*Math.round(v.oldMonths)-v.principal;
      const rateOnlySaving=r.oldInterest-sameTenureInterest-v.fees; const tenureEffect=sameTenureInterest-r.newInterest;
      return {metrics:[currencyMetric('Current EMI',r.oldEmi),currencyMetric('New EMI',r.newEmi),currencyMetric('Monthly EMI difference',r.monthlySaving,r.monthlySaving>0?'positive':'warning'),currencyMetric('Old future interest',r.oldInterest),currencyMetric('New interest + costs',r.newInterest+v.fees),currencyMetric('Rate-only saving at old tenure',rateOnlySaving,rateOnlySaving>0?'positive':'warning'),currencyMetric('Interest effect of tenure change',tenureEffect,tenureEffect>=0?'positive':'warning'),currencyMetric('Net saving',r.netSavings,r.netSavings>0?'positive':'warning'),{label:'Simple break-even',value:Number.isFinite(r.breakEvenMonths)?`${Math.ceil(r.breakEvenMonths)} months`:'Not reached'}],labels:['Stay with current loan','Transfer including costs'],series:[{label:'Future interest and switching cost',data:[r.oldInterest,r.newInterest+v.fees]}],note:'Rate-only saving holds the old remaining tenure constant. The separate tenure effect shows how the selected new term changes interest.'};
    }
    case 'fixed-vs-floating-rate': {
      const months=Math.round(v.years*12),reset=Math.round(v.resetYear*12),fixed=amortize(v.principal,v.fixedRate,months);
      const response=v.responseMode===1?'tenure':'emi';
      const paths=[{name:'Rates decrease',rate:Math.max(0,v.floatingRate-v.rateChange),color:'#059669'},{name:'Rates unchanged',rate:v.floatingRate,color:'#0284c7'},{name:'Rates increase',rate:v.floatingRate+v.rateChange,color:'#ea580c'}].map(p=>({...p,rows:variableRateLoan(v.principal,months,v.floatingRate,[{month:reset+1,rate:p.rate}],response)}));
      return {metrics:[currencyMetric('Fixed EMI',emi(v.principal,v.fixedRate,months)),currencyMetric('Fixed total interest',sum(fixed,'interest')),...paths.flatMap(p=>[currencyMetric(`${p.name} — interest`,sum(p.rows,'interest'),p.name.includes('decrease')?'positive':p.name.includes('increase')?'warning':undefined),{label:`${p.name} — after reset`,value:response==='emi'?`${formatINR(p.rows[reset]?.payment??0)} EMI`:`${p.rows.length} months`}])],labels:['Fixed',...paths.map(p=>p.name)],series:[{label:'Total interest',data:[sum(fixed,'interest'),...paths.map(p=>sum(p.rows,'interest'))]}],note:`Floating paths are editable hypothetical stress scenarios, not predictions. This run ${response==='emi'?'adjusts EMI and retains maturity':'keeps the initial EMI and adjusts payoff time'}.`};
    }
    case 'property-appreciation': {
      const r=propertyProjection(v.currentValue,v.annualRate,v.years,v.inflationRate,v.annualCosts,v.sellingPercent);
      const low=propertyProjection(v.currentValue,v.annualRate-2,v.years,v.inflationRate),high=propertyProjection(v.currentValue,v.annualRate+2,v.years,v.inflationRate);
      const purchaseCagr=v.initialPrice>0&&v.years>0?((r.futureValue/v.initialPrice)**(1/v.years)-1)*100:NaN;
      return {metrics:[currencyMetric('Estimated future value',r.futureValue),currencyMetric('Absolute growth',r.growth,r.growth>=0?'positive':'warning'),{label:'Growth from current value',value:`${formatNumber(r.growthPercent,1)}%`},...(Number.isFinite(purchaseCagr)?[{label:'CAGR from purchase price',value:`${formatNumber(purchaseCagr,2)}%`}]:[]),currencyMetric('Inflation-adjusted value',r.inflationAdjusted),currencyMetric('Holding + selling costs',r.holdingCosts+r.sellingCosts)],labels:r.yearly.map(x=>`Year ${x.year}`),series:[{label:`Base (${v.annualRate}%)`,data:r.yearly.map(x=>x.value)},{label:`Lower (${v.annualRate-2}%)`,data:low.yearly.map(x=>x.value),color:'#64748b'},{label:`Higher (${v.annualRate+2}%)`,data:high.yearly.map(x=>x.value),color:'#ea580c'}],note:'These values compound a constant assumption. They are not market forecasts or guaranteed returns.'};
    }
    case 'true-cost-of-homeownership': {
      const r=trueOwnershipCost({price:v.price,downPayment:v.downPayment,rate:v.rate,months:Math.round(v.loanYears*12),stampPercent:v.stampPercent,registration:v.registration,brokeragePercent:v.brokeragePercent,maintenanceMonthly:v.maintenanceMonthly,taxAnnual:v.taxAnnual,insuranceAnnual:v.insuranceAnnual,renovation:v.renovation,escalation:v.escalation,years:Math.round(v.years),appreciation:v.appreciation});
      return {metrics:[currencyMetric('Upfront cash required',r.upfront),currencyMetric('Monthly EMI',r.payment),currencyMetric('Recurring ownership costs',r.recurring),currencyMetric('Interest paid in period',r.interestPaid),currencyMetric('Principal repaid',r.principalPaid),currencyMetric('Total cash outflow',r.totalCashOutflow),currencyMetric('Remaining loan balance',r.remainingBalance),currencyMetric('Estimated property equity',r.equity,'positive')],labels:['Upfront costs','Interest paid','Principal repaid','Recurring costs'],series:[{label:'Cash-flow components',data:[r.upfront,r.interestPaid,r.principalPaid,r.recurring]}],rows:r.schedule,note:'Principal is shown separately because it builds equity. The property price is not added again to loan payments, avoiding double-counting.'};
    }
    case 'down-payment-savings': {
      const r=downPaymentPlan(v.propertyPrice,v.downPercent,v.savings,v.monthly,v.annualReturn,v.years,v.propertyInflation);
      const labels=Array.from({length:Math.round(v.years)+1},(_,i)=>`Year ${i}`); const series=labels.map((_,i)=>downPaymentPlan(v.propertyPrice,v.downPercent,v.savings,v.monthly,v.annualReturn,i,v.propertyInflation));
      return {metrics:[currencyMetric('Projected property cost',r.futureProperty),currencyMetric('Required down payment',r.target),currencyMetric('Projected savings',r.projected),currencyMetric(r.gap>=0?'Projected surplus':'Remaining gap',Math.abs(r.gap),r.gap>=0?'positive':'warning'),currencyMetric('Monthly contribution needed',r.neededMonthly),{label:'Estimated time at current pace',value:Number.isFinite(r.timeMonths)?`${r.timeMonths} months`:'Beyond model horizon'}],labels,series:[{label:'Savings balance',data:series.map(x=>x.projected),color:'#059669'},{label:'Down-payment target',data:series.map(x=>x.target),color:'#ea580c'}],note:'Savings contributions occur at month end. Returns are before tax and fees and are not guaranteed.'};
    }
  }
}

const palette=['#0f766e','#ea580c','#2563eb','#7c3aed'];

export default function CalculatorApp({ calculator }: { calculator: Calculator }) {
  const defaults=useMemo(()=>Object.fromEntries(calculator.fields.map(field=>[field.key,field.defaultValue])),[calculator]);
  const [values,setValues]=useState<Values>(defaults); const [copied,setCopied]=useState('');

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search); const next={...defaults}; let changed=false;
    calculator.fields.forEach(field=>{const raw=params.get(field.key); if(raw!==null){const parsed=Number(raw); if(Number.isFinite(parsed)){next[field.key]=Math.min(field.max,Math.max(field.min,parsed));changed=true;}}});
    if(changed)setValues(next);
  },[calculator,defaults]);

  const error=calculator.fields.find(field=>!Number.isFinite(values[field.key])||values[field.key]<field.min||values[field.key]>field.max);
  const result=useMemo(()=>{try{return error?null:calculate(calculator,values);}catch{return null;}},[calculator,values,error]);
  const chartData:ChartData<'line'>=useMemo(()=>({labels:result?.labels??[],datasets:(result?.series??[]).map((s,i)=>({label:s.label,data:s.data,borderColor:s.color??palette[i%palette.length],backgroundColor:`${s.color??palette[i%palette.length]}20`,pointRadius:s.data.length>30?0:3,borderWidth:2,tension:.22,fill:false}))}),[result]);

  const update=(key:string,value:number)=>setValues(current=>({...current,[key]:value}));
  const share=async()=>{const params=new URLSearchParams(); calculator.fields.forEach(field=>params.set(field.key,String(values[field.key]))); const url=`${location.origin}${location.pathname}?${params}`; await navigator.clipboard.writeText(url); setCopied('Share link copied'); setTimeout(()=>setCopied(''),2000);};
  const copySummary=async()=>{if(!result)return; await navigator.clipboard.writeText(`${calculator.name}\n${result.metrics.map(m=>`${m.label}: ${m.value}`).join('\n')}\nEducational estimate from HisaabLab.`);setCopied('Summary copied');setTimeout(()=>setCopied(''),2000);};

  return <section className="calculator-shell" aria-label={`${calculator.name} interactive form`}>
    <div className="calculator-form">
      <div className="panel-heading"><div><span className="eyebrow">Your example inputs</span><h2>Adjust the numbers</h2></div><button className="text-button" type="button" onClick={()=>setValues(defaults)}>Reset</button></div>
      <p className="input-note">Defaults are examples, not current market rates or personal advice.</p>
      <div className="field-grid">
        {calculator.fields.map((field,index)=><label className="field" key={field.key}>
          <span>{field.label}</span>
          {field.options?<div className="input-wrap"><select value={values[field.key]} onChange={e=>update(field.key,Number(e.currentTarget.value))}>{field.options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></div>:<div className="input-wrap">{field.unit==='₹'&&<span aria-hidden="true">₹</span>}<input aria-describedby={field.help?`${field.key}-help`:undefined} type="number" inputMode="decimal" min={field.min} max={field.max} step={field.step??1} value={values[field.key]} onChange={e=>update(field.key,e.currentTarget.valueAsNumber)} />{field.unit&&field.unit!=='₹'&&<small>{field.unit}</small>}</div>}
          {field.help&&<small id={`${field.key}-help`} className="field-help">{field.help}</small>}
          {index===0&&<input className="range" aria-label={`${field.label} slider`} type="range" min={field.min} max={field.max} step={field.step??1} value={values[field.key]} onChange={e=>update(field.key,e.currentTarget.valueAsNumber)} />}
        </label>)}
      </div>
      {error&&<p className="form-error" role="alert">{error.label} must be between {formatNumber(error.min)} and {formatNumber(error.max)}.</p>}
    </div>
    <div className="calculator-results" aria-live="polite">
      <div className="panel-heading"><div><span className="eyebrow">Illustrative result</span><h2>Your comparison</h2></div><div className="result-actions"><button className="text-button" type="button" onClick={share}>Share</button><button className="text-button" type="button" onClick={copySummary}>Copy</button></div></div>
      {copied&&<p className="copy-status" role="status">{copied}</p>}
      {!result?<p className="form-error" role="alert">Check the inputs. This combination cannot produce a valid repayment schedule.</p>:<>
        <div className="metric-grid">{result.metrics.map(metric=><div className={`metric ${metric.tone??''}`} key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></div>)}</div>
        <div className="chart-wrap"><Line data={chartData} options={{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{usePointStyle:true,boxWidth:8}}},scales:{y:{ticks:{callback:(value)=>`₹${formatNumber(Number(value)/100000,1)}L`},grid:{color:'#e7e5df'}},x:{grid:{display:false}}}}} aria-label={`${calculator.name} results chart`} role="img" /></div>
        <p className="result-note">{result.note}</p>
        {result.rows&&result.rows.length>0&&<details className="schedule"><summary>View repayment schedule ({result.rows.length} months)</summary><div className="table-scroll"><table><thead><tr><th>Month</th><th>Payment</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead><tbody>{result.rows.map(row=><tr key={row.month}><td>{row.month}</td><td>{formatINR(row.payment)}</td><td>{formatINR(row.principal)}</td><td>{formatINR(row.interest)}</td><td>{formatINR(row.balance)}</td></tr>)}</tbody></table></div></details>}
      </>}
    </div>
  </section>;
}
