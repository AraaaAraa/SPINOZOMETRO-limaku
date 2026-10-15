// app.js — lógica de la UI y cálculo (vanilla JS)
(function(){
  const {METRICS, PERSON_LEXICON, WORD_LEXICON, classifyText, joinEs} = window.SPINO;

  // utils
  function clamp(n,min,max){return Math.min(max,Math.max(min,n));}
  function mean(xs){return xs.length?xs.reduce((s,x)=>s+x,0)/xs.length:0}
  function pct(m){return Math.round(clamp(50+50*m,0,100));}
  function ierFromScore100(s){return Math.round((1+9*(s/100))*100)/100}

  // DOM
  const wordsDiv = document.getElementById('words');
  const peopleDiv = document.getElementById('people');
  const evalBtn = document.getElementById('evalBtn');
  const errorP = document.getElementById('error');
  const resultado = document.getElementById('resultado');
  const levelBadge = document.getElementById('levelBadge');
  const totalTitle = document.getElementById('totalTitle');
  const ring = document.getElementById('ring');
  const metricsGrid = document.getElementById('metricsGrid');
  const aumentaEl = document.getElementById('aumenta');
  const disminuyeEl = document.getElementById('disminuye');
  const recomendacionEl = document.getElementById('recomendacion');
  const invitacionEl = document.getElementById('invitacion');
  const comoSeCalculoEl = document.getElementById('comoSeCalculo');
  const ierEl = document.getElementById('ier');
  const unclassifiedSection = document.getElementById('unclassifiedSection');
  const unclassified = document.getElementById('unclassified');
  const historyArea = document.getElementById('historyArea');

  // state
  let palabras = Array(5).fill('');
  let personas = Array.from({length:5},()=>({nombre:'',frase:''}));
  let ov = {}; // manual overrides

  function makeInputs(){
    wordsDiv.innerHTML = '';
    palabras.forEach((w,i)=>{
      const label = document.createElement('label'); label.className='';
      const span = document.createElement('span'); span.textContent = (i+1)+'.'; span.className='index'; span.style.marginRight='8px';
      const input = document.createElement('input'); input.className='input'; input.value = w;
      input.oninput = e=>{palabras[i]=e.target.value};
      label.appendChild(span); label.appendChild(input);
      wordsDiv.appendChild(label);
    });

    peopleDiv.innerHTML = '';
    personas.forEach((p,i)=>{
      const wrap = document.createElement('div'); wrap.style.display='flex'; wrap.style.gap='8px'; wrap.style.alignItems='center';
      const idx = document.createElement('div'); idx.textContent=(i+1); idx.style.width='28px'; idx.style.textAlign='center'; idx.style.background='#16a34a'; idx.style.color='white'; idx.style.borderRadius='6px';
      const name = document.createElement('input'); name.placeholder='Nombre'; name.className='input'; name.style.width='30%'; name.value=p.nombre;
      name.oninput = e=>{personas[i].nombre=e.target.value};
      const frase = document.createElement('input'); frase.placeholder='Frase que la describe'; frase.className='input'; frase.value=p.frase;
      frase.oninput = e=>{personas[i].frase=e.target.value};
      wrap.appendChild(idx); wrap.appendChild(name); wrap.appendChild(frase);
      peopleDiv.appendChild(wrap);
    });
  }

  function validateInput(){
    if(palabras.some(p=>!p.trim())) return 'Completá las 5 palabras.';
    if(personas.some(p=>!p.nombre.trim()||!p.frase.trim())) return 'Completá las 5 personas (nombre y frase).';
    return null;
  }

  function classifyItem(tipo, etiqueta, texto, valor, lexicon){
    const auto = classifyText(texto, lexicon);
    if(valor===undefined) return {tipo,etiqueta,texto,polarity:auto.polarity,status:auto.status,metrics:auto.metrics,manual:false};
    const status = valor>0? 'positivo' : valor<0? 'negativo' : 'neutro';
    return {tipo,etiqueta,texto,polarity:valor,status,metrics:auto.metrics,manual:true};
  }

  function scoreSpinozometro(pal, pers){
    const err = validateInput(); if(err) throw new Error(err);
    const items = [
      ...pal.map(p=>classifyItem('palabra',p.trim(),p,undefined,WORD_LEXICON)),
      ...pers.map(p=>classifyItem('persona',p.nombre.trim(),p.frase,undefined,PERSON_LEXICON))
    ];
    const total = pct(mean(items.map(i=>i.polarity)));
    const metrics = Object.fromEntries(METRICS.map(m=>{
      const vals = items.filter(i=>i.metrics.includes(m)).map(i=>i.polarity);
      return [m, vals.length?pct(mean(vals)):null];
    }));
    const level = Math.min(5,Math.floor(clamp(total,0,100)/20)+1);
    const labels = f=>items.filter(f).map(i=>i.etiqueta);
    const aumenta = labels(i=>i.polarity>0);
    const disminuye = labels(i=>i.polarity<0);
    const ambivalentes = labels(i=>i.status==='ambivalente');
    const sinClasificar = labels(i=>i.status==='sin_clasificar');
    return {
      scoringVersion: '0.1-provisional', total, metrics, level, levelName: ['','Pasiones tristes dominantes','Potencia disminuida','Potencia ambivalente','Potencia activa','Potencia expansiva'][level], ier: ierFromScore100(total), items, aumenta, disminuye, ambivalentes, sinClasificar,
      recomendacion: buildRecomendacion(level, items.filter(i=>i.tipo==='persona'&&i.polarity<0).map(i=>i.etiqueta)),
      invitacion: ['Elegí una sola cosa para cuidar esta semana: un límite, una conversación pendiente o un rato propio. Con una alcanza.','Identificá un vínculo o una palabra que pesa y pensá una pequeña acción para resignificarla o ponerle límites.','Elegí un factor que suma y dale más lugar esta semana: una charla, una actividad o un proyecto que te haga bien.','Convertí una fuente actual de potencia en hábito: coordiná una actividad, conversación o proyecto semanal que sostenga aprendizaje, cooperación o creación.','Compartí lo que te hace bien: invitá a alguien a una actividad o proyecto en común y cuidá tus espacios de reflexión.'][level-1],
      comoSeCalculo: 'Cada palabra y cada persona suma (+1), resta (−1) o queda neutra (0). El índice es 50 + 50 × el promedio de esos 10 valores. Cada métrica usa solo los elementos que la tocan; si ninguno la toca, figura como «sin datos».'
    };
  }

  function buildRecomendacion(level, atencion){
    const base = [
      'Hoy tu entorno parece disminuir tu potencia más de lo que la aumenta. Mirá qué vínculos y palabras pesan más y pensá cuáles podés cuidar, limitar o resignificar.',
      'Predominan factores que limitan tu capacidad de actuar. Ubicar qué los provoca es el primer paso para recuperar margen de decisión.',
      'Conviven factores que suman y restan. Reforzar lo que te impulsa y poner atención a lo que te agota puede inclinar la balanza.',
      'Tu entorno muestra varios factores de apoyo, autonomía y cooperación. El desafío es consolidarlos sin depender de un único vínculo y mantener espacios propios de reflexión y acción.',
      'Tu entorno favorece ampliamente tu capacidad de actuar. El desafío es sostenerlo en el tiempo y compartirlo con otros.'
    ][level-1];
    return atencion.length?`${base} Prestá especial atención a tu vínculo con ${joinEs(atencion)}.`:base;
  }

  function renderResult(r){
    resultado.classList.remove('hidden');
    levelBadge.textContent = `Nivel ${r.level} · ${r.levelName}`;
    totalTitle.textContent = `Índice de Potencia del Entorno: ${r.total}/100`;
    ring.style.background = `conic-gradient(#16a34a 0% ${r.total}%, #d1fae5 ${r.total}% 100%)`;
    metricsGrid.innerHTML='';
    METRICS.forEach(m=>{
      const div = document.createElement('div'); div.className='metric';
      const label = document.createElement('div'); label.textContent = m.charAt(0).toUpperCase()+m.slice(1);
      const bar = document.createElement('div'); bar.style.height='8px'; bar.style.background='#e6f0f6'; bar.style.borderRadius='6px'; bar.style.margin='6px 0';
      const fill = document.createElement('div'); fill.style.height='8px'; fill.style.background='#16a34a'; fill.style.borderRadius='6px'; fill.style.width = (r.metrics[m]===null?0:r.metrics[m])+'%';
      bar.appendChild(fill); div.appendChild(label); div.appendChild(bar);
      const v = document.createElement('div'); v.className='small muted'; v.textContent = (r.metrics[m]===null?'sin datos':r.metrics[m]+'%'); div.appendChild(v);
      metricsGrid.appendChild(div);
    });
    aumentaEl.textContent = r.aumenta.length?`Aparece como constructivo: ${joinEs(r.aumenta)}.`:'Nada claro por ahora.';
    disminuyeEl.textContent = r.disminuye.length?`Requiere atención: ${joinEs(r.disminuye)}.`:'Nada claro por ahora.';
    recomendacionEl.textContent = r.recomendacion; invitacionEl.textContent = r.invitacion; comoSeCalculoEl.textContent = r.comoSeCalculo; ierEl.textContent = r.ier.toFixed(2);

    // unclassified
    const toRate = r.items.filter(it=>it.status==='sin_clasificar' || it.manual);
    if(toRate.length){
      unclassifiedSection.classList.remove('hidden'); unclassified.innerHTML='';
      toRate.forEach((it,i)=>{
        const label = document.createElement('label'); label.style.display='flex'; label.style.justifyContent='space-between'; label.style.marginBottom='6px';
        const left = document.createElement('div'); left.textContent = it.etiqueta + (it.tipo==='persona'?` («${it.texto}»)`:'');
        const sel = document.createElement('select'); sel.innerHTML = `<option value="" disabled>Elegí…</option><option value="1">Me suma</option><option value="0">Neutro</option><option value="-1">Me resta</option>`;
        sel.value = ov[i]!==undefined?String(ov[i]):'';
        sel.onchange = e=>{ ov[i]=Number(e.target.value); // recompute
          recomputeWithOverrides();
        };
        label.appendChild(left); label.appendChild(sel); unclassified.appendChild(label);
      });
    } else { unclassifiedSection.classList.add('hidden'); }

    // history
    renderHistory();
  }

  function recomputeWithOverrides(){
    // Apply ov overrides to items by index if present
    try{
      const r = scoreSpinozometro(palabras,personas);
      // overwrite polarities for items with ov
      r.items.forEach((it,i)=>{ if(ov[i]!==undefined){ it.polarity = ov[i]; } });
      // recompute totals based on modified polarities
      const total = pct(mean(r.items.map(i=>i.polarity)));
      r.total = total; r.level = Math.min(5,Math.floor(clamp(total,0,100)/20)+1); r.levelName = ['','Pasiones tristes dominantes','Potencia disminuida','Potencia ambivalente','Potencia activa','Potencia expansiva'][r.level]; r.ier = ierFromScore100(total);
      renderResult(r);
    }catch(e){ console.error(e); }
  }

  function saveSpinozometro(result){
    try{
      const key = 'spinozometro_history';
      const hist = JSON.parse(localStorage.getItem(key) || '[]');
      hist.unshift({id:Date.now(),timestamp:new Date().toISOString(),total:result.total,level:result.level,levelName:result.levelName});
      localStorage.setItem(key,JSON.stringify(hist.slice(0,50)));
      return true;
    }catch(e){return false}
  }

  function getHistory(){const key='spinozometro_history';return JSON.parse(localStorage.getItem(key)||'[]')}
  function renderHistory(){ const h = getHistory(); if(!h.length){ historyArea.textContent='Todavía no guardaste mediciones.'; return;} historyArea.innerHTML=''; const table = document.createElement('table'); table.style.width='100%'; h.forEach(row=>{ const tr = document.createElement('div'); tr.style.display='flex'; tr.style.justifyContent='space-between'; tr.style.borderTop='1px solid #e6f0f6'; tr.style.padding='6px 0'; tr.innerHTML = `<div>${new Date(row.timestamp).toLocaleDateString('es-AR')}</div><div>${row.total}/100</div><div>${row.levelName}</div>`; historyArea.appendChild(tr); }); }

  // ranking static
  const RANKING = [
    {level:1,name:'Pasiones tristes dominantes',desc:'Entorno que principalmente disminuye tu potencia.'},
    {level:2,name:'Potencia disminuida',desc:'Predominan factores que limitan tu poder de obrar.'},
    {level:3,name:'Potencia ambivalente',desc:'Conviven factores que suman y restan.'},
    {level:4,name:'Potencia activa',desc:'Predominan factores que aumentan tu potencia.'},
    {level:5,name:'Potencia expansiva',desc:'El entorno favorece ampliamente tu capacidad de actuar.'}
  ];
  const rankingEl = document.getElementById('ranking'); RANKING.forEach(r=>{ const d=document.createElement('div'); d.className='rank'; d.style.background=['#fee2e2','#ffedd5','#fef3c7','#ecfccb','#dcfce7'][r.level-1]; d.innerHTML=`<div style="font-size:12px">${r.level}</div><div style="font-weight:700">${r.name}</div><div style="font-size:12px">${r.desc}</div>`; rankingEl.appendChild(d);});

  // events
  evalBtn.onclick = ()=>{
    errorP.hidden=true; const err = validateInput(); if(err){ errorP.textContent=err; errorP.hidden=false; return; }
    ov = {};
    try{
      const result = scoreSpinozometro(palabras,personas);
      renderResult(result);
    }catch(e){ errorP.textContent = e.message; errorP.hidden=false; }
  };

  document.getElementById('repeatBtn').onclick = ()=>{
    if(!confirm('¿Seguro? Se borran los datos cargados (el historial guardado no se toca).')) return; palabras = Array(5).fill(''); personas = Array.from({length:5},()=>({nombre:'',frase:''})); ov={}; resultado.classList.add('hidden'); makeInputs(); }

  document.getElementById('savePag').onclick = ()=>{
    try{
      const result = scoreSpinozometro(palabras,personas); if(saveSpinozometro(result)){ renderHistory(); alert('Guardado. Ahora podés ir a PAG (no implementado en esta versión estática).'); } else alert('No se pudo guardar en este navegador.');
    }catch(e){ alert(e.message); }
  };

  document.getElementById('downloadPdf').onclick = async ()=>{
    try{
      const result = scoreSpinozometro(palabras,personas);
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF(); doc.setFontSize(16); doc.text(`Spinozómetro — ${result.total}/100 — Nivel ${result.level}: ${result.levelName}`,14,20);
      doc.setFontSize(12); doc.text('Lo que aumenta: '+(result.aumenta.length?joinEs(result.aumenta):'Nada claro'),14,30);
      doc.text('Lo que disminuye: '+(result.disminuye.length?joinEs(result.disminuye):'Nada claro'),14,38);
      doc.text('Recomendación: '+result.recomendacion,14,48);
      doc.save(`spinozometro-${new Date().toISOString().slice(0,10)}.pdf`);
    }catch(e){ alert('No se pudo generar el PDF.'); console.error(e); }
  };

  document.getElementById('printBtn').onclick = ()=>{ window.print(); };

  // initial
  makeInputs(); renderHistory();
})();
