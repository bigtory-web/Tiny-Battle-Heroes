// 사용: node 소스/콘티만들기.js  → 홍보/데브로그1화_콘티.html + 소스/콘티/*.png
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const E='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT=path.join(__dirname,'콘티');
const css=fs.readFileSync(path.join(__dirname,'말풍선','도트_1241.html'),'utf8').match(/<style>([\s\S]*?)<\/style>/)[1]
  .replace(/\.row\{[^}]*\}/,'.row{display:flex;flex-direction:column;margin:0 80px 26px}');
const me=(t)=>({who:'me',name:'사용자',t}), ai=(t)=>({who:'ai',name:'AI 기획 세션',t});
const hl=(s)=>`<span class="hl">${s}</span>`;
// time: 대본 시간, stamp: 화면 위 시각, shot: 찍을 것(게임·문서 화면), status: 소스 상태
const S=[
 {time:'0:00~0:12',title:'훅',shot:'옛 3×3 화면(덩치 점·회전)에서 컷 → 말풍선',msgs:[me('덩치 그거는 빼자. 다시 롤백.')],stamp:'2026-11-23 12:49',say:'2시간 반 만들고, 버렸다',status:'말풍선 ✔ / 옛 화면 ✖ 안 열어 봄'},
 {time:'0:12~0:35',title:'게임 소개',shot:'지금 게임 짧게(편성·전투) + 세션 목록 화면',say:'혼자 + AI 세션 팀으로 만드는 픽셀 오토배틀러. 오늘은 기획 세션과의 대화 하나',status:'바로 찍음 가능(8766)'},
 {time:'0:35~1:15',title:'아이디어',stamp:'2026-11-23 11:24 ~ 11:27',msgs:[me('백팩 시스템처럼 소형·중형·대형처럼 코스트 형식으로도 해볼까?'),me('인원 제한 대신 쓸 거야. 덩치로 새로 정해볼까 해. 일단 직업으로 좀 구분할까?')],shot:'덩치 표 카드(기사 3 / 전사·마법사 2 / 나머지 1) — 이 칸에 겹쳐 넣기',say:'출전 인원 대신 "덩치"로 제한해 보자',status:'말풍선 ✔ / 덩치 표 카드 ✖ 아직'},
 {time:'1:15~2:00',title:'불편한데 계속',stamp:'2026-11-23 12:01 ~ 12:17',msgs:[me('코스트 넣으니까 직관적이지가 않아서 괜히 불편한 게 있다..'),me('코스트 방식은 일단 뷰가 중요하니까 최대한 수정해 보고 롤백해야겠다 그치?')],shot:'옛 화면(3×3) 플레이: 끌기 미리 보기, 회전, 덩치 점',say:'불편한데… 일단 보면서 고쳐 보자. 스위치는 남겨 두고',status:'말풍선 ✔ / 옛 화면 ✖ 안 열어 봄'},
 {time:'2:00~2:20',title:'핵심 질문',stamp:'2026-11-23 12:41',msgs:[me('불편한 느낌이 크다.. 일단 배치의 즐거움이 크게 없어. 왜 그럴까?')],say:'배치의 즐거움이 크게 없어. 왜 그럴까?',status:'✔ 완성'},
 {time:'2:20~2:45',title:'AI의 첫 답',stamp:'2026-11-23 12:41',msgs:[ai('제 생각에 가장 큰 이유는 '+hl('배치를 잘해도 돌아오는 게 거의 없어서')+'예요.'),ai('덩치, 코스트, 회전은 모두 '+hl('"못 놓는 이유"')+'예요.')],say:'(자막만)',status:'✔ 완성'},
 {time:'2:45~3:05',title:'반박 1·2',stamp:'2026-11-23 12:45 ~ 12:46',msgs:[me('제약적인 게 재미로 오느냐는 또 달라..'),me('그리고 애초에.. 얻어지는 영웅이 랜덤인데')],say:'(자막만)',status:'✔ 완성'},
 {time:'3:05~3:20',title:'반박 3 → 인정',stamp:'2026-11-23 12:47',msgs:[me('이 영웅과 저 영웅, 이건 사실 칸수 제한으로 생기는 이슈는 아니잖아. 그치?'),ai('네, 맞아요. 둘은 다른 문제예요. '+hl('제가 두 가지를 섞어서 말했어요.'))],say:'(자막만)',status:'✔ 완성'},
 {time:'3:20~3:45',title:'롤백',stamp:'2026-11-23 12:48 ~ 12:49',msgs:[me('지금처럼 1칸 2칸 3칸 이런 코스트 방식은 맞지 않는 것 같아'),me('덩치 그거는 빼자. 다시 롤백.')],shot:'→ 지금 육각 화면으로 컷',say:'롤백. 3×3까지 전부',status:'말풍선 ✔ / 지금 화면 바로 가능'},
 {time:'3:45~4:20',title:'다음 방향',stamp:'2026-11-23 13:43',msgs:[me('유물들도 열에 관련해서 있으면 좋겠네. 1열 2열 3열 기준으로 전방열·중반열·후반열로 하면 되려나?')],shot:'지금 게임: 배치를 바꿀 때 열 유물 켜짐·꺼짐 표시',say:'칸 모양 대신 "어느 열에 섰나"에 효과를 붙였다',status:'말풍선 ✔ / 지금 화면 바로 가능'},
 {time:'4:20~4:50',title:'기록',stamp:'2026-11-23 13:59',msgs:[me('내가 코스트 안 쓴 이유 MD 파일에 잘 지정해놔. 내가 비슷한 의견들 내놓으면 일단 그때 히스토리 잘 말해줘.')],shot:'기획결정기록.md 열어 1번 항목 스크롤',say:'버린 기획도 기록한다. 비슷한 아이디어가 다시 나오면 AI가 먼저 이 기록을 꺼낸다',status:'말풍선 ✔ / 파일 화면 바로 가능'},
 {time:'4:50~5:00',title:'마무리',shot:'타이틀 카드 "제약은 그 자체로는 재미가 아니다" + 다음 화 예고 + 게임 이름',say:'제약은 그 자체로는 재미가 아니다',status:'카드 ✖ 아직'}
];
const E_ARGS=(w,h,png,url)=>['--headless','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1',`--window-size=${w},${h}`,`--screenshot=${png}`,url];
const u=(p)=>'file:///'+p.split(path.sep).join('/');
S.forEach((s,i)=>{ if(!s.msgs) return;
  const body=(s.stamp?`<div class="t"><span>${s.stamp}</span></div><div style="height:78px"></div>`:'')+
   s.msgs.map(m=>`<div class="row ${m.who}"><div class="who">${m.name}</div><div class="b"><div class="o"><div class="i">${m.t}</div></div><div class="tail"></div></div></div>`).join('');
  const n=String(i+1).padStart(2,'0'), h=path.join(OUT,`장면${n}.html`), small=path.join(OUT,`장면${n}_small.png`), big=path.join(OUT,`장면${n}.png`);
  fs.writeFileSync(h,`<!doctype html><meta charset="utf-8"><style>${css}.t{top:30px}</style>${body}`);
  execFileSync(E,E_ARGS(960,540,small,u(h)),{stdio:'ignore'});
  fs.writeFileSync(path.join(OUT,'키우기.html'),`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#000}img{width:1920px;height:1080px;image-rendering:pixelated;display:block}</style><img src="장면${n}_small.png">`);
  execFileSync(E,E_ARGS(1920,1080,big,u(path.join(OUT,'키우기.html'))),{stdio:'ignore'});
  fs.unlinkSync(h); s.img=`소스/콘티/장면${n}.png`;
});
fs.unlinkSync(path.join(OUT,'키우기.html'));
S.forEach((s,i)=>{const n=String(i+1).padStart(2,'0');try{fs.unlinkSync(path.join(OUT,`장면${n}_small.png`))}catch(e){}});
const rows=S.map((s,i)=>`<section><div class="no">${String(i+1).padStart(2,'0')}<small>${s.time}</small></div>
<div class="scr">${s.img?`<img src="${s.img}">`:`<div class="ph">찍을 화면</div>`}${s.shot?`<div class="shot">🎬 ${s.shot}</div>`:''}</div>
<div class="txt"><h3>${s.title}</h3><p class="say">${s.say}</p></div><div class="st">${s.status}</div></section>`).join('\n');
fs.writeFileSync(path.join(__dirname,'..','데브로그1화_콘티.html'),`<!doctype html><meta charset="utf-8"><title>데브로그 1화 콘티</title><style>
body{background:#17141d;color:#e8e4f0;font-family:"Malgun Gothic",sans-serif;margin:0;padding:24px 32px}
h1{font-size:22px;margin:0 0 4px}.sub{color:#a79fb8;font-size:14px;margin-bottom:20px}
section{display:grid;grid-template-columns:92px 440px 1fr 190px;gap:16px;align-items:start;padding:14px 0;border-top:2px solid #2e2a3c}
.no{font-size:26px;font-weight:bold;color:#f2c23c}.no small{display:block;font-size:12px;color:#a79fb8;font-weight:normal;margin-top:2px}
.scr img{width:440px;height:247.5px;display:block;border:3px solid #000;outline:2px solid #3b3550}
.ph{width:440px;height:247.5px;border:3px dashed #54496e;display:flex;align-items:center;justify-content:center;color:#6d6482;font-size:15px;box-sizing:border-box}
.shot{margin-top:6px;font-size:13px;color:#ffd84a;line-height:1.4}
h3{margin:0 0 6px;font-size:17px}.say{margin:0;font-size:15px;line-height:1.5;color:#fff}
.st{font-size:13px;color:#a79fb8;line-height:1.5}
</style><h1>데브로그 1화 콘티 — 덩치 배치, 2시간 반 만에 넣고 뺀 기능</h1>
<div class="sub">약 5분 · 가로 16:9 · 왼쪽부터 시간 / 화면 미리보기 / 자막·내레이션 / 소스 상태 · 🎬 = 따로 찍거나 만들 화면</div>
${rows}`);
console.log('ok',S.length);
