import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';import {viteSingleFile} from 'vite-plugin-singlefile';import fs from 'fs';
const uri=f=>'data:image/png;base64,'+fs.readFileSync('public/'+f).toString('base64');
// En el HTML de un solo archivo los íconos se incrustan como data URI (no hay archivos al lado).
const inlineIcons={name:'inline-icons',transformIndexHtml:{order:'post',handler:h=>h.replace(/<link rel="manifest"[^>]*>/,'').replace(/<link rel="shortcut icon"[^>]*>/,'').replace(/href="(?:\.)?\/?(favicon-32|favicon-16|apple-touch-icon)\.png"/g,(_,n)=>`href="${uri(n+'.png')}"`)}};
export default defineConfig({plugins:[react(),viteSingleFile(),inlineIcons],base:'./',build:{outDir:'dist-single'}});
