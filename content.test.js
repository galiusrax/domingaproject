import {describe,it,expect} from 'vitest';
import fs from 'fs';
import {validateBatch,parseImport,diagnose,grade} from '../src/engine.js';
const dir='src/data/',all=fs.readdirSync(dir).filter(f=>f.endsWith('.json')).flatMap(f=>JSON.parse(fs.readFileSync(dir+f,'utf8')));
describe('contenido',()=>{
 it('todo el banco es válido, sin duplicados y con la clave dentro de las alternativas',()=>{const r=validateBatch(all);expect(r.errors).toEqual([]);expect(all.filter(q=>q.source==='original').length).toBeGreaterThanOrEqual(35);});
 it('las originales siempre tienen explicación y 4+ alternativas',()=>{all.filter(q=>q.source==='original').forEach(q=>{expect(q.explanation.length).toBeGreaterThan(10);expect(q.alternatives.length).toBeGreaterThanOrEqual(4);});});
 it('importa CSV con comillas, ; y fuente por defecto externa',()=>{const csv='id;asignatura;tema;dificultad;pregunta;a;b;c;d;correcta;explicacion\nX-1;m1;Álgebra;easy;"¿2+2; o más?";3;4;5;6;B;Suma\n';const q=parseImport(csv,'a.csv');expect(q).toHaveLength(1);expect(q[0].question).toBe('¿2+2; o más?');expect(q[0].source).toBe('external');expect(validateBatch(q).ok).toHaveLength(1);});
 it('importa JSON en lista o {questions}',()=>{expect(parseImport(JSON.stringify({questions:[{id:'a'}]}),'x.json')).toHaveLength(1);expect(()=>parseImport('{"a":1}','x.json')).toThrow();});
 it('diagnóstico señala temas débiles y da recomendaciones',()=>{const qs=all.filter(q=>q.subject==='m1').slice(0,4);const ans={};qs.forEach((q,i)=>{if(i<1)ans[q.id]=q.correctAnswer;else if(i<3)ans[q.id]=q.alternatives.find(a=>a.id!==q.correctAnswer).id;});const d=diagnose(grade(qs,ans),qs,ans,5);expect(d.level).toBe('Inicial');expect(d.recs.length).toBeGreaterThan(2);expect(d.recs.join()).toMatch(/sin responder/);expect(d.weak.length).toBeGreaterThan(0);});
});
