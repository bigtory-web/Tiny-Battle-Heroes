// 영웅별 스킬 가치(궁극기·패시브): node 밸런스/스킬_가치.js [--stage=1|2|3] [--mix=jitter|team|none] → 밸런스/스킬_가치.md (2026-11-28)
// 사용자 순서: 능력치 가치 → 스킬 가치 → 합 = 영웅 가치 → 세부 수치. "스킬로 넘어가보자"
// 방법: 표준 팀 거울 전에서 그 영웅 자리만 한쪽은 스킬 켬, 다른 쪽은 그 영웅만 끔(engine spec.noUlt / noPas). 끈 쪽을 몇 레벨 올려야 비기는지 = 스킬 가치(레벨) → 능력치 가격표 점수로
// 지금 규칙: 궁극기는 1성부터, 패시브는 3성부터 켜짐(data.gradeEffects.passiveOn). 그래서 궁극기는 1성, 패시브는 3성에서 따로 잼
process.chdir(require('path').join(__dirname, '..'));
const fs = require('fs'), path = require('path'), D = require(process.cwd() + '/data.js'), E = require(process.cwd() + '/engine.js'), REC = require('./기록.js');
const STAGE = +((process.argv.find(a => /^--stage=\d$/.test(a)) || '--stage=1').split('=')[1]);
const SEEDS = { 1: 10, 2: 100, 3: 200 }[STAGE]; if (!SEEDS) throw new Error('--stage는 1, 2, 3 중 하나');
const MIX = ((process.argv.find(a => /^--mix=/.test(a)) || '--mix=jitter').split('=')[1]); if (!['jitter', 'team', 'none'].includes(MIX)) throw new Error('--mix는 jitter, team, none 중 하나');
const JOBS = ['guardian', 'warrior', 'archer', 'mage', 'bard', 'assassin'];
const JN = { guardian: '수호자', warrior: '전사', archer: '궁수', mage: '마법사', bard: '음유시인', assassin: '암살자' }, GN = { 1: '일반', 2: '고급', 3: '희귀', 4: '전설' };
const G = D.growth.perLevel, LV = 1, GL = 1 + G * (LV - 1), MM = (D.recruit.merge && D.recruit.merge.mul) || D.recruit.starMul, PSTAR = (D.gradeEffects && D.gradeEffects.passiveOn && D.gradeEffects.passiveOn.star) || 3;
const heroes = D.heroes.filter(h => !h.mob && JOBS.includes(h.job));
const unit1 = id => E.createBattle(D, [{ id, slot: 0, level: LV, star: 1 }], [{ id, slot: 0, level: 1 }], { seed: 1 }).A[0];
const avg = a => a.reduce((x, y) => x + y, 0) / a.length, r0 = x => Math.round(x), r2 = x => Math.round(x * 100) / 100, sg = x => (x >= 0 ? '+' : '') + x;
const U = {}; heroes.forEach(h => { U[h.id] = unit1(h.id); });
// 대표 영웅·표준 팀(능력치_가격.js와 같은 방법)
const JOB = {};
for (const j of JOBS) { const L = heroes.filter(h => h.job === j).map(h => ({ h, u: U[h.id] }));
  const a = { hp: avg(L.map(x => x.u.maxHp)), atk: avg(L.map(x => x.u.atk)), iv: avg(L.map(x => x.u.interval)) };
  JOB[j] = { rep: L.map(x => ({ id: x.h.id, d: Math.abs(Math.log(x.u.maxHp / a.hp)) + Math.abs(Math.log(x.u.atk / a.atk)) + Math.abs(Math.log(x.u.interval / a.iv)) })).sort((p, q) => p.d - q.d)[0] }; }
