// 프로토타입 폴더 → 아티팩트용 폴더 (문서 뼈대 태그 제거, 작은 초상화 이미지 복사)
const fs=require('fs'),path=require('path');
const src=process.argv[2],out=process.argv[3];
fs.mkdirSync(out,{recursive:true});
let h=fs.readFileSync(path.join(src,'index.html'),'utf8');
h=h.replace(/<!doctype html>\s*/i,'').replace(/<html[^>]*>\s*/i,'').replace(/<\/html>\s*/i,'')
 .replace(/<head>\s*/i,'').replace(/<\/head>\s*/i,'').replace(/<body>\s*/i,'').replace(/<\/body>\s*/i,'')
 .replace(/<meta charset[^>]*>\s*/i,'').replace(/<meta name="viewport"[^>]*>\s*/i,'')
 .replace(/(<\/title>)/i,'$1\n<meta name="claude:viewport-fit-sides" content="cover">');
// 작은 아이콘은 index.html 안에 묶어요: 아티팩트 한 버전의 파일 수 한도(512) 때문 (2026-11-27 사용자: "묶어서 배포")
// 코드의 'img/p/<묶음>_' + id + '.png' 를 PKI('<묶음>_' + id) 로 바꾸고, 묶은 파일은 따로 복사하지 않아요
const PACKED=/^(ult|pas|skill|up|pot)_(?!.*_v\d).*\.png$/, pack={};
for(const f of fs.readdirSync(path.join(src,'img','p')))if(PACKED.test(f))pack[f.slice(0,-4)]='data:image/png;base64,'+fs.readFileSync(path.join(src,'img','p',f)).toString('base64');
let sites=0;
h=h.replace(/img\/p\/(ult|pas|skill|up|pot)_' \+ (.+?) \+ '\.png/g,(m,g,id)=>{sites++;return "' + PKI('"+g+"_' + "+id+") + '";});
const left=h.match(/img\/p\/(ult|pas|skill|up|pot)_[^"' )<>]*\.png/g);
if(left||sites<7)throw new Error('묶기 실패: 바꾼 곳 '+sites+', 남은 경로 '+left); // 코드 모양이 바뀌면 여기서 멈춰요
// 묶은 아이콘도 로컬처럼 픽셀 부드럽게 처리(smoothImg)를 타게: data: 라서 건너뛰지 않게 해요
for(const [a,b] of [["!src || src.indexOf('data:') === 0 || src.indexOf('img/') < 0","!src || (!PKS[src] && (src.indexOf('data:') === 0 || src.indexOf('img/') < 0))"],["im.src.indexOf('data:') !== 0","(PKS[im.src] || im.src.indexOf('data:') !== 0)"]]){if(h.split(a).length!==2)throw new Error("묶기 실패(부드럽게 처리 자리): "+a);h=h.replace(a,()=>b)}
h=h.replace(/<script/,()=>'<script>var PACK='+JSON.stringify(pack)+";var PKS={};for(var k in PACK)PKS[PACK[k]]=1;function PKI(n){return PACK[n]||'img/p/'+n+'.png'}</script>\n<script");
fs.writeFileSync(path.join(out,'index.html'),h);
console.log('packed',Object.keys(pack).length,'sites',sites);
for(const f of ['data.js','engine.js','fx.js'])if(fs.existsSync(path.join(src,f)))fs.copyFileSync(path.join(src,f),path.join(out,f));
// img/s(예전 그림)와 img/p(픽셀 그림)를 복사해요
const copied={};
for(const sub of ['s','p']){const d=path.join(src,'img',sub),o=path.join(out,'img',sub);if(!fs.existsSync(d))continue;fs.mkdirSync(o,{recursive:true});copied[sub]=0;for(const f of fs.readdirSync(d))if(f.endsWith('.png')&&!(sub==='p'&&PACKED.test(f))){fs.copyFileSync(path.join(d,f),path.join(o,f));copied[sub]++;}}
{const d=path.join(src,'img','fx'),o=path.join(out,'img','fx');if(fs.existsSync(d)){fs.mkdirSync(o,{recursive:true});copied.fx=0;for(const f of fs.readdirSync(d))if(/.(png|json|txt)$/.test(f)){fs.copyFileSync(path.join(d,f),path.join(o,f));copied.fx++;}}}
console.log('built',fs.readdirSync(out),copied);
