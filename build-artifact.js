// 프로토타입 폴더 → 아티팩트용 폴더 (문서 뼈대 태그 제거, 작은 초상화 이미지 복사)
const fs=require('fs'),path=require('path');
const src=process.argv[2],out=process.argv[3];
fs.mkdirSync(out,{recursive:true});
let h=fs.readFileSync(path.join(src,'index.html'),'utf8');
h=h.replace(/<!doctype html>\s*/i,'').replace(/<html[^>]*>\s*/i,'').replace(/<\/html>\s*/i,'')
 .replace(/<head>\s*/i,'').replace(/<\/head>\s*/i,'').replace(/<body>\s*/i,'').replace(/<\/body>\s*/i,'')
 .replace(/<meta charset[^>]*>\s*/i,'').replace(/<meta name="viewport"[^>]*>\s*/i,'')
 .replace(/(<\/title>)/i,'$1\n<meta name="claude:viewport-fit-sides" content="cover">');
fs.writeFileSync(path.join(out,'index.html'),h);
for(const f of ['data.js','engine.js','fx.js'])if(fs.existsSync(path.join(src,f)))fs.copyFileSync(path.join(src,f),path.join(out,f));
// img/s(예전 그림)와 img/p(픽셀 그림)를 복사해요
const copied={};
for(const sub of ['s','p']){const d=path.join(src,'img',sub),o=path.join(out,'img',sub);if(!fs.existsSync(d))continue;fs.mkdirSync(o,{recursive:true});copied[sub]=0;for(const f of fs.readdirSync(d))if(f.endsWith('.png')){fs.copyFileSync(path.join(d,f),path.join(o,f));copied[sub]++;}}
{const d=path.join(src,'img','fx'),o=path.join(out,'img','fx');if(fs.existsSync(d)){fs.mkdirSync(o,{recursive:true});copied.fx=0;for(const f of fs.readdirSync(d))if(/.(png|json|txt)$/.test(f)){fs.copyFileSync(path.join(d,f),path.join(o,f));copied.fx++;}}}
console.log('built',fs.readdirSync(out),copied);
