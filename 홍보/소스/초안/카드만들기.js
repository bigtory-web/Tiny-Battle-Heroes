const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const E='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const D=__dirname;
const css=`html,body{margin:0;width:960px;height:540px;overflow:hidden;font-family:"Malgun Gothic",sans-serif;background:#17141d;
background-image:linear-gradient(45deg,#1d1926 25%,transparent 25%,transparent 75%,#1d1926 75%),linear-gradient(45deg,#1d1926 25%,transparent 25%,transparent 75%,#1d1926 75%);background-size:8px 8px;background-position:0 0,4px 4px}
.c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.big{font-size:52px;font-weight:bold;color:#fff;text-shadow:0 4px 0 #000,3px 0 #000,-3px 0 #000,0 -3px 0 #000;line-height:1.3}
.y{color:#f2c23c}.small{margin-top:26px;font-size:26px;color:#a79fb8;background:#17141d;border:3px solid #000;outline:3px solid #3b3550;padding:6px 20px}`;
const cards={
 카드_훅:`<div class="c"><div class="big">두 시간 반 만들고,<br>통째로 <span class="y">버렸다</span></div><div class="small">덩치 배치</div></div>`,
 카드_하지만:`<div class="c"><div class="big" style="font-size:64px">하지만<span class="y">..!!</span></div></div>`,
 카드_끝:`<div class="c"><div class="big" style="font-size:40px">재밌다고,<br>내 게임에서까지<br>재밌는 건 <span class="y">아니었다</span></div><div class="small" style="font-size:20px">제약은 그 자체로는 재미가 아니다</div></div>`
};
const u=p=>'file:///'+p.split(path.sep).join('/');
for(const [n,b] of Object.entries(cards)){
 const h=path.join(D,n+'.html'),s=path.join(D,n+'_s.png'),big=path.join(D,n+'.png'),k=path.join(D,'k.html');
 fs.writeFileSync(h,`<!doctype html><meta charset="utf-8"><style>${css}</style>${b}`);
 execFileSync(E,['--headless','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=960,540','--screenshot='+s,u(h)],{stdio:'ignore'});
 fs.writeFileSync(k,`<!doctype html><style>html,body{margin:0}img{width:1920px;height:1080px;image-rendering:pixelated;display:block}</style><img src="${n}_s.png">`);
 execFileSync(E,['--headless','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=1920,1080','--screenshot='+big,u(k)],{stdio:'ignore'});
 for(const f of [h,s,k])fs.unlinkSync(f);
}
console.log('cards ok');