const teamFor = j => { const ids = ['guardian', 'warrior', 'archer', 'mage', j === 'assassin' ? 'assassin' : 'bard'].map(x => JOB[x].rep.id), slots = [0, 1, 3, 6, 4]; return ids.map((id, i) => ({ id, slot: slots[i], level: LV, star: 1 })); };
const allUp = (u, m) => { u.maxHp *= 1 + m; u.hp *= 1 + m; u.atk *= 1 + m; u.def *= 1 + m; };
const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const byJob = {}; heroes.forEach(h => { (byJob[h.job] = byJob[h.job] || []).push(h.id); });
const teamOf = (t, idx, s) => MIX !== 'team' ? t : (r => t.map((x, i) => i === idx ? x : { ...x, id: (L => L[Math.floor(r() * L.length)])(byJob[D.heroes.find(h => h.id === x.id).job]) }))(rng(s * 131 + 7));
// tX: 켠 쪽, off: 끈 쪽 그 영웅에 붙일 옵션({ noUlt } / { noPas }). 끈 쪽 그 영웅을 m만큼(체력·공격·방어) 올림. 0.5 = 비김
function score(t0, idx, off, m) { let w = 0, n = 0; for (let s = 1; s <= SEEDS; s++) for (const sw of [0, 1]) {
  const t = teamOf(t0, idx, s), tX = t.map(x => ({ ...x })), tY = t.map((x, i) => i === idx ? { ...x, ...off } : { ...x }), o = { seed: s * 7 + 3 }, b = sw ? E.createBattle(D, tY, tX, o) : E.createBattle(D, tX, tY, o);
  if (MIX === 'jitter') { const r = rng(s * 977 + 11); b.A.forEach((u, i) => { const fh = 0.9 + 0.2 * r(), fa = 0.9 + 0.2 * r(); [u, b.E[i]].forEach(v => { v.maxHp *= fh; v.hp *= fh; v.atk *= fa; }); }); }
  const X = sw ? b.E : b.A, Y = sw ? b.A : b.E, M0 = X.reduce((a, u) => a + u.maxHp, 0); allUp(Y[idx], m);
  while (!b.result && b.time < 90) b.step(); const left = S => S.reduce((a, u) => a + Math.max(0, u.alive ? u.hp : 0), 0); w += (left(X) - left(Y)) / M0; n++; } return 0.5 + w / n; }
const ITER = 11, MLO = -0.6, MHI = 6; // 상대 그 영웅 체력·공격·방어 −60% ~ +600%(= +24레벨) 안에서 찾음. 마법사·음유시인 궁극기가 +150%(6레벨)를 넘어서 넓힘
function lvEquiv(t, idx, off) { const f = m => score(t, idx, off, m); let lo = MLO, hi = MHI; if (f(hi) > 0.5) return Infinity; if (f(lo) < 0.5) return -Infinity;
  for (let i = 0; i < ITER; i++) { const m = (lo + hi) / 2; if (f(m) > 0.5) lo = m; else hi = m; } return GL * (lo + hi) / 2 / G; }

// 능력치 가격표(가장 최근 기록): 직업별 체력·공격력·방어 1의 점수, 영웅 1성 능력치 점수
const pF = REC.list('능력치_가격').pop(); if (!pF) throw new Error('능력치_가격 기록이 없어요. 먼저 node 밸런스/능력치_가격.js');
const PR = JSON.parse(fs.readFileSync(path.join(REC.DIR, pF), 'utf8'));
const statPts = h => { const k = h.name + '(' + JN[h.job] + ' ' + (h.grade || 1) + '등급)'; return PR.values['영웅 1성'] && PR.values['영웅 1성'][k]; };
const priceOf = j => PR.values['가격 ' + JN[j]];
// 레벨 1단계 = 체력·공격·방어 ×(1 + G/GL). 그 영웅(star 배율 포함)의 세 능력치 점수 × G/GL = 1레벨의 점수
const ptsPerLv = (h, star) => { const p = priceOf(h.job); if (!p) return NaN; const u = U[h.id], m = MM[star - 1]; return G / GL * m * (u.maxHp * p['체력 1'] + u.atk * p['공격력 1'] + u.def * p['방어 1']); };
// 팀에 특정 종족·속성 아군이 있어야 센 스킬(표준 팀에선 값이 낮게 나올 수 있음)
const COND = h => !!((h.ult && (h.ult.race || h.ult.forestHaste)) || (h.passive && ['forestHeal', 'ultBeastEnergy'].includes(h.passive.kind)));

