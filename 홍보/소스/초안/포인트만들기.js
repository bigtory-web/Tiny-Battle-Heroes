// 좌: 타이틀 > 세부 > 바로 아래 영상/글 칸 / 우: POINT! + 항목이 하나씩 생김(제목 크게 + 설명 작게, 3단 입체)
// 사용: C=4 OUTDIR=포인트 node 포인트만들기.js   (C = 모서리 크기, 작은 화면 px. 4 = 2픽셀)
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const E='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',D=__dirname,OUT=path.join(D,process.env.OUTDIR||'포인트');
const T={title:'배치와 덩치',
 detail:['더 바자르는 백팩 시스템이에요.','정해진 칸 수, 아이템마다 1·2·3칸.','배치가 쏠쏠하게 재밌어서, 우리 게임에도 넣어 보기로 했어요.'],
 media:'<div class="mt"><div><b>기사</b><span>●●●</span></div><div><b>전사 · 마법사</b><span>●●</span></div><div><b>나머지</b><span>●</span></div></div>',
 points:[{h:'배치',d:'칸 수로 고민하게 하자'},{h:'덩치',d:'영웅마다 크기를 줌'},{h:'직업별 구분',d:'기사 3 · 전사·마법사 2 · 기타 1'}]};
const C=+process.env.C||4;
// 장면별 내용: SCENE=<json 경로>(title·detail·points·mediaLabel·total). total이 있으면 항목이 그 시간에 맞춰 고르게 나타남
if(process.env.SCENE){const J=JSON.parse(fs.readFileSync(process.env.SCENE,'utf8'));Object.assign(T,J);if(J.mediaLabel)T.media=`<div class="clip">클립 자리<small>${J.mediaLabel}</small></div>`}
const clip=`polygon(0 ${C}px,${C}px ${C}px,${C}px 0,calc(100% - ${C}px) 0,calc(100% - ${C}px) ${C}px,100% ${C}px,100% calc(100% - ${C}px),calc(100% - ${C}px) calc(100% - ${C}px),calc(100% - ${C}px) 100%,${C}px 100%,${C}px calc(100% - ${C}px),0 calc(100% - ${C}px))`;
// 3단 입체: 위 밝은 띠 / 몸통 / 아래 어두운 띠 (게임 버튼과 같은 방식)
const bev=(hi,mid,lo,t=5,b=7)=>`background:linear-gradient(${hi} 0 ${t}px,${mid} ${t}px calc(100% - ${b}px),${lo} calc(100% - ${b}px))`;
const FACE='@font-face{font-family:"GalmuriX";src:url("file:///'+path.join(D,"..","폰트","Galmuri11.ttf").split(path.sep).join("/")+'");font-weight:100 900}'; // 갈무리 일반(영상 공통 폰트, 크기는 11의 배수, 외곽 1px로 또렷하게)
const O1='1px 0 0 #000,-1px 0 0 #000,0 1px 0 #000,0 -1px 0 #000,1px 1px 0 #000,-1px 1px 0 #000,1px -1px 0 #000,-1px -1px 0 #000'; // 외곽 라인 1px
const css=`${FACE}html{zoom:2}html,body{margin:0;width:960px;height:540px;overflow:hidden;font-family:"GalmuriX",sans-serif;color:#fff;background:#17141d;
background-image:linear-gradient(45deg,#1d1926 25%,transparent 25%,transparent 75%,#1d1926 75%),linear-gradient(45deg,#1d1926 25%,transparent 25%,transparent 75%,#1d1926 75%);background-size:8px 8px;background-position:0 0,4px 4px}
.rbg{position:absolute;left:488px;right:0;top:0;bottom:0;background:#0d0b12;background-image:linear-gradient(45deg,#131019 25%,transparent 25%,transparent 75%,#131019 75%),linear-gradient(45deg,#131019 25%,transparent 25%,transparent 75%,#131019 75%);background-size:8px 8px;background-position:0 0,4px 4px}
.L{position:absolute;left:30px;top:28px;width:440px;bottom:28px}
.R{position:absolute;left:512px;right:26px;top:28px;bottom:28px;display:flex;flex-direction:column}
h1{margin:0 0 16px;font-size:44px;text-shadow:${O1}}
.d{font-size:22px;line-height:1.5;color:#e8e4f0;margin:0 0 6px}
.media{margin-top:22px;height:196px;border:3px solid #000;outline:3px solid #3b3550;background:#221d2c;display:flex;align-items:center;justify-content:center}
.clip{width:86%;box-sizing:border-box;border:3px dashed #54496e;padding:26px 20px;text-align:center;color:#a79fb8;font-size:22px;line-height:1.7}.clip small{display:block;color:#f2c23c;font-size:22px}
.mt{display:flex;flex-direction:column;gap:8px;width:80%}.mt div{display:flex;justify-content:space-between;font-size:22px;background:#3a3450;border:3px solid #000;padding:6px 14px;box-shadow:inset 0 3px 0 #54496e}.mt span{color:#f2c23c;letter-spacing:4px}
.fr{filter:drop-shadow(0 5px 0 #0a0810)}.fr>.o{background:#000;padding:4px;clip-path:${clip}}.fr .i{clip-path:${clip}}
.tag{display:inline-block;align-self:flex-start;margin-bottom:12px}
.tag .i{${bev('#ffe08a','#f2c23c','#c99a1e',6,8)};color:#3a2410;font-weight:bold;font-size:30px;padding:6px 26px 12px;letter-spacing:2px}
.items{flex:1;position:relative;display:flex;flex-direction:column;justify-content:flex-start;gap:16px;padding-top:44px}
.pi .i{${bev('#6a5d8c','#463e60','#2a2539',6,8)};padding:10px 16px 16px 12px;display:flex;gap:14px;align-items:center}
.nb{flex:none;width:40px;height:40px;${bev('#ffe08a','#f2c23c','#c99a1e',4,5)};color:#3a2410;font-weight:bold;font-size:24px;text-align:center;line-height:34px;border:3px solid #000;box-sizing:border-box}
.pt{display:flex;flex-direction:column;gap:2px}
.ph{font-size:33px;font-weight:bold;color:#ffd84a;text-shadow:${O1};line-height:1.15}
.pd{font-size:22px;color:#d8d2e6;line-height:1.35}`;
const u=p=>'file:///'+p.split(path.sep).join('/');
fs.mkdirSync(OUT,{recursive:true});
const dur=[];let fn=0;
if(process.env.MODE==='clip'){
  fs.mkdirSync(OUT,{recursive:true});
  const html=`<!doctype html><meta charset="utf-8"><style>${css}.rbg{display:none}.L{left:40px;right:40px;width:auto}.media{height:330px;margin-top:18px}.d{display:inline}.d::after{content:" "}</style><div class="L"><h1>${T.title}</h1><div>${T.detail.map(x=>`<span class="d">${x}</span>`).join('')}</div><div class="media">${T.media}</div></div>`;
  const h=path.join(OUT,'p01.html');fs.writeFileSync(h,html);
  execFileSync(E,['--headless','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=1920,1080','--screenshot='+path.join(OUT,'프레임01.png'),u(h)],{stdio:'ignore'});fs.unlinkSync(h);
  fs.writeFileSync(path.join(OUT,'길이.json'),JSON.stringify([T.total||5]));console.log('clip frame');process.exit(0)}
