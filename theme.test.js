import {describe,it,expect} from 'vitest';
import {derive,loadTheme,contrast,DEFAULT,PRESETS} from '../src/theme.js';
describe('tema',()=>{
 it('deriva variables válidas y tinta oscura sobre fondos claros',()=>{const d=derive('#4fd1e8','#0a1a33');expect(d['--rgb']).toBe('79,209,232');expect(d['--ink']).toBe('#e8f1fb');expect(derive('#0b5fa5','#eef3f9')['--ink']).toBe('#0b1b2e');Object.values(PRESETS).forEach(p=>expect(contrast(p.accent,p.bg)).toBeGreaterThan(3));});
 it('carga segura: datos corruptos o inválidos usan el tema por defecto',()=>{const st=v=>({getItem:()=>v});expect(loadTheme(st('{rota'))).toEqual(DEFAULT);expect(loadTheme(st('{"accent":"rojo","bg":"x"}'))).toEqual(DEFAULT);expect(loadTheme(st('{"accent":"#ff0000","bg":"#000000","fx":false}')).fx).toBe(false);});
});
