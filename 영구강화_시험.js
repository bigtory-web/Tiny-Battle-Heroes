// 영구 강화 엔진 자체 시험(2026-11-27). 실행: node 영구강화_시험.js
const assert=require("assert");const D=require((process.argv[2]||".")+"/data.js"),E=require((process.argv[2]||".")+"/engine.js");
// 다 찍은 상태
const full={medals:0,nodes:{}}; D.meta.lines.forEach(L=>L.nodes.forEach(N=>full.nodes[N.id]=N.cost.length));
const M=E.metaData(D,full);
assert.strictEqual(D.player.bag[0],5,"원본 그대로"); assert.strictEqual(M.player.bag[0],7); assert.strictEqual(M.player.bag[9],7,"cap");
assert.strictEqual(M.player.skillSlots[0],6); assert.strictEqual(M.player.potion[0],3);
assert.deepStrictEqual(M.player.shopGrade[0],D.player.shopGrade[2],"앞당김 2칸");
assert.strictEqual(M.shop.refreshMax,D.shop.refreshMax+2); assert.strictEqual(M.campaign.startGold,150); assert.strictEqual(M.life.max,16);
assert.deepStrictEqual(M.recruit.reroll.max,[2]); assert.strictEqual(D.recruit.reroll.max[0],1);
assert.strictEqual(M.player.clearGold[0],150);
assert.ok(Math.abs(M.heroBoost.guardian.hp-0.10)>=0 && Math.abs(M.heroBoost.guardian.hp-0.15)<1e-9);
// 자유형 망: 가운데(모닥불)부터, 앞 칸을 찍어야 열림
const st={medals:20,nodes:{}}; assert.strictEqual(E.metaStatus(D,st,"bag"),"locked"); assert.strictEqual(E.metaStatus(D,st,"start"),"open");
assert.ok(!E.metaBuy(D,st,"bag"),"앞 칸 안 찍음"); assert.ok(E.metaBuy(D,st,"start")); assert.strictEqual(E.metaStatus(D,st,"start"),"max"); assert.strictEqual(E.metaStatus(D,st,"bag"),"open");
assert.ok(E.metaBuy(D,st,"bag")); assert.strictEqual(st.medals,9); assert.strictEqual(E.metaStatus(D,st,"potion"),"open");
st.nodes={start:1,bag:1}; st.medals=0;
assert.strictEqual(D.events.campfire.startPicks,1); assert.strictEqual(E.metaData(D,{nodes:{start:1}}).events.campfire.startPicks,2); assert.strictEqual(D.events.campfire.startPicks,1,"원본 그대로");

assert.strictEqual(E.metaMedals(D,10,false),10+2*2); assert.strictEqual(E.metaMedals(D,10,true),24);
// 전투: 우리 편만 강해짐
const b0=E.createBattle(D,[{id:"knight",level:3,slot:0}],[{id:"knight",level:3,slot:0}],{seed:1}), b1=E.createBattle(M,[{id:"knight",level:3,slot:0}],[{id:"knight",level:3,slot:0}],{seed:1});
assert.ok(Math.abs(b1.A[0].maxHp/b0.A[0].maxHp-1.24)<1e-9 && b1.E[0].maxHp===b0.E[0].maxHp,"적은 그대로");
// 봇
let c0=0,c1=0; for(let s=1;s<=8;s++){ c0+=E.campaign(D,{seed:s}).cleared; c1+=E.campaign(D,{seed:s,meta:full}).cleared; const D2=E.chapterData(D,2); E.campaign(D2,{seed:s,meta:full}); }
console.log("ok · 훈장 합",D.meta.lines.reduce((a,L)=>a+L.nodes.reduce((b,N)=>b+N.cost.reduce((x,y)=>x+y,0),0),0),"· 봇 클리어 판 합(8판) 강화 전",c0,"후",c1);
// "영구 강화로" 모드: 옮긴 줄은 Lv1 값 고정, 등장 확률·출전 인원은 그대로
const MM=E.metaData(D,{mode:"meta"}); assert.ok(MM.player.bag.every(v=>v===D.player.bag[0])); assert.ok(MM.player.clearGold.every(v=>v===D.player.clearGold[0])); assert.ok(MM.player.mimicBlue.every(v=>v===D.player.mimicBlue[0]));
assert.deepStrictEqual(MM.player.field,D.player.field); assert.deepStrictEqual(MM.player.heroGrade,D.player.heroGrade); assert.deepStrictEqual(MM.player.shopGrade,D.player.shopGrade);
const MF=E.metaData(D,{mode:"meta",nodes:full.nodes}); assert.ok(MF.player.bag.every(v=>v===7)); assert.strictEqual(E.metaData(D,{mode:"level"}),D,"레벨 모드 + 강화 없음 = 원본");
let cm=0; for(let s=1;s<=5;s++){ cm+=E.campaign(D,{seed:s,meta:{mode:"meta"}}).cleared; E.campaign(E.chapterData(D,2),{seed:s,meta:{mode:"meta",nodes:full.nodes}}); }
console.log("ok · 영구 강화 모드(강화 0) 봇 클리어 판 합(5판)",cm);
// 제약(난이도): 쉬움 = 원본, 보통·어려움 = 적 레벨·등급·유물·훈장 배율, 장 정보 유지
{ const N=E.difficultyData(D,"normal"),H=E.difficultyData(D,"hard"),C2=E.chapterData(D,2);
  assert.strictEqual(E.difficultyData(D,"easy"),D); assert.strictEqual(N.campaign.enemyLv[3],D.campaign.enemyLv[3]+1); assert.strictEqual(H.campaign.enemySkills.table[0].from,0);
  assert.strictEqual(E.metaMedals(H,10,false),E.metaMedals(D,10,false)*2); assert.ok(E.difficultyData(C2,"hard").campaign.swamp,"장 정보 유지");
  const MH=E.metaData(H,{nodes:{bag:1}}); assert.strictEqual(MH.campaign.diff.id,"hard","강화와 같이 써도 제약 유지");
  console.log("ok · 제약"); }