const ANIM=[{dy:20,op:0.35},{dy:10,op:0.75},{dy:0,op:1}]; // 새 항목: 아래에서 위로 밀려 올라옴
function render(k,anim){
  fn++;
  const items=T.points.slice(0,k).map((p,j)=>{const a=(anim&&j===k-1)?` style="transform:translateY(${anim.dy}px);opacity:${anim.op}"`:'';return `<div class="pi fr"${a}><div class="o"><div class="i">${process.env.MODE==='point'?`<span class="nb">${j+1}</span>`:''}<span class="pt"><span class="ph">${p.h}</span><span class="pd">${p.d}</span></span></div></div></div>`}).join('');
  const html=`<!doctype html><meta charset="utf-8"><style>${css}${process.env.MODE==='point'?`.rbg,.L{display:none}.R{left:150px;right:150px;top:24px}.tag{margin-bottom:16px}.tag .i{font-size:33px;padding:6px 30px 12px}
.items{gap:16px;padding-top:0}
.pi .i{padding:10px 26px 16px 16px;gap:22px;background:linear-gradient(#8472b0 0 6px,#52466f 6px calc(100% - 8px),#2a2539 calc(100% - 8px));position:relative}
.pi .i::after{content:'';position:absolute;inset:6px 6px 8px 6px;border:2px dashed rgba(255,255,255,.12);pointer-events:none}
.nb{width:66px;height:66px;font-size:44px;line-height:60px;border:4px solid #000;box-shadow:inset 0 5px 0 #ffe9a0,inset 0 -6px 0 #b98a14,4px 4px 0 #000;clip-path:polygon(0 4px,4px 4px,4px 0,calc(100% - 4px) 0,calc(100% - 4px) 4px,100% 4px,100% calc(100% - 4px),calc(100% - 4px) calc(100% - 4px),calc(100% - 4px) 100%,4px 100%,4px calc(100% - 4px),0 calc(100% - 4px));text-shadow:none}
.ph{font-size:44px}.pd{font-size:33px;color:#e8e4f0}.pt{gap:4px}
.bk .ph{color:#fff}.bk .tag .i{filter:brightness(1.25)}`:''}</style>
<div class="rbg"></div><div class="L"><h1>${T.title}</h1>${T.detail.map(x=>`<p class="d">${x}</p>`).join('')}<div class="media">${T.media}</div></div>
<div class="R${process.env.BLINK?' bk':''}"><div class="tag fr"><div class="o"><div class="i">POINT!</div></div></div><div class="items">${items}</div></div>`;
  const n=String(fn).padStart(2,'0'),h=path.join(OUT,`p${n}.html`),big=path.join(OUT,`프레임${n}.png`);
  fs.writeFileSync(h,html);
  execFileSync(E,['--headless','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=1920,1080','--screenshot='+big,u(h)],{stdio:'ignore'});
  fs.unlinkSync(h);
}
render(0,null);dur.push(T.total?T.total/(T.points.length+2):2);
for(let k=1;k<=T.points.length;k++){
  for(const an of ANIM){render(k,an);dur.push(0.1)}
  if(T.total){const n=T.points.length,a=j=>T.total*(j+1)/(n+2),next=k===n?T.total:a(k);dur[dur.length-1]=Math.max(0.5,next-a(k-1)-0.2)}else dur[dur.length-1]=k===T.points.length?3.5:2.2; // 마지막 연출 프레임이 유지 시간
}
fs.writeFileSync(path.join(OUT,'길이.json'),JSON.stringify(dur));
console.log('frames',dur.length);
