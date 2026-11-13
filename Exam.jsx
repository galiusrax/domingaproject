import {useState,useEffect,useRef} from 'react';
import {SUBJECTS,pickQuestions,grade,xpFor,touchDaily,today} from './engine.js';
import {diagnose} from './modules.js';
const Bar=({pct})=><div className="bar" role="progressbar" aria-valuenow={pct}><i style={{width:Math.min(100,pct)+'%'}}/></div>;
export default function Exam({bank,s,commit}){
  const [cfg,setCfg]=useState({subject:bank[0]?.subject||'m1',n:15,difficulty:'',revision:false});
  const [run,setRun]=useState(null),[res,setRes]=useState(null),mark=useRef(0);
  const begin=(qs,retry=false)=>{mark.current=Date.now();setRun({qs,i:0,ans:{},flag:{},times:{},t0:Date.now(),retry});setRes(null);window.scrollTo(0,0);};
  const start=()=>{const qs=pickQuestions(bank,{...cfg,difficulty:cfg.difficulty||undefined,answered:Object.keys(s.answered)});
    if(!qs.length)return alert('No hay preguntas disponibles con este filtro. Importa un banco en «Banco» o activa el modo revisión.');begin(qs);};
  const bump=r=>{const now=Date.now(),id=r.qs[r.i].id;const times={...r.times,[id]:(r.times[id]||0)+now-mark.current};mark.current=now;return {...r,times};};
  const go=i=>{if(run&&i>=0&&i<run.qs.length)setRun({...bump(run),i});};
  const choose=id=>setRun({...run,ans:{...run.ans,[run.qs[run.i].id]:id}});
  useEffect(()=>{if(!run)return;const h=e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;const q=run.qs[run.i],k='abcde'.indexOf(e.key.toLowerCase());
    if(e.key.length===1&&k>=0&&k<q.alternatives.length)choose(q.alternatives[k].id);else if(e.key==='ArrowRight')go(run.i+1);else if(e.key==='ArrowLeft')go(run.i-1);};
    window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);});
  const finish=()=>{if(!confirm('¿Entregar la prueba?'))return;const r=bump(run),g=grade(r.qs,r.ans),mins=Math.round((Date.now()-r.t0)/6e4);
    const prev=s.history.filter(h=>h.subject===cfg.subject).slice(-1)[0];
    const d=diagnose({qs:r.qs,ans:r.ans,times:r.times,prev,bank,answered:s.answered});
    const answered={...s.answered};r.qs.forEach(q=>{if(r.ans[q.id])answered[q.id]=r.ans[q.id]===q.correctAnswer;});
    if(r.retry){commit({...s,answered});setRes({g,qs:r.qs,ans:r.ans,xp:0,d,retry:true});setRun(null);return;}
    const xp=xpFor({correct:g.correct,total:g.total-g.blank,finished:true});
    commit({...touchDaily(s,g.total-g.blank,xp,mins),answered,log:[...s.log,...r.qs.filter(q=>r.ans[q.id]).map(q=>({s:cfg.subject,t:q.topic,d:q.difficulty,ok:r.ans[q.id]===q.correctAnswer,date:today()}))],
      history:[...s.history,{date:today(),subject:cfg.subject,n:g.total,correct:g.correct,pct:g.pct,mins,xp,level:d.level}]});
    setRes({g,qs:r.qs,ans:r.ans,xp,d});setRun(null);};
  if(res){const {g,d}=res,failed=res.qs.filter(q=>res.ans[q.id]!==q.correctAnswer);
    return <main><div className="card"><h2>📋 Resultados{res.retry?' (repaso)':''}</h2><p>✅ {g.correct} correctas · ❌ {g.wrong} incorrectas · ⬜ {g.blank} sin responder · {g.pct}%{res.xp?` · ⚡ +${res.xp} XP`:''}</p><Bar pct={g.pct}/></div>
    <div className="card"><h2>🩺 Diagnóstico: {d.level}</h2><p className="dim">Es rendimiento en esta práctica, no un puntaje PAES.</p>
      {d.findings.map((f,i)=><p key={i}>🔎 {f}</p>)}
      {d.topics.map(t=><div key={t.k}><p>{t.pct>=80?'🟢':t.pct>=50?'🟡':'🔴'} {t.k}: {t.c}/{t.t}</p><Bar pct={t.pct}/></div>)}</div>
    <div className="card"><h2>💡 Recomendaciones</h2>{d.recs.map((r,i)=><p key={i}>👉 {r}</p>)}
      <p className="row">{failed.length>0&&<button onClick={()=>begin(failed.map(q=>({...q})),true)}>🔁 Repetir las {failed.length} falladas</button>}<button onClick={()=>setRes(null)}>Cerrar</button></p></div>
    {res.qs.map((q,k)=>{const a=res.ans[q.id],ok=a===q.correctAnswer;return <div className="card" key={q.id}><b>{k+1}. {q.question}</b><p className={ok?'ok':'bad'}>{ok?'✅':a?'❌':'⬜'} Tu respuesta: {a??'—'} · Correcta: {q.correctAnswer}</p><p className="dim">{q.explanation||'Solo clave del solucionario; sin explicación redactada.'}</p></div>;})}</main>;}
  if(run){const q=run.qs[run.i];return <main><div className="card"><b>Pregunta {run.i+1} de {run.qs.length}{run.retry?' · repaso':''}</b><Bar pct={Math.round(Object.keys(run.ans).length/run.qs.length*100)}/>
    <p>{q.question}</p>{q.alternatives.map((a,k)=><button key={a.id} className={'alt'+(run.ans[q.id]===a.id?' sel':'')} onClick={()=>choose(a.id)}>{'ABCDE'[k]}. {a.text}</button>)}
    <div className="row"><button disabled={!run.i} onClick={()=>go(run.i-1)}>◀️ Anterior</button><button disabled={run.i===run.qs.length-1} onClick={()=>go(run.i+1)}>Siguiente ▶️</button>
      <button onClick={()=>setRun({...run,flag:{...run.flag,[q.id]:!run.flag[q.id]}})}>{run.flag[q.id]?'⚑ Quitar marca':'⚐ Marcar'}</button><button onClick={finish}>🏁 Entregar</button></div>
    <p className="row">{run.qs.map((x,k)=><button key={x.id} className={k===run.i?'on':''} onClick={()=>go(k)}>{k+1}{run.flag[x.id]?'⚑':run.ans[x.id]?'•':''}</button>)}</p>
    <p className="dim">Teclado: A–E responden, ← → navegan.</p></div></main>;}
  return <main><div className="card"><h2>📝 Pruebas PAES de práctica</h2><div className="row">
    <select value={cfg.subject} onChange={e=>setCfg({...cfg,subject:e.target.value})}>{Object.entries(SUBJECTS).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select>
    <select value={cfg.n} onChange={e=>setCfg({...cfg,n:+e.target.value})}><option value={15}>Mini PAES (15)</option><option value={30}>PAES Intermedia (30)</option><option value={60}>PAES Intensiva (60)</option></select>
    <select value={cfg.difficulty} onChange={e=>setCfg({...cfg,difficulty:e.target.value})}><option value="">Todas las dificultades</option><option value="easy">Fácil</option><option value="medium">Media</option><option value="hard">Difícil</option></select>
    <label><input type="checkbox" checked={cfg.revision} onChange={e=>setCfg({...cfg,revision:e.target.checked})}/> Modo revisión</label><button onClick={start}>⚡ Generar prueba</button></div>
    <p className="dim">Formatos de entrenamiento propios; no replican la extensión oficial de la PAES.</p></div></main>;
}
