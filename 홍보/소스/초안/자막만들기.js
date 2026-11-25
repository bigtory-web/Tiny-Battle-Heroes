// 자막 카드 2종: "하지만..!!"(블러 인), 끝 카드(스크램블). 출력: 하지만/프레임NNN.png, 끝/프레임NNN.png + 길이.json
// 사용: node 자막만들기.js  (조립: node 조립_범용.js 하지만 하지만샘플.mp4 / node 조립_범용.js 끝 끝샘플.mp4)
const fs=require('fs'),path=require('path'),{execFile}=require('child_process');
const E='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',D=__dirname;
const C=4;
const clip=`polygon(0 ${C}px,${C}px ${C}px,${C}px 0,calc(100% - ${C}px) 0,calc(100% - ${C}px) ${C}px,100% ${C}px,100% calc(100% - ${C}px),calc(100% - ${C}px) calc(100% - ${C}px),calc(100% - ${C}px) 100%,${C}px 100%,${C}px calc(100% - ${C}px),0 calc(100% - ${C}px))`;
const bev=(hi,mid,lo,t=5,b=7)=>`background:linear-gradient(${hi} 0 ${t}px,${mid} ${t}px calc(100% - ${b}px),${lo} calc(100% - ${b}px))`;
const css=`html{zoom:2}html,body{margin:0;width:960px;height:540px;overflow:hidden;font-family:"Malgun Gothic",sans-serif;background:#17141d;
background-image:linear-gradient(45deg,#1d1926 25%,transparent 25%,transparent 75%,#1d1926 75%),linear-gradient(45deg,#1d1926 25%,transparent 25%,transparent 75%,#1d1926 75%);background-size:8px 8px;background-position:0 0,4px 4px}
.vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,transparent 45%,#0b0910 100%)}
.c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.big{font-weight:bold;color:#fff;line-height:1.25;text-shadow:0 5px 0 #000,4px 0 #000,-4px 0 #000,0 -4px 0 #000,3px 3px 0 #000,-3px 3px 0 #000}
.y{color:#f2c23c}.dim{color:#8c849c}
.fr{filter:drop-shadow(0 5px 0 #0a0810)}.fr>.o{background:#000;padding:4px;clip-path:${clip}}.fr .i{clip-path:${clip}}
.tag{margin-top:30px}.tag .i{${bev('#6a5d8c','#463e60','#2a2539',6,8)};color:#fff;font-size:24px;font-weight:bold;padding:6px 26px 14px;letter-spacing:1px}`;
const u=p=>'file:///'+p.split(path.sep).join('/');
const POOL='가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허고노도로모보소오조초코토포호구누두루무부수우주추쿠투푸후';
let seed=7;const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280};
const jobsAll=[];
function make(dir,list){ // list: [{html,dur}]
  fs.mkdirSync(path.join(D,dir),{recursive:true});
  list.forEach((f,i)=>{const n=String(i+1).padStart(3,'0');jobsAll.push({dir,n,html:`<!doctype html><meta charset="utf-8"><style>${css}</style><div class="vig"></div>${f.html}`})});
  fs.writeFileSync(path.join(D,dir,'길이.json'),JSON.stringify(list.map(f=>f.dur)));
}
// 1) 하지만..!! : 블러 인 + 살짝 커졌다 제자리로
const blur=[{b:16,o:0.25,s:1.12},{b:10,o:0.55,s:1.08},{b:5,o:0.8,s:1.04},{b:2,o:1,s:1.02},{b:0,o:1,s:1}];
make('하지만',blur.map((f,i)=>({dur:i<4?0.07:1.6,html:`<div class="c"><div class="big" style="font-size:112px;filter:blur(${f.b}px);opacity:${f.o};transform:scale(${f.s})">하지만<span class="y">..!!</span></div></div>`})));
// 2) 끝 카드 : 스크램블(왼쪽부터 글자가 맞춰짐), 끝에 이유 태그
const L1='재밌다고,',L2='내 게임에서까지',L3='재밌는 건 아니었다';
const all=L1+L2+L3, total=[...all].filter(c=>c!==' ').length;
function scr(f,F){ // f: 단계, F: 총 단계
  const done=Math.floor(total*f/F);let i=0;
  const conv=t=>[...t].map(ch=>{if(ch===' ')return ' ';const r=i<done;i++;return r?ch:`<span class="dim">${POOL[Math.floor(rnd()*POOL.length)]}</span>`}).join('');
  let a=conv(L1),b=conv(L2),c=conv(L3);
  if(f>=F)c=c.replace('아니었다','<span class="y">아니었다</span>');
  return `<div>${a}</div><div>${b}</div><div>${c}</div>`;
}
const F=16,frames=[];
for(let f=0;f<=F;f++){const tag=f>=F-3?`<div class="tag fr" style="opacity:${f>=F?1:0.5}"><div class="o"><div class="i">제약은 그 자체로는 재미가 아니다</div></div></div>`:'';
  frames.push({dur:f<F?0.06:4,html:`<div class="c"><div class="big" style="font-size:64px">${scr(f,F)}</div>${tag}</div>`})}
make('끝',frames);
(async()=>{let next=0;const worker=async()=>{while(next<jobsAll.length){const j=jobsAll[next++];const h=path.join(D,j.dir,`s${j.n}.html`);fs.writeFileSync(h,j.html);
 await new Promise(r=>execFile(E,['--headless','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=1920,1080','--screenshot='+path.join(D,j.dir,`프레임${j.n}.png`),u(h)],()=>{fs.unlinkSync(h);r()}))}};
await Promise.all(Array.from({length:4},worker));console.log('frames',jobsAll.length)})();
