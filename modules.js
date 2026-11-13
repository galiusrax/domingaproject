import {SUBJECTS,today,pickQuestions} from './engine.js';
export const addDays=(d,n)=>{const x=new Date(d+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10);};
export const daysUntil=(d,now=today())=>Math.round((new Date(d+'T12:00:00Z')-new Date(now+'T12:00:00Z'))/864e5);
export const weekStart=d=>addDays(d,-((new Date(d+'T12:00:00Z').getUTCDay()+6)%7));
export const newEvent=(o={})=>({id:'ev-'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),title:'',subject:'m1',topic:'',date:today(),time:'17:00',duration:45,description:'',done:false,type:'estudio',official:false,...o});
export const eventsOn=(ev,d)=>ev.filter(e=>e.date===d).sort((a,b)=>a.time.localeCompare(b.time));
export const upsert=(ev,e)=>ev.some(x=>x.id===e.id)?ev.map(x=>x.id===e.id?e:x):[...ev,e];

export function subjectStats(log){const r={};for(const l of log){const o=(r[l.s]??={n:0,c:0});o.n++;if(l.ok)o.c++;}return r;}
export function groupStats(log,key){const r={};for(const l of log){const o=(r[l[key]]??={n:0,c:0});o.n++;if(l.ok)o.c++;}return Object.entries(r).map(([k,v])=>({k,...v,pct:Math.round(v.c/v.n*100)}));}
export function recommendations(log,min=3){
  const out=groupStats(log.map(l=>({...l,t:SUBJECTS[l.s]+' · '+l.t})),'t').filter(x=>x.n>=min);
  if(!out.length)return [];
  return out.sort((a,b)=>a.pct-b.pct).map(x=>x.pct<60?{kind:'reforzar',text:`Reforzar ${x.k} (${x.pct}% en ${x.n} preguntas)`}:x.pct>=85?{kind:'dominado',text:`Dominado: ${x.k} (${x.pct}%)`}:null).filter(Boolean);
}
// Plan semanal: reparte sesiones según brecha inicial→meta y rendimiento medido. Sin datos, pesa solo la brecha.
export function generatePlan({scores,log,studyDays,goal,start,subjects=Object.keys(SUBJECTS)}){
  const st=subjectStats(log),minutes=Math.max(20,Math.min(90,goal*2));
  const w=Object.fromEntries(subjects.map(k=>{const gap=Math.max(0,scores[k].target-scores[k].init)/300,s=st[k];const weak=s&&s.n>=3?1-s.c/s.n:0.5;return [k,gap+weak];}));
  const given=Object.fromEntries(subjects.map(k=>[k,0])),ev=[];
  for(let i=0;i<7;i++){const d=addDays(start,i),dow=new Date(d+'T12:00:00Z').getUTCDay();if(!studyDays.includes(dow))continue;
    const k=subjects.slice().sort((a,b)=>w[b]/(given[b]+1)-w[a]/(given[a]+1))[0];given[k]++;
    const wk=groupStats(log.filter(l=>l.s===k),'t').sort((a,b)=>a.pct-b.pct)[0];
    ev.push({...newEvent({title:'Sesión de '+SUBJECTS[k],subject:k,topic:wk?wk.k:'',date:d,duration:minutes,type:'plan'}),id:`plan-${d}-${k}`});}
  return ev;
}
export const ACHIEVEMENTS=[
 ['primera-piedra','Primera Piedra','Responde tu primera pregunta',10,s=>s.log.length>=1],
 ['primer-plano','Primer Plano','Completa tu primera prueba',20,s=>s.history.length>=1],
 ['constante','Constructor Constante','Estudia 5 días seguidos',50,s=>s.streak.count>=5],
 ['meta-cumplida','Meta Cumplida','Cumple tu meta diaria',20,s=>s.profile&&(s.daily[today()]?.questions??0)>=s.profile.goal],
 ['mil','Cien preguntas','Responde 100 preguntas',60,s=>s.log.length>=100],
 ['maestria','Maestría','80% o más en 30+ preguntas de una asignatura',80,s=>Object.values(subjectStats(s.log)).some(v=>v.n>=30&&v.c/v.n>=.8)],
 ['mejora','Mejora medida','Supera tu prueba anterior en la misma asignatura',30,s=>s.history.some((h,i)=>s.history.slice(0,i).reverse().find(x=>x.subject===h.subject&&x.n>=10&&h.n>=10)?.pct<h.pct)],
 ['arcade','Récord de Arcade','Registra un récord en el Arcade',30,s=>Object.keys(s.games.records).length>=1],
];
// Desbloqueo idempotente: cada logro se premia una sola vez.
export function checkAchievements(s,now=today()){
  let xp=0;const got={...s.achievements};
  for(const [id,,,r,f] of ACHIEVEMENTS)if(!got[id]&&f(s)){got[id]=now;xp+=r;}
  return xp?{...s,achievements:got,xp:s.xp+xp}:s;
}
export const MODES={contrarreloj:'⏱️ Desafío Contrarreloj',construccion:'🏢 Construcción Perfecta',racha:'🔥 Racha de Conocimiento',duelo:'⚔️ Duelo Mental',diario:'📅 Desafío del Día'};
export const hash=str=>[...str].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
export const seeded=seed=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
export function gameQuestions(bank,subject,mode,date=today()){
  const rnd=mode==='diario'?seeded(hash(date+subject)):Math.random;
  return pickQuestions(bank,{subject,n:mode==='diario'?10:200,revision:true,rnd});
}
export function recordGame(s,{mode,subject,score,correct,total},date=today()){
  const key=mode+':'+subject,prev=s.games.records[key]??0,xp=correct*5;
  return {...s,xp:s.xp+xp,games:{records:{...s.games.records,[key]:Math.max(prev,score)},history:[...s.games.history,{mode,subject,score,correct,total,date,xp,record:score>prev}]}};
}

