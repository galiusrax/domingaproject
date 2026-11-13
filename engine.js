export const VERSION = 1;
export const SUBJECTS = {lectora:'Competencia Lectora',m1:'Matemática M1',m2:'Matemática M2',ciencias:'Ciencias',historia:'Historia y Cs. Sociales'};
export const LEVELS = [['Aprendiz',0],['Dibujante',200],['Proyectista',600],['Constructor',1400],['Arquitecto',2800],['Maestro de Obra',5000],['Ingeniero del Futuro',8000]];
export const DIFFS = ['easy','medium','hard'];
export const SOURCES = ['official','adapted','original','external'];
export const norm = t => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
export const today = (d = new Date()) => d.toLocaleDateString('en-CA',{timeZone:'America/Santiago'});

export function validateQuestion(q) {
  const e = [];
  if (!q || typeof q !== 'object') return ['No es un objeto'];
  if (!q.id) e.push('Falta id');
  if (!Object.keys(SUBJECTS).includes(q.subject)) e.push('Asignatura inválida');
  if (!q.topic) e.push('Falta topic');
  if (!DIFFS.includes(q.difficulty)) e.push('Dificultad inválida');
  if (!q.question) e.push('Falta enunciado');
  if (!Array.isArray(q.alternatives) || q.alternatives.length < 4 || q.alternatives.length > 5) e.push('Se requieren 4 o 5 alternativas');
  else if (!q.alternatives.some(a => a.id === q.correctAnswer)) e.push('correctAnswer no coincide con ninguna alternativa');
  if (!q.explanation && q.source !== 'external') e.push('Falta explicación');
  if (!SOURCES.includes(q.source)) e.push('source debe ser official, adapted u original');
  return e;
}
export function validateBatch(list, existing = []) {
  const ids = new Set(existing.map(q => q.id)), texts = new Set(existing.map(q => norm(q.question)));
  const ok = [], errors = [];
  for (const q of Array.isArray(list) ? list : []) {
    const e = validateQuestion(q);
    if (!e.length && ids.has(q.id)) e.push('ID duplicado');
    if (!e.length && texts.has(norm(q.question))) e.push('Texto duplicado');
    if (e.length) errors.push({id: q?.id ?? '?', errors: e});
    else { ok.push(q); ids.add(q.id); texts.add(norm(q.question)); }
  }
  return {ok, errors};
}
export const shuffle = (a, rnd = Math.random) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export function pickQuestions(bank, {subject, n, difficulty, topics = [], answered = [], revision = false, rnd = Math.random}) {
  let pool = bank.filter(q => q.subject === subject && (!difficulty || q.difficulty === difficulty) && (!topics.length || topics.includes(q.topic)));
  if (!revision) pool = pool.filter(q => !answered.includes(q.id));
  return shuffle(pool, rnd).slice(0, n).map(q => ({...q, alternatives: shuffle(q.alternatives, rnd)}));
}
export const levelFor = xp => { let i = 0; LEVELS.forEach(([, min], k) => { if (xp >= min) i = k; }); const next = LEVELS[i + 1]; return {name: LEVELS[i][0], index: i, next: next ? next[1] : null, pct: next ? Math.round((xp - LEVELS[i][1]) / (next[1] - LEVELS[i][1]) * 100) : 100}; };
export const xpFor = ({correct, total, finished}) => correct * 10 + (total - correct) * 2 + (finished ? 20 : 0);
export function grade(questions, answers) {
  const byTopic = {}; let correct = 0, blank = 0;
  for (const q of questions) {
    const a = answers[q.id], t = (byTopic[q.topic] ??= {c: 0, t: 0});
    t.t++; if (!a) blank++; else if (a === q.correctAnswer) { correct++; t.c++; }
  }
  const total = questions.length;
  return {total, correct, blank, wrong: total - correct - blank, pct: total ? Math.round(correct / total * 100) : 0, byTopic};
}
export const progressPct = (init, target, current) => target <= init ? 100 : Math.max(0, Math.min(100, Math.round((current - init) / (target - init) * 100)));
export const defaultState = () => ({version: VERSION, profile: null, xp: 0, answered: {}, favorites: [], history: [], customQuestions: [], log: [], events: [], games: {records: {}, history: []}, achievements: {}, examDate: '', studyDays: [1,2,3,4,5], daily: {}, streak: {last: null, count: 0}});
export function touchDaily(s, answeredNow, xp, minutes = 0, now = new Date()) {
  const d = today(now), cur = s.daily[d] ?? {questions: 0, xp: 0, minutes: 0};
  const prev = s.streak.last, yest = today(new Date(now.getTime() - 864e5));
  const count = prev === d ? s.streak.count : prev === yest ? s.streak.count + 1 : 1;
  return {...s, xp: s.xp + xp, daily: {...s.daily, [d]: {questions: cur.questions + answeredNow, xp: cur.xp + xp, minutes: cur.minutes + minutes}}, streak: {last: d, count}};
}
const KEY = 'dominga.v1';
export function loadState(store = localStorage) {
  try { const raw = store.getItem(KEY); if (!raw) return defaultState(); return migrate(JSON.parse(raw)); }
  catch { try { store.setItem(KEY + '.corrupt', store.getItem(KEY)); } catch {} return defaultState(); }
}
export const saveState = (s, store = localStorage) => { try { store.setItem(KEY, JSON.stringify(s)); return true; } catch { return false; } };
export const migrate = s => ({...defaultState(), ...s, version: VERSION});
export const importBackup = text => { const s = JSON.parse(text); if (!s || typeof s !== 'object' || !('xp' in s) || !('history' in s)) throw new Error('Respaldo inválido'); return migrate(s); };
// ---- Importación (JSON o CSV) ----
export function parseCSV(text){
  const rows=[];let row=[],cur='',q=false;const delim=(text.split('\n')[0].match(/;/g)||[]).length>(text.split('\n')[0].match(/,/g)||[]).length?';':',';
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){if(c==='"'&&text[i+1]==='"'){cur+='"';i++;}else if(c==='"')q=false;else cur+=c;}
    else if(c==='"')q=true;else if(c===delim){row.push(cur);cur='';}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cur);cur='';if(row.some(x=>x.trim()))rows.push(row);row=[];}
    else cur+=c;}
  row.push(cur);if(row.some(x=>x.trim()))rows.push(row);return rows;
}
export function parseImport(text,name=''){
  const clean=text.replace(/^\uFEFF/,'');let list;
  if(/\.csv$/i.test(name)){
    const [h,...rest]=parseCSV(clean),k=h.map(x=>x.trim().toLowerCase());
    list=rest.map(r=>{const g=n=>(r[k.indexOf(n)]??'').trim();
      return {id:g('id'),subject:g('subject')||g('asignatura'),topic:g('topic')||g('tema'),difficulty:g('difficulty')||g('dificultad'),question:g('question')||g('pregunta'),passage:g('passage')||g('texto')||undefined,
        alternatives:['A','B','C','D','E'].map(l=>({id:l,text:g(l.toLowerCase())})).filter(a=>a.text),correctAnswer:(g('correct')||g('correcta')).toUpperCase(),explanation:g('explanation')||g('explicacion'),source:g('source')||g('fuente')};});
  } else { const d=JSON.parse(clean); list=Array.isArray(d)?d:d.questions; if(!Array.isArray(list))throw new Error('El JSON debe ser una lista de preguntas o {"questions":[...]}'); }
  return list.map(q=>({...q,source:q.source||'external'}));
}
// ---- Diagnóstico posterior a cada prueba ----
export function diagnose(g,qs,ans,mins=0){
  const lvl=g.pct<40?'Inicial':g.pct<60?'En desarrollo':g.pct<80?'Sólido':'Avanzado';
  const topics=Object.entries(g.byTopic).map(([t,v])=>({t,c:v.c,n:v.t,pct:Math.round(v.c/v.t*100)}));
  const weak=topics.filter(x=>x.pct<60).sort((a,b)=>a.pct-b.pct),strong=topics.filter(x=>x.pct>=80&&x.n>=2);
  const bd={};for(const q of qs){const o=(bd[q.difficulty]??={c:0,n:0});o.n++;if(ans[q.id]===q.correctAnswer)o.c++;}
  const pc=d=>bd[d]?bd[d].c/bd[d].n:null,recs=[];
  weak.forEach(w=>recs.push(`📚 Repasa «${w.t}» (${w.c}/${w.n}). Luego usa «Solo falladas» para repetir esas preguntas.`));
  if(g.blank>0)recs.push(`⏱️ Dejaste ${g.blank} sin responder: revisa si fue falta de tiempo o de contenido, y practica administrar el tiempo.`);
  if(pc('easy')!==null&&pc('easy')<.7)recs.push('🧱 Refuerza lo básico (preguntas fáciles) antes de subir de dificultad.');
  else if(pc('easy')>=.8&&((pc('medium')??1)<.6||(pc('hard')??1)<.6))recs.push('🪜 Dominas lo básico: sube gradualmente a dificultad media y difícil.');
  recs.push(g.pct>=80?'🚀 Buen resultado: prueba un formato más largo (30 o 60 preguntas).':g.pct<60?'🎯 Haz una Mini PAES de 15 enfocada en tus temas débiles.':'🔁 Mantén la práctica diaria y vuelve a rendir en unos días para medir avance.');
  recs.push('📖 Lee la explicación de cada error: entender el razonamiento rinde más que repetir.');
  return {level:lvl,weak,strong,byDiff:bd,recs,summary:`Nivel de práctica: ${lvl} (${g.pct}% de aciertos${mins?`, ${mins} min`:''}). Es un resultado de entrenamiento, no un puntaje PAES.`};
}
