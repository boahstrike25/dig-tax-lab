export function initDepreciation(state){
  state.depr ??= { assets: [] };
}
export function addAsset(state, asset){
  state.depr.assets.push(asset);
}
export function computeDepreciation(state){
  let total=0;
  state.depr.assets.forEach(a=>{
    const basis = a.cost * (a.busPct/100);
    let annual;
    if(a.method==="200DB") annual = basis * (2/a.life);
    else if(a.method==="150DB") annual = basis * (1.5/a.life);
    else annual = basis / a.life;
    a.currentYear = Math.round(annual);
    total += a.currentYear;
  });
  return Math.round(total);
}
