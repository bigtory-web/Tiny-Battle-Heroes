// 훅 카드: 가운데 큰 글자 2줄 + 가장자리에서 삐죽 나온 영웅 도트. 글자가 한 줄씩 툭 떨어지고, 영웅은 위아래로 살짝 흔들림.
// 사용: C=4 node 훅만들기.js  →  훅/프레임NN.png, 훅/길이.json   (조립: node 조립_범용.js 훅 훅샘플.mp4)
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const E='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',D=__dirname,OUT=path.join(D,'훅');
const T={l1:'두 시간 반 만들고,',l2:'통째로 <span class="y">버렸다</span>',tag:'덩치 배치'};
// 장식: [파일, 가로위치, 세로위치, 높이(px, 작은 화면), 뒤집기, 흔들림 시작방향]
const DEC=[['knight','left:-26px','bottom:-30px',250,0,1],['ev_fairy','right:-20px','top:-40px',230,1,-1],['bear','right:-30px','bottom:-34px',240,1,1],['chest','left:30px','top:20px',96,0,-1]];
const C=+process.env.C||4;
const clip=`polygon(0 ${C}px,${C}px ${C}px,${C}px 0,calc(100% - ${C}px) 0,calc(100% - ${C}px) ${C}px,100% ${C}px,100% calc(100% - ${C}px),calc(100% - ${C}px) calc(100% - ${C}px),calc(100% - ${C}px) 100%,${C}px 100%,${C}px calc(100% - ${C}px),0 calc(100% - ${C}px))`;
const bev=(hi,mid,lo,t=5,b=7)=>`background:linear-gradient(${hi} 0 ${t}px,${mid} ${t}px calc(100% - ${b}px),${lo} calc(100% - ${b}px))`;
const css=`html{zoom:2}html,body{margin:0;width:960px;height:540px;overflow:hidden;font-family:"Malgun Gothic",sans-serif;background:#17141d;
background-image:linear-gradient(45deg,#1d1926 25%,transparent 25%,transparent 75%,#1d1926 75%),linear-gradient(45deg,#1d1926 25%,transparent 25%,transparent 75%,#1d1926 75%);background-size:8px 8px;background-position:0 0,4px 4px}
.dec{position:absolute;image-rendering:pixelated;filter:drop-shadow(0 6px 0 #0a0810)}
.c{position:absolute;left:0;right:0;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.big{font-size:60px;font-weight:bold;color:#fff;line-height:1.28;text-shadow:0 5px 0 #000,4px 0 #000,-4px 0 #000,0 -4px 0 #000,3px 3px 0 #000,-3px 3px 0 #000}
.y{color:#f2c23c}
.fr{filter:drop-shadow(0 5px 0 #0a0810)}.fr>.o{background:#000;padding:4px;clip-path:${clip}}.fr .i{clip-path:${clip}}
.tag{margin-top:26px}.tag .i{${bev('#6a5d8c','#463e60','#2a2539',6,8)};color:#fff;font-size:26px;font-weight:bold;padding:6px 26px 14px;letter-spacing:2px}`;
const u=p=>'file:///'+p.split(path.sep).join('/');
fs.mkdirSync(OUT,{recursive:true});
const ANIM=[{dy:-34,op:0.4},{dy:-14,op:0.8},{dy:0,op:1}]; // 위에서 툭 떨어짐
let fn=0;const dur=[];
// st: 각 요소가 보이는 상태. anim = {which, a}  /  bob = 영웅 흔들림 방향 (0 또는 1)
function render(st,bob){
  fn++;
  const sty=(which)=>{const s=st[which];if(!s.show)return' style="visibility:hidden"';const a=s.a;return a?` style="transform:translateY(${a.dy}px);opacity:${a.op}"`:''};
  const decs=DEC.map(([f,x,y,h,flip,dir])=>`<img class="dec" src="../../../../img/p/${f}.png" style="${x};${y};height:${h}px;${flip?'transform:scaleX(-1);':''}margin-top:${bob?dir*4:0}px">`).join('');
  const html=`<!doctype html><meta charset="utf-8"><style>${css}</style>${decs}
<div class="c"><div class="big"><div${sty('l1')}>${T.l1}</div><div${sty('l2')}>${T.l2}</div></div>
<div class="tag fr"${sty('tag')}><div class="o"><div class="i">${T.tag}</div></div></div></div>`;
  const n=String(fn).padStart(2,'0'),h=path.join(OUT,`h${n}.html`),big=path.join(OUT,`프레임${n}.png`);
  fs.writeFileSync(h,html);
  execFileSync(E,['--headless','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=1920,1080','--screenshot='+big,u(h)],{stdio:'ignore'});
  fs.unlinkSync(h);
}
const hide={show:false},shown={show:true};
render({l1:hide,l2:hide,tag:hide},0);dur.push(0.4);
for(const w of ['l1','l2','tag']){
  const base={l1:shown,l2:shown,tag:shown};
  const prev={l1:shown,l2:shown,tag:shown};
  const order=['l1','l2','tag'];const idx=order.indexOf(w);
  for(const an of ANIM){const st={};order.forEach((k,i)=>{st[k]=i<idx?shown:i===idx?{show:true,a:an}:hide});render(st,0);dur.push(0.08)}
  dur[dur.length-1]=0.5;
}
const full={l1:shown,l2:shown,tag:shown};
for(let r=0;r<3;r++){render(full,1);dur.push(0.4);render(full,0);dur.push(0.4)}
fs.writeFileSync(path.join(OUT,'길이.json'),JSON.stringify(dur));
console.log('frames',dur.length,'sec',dur.reduce((a,b)=>a+b,0).toFixed(1));
