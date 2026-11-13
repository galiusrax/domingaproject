import {useState,useEffect,useMemo} from 'react';
import Exam from './Exam.jsx';
import {PRESETS,DEFAULT,loadTheme,saveTheme,applyTheme,contrast} from './theme.js';
import {Planner,Arcade,Logros,Stats,checkAchievements} from './Extra.jsx';
import {SUBJECTS,loadState,saveState,levelFor,pickQuestions,grade,xpFor,touchDaily,today,validateBatch,importBackup,parseImport,diagnose} from './engine.js';
const files = import.meta.glob('./data/*.json',{eager:true});
const baseBank = Object.values(files).flatMap(m => m.default);
const Bar = ({pct}) => <div className="bar" role="progressbar" aria-valuenow={pct}><i style={{width:pct+'%'}}/></div>;

function Setup({onDone}) {
  const [name,setName]=useState(''),[goal,setGoal]=useState(15),[year,setYear]=useState(2026);
  const [sc,setSc]=useState(Object.fromEntries(Object.keys(SUBJECTS).map(k=>[k,{init:500,target:800,official:false}])));
  const up=(k,f,v)=>setSc({...sc,[k]:{...sc[k],[f]:v}});
  return <main><div className="card"><h2>📐 Configura tu obra</h2>
    <p className="row"><label>Nombre o apodo <input value={name} onChange={e=>setName(e.target.value)}/></label> <label>Año de admisión <input type="number" value={year} onChange={e=>setYear(+e.target.value)}/></label> <label>Meta diaria (preguntas) <input type="number" min="1" value={goal} onChange={e=>setGoal(+e.target.value)}/></label></p>
    {Object.entries(SUBJECTS).map(([k,l])=><div className="row" key={k}><b style={{width:200}}>{l}</b>
      <label>Inicial <input type="number" min="100" max="1000" value={sc[k].init} onChange={e=>up(k,'init',+e.target.value)}/></label>
      <label>Meta <input type="number" min="100" max="1000" value={sc[k].target} onChange={e=>up(k,'target',+e.target.value)}/></label>
      <label><input type="checkbox" checked={sc[k].official} onChange={e=>up(k,'official',e.target.checked)}/> puntaje oficial (si no, estimado)</label></div>)}
    <p><button disabled={!name.trim()} onClick={()=>onDone({name:name.trim(),year,goal,scores:sc})}>Comenzar</button></p></div></main>;
}

function Archive({bank,s,commit}) {
  const [q,setQ]=useState(''),[msg,setMsg]=useState(null);
  const list=useMemo(()=>bank.filter(x=>!q||(x.question+x.topic+(x.tags||[]).join()).toLowerCase().includes(q.toLowerCase())),[bank,q]);
  const imp=async e=>{const all={ok:[],errors:[]};let acc=[...bank];for(const f of e.target.files){try{const r=validateBatch(parseImport(await f.text(),f.name),acc);all.ok.push(...r.ok);acc=[...acc,...r.ok];all.errors.push(...r.errors.map(x=>({...x,id:f.name+' · '+x.id})));}catch(err){all.errors.push({id:f.name,errors:[err.message]});}}commit({...s,customQuestions:[...s.customQuestions,...all.ok]});setMsg(all);e.target.value='';};
  const tpl=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['id,asignatura,tema,dificultad,pregunta,texto,a,b,c,d,e,correcta,explicacion,fuente\nM1-X-001,m1,Álgebra y funciones,medium,"Si 2x = 10, ¿cuánto vale x?",,3,4,5,10,,C,"x = 10/2 = 5",original\n'],{type:'text/csv'}));a.download='plantilla-preguntas.csv';a.click();};
  return <main><div className="card"><h2>🗂️ Dominga Question Archive ({bank.length})</h2><div className="row"><input placeholder="Buscar" value={q} onChange={e=>setQ(e.target.value)}/><label>Importar JSON <input type="file" accept=".json,.csv,.txt" multiple onChange={imp}/></label><button onClick={tpl}>⬇️ Plantilla CSV</button></div>
    {msg&&<p>{msg.ok.length} importadas. {msg.errors.map(e=><span className="bad" key={e.id}> {e.id}: {e.errors.join(', ')}.</span>)}</p>}
    {!bank.length&&<p className="dim">Aún no hay preguntas. Importa un archivo con el formato de docs/PLANTILLA.json.</p>}</div>
    {list.slice(0,50).map(x=><div className="card" key={x.id}><b>{x.id}</b> <span className="dim">{x.topic} · {x.difficulty} · {x.source}</span><p>{x.question}</p>
      <button onClick={()=>commit({...s,favorites:s.favorites.includes(x.id)?s.favorites.filter(i=>i!==x.id):[...s.favorites,x.id]})}>{s.favorites.includes(x.id)?'★ Favorita':'☆ Guardar'}</button>{s.answered[x.id]===false&&<span className="bad"> Fallada</span>}</div>)}</main>;
}

