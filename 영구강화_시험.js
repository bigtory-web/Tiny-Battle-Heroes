// 영구 강화 엔진 자체 시험(2026-11-27). 실행: node 영구강화_시험.js
const assert=require("assert");const D=require((process.argv[2]||".")+"/data.js"),E=require((process.argv[2]||".")+"/engine.js");
// 다 찍은 상태
const full={medals:0,nodes:{}}; D.meta.lines.forEach(L=>L.nodes.forEach(N=>full.nodes[N.id]=N.cost.length));
const M=E.metaData(D,full);
assert.strictEqual(D.player.bag[0],5,"원본 그대로"); assert.strictEqual(M.player.bag[0],7); assert.strictEqual(M.player.bag[9],7,"cap");
assert.strictEqual(M.player.skillSlots[0],6); assert.strictEqual(M.player.potion[0],2,"물약 칸 최대 2");
assert.deepStrictEqual(M.player.shopGrade[0],[55,25,10,10],"2026-11-27 상점도 기준 표(Lv1 85/15/0/0) + 등급별 +10%, 일반에서 뺌");
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
assert.deepStrictEqual(MM.player.field,D.player.field); assert.deepStrictEqual(MM.player.heroGrade,D.player.heroGrade,"모드와 상관없이 기준 표 그대로"); assert.deepStrictEqual(MM.player.enemyGrade,D.player.heroGrade,"적·상점도 기준 표"); assert.deepStrictEqual(MM.player.shopGrade,D.player.heroGrade);
const MF=E.metaData(D,{mode:"meta",nodes:full.nodes}); assert.ok(MF.player.bag.every(v=>v===7)); assert.strictEqual(E.metaData(D,{mode:"level"}),D,"레벨 모드 + 강화 없음 = 원본");
let cm=0; for(let s=1;s<=5;s++){ cm+=E.campaign(D,{seed:s,meta:{mode:"meta"}}).cleared; E.campaign(E.chapterData(D,2),{seed:s,meta:{mode:"meta",nodes:full.nodes}}); E.campaign(E.chapterData(D,3),{seed:s,meta:{mode:"meta",nodes:full.nodes}}); }
console.log("ok · 영구 강화 모드(강화 0) 봇 클리어 판 합(5판)",cm);
// 제약(난이도): 쉬움 = 원본, 보통·어려움 = 적 레벨·등급·유물·훈장 배율, 장 정보 유지
{ const N=E.difficultyData(D,"normal"),H=E.difficultyData(D,"hard"),C2=E.chapterData(D,3);
  assert.strictEqual(E.difficultyData(D,"easy"),D); assert.strictEqual(N.campaign.enemyLv[3],D.campaign.enemyLv[3]+1); assert.strictEqual(H.campaign.enemySkills.table[0].from,0);
  assert.strictEqual(E.metaMedals(H,10,false),E.metaMedals(D,10,false)*2); assert.ok(E.difficultyData(C2,"hard").campaign.swamp,"장 정보 유지");
  const MH=E.metaData(H,{nodes:{bag:1}}); assert.strictEqual(MH.campaign.diff.id,"hard","강화와 같이 써도 제약 유지");
  console.log("ok · 제약"); }
// 장 정보(장 고르기 화면)
{ const I1=E.chapterInfo(D,1), I2=E.chapterInfo(D,3); assert.strictEqual(I1.bell.length,3); assert.strictEqual(I1.feats.length,0);
  assert.ok(I2.feats[0].desc.includes("5초마다 공격력 1%")); assert.strictEqual(I2.bell[2].name,"늪지대"); assert.ok(I2.events[0].note.includes("70%")); console.log("ok · 장 정보"); }
