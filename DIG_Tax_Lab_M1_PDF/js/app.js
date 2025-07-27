import { QUOTES } from './quotes.js';
import { STANDARD_DEDUCTION_2024, computeTax } from './tax2024.js';
import { generatePdf } from './pdf.js';

const state = JSON.parse(localStorage.getItem('dig_tax_lab_state')||'{}') || {};
state.user ??= null;
state.stepIndex ??= 0;
state.data ??= { filingStatus:'single', wages:0, interest:0, otherIncome:0, withholding:0 };

const steps = [
  { id:'personal',   title:'Personal Info',          render: renderPersonal },
  { id:'income',     title:'Income',                 render: renderIncome },
  { id:'deductions', title:'Deductions & Credits',   render: renderDeductions },
  { id:'summary',    title:'Tax Summary',            render: renderSummary },
  { id:'submit',     title:'Simulated Submission',   render: renderSubmit }
];

const $ = id => document.getElementById(id);

document.addEventListener('DOMContentLoaded', init);

function init(){
  $('dailyQuote').textContent = QUOTES[new Date().getDate() % QUOTES.length];

  $('loginBtn').onclick   = () => toggleLogin(true);
  $('guestBtn').onclick   = startAsGuest;
  $('cancelLogin').onclick= () => toggleLogin(false);
  $('confirmLogin').onclick = () => {
    const name = $('username').value.trim() || 'Guest';
    state.user = { name };
    toggleLogin(false);
    startApp();
  };

  $('prevStep').onclick = prevStep;
  $('nextStep').onclick = nextStep;

  if(state.user){ startApp(); }
}

function toggleLogin(show){
  const modal = $('loginModal');
  if(show){ modal.classList.remove('hidden'); modal.classList.add('flex'); }
  else    { modal.classList.add('hidden');   modal.classList.remove('flex'); }
}

function startAsGuest(){
  state.user = { name:'Guest' };
  startApp();
}

function startApp(){
  $('welcomeView').classList.add('hidden');
  $('dashboardView').classList.remove('hidden');
  $('userIndicator').textContent = 'User: ' + (state.user?.name || 'Guest');
  buildNav();
  renderStep();
  saveState();
}

function buildNav(){
  const nav = $('stepNav');
  nav.innerHTML = '';
  steps.forEach((s, i)=>{
    const b = document.createElement('button');
    b.className = 'text-left px-2 py-1 rounded ' + (i===state.stepIndex ? 'bg-gray-200 font-semibold':'hover:bg-gray-100');
    b.textContent = (i+1)+'. '+s.title;
    b.onclick = ()=>{ state.stepIndex=i; renderStep(); saveState(); };
    nav.appendChild(b);
  });
}

function renderStep(){
  const container = $('stepContainer');
  container.innerHTML = '';
  steps[state.stepIndex].render(container);
  buildNav();
  $('prevStep').disabled = state.stepIndex===0;
  $('nextStep').textContent = state.stepIndex===steps.length-1 ? 'Finish' : 'Next →';
}

function nextStep(){
  if(state.stepIndex < steps.length-1){
    state.stepIndex++;
    renderStep();
    saveState();
  } else {
    alert('Simulation complete! (No real filing sent)');
  }
}
function prevStep(){
  if(state.stepIndex>0){
    state.stepIndex--;
    renderStep();
    saveState();
  }
}

function renderPersonal(container){
  container.innerHTML = `
    <h2 class="text-xl font-semibold mb-4">Personal Info</h2>
    <label class="label">Filing Status</label>
    <select id="filingStatus" class="input">
      <option value="single">Single</option>
      <option value="mfj">Married Filing Jointly</option>
      <option value="hoh">Head of Household</option>
    </select>
  `;
  const fs = $('filingStatus');
  fs.value = state.data.filingStatus;
  fs.onchange = e=>{ state.data.filingStatus = e.target.value; saveState(); };
}

