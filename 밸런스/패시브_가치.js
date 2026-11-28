// 영웅별 패시브(3성 스킬) 가치: node 밸런스/패시브_가치.js --job=guardian [--seeds=120] [--off=0] → 밸런스/패시브_가치/<job>.json (2026-11-28) [--fit] 등급 목표에 패시브 위력 맞추기 [--names=]
// 궁극기_맞추기.js와 같은 측정(실제 길이 전투 + 크게 섞기 + 기준 팀원 고정)을 전원 3성으로, 그 영웅만 패시브를 끈 쪽(engine spec.noPas)과 비교
// 결과: 패시브 = 그 영웅 체력·공격·방어를 몇 % 올린 것과 같은지(사용자가 목표를 정하기 전 지금 값 보기)
process.chdir(require('path').join(__dirname, '..'));
const fs = require('fs'), path = require('path'), D = require(process.cwd() + '/data.js'), E = require(process.cwd() + '/engine.js'), REC = require('./기록.js');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const JOB_ = arg('job'), SEEDS = +arg('seeds', 120); /* 2026-11-28 30판은 판 묶음마다 결과가 2배까지 달라서 120판(대부분 ±10%) */ if (!JOB_) throw new Error('--job=guardian|warrior|archer|mage|bard|assassin');
const JOBS = ['guardian', 'warrior', 'archer', 'mage', 'bard', 'assassin'], JN = { guardian: '기사', warrior: '전사', archer: '궁수', mage: '마법사', bard: '서포터', assassin: '암살자' };
const TARGET = { guardian: 60, mage: 80, bard: 70, warrior: 30, archer: 30, assassin: 30 }, GF = [1, 1.12, 1.24, 1.36], HPK = 0.6, JIT = 0.25;
const G = D.growth.perLevel, LV = 1, GL = 1 + G * (LV - 1);
const heroes = D.heroes.filter(h => !h.mob && JOBS.includes(h.job)), byJob = {}; heroes.forEach(h => { (byJob[h.job] = byJob[h.job] || []).push(h.id); });
// 2026-11-28 팀원은 '기준 팀원'(한 번 찍어 둔 영웅 데이터)으로 고정: 다른 영웅 스킬을 바꿔도 결과가 따라 움직이지 않게. 다시 찍으려면 --rebase
const BF = '밸런스/궁극기_맞추기/기준_팀원.json'; if (process.argv.includes('--rebase') || !fs.existsSync(BF)) { fs.mkdirSync(path.dirname(BF), { recursive: true }); fs.writeFileSync(BF, JSON.stringify({ at: new Date().toISOString(), heroes }, null, 1)); }
JSON.parse(fs.readFileSync(BF, 'utf8')).heroes.forEach(h => D.heroes.push({ ...h, id: '_b_' + h.id })); const B_ = id => '_b_' + id;
const OFF = +arg('off', 0); /* 시드 묶음 바꾸기(흔들림 보기) */
const unit1 = id => E.createBattle(D, [{ id, slot: 0, level: LV, star: 3 }], [{ id, slot: 0, level: 1 }], { seed: 1 }).A[0];
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
const REP = {}; for (const j of JOBS) { const L = heroes.filter(h => h.job === j).map(h => ({ h, u: unit1(h.id) })), a = { hp: avg(L.map(x => x.u.maxHp)), atk: avg(L.map(x => x.u.atk)), iv: avg(L.map(x => x.u.interval)) };
  REP[j] = L.map(x => ({ id: x.h.id, d: Math.abs(Math.log(x.u.maxHp / a.hp)) + Math.abs(Math.log(x.u.atk / a.atk)) + Math.abs(Math.log(x.u.interval / a.iv)) })).sort((p, q) => p.d - q.d)[0].id; }
const teamFor = j => { const ids = ['guardian', 'warrior', 'archer', 'mage', j === 'assassin' ? 'assassin' : 'bard'].map(x => B_(REP[x])), slots = [0, 1, 3, 6, 4]; return ids.map((id, i) => ({ id, slot: slots[i], level: LV, star: 3 })); };
const allUp = (u, m) => { u.maxHp *= 1 + m; u.hp *= 1 + m; u.atk *= 1 + m; u.def *= 1 + m; };
const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const teamOf = (t, idx, s) => (r => t.map((x, i) => i === idx ? x : { ...x, id: B_((L => L[Math.floor(r() * L.length)])(byJob[D.heroes.find(h => h.id === x.id).job])) }))(rng(s * 131 + 7));
function score(t0, idx, m) { let w = 0, n = 0; for (let s = 1 + OFF; s <= SEEDS + OFF; s++) for (const sw of [0, 1]) {
  const t = teamOf(t0, idx, s), tX = t.map(x => ({ ...x })), tY = t.map((x, i) => i === idx ? { ...x, noPas: true } : { ...x }), o = { seed: s * 7 + 3 }, b = sw ? E.createBattle(D, tY, tX, o) : E.createBattle(D, tX, tY, o);
  const r = rng(s * 977 + 11); b.A.forEach((u, i) => { const fh = 1 - JIT + 2 * JIT * r(), fa = 1 - JIT + 2 * JIT * r(); [u, b.E[i]].forEach(v => { v.maxHp *= fh * HPK; v.hp *= fh * HPK; v.atk *= fa; }); });
  const X = sw ? b.E : b.A, Y = sw ? b.A : b.E, M0 = X.reduce((a, u) => a + u.maxHp, 0); allUp(Y[idx], m);
  while (!b.result && b.time < 90) b.step(); const left = S => S.reduce((a, u) => a + Math.max(0, u.alive ? u.hp : 0), 0); w += (left(X) - left(Y)) / M0; n++; } return 0.5 + w / n; }
