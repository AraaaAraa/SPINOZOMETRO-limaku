// lexicon.js — contiene las raíces y funciones utilitarias (versión JS)
const METRICS = ["alegria","autonomia","comprension","cooperacion"];

function clamp(n,min,max){return Math.min(max,Math.max(min,n));}
function mean(xs){return xs.length?xs.reduce((s,x)=>s+x,0)/xs.length:0}
function norm(s){return s.normalize("NFD").replace(/[00-\u036f]/g,"").toLowerCase().trim();}
function joinEs(items){if(items.length<=1) return items.join(""); return `${items.slice(0,-1).join(", ")} y ${items[items.length-1]}`}

// simplified normalization using replace for diacritics if normalize unavailable
function normFallback(s){try{return norm(s)}catch(e){return s.replace(/[áàäâã]/g,'a').replace(/[éèëê]/g,'e').replace(/[íìïî]/g,'i').replace(/[óòöôõ]/g,'o').replace(/[úùüû]/g,'u').replace(/ñ/g,'n').toLowerCase().trim();}}

const P = (stem,metrics)=>({stem,polarity:1,metrics});
const N = (stem,metrics)=>({stem,polarity:-1,metrics});

// Expanded lexicons (añadí más variables como pediste)
const PERSON_LEXICON = [
  P("escuch",["comprension"]), P("impuls",["alegria","autonomia"]), P("apoy",["cooperacion","alegria"]),
  P("ayud",["cooperacion"]), P("cooper",["cooperacion"]), P("acompan",["cooperacion"]),
  P("respet",["autonomia"]), P("ensen",["comprension"]), P("motiv",["alegria"]),
  P("comprend",["comprension"]), P("confi",["autonomia","cooperacion"]), P("valor",["autonomia"]),
  P("anim",["alegria"]), P("inspir",["alegria","autonomia"]), P("aconsej",["comprension"]),
  P("alegr",["alegria"]), P("dialog",["comprension","cooperacion"]), P("suma",["cooperacion"]),
  // añadidos
  P("escuela",["comprension"]), P("mentor",["comprension","autonomia"]), P("colabor",["cooperacion"]),
  P("respald",["autonomia","cooperacion"]), P("facilit",["comprension"]),
  N("critic",["autonomia"]), N("juzg",["comprension"]), N("control",["autonomia"]),
  N("manipul",["autonomia"]), N("culp",["alegria","autonomia"]), N("agred",["alegria"]),
  N("grit",["alegria"]), N("humill",["alegria","autonomia"]), N("ignor",["comprension","cooperacion"]),
  N("bloque",["autonomia"]), N("exig",["autonomia"]), N("castig",["alegria"]),
  N("descalific",["autonomia"]), N("presion",["autonomia"]), N("chantaj",["autonomia"]),
  N("celos",["alegria","cooperacion"]), N("desvalor",["autonomia"]), N("menospreci",["autonomia"]),
  N("miedo",["alegria"]), N("quej",["alegria"]), N("rechaz",["cooperacion"]),
  // añadidos negativos
  N("burla",["alegria","autonomia"]), N("amenaz",["autonomia"]), N("intimid",["autonomia"])
];

const WORD_LEXICON = [
  P("libert",["autonomia","alegria"]), P("amor",["alegria","cooperacion"]), P("alegr",["alegria"]),
  P("arte",["alegria","autonomia"]), P("music",["alegria"]), P("juego",["alegria"]),
  P("crea",["autonomia"]), P("paz",["alegria"]), P("confian",["cooperacion","autonomia"]),
  P("apoy",["cooperacion"]), P("aprend",["comprension"]), P("crec",["comprension","autonomia"]),
  P("amig",["cooperacion","alegria"]), P("dialog",["comprension","cooperacion"]),
  P("respet",["autonomia","cooperacion"]), P("gratitud",["alegria"]), P("curiosid",["comprension"]),
  // añadidos
  P("trabajo",["autonomia","comprension"]), P("proyecto",["autonomia","cooperacion"]), P("ejercicio",["alegria"]),
  N("miedo",["alegria"]), N("culp",["alegria","autonomia"]), N("celos",["alegria","cooperacion"]),
  N("control",["autonomia"]), N("bloque",["autonomia"]), N("envidia",["alegria"]),
  N("rencor",["alegria"]), N("odio",["alegria"]), N("ansied",["alegria"]),
  N("obligaci",["autonomia"]), N("mandato",["autonomia"]), N("presion",["autonomia"]),
  N("critic",["autonomia"]), N("castig",["alegria"]), N("verguenza",["alegria"]),
  N("soledad",["alegria","cooperacion"]), N("impotenc",["autonomia"]), N("angusti",["alegria"]),
  // añadidos negativos
  N("fragil",["autonomia"]), N("agot",["alegria","autonomia"])
];

const NEGATORS = new Set(["no","nunca","jamas","tampoco","sin"]);
const HEDGE = /\b(cuando (quiere|quiero|conviene|le conviene|se le (canta|antoja)|le parece|tiene ganas)|a veces|algunas veces|de vez en cuando|depende)\b/;

function stemMatches(token, stem){
  if(token===stem) return true;
  if(stem.length>=5) return token.startsWith(stem);
  return token.startsWith(stem) && token.length<=stem.length+1;
}

function classifyText(text, lexicon){
  const t = normFallback(text);
  const tokens = t.split(/[^a-z]+/).filter(Boolean);
  const hits = [];
  tokens.forEach((tok,i)=>{
    const e = lexicon.find(x=>stemMatches(tok,x.stem));
    if(!e) return;
    const negated = tokens.slice(Math.max(0,i-2),i).some(w=>NEGATORS.has(w));
    hits.push({pol: negated?-e.polarity:e.polarity, metrics: e.metrics});
  });
  const metrics = Array.from(new Set(hits.flatMap(h=>h.metrics)));
  const hasPos = hits.some(h=>h.pol>0);
  const hasNeg = hits.some(h=>h.pol<0);
  if(HEDGE.test(t) || (hasPos && hasNeg)) return {polarity:0,status:"ambivalente",metrics};
  if(hasPos) return {polarity:1,status:"positivo",metrics};
  if(hasNeg) return {polarity:-1,status:"negativo",metrics};
  return {polarity:0,status:"sin_clasificar",metrics:[]};
}

// export to global
window.SPINO = {METRICS, PERSON_LEXICON, WORD_LEXICON, classifyText, joinEs};
