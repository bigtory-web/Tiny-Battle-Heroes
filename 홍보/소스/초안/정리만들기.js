// 최종 정리 카드: 왼쪽에 정리 항목이 하나씩(POINT식, 타이핑) 생기고, 오른쪽 아래의 사용자 캐릭터(반전·상반신)가 말하듯 위아래로 통통 튐.
// 사용: node 정리만들기.js → 정리/프레임NNN.png + 정리/길이.json (조립: node 조립_범용.js 정리 정리샘플.mp4)
const fs=require('fs'),path=require('path'),{execFile}=require('child_process');
const E='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',D=__dirname,OUT=path.join(D,'정리');
const hl=s=>`<span class="hl">${s}</span>`;
const TITLE='오늘의 정리';
const ITEMS=['재밌다고 내 게임에서도 '+hl('재밌진 않았다'),'제약은 그 자체로는 '+hl('재미가 아니다'),'문제는 '+hl('둘로 나눠서') +' 본다','버린 기획도 '+hl('기록')+'한다'];
const C=+process.env.C||4;
const clip=`polygon(0 ${C}px,${C}px ${C}px,${C}px 0,calc(100% - ${C}px) 0,calc(100% - ${C}px) ${C}px,100% ${C}px,100% calc(100% - ${C}px),calc(100% - ${C}px) calc(100% - ${C}px),calc(100% - ${C}px) 100%,${C}px 100%,${C}px calc(100% - ${C}px),0 calc(100% - ${C}px))`;
const bev=(hi,mid,lo,t=5,b=7)=>`background:linear-gradient(${hi} 0 ${t}px,${mid} ${t}px calc(100% - ${b}px),${lo} calc(100% - ${b}px))`;
const css=`html{zoom:2}html,body{margin:0;width:960px;height:540px;overflow:hidden;font-family:"Malgun Gothic",sans-serif;color:#fff;background:#17141d;
background-image:linear-gradient(45deg,#1d1926 25%,transparent 25%,transparent 75%,#1d1926 75%),linear-gradient(45deg,#1d1926 25%,transparent 25%,transparent 75%,#1d1926 75%);background-size:8px 8px;background-position:0 0,4px 4px}
.rays{position:absolute;inset:0;background:repeating-conic-gradient(from var(--a,0deg) at 82% 76%,#221c30 0 7.5deg,transparent 7.5deg 15deg);opacity:.85}
.vig{position:absolute;inset:0;background:radial-gradient(ellipse at 60% 60%,transparent 40%,#0b0910 100%)}
.hero{position:absolute;right:0;bottom:-70px;height:460px;transform:scaleX(-1);filter:drop-shadow(0 6px 0 #0a0810)}
.fr{filter:drop-shadow(0 5px 0 #0a0810)}.fr>.o{background:#000;padding:4px;clip-path:${clip}}.fr .i{clip-path:${clip}}
.tag{position:absolute;left:36px;top:26px}.tag .i{${bev('#ffe08a','#f2c23c','#c99a1e',6,8)};color:#3a2410;font-weight:bold;font-size:28px;padding:6px 26px 12px;letter-spacing:2px}
.list{position:absolute;left:36px;top:104px;width:560px}
.pi{margin-bottom:16px;display:block}
.pi .i{${bev('#6a5d8c','#463e60','#2a2539',6,8)};padding:12px 18px 18px 14px;display:flex;gap:14px;align-items:center;min-height:44px}
.nb{flex:none;width:38px;height:38px;${bev('#ffe08a','#f2c23c','#c99a1e',4,5)};color:#3a2410;font-weight:bold;font-size:22px;text-align:center;line-height:32px;border:3px solid #000;box-sizing:border-box}
.tx{font-size:26px;font-weight:bold;line-height:1.3;text-shadow:0 3px 0 #000,2px 0 #000,-2px 0 #000}
.hl{color:#ffd84a}
.cur{display:inline-block;width:3px;height:0.95em;margin-left:1px;vertical-align:-0.12em;background:currentColor}`;
const u=p=>'file:///'+p.split(path.sep).join('/');
fs.mkdirSync(OUT,{recursive:true});
const plainLen=x=>x.replace(/<[^>]+>/g,'').length;
function typed(x,n,cur){let i=0,out='';const put=()=>cur?'<span class="cur"></span>':'';if(n===0)out+=put();for(const tk of x.split(/(<span class="hl">|<\/span>)/)){if(tk==='<span class="hl">'||tk==='</span>'){out+=tk;continue}for(const ch of tk){if(ch===' '){out+=ch;continue}if(i<n){out+=ch;i++;if(i===n)out+=put()}else{out+='<span style="visibility:hidden">'+ch+'</span>';i++}}}return out}
const ANIM=[{dy:20,op:0.35},{dy:10,op:0.75},{dy:0,op:1}]; // POINT와 같은 올라옴
function frameHtml(k,an,n,cur,bob,fnum){
  const items=ITEMS.slice(0,k).map((x,j)=>{const last=j===k-1;const body=last&&n!==undefined?typed(x,n,cur):x;const st=last&&an?` style="transform:translateY(${an.dy}px);opacity:${an.op}"`:'';
    return `<div class="pi fr"${st}><div class="o"><div class="i"><span class="nb">${j+1}</span><span class="tx">${body}</span></div></div></div>`}).join('');
  return `<!doctype html><meta charset="utf-8"><style>${css}</style><div class="rays" style="--a:${(fnum*0.4).toFixed(1)}deg"></div><div class="vig"></div>
<img class="hero" src="../../채널/개발자_전신.png" style="margin-bottom:${bob?12:0}px">
<div class="tag fr"><div class="o"><div class="i">${TITLE}</div></div></div><div class="list">${items}</div>`;
}
const jobs=[],dur=[];
ITEMS.forEach((x,k)=>{const L=plainLen(x);
  for(const an of ANIM){jobs.push([k+1,an,0,false,0]);dur.push(0.07)}
  for(let i=1;i<L;i++){jobs.push([k+1,null,i,true,i%2]);dur.push(0.07)} // 말하는 동안 캐릭터가 위아래로
  jobs.push([k+1,null,L,false,0]);dur.push(k===ITEMS.length-1?4:1.1);
});
fs.writeFileSync(path.join(OUT,'길이.json'),JSON.stringify(dur));
(async()=>{let next=0;const worker=async()=>{while(next<jobs.length){const j=next++;const q=jobs[j];const n=String(j+1).padStart(3,'0'),h=path.join(OUT,`s${n}.html`);fs.writeFileSync(h,frameHtml(q[0],q[1],q[2],q[3],q[4],j+1));
 await new Promise(r=>execFile(E,['--headless','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=1920,1080','--screenshot='+path.join(OUT,`프레임${n}.png`),u(h)],()=>{fs.unlinkSync(h);r()}))}};
await Promise.all(Array.from({length:3},worker));console.log('frames',jobs.length,'sec',dur.reduce((a,b)=>a+b,0).toFixed(1))})();
