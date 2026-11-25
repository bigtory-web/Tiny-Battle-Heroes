// 좌: 타이틀 > 세부 > 바로 아래 영상/글 칸 / 우: POINT! + 항목이 하나씩 생김(제목 크게 + 설명 작게, 3단 입체)
// 사용: C=4 OUTDIR=포인트 node 포인트만들기.js   (C = 모서리 크기, 작은 화면 px. 4 = 2픽셀)
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const E='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',D=__dirname,OUT=path.join(D,process.env.OUTDIR||'포인트');
const T={title:'배치와 덩치',
 detail:['더 바자르는 백팩 시스템이에요.','정해진 칸 수, 아이템마다 1·2·3칸.','배치가 쏠쏠하게 재밌어서, 우리 게임에도 넣어 보기로 했어요.'],
 media:'<div class="mt"><div><b>기사</b><span>●●●</span></div><div><b>전사 · 마법사</b><span>●●</span></div><div><b>나머지</b><span>●</span></div></div>',
 points:[{h:'배치',d:'칸 수로 고민하게 하자'},{h:'덩치',d:'영웅마다 크기를 줌'},{h:'직업별 구분',d:'기사 3 · 전사·마법사 2 · 나머지 1'}]};
const C=+process.env.C||4;
const clip=`polygon(0 ${C}px,${C}px ${C}px,${C}px 0,calc(100% - ${C}px) 0,calc(100% - ${C}px) ${C}px,100% ${C}px,100% calc(100% - ${C}px),calc(100% - ${C}px) calc(100% - ${C}px),calc(100% - ${C}px) 100%,${C}px 100%,${C}px calc(100% - ${C}px),0 calc(100% - ${C}px))`;
// 3단 입체: 위 밝은 띠 / 몸통 / 아래 어두운 띠 (게임 버튼과 같은 방식)
const bev=(hi,mid,lo,t=5,b=7)=>`background:linear-gradient(${hi} 0 ${t}px,${mid} ${t}px calc(100% - ${b}px),${lo} calc(100% - ${b}px))`;
const css=`html,body{margin:0;width:960px;height:540px;overflow:hidden;font-family:"Malgun Gothic",sans-serif;color:#fff;background:#17141d;
background-image:linear-gradient(45deg,#1d1926 25%,transparent 25%,transparent 75%,#1d1926 75%),linear-gradient(45deg,#1d1926 25%,transparent 25%,transparent 75%,#1d1926 75%);background-size:8px 8px;background-position:0 0,4px 4px}
.sep{position:absolute;left:484px;top:28px;bottom:28px;width:6px;background:repeating-linear-gradient(#54496e 0 12px,#2e2a3c 12px 18px);border-left:3px solid #000;border-right:3px solid #000}
.L{position:absolute;left:30px;top:28px;width:440px;bottom:28px}
.R{position:absolute;left:512px;right:26px;top:28px;bottom:28px;display:flex;flex-direction:column}
h1{margin:0 0 16px;font-size:38px;text-shadow:0 4px 0 #000,3px 0 #000,-3px 0 #000,0 -3px 0 #000}
.d{font-size:21px;line-height:1.5;color:#e8e4f0;margin:0 0 6px}
.media{margin-top:22px;height:196px;border:3px solid #000;outline:3px solid #3b3550;background:#221d2c;display:flex;align-items:center;justify-content:center}
.mt{display:flex;flex-direction:column;gap:8px;width:80%}.mt div{display:flex;justify-content:space-between;font-size:22px;background:#3a3450;border:3px solid #000;padding:6px 14px;box-shadow:inset 0 3px 0 #54496e}.mt span{color:#f2c23c;letter-spacing:4px}
.fr{filter:drop-shadow(0 5px 0 #0a0810)}.fr>.o{background:#000;padding:4px;clip-path:${clip}}.fr .i{clip-path:${clip}}
.tag{display:inline-block;align-self:flex-start;margin-bottom:12px}
.tag .i{${bev('#ffe08a','#f2c23c','#c99a1e',6,8)};color:#3a2410;font-weight:bold;font-size:30px;padding:6px 26px 12px;letter-spacing:2px}
.items{flex:1;display:flex;flex-direction:column;justify-content:center;gap:16px;padding-bottom:12px}
.pi .i{${bev('#6a5d8c','#463e60','#2a2539',6,8)};padding:10px 16px 16px 12px;display:flex;gap:14px;align-items:center}
.nb{flex:none;width:40px;height:40px;${bev('#ffe08a','#f2c23c','#c99a1e',4,5)};color:#3a2410;font-weight:bold;font-size:24px;text-align:center;line-height:34px;border:3px solid #000;box-sizing:border-box}
.pt{display:flex;flex-direction:column;gap:2px}
.ph{font-size:30px;font-weight:bold;color:#ffd84a;text-shadow:0 3px 0 #000,2px 0 #000,-2px 0 #000;line-height:1.15}
.pd{font-size:18px;color:#d8d2e6;line-height:1.35}`;
const u=p=>'file:///'+p.split(path.sep).join('/');
fs.mkdirSync(OUT,{recursive:true});
const dur=[];
for(let k=0;k<=T.points.length;k++){
  dur.push(k===0?2:k===T.points.length?3.5:2.2);
  const items=T.points.slice(0,k).map((p,j)=>`<div class="pi fr"><div class="o"><div class="i"><span class="nb">${j+1}</span><span class="pt"><span class="ph">${p.h}</span><span class="pd">${p.d}</span></span></div></div></div>`).join('');
  const html=`<!doctype html><meta charset="utf-8"><style>${css}</style>
<div class="sep"></div><div class="L"><h1>${T.title}</h1>${T.detail.map(x=>`<p class="d">${x}</p>`).join('')}<div class="media">${T.media}</div></div>
<div class="R"><div class="tag fr"><div class="o"><div class="i">POINT!</div></div></div><div class="items">${items}</div></div>`;
  const n=String(k+1).padStart(2,'0'),h=path.join(OUT,`p${n}.html`),s=path.join(OUT,`p${n}_s.png`),big=path.join(OUT,`프레임${n}.png`),kk=path.join(OUT,'k.html');
  fs.writeFileSync(h,html);
  execFileSync(E,['--headless','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=960,540','--screenshot='+s,u(h)],{stdio:'ignore'});
  fs.writeFileSync(kk,`<!doctype html><style>html,body{margin:0}img{width:1920px;height:1080px;image-rendering:pixelated;display:block}</style><img src="p${n}_s.png">`);
  execFileSync(E,['--headless','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=1920,1080','--screenshot='+big,u(kk)],{stdio:'ignore'});
  for(const f of [h,s,kk])fs.unlinkSync(f);
}
fs.writeFileSync(path.join(OUT,'길이.json'),JSON.stringify(dur));
console.log('frames',dur.length);
