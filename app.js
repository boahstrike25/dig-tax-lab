import { QUOTES } from './quotes.js';
import { TAX_YEARS, computeTax } from './taxTables.js';
import { initScheduleC, scheduleCNetProfit, computeCOGS, totalExpenses } from './scheduleC.js';
import { initDepreciation, computeDepreciation } from './depreciation.js';
import { generatePdf } from './pdf.js';
import { saveState, loadState, exportJSON, importJSON } from './storage.js';

const $ = id => document.getElementById(id);

const state = loadState();
state.user ??= null;
state.stepIndex ??= 0;
state.year ??= 2024;
state.data ??= { filingStatus:'single', wages:0, interest:0, otherIncome:0, withholding:0 };
initScheduleC(state);
initDepreciation(state);
state.profiles ??= [];

const steps = [
  { id:'personal', title:'Personal Info', render: renderPersonal },
  { id:'income', title:'Income', render: renderIncome },
  { id:'schedC', title:'Business Income (Sch C)', render: renderScheduleC },
  { id:'deductions', title:'Deductions & Credits', render: renderDeductions },
  { id:'summary', title:'Tax Summary', render: renderSummary },
  { id:'submit', title:'Simulated Submission', render: renderSubmit }
];

document.addEventListener('DOMContentLoaded', init);

function init(){
  $('dailyQuote').textContent = QUOTES[new Date().getDate() % QUOTES.length];

  $('loginBtn').onclick = ()=> toggleLogin(true);
  $('guestBtn').onclick = startAsGuest;
  $('cancelLogin').onclick = ()=> toggleLogin(false);
  $('confirmLogin').onclick = ()=>{
    const name = $('username').value.trim() || 'Guest';
    state.user = { name };
    toggleLogin(false);
    startApp();
    toast('Logged in as '+name);
  };

  $('prevStep').onclick = prevStep;
  $('nextStep').onclick = nextStep;

  $('taxYear').value = state.year;
  $('taxYear').onchange = e=>{
    state.year = Number(e.target.value);
    $('yearIndicator').textContent = 'Year: '+state.year;
    saveState(state);
    if(state.stepIndex===4) renderStep();
  };

  $('profileBtn').onclick = ()=> openProfiles();
  $('closeProfiles').onclick = ()=> toggleProfiles(false);
  $('addProfile').onclick = ()=>{
    const nm = $('newProfileName').value.trim();
    if(!nm) return;
    state.profiles.push({ name:nm, saved: JSON.parse(JSON.stringify(state)) });
    $('newProfileName').value='';
    renderProfilesList();
    saveState(state);
    toast('Profile saved');
  };

  $('exportJson').onclick = ()=>{ exportJSON(state); toast('JSON exported'); };
  $('importJson').onchange = e=>{
    if(!e.target.files[0]) return;
    importJSON(e.target.files[0], (err,data)=>{
      if(err){ alert('Invalid JSON'); return; }
      Object.assign(state, data);
      saveState(state);
      location.reload();
    });
  };

  $('yearIndicator').textContent = 'Year: '+state.year;

  if(state.user) startApp();
}