// 챕터 특별 출현: 등급별 1명, 그 챕터 영웅 풀에 더해지고 같은 등급 안에서 더 잘 나옴
{ const I=E.chapterInfo(D,3), C2=E.chapterData(D,3); assert.deepStrictEqual(I.featured.map(f=>f.grade),[1,2,3,4]);
  assert.ok(I.featured.every(f=>C2.recruit.pool.includes(f.id)),"풀에 더해짐"); assert.ok(!D.recruit.pool.includes("mudgolem"),"원본 풀 그대로");
  let f=0; for(let lv=1;lv<=10;lv++) for(let st=0;st<10;st++) E.stageTeam(C2,st,null,0,lv).team.forEach(u=>{ if(I.featured.some(x=>x.id===u.id)) f++; }); assert.ok(f>0,"특별 출현 영웅이 적으로 나옴");
  console.log("ok · 특별 출현", I.featured.map(f=>f.name).join(",")); }
// 상인 최저 할인: 찍을수록 상품 할인율의 아래 끝이 5%씩 오름(최대 할인을 넘지 않음)
{ const minOff = st => { let m = 100; for (let s = 1; s < 60; s++) { let x = s; const r = () => (x = (x * 9301 + 49297) % 233280) / 233280; E.rollMerchant(E.metaData(D, st), 3, r, 5).forEach(it => { m = Math.min(m, it.off); }); } return m; };
  const a = minOff({ nodes: {} }), b = minOff({ nodes: { merchOffMin: 2 } }); assert.strictEqual(b - a, 10, "최저 +5% 두 번");
  console.log("ok · 상인 최저 할인", a + "% → " + b + "%"); }
// 파랑·왕관 미믹 확률: 안 찍으면 예전과 같고, 찍으면 레벨 1에서도 파랑이 늘고 왕관이 나옴
{ const cnt = (st, lv) => { let b = 0, k = 0, s = 7; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280; const M = E.metaData(D, st);
    for (let i = 0; i < 400; i++) { const e = E.rollEvent(M, 5, r, lv, { forceKind: "mimic" }); b += e.blue.filter(Boolean).length; k += e.ids.filter(x => x === 'mimicKing').length; } return [b / 400, k / 400]; };
  const a = cnt({ nodes: {} }, 1), c = cnt({ nodes: { mBlueUp: 2, mKingUp: 2 } }, 1);
  assert.deepStrictEqual(a, [1, 0], "안 찍으면 Lv1 파랑 1·왕관 0 그대로"); assert.ok(c[0] > 1.1 && c[1] > 0.1 && c[1] < 0.3, "파랑 늘고 왕관 약 20%");
  console.log("ok · 미믹 확률", JSON.stringify(a), "→", JSON.stringify(c.map(x => +x.toFixed(2)))); }
// 모닥불·요정 리셋 나눔: 요정 리셋 칸은 요정에만
{ const M = E.metaData(D, { nodes: { fairyReset: 1 } }); assert.strictEqual(E.eventRerolls(M, 1), 1); assert.strictEqual(E.eventRerolls(M, 1, "fairy"), 2); console.log("ok · 모닥불·요정 리셋 나눔"); }
// 강화 설명 "기존" 값: 레벨 1 값
{ const b = id => E.metaBase(D, E.metaNode(D, id)); assert.strictEqual(b("eventReset"), 1); assert.strictEqual(b("life"), 10); assert.strictEqual(b("startGold"), 0); assert.strictEqual(b("lootReset"), 1); assert.strictEqual(b("g_hp"), null);
  console.log("ok · 기존 값", ["eventReset", "life", "startGold", "mimic", "bag"].map(i => E.metaNode(D, i).name + " " + b(i) + E.metaNode(D, i).unit).join(", ")); }
