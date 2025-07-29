export const DEFAULT_OTHER_EXPENSES = [
  { name: "Software & SaaS subscriptions", amount: 0 },
  { name: "Bank / Merchant Fees", amount: 0 },
  { name: "Continuing Education / Certifications", amount: 0 },
  { name: "Website Hosting & Domains", amount: 0 },
  { name: "Client Gifts (under $25)", amount: 0 },
  { name: "Home Office Internet %", amount: 0 },
  { name: "Professional Membership Dues", amount: 0 }
];

export function initScheduleC(state){
  state.scheduleC ??= {
    part1:{gross:0,returns:0,otherIncome:0},
    part2:{advertising:0,carTruck:0,contractLabor:0,depreciation:0,empBenefits:0,insurance:0,interest:0,legal:0,office:0,rent:0,repairs:0,supplies:0,taxes:0,travel:0,meals:0,utilities:0,wages:0,otherTotal:0},
    part3:{startInv:0,purchases:0,labor:0,materials:0,otherCosts:0,endInv:0},
    part4:{odoStart:0,odoEnd:0,totalMiles:0,bizMiles:0,commuteMiles:0,gasOil:0,repairs:0,tires:0,insurance:0,regFees:0,lease:0,depreciation:0,otherVeh:0,parking:0,tolls:0},
    part5:{otherExpenses: JSON.parse(JSON.stringify(DEFAULT_OTHER_EXPENSES)) }
  };
}

export function computeCOGS(p3){
  return (p3.startInv + p3.purchases + p3.labor + p3.materials + p3.otherCosts) - p3.endInv;
}

export function totalVehicleExpense(c){
  const v=c.part4;
  const pct = v.totalMiles>0 ? (v.bizMiles/v.totalMiles) : 0;
  const actual = v.gasOil+v.repairs+v.tires+v.insurance+v.regFees+v.lease+v.depreciation+v.otherVeh;
  const deductible = actual*pct + v.parking + v.tolls;
  return { busPercent:pct, deductible: Math.round(deductible) };
}

export function totalExpenses(state){
  const c=state.scheduleC;
  const veh=totalVehicleExpense(c);
  const p2=c.part2;
  const p5 = c.part5.otherExpenses.reduce((s,o)=>s+(Number(o.amount)||0),0);
  const total = p2.advertising + veh.deductible + p2.contractLabor + p2.depreciation + p2.empBenefits + p2.insurance + p2.interest + p2.legal + p2.office + p2.rent + p2.repairs + p2.supplies + p2.taxes + p2.travel + p2.meals + p2.utilities + p2.wages + p5;
  c.part2.carTruck = veh.deductible;
  c.part2.otherTotal = p5;
  return Math.round(total);
}

export function scheduleCNetProfit(state){
  const c=state.scheduleC;
  const gross = c.part1.gross - c.part1.returns + c.part1.otherIncome;
  const cogs = computeCOGS(c.part3);
  const expenses = totalExpenses(state);
  return gross - cogs - expenses;
}