function toggleLogin(show){
  const modal = $('loginModal');
  if(show){ modal.classList.remove('hidden'); modal.classList.add('flex'); }
  else { modal.classList.add('hidden'); modal.classList.remove('flex'); }
}
function startAsGuest(){
  state.user = { name:'Guest' };
  startApp();
  toast('Continuing as Guest');
}
function startApp(){
  $('welcomeView').classList.add('hidden');
  $('dashboardView').classList.remove('hidden');
  $('userIndicator').textContent = 'User: ' + (state.user?.name || 'Guest');
  buildNav();
  renderStep();
  saveState(state);
  updateProgress();
}
function buildNav(){
  const nav = $('stepNav');
  nav.innerHTML = '';
  steps.forEach((s,i)=>{
    const b = document.createElement('button');
    b.className = 'px-2 py-1 rounded hover:bg-indigo-50 ' + (i===state.stepIndex ? 'step-active':'');
    b.textContent = (i+1)+'. '+s.title;
    b.onclick = ()=>{ state.stepIndex=i; renderStep(); saveState(state); updateProgress(); };
    nav.appendChild(b);
  });
}
function renderStep(){
  const c = $('stepContainer');
  c.innerHTML = '';
  steps[state.stepIndex].render(c);
  buildNav();
  $('prevStep').disabled = state.stepIndex===0;
  $('nextStep').textContent = state.stepIndex===steps.length-1 ? 'Finish' : 'Next →';
  updateProgress();
}
function nextStep(){
  if(state.stepIndex < steps.length-1){
    state.stepIndex++;
    renderStep();
    saveState(state);
    updateProgress();
  } else {
    toast('Simulation complete!');
    alert('Simulation complete! (No real filing sent)');
  }
}
function prevStep(){
  if(state.stepIndex>0){
    state.stepIndex--;
    renderStep();
    saveState(state);
    updateProgress();
  }
}
function updateProgress(){
  const pct = ((state.stepIndex+1)/steps.length)*100;
  document.getElementById('progressFill').style.width = pct+'%';
}
function numInput(id,label,val){
  return `<div><label class="label">${label}</label><input id="${id}" class="input" type="number" value="${val||0}"></div>`;
}

/******** Views *********/
function renderPersonal(container){
  container.innerHTML = `
    <h2 class="text-xl font-semibold mb-4">Personal Info</h2>
    <label class="label">Filing Status</label>
    <select id="filingStatus" class="input">
      <option value="single">Single</option>
      <option value="mfj">Married Filing Jointly</option>
      <option value="hoh">Head of Household</option>
    </select>`;
  const fs = $('filingStatus');
  fs.value = state.data.filingStatus;
  fs.onchange = e=>{ state.data.filingStatus = e.target.value; saveState(state); };
}

function renderIncome(container){
  container.innerHTML = `
    <h2 class="text-xl font-semibold mb-4">Income</h2>
    <div class="space-y-4">
      ${numInput('wages','Wages (W-2)', state.data.wages)}
      ${numInput('interest','Interest Income', state.data.interest)}
      ${numInput('otherIncome','Other Income', state.data.otherIncome)}
      ${numInput('withholding','Tax Withheld (from W-2 etc.)', state.data.withholding)}
    </div>`;
  ['wages','interest','otherIncome','withholding'].forEach(id=>{
    $(id).oninput = e=>{ state.data[id] = Number(e.target.value||0); saveState(state); };
  });
}

