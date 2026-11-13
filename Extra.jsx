import {useState,useEffect,useRef} from 'react';
import {SUBJECTS,today} from './engine.js';
import {addDays,daysUntil,weekStart,newEvent,eventsOn,upsert,generatePlan,recommendations,groupStats,subjectStats,ACHIEVEMENTS,MODES,gameQuestions,recordGame,checkAchievements} from './modules.js';
export {checkAchievements};
const Bar=({pct})=><div className="bar"><i style={{width:Math.min(100,pct)+'%'}}/></div>;
const DOW=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

export function Planner({s,commit}){
  const [mode,setMode]=useState('mes'),[day,setDay]=useState(today()),[ed,setEd]=useState(null);
  const days=mode==='dia'?[day]:mode==='semana'?Array.from({length:7},(_,i)=>addDays(weekStart(day),i)):(()=>{const f=day.slice(0,8)+'01',st=weekStart(f);return Array.from({length:42},(_,i)=>addDays(st,i));})();
  const save=e=>{commit({...s,events:upsert(s.events,e)});setEd(null);};
  const plan=()=>{const start=weekStart(addDays(today(),7)>day?today():today());const ev=generatePlan({scores:s.profile.scores,log:s.log,studyDays:s.studyDays,goal:s.profile.goal,start});commit({...s,events:[...s.events.filter(e=>!(e.type==='plan'&&e.date>=start&&e.date<addDays(start,7))),...ev]});};
  const step=n=>setDay(addDays(day,n*(mode==='mes'?30:mode==='semana'?7:1)));
  return <main><div className="card"><h2>🗓️ Planificador Dominga</h2>
    <div className="row"><label>Fecha de tu PAES <input type="date" value={s.examDate} onChange={e=>commit({...s,examDate:e.target.value})}/></label>{s.examDate&&<b>{daysUntil(s.examDate)>=0?`Faltan ${daysUntil(s.examDate)} días`:'Fecha pasada'}</b>}</div>
    <p className="dim">Las fechas oficiales las ingresas tú según DEMRE (marca «oficial»); no vienen preprogramadas.</p>
    <div className="row"><label>Días de estudio {DOW.map((n,i)=><label key={i}><input type="checkbox" checked={s.studyDays.includes(i)} onChange={e=>commit({...s,studyDays:e.target.checked?[...s.studyDays,i]:s.studyDays.filter(x=>x!==i)})}/>{n} </label>)}</label></div>
    <div className="row"><button onClick={plan}>Generar plan de esta semana</button><button onClick={()=>setEd(newEvent({date:day}))}>Nuevo evento</button></div>
    <p className="dim">El plan reparte sesiones según tu brecha inicial→meta y tu rendimiento medido; puedes editarlo.</p></div>
  <div className="card"><div className="row"><button onClick={()=>step(-1)}>‹</button><b>{mode==='mes'?day.slice(0,7):day}</b><button onClick={()=>step(1)}>›</button>{['mes','semana','dia'].map(m=><button key={m} className={mode===m?'on':''} onClick={()=>setMode(m)}>{m==='dia'?'Día':m[0].toUpperCase()+m.slice(1)}</button>)}</div>
    <div style={{display:'grid',gridTemplateColumns:mode==='dia'?'1fr':mode==='mes'?'repeat(7,minmax(0,1fr))':'repeat(auto-fill,minmax(110px,1fr))',gap:4,marginTop:8}}>
    {days.map(d=><div key={d} style={{border:'1px solid #1d4a7a',padding:4,minHeight:mode==='mes'?70:90,opacity:mode==='mes'&&d.slice(0,7)!==day.slice(0,7)?.4:1}}>
      <button style={{padding:'0 4px'}} onClick={()=>{setDay(d);setMode('dia');}}>{d.slice(8)}</button>
      {eventsOn(s.events,d).map(e=><div key={e.id} style={{fontSize:12,margin:'2px 0',borderLeft:'3px solid '+(e.official?'#ffd166':'var(--line)'),paddingLeft:4,textDecoration:e.done?'line-through':'none'}}>
        <span onClick={()=>setEd(e)} style={{cursor:'pointer'}}>{e.time} {e.official?'[Oficial] ':''}{e.title}{mode!=='mes'&&` · ${SUBJECTS[e.subject]||''} ${e.topic} · ${e.duration} min`}</span>
        <input type="checkbox" aria-label="Completado" checked={e.done} onChange={x=>commit({...s,events:upsert(s.events,{...e,done:x.target.checked})})}/></div>)}</div>)}</div></div>
  {ed&&<div className="card"><h2>{s.events.some(e=>e.id===ed.id)?'Editar evento':'Nuevo evento'}</h2><div className="row">
    <input placeholder="Título" value={ed.title} onChange={e=>setEd({...ed,title:e.target.value})}/>
    <select value={ed.subject} onChange={e=>setEd({...ed,subject:e.target.value})}>{Object.entries(SUBJECTS).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select>
    <input placeholder="Tema" value={ed.topic} onChange={e=>setEd({...ed,topic:e.target.value})}/>
    <input type="date" value={ed.date} onChange={e=>setEd({...ed,date:e.target.value})}/><input type="time" value={ed.time} onChange={e=>setEd({...ed,time:e.target.value})}/>
    <input type="number" min="5" step="5" value={ed.duration} onChange={e=>setEd({...ed,duration:+e.target.value})}/>
    <select value={ed.type} onChange={e=>setEd({...ed,type:e.target.value})}><option value="estudio">Estudio</option><option value="plazo">Plazo personal</option><option value="hito">Hito</option><option value="plan">Plan</option></select>
    <label><input type="checkbox" checked={ed.official} onChange={e=>setEd({...ed,official:e.target.checked})}/> Fecha oficial (DEMRE)</label>
    <input placeholder="Notas" value={ed.description} onChange={e=>setEd({...ed,description:e.target.value})}/></div>
    <p className="row"><button disabled={!ed.title.trim()} onClick={()=>save(ed)}>Guardar</button><button onClick={()=>setEd(null)}>Cancelar</button>
    {s.events.some(e=>e.id===ed.id)&&<button onClick={()=>{commit({...s,events:s.events.filter(e=>e.id!==ed.id)});setEd(null);}}>Eliminar</button>}</p></div>}</main>;
}

function Play({mode,subject,s,commit,onExit}){
  const [qs]=useState(()=>gameQuestions(s._bank,subject,mode));
  const [g,setG]=useState({i:0,correct:0,wrong:0,streak:0,best:0,floors:0,pause:false,over:false,fb:null});
  const limit=mode==='contrarreloj'?60:mode==='duelo'?90:0;const [t,setT]=useState(limit);
  const done=useRef(false);
  useEffect(()=>{if(!limit||g.over)return;const id=setInterval(()=>setT(x=>x-1),1000);return()=>clearInterval(id);},[limit,g.over]);
  useEffect(()=>{if(limit&&t<=0)setG(x=>({...x,over:true}));},[t]);
  const score=mode==='construccion'?g.floors:mode==='racha'?g.best:g.correct;
  useEffect(()=>{if(g.over&&!done.current){done.current=true;commit(recordGame(s,{mode,subject,score,correct:g.correct,total:g.correct+g.wrong}));}},[g.over]);
  const q=qs[g.i];
  const answer=a=>{if(g.pause||g.over)return;const ok=a===q.correctAnswer,n=g.i+1;
    const nx={...g,i:n,correct:g.correct+ok,wrong:g.wrong+!ok,streak:ok?g.streak+1:0,floors:g.floors+ok};nx.best=Math.max(g.best,nx.streak);
    if(mode==='racha'&&!ok)nx.over=true;if(n>=qs.length)nx.over=true;
    if(mode==='construccion'&&!ok){nx.pause=true;setTimeout(()=>setG(x=>({...x,pause:false})),3000);}
    setG(nx);};
  if(!qs.length)return <div className="card"><p>No hay preguntas importadas para {SUBJECTS[subject]}. Importa un banco en «Banco de preguntas».</p><button onClick={onExit}>Volver</button></div>;
  if(g.over||!q)return <div className="card"><h2>{MODES[mode]}: fin</h2><p>Puntaje {score} · {g.correct} correctas de {g.correct+g.wrong} · +{g.correct*5} XP</p><button onClick={onExit}>Volver al Arcade</button></div>;
  return <div className="card"><h2>{MODES[mode]}</h2><p className="dim">{limit?`Tiempo: ${Math.max(t,0)} s · `:''}Puntaje {score}{mode==='duelo'?` · tu récord ${s.games.records['duelo:'+subject]??0}`:''}{mode==='construccion'?` · Pisos: ${'▮'.repeat(g.floors)}`:''}</p>
    {g.pause&&<p className="bad">Obra detenida 3 s…</p>}<p>{q.question}</p>{q.alternatives.map((a,k)=><button key={a.id} className="alt" disabled={g.pause} onClick={()=>answer(a.id)}>{'ABCDE'[k]}. {a.text}</button>)}</div>;
}
export function Arcade({bank,s,commit}){
  const [sel,setSel]=useState(null),[subject,setSubject]=useState('m1');
  const sx={...s,_bank:bank};
  if(sel)return <main><Play key={sel} mode={sel} subject={subject} s={sx} commit={n=>{const {_bank,...c}=n;commit(c);}} onExit={()=>setSel(null)}/></main>;
  return <main><div className="card"><h2>🎮 Dominga Arcade</h2><select value={subject} onChange={e=>setSubject(e.target.value)}>{Object.entries(SUBJECTS).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select>
    <p className="dim">Los juegos usan solo tus preguntas importadas. Son desafíos personales (sin multijugador).</p>
    {Object.entries(MODES).map(([k,l])=><p key={k} className="row"><button onClick={()=>setSel(k)}>{l}</button><span className="dim">Récord: {s.games.records[k+':'+subject]??0}</span></p>)}</div>
    <div className="card"><h2>Historial de juegos</h2>{s.games.history.length?s.games.history.slice(-10).reverse().map((h,i)=><p key={i}>{h.date} · {MODES[h.mode]} · {h.score}{h.record?' (récord)':''}</p>):<p className="dim">Aún no has jugado.</p>}</div></main>;
}
export const Logros=({s})=><main><div className="card"><h2>🏆 Logros</h2>{ACHIEVEMENTS.map(([id,n,d,r])=><p key={id} style={{opacity:s.achievements[id]?1:.5}}>{s.achievements[id]?'🏆':'🔒'} <b>{n}</b> — {d} (+{r} XP){s.achievements[id]&&<span className="ok"> desbloqueado {s.achievements[id]}</span>}</p>)}</div></main>;

export function Stats({s}){
  const rec=recommendations(s.log),sub=subjectStats(s.log),wk=Array.from({length:7},(_,i)=>{const d=addDays(today(),i-6);return {d,q:s.daily[d]?.questions??0,m:s.daily[d]?.minutes??0};}),mx=Math.max(1,...wk.map(x=>x.q));
  return <><div className="card"><h2>📈 Rendimiento medido</h2><p className="dim">Es porcentaje de aciertos en práctica, no un puntaje PAES estimado.</p>
    {Object.entries(sub).map(([k,v])=><div key={k}><p>{SUBJECTS[k]}: {Math.round(v.c/v.n*100)}% ({v.n} preguntas)</p><Bar pct={v.c/v.n*100}/></div>)}
    <h2>Por dificultad</h2>{groupStats(s.log,'d').map(x=><p key={x.k}>{x.k}: {x.pct}% ({x.n})</p>)}
    <h2>Por tema</h2>{groupStats(s.log,'t').map(x=><p key={x.k}>{x.k}: {x.pct}% ({x.n})</p>)}{!s.log.length&&<p className="dim">Sin datos aún.</p>}</div>
  <div className="card"><h2>📅 Actividad semanal</h2>{wk.map(x=><p key={x.d} className="row"><span style={{width:90}}>{x.d.slice(5)}</span><span style={{flex:1}}><Bar pct={x.q/mx*100}/></span>{x.q} preg. · {x.m} min</p>)}</div>
  <div className="card"><h2>💡 Recomendaciones</h2>{rec.length?rec.map((r,i)=><p key={i} className={r.kind==='reforzar'?'bad':'ok'}>{r.text}</p>):<p className="dim">Datos insuficientes: se necesitan al menos 3 preguntas por tema.</p>}</div></>;
}