// 2026-11-27 레벨업 → 영구 강화: 하트 없음, 영웅 레벨 칸, 영웅·돈고블린·상인 영웅 등급 앞당김(영구 강화로 모드는 Lv1 고정 + 칸), 적 등급은 그대로
{ assert.strictEqual(D.life.perLevel, 0, "레벨업 하트 없음");
  assert.strictEqual(E.heroLevel(E.metaData(D, { nodes: { heroLv: 2 } }), 3), 5, "영웅 레벨 +2");
  const F = E.metaData(D, { mode: 'meta', nodes: {} }), F1 = E.metaData(D, { mode: 'meta', nodes: { hg4: 1, gg3: 2, mg2: 1 } });
  assert.deepStrictEqual(F.player.heroGrade, D.player.heroGrade, "영구 강화로 모드도 등급은 레벨업 메인");
  assert.deepStrictEqual(F1.player.heroGrade[0], [83, 15, 0, 2], "영웅 전설 +2%: 일반에서");
  assert.deepStrictEqual(F1.player.grollGrade[0], [81, 15, 4, 0], "룰렛 희귀 +4% (기준 표 Lv1 85/15/0/0)");
  assert.deepStrictEqual(E.metaData(D, { nodes: { hg4: 5 } }).player.heroGrade[9], [0, 24, 42, 34], "일반이 모자라면 다음 낮은 등급에서");
  assert.deepStrictEqual(E.metaData(D, { nodes: { lg4: 5 } }).player.lootWeight[0][4], D.player.lootWeight[0][4], "전리품 골드 칸은 그대로");
  assert.strictEqual(E.grollCost(E.metaData(D, { nodes: { grollCost: 2 } }), 3, 1), Math.round(E.grollCost(D, 3, 1) * 0.8), "돈고블린 비용 20% 감소");
  assert.deepStrictEqual(F1.player.enemyGrade, D.player.heroGrade, "적 등급은 기준 표 그대로(영웅 업그레이드 안 샘)");

  console.log("ok · 레벨업 → 영구 강화(하트·영웅 레벨·등급별 %·돈고블린 비용)"); }
// 합류 영웅(떠돌이 용병): 비용 감소 칸, 등급 칸은 합류 영웅 표에만
{ const r0 = () => 0.3, ev = d => E.rollEvent(d, 5, r0, 3, { forceKind: "merc" });
  const a = ev(D), b = ev(E.metaData(D, { nodes: { mercCost: 2 } })); assert.strictEqual(a.id, b.id); assert.ok(Math.abs(b.price - a.price * 0.8) <= 1, "비용 20% 감소");
  const M = E.metaData(D, { nodes: { rg4: 5 } }); assert.deepStrictEqual(M.player.mercGrade[0], [75, 15, 0, 10]); assert.deepStrictEqual(M.player.heroGrade, D.player.heroGrade, "영웅 표는 그대로");
  console.log("ok · 합류 영웅 비용 " + a.price + " → " + b.price + ", 전설 +10%"); }
// 기준 표(2026-11-27): 상인·합류 영웅은 영웅 등급 표를 읽음(상인 2줄 위). 영웅 업그레이드는 새지 않고, 기준 표를 고치면 따라감
{ const P = D.player; assert.ok(!P.merchantHeroGrade && !P.mercGrade, "복사본 없음");
  const M = E.metaData(D, { nodes: { hg4: 5 } }); assert.deepStrictEqual(M.player.merchantHeroGrade[0], P.heroGrade[2]); assert.deepStrictEqual(M.player.mercGrade[0], P.heroGrade[0], "영웅 업그레이드가 상인·합류로 안 샘");
  const D2 = Object.assign({}, D, { player: Object.assign({}, P, { heroGrade: P.heroGrade.map((r, i) => i === 2 ? [1, 1, 1, 97] : r) }) });
  let leg = 0; for (let s = 1; s <= 60; s++) { let x = s; const r = () => (x = (x * 9301 + 49297) % 233280) / 233280; const it = E.rollMerchant(D2, 3, r, 1); it.filter(o => o.type === 'h').forEach(o => { if (E.heroGrade(D2, o.id) === 4) leg++; }); }
  assert.ok(leg > 0, "기준 표 Lv3 줄을 바꾸면 Lv1 상인 영웅이 따라감"); console.log("ok · 기준 표(상인·합류)"); }
