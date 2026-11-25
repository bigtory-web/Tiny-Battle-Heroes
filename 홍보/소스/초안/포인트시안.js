// 좌영상 + 우(이야기 글 → POINT) 시안 이미지 2장. 사용: node 포인트시안.js → 시안/좌영상_A_이야기.png, 시안/좌영상_B_POINT.png
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const E='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',D=__dirname,OUT=path.join(D,'시안');
const F='file:///'+path.join(D,'..','폰트','Galmuri11.ttf').split(path.sep).join('/');
const C=4,clip=`polygon(0 ${C}px,${C}px ${C}px,${C}px 0,calc(100% - ${C}px) 0,calc(100% - ${C}px) ${C}px,100% ${C}px,100% calc(100% - ${C}px),calc(100% - ${C}px) calc(100% - ${C}px),calc(100% - ${C}px) 100%,${C}px 100%,${C}px calc(100% - ${C}px),0 calc(100% - ${C}px))`;
const O1='1px 0 0 #000,-1px 0 0 #000,0 1px 0 #000,0 -1px 0 #000,1px 1px 0 #000,-1px 1px 0 #000,1px -1px 0 #000,-1px -1px 0 #000';
const bev=(hi,mid,lo,t=5,b=7)=>`linear-gradient(${hi} 0 ${t}px,${mid} ${t}px calc(100% - ${b}px),${lo} calc(100% - ${b}px))`;
const css=`@font-face{font-family:G;src:url("${F}");font-weight:100 900}
html{zoom:2}html,body{margin:0;width:960px;height:540px;overflow:hidden;font-family:G;color:#fff;background:#17141d;background-image:linear-gradient(45deg,#1d1926 25%,transparent 25%,transparent 75%,#1d1926 75%),linear-gradient(45deg,#1d1926 25%,transparent 25%,transparent 75%,#1d1926 75%);background-size:8px 8px;background-position:0 0,4px 4px}
.rbg{position:absolute;left:520px;right:0;top:0;bottom:0;background:#0d0b12;background-image:linear-gradient(45deg,#131019 25%,transparent 25%,transparent 75%,#131019 75%),linear-gradient(45deg,#131019 25%,transparent 25%,transparent 75%,#131019 75%);background-size:8px 8px;background-position:0 0,4px 4px}
.in{word-break:keep-all;text-wrap:balance}.sh{filter:drop-shadow(0 5px 0 #0a0810)}.o{background:#000;padding:4px;clip-path:${clip}}.in{clip-path:${clip}}
.t{position:absolute;left:24px;top:22px;width:476px}.t .in{background:${bev('#8472b0','#52466f','#2a2539',5,7)};padding:8px 18px 14px;font-size:33px;text-shadow:${O1}}
.vid{position:absolute;left:24px;top:96px;width:476px;height:292px;filter:drop-shadow(0 5px 0 #0a0810)}
.vid .o{height:100%;box-sizing:border-box}.vid .bd0{height:100%;box-sizing:border-box;clip-path:${clip};background:${bev('#6fb0ff','#2f7fd4','#1c4f95',5,7)};position:relative}
.vid .cm{position:absolute;left:18px;top:6px;font-size:11px;color:#0d2a55}
.vid .bz{position:absolute;left:12px;right:12px;top:22px;bottom:12px;clip-path:${clip};background:#34363f;box-shadow:inset 0 0 0 3px #000}
.vid .pw{position:absolute;left:12px;top:20px;width:52px;font-size:11px;color:#c9ccd6;line-height:1.3;text-shadow:${O1}}
.vid .gn{position:absolute;left:0;right:0;bottom:8px;text-align:center;font-size:22px;color:#c9ccd6;letter-spacing:6px;text-shadow:${O1}}
.vid .sc{position:absolute;left:72px;right:22px;top:14px;bottom:36px;background:#221d2c;border:3px solid #000;display:flex;align-items:center;justify-content:center;color:#a79fb8;font-size:22px}
.cap{position:absolute;left:24px;top:404px;width:476px}.cap .in{background:${bev('#3a3450','#2a2539','#1d1926',4,6)};padding:10px 16px 14px;font-size:22px;line-height:1.5;color:#e8e4f0}
.R{position:absolute;left:544px;right:24px;top:22px;bottom:24px;display:flex;flex-direction:column;gap:14px}
.say .in{background:${bev('#6a5d8c','#463e60','#2a2539',5,7)};padding:14px 18px 20px;font-size:22px;line-height:1.55;position:relative}
.say .in::after,.pi .in::after{content:'';position:absolute;inset:5px 5px 7px;border:2px dashed rgba(255,255,255,.13);pointer-events:none}
.hl{color:#ffd84a}
.tag .in{background:${bev('#ffe08a','#f2c23c','#c99a1e',6,8)};color:#3a2410;font-size:33px;padding:6px 26px 12px;display:inline-block;font-weight:bold;letter-spacing:2px}.tag{align-self:flex-start}
.pi .in{background:${bev('#8472b0','#52466f','#2a2539',6,8)};padding:10px 16px 16px 12px;display:flex;gap:14px;align-items:center;position:relative}
.nb{flex:none;width:56px;height:56px;box-sizing:border-box;background:${bev('#ffe08a','#f2c23c','#c99a1e',5,7)};color:#3a2410;font-size:33px;text-align:center;line-height:50px;border:4px solid #000;clip-path:${clip}}
.pt{display:flex;flex-direction:column;gap:2px}.ph{font-size:33px;color:#ffd84a;text-shadow:${O1};line-height:1.2}.pd{font-size:22px;color:#e8e4f0;line-height:1.35}`;
const AV='file:///'+path.join(D,'..','채널','배지_원.png').split(path.sep).join('/');
const css2=`.dim .pi,.dim .tag{filter:brightness(.45)}
.bd{position:absolute;right:12px;bottom:8px;width:132px}.bd .av{width:132px;height:132px;transform:scaleX(-1);background:url(${AV}) center/100% no-repeat;image-rendering:pixelated}
.bd .nm{margin-top:4px;text-align:center;font-size:11px;color:#f2c23c;text-shadow:${O1}}
.bb{position:absolute;right:136px;bottom:44px;width:300px}.bb .in{background:${bev('#ffe08a','#f2c23c','#c99a1e',4,6)};color:#3a2410;padding:14px 20px 20px;font-size:22px;line-height:1.5}
.bb .pt{position:absolute;right:-22px;bottom:8px;width:26px;height:26px;background:#f2c23c;clip-path:polygon(0 0,100% 100%,0 100%)}`;
const page=(right,extra='')=>`<!doctype html><meta charset="utf-8"><style>${css}${css2}</style><div class="rbg"></div>
<div class="t sh"><div class="o"><div class="in">이 영상은 개발일지</div></div></div>
<div class="vid"><div class="o"><div class="bd0"><div class="cm">▲ COMM</div><div class="bz"><div class="pw">▶▶▶<br>POWER</div><div class="sc">게임 녹화 영상 자리</div><div class="gn">BIGTORY</div></div></div></div></div>
<div class="cap sh"><div class="o"><div class="in">저도 영상을 보며 도움을 받아서,<br>내 글도 누군가에게 도움이 될까 해서요.</div></div></div>
${extra?'<style>.rbg,.R{display:none}.t,.vid,.cap{left:242px}</style>':''}<div class="R">${right}</div>${extra}`;
const bubble=x=>`<div class="say sh"><div class="o"><div class="in">${x}</div></div></div>`;
const A=bubble('개발 과정을 <span class="hl">기록</span>으로 남기고 있어요.')+bubble('저도 영상을 보며 도움을 받았거든요.')+bubble('내 글도 누군가에게 <span class="hl">도움</span>이 되면 좋겠어요.');
const item=(n,h,d)=>`<div class="pi sh"><div class="o"><div class="in"><span class="nb">${n}</span><span class="pt"><span class="ph">${h}</span><span class="pd">${d}</span></span></div></div></div>`;
const B=`<div class="tag sh"><div class="o"><div class="in">POINT!</div></div></div>`+item(1,'기록','개발 과정을 남겨요')+item(2,'바람','누군가에게 도움이 되면 좋겠어요')+item(3,'다음 화','덩치 배치 이야기');
fs.mkdirSync(OUT,{recursive:true});
const X='<div class="bd"><div class="av"></div></div>';
for(const [n,h,x] of [['좌영상_A_이야기',A,''],['좌영상_B_POINT',B,''],['좌영상_C_추가이야기',B,X]]){const f=path.join(OUT,n+'.html');fs.writeFileSync(f,page(h,x));execFileSync(E,['--headless','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=1920,1080','--screenshot='+path.join(OUT,n+'.png'),'file:///'+f.split(path.sep).join('/')],{stdio:'ignore'});fs.unlinkSync(f)}
console.log('ok');
