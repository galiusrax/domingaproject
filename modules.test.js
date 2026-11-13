import {describe,it,expect} from 'vitest';
import {diagnose,generatePlan,checkAchievements,recommendations,recordGame,gameQuestions,upsert,newEvent,daysUntil,weekStart} from '../src/modules.js';
import {defaultState} from '../src/engine.js';
const sc=Object.fromEntries(['lectora','m1','m2','ciencias','historia'].map(k=>[k,{init:500,target:k==='m2'?900:600}]));
const mkq=i=>({id:'q'+i,subject:'m1',topic:'T',difficulty:'easy',question:'p'+i,alternatives:['A','B','C','D'].map(id=>({id,text:id})),correctAnswer:'A'});
describe('modules',()=>{
 it('plan: solo días elegidos, prioriza mayor brecha y no excede',()=>{const p=generatePlan({scores:sc,log:[],studyDays:[1,3,5],goal:15,start:'2026-03-09'});expect(p).toHaveLength(3);expect(p[0].subject).toBe('m2');p.forEach(e=>expect(e.duration).toBeLessThanOrEqual(90));});
 it('plan: el rendimiento débil sube prioridad',()=>{const log=Array.from({length:5},()=>({s:'historia',t:'X',d:'easy',ok:false,date:'2026-03-01'}));expect(generatePlan({scores:Object.fromEntries(Object.keys(sc).map(k=>[k,{init:500,target:600}])),log,studyDays:[1],goal:15,start:'2026-03-09'})[0].subject).toBe('historia');});
 it('logros: se premian una sola vez',()=>{let s={...defaultState(),log:[{s:'m1',t:'a',d:'easy',ok:true}]};const a=checkAchievements(s,'2026-03-10');expect(a.achievements['primera-piedra']).toBe('2026-03-10');expect(a.xp).toBe(10);expect(checkAchievements(a,'2026-03-11').xp).toBe(10);});
 it('recomendaciones requieren datos suficientes',()=>{expect(recommendations([{s:'m1',t:'a',ok:false}])).toEqual([]);const l=[0,1,2].map(()=>({s:'m1',t:'a',ok:false}));expect(recommendations(l)[0].kind).toBe('reforzar');});
 it('juegos: récord, XP y sin repetición',()=>{const s=recordGame(defaultState(),{mode:'racha',subject:'m1',score:4,correct:4,total:5});expect(s.xp).toBe(20);expect(s.games.records['racha:m1']).toBe(4);expect(recordGame(s,{mode:'racha',subject:'m1',score:2,correct:2,total:3}).games.records['racha:m1']).toBe(4);
  const q=gameQuestions(Array.from({length:30},(_,i)=>mkq(i)),'m1','racha');expect(new Set(q.map(x=>x.id)).size).toBe(q.length);expect(gameQuestions([],'m1','racha')).toEqual([]);
  const b=Array.from({length:30},(_,i)=>mkq(i));expect(gameQuestions(b,'m1','diario','2026-03-10').map(x=>x.id)).toEqual(gameQuestions(b,'m1','diario','2026-03-10').map(x=>x.id));});
 it('calendario: upsert y persistencia en JSON',()=>{const e=newEvent({title:'a'});let ev=upsert([],e);ev=upsert(ev,{...e,done:true});expect(ev).toHaveLength(1);expect(JSON.parse(JSON.stringify(ev))[0].done).toBe(true);expect(daysUntil('2026-03-20','2026-03-10')).toBe(10);expect(weekStart('2026-03-11')).toBe('2026-03-09');});
 it('diagnóstico: tema débil, preguntas rápidas y datos insuficientes',()=>{
  const q=(i,t)=>({...mkq(i),topic:t});const qs=[q(1,'X'),q(2,'X'),q(3,'X'),q(4,'Y'),q(5,'Y')];
  const ans={q1:'B',q2:'B',q3:'B',q4:'A',q5:'A'};const times=Object.fromEntries(qs.map(x=>[x.id,5000]));
  const d=diagnose({qs,ans,times,bank:[...qs,q(9,'X')],answered:{}});
  expect(d.level).toBe('En desarrollo'.replace('En desarrollo','En desarrollo'));expect(d.pct).toBe(40);
  expect(d.recs.some(r=>r.includes('«X»')&&r.includes('sin ver'))).toBe(true);expect(d.recs.some(r=>r.includes('rápidas'))).toBe(true);
  expect(d.findings[0]).toMatch(/pocas preguntas/);
  expect(diagnose({qs:[],ans:{}}).pct).toBe(0);});
});
