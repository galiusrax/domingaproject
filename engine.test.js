import {describe,it,expect} from 'vitest';
import {validateBatch,pickQuestions,grade,levelFor,xpFor,touchDaily,defaultState,today,importBackup,loadState,progressPct} from '../src/engine.js';
const mk=(i,o={})=>({id:'M1-'+i,subject:'m1',topic:'Álgebra',difficulty:'easy',question:'Pregunta '+i,alternatives:['A','B','C','D'].map(id=>({id,text:id+i})),correctAnswer:'B',explanation:'x',source:'original',...o});
describe('engine',()=>{
 it('acepta fuente externa sin explicación',()=>{expect(validateBatch([mk(9,{source:'external',explanation:undefined})]).ok).toHaveLength(1);});
 it('detecta duplicados e inválidas',()=>{const r=validateBatch([mk(1),mk(1),mk(2,{question:'pregunta 1'}),mk(3,{explanation:''}),mk(4,{correctAnswer:'Z'})]);expect(r.ok).toHaveLength(1);expect(r.errors).toHaveLength(4);});
 it('no repite respondidas y conserva la correcta',()=>{const b=[1,2,3,4].map(i=>mk(i));const p=pickQuestions(b,{subject:'m1',n:10,answered:['M1-1']});expect(p.map(q=>q.id)).not.toContain('M1-1');expect(p).toHaveLength(3);p.forEach(q=>expect(q.alternatives.some(a=>a.id===q.correctAnswer)).toBe(true));expect(pickQuestions(b,{subject:'m1',n:10,answered:['M1-1'],revision:true})).toHaveLength(4);});
 it('califica',()=>{const qs=[mk(1),mk(2),mk(3)];const g=grade(qs,{'M1-1':'B','M1-2':'A'});expect(g).toMatchObject({correct:1,wrong:1,blank:1,pct:33});});
 it('XP y niveles',()=>{expect(xpFor({correct:3,total:5,finished:true})).toBe(54);expect(levelFor(0).name).toBe('Aprendiz');expect(levelFor(600).name).toBe('Proyectista');expect(levelFor(99999).pct).toBe(100);});
 it('racha y meta diaria usan fecha de Chile',()=>{let s=touchDaily(defaultState(),5,50,0,new Date('2026-03-10T15:00:00Z'));s=touchDaily(s,2,20,0,new Date('2026-03-11T15:00:00Z'));expect(s.streak.count).toBe(2);expect(s.daily['2026-03-11'].questions).toBe(2);expect(today(new Date('2026-03-11T02:00:00Z'))).toBe('2026-03-10');});
 it('persistencia y respaldo',()=>{const m={};const st={getItem:k=>m[k]??null,setItem:(k,v)=>{m[k]=v}};m['dominga.v1']='{rota';expect(loadState(st).xp).toBe(0);expect(()=>importBackup('{}')).toThrow();expect(importBackup(JSON.stringify({xp:5,history:[]})).xp).toBe(5);});
 it('avance hacia la meta',()=>{expect(progressPct(500,800,650)).toBe(50);});
});
