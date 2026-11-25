// "오늘 말해볼 건" 카드 v2: 제목 판 없음, 그림 없음. 가운데에 카드 3장(1행 3열), 번호 메달 + 핵심 키워드만. 배경 = 게임 밤 전투 화면(해 질 녘 필드 + 게임과 같은 밤 색 rgba(10,14,44,.55)).
// 사용: node 목차만들기.js → 목차/프레임NNN.png + 길이.json (조립: node 조립_범용.js 목차 목차샘플.mp4)
const fs=require('fs'),path=require('path'),{execFile}=require('child_process');
const E='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',D=__dirname,OUT=path.join(D,'목차');
const IMG='../../../../img/p/';
const KW=['더 바자르','덩치','롤백'];
const clip=`polygon(0 18px,6px 18px,6px 12px,12px 12px,12px 6px,18px 6px,18px 0,calc(100% - 18px) 0,calc(100% - 18px) 6px,calc(100% - 12px) 6px,calc(100% - 12px) 12px,calc(100% - 6px) 12px,calc(100% - 6px) 18px,100% 18px,100% calc(100% - 18px),calc(100% - 6px) calc(100% - 18px),calc(100% - 6px) calc(100% - 12px),calc(100% - 12px) calc(100% - 12px),calc(100% - 12px) calc(100% - 6px),calc(100% - 18px) calc(100% - 6px),calc(100% - 18px) 100%,18px 100%,18px calc(100% - 6px),12px calc(100% - 6px),12px calc(100% - 12px),6px calc(100% - 12px),6px calc(100% - 18px),0 calc(100% - 18px))`;
const bev=(hi,mid,lo,t=5,b=7)=>`background:linear-gradient(${hi} 0 ${t}px,${mid} ${t}px calc(100% - ${b}px),${lo} calc(100% - ${b}px))`;
const css=`html{zoom:2}html,body{margin:0;width:960px;height:540px;overflow:hidden;font-family:"Malgun Gothic",sans-serif;color:#fff;background:#0a0e2c}
.bg{position:absolute;left:50%;top:50%;width:1080px;height:603px;margin:-301px 0 0 -540px;image-rendering:pixelated}
.night{position:absolute;inset:0;background:rgba(10,14,44,.55)}
.vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 52%,transparent 45%,rgba(4,6,20,.65) 100%)}
.st{position:absolute;background:#ffe08a;display:block}
.row{position:absolute;left:0;right:0;top:172px;display:flex;justify-content:center;gap:26px}
.card{width:192px;position:relative}
.card .sh{filter:drop-shadow(0 8px 0 rgba(4,6,18,.9))}
.card .o{background:#000;padding:6px;clip-path:${clip}}
.card .g{padding:5px;background:#fff6e6;clip-path:${clip}}
.card .i{position:relative;height:192px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;clip-path:${clip}}
.c1 .i{${bev('#d4527f','#a63a66','#6e1f3f',8,12)}}.c2 .i{${bev('#8a62d0','#6b4aa6','#3f2a73',8,12)}}.c3 .i{${bev('#2ea89f','#1f7d78','#0f4a47',8,12)}}
.kw{font-size:29px;white-space:nowrap;font-weight:bold;text-shadow:0 3px 0 rgba(0,0,0,.75),1px 0 0 rgba(0,0,0,.6),-1px 0 0 rgba(0,0,0,.6);text-align:center;line-height:1.15;padding:0 6px;margin-top:8px}
.nb{position:absolute;left:50%;top:-15px;margin-left:-17px;width:34px;height:34px;box-sizing:border-box;background:#fff6e6;color:#4a2a14;font-weight:900;-webkit-text-stroke:0.5px currentColor;font-size:22px;text-align:center;line-height:26px;border:3px solid #000;box-shadow:inset 0 -4px 0 #ead9bd;clip-path:polygon(0 6px,4px 6px,4px 4px,6px 4px,6px 0,calc(100% - 6px) 0,calc(100% - 6px) 4px,calc(100% - 4px) 4px,calc(100% - 4px) 6px,100% 6px,100% calc(100% - 6px),calc(100% - 4px) calc(100% - 6px),calc(100% - 4px) calc(100% - 4px),calc(100% - 6px) calc(100% - 4px),calc(100% - 6px) 100%,6px 100%,6px calc(100% - 4px),4px calc(100% - 4px),4px calc(100% - 6px),0 calc(100% - 6px));z-index:2};color:#3a2410;font-weight:bold;font-size:40px;text-align:center;line-height:56px;border:5px solid #000;clip-path:polygon(0 8px,4px 8px,4px 4px,8px 4px,8px 0,calc(100% - 8px) 0,calc(100% - 8px) 4px,calc(100% - 4px) 4px,calc(100% - 4px) 8px,100% 8px,100% calc(100% - 8px),calc(100% - 4px) calc(100% - 8px),calc(100% - 4px) calc(100% - 4px),calc(100% - 8px) calc(100% - 4px),calc(100% - 8px) 100%,8px 100%,8px calc(100% - 4px),4px calc(100% - 4px),4px calc(100% - 8px),0 calc(100% - 8px));z-index:2}
.orn{position:absolute;left:50%;bottom:30px;margin-left:-5px;width:10px;height:10px;background:#fff6e6;box-shadow:-24px 0 rgba(255,246,230,.6),24px 0 rgba(255,246,230,.6),-48px 0 rgba(255,246,230,.3),48px 0 rgba(255,246,230,.3)}`;
const star=(x,y,s=6)=>`<i class="st" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;box-shadow:${s}px 0 #ffe08a,-${s}px 0 #ffe08a,0 ${s}px #ffe08a,0 -${s}px #ffe08a"></i>`;
const STARS=[[80,70,6],[870,60,8],[60,300,5],[900,300,6],[470,40,5],[250,60,4],[700,40,4]];
const u=p=>'file:///'+p.split(path.sep).join('/');
fs.mkdirSync(OUT,{recursive:true});
const RISE=[{dy:26,op:0.35},{dy:13,op:0.75},{dy:0,op:1}];
const BLUR=[{b:14,o:0.25},{b:8,o:0.55},{b:3,o:0.85},{b:0,o:1}];
function html(tw,cards){
  const stars=STARS.map(([x,y,s],i)=>star(x,y,(i+tw)%2?s:Math.max(3,Math.round(s*0.5)))).join('');
  const cs=cards.map((c,j)=>{if(!c)return `<div class="card" style="visibility:hidden"><div class="sh"><div class="o"><div class="g"><div class="i"></div></div></div></div></div>`;
    return `<div class="card c${j+1}" style="transform:translateY(${c.rise.dy}px);opacity:${c.rise.op}"><div class="nb">${j+1}</div><div class="sh"><div class="o"><div class="g"><div class="i"><div class="kw" style="filter:blur(${c.blur.b}px);opacity:${c.blur.o}">${KW[j]}</div><div class="orn"></div></div></div></div></div></div>`}).join('');
  return `<!doctype html><meta charset="utf-8"><style>${css}</style><img class="bg" src="${IMG}bg_field_dusk.png"><div class="night"></div><div class="vig"></div>${stars}<div class="row">${cs}</div>`;
}
const jobs=[],dur=[];
const state=[null,null,null];
jobs.push([0,state.slice()]);dur.push(0.5);                                   // 배경만
for(let j=0;j<3;j++){
  for(const r of RISE){state[j]={rise:r,blur:{b:14,o:0.2}};jobs.push([j%2,state.map(x=>x&&{...x})]);dur.push(0.07)}
  for(const b of BLUR){state[j]={rise:{dy:0,op:1},blur:b};jobs.push([(j+1)%2,state.map(x=>x&&{...x})]);dur.push(b.b===0?0.6:0.07)}
}
for(let r=0;r<4;r++){jobs.push([r%2,state.map(x=>({...x}))]);dur.push(r<3?0.5:2.5)}      // 다 나온 뒤 별이 반짝
fs.writeFileSync(path.join(OUT,'길이.json'),JSON.stringify(dur));
(async()=>{let next=0;const worker=async()=>{while(next<jobs.length){const j=next++;const q=jobs[j];const n=String(j+1).padStart(3,'0'),h=path.join(OUT,`m${n}.html`);fs.writeFileSync(h,html(...q));
 await new Promise(r=>execFile(E,['--headless','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=1920,1080','--screenshot='+path.join(OUT,`프레임${n}.png`),u(h)],()=>{fs.unlinkSync(h);r()}))}};
await Promise.all(Array.from({length:4},worker));console.log('frames',jobs.length,'sec',dur.reduce((x,y)=>x+y,0).toFixed(1))})();
