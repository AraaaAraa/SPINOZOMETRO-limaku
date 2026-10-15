// storage.js — persistencia simplificada en localStorage para la versión estática
const STORE_KEY = 'limaku:spinozometro:store_static';
function newId(){ if(typeof crypto!=='undefined'&&crypto.randomUUID) return crypto.randomUUID(); return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }

function loadStore(){ try{ const raw = localStorage.getItem(STORE_KEY); if(!raw) return {history:{spinozometro:[],iev:[],irc:[],pag:[]},userId:newId()}; const s=JSON.parse(raw); if(!s.userId) s.userId=newId(); return s;}catch(e){return {history:{spinozometro:[],iev:[],irc:[],pag:[]},userId:newId()}; }}
function persist(s){ try{ localStorage.setItem(STORE_KEY,JSON.stringify(s)); return true;}catch(e){return false;} }

function saveSpinozometro(result){ const s=loadStore(); const last = s.history.spinozometro[0]; if(last && last.total===result.total && last.level===result.level) return true; const rec = {id:newId(),timestamp:new Date().toISOString(),total:result.total,level:result.level,levelName:result.levelName,metrics:result.metrics,ier:result.ier,scoringVersion:result.scoringVersion}; s.history.spinozometro = [rec, ...(s.history.spinozometro||[])].slice(0,100); s.latest = s.latest||{}; s.latest.ier = result.ier; const ok = persist(s); return ok; }
function getHistory(){ return loadStore().history; }
function saveIev(r){ const s=loadStore(); s.history.iev = [{...r,id:newId(),timestamp:new Date().toISOString()},...(s.history.iev||[])].slice(0,100); persist(s); return true; }
function saveIrc(a){ const s=loadStore(); s.history.irc = [{...a},...(s.history.irc||[])].slice(0,100); persist(s); return true; }
function savePag(a){ const s=loadStore(); s.history.pag = [{...a},...(s.history.pag||[])].slice(0,100); persist(s); return true; }

window.SPINO_STORE = {saveSpinozometro,getHistory,saveIev,saveIrc,savePag};
