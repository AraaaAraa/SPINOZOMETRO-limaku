// iev.js — preguntas y cálculo IEV (1-5 -> 1.00-10.00)
(function(){
  const IEV_QUESTIONS = [
    { id: "E1_cuerpo", text: "¿Cuánta energía física sentiste para tu día a día?" },
    { id: "E2_descanso", text: "¿Cuánto te recuperaste después de esforzarte (sueño, pausas)?" },
    { id: "E3_animo", text: "¿Cómo fue tu disposición emocional general?" },
    { id: "E4_deseo", text: "¿Cuántas ganas tuviste de empezar cosas que te importan?" },
    { id: "E5_decision", text: "¿Cuántas veces pasaste de la intención a la acción por decisión propia?" },
  ];
  const questionsDiv = document.getElementById('questions');
  const form = document.getElementById('ievForm');
  const resultP = document.getElementById('ievResult');
  const saveBtn = document.getElementById('saveIev');
  
  IEV_QUESTIONS.forEach((q,i)=>{
    const row = document.createElement('div'); row.style.marginBottom='10px';
    const label = document.createElement('label'); label.textContent = `${i+1}. ${q.text}`;
    const select = document.createElement('select'); select.name=q.id; select.className='input';
    ['','1','2','3','4','5'].forEach(v=>{ const o=document.createElement('option'); o.value=v; o.textContent = v? (v==='1'?'Nada':v==='2'?'Poco':v==='3'?'Algo':v==='4'?'Bastante':'Mucho') : 'Elegí...'; select.appendChild(o); });
    row.appendChild(label); row.appendChild(select); questionsDiv.appendChild(row);
  });

  function ievFromAnswers(answers){ if(answers.length!==5 || answers.some(a=>!Number.isInteger(a)||a<1||a>5)) throw new Error('IEV: se esperan 5 respuestas enteras entre 1 y 5.'); const mean = answers.reduce((s,a)=>s+a,0)/answers.length; return Math.round((1 + (9*(mean-1))/4)*100)/100; }

  form.onsubmit = (e)=>{ e.preventDefault(); try{ const vals = IEV_QUESTIONS.map(q=>Number(form[q.id].value)); const iev = ievFromAnswers(vals); resultP.textContent = `IEV: ${iev.toFixed(2)} / 10`; }catch(err){ alert(err.message); }};
  saveBtn.onclick = ()=>{ try{ const vals = IEV_QUESTIONS.map(q=>Number(form[q.id].value)); const iev = ievFromAnswers(vals); const record = {answers:Object.fromEntries(IEV_QUESTIONS.map((q,i)=>[q.id,vals[i]])),iev}; window.SPINO_STORE.saveIev(record); alert('IEV guardado.'); }catch(e){ alert(e.message); }};
})();
