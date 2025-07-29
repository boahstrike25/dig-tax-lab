export const TAX_YEARS = {
  2025:{standard:{single:15000,mfj:30000,hoh:22500},brackets:{
    single:[{rate:.10,upTo:12000},{rate:.12,upTo:48000},{rate:.22,upTo:102000},{rate:.24,upTo:195000},{rate:.32,upTo:248000},{rate:.35,upTo:620000},{rate:.37,upTo:Infinity}],
    mfj:[{rate:.10,upTo:24000},{rate:.12,upTo:96000},{rate:.22,upTo:204000},{rate:.24,upTo:390000},{rate:.32,upTo:496000},{rate:.35,upTo:744000},{rate:.37,upTo:Infinity}],
    hoh:[{rate:.10,upTo:17000},{rate:.12,upTo:65000},{rate:.22,upTo:102000},{rate:.24,upTo:195000},{rate:.32,upTo:248000},{rate:.35,upTo:620000},{rate:.37,upTo:Infinity}] }},
  2024:{standard:{single:14600,mfj:29200,hoh:21900},brackets:{
    single:[{rate:.10,upTo:11600},{rate:.12,upTo:47150},{rate:.22,upTo:100525},{rate:.24,upTo:191950},{rate:.32,upTo:243725},{rate:.35,upTo:609350},{rate:.37,upTo:Infinity}],
    mfj:[{rate:.10,upTo:23200},{rate:.12,upTo:94299},{rate:.22,upTo:201050},{rate:.24,upTo:383900},{rate:.32,upTo:487450},{rate:.35,upTo:731200},{rate:.37,upTo:Infinity}],
    hoh:[{rate:.10,upTo:16550},{rate:.12,upTo:63100},{rate:.22,upTo:100500},{rate:.24,upTo:191950},{rate:.32,upTo:243700},{rate:.35,upTo:609350},{rate:.37,upTo:Infinity}] }},
  2023:{standard:{single:13850,mfj:27700,hoh:20800},brackets:{
    single:[{rate:.10,upTo:11000},{rate:.12,upTo:44725},{rate:.22,upTo:95375},{rate:.24,upTo:182100},{rate:.32,upTo:231250},{rate:.35,upTo:578125},{rate:.37,upTo:Infinity}],
    mfj:[{rate:.10,upTo:22000},{rate:.12,upTo:89450},{rate:.22,upTo:190750},{rate:.24,upTo:364200},{rate:.32,upTo:462500},{rate:.35,upTo:693750},{rate:.37,upTo:Infinity}],
    hoh:[{rate:.10,upTo:15700},{rate:.12,upTo:59850},{rate:.22,upTo:95350},{rate:.24,upTo:182100},{rate:.32,upTo:231250},{rate:.35,upTo:578100},{rate:.37,upTo:Infinity}] }},
  2022:{standard:{single:12950,mfj:25900,hoh:19400},brackets:{
    single:[{rate:.10,upTo:10275},{rate:.12,upTo:41775},{rate:.22,upTo:89075},{rate:.24,upTo:170050},{rate:.32,upTo:215950},{rate:.35,upTo:539900},{rate:.37,upTo:Infinity}],
    mfj:[{rate:.10,upTo:20550},{rate:.12,upTo:83550},{rate:.22,upTo:178150},{rate:.24,upTo:340100},{rate:.32,upTo:431900},{rate:.35,upTo:647850},{rate:.37,upTo:Infinity}],
    hoh:[{rate:.10,upTo:14650},{rate:.12,upTo:55900},{rate:.22,upTo:89050},{rate:.24,upTo:170050},{rate:.32,upTo:215950},{rate:.35,upTo:539900},{rate:.37,upTo:Infinity}] }}
};
export function computeTax(year,status,taxable){
  const b=TAX_YEARS[year].brackets[status]||TAX_YEARS[year].brackets.single;
  let tax=0,prev=0;
  for(const br of b){
    const amt=Math.min(taxable,br.upTo)-prev;
    if(amt<=0)break;
    tax+=amt*br.rate;
    prev=br.upTo;
  }
  return Math.max(0,Math.round(tax));
}