// 등급 줄 = 스테이지(2026-11-27): 스테이지를 주면 레벨과 상관없이 gradeLv 줄, 안 주면 예전처럼 레벨 줄
{ const H = D.player.heroGrade; assert.deepStrictEqual(E.gradeRow(D, 'heroGrade', 9, 1), H[6], "1-10 = 7번째 줄, 레벨 1이어도"); assert.deepStrictEqual(E.gradeRow(D, 'heroGrade', 9, 3), H[6]);
  assert.deepStrictEqual(E.gradeRow(D, 'heroGrade', null, 3), H[2], "스테이지 없으면 레벨 줄"); assert.deepStrictEqual(E.gradeRow(D, 'lootWeight', 9, 1), D.player.lootWeight[6], "전리품은 자기 무게, 줄만 스테이지");
  console.log("ok · 등급 줄 = 스테이지"); }
// 수정 칸(2026-11-27, 2장 수정 동굴): 마이너스 칸 체력 -50%, 플러스 칸 +25%. 플러스는 마이너스 칸 영웅이 살아 있을 때만, 슬롯이 비면 효과 없음
{ const C2 = E.chapterData(D, 2), C3 = E.chapterData(D, 3); assert.ok(C2.campaign.crystal && !C2.campaign.swamp, "2장 = 수정 동굴"); assert.ok(C3.campaign.swamp && !C3.campaign.crystal, "3장 = 늪지대");
  assert.deepStrictEqual(E.crystalStart(C2), ['hp', null], "1번 슬롯 체력 수정 고정"); assert.strictEqual(E.crystalStart(D), null);
  const cc = E.crystalCells(C2, () => 0.42); assert.ok(cc && cc.length === 2 && cc[0] !== cc[1], "칸 한 쌍(챕터 시작 때)"); assert.strictEqual(E.crystalCells(D), null); assert.strictEqual(E.stageTeam(C2, 0, null, 0, 1).crystal, undefined, "판마다 안 뽑음");
  const id = D.heroes[0].id, cells = [0, 6], foe = [{ id: id, slot: 0, level: 1 }];
  const hp = o => { const b = E.createBattle(C2, [{ id: id, slot: 0, level: 1 }, { id: id, slot: 6, level: 1 }], foe, { seed: 3, crystal: o }); return [b, b.A[0].maxHp, b.A[1].maxHp]; };
  const [, b0, b1] = hp(null), [bt, m, p] = hp({ cells: cells, ids: ['hp'] });
  assert.ok(Math.abs(m - b0 * 0.5) < 1e-9 && Math.abs(p - b1 * 1.25) < 1e-9, "-50% / +25%"); assert.deepStrictEqual(hp({ cells: cells, ids: [] }).slice(1), [b0, b1], "빈 슬롯 = 효과 없음");
  const one = E.createBattle(C2, [{ id: id, slot: 6, level: 1 }], foe, { seed: 3, crystal: { cells: cells, ids: ['hp'] } }); assert.strictEqual(one.A[0].maxHp, b1, "마이너스 칸 비면 플러스 꺼짐");
  bt.A[0].alive = false; bt.step(); assert.ok(Math.abs(bt.A[1].maxHp - b1) < 1e-9 && !bt.crystal.on, "마이너스 영웅이 죽으면 플러스 끝");
  const mm = E.createBattle(C2, [{ id: id, slot: 0, level: 1 }], foe, { seed: 3, crystal: { cells: cells, ids: ["hp"], more: 0.25 } }); assert.ok(Math.abs(mm.A[0].maxHp - b0 * 0.25) < 1e-9, "분노 3단계: -75%");
  assert.strictEqual(E.stageTeam(C2, 0, null, 3, 1).crystalMore, 0.25); assert.strictEqual(E.stageTeam(C2, 0, null, 0, 1).crystalMore, 0);
  console.log("ok · 수정 칸"); }
