// 좌: 타이틀 > 세부 > 아래 영상/글 자리 / 우: POINT! + 구분선으로 항목이 하나씩 생김. 출력: 포인트/프레임NN.png, 포인트/길이.json
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const E='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',D=__dirname,OUT=path.join(D,'포인트');
const T={title:'배치와 덩치',
 detail:['더 바자르는 백팩 시스템이에요.','정해진 칸 수, 아이템마다 1·2·3칸.','배치가 쏠쏠하게 재밌어서, 우리 게임에도 넣어 보기로 했어요.'],
 media:'<div class="mt"><div><b>기사</b><span>●●●</span></div><div><b>전사 · 마법사</b><span>●●</span></div><div><b>나머지</b><span>●</span></div></div>',
 points:['칸 수로 <span class="y">배치</span>를 고민하게 하자','영웅마다 <span class="y">덩치</span>를 줌','직업으로 나눔: 기사 3 · 전사·마법사 2 · 나머지 1']};
const css=`html,body{margin:0;width:960px;height:540px;overflow:hidden;font-family:"Malgun Gothic",sans-serif;color:#fff;background:#17141d;
background-image:linear-gradient(45deg,#1d1926 25%,transparent 25%,transparent 75%,#1d1926 75%),linear-gradient(45deg,#1d1926 25%,transparent 25%,transparent 75%,#1d1926 75%);background-size:8px 8px;background-position:0 0,4px 4px}
.L{position:absolute;left:36px;top:30px;width:560px;bottom:30px}
.R{position:absolute;left:640px;right:36px;top:30px;bottom:30px;border-left:4px solid #3b3550;padding-left:24px;box-sizing:border-box}
h1{margin:0 0 14px;font-size:40px;text-shadow:0 4px 0 #000,3px 0 #000,-3px 0 #000,0 -3px 0 #000}
.d{font-size:19px;line-height:1.55;color:#e8e4f0;margin:0 0 4px}
.media{position:absolute;left:0;right:0;bottom:0;height:200px;border:3px solid #000;outline:3px solid #3b3550;background:#221d2c;display:flex;align-items:center;justify-content:center}
.mt{display:flex;flex-direction:column;gap:10px;width:70%}.mt div{display:flex;justify-content:space-between;font-size:24px;background:#3a3450;border:3px solid #000;padding:6px 14px;box-shadow:inset 0 3px 0 #54496e}.mt span{color:#f2c23c;letter-spacing:4px}
.ph{background:#f2c23c;color:#3a2410;font-weight:bold;font-size:30px;display:inline-block;padding:2px 16px;border:3px solid #000;box-shadow:0 4px 0 #0a0810}
.pi{font-size:22px;line-height:1.4;padding:14px 0;border-top:3px dashed #3b3550}
.pi:first-of-type{border-top:0}
.y{color:#f2c23c;font-weight:bold}.n{color:#f2c23c;font-weight:bold;margin-right:6px}`;
const u=p=>'file:///'+p.split(path.sep).join('/');
const dur=[];
for(let k=0;k<=T.points.length;k++){
  dur.push(k===0?2:k===T.points.length?3.5:2.2);
  const items=T.points.slice(0,k).map((p,j)=>`<div class="pi"><span class="n">${j+1}</span>${p}</div>`).join('');
  const html=`<!doctype html><meta charset="utf-8"><style>${css}</style>
<div class="L"><h1>${T.title}</h1>${T.detail.map(x=>`<p class="d">${x}</p>`).join('')}<div class="media">${T.media}</div></div>
<div class="R"><div style="margin-bottom:12px"><span class="ph">POINT!</span></div>${items}</div>`;
  const n=String(k+1).padStart(2,'0'),h=path.join(OUT,`p${n}.html`),s=path.join(OUT,`p${n}_s.png`),big=path.join(OUT,`프레임${n}.png`),kk=path.join(OUT,'k.html');
  fs.writeFileSync(h,html);
  execFileSync(E,['--headless','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=960,540','--screenshot='+s,u(h)],{stdio:'ignore'});
  fs.writeFileSync(kk,`<!doctype html><style>html,body{margin:0}img{width:1920px;height:1080px;image-rendering:pixelated;display:block}</style><img src="p${n}_s.png">`);
  execFileSync(E,['--headless','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=1920,1080','--screenshot='+big,u(kk)],{stdio:'ignore'});
  for(const f of [h,s,kk])fs.unlinkSync(f);
}
fs.writeFileSync(path.join(OUT,'길이.json'),JSON.stringify(dur));
console.log('frames',dur.length);
