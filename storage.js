export function saveState(state){
  localStorage.setItem('dig_tax_lab_state', JSON.stringify(state));
}
export function loadState(){
  try{return JSON.parse(localStorage.getItem('dig_tax_lab_state'))||{};}
  catch(e){return {};}
}
export function exportJSON(state){
  const blob = new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'tax_return.json'; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
}
export function importJSON(file, cb){
  const r = new FileReader();
  r.onload = e=>{
    try{ cb(null, JSON.parse(e.target.result)); }
    catch(err){ cb(err); }
  };
  r.readAsText(file);
}
