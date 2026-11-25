// 훅 카드 2안: 제목이 말풍선, 우하단에 사용자 캐릭터(임시: 기사)가 말하는 구성. 배경은 빛줄기+별.
// 사용: C=4 node 훅만들기2.js → 훅2/프레임NN.png (조립: node 조립_범용.js 훅2 훅2샘플.mp4)
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const E='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',D=__dirname,OUT=path.join(D,process.env.SIDE==='left'?'훅2_좌':'훅2');
const HERO='../../채널/개발자_전신.png'; // 사용자 캐릭터(프로필 캐릭터, 마젠타 배경 제거본)
const C=+process.env.C||4;const SIDE=process.env.SIDE==='left'?'left':'right',OUTN=SIDE==='left'?'훅2_좌':'훅2';
const clip=`polygon(0 ${C}px,${C}px ${C}px,${C}px 0,calc(100% - ${C}px) 0,calc(100% - ${C}px) ${C}px,100% ${C}px,100% calc(100% - ${C}px),calc(100% - ${C}px) calc(100% - ${C}px),calc(100% - ${C}px) 100%,${C}px 100%,${C}px calc(100% - ${C}px),0 calc(100% - ${C}px))`;
const star=(x,y,s=6)=>`<i class="st" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;box-shadow:${s}px 0 #ffe08a,-${s}px 0 #ffe08a,0 ${s}px #ffe08a,0 -${s}px #ffe08a"></i>`;
const STARS=[[70,60,6],[860,70,8],[150,420,6],[780,330,6],[470,40,5],[40,250,5],[900,230,6],[330,480,5]];
const css=`html{zoom:2}html,body{margin:0;width:960px;height:540px;overflow:hidden;font-family:"Malgun Gothic",sans-serif;background:#17141d}
.rays{position:absolute;inset:0;background:repeating-conic-gradient(from var(--a,0deg) at ${SIDE==='left'?25:75}% 69%,#221c30 0 7.5deg,#17141d 7.5deg 15deg)}
.vig{position:absolute;inset:0;background:radial-gradient(ellipse at 60% 60%,transparent 40%,#0b0910 100%)}
.st{position:absolute;background:#ffe08a;display:block}
.hero{position:absolute;${SIDE}:30px;bottom:-12px;height:400px;filter:drop-shadow(0 6px 0 #0a0810)}
.bub{position:absolute;${SIDE==='left'?'right':'left'}:120px;top:88px;width:max-content;filter:drop-shadow(0 6px 0 #0a0810);transform-origin:90% 100%}
.bub .o{background:#000;padding:5px;clip-path:${clip}}
.bub .i{background:linear-gradient(#ffe08a 0 6px,#f2c23c 6px calc(100% - 10px),#c99a1e calc(100% - 10px));color:#3a2410;padding:26px 32px 34px;font-size:48px;font-weight:bold;line-height:1.3;white-space:nowrap;clip-path:${clip}}
.red{color:#b3261e}
.tail,.tail2{position:absolute;width:40px;height:40px;${SIDE==='left'?'transform:scaleX(-1);':''}}
.tail{${SIDE==='left'?'left':'right'}:24px;top:calc(100% - 7px);background:#000;clip-path:polygon(0 0,40px 0,40px 40px,32px 40px,32px 32px,24px 32px,24px 24px,16px 24px,16px 16px,8px 16px,8px 8px,0 8px)}
.tail2{${SIDE==='left'?'left':'right'}:28px;top:calc(100% - 10px);background:#c99a1e;clip-path:polygon(0 0,32px 0,32px 30px,26px 30px,26px 24px,20px 24px,20px 18px,14px 18px,14px 12px,8px 12px,8px 6px,0 6px);background:linear-gradient(#f2c23c 0 16px,#f2c23c 16px)}`;
const u=p=>'file:///'+p.split(path.sep).join('/');
fs.mkdirSync(OUT,{recursive:true});
let fn=0;const dur=[];
// s: 말풍선 상태 {sc,op} / l1,l2 보임 여부 / bob 0·1 / tw 별 반짝 0·1 / ang 빛줄기 각도
function render({bub,l1,l2,bob,tw,ang}){
  fn++;
  const stars=STARS.map(([x,y,s],i)=>(i+tw)%2?star(x,y,s):'').join('');
  const bstyle=bub?`style="transform:scale(${bub.sc});opacity:${bub.op}"`:'style="visibility:hidden"';
  const html=`<!doctype html><meta charset="utf-8"><style>${css}</style>
<div class="rays" style="--a:${(fn*0.5).toFixed(1)}deg"></div><div class="vig"></div>${stars}
<img class="hero" src="${HERO}" style="margin-bottom:${bob?14:0}px">
<div class="bub" ${bstyle}><div class="o"><div class="i"><div style="visibility:${l1?'visible':'hidden'}">두 시간 반 만들고,</div><div style="visibility:${l2?'visible':'hidden'}">통째로 <span class="red">버렸다</span></div></div></div><div class="tail"></div><div class="tail2"></div></div>`;
  const n=String(fn).padStart(2,'0'),h=path.join(OUT,`h${n}.html`),big=path.join(OUT,`프레임${n}.png`);
  fs.writeFileSync(h,html);
  execFileSync(E,['--headless','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=1920,1080','--screenshot='+big,u(h)],{stdio:'ignore'});
  fs.unlinkSync(h);
}
render({bub:null,l1:0,l2:0,bob:0,tw:0,ang:0});dur.push(0.4);
for(const sc of [[0.6,0.4],[0.88,0.8],[1.04,1]])render({bub:{sc:sc[0],op:sc[1]},l1:0,l2:0,bob:0,tw:0,ang:2}),dur.push(0.08);
render({bub:{sc:1,op:1},l1:1,l2:0,bob:1,tw:1,ang:4});dur.push(0.45);
render({bub:{sc:1,op:1},l1:1,l2:1,bob:0,tw:0,ang:6});dur.push(0.45);
for(let r=0;r<6;r++){render({bub:{sc:1,op:1},l1:1,l2:1,bob:1,tw:1,ang:0});dur.push(0.25);render({bub:{sc:1,op:1},l1:1,l2:1,bob:0,tw:0,ang:0});dur.push(0.25)}
fs.writeFileSync(path.join(OUT,'길이.json'),JSON.stringify(dur));
console.log('frames',dur.length,'sec',dur.reduce((a,b)=>a+b,0).toFixed(1));
