// "오늘 말해볼 건!" 카드: 가운데에 카드 3장(1행 3열), 번호 + 핵심 키워드만. 제목은 한 글자씩 타이핑, 카드는 하나씩 올라오고 키워드는 블러 인.
// 사용: node 목차만들기.js → 목차/프레임NNN.png + 길이.json (조립: node 조립_범용.js 목차 목차샘플.mp4)
const fs=require('fs'),path=require('path'),{execFile}=require('child_process');
const E='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',D=__dirname,OUT=path.join(D,'목차');
const IMG='../../../../img/p/';
const TITLE='오늘 말해볼 건!';
const CARDS=[{k:'더 바자르',img:'chest'},{k:'덩치',img:'bear'},{k:'롤백',img:'ev_fairy'}];
const C=4;
const clip=`polygon(0 ${C}px,${C}px ${C}px,${C}px 0,calc(100% - ${C}px) 0,calc(100% - ${C}px) ${C}px,100% ${C}px,100% calc(100% - ${C}px),calc(100% - ${C}px) calc(100% - ${C}px),calc(100% - ${C}px) 100%,${C}px 100%,${C}px calc(100% - ${C}px),0 calc(100% - ${C}px))`;
const bev=(hi,mid,lo,t=5,b=7)=>`background:linear-gradient(${hi} 0 ${t}px,${mid} ${t}px calc(100% - ${b}px),${lo} calc(100% - ${b}px))`;
const css=`html{zoom:2}html,body{margin:0;width:960px;height:540px;overflow:hidden;font-family:"Malgun Gothic",sans-serif;color:#fff;background:#17141d}
.rays{position:absolute;inset:0;background:repeating-conic-gradient(from var(--a,0deg) at 50% 58%,#221c30 0 7.5deg,#17141d 7.5deg 15deg)}
.vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 55%,transparent 40%,#0b0910 100%)}
.st{position:absolute;background:#ffe08a;display:block}
.fr{filter:drop-shadow(0 6px 0 #0a0810)}.fr>.o{background:#000;padding:5px;clip-path:${clip}}.fr .i{clip-path:${clip}}
.ttl{position:absolute;left:0;right:0;top:40px;display:flex;justify-content:center}
.ttl .i{${bev('#ffe08a','#f2c23c','#c99a1e',7,10)};color:#3a2410;font-weight:bold;font-size:44px;padding:8px 40px 16px;-webkit-text-stroke:1.5px currentColor;letter-spacing:2px;min-width:420px;text-align:center;box-sizing:border-box}
.row{position:absolute;left:0;right:0;top:140px;display:flex;justify-content:center;gap:28px}
.card{width:240px}
.card .i{${bev('#6a5d8c','#463e60','#2a2539',7,10)};height:290px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;box-sizing:border-box;padding:18px 10px 24px}
.nb{width:50px;height:50px;${bev('#ffe08a','#f2c23c','#c99a1e',5,6)};color:#3a2410;font-weight:bold;font-size:30px;text-align:center;line-height:42px;border:4px solid #000;box-sizing:border-box}
.ic{height:92px;image-rendering:pixelated}
.kw{font-size:36px;font-weight:bold;-webkit-text-stroke:1.2px currentColor;text-shadow:0 4px 0 #000,3px 0 #000,-3px 0 #000,0 -3px 0 #000;text-align:center}
.cur{display:inline-block;width:4px;height:0.9em;margin-left:2px;vertical-align:-0.1em;background:currentColor}`;
const star=(x,y,s=6)=>`<i class="st" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;box-shadow:${s}px 0 #ffe08a,-${s}px 0 #ffe08a,0 ${s}px #ffe08a,0 -${s}px #ffe08a"></i>`;
const STARS=[[70,70,6],[880,80,6],[60,330,5],[900,320,6],[480,24,5]];
const u=p=>'file:///'+p.split(path.sep).join('/');
fs.mkdirSync(OUT,{recursive:true});
const RISE=[{dy:24,op:0.35},{dy:12,op:0.75},{dy:0,op:1}];
const BLUR=[{b:14,o:0.25},{b:8,o:0.55},{b:3,o:0.85},{b:0,o:1}];
// st: title n글자 / cards: 각 카드 상태 null(없음) | {rise, blur}
function html(tw,tn,cur,cards,ang){
  const stars=STARS.map(([x,y,s],i)=>(i+tw)%2?star(x,y,s):'').join('');
  const tt=[...TITLE].slice(0,tn).join('')+(cur?'<span class="cur"></span>':'');
  const ttl=tn>0?`<div class="ttl"><div class="fr"><div class="o"><div class="i">${tt}</div></div></div></div>`:'';
  const cs=cards.map((c,j)=>{if(!c)return `<div class="card" style="visibility:hidden"><div class="fr"><div class="o"><div class="i"></div></div></div></div>`;
    const r=c.rise||{dy:0,op:1},b=c.blur||{b:0,o:1};
    return `<div class="card" style="transform:translateY(${r.dy}px);opacity:${r.op}"><div class="fr"><div class="o"><div class="i"><div class="nb">${j+1}</div><img class="ic" src="${IMG}${CARDS[j].img}.png"><div class="kw" style="filter:blur(${b.b}px);opacity:${b.o}">${CARDS[j].k}</div></div></div></div></div>`}).join('');
  return `<!doctype html><meta charset="utf-8"><style>${css}</style><div class="rays" style="--a:${ang}deg"></div><div class="vig"></div>${stars}${ttl}<div class="row">${cs}</div>`;
}
const jobs=[],dur=[];let a=0;
const none=[null,null,null];
// 제목 타이핑
const TL=[...TITLE].filter(c=>c!==' ').length;
for(let n=1;n<=[...TITLE].length;n++){jobs.push([n%2,n,n<[...TITLE].length,none.slice(),a+=0.5]);dur.push(0.06)}
dur[dur.length-1]=0.5;
// 카드 1→2→3: 올라옴(키워드는 아직 흐림) → 블러 인
const state=[null,null,null];
for(let j=0;j<3;j++){
  for(const r of RISE){state[j]={rise:r,blur:{b:14,o:0.2}};jobs.push([j%2,[...TITLE].length,false,state.map(x=>x&&{...x}),a+=0.5]);dur.push(0.07)}
  for(const b of BLUR){state[j]={rise:{dy:0,op:1},blur:b};jobs.push([(j+1)%2,[...TITLE].length,false,state.map(x=>x&&{...x}),a+=0.5]);dur.push(b.b===0?0.55:0.07)}
}
for(let r=0;r<4;r++){jobs.push([r%2,[...TITLE].length,false,state.map(x=>({...x})),a+=0.5]);dur.push(r<3?0.5:2.5)}   // 다 나온 뒤 별이 반짝
fs.writeFileSync(path.join(OUT,'길이.json'),JSON.stringify(dur));
(async()=>{let next=0;const worker=async()=>{while(next<jobs.length){const j=next++;const q=jobs[j];const n=String(j+1).padStart(3,'0'),h=path.join(OUT,`m${n}.html`);fs.writeFileSync(h,html(...q));
 await new Promise(r=>execFile(E,['--headless','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=1920,1080','--screenshot='+path.join(OUT,`프레임${n}.png`),u(h)],()=>{fs.unlinkSync(h);r()}))}};
await Promise.all(Array.from({length:4},worker));console.log('frames',jobs.length,'sec',dur.reduce((x,y)=>x+y,0).toFixed(1))})();
