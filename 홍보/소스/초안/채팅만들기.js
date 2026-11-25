// 채팅 말풍선 v2: 글자 또렷(zoom:2), 모서리 2픽셀, 새 말풍선이 아래에서 위로 밀려 올라옴, 사용자 얼굴 = 프로필 캐릭터.
// 사용: node 채팅만들기.js → 채팅/프레임NN.png + 채팅/길이.json (조립: node 조립_범용.js 채팅 뼈대_채팅.mp4)
const fs=require('fs'),path=require('path'),{execFile}=require('child_process');
const E='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',D=__dirname,OUT=path.join(D,'채팅');
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
// 사용자 = 프로필 캐릭터 얼굴 확대, AI = 요정
const AV={me:'../../채널/개발자_전신.png',ai:'../../../../img/p/ev_fairy.png'}, NAME={me:'사용자',ai:'AI 기획 세션'};
const C=+process.env.C||4;
const clip=`polygon(0 ${C}px,${C}px ${C}px,${C}px 0,calc(100% - ${C}px) 0,calc(100% - ${C}px) ${C}px,100% ${C}px,100% calc(100% - ${C}px),calc(100% - ${C}px) calc(100% - ${C}px),calc(100% - ${C}px) 100%,${C}px 100%,${C}px calc(100% - ${C}px),0 calc(100% - ${C}px))`;
const bev=(hi,mid,lo,t=5,b=7)=>`background:linear-gradient(${hi} 0 ${t}px,${mid} ${t}px calc(100% - ${b}px),${lo} calc(100% - ${b}px))`;
const css=`html{zoom:2}html,body{margin:0;width:960px;height:540px;overflow:hidden;font-family:"Malgun Gothic",sans-serif;background:#17141d;
background-image:linear-gradient(45deg,#1d1926 25%,transparent 25%,transparent 75%,#1d1926 75%),linear-gradient(45deg,#1d1926 25%,transparent 25%,transparent 75%,#1d1926 75%);background-size:8px 8px;background-position:0 0,4px 4px}
#vp{position:absolute;left:0;right:0;top:56px;bottom:20px;overflow:hidden;-webkit-mask-image:linear-gradient(transparent 0,#000 28px)}
#st{position:absolute;left:0;right:0;top:0}
.c{display:inline}
.b{position:relative}
.pt1,.pt2{position:absolute;top:50%}
.pt1{width:18px;height:30px;margin-top:-17px;background:#000;clip-path:polygon(0 0,6px 0,6px 6px,12px 6px,12px 10px,18px 10px,18px 20px,12px 20px,12px 24px,6px 24px,6px 30px,0 30px)}
.pt2{width:14px;height:20px;margin-top:-11px;clip-path:polygon(0 0,4px 0,4px 3px,8px 3px,8px 6px,14px 6px,14px 14px,8px 14px,8px 17px,4px 17px,4px 20px,0 20px)}
.me .pt1{left:100%;margin-left:-3px}.me .pt2{left:100%;margin-left:-2px;background:#f2c23c}
.ai .pt1{right:100%;margin-right:-3px;transform:scaleX(-1)}.ai .pt2{right:100%;margin-right:-2px;background:#463e60;transform:scaleX(-1)}

.cur{display:inline-block;width:3px;height:0.95em;margin-left:1px;vertical-align:-0.12em;background:currentColor}
.m{display:flex;align-items:flex-end;gap:12px;margin:0 36px 16px}.m.me{flex-direction:row-reverse}
.av{flex:none;width:58px;height:58px;box-sizing:border-box;border:3px solid #000;outline:2px solid #3b3550;background-repeat:no-repeat;overflow:hidden}
.me .av{transform:scaleX(-1);background-color:#f2c23c;background-size:260%;background-position:53% 50%}.ai .av{background-color:#54496e;background-size:100%;background-position:50% 50%;image-rendering:pixelated}
.col{display:flex;flex-direction:column;max-width:760px}.me .col{align-items:flex-end}
.who{font-size:12px;font-weight:bold;color:#a79fb8;margin-bottom:3px}.me .who{color:#f2c23c}
.who i{font-style:normal;font-weight:normal;color:#6d6482;margin-left:6px}
.b{filter:drop-shadow(0 4px 0 #0a0810)}.o{background:#000;padding:4px;clip-path:${clip}}
.i{position:relative;padding:20px 28px 26px 28px;font-size:20px;line-height:1.5;clip-path:${clip}}
.me .i{${bev('#ffe08a','#f2c23c','#c99a1e',4,6)};color:#3a2410}
.ai .i{${bev('#6a5d8c','#463e60','#2a2539',4,6)};color:#fff}
.hl{color:#ffd84a;font-weight:bold}
.t{position:absolute;top:16px;left:0;right:0;text-align:center;color:#a79fb8;font-size:15px}.t span{background:#17141d;padding:2px 10px;border:2px solid #000;outline:2px solid #3b3550}`;
const u=p=>'file:///'+p.split(path.sep).join('/');
fs.mkdirSync(OUT,{recursive:true});
const ANIM=[{dy:20,op:0.35,f:1},{dy:10,op:0.75,f:0.45},{dy:0,op:1,f:0.12}]; // POINT와 같은 올라옴: 새 말풍선이 아래에서 올라오며 선명해짐(f: 스크롤이 필요할 때 남은 이동 비율)
const STEPS=5; // 글자가 나타나는 단계 수(한 글자씩 나타나는 느낌)
const START=150; // 첫 말풍선 시작 높이(작은 화면 px, 가운데 근처)
const dur=[];let fn=0;
// 글자 수(마크업 제외) 세기와 n글자까지만 보이게 하기(나머지는 자리만 차지하고 안 보임)
const plainLen=x=>x.replace(/<[^>]+>/g,'').length;
function typed(x,n,cur){let i=0,out='';const put=()=>cur?'<span class="cur"></span>':'';if(n===0)out+=put();for(const tk of x.split(/(<span class="hl">|<\/span>)/)){if(tk==='<span class="hl">'||tk==='</span>'){out+=tk;continue}for(const ch of tk){if(ch===' '){out+=ch;continue}if(i<n){out+=ch;i++;if(i===n)out+=put()}else{out+='<span class="c" style="visibility:hidden">'+ch+'</span>';i++}}}return out}
function render(k,an,n,cur,fnum,nx){
  const items=M.slice(0,k).map(([w,t,x],j)=>{const last=j===k-1;const body=(last&&n!==undefined?typed(x,n,cur):x);return `<div class="m ${w}"><div class="av" style="background-image:url(${AV[w]})"></div><div class="col"><div class="who">${NAME[w]}<i>${t}</i></div><div class="b"><div class="o"><div class="i">${body}</div></div><div class="pt1"></div><div class="pt2"></div></div></div></div>`}).join('');
  // 배치: 가운데 근처(START)에서 시작해 아래로 쌓이고, 아래 끝에 닿으면 위로 밀림. an이 있으면 올라오는 중
  const js=`<script>const vp=document.getElementById('vp'),st=document.getElementById('st'),kids=[...st.children],l=kids[kids.length-1],Hv=vp.clientHeight,hh=e=>e.offsetHeight+16;
const Hc=kids.reduce((a,e)=>a+hh(e),0),Hp=Hc-hh(l),T=H=>${START}+H<=Hv?${START}:Hv-H;
const A=${an?JSON.stringify(an):'{dy:0,op:1,f:0}'};const tf=T(Hc),tp=kids.length>1?T(Hp):tf;
st.style.top=(tf+(tp-tf)*A.f)+'px';l.style.transform='translateY('+A.dy+'px)';l.style.opacity=A.op;</script>`;
  const html=`<!doctype html><meta charset="utf-8"><style>${css}</style><div class="t"><span>2026-11-23 · ${M[k-1][1]}</span></div><div id="vp"><div id="st">${items}</div></div>${js}`;
  const nn=String(fnum).padStart(3,'0'),h=path.join(OUT,`f${nn}.html`),big=path.join(OUT,`프레임${nn}.png`);
  fs.writeFileSync(h,html);
  return new Promise(res=>execFile(E,['--headless','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=1920,1080','--screenshot='+big,u(h)],()=>{fs.unlinkSync(h);res()}));
}
const jobs=[];
M.forEach((m,k)=>{
  const L=plainLen(m[2]);
  const hold=Math.min(6,Math.max(2.2,1+L*0.09));
  for(const an of ANIM){jobs.push([k+1,an,0,false]);dur.push(0.07)}   // 올라옴(글자는 아직 없음)
  for(let i=1;i<L;i++){jobs.push([k+1,null,i,true]);dur.push(0.055)}   // 한 글자씩 + 커서
  jobs.push([k+1,null,L,false]);dur.push(hold); // 다 나온 상태가 유지 시간
});
(async()=>{let next=0;const worker=async()=>{while(next<jobs.length){const j=next++;{const q=jobs[j];await render(q[0],q[1],q[2],q[3],j+1,q[4])}}};await Promise.all(Array.from({length:5},worker));
fs.writeFileSync(path.join(OUT,'길이.json'),JSON.stringify(dur));
console.log('frames',dur.length,'sec',dur.reduce((a,b)=>a+b,0).toFixed(1));})();
