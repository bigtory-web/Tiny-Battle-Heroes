// 훅 카드 3안: 캐릭터·꼬리 없이 대사를 판이 감싸고, 주변을 게임 영웅·유물로 꾸밈. 배경은 게임 해 질 녘 필드. 글자 연출은 스크램블.
// 사용: node 훅만들기3.js → 훅3/프레임NNN.png + 길이.json (조립: node 조립_범용.js 훅3 훅3샘플.mp4)
const fs=require('fs'),path=require('path'),{execFile}=require('child_process');
const E='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',D=__dirname,OUT=path.join(D,'훅3');
const IMG='../../../../img/p/';
const clip='polygon(0 16px,8px 16px,8px 8px,16px 8px,16px 0,calc(100% - 16px) 0,calc(100% - 16px) 8px,calc(100% - 8px) 8px,calc(100% - 8px) 16px,100% 16px,100% calc(100% - 16px),calc(100% - 8px) calc(100% - 16px),calc(100% - 8px) calc(100% - 8px),calc(100% - 16px) calc(100% - 8px),calc(100% - 16px) 100%,16px 100%,16px calc(100% - 8px),8px calc(100% - 8px),8px calc(100% - 16px),0 calc(100% - 16px))';
// 장식: [파일, 가로위치, 세로위치, 높이(px), 뒤집기, 흔들림방향]  (영웅은 크게·모서리에 걸쳐서, 유물은 작게)
const HEROES=[['knight','left:-24px','bottom:-44px',300,0,1],['bear','right:-24px','bottom:-44px',290,1,-1],['ev_fairy','left:34px','top:14px',150,0,-1],['hawk','right:34px','top:6px',170,1,1],['blades','left:-16px','top:200px',130,0,1],['candle','right:-10px','top:210px',140,1,-1]];
const RELICS=[['skill_starcrown',214,22],['skill_meteor',300,66],['skill_bulwark',610,24],['skill_drums',690,64],['skill_arcane',36,192],['skill_warhorn',852,196],['skill_grace',330,452],['skill_kindle',560,454],['skill_frost',246,404],['skill_volley',690,410]];
const FACE='@font-face{font-family:"GalmuriX";src:url("../../폰트/Galmuri11.ttf");font-weight:100 900}'; // 갈무리 일반(영상 공통 폰트, 크기는 11의 배수, 외곽 1px로 또렷하게)
const O1='1px 0 0 #000,-1px 0 0 #000,0 1px 0 #000,0 -1px 0 #000,1px 1px 0 #000,-1px 1px 0 #000,1px -1px 0 #000,-1px -1px 0 #000'; // 외곽 라인 1px
const css=`${FACE}html{zoom:2}html,body{margin:0;width:960px;height:540px;overflow:hidden;font-family:"GalmuriX",sans-serif;background:#241a2e}
.bg{position:absolute;left:50%;top:50%;width:1080px;height:603px;margin:-301px 0 0 -540px;image-rendering:pixelated}
.dim{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(20,12,30,.25),rgba(12,8,20,.7))}
.st{position:absolute;background:#ffe08a;display:block}
.dc{position:absolute;image-rendering:pixelated;filter:drop-shadow(0 5px 0 rgba(10,8,16,.8))}
.pl{position:absolute;left:50%;top:50%;width:max-content;filter:drop-shadow(0 7px 0 #0a0810);transform-origin:50% 50%}
.pl .o{background:#000;padding:8px;clip-path:${clip}}
.pl .i{width:690px;box-sizing:border-box;background:linear-gradient(#ffe08a 0 7px,#f2c23c 7px calc(100% - 11px),#c99a1e calc(100% - 11px));color:#3a2410;padding:30px 54px 40px;font-size:55px;font-weight:bold;line-height:1.3;text-align:center;white-space:nowrap;clip-path:${clip}}
.red{color:#b3261e}.dim2{color:#a8842a}`;
const star=(x,y,s=6)=>`<i class="st" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;box-shadow:${s}px 0 #ffe08a,-${s}px 0 #ffe08a,0 ${s}px #ffe08a,0 -${s}px #ffe08a"></i>`;
const STARS=[[120,120,6],[840,110,6],[100,330,5],[870,330,6],[480,70,5],[480,480,5]];
const u=p=>'file:///'+p.split(path.sep).join('/');
const POOL='가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허고노도로모보소오조초코토포호구누두루무부수우주추쿠투푸후';
let seed=11;const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280};
const L1='두 시간 반 만들고,',L2='통째로 버렸다';
const total=[...(L1+L2)].filter(c=>c!==' ').length;
function scr(f,F){const done=Math.floor(total*f/F);let i=0;const conv=t=>[...t].map(ch=>{if(ch===' ')return ' ';const r=i<done;i++;return r?ch:`<span class="dim2">${POOL[Math.floor(rnd()*POOL.length)]}</span>`}).join('');
  let a=conv(L1),b=conv(L2);if(f>=F)b=b.replace('버렸다','<span class="red">버렸다</span>');return `<div>${a}</div><div>${b}</div>`}