function renderIncome(container){
  container.innerHTML = `
    <h2 class="text-xl font-semibold mb-4">Income</h2>
    <div class="space-y-4">
      ${numInput('wages','Wages (W-2)', state.data.wages)}
      ${numInput('interest','Interest Income', state.data.interest)}
      ${numInput('otherIncome','Other Income', state.data.otherIncome)}
      ${numInput('withholding','Tax Withheld (from W-2 etc.)', state.data.withholding)}
    </div>
  `;
  ['wages','interest','otherIncome','withholding'].forEach(id=>{
    $(id).oninput = e=>{ state.data[id] = Number(e.target.value||0); saveState(); };
  });
}

function numInput(id,label,val){
  return `<div><label class="label">${label}</label><input id="${id}" class="input" type="number" value="${val}"></div>`;
}

function renderDeductions(container){
  const status = state.data.filingStatus;
  const std = STANDARD_DEDUCTION_2024[status];
  container.innerHTML = `
    <h2 class="text-xl font-semibold mb-4">Deductions & Credits</h2>
    <p class="mb-2 text-gray-600">For this MVP, we automatically apply the <strong>standard deduction</strong> for your filing status.</p>
    <p class="text-gray-800">Standard Deduction (${status.toUpperCase()}): <strong>$${std.toLocaleString()}</strong></p>
    <p class="mt-4 text-sm italic text-gray-500">Itemized deductions & credits will be added in the next phase.</p>
  `;
}

function renderSummary(container){
  const d = state.data;
  const status = d.filingStatus;
  const std = STANDARD_DEDUCTION_2024[status];
  const totalIncome = (d.wages||0) + (d.interest||0) + (d.otherIncome||0);
  const taxable = Math.max(0, totalIncome - std);
  const tax = computeTax(status, taxable);
  const wh = d.withholding||0;
  const refund = Math.max(0, wh - tax);
  const due = Math.max(0, tax - wh);

  container.innerHTML = `
    <h2 class="text-xl font-semibold mb-4">Tax Summary</h2>
    <div class="space-y-2">
      <p>Total Income: <strong>$${totalIncome.toLocaleString()}</strong></p>
      <p>Standard Deduction: <strong>-$${std.toLocaleString()}</strong></p>
      <p>Taxable Income: <strong>$${taxable.toLocaleString()}</strong></p>
      <p>Estimated Tax (2024): <strong>$${tax.toLocaleString()}</strong></p>
      <p>Withholding: <strong>$${wh.toLocaleString()}</strong></p>
      <hr class="my-2">
      ${ refund > 0
          ? `<p class="text-green-600 text-lg font-semibold">Estimated Refund: $${refund.toLocaleString()}</p>`
          : `<p class="text-red-600 text-lg font-semibold">Amount Owed: $${due.toLocaleString()}</p>`}
    </div>
    <p class="mt-4 text-xs text-gray-500 italic">This is a simulation only. No data is transmitted to the IRS.</p>
  `;
}

function renderSubmit(container){
  container.innerHTML = `
    <h2 class="text-xl font-semibold mb-4">Simulated Submission</h2>
    <p class="text-gray-600 mb-4">You're done! This is where a real e-file transmission would happen — but in this lab, we simply confirm completion.</p>
    <button id="downloadPdf" class="btn btn-primary">Download Simulated PDF</button>
    <p class="mt-4 text-xs text-gray-500 italic">Thank you for using DIG Intelligent Tax System (Lab).</p>
  `;
  $('downloadPdf').onclick = onDownloadPdf;
}

function onDownloadPdf(){
  const d = state.data;
  const status = d.filingStatus;
  const std = STANDARD_DEDUCTION_2024[status];
  const totalIncome = (d.wages||0) + (d.interest||0) + (d.otherIncome||0);
  const taxable = Math.max(0, totalIncome - std);
  const tax = computeTax(status, taxable);
  const wh = d.withholding||0;
  const refund = Math.max(0, wh - tax);
  const due = Math.max(0, tax - wh);

  generatePdf({
    filingStatus: status,
    totalIncome,
    stdDed: std,
    taxable,
    tax,
    withholding: wh,
    refund,
    due
  });
}

function saveState(){
  localStorage.setItem('dig_tax_lab_state', JSON.stringify(state));
}
