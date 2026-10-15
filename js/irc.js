// irc.js — calcula IRC y lo clasifica
(function(){
  const IRC_ITEMS = [
    { key: "I1_afectos_pasivos", title: "Transformación de afectos pasivos" },
    { key: "I2_causalidad_interna", title: "Causalidad interna" },
    { key: "I3_discernimiento", title: "Discernimiento de límites" },
    { key: "I4_coherencia", title: "Coherencia y autonomía" },
  ];
  const IRC_LEVELS = [ { min:8.0, state:'Libertad Spinoziana', color:'#38A169', message:'Buen rendimiento'}, {min:5.0,state:'Transición Racional',color:'#DD6B20',message:'En transición'},{min:0,state:'Servidumbre Emocional',color:'#E53E3E',message:'Necesita atención'} ];

  const form = document.getElementById('ircForm'); const qdiv = document.getElementById('ircQuestions'); const resP = document.getElementById('ircResult'); const saveBtn = document.getElementById('saveIrc');

  IRC_ITEMS.forEach((it,i)=>{ const row=document.createElement('div'); row.style.marginBottom='10px'; const label=document.createElement('label'); label.textContent = `${i+1}. ${it.title}`; const input=document.createElement('input'); input.type='number'; input.min=1; input.max=10; input.name=it.key; input.className='input'; row.appendChild(label); row.appendChild(input); qdiv.appendChild(row); });

  function calcIrc(scores){ const vals = Object.values(scores); if(vals.length!==4 || vals.some(v=>!Number.isInteger(v)||v<1||v>10)) throw new Error('Cada ítem debe ser entero entre 1 y 10'); return Math.round((vals.reduce((s,x)=>s+x,0)/vals.length)*100)/100; }
  function classifyIrc(irc){ return IRC_LEVELS.find(l=>irc>=l.min) || IRC_LEVELS[2]; }

  form.onsubmit = (e)=>{ e.preventDefault(); try{ const scores = Object.fromEntries(IRC_ITEMS.map(it=>[it.key, Number(form[it.key].value)])); const irc = calcIrc(scores); const level = classifyIrc(irc); resP.textContent = `IRC: ${irc.toFixed(2)} · ${level.state}`; }catch(err){ alert(err.message); }};

  saveBtn.onclick = ()=>{ try{ const scores = Object.fromEntries(IRC_ITEMS.map(it=>[it.key, Number(form[it.key].value)])); const irc = calcIrc(scores); const level = classifyIrc(irc); const assessment = {assessment_id: Date.now().toString(36), user_id: 'anon', timestamp: new Date().toISOString(), scores, results:{irc_score:irc,state:level.state,color_code:level.color}}; window.SPINO_STORE.saveIrc(assessment); alert('IRC guardado.'); }catch(e){ alert(e.message); }};
})();