export default function App() {
  const [s,setS]=useState(loadState),[view,setView]=useState('dash');
  const commit=n=>setS(checkAchievements(n));
  const bank=useMemo(()=>[...baseBank,...s.customQuestions],[s.customQuestions]);
  useEffect(()=>{saveState(s);},[s]);
  const [theme,setTheme]=useState(loadTheme);const upd=n=>{setTheme(n);applyTheme(n);saveTheme(n);};
  if(!s.profile)return <Setup onDone={p=>commit({...s,profile:p})}/>;
  const lv=levelFor(s.xp),d=s.daily[today()]??{questions:0,xp:0,minutes:0},p=s.profile;
  const tabs=[['dash','🏗️','Obra'],['exam','📝','Pruebas'],['bank','🗂️','Banco'],['plan','🗓️','Plan'],['arcade','🎮','Arcade'],['logros','🏆','Logros'],['prog','📊','Progreso'],['cfg','⚙️','Perfil']];
  const ICONS=['🧱','📐','✏️','🔨','🏛️','🏗️','🚀'];
  const subjStats=Object.keys(SUBJECTS).map(k=>{const h=s.history.filter(x=>x.subject===k);const n=h.reduce((a,x)=>a+x.n,0),c=h.reduce((a,x)=>a+x.correct,0);return {k,n,pct:n?Math.round(c/n*100):null};});
  return <div className="app"><nav><h1 className="logo">📐 DOMINGA<br/>PROJECT</h1><small className="tag">Construye tu futuro, una pregunta a la vez.</small>{tabs.map(([k,ic,l])=><button key={k} className={'tab'+(view===k?' on':'')} onClick={()=>setView(k)}><span className="ic">{ic}</span><span className="lb">{l}</span></button>)}</nav>
  {view==='dash'&&<main><div className="card"><h2>👷 Hola, {p.name}</h2><p>🎓 Admisión {p.year} · {ICONS[lv.index]} Nivel {lv.name} · ⚡ {s.xp} XP{lv.next&&` (siguiente nivel en ${lv.next} XP)`}</p><Bar pct={lv.pct}/></div>
    <div className="card"><h2>🎯 Misión del día</h2><p>{d.questions} de {p.goal} preguntas · ⚡ {d.xp} XP hoy · 🔥 racha {s.streak.count} día(s)</p><Bar pct={Math.min(100,Math.round(d.questions/p.goal*100))}/><p className="row"><button onClick={()=>setView('exam')}>▶️ Iniciar prueba</button></p></div>
    <div className="card"><h2>🏗️ Avance de obra</h2>{subjStats.map(x=><p key={x.k}>{SUBJECTS[x.k]}: {p.scores[x.k].init} → {p.scores[x.k].target} <span className="dim">({p.scores[x.k].official?'oficial':'estimado'}) · práctica: {x.pct===null?'sin datos suficientes':x.pct+'%'}</span></p>)}</div></main>}
  {view==='plan'&&<Planner bank={bank} s={s} commit={commit}/>}
  {view==='arcade'&&<Arcade bank={bank} s={s} commit={commit}/>}
  {view==='logros'&&<Logros s={s}/>}
  {view==='exam'&&<Exam bank={bank} s={s} commit={commit}/>}
  {view==='bank'&&<Archive bank={bank} s={s} commit={commit}/>}
  {view==='prog'&&<main><div className="card"><h2>📊 Mi proyecto — progreso académico</h2><p className="dim">El porcentaje de práctica no es un puntaje PAES. No se estima puntaje oficial sin tabla de conversión.</p>
    {subjStats.map(x=><div key={x.k}><p>{SUBJECTS[x.k]}: {x.n} preguntas · {x.pct??'—'}%</p><Bar pct={x.pct??0}/></div>)}</div>
    <Stats s={s}/><div className="card"><h2>🕘 Historial</h2>{s.history.length?s.history.slice().reverse().map((h,i)=><p key={i}>{h.date} · {SUBJECTS[h.subject]||h.subject} · {h.correct}/{h.n} ({h.pct}%){h.level?' · '+h.level:''}</p>):<p className="dim">Aún no has rendido pruebas.</p>}</div></main>}
  {view==='cfg'&&<main><div className="card"><h2>🎨 Colores de la interfaz</h2><div className="row">{Object.entries(PRESETS).map(([k,v])=><button key={k} className={theme.accent===v.accent&&theme.bg===v.bg?'on':''} onClick={()=>upd({...theme,accent:v.accent,bg:v.bg})}>{v.name}</button>)}</div>
    <p className="row"><label>Color de acento <input type="color" value={theme.accent} onChange={e=>upd({...theme,accent:e.target.value})}/></label><label>Color de fondo <input type="color" value={theme.bg} onChange={e=>upd({...theme,bg:e.target.value})}/></label></p>
    {contrast(theme.accent,theme.bg)<3&&<p className="bad">⚠️ Poco contraste entre acento y fondo: puede costar leer. Prueba otra combinación.</p>}
    <label><input type="checkbox" checked={theme.fx} onChange={e=>upd({...theme,fx:e.target.checked})}/> ✨ Efectos (parpadeo y líneas de escaneo)</label>
    <p className="row"><button onClick={()=>upd(DEFAULT)}>↩️ Restablecer colores</button></p><p className="dim">Se guarda en este dispositivo.</p></div><div className="card"><h2>💾 Respaldo</h2><p className="dim">Tus datos viven solo en este navegador; no se sincronizan entre dispositivos.</p><div className="row">
    <button onClick={()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(s)],{type:'application/json'}));a.download=`dominga-${today()}.json`;a.click();}}>Exportar</button>
    <label>Importar <input type="file" accept=".json" onChange={async e=>{try{commit(importBackup(await e.target.files[0].text()));}catch(err){alert(err.message);}}}/></label>
    <button onClick={()=>confirm('¿Borrar todo el progreso?')&&commit({...s,xp:0,answered:{},favorites:[],history:[],daily:{},streak:{last:null,count:0},profile:null})}>Reiniciar</button></div></div></main>}</div>;
}
