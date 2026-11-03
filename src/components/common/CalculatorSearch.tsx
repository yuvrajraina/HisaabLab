import { useMemo, useState } from 'react';
import type { Calculator } from '../../data/calculators';

export default function CalculatorSearch({ calculators }: { calculators: Calculator[] }) {
  const [query,setQuery]=useState('');
  const results=useMemo(()=>query.trim()?calculators.filter(item=>`${item.name} ${item.summary} ${item.category}`.toLowerCase().includes(query.toLowerCase())).slice(0,6):calculators.slice(0,5),[query,calculators]);
  return <div className="calculator-search">
    <label htmlFor="calculator-search">Find the right calculator</label>
    <div className="search-input"><span aria-hidden="true">⌕</span><input id="calculator-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Try “prepayment” or “rent vs buy”" autoComplete="off" /></div>
    <div className="search-results" aria-live="polite">{results.map(item=><a href={item.path} key={item.id}><span className="mini-icon">{item.icon}</span><span><strong>{item.shortName}</strong><small>{item.summary}</small></span><b aria-hidden="true">→</b></a>)}{results.length===0&&<p>No exact match. Browse all calculators instead.</p>}</div>
  </div>;
}