// 수정 9종 + 수정 상인(2026-11-27)
{ const C2 = E.chapterData(D, 2), id = D.heroes.find(h => h.range === 'mid').id, foe = [{ id: id, slot: 0, level: 1 }];
  const mk = (ids) => E.createBattle(C2, [{ id: id, slot: 0, level: 1 }, { id: id, slot: 6, level: 1 }], foe, { seed: 3, crystal: ids && { cells: [0, 6], ids: ids } });
  const b0 = mk(null); assert.strictEqual(D.crystals.list.length, 9);
  const chk = (cid, f) => { const b = mk([cid]); f(b.A[0], b.A[1], b0.A[0], b0.A[1]); };
  chk('def', (m, p, m0, p0) => assert.ok(Math.abs(m.def - m0.def * 0.5) < 1e-9 && Math.abs(p.def - p0.def * 1.25) < 1e-9));
  chk('aspd', (m, p, m0, p0) => assert.ok(Math.abs(m.interval - m0.interval * 2) < 1e-9 && Math.abs(p.interval - p0.interval / 1.25) < 1e-9));
  chk('care', (m, p) => assert.ok(Math.abs(m.lineCare + 0.5) < 1e-9 && Math.abs(p.lineCare - 0.25) < 1e-9));
  chk('energy', (m, p) => assert.ok(m.enMul === 0.5 && p.enMul === 1.25));
  chk('reach', (m, p, m0, p0) => { assert.strictEqual(m0.reach, 150); assert.strictEqual(m.reach, 100); assert.strictEqual(p.reach, 210); });
  const r = mk(['reach']); r.A[0].alive = false; r.step(); assert.strictEqual(r.A[1].reach, 150, "거울 수정 플러스 꺼지면 원래 사거리");
  assert.deepStrictEqual(C2.events.groups, { merchant: { merchant: 3, crystalShop: 7 } }); assert.strictEqual(E.crystalSellPrice(D, 'atk'), 30);
  const ids = E.rollCrystals(D, () => 0.3, 1); assert.ok(ids.length > 0 && new Set(ids).size === ids.length);
  assert.strictEqual(E.chapterData(D, 3).campaign.enemyLv[0], D.campaign.enemyLv[0] + 2, "3장 적 레벨 +2"); assert.strictEqual(C2.campaign.enemyLv[0], D.campaign.enemyLv[0] + 1);
  let seen = 0, bought = 0; for (let s = 1; s <= 40; s++) { const R = E.campaign(C2, { seed: s }); const c = (R.events || {}).crystalShop; if (c) { seen += c.seen || 0; bought += c.bought || 0; } }
  console.log("ok · 수정 9종·상인 (봇 수정 상인", seen, "번, 산 것", bought + ")"); }
// 전투 중 지금 능력치·전투력 배율(2026-11-27): 수정 칸·늪이 걸리면 바뀜
{ const C2 = E.chapterData(D, 2), id = D.heroes[0].id; const b = E.createBattle(C2, [{ id, slot: 0, level: 1 }, { id, slot: 6, level: 1 }], [{ id, slot: 0, level: 1 }], { seed: 3, crystal: { cells: [0, 6], ids: ['hp', 'atk'] } });
  assert.ok(Math.abs(b.stats(b.A[0].uid).powerMul - 0.5) < 1e-9 && Math.abs(b.stats(b.A[1].uid).powerMul - 1.25) < 1e-9);
  const b1 = E.createBattle(D, [{ id, slot: 0, level: 1 }], [{ id, slot: 0, level: 1 }], { seed: 3 }); assert.strictEqual(b1.stats(b1.A[0].uid).powerMul, 1, "효과 없으면 1");
  console.log("ok · 전투 중 능력치"); }