const ITER = 10, MLO = -0.6, MHI = 6;
function lvEquiv(t, idx) { const f = m => score(t, idx, m); let lo = MLO, hi = MHI; if (f(0) > 0.5) lo = 0; else hi = 0; /* 2026-11-28 궁극기 켬이 이기면 0 위로만(팀원 섞기로 생기는 거꾸로 구간을 피함) */ if (f(hi) > 0.5) return Infinity; if (f(lo) < 0.5) return -Infinity;
  for (let i = 0; i < ITER; i++) { const m = (lo + hi) / 2; if (f(m) > 0.5) lo = m; else hi = m; } return GL * (lo + hi) / 2 / G; }
// 능력치 가격표(최신 기록): 1레벨 = 그 영웅 체력·공격·방어 점수 × G/GL
const pF = REC.list('능력치_가격').pop(), PR = JSON.parse(fs.readFileSync(path.join(REC.DIR, pF), 'utf8'));
const ptsPerLv = h => { const p = PR.values['가격 ' + ({ guardian: '수호자', warrior: '전사', archer: '궁수', mage: '마법사', bard: '음유시인', assassin: '암살자' })[h.job]], u = unit1(h.id); return G / GL * (u.maxHp * p['체력 1'] + u.atk * p['공격력 1'] + u.def * p['방어 1']); };
// 그 영웅의 궁극기 비율(%), 위력 pow
function ratio(h, pow) { const hh = D.heroes.find(x => x.id === h.id); hh.ultPow = pow; const base = teamFor(h.job), idx = base.findIndex(x => x.id === B_(REP[h.job])), t1 = base.map((x, i) => i === idx ? { ...x, id: h.id } : x);
  const lv = lvEquiv(t1, idx); return lv === Infinity ? 999 : lv === -Infinity ? -999 : lv * ptsPerLv(hh) / 10; }
// --fit: 등급 목표(능력치 %)에 맞게 영웅별 패시브 위력(hero.pasPow, 패시브 v에 곱함)을 로그 이분 탐색으로 찾음. 목표: 일반 25 · 고급 50 · 희귀 100 · 전설 150 (2026-11-28 사용자: "25 50 100 150 정도?")
const FIT = process.argv.includes('--fit'), PT = [10, 20, 40, 60] /* 2026-11-28 처음 25·50·100·150 → 65명 중 10명만 맞아 낮춤(사용자: "범위를 일단 낮춰야겠네 … a로") */, IDS = arg('names', '') ? arg('names').split(',') : null;
const pctOf = h => { const base = teamFor(h.job), idx = base.findIndex(x => x.id === B_(REP[h.job])), t1 = base.map((x, i) => i === idx ? { ...x, id: h.id } : x); const lv = lvEquiv(t1, idx); return Math.abs(lv) === Infinity ? lv * 999 : Math.round(lv * G / GL * 1000) / 10; };
const L = heroes.filter(h => h.job === JOB_ && (!IDS || IDS.includes(h.name))), t0 = Date.now(), OUT = [];
for (const h of L) { const hh = D.heroes.find(x => x.id === h.id), p00 = hh.pasPow || 1, tgt = PT[(h.grade || 1) - 1], tries = [];
  const ev = p => { hh.pasPow = p; const r = pctOf(h); tries.push([Math.round(p * 1000) / 1000, r]); process.stderr.write(h.name + ' ×' + p.toFixed(2) + ' → ' + r + '% (목표 ' + tgt + ')\n'); return r; };
  let r0 = ev(p00), res = { pow: p00, pct: r0 };
  if (FIT) { if (r0 <= 0) res.note = '패시브가 손해 — 스킬 내용 문제'; else { let lo = 0.1, hi = 6, best = [p00, r0]; if (r0 < tgt) lo = p00; else hi = p00;
    for (let i = 0; i < 7 && Math.abs(best[1] - tgt) > tgt * 0.07; i++) { const p = Math.sqrt(lo * hi), r = ev(p); if (Math.abs(r - tgt) < Math.abs(best[1] - tgt)) best = [p, r]; if (r < tgt) lo = p; else hi = p; }
    res = { pow: Math.round(best[0] * 100) / 100, pct: best[1] }; if (lo > 5 && best[1] < tgt * 0.85) res.note = '위력 ×6으로도 모자람 — 스킬 내용 문제'; if (hi < 0.12 && best[1] > tgt * 1.15) res.note = '위력 ×0.1로도 셈 — 스킬 내용 문제'; } }
  hh.pasPow = p00 === 1 ? undefined : p00; OUT.push({ id: h.id, name: h.name, grade: h.grade || 1, pas: (h.passive || {}).kind, target: tgt, tries, ...res }); }
fs.mkdirSync('밸런스/패시브_가치', { recursive: true }); const OF = '밸런스/패시브_가치/' + JOB_ + '.json', prev = IDS && fs.existsSync(OF) ? JSON.parse(fs.readFileSync(OF, 'utf8')).heroes.filter(o => !IDS.includes(o.name)) : [];
fs.writeFileSync(OF, JSON.stringify({ job: JOB_, seeds: SEEDS, off: OFF, fit: FIT, at: new Date().toISOString(), heroes: prev.concat(OUT) }, null, 1));
console.log(JN[JOB_] + ' 끝 ' + Math.round((Date.now() - t0) / 1000) + '초'); OUT.forEach(o => console.log(JN[JOB_], o.name, '등급', o.grade, o.pas, '목표', o.target, '→ 위력', o.pow, o.pct + '%', o.note || ''));
