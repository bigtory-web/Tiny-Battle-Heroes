// 자막 카드 2종(훅 카드와 같은 분위기: 빛줄기·별·내 캐릭터). "하지만..!!"(블러 인), 끝 카드(말풍선 + 스크램블, 이유 문장 없음).
// 출력: 하지만/프레임NNN.png, 끝/프레임NNN.png + 길이.json   (조립: node 조립_범용.js 하지만 하지만샘플.mp4 / 끝 끝샘플.mp4)
const fs=require('fs'),path=require('path'),{execFile}=require('child_process');
const E='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',D=__dirname;
const C=4;
const clip=`polygon(0 ${C}px,${C}px ${C}px,${C}px 0,calc(100% - ${C}px) 0,calc(100% - ${C}px) ${C}px,100% ${C}px,100% calc(100% - ${C}px),calc(100% - ${C}px) calc(100% - ${C}px),calc(100% - ${C}px) 100%,${C}px 100%,${C}px calc(100% - ${C}px),0 calc(100% - ${C}px))`;
const star=(x,y,s=6)=>`<i class="st" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;box-shadow:${s}px 0 #ffe08a,-${s}px 0 #ffe08a,0 ${s}px #ffe08a,0 -${s}px #ffe08a"></i>`;
const STARS=[[70,60,6],[860,70,8],[150,420,6],[780,330,6],[470,40,5],[40,250,5],[900,230,6],[330,480,5]];
const css=`html{zoom:2}html,body{margin:0;width:960px;height:540px;overflow:hidden;font-family:"Malgun Gothic",sans-serif;background:#17141d}
.rays{position:absolute;inset:0;background:repeating-conic-gradient(from var(--a,0deg) at var(--cx,75%) 70%,#221c30 0 7.5deg,#17141d 7.5deg 15deg)}
.vig{position:absolute;inset:0;background:radial-gradient(ellipse at 55% 60%,transparent 40%,#0b0910 100%)}
.st{position:absolute;background:#ffe08a;display:block}
.hero{position:absolute;right:0;bottom:-70px;height:460px;transform:scaleX(-1);filter:drop-shadow(0 6px 0 #0a0810)}
.big{font-weight:bold;color:#fff;line-height:1.25;text-shadow:0 5px 0 #000,4px 0 #000,-4px 0 #000,0 -4px 0 #000,3px 3px 0 #000,-3px 3px 0 #000}
.y{color:#f2c23c}
.bub{position:absolute;left:100px;top:96px;width:max-content;filter:drop-shadow(0 6px 0 #0a0810)}
.bub .o{background:#000;padding:5px;clip-path:${clip}}
.bub .i{background:linear-gradient(#ffe08a 0 6px,#f2c23c 6px calc(100% - 10px),#c99a1e calc(100% - 10px));color:#3a2410;padding:26px 36px 34px;font-size:50px;font-weight:bold;line-height:1.3;white-space:nowrap;clip-path:${clip}}
.red{color:#b3261e}.dim{color:#a8842a}
.pt{position:absolute;bottom:0;left:calc(100% - 5px);width:30px;height:30px;filter:drop-shadow(3px 0 0 #000) drop-shadow(0 3px 0 #000) drop-shadow(0 -3px 0 #000)}
.pt::before{content:'';position:absolute;inset:0;background:#c99a1e;clip-path:polygon(0 0,5px 0,5px 5px,10px 5px,10px 10px,15px 10px,15px 15px,20px 15px,20px 20px,25px 20px,25px 25px,30px 25px,30px 30px,0 30px)}`;
const u=p=>'file:///'+p.split(path.sep).join('/');
const POOL='가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허고노도로모보소오조초코토포호구누두루무부수우주추쿠투푸후';
let seed=7;const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280};
const jobsAll=[];
function scene(ang,cx,tw,bob,inner){
  const stars=STARS.map(([x,y,s],i)=>(i+tw)%2?star(x,y,s):'').join('');
  return `<div class="rays" style="--a:${ang}deg;--cx:${cx}%"></div><div class="vig"></div>${stars}<img class="hero" src="../../채널/개발자_전신.png" style="margin-bottom:${bob?14:0}px">${inner}`;
}
function make(dir,list){
  fs.mkdirSync(path.join(D,dir),{recursive:true});
  list.forEach((f,i)=>{const n=String(i+1).padStart(3,'0');jobsAll.push({dir,n,html:`<!doctype html><meta charset="utf-8"><style>${css}</style>${f.html}`})});
  fs.writeFileSync(path.join(D,dir,'길이.json'),JSON.stringify(list.map(f=>f.dur)));
}
// 1) 하지만..!! : 블러 인, 중앙 왼쪽에 큰 글자, 오른쪽 아래에 내 캐릭터
const blur=[{b:16,o:0.25,s:1.12},{b:10,o:0.55,s:1.08},{b:5,o:0.8,s:1.04},{b:2,o:1,s:1.02},{b:0,o:1,s:1}];
const f1=[];
blur.forEach((f,i)=>f1.push({dur:i<4?0.07:0.4,html:scene(i,75,i%2,0,`<div style="position:absolute;left:40px;top:150px;width:600px;text-align:center"><div class="big" style="font-size:96px;filter:blur(${f.b}px);opacity:${f.o};transform:scale(${f.s})">하지만<span class="y">..!!</span></div></div>`)}));
for(let r=0;r<5;r++){const t=`<div style="position:absolute;left:40px;top:150px;width:600px;text-align:center"><div class="big" style="font-size:96px">하지만<span class="y">..!!</span></div></div>`;f1.push({dur:0.3,html:scene(6+r*2,75,(r+1)%2,r%2,t)})}
make('하지만',f1);
// 2) 끝 카드: 훅 카드와 같은 틀(말풍선 + 내 캐릭터), 글자가 스크램블로 맞춰짐. 이유 문장 없음
const L1='재밌다고,',L2='내 게임에서까지',L3='재밌는 건 아니었다';
const total=[...(L1+L2+L3)].filter(c=>c!==' ').length;
function scr(f,F){const done=Math.floor(total*f/F);let i=0;const conv=t=>[...t].map(ch=>{if(ch===' ')return ' ';const r=i<done;i++;return r?ch:`<span class="dim">${POOL[Math.floor(rnd()*POOL.length)]}</span>`}).join('');
  let a=conv(L1),b=conv(L2),c=conv(L3);if(f>=F)c=c.replace('아니었다','<span class="red">아니었다</span>');return `<div>${a}</div><div>${b}</div><div>${c}</div>`}
const F=16,f2=[];
const bubble=(f)=>`<div class="bub"><div class="o"><div class="i">${scr(f,F)}</div></div><div class="pt"></div></div>`;
for(let f=0;f<=F;f++)f2.push({dur:f<F?0.06:0.5,html:scene(f*0.5,75,f%2,f<F?f%2:0,bubble(f))});
for(let r=0;r<4;r++)f2.push({dur:0.5,html:scene(9+r*0.5,75,(r+1)%2,(r+1)%2,bubble(F))});
make('끝',f2);
(async()=>{let next=0;const worker=async()=>{while(next<jobsAll.length){const j=jobsAll[next++];const h=path.join(D,j.dir,`s${j.n}.html`);fs.writeFileSync(h,j.html);
 await new Promise(r=>execFile(E,['--headless','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=1920,1080','--screenshot='+path.join(D,j.dir,`프레임${j.n}.png`),u(h)],()=>{fs.unlinkSync(h);r()}))}};
await Promise.all(Array.from({length:4},worker));console.log('frames',jobsAll.length)})();