const t0 = Date.now(), R = [];
for (const j of JOBS) { const base = teamFor(j), idx = base.findIndex(x => x.id === JOB[j].rep.id);
  if (Math.abs(score(base, idx, {}, 0) - 0.5) > 1e-9) throw new Error('검산 실패: 스킬 켬끼리 거울 전이 비김이 아님 ' + JN[j]);
  for (const h of heroes.filter(x => x.job === j)) { const t1 = base.map((x, i) => i === idx ? { ...x, id: h.id } : x), t3 = t1.map((x, i) => i === idx ? { ...x, star: PSTAR } : x);
    const ult = h.ult ? lvEquiv(t1, idx, { noUlt: true }) : 0, pas = h.passive && h.passive.kind !== 'none' ? lvEquiv(t3, idx, { noPas: true }) : null;
    R.push({ h, ult, pas, sp: statPts(h) }); process.stderr.write('.'); } }

const fmtLv = v => v === Infinity ? '못 잼(너무 셈)' : v === -Infinity ? '못 잼(손해)' : sg(r2(v));
const pts = (v, h, star) => isFinite(v) ? r0(v * ptsPerLv(h, star)) : null;
R.forEach(r => { r.ultP = pts(r.ult, r.h, 1); r.pasP = r.pas == null ? 0 : pts(r.pas, r.h, PSTAR);
  const s1 = r.sp, p = priceOf(r.h.job), u = U[r.h.id], s3 = s1 == null || !p ? null : s1 + (MM[PSTAR - 1] - 1) * (u.maxHp * p['체력 1'] + u.atk * p['공격력 1'] + u.def * p['방어 1']);
  r.tot1 = s1 != null && r.ultP != null ? s1 + r.ultP : null; r.tot3 = s3 != null && r.ultP != null && r.pasP != null ? s3 + r.ultP * (ptsPerLv(r.h, PSTAR) / ptsPerLv(r.h, 1)) + r.pasP : null; r.s3 = s3; });