function renderScheduleC(container){
  const c = state.scheduleC;
  const part1 = `
  <h3 class="text-lg font-semibold mt-2 text-indigo-700">Part I – Income</h3>
  ${numInput('sc_gross','Gross receipts or sales', c.part1.gross)}
  ${numInput('sc_returns','Returns and allowances', c.part1.returns)}
  ${numInput('sc_otherInc','Other income', c.part1.otherIncome)}
  `;
  const p3 = c.part3;
  const part3 = `
  <h3 class="text-lg font-semibold mt-6 text-indigo-700">Part III – Cost of Goods Sold</h3>
  ${numInput('sc_invStart','Inventory at beginning of year', p3.startInv)}
  ${numInput('sc_purchases','Purchases', p3.purchases)}
  ${numInput('sc_labor','Cost of labor', p3.labor)}
  ${numInput('sc_materials','Materials and supplies', p3.materials)}
  ${numInput('sc_otherCosts','Other costs', p3.otherCosts)}
  ${numInput('sc_invEnd','Inventory at end of year', p3.endInv)}
  `;
  const v = c.part4;
  const part4 = `
  <h3 class="text-lg font-semibold mt-6 text-indigo-700">Part IV – Vehicle Information (Actual Expenses)</h3>
  <div class="grid md:grid-cols-2 gap-4">
    ${numInput('veh_odoStart','Odometer start', v.odoStart)}
    ${numInput('veh_odoEnd','Odometer end', v.odoEnd)}
    ${numInput('veh_totalMiles','Total miles (auto)', v.totalMiles)}
    ${numInput('veh_bizMiles','Business miles', v.bizMiles)}
    ${numInput('veh_commute','Commuting miles', v.commuteMiles)}
  </div>
  <h4 class="text-md font-semibold mt-4">Actual Vehicle Expenses</h4>
  <div class="grid md:grid-cols-2 gap-4">
    ${numInput('veh_gas','Gas & oil', v.gasOil)}
    ${numInput('veh_repairs','Repairs & maintenance', v.repairs)}
    ${numInput('veh_tires','Tires/parts', v.tires)}
    ${numInput('veh_ins','Insurance', v.insurance)}
    ${numInput('veh_reg','Registration & licenses', v.regFees)}
    ${numInput('veh_lease','Lease payments', v.lease)}
    ${numInput('veh_dep','Vehicle depreciation', v.depreciation)}
    ${numInput('veh_other','Other vehicle expenses', v.otherVeh)}
    ${numInput('veh_parking','Parking fees', v.parking)}
    ${numInput('veh_tolls','Tolls', v.tolls)}
  </div>
  `;
  const rows = c.part5.otherExpenses.map((o,i)=>`
    <tr>
      <td><input data-idx="${i}" data-field="name" class="input" value="${o.name}"></td>
      <td><input data-idx="${i}" data-field="amount" class="input" type="number" value="${o.amount}"></td>
    </tr>`).join('');
  const part5 = `
  <h3 class="text-lg font-semibold mt-6 text-indigo-700">Part V – Other Expenses</h3>
  <table class="mb-2">
    <thead><tr><th>Description</th><th>Amount ($)</th></tr></thead>
    <tbody id="otherExpenseTable">${rows}</tbody>
  </table>
  <button id="addOtherExpense" class="btn btn-ghost text-sm">+ Add Row</button>
  `;
  const assetsRows = (state.depr.assets||[]).map((a,i)=>`
    <tr>
      <td><input data-aidx="${i}" data-af="desc" class="input" value="${a.desc||''}"></td>
      <td><input data-aidx="${i}" data-af="date" class="input" value="${a.date||''}" placeholder="YYYY-MM-DD"></td>
      <td><input data-aidx="${i}" data-af="cost" class="input" type="number" value="${a.cost||0}"></td>
      <td><input data-aidx="${i}" data-af="busPct" class="input" type="number" value="${a.busPct||100}"></td>
      <td><input data-aidx="${i}" data-af="life" class="input" type="number" value="${a.life||5}"></td>
      <td>
        <select data-aidx="${i}" data-af="method" class="input">
          <option value="SL"${a.method==='SL'?' selected':''}>SL</option>
          <option value="200DB"${a.method==='200DB'?' selected':''}>200DB</option>
          <option value="150DB"${a.method==='150DB'?' selected':''}>150DB</option>
        </select>
      </td>
      <td>${a.currentYear?('$'+a.currentYear):''}</td>
    </tr>`).join('');
  const depr = `
  <h3 class="text-lg font-semibold mt-6 text-indigo-700">Depreciation Worksheet</h3>
  <table class="mb-2 text-xs">
    <thead><tr><th>Description</th><th>Placed in Service</th><th>Cost/Basis</th><th>Business %</th><th>Life (yrs)</th><th>Method</th><th>CY Deprec.</th></tr></thead>
    <tbody id="deprTable">${assetsRows}</tbody>
  </table>
  <button id="addAsset" class="btn btn-ghost text-sm">+ Add Asset</button>
  `;

  container.innerHTML = `
    <h2 class="text-xl font-semibold mb-4">Schedule C – Profit or Loss from Business</h2>
    ${part1}${part3}${part4}${part5}${depr}
  `;

  const wireNum = (id,setter)=>{ $(id).oninput=e=>{ setter(Number(e.target.value||0)); saveState(state); }; };
  wireNum('sc_gross',v=>c.part1.gross=v);
  wireNum('sc_returns',v=>c.part1.returns=v);
  wireNum('sc_otherInc',v=>c.part1.otherIncome=v);

  const p3map={'sc_invStart':'startInv','sc_purchases':'purchases','sc_labor':'labor','sc_materials':'materials','sc_otherCosts':'otherCosts','sc_invEnd':'endInv'};
  Object.entries(p3map).forEach(([id,key])=>wireNum(id,v=>c.part3[key]=v));

  const vmap={'veh_odoStart':'odoStart','veh_odoEnd':'odoEnd','veh_totalMiles':'totalMiles','veh_bizMiles':'bizMiles','veh_commute':'commuteMiles','veh_gas':'gasOil','veh_repairs':'repairs','veh_tires':'tires','veh_ins':'insurance','veh_reg':'regFees','veh_lease':'lease','veh_dep':'depreciation','veh_other':'otherVeh','veh_parking':'parking','veh_tolls':'tolls'};
  Object.entries(vmap).forEach(([id,key])=>wireNum(id,val=>c.part4[key]=val));

  $('otherExpenseTable').querySelectorAll('input').forEach(inp=>{
    inp.oninput=e=>{
      const idx=Number(e.target.dataset.idx);
      const field=e.target.dataset.field;
      if(field==='amount') c.part5.otherExpenses[idx].amount = Number(e.target.value||0);
      else c.part5.otherExpenses[idx].name = e.target.value;
      saveState(state);
    };
  });
  $('addOtherExpense').onclick = ()=>{
    c.part5.otherExpenses.push({name:'',amount:0});
    saveState(state);
    renderScheduleC(container);
  };

  $('addAsset').onclick = ()=>{
    state.depr.assets.push({desc:'',date:'',cost:0,busPct:100,life:5,method:'SL'});
    saveState(state);
    renderScheduleC(container);
  };
  $('deprTable').querySelectorAll('input,select').forEach(inp=>{
    inp.onchange=e=>{
      const idx=Number(e.target.dataset.aidx);
      const f=e.target.dataset.af;
      let v=e.target.value;
      if(['cost','busPct','life'].includes(f)) v=Number(v||0);
      state.depr.assets[idx][f]=v;
      const depTotal=computeDepreciation(state);
      state.scheduleC.part2.depreciation = depTotal;
      saveState(state);
      renderScheduleC(container);
    };
  });

  const depTotal=computeDepreciation(state);
  state.scheduleC.part2.depreciation = depTotal;
  saveState(state);
}

