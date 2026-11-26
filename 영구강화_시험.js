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
// 순서대로 찍기
const st={medals:20,nodes:{}}; assert.strictEqual(E.metaNext(D,st,"bag").node.id,"bag");
assert.ok(E.metaBuy(D,st,"bag")); assert.ok(E.metaBuy(D,st,"bag")); assert.strictEqual(st.medals,2); assert.strictEqual(E.metaNext(D,st,"bag").node.id,"relic"); assert.ok(!E.metaBuy(D,st,"bag"),"훈장 부족");
assert.strictEqual(E.metaExp(D,st),2); assert.strictEqual(E.metaLevel(D,full),1+Math.floor(E.metaExp(D,full)/5));
assert.strictEqual(E.metaMedals(D,10,false),10+2*2); assert.strictEqual(E.metaMedals(D,10,true),24);
// 전투: 우리 편만 강해짐
const b0=E.createBattle(D,[{id:"knight",level:3,slot:0}],[{id:"knight",level:3,slot:0}],{seed:1}), b1=E.createBattle(M,[{id:"knight",level:3,slot:0}],[{id:"knight",level:3,slot:0}],{seed:1});
assert.ok(Math.abs(b1.A[0].maxHp/b0.A[0].maxHp-1.24)<1e-9 && b1.E[0].maxHp===b0.E[0].maxHp,"적은 그대로");
// 봇
let c0=0,c1=0; for(let s=1;s<=8;s++){ c0+=E.campaign(D,{seed:s}).cleared; c1+=E.campaign(D,{seed:s,meta:full}).cleared; const D2=E.chapterData(D,2); E.campaign(D2,{seed:s,meta:full}); }
console.log("ok · 총 단계",E.metaExp(D,full),"토탈Lv",E.metaLevel(D,full),"훈장 합",D.meta.lines.reduce((a,L)=>a+L.nodes.reduce((b,N)=>b+N.cost.reduce((x,y)=>x+y,0),0),0),"· 봇 클리어 판 합(8판) 강화 전",c0,"후",c1);
