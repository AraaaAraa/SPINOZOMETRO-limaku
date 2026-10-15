// pag.js — cálculo PAG y helpers
(function(){
  function parseIndex(v){ const n = typeof v === 'string'? Number(v): v; if(Number.isNaN(n) || n<0 || n>100) return {ok:false,error:'Índice inválido'}; return {ok:true,value: Math.round(n*100)/100}; }
  function round2(n){return Math.round((n+Number.EPSILON)*100)/100}
  function calcPag({iev,ier,irc}){ return round2((iev*ier*irc)/100); }
  function pagLevel(pag){ if(pag>=8) return {name:'Potencia Activa Soberana'}; if(pag>=5) return {name:'Potencia Sostenible'}; if(pag>=2.5) return {name:'Potencia Reactiva'}; return {name:'Potencia Crítica'} }

  const form = document.getElementById('pagForm'); const resP = document.getElementById('pagResult'); const saveBtn = document.getElementById('savePag');

  form.onsubmit = (e)=>{ e.preventDefault(); try{ const iev = Number(form.iev.value); const ier = Number(form.ier.value); const irc = Number(form.irc.value); if([iev,ier,irc].some(v=>isNaN(v)||v<1||v>10)) throw new Error('Cada índice debe estar entre 1 y 10'); const pag = calcPag({iev,ier,irc}); const lvl = pagLevel(pag); resP.textContent = `PAG: ${pag.toFixed(2)} — ${lvl.name}`; }catch(err){ alert(err.message); }};
  saveBtn.onclick = ()=>{ try{ const iev = Number(form.iev.value); const ier = Number(form.ier.value); const irc = Number(form.irc.value); if([iev,ier,irc].some(v=>isNaN(v)||v<1||v>10)) throw new Error('Cada índice debe estar entre 1 y 10'); const pag = calcPag({iev,ier,irc}); const assessment = {pag_assessment_id: Date.now().toString(36), user_id:'anon', timestamp:new Date().toISOString(), components:{iev,ier,irc}, results:{pag_score:pag, diagnostic_level: pagLevel(pag).name, limiting_factor:[]}}; window.SPINO_STORE.savePag(assessment); alert('PAG guardado.'); }catch(e){ alert(e.message); }};
})();