function renderDeductions(container){
  const std = TAX_YEARS[state.year].standard[state.data.filingStatus];
  container.innerHTML = `
    <h2 class="text-xl font-semibold mb-4">Deductions & Credits</h2>
    <p class="mb-2 text-gray-600">For now, we apply the <strong>standard deduction</strong> automatically.</p>
    <p>Standard Deduction: <strong>$${std.toLocaleString()}</strong></p>
    <p class="mt-4 text-sm italic text-gray-500">Itemized & credits will come in next milestone.</p>
  `;
}

function renderSummary(container){
  const d = state.data;
  const std = TAX_YEARS[state.year].standard[d.filingStatus];
  const totalIncome = (d.wages||0)+(d.interest||0)+(d.otherIncome||0);

  const scGross = state.scheduleC.part1.gross - state.scheduleC.part1.returns + state.scheduleC.part1.otherIncome;
  const scCOGS = computeCOGS(state.scheduleC.part3);
  const scExpenses = totalExpenses(state);
  const scNet = scheduleCNetProfit(state);

  const adjIncome = totalIncome + scNet;
  const taxable = Math.max(0, adjIncome - std);
  const tax = computeTax(state.year, d.filingStatus, taxable);
  const wh = d.withholding||0;
  const refund = Math.max(0, wh - tax);
  const due = Math.max(0, tax - wh);

  container.innerHTML = `
    <h2 class="text-xl font-semibold mb-4">Tax Summary</h2>
    <div class="space-y-2 text-sm">
      <p>Total Income (W2/Interest/Other): <strong>$${totalIncome.toLocaleString()}</strong></p>
      <p>Schedule C Net Profit/Loss: <strong>$${scNet.toLocaleString()}</strong></p>
      <p>Adjusted Income: <strong>$${adjIncome.toLocaleString()}</strong></p>
      <p>Standard Deduction: <strong>-$${std.toLocaleString()}</strong></p>
      <p>Taxable Income: <strong>$${taxable.toLocaleString()}</strong></p>
      <p>Estimated Tax (${state.year}): <strong>$${tax.toLocaleString()}</strong></p>
      <p>Withholding: <strong>$${wh.toLocaleString()}</strong></p>
      <hr class="my-2">
      ${ refund>0 ? `<p class="text-green-600 text-lg font-semibold">Estimated Refund: $${refund.toLocaleString()}</p>`
                  : `<p class="text-red-600 text-lg font-semibold">Amount Owed: $${due.toLocaleString()}</p>`}
    </div>
    <p class="mt-4 text-xs text-gray-500 italic">Simulation only. No data sent to IRS.</p>
  `;

  state.__summary = { year:state.year, filingStatus:d.filingStatus, totalIncome, stdDed:std, taxable, tax, withholding:wh, refund, due };
  state.__scheduleCSummary = { gross:scGross, cogs:scCOGS, expenses:scExpenses, net:scNet };
  saveState(state);
}