let md = '# 영웅별 스킬 가치 (2026-11-28)\n\n';
md += '- 표준 팀(수호·전사·궁수·마법 + 음유, 암살을 잴 땐 음유 대신 암살) 거울 전, 레벨 ' + LV + '. 그 직업 자리에 그 영웅을 넣고, 한쪽만 그 영웅의 스킬을 끈 뒤 끈 쪽을 몇 레벨 올려야 비기는지 쟀어요. 나머지 4명은 양쪽 다 스킬 켬.\n';
md += '- **궁극기는 1성, 패시브는 ' + PSTAR + '성**에서 잼(지금 규칙상 패시브는 ' + PSTAR + '성부터 켜져요). 패시브를 잴 땐 궁극기는 양쪽 다 켬.\n';
md += '- 점수 = 그 레벨 × 그 영웅의 1레벨 점수(능력치 가격표 ' + PR.at + ' ' + PR.commit + ' 기준). 능력치 점수와 같은 단위라 더할 수 있어요. 1000점 = 직업 평균 1성 영웅의 능력치(가상).\n';
md += '- 측정 단계: **' + STAGE + '단계** (시드 ' + SEEDS + '개 × 양쪽 = 한 번 잴 때 ' + SEEDS * 2 + '판). 판 섞기: ' + { jitter: '판마다 자리별 체력·공격 ±10%(양쪽 같게)', team: '판마다 나머지 4명을 각 직업 무작위 영웅으로', none: '안 섞음' }[MIX] + '.\n';
md += '- 🔗 = 팀에 특정 종족·속성 아군이 있어야 센 스킬이라, 표준 팀에선 값이 낮게 나왔을 수 있어요. "못 잼(너무 셈)" = 끈 쪽을 +' + r2(GL * MHI / G) + '레벨 올려도 못 따라감.\n\n';
md += '## 1. 영웅별\n\n| 직업 | 등급 | 영웅 | 궁극기 | 궁극기 (레벨) | 궁극기 점수 | 패시브 (' + PSTAR + '성, 레벨) | 패시브 점수 | 능력치 점수(1성) | 합계 1성 | 합계 ' + PSTAR + '성 |\n|---|---|---|---|---|---|---|---|---|---|---|\n';
for (const r of R) { const h = r.h; md += `| ${JN[h.job]} | ${GN[h.grade || 1]} | ${h.name}${COND(h) ? ' 🔗' : ''} | ${h.ultName || (h.ult && h.ult.kind) || '—'} | ${fmtLv(r.ult)} | ${r.ultP == null ? '—' : r.ultP} | ${r.pas == null ? '없음' : fmtLv(r.pas)} | ${r.pas == null ? 0 : r.pasP == null ? '—' : r.pasP} | ${r.sp == null ? '—' : r.sp} | ${r.tot1 == null ? '—' : r0(r.tot1)} | ${r.tot3 == null ? '—' : r0(r.tot3)} |\n`; }
const GR = [...new Set(heroes.map(h => h.grade || 1))].sort();
const cell = (j, g, key) => { const V = R.filter(r => r.h.job === j && (r.h.grade || 1) === g && r[key] != null).map(r => r[key]); return V.length ? r0(avg(V)) + ' (' + V.length + '명)' : '—'; };
md += '\n## 2. 직업 × 등급 평균\n\n### 궁극기 점수\n\n| 직업 | ' + GR.map(g => GN[g]).join(' | ') + ' |\n|---|' + GR.map(() => '---').join('|') + '|\n' + JOBS.map(j => '| ' + JN[j] + ' | ' + GR.map(g => cell(j, g, 'ultP')).join(' | ') + ' |').join('\n') + '\n';
md += '\n### 합계 1성 (능력치 + 궁극기)\n\n| 직업 | ' + GR.map(g => GN[g]).join(' | ') + ' |\n|---|' + GR.map(() => '---').join('|') + '|\n' + JOBS.map(j => '| ' + JN[j] + ' | ' + GR.map(g => cell(j, g, 'tot1')).join(' | ') + ' |').join('\n') + '\n';
md += '\n### 합계 ' + PSTAR + '성 (능력치 + 궁극기 + 패시브)\n\n| 직업 | ' + GR.map(g => GN[g]).join(' | ') + ' |\n|---|' + GR.map(() => '---').join('|') + '|\n' + JOBS.map(j => '| ' + JN[j] + ' | ' + GR.map(g => cell(j, g, 'tot3')).join(' | ') + ' |').join('\n') + '\n';
md += '\n## 3. 같은 종류 궁극기끼리\n\n';
const KG = {}; R.forEach(r => { const k = r.h.ult && r.h.ult.kind; if (k) (KG[k] = KG[k] || []).push(r); });
Object.entries(KG).filter(([, v]) => v.length > 1).sort((a, b) => b[1].length - a[1].length).forEach(([k, v]) => { md += '- **' + k + '** (' + v.length + '명): ' + v.sort((a, b) => (b.ultP || 0) - (a.ultP || 0)).map(r => r.h.name + '(' + JN[r.h.job] + ' ' + GN[r.h.grade || 1] + ') ' + (r.ultP == null ? fmtLv(r.ult) : r.ultP + '점')).join(' · ') + '\n'; });

const v = {}; R.forEach(r => { v[r.h.name + '(' + JN[r.h.job] + ' ' + (r.h.grade || 1) + '등급)'] = { 궁극기레벨: isFinite(r.ult) ? r2(r.ult) : String(r.ult), 패시브레벨: r.pas == null ? null : isFinite(r.pas) ? r2(r.pas) : String(r.pas), 궁극기점수: r.ultP, 패시브점수: r.pasP }; });
const sv = REC.save('스킬_가치', v, { 레벨: LV, 단계: STAGE, 시드: SEEDS, 탐색: ITER, 섞기: MIX, 가격표: pF });
md += REC.compareMd(sv.prev, sv.rec, ['궁극기점수', '패시브점수']) + '\n기록: `밸런스/기록/' + sv.file + '`\n';
fs.writeFileSync('밸런스/스킬_가치.md', md); process.stderr.write('\n' + r0((Date.now() - t0) / 1000) + '초\n'); console.log(md);
