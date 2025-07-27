export const BRACKETS_2024 = {
  single: [
    { rate: 0.10, upTo: 11600 },
    { rate: 0.12, upTo: 47150 },
    { rate: 0.22, upTo: 100525 },
    { rate: 0.24, upTo: 191950 },
    { rate: 0.32, upTo: 243725 },
    { rate: 0.35, upTo: 609350 },
    { rate: 0.37, upTo: Infinity }
  ],
  mfj: [
    { rate: 0.10, upTo: 23200 },
    { rate: 0.12, upTo: 94299 },
    { rate: 0.22, upTo: 201050 },
    { rate: 0.24, upTo: 383900 },
    { rate: 0.32, upTo: 487450 },
    { rate: 0.35, upTo: 731200 },
    { rate: 0.37, upTo: Infinity }
  ],
  hoh: [
    { rate: 0.10, upTo: 16550 },
    { rate: 0.12, upTo: 63100 },
    { rate: 0.22, upTo: 100500 },
    { rate: 0.24, upTo: 191950 },
    { rate: 0.32, upTo: 243700 },
    { rate: 0.35, upTo: 609350 },
    { rate: 0.37, upTo: Infinity }
  ]
};

export const STANDARD_DEDUCTION_2024 = {
  single: 14600,
  mfj: 29200,
  hoh: 21900
};

export function computeTax(filingStatus, taxableIncome){
  const brackets = BRACKETS_2024[filingStatus] || BRACKETS_2024.single;
  let tax = 0;
  let prev = 0;
  for(const b of brackets){
    const amt = Math.min(taxableIncome, b.upTo) - prev;
    if(amt <= 0) break;
    tax += amt * b.rate;
    prev = b.upTo;
  }
  return Math.max(0, Math.round(tax));
}
