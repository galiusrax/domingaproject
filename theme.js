export const PRESETS={azul:{name:'🔵 Plano azul',accent:'#4fd1e8',bg:'#0a1a33'},matrix:{name:'🟢 Matrix',accent:'#39ff88',bg:'#06140d'},ambar:{name:'🟠 Ámbar',accent:'#ffb347',bg:'#1a1206'},neon:{name:'🟣 Neón',accent:'#ff4fd8',bg:'#12062a'},papel:{name:'⚪ Papel técnico',accent:'#0b5fa5',bg:'#eef3f9'}};
export const DEFAULT={accent:'#4fd1e8',bg:'#0a1a33',fx:true};
const KEY='dominga.theme',isHex=h=>/^#[0-9a-f]{6}$/i.test(h);
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const toHex=a=>'#'+a.map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');
const mix=(a,b,t)=>toHex(hex(a).map((v,i)=>v*(1-t)+hex(b)[i]*t));
const lin=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;};
const rl=h=>{const [r,g,b]=hex(h);return .2126*lin(r)+.7152*lin(g)+.0722*lin(b);};
export const contrast=(a,b)=>{const x=rl(a),y=rl(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
export function derive(accent,bg){
  const light=rl(bg)>.4;
  return {'--bg':bg,'--line':accent,'--rgb':hex(accent).join(','),'--hi':light?accent:mix(accent,'#ffffff',.55),
    '--panel':light?mix(bg,'#ffffff',.6):mix(bg,'#ffffff',.07),'--deep':light?mix(bg,'#000000',.06):mix(bg,'#000000',.35),
    '--hov':mix(bg,accent,light?.18:.3),'--navbg':`rgba(${hex(bg).join(',')},.95)`,
    '--ink':light?'#0b1b2e':'#e8f1fb','--dim':light?'#4a5f78':'#8fa9c8','--ok':light?'#0a7a45':'#5be0a0','--bad':light?'#b3261e':'#ff7a7a'};
}
export function applyTheme(t,root=document.documentElement){
  const th={...DEFAULT,...t};
  for(const [k,v] of Object.entries(derive(isHex(th.accent)?th.accent:DEFAULT.accent,isHex(th.bg)?th.bg:DEFAULT.bg)))root.style.setProperty(k,v);
  root.classList.toggle('nofx',!th.fx);
}
export function loadTheme(store=localStorage){try{const t=JSON.parse(store.getItem(KEY));return isHex(t?.accent)&&isHex(t?.bg)?{...DEFAULT,...t}:DEFAULT;}catch{return DEFAULT;}}
export const saveTheme=(t,store=localStorage)=>{try{store.setItem(KEY,JSON.stringify(t));}catch{}};