function html(tw,bob,pop,f,F){
  const stars=STARS.map(([x,y,s],i)=>(i+tw)%2?star(x,y,s):'').join('');
  const hs=HEROES.map(([n,x,y,h,fl,d])=>`<img class="dc" src="${IMG}${n}.png" style="${x};${y};height:${h}px;${fl?'transform:scaleX(-1);':''}margin-top:${bob?d*6:0}px">`).join('');
  const rs=RELICS.map(([n,x,y],i)=>`<img class="dc" src="${IMG}${n}.png" style="left:${x}px;top:${y}px;width:72px;height:72px;margin-top:${bob?((i%2)?-5:5):0}px">`).join('');
  const pl=pop?`<div class="pl" style="transform:translate(-50%,calc(-50% + ${pop.dy||0}px));opacity:${pop.o}"><div class="o"><div class="i"><div style="position:relative">${scr(f,F)}</div><div style="height:0;overflow:hidden;visibility:hidden">${L1}<br>${L2}</div></div></div></div>`:'';
  return `<!doctype html><meta charset="utf-8"><style>${css}</style><img class="bg" src="${IMG}bg_field_dusk.png"><div class="dim"></div>${stars}${hs}${rs}${pl}`;
}
fs.mkdirSync(OUT,{recursive:true});
const F=16,jobs=[],dur=[];
jobs.push([0,0,null,0]);dur.push(0.4);                                   // 판이 아직 없는 상태(장식만)
[[16,0.4],[8,0.8],[0,1]].forEach(([dy,o],k)=>{jobs.push([k%2,k%2,{dy,o},0]);dur.push(0.08)}); // 판이 톡 튀어나옴(글자는 아직 섞임)
for(let f=1;f<=F;f++){jobs.push([f%2,f%2,{dy:0,o:1},f]);dur.push(f<F?0.06:0.5)}      // 스크램블로 글자가 맞춰짐
for(let r=0;r<4;r++){jobs.push([(r+1)%2,(r+1)%2,{dy:0,o:1},F]);dur.push(0.5)}          // 완성 뒤 장식이 살짝 흔들림
fs.writeFileSync(path.join(OUT,'길이.json'),JSON.stringify(dur));
(async()=>{let next=0;const worker=async()=>{while(next<jobs.length){const j=next++;const q=jobs[j];const n=String(j+1).padStart(3,'0'),h=path.join(OUT,`h${n}.html`);fs.writeFileSync(h,html(q[0],q[1],q[2],q[3],F));
 await new Promise(r=>execFile(E,['--headless','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=1920,1080','--screenshot='+path.join(OUT,`프레임${n}.png`),u(h)],()=>{fs.unlinkSync(h);r()}))}};
await Promise.all(Array.from({length:4},worker));console.log('frames',jobs.length,'sec',dur.reduce((a,b)=>a+b,0).toFixed(1))})();