// Diagnóstico de una prueba: usa solo respuestas, tiempos y datos reales. Es rendimiento de práctica, no puntaje PAES.
export function diagnose({qs,ans,times={},prev,bank=[],answered={}}){
  const total=qs.length,items=qs.map(q=>({q,a:ans[q.id],ok:ans[q.id]===q.correctAnswer,sec:Math.round((times[q.id]||0)/1000)}));
  const c=items.filter(x=>x.ok).length,blank=items.filter(x=>!x.a).length,pct=total?Math.round(c/total*100):0;
  const level=pct>=80?'Avanzado':pct>=60?'Sólido':pct>=40?'En desarrollo':'Base por construir';
  const by=key=>{const m={};items.forEach(x=>{const o=(m[x.q[key]]??={k:x.q[key],c:0,t:0});o.t++;if(x.ok)o.c++;});return Object.values(m).map(o=>({...o,pct:Math.round(o.c/o.t*100)}));};
  const topics=by('topic').sort((a,b)=>a.pct-b.pct),diffs=by('difficulty'),findings=[],recs=[];
  if(total<8)findings.push('Son pocas preguntas (menos de 8): el diagnóstico es solo orientativo.');
  topics.filter(t=>t.t>=2&&t.pct<50).forEach(t=>{const n=bank.filter(q=>q.subject===qs[0].subject&&q.topic===t.k&&!(q.id in answered)).length;
    recs.push(`Refuerza «${t.k}» (${t.c}/${t.t}). `+(n?`Tienes ${n} preguntas sin ver en el banco.`:'No quedan preguntas sin ver: usa el modo revisión o importa más material.'));});
  topics.filter(t=>t.t>=2&&t.pct>=80).forEach(t=>findings.push(`Buen dominio de «${t.k}» (${t.c}/${t.t}).`));
  if(total&&blank/total>.2){findings.push(`${blank} preguntas sin responder (${Math.round(blank/total*100)}%).`);recs.push('Averigua si las dejaste en blanco por falta de tiempo o de dominio, y practica con tiempo.');}
  const easy=diffs.find(d=>d.k==='easy');if(easy&&easy.t>=3&&easy.pct<70){findings.push(`Fallaste preguntas fáciles (${easy.c}/${easy.t}).`);recs.push('Repasa los conceptos básicos antes de subir la dificultad.');}
  const timed=items.filter(x=>x.sec>0),avg=timed.length?Math.round(timed.reduce((a,x)=>a+x.sec,0)/timed.length):0;
  if(avg)findings.push(`Tiempo promedio por pregunta: ${avg} s.`);
  const wrong=items.filter(x=>x.a&&!x.ok),fast=wrong.filter(x=>x.sec&&x.sec<15);
  if(wrong.length>=3&&fast.length/wrong.length>=.5)recs.push('Muchos errores fueron respuestas rápidas (menos de 15 s): lee el enunciado completo y descarta alternativas una a una.');
  const slow=items.filter(x=>avg&&x.sec>=Math.max(90,avg*2));if(slow.length)findings.push(`${slow.length} pregunta(s) tomaron mucho más que tu promedio.`);
  if(prev&&prev.n>=8&&total>=8){const d=pct-prev.pct;findings.push(d===0?'Mismo rendimiento que tu prueba anterior.':`${d>0?'Mejoraste':'Bajaste'} ${Math.abs(d)} puntos porcentuales respecto de tu prueba anterior.`);}
  if(!recs.length)recs.push(total<8?'Haz una prueba más larga para obtener recomendaciones más precisas.':'Mantén la práctica y prueba una dificultad mayor.');
  return {level,pct,findings,recs,topics,diffs,avg,blank};
}