function renderSubmit(container){
  container.innerHTML = `
    <h2 class="text-xl font-semibold mb-4">Simulated Submission</h2>
    <p class="text-gray-600 mb-4">You're done! This is where a real e-file transmission would happen — but in this lab, we simply confirm completion.</p>
    <div class="flex flex-wrap gap-3">
      <button id="downloadPdf" class="btn btn-primary">Download Simulated PDF</button>
      <button id="exportJson2" class="btn btn-ghost">Export JSON</button>
    </div>
    <p class="mt-4 text-xs text-gray-500 italic">Thank you for using DIG Intelligent Tax System (Lab).</p>
  `;
  $('downloadPdf').onclick = ()=>{
    generatePdf(state.__summary, state.__scheduleCSummary);
    toast('PDF downloaded');
  };
  $('exportJson2').onclick = ()=>{ exportJSON(state); toast('JSON exported'); };
}

/******** Profiles *********/
function openProfiles(){ renderProfilesList(); toggleProfiles(true); }
function renderProfilesList(){
  const list = $('profilesList');
  list.innerHTML = '';
  state.profiles.forEach((p,i)=>{
    const row = document.createElement('div');
    row.className = 'flex justify-between items-center text-sm';
    row.innerHTML = `<span>${p.name}</span>
      <div class="flex gap-2">
        <button data-i="${i}" class="btn btn-ghost loadP">Load</button>
        <button data-i="${i}" class="btn btn-ghost delP text-red-500">Del</button>
      </div>`;
    list.appendChild(row);
  });
  list.querySelectorAll('.loadP').forEach(b=>{
    b.onclick = e=>{
      const i = Number(e.target.dataset.i);
      const saved = state.profiles[i].saved;
      Object.assign(state, saved);
      saveState(state);
      location.reload();
    };
  });
  list.querySelectorAll('.delP').forEach(b=>{
    b.onclick = e=>{
      const i = Number(e.target.dataset.i);
      state.profiles.splice(i,1);
      saveState(state);
      renderProfilesList();
    };
  });
}
function toggleProfiles(show){
  const m = $('profilesModal');
  if(show){ m.classList.remove('hidden'); m.classList.add('flex'); }
  else { m.classList.add('hidden'); m.classList.remove('flex'); }
}

/******** Toast *********/
let toastTimer=null;
function toast(msg){
  const t=$('toast');
  t.textContent=msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove('show'),2500);
}
