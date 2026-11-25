// 채팅 말풍선 프레임: 메시지가 하나씩 늘고, 넘치면 위로 밀림. 출력: 채팅/프레임NN.png + 채팅/길이.json
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const E='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', D=__dirname, OUT=path.join(D,'채팅');
const hl=s=>`<span class="hl">${s}</span>`;
const M=[
 ['me','12:41','불편한 느낌이 크다.. 일단 배치의 즐거움이 크게 없어. 왜 그럴까?'],
 ['ai','12:41','제 생각에 가장 큰 이유는 '+hl('배치를 잘해도 돌아오는 게 거의 없어서')+'예요.'],
 ['ai','12:41','덩치, 코스트, 회전은 모두 '+hl('"못 놓는 이유"')+'예요.'],
 ['me','12:45','제약적인 게 재미로 오느냐는 또 달라..'],
 ['me','12:46','그리고 애초에.. 얻어지는 영웅이 랜덤인데'],
 ['me','12:47','이 영웅과 저 영웅, 이건 사실 칸수 제한으로 생기는 이슈는 아니잖아. 그치?'],
 ['ai','12:47','네, 맞아요. 둘은 다른 문제예요. '+hl('제가 두 가지를 섞어서 말했어요.')],
 ['me','12:48','지금처럼 1칸 2칸 3칸 이런 코스트 방식은 맞지 않는 것 같아'],
 ['me','12:49','덩치 그거는 빼자. 다시 롤백.']
];
const AV={me:'../../../../img/p/knight.png',ai:'../../../../img/p/ev_fairy.png'}, NAME={me:'사용자',ai:'AI 기획 세션'};
const clip=`polygon(0 12px,6px 12px,6px 6px,12px 6px,12px 0,calc(100% - 12px) 0,calc(100% - 12px) 6px,calc(100% - 6px) 6px,calc(100% - 6px) 12px,100% 12px,100% calc(100% - 12px),calc(100% - 6px) calc(100% - 12px),calc(100% - 6px) calc(100% - 6px),calc(100% - 12px) calc(100% - 6px),calc(100% - 12px) 100%,12px 100%,12px calc(100% - 6px),6px calc(100% - 6px),6px calc(100% - 12px),0 calc(100% - 12px))`;
const css=`html,body{margin:0;width:960px;height:540px;overflow:hidden;font-family:"Malgun Gothic",sans-serif;background:#17141d;
background-image:linear-gradient(45deg,#1d1926 25%,transparent 25%,transparent 75%,#1d1926 75%),linear-gradient(45deg,#1d1926 25%,transparent 25%,transparent 75%,#1d1926 75%);background-size:8px 8px;background-position:0 0,4px 4px}
#vp{position:absolute;left:0;right:0;top:56px;bottom:20px;overflow:hidden;-webkit-mask-image:linear-gradient(transparent 0,#000 28px)}
#st{position:absolute;left:0;right:0;bottom:0}
.m{display:flex;align-items:flex-end;gap:12px;margin:0 36px 16px}
.m.me{flex-direction:row-reverse}
.av{flex:none;width:58px;height:58px;box-sizing:border-box;border:3px solid #000;outline:2px solid #3b3550;background:#2e2a3c url() no-repeat;background-size:100%;background-position:50% 50%;image-rendering:pixelated}
.me .av{background-color:#f2c23c}.ai .av{background-color:#54496e}
.col{display:flex;flex-direction:column;max-width:760px}.me .col{align-items:flex-end}
.who{font-size:12px;font-weight:bold;color:#a79fb8;margin-bottom:3px}.me .who{color:#f2c23c}
.who i{font-style:normal;font-weight:normal;color:#6d6482;margin-left:6px}
.b{filter:drop-shadow(0 4px 0 #0a0810)}.o{background:#000;padding:4px;clip-path:${clip}}
.i{padding:10px 16px;font-size:20px;line-height:1.45;clip-path:${clip}}
.me .i{background:#f2c23c;color:#3a2410;box-shadow:inset 0 -4px 0 #c99a1e,inset 0 3px 0 #ffe08a}
.ai .i{background:#3a3450;color:#fff;box-shadow:inset 0 -4px 0 #2a2539,inset 0 3px 0 #54496e}
.hl{color:#ffd84a;font-weight:bold}
.t{position:absolute;top:16px;left:0;right:0;text-align:center;color:#a79fb8;font-size:15px}.t span{background:#17141d;padding:2px 10px;border:2px solid #000;outline:2px solid #3b3550}`;
const u=p=>'file:///'+p.split(path.sep).join('/');
const dur=[];
M.forEach((m,k)=>{
  const plain=m[2].replace(/<[^>]+>/g,'');
  dur.push(Math.min(7,Math.max(3,1.5+plain.length*0.1)));
  const items=M.slice(0,k+1).map(([w,t,x],j)=>`<div class="m ${w}"><div class="av" style="background-image:url(${AV[w]})"></div><div class="col"><div class="who">${NAME[w]}<i>${t}</i></div><div class="b"><div class="o"><div class="i">${x}</div></div></div></div></div>`).join('');
  const n=String(k+1).padStart(2,'0'),h=path.join(OUT,`f${n}.html`),s=path.join(OUT,`f${n}_s.png`),big=path.join(OUT,`프레임${n}.png`),kk=path.join(OUT,'k.html');
  fs.writeFileSync(h,`<!doctype html><meta charset="utf-8"><style>${css}</style><div class="t"><span>2026-11-23 · ${m[1]}</span></div><div id="vp"><div id="st">${items}</div></div>`);
  execFileSync(E,['--headless','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=960,540','--screenshot='+s,u(h)],{stdio:'ignore'});
  fs.writeFileSync(kk,`<!doctype html><style>html,body{margin:0}img{width:1920px;height:1080px;image-rendering:pixelated;display:block}</style><img src="f${n}_s.png">`);
  execFileSync(E,['--headless','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=1920,1080','--screenshot='+big,u(kk)],{stdio:'ignore'});
  for(const f of [h,s,kk])fs.unlinkSync(f);
});
fs.writeFileSync(path.join(OUT,'길이.json'),JSON.stringify(dur));
console.log('frames',M.length,'sec',dur.reduce((a,b)=>a+b,0).toFixed(1));
