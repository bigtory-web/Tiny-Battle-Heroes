// 직업별 능력치 가격표 + 직업 × 등급 × 성급 가치: node 밸런스/능력치_가격.js [--stage=1|2|3] → 밸런스/능력치_가격.md (2026-11-28)
// 사용자: "체력 1의 가치, 공격력 1의 가치, 방어력 1의 가치, 공속 0.1의 가치, 치명타 1%의 가치" / "직업별로 공격력 1의 가치가 다를 것 아니야"
// 사용자: "1000이 공격력 1000이 아니라 공격력 값을 넣어서 만든 결과값" / "등급별 성급별 직업별 가치를 매기는 거지" (1000은 가상 기준)
// 방법: 직업 대표 영웅 한 명의 능력치를 조금 올렸을 때 몇 레벨과 같은지(거울 전, 기준표 B와 같은 방법) → 1의 가격(레벨) → 직업 평균 영웅 = 1000점이 되게 환산
process.chdir(require('path').join(__dirname, '..'));
const fs = require('fs'), D = require(process.cwd() + '/data.js'), E = require(process.cwd() + '/engine.js'), REC = require('./기록.js');
const STAGE = +((process.argv.find(a => /^--stage=\d$/.test(a)) || '--stage=1').split('=')[1]);
const SEEDS = { 1: 10, 2: 100, 3: 200 }[STAGE]; if (!SEEDS) throw new Error('--stage는 1, 2, 3 중 하나');
const JOBS = ['guardian', 'warrior', 'archer', 'mage', 'bard', 'assassin'];
const JN = { guardian: '수호자', warrior: '전사', archer: '궁수', mage: '마법사', bard: '음유시인', assassin: '암살자' };
const G = D.growth.perLevel, LV = 1, GL = 1 + G * (LV - 1), MM = (D.recruit.merge && D.recruit.merge.mul) || D.recruit.starMul;
const heroes = D.heroes.filter(h => !h.mob && JOBS.includes(h.job));
const unit1 = id => E.createBattle(D, [{ id, slot: 0, level: LV, star: 1 }], [{ id, slot: 0, level: 1 }], { seed: 1 }).A[0];
const avg = a => a.reduce((x, y) => x + y, 0) / a.length, r0 = x => Math.round(x), r1 = x => Math.round(x * 10) / 10, r2 = x => Math.round(x * 100) / 100, r3 = x => Math.round(x * 1000) / 1000;
const sg = x => (x >= 0 ? '+' : '') + x;
const U = {}; heroes.forEach(h => { U[h.id] = unit1(h.id); });
// 직업 평균, 대표 영웅(기준표.js 19~24줄과 같은 방법)
const JOB = {};
for (const j of JOBS) { const L = heroes.filter(h => h.job === j).map(h => ({ h, u: U[h.id] }));
  const a = { hp: avg(L.map(x => x.u.maxHp)), atk: avg(L.map(x => x.u.atk)), def: avg(L.map(x => x.u.def)), iv: avg(L.map(x => x.u.interval)), crit: avg(L.map(x => x.u.crit)), n: L.length };
  a.rep = L.map(x => ({ id: x.h.id, name: x.h.name, d: Math.abs(Math.log(x.u.maxHp / a.hp)) + Math.abs(Math.log(x.u.atk / a.atk)) + Math.abs(Math.log(x.u.interval / a.iv)) })).sort((p, q) => p.d - q.d)[0];
  JOB[j] = a; }
// 거울 전·이분 탐색 (기준표.js 55~65줄과 같은 방식)
const allUp = (u, m) => { u.maxHp *= 1 + m; u.hp *= 1 + m; u.atk *= 1 + m; u.def *= 1 + m; };
const teamFor = j => { const ids = ['guardian', 'warrior', 'archer', 'mage', j === 'assassin' ? 'assassin' : 'bard'].map(x => JOB[x].rep.id), slots = [0, 1, 3, 6, 4]; return ids.map((id, i) => ({ id, slot: slots[i], level: LV, star: 1 })); };
// 판 섞기(2026-11-28): 시드를 바꿔도 판이 거의 같아서, 상대를 조금씩 올리면 모든 판이 한 지점에서 한꺼번에 뒤집혀(절벽) 서로 다른 능력치가 같은 값으로 나왔어요.
//   jitter = 팀은 그대로, 판마다 자리별로 체력·공격 ±10%를 양쪽에 똑같이 흔듦 · team = 판마다 잴 영웅 말고 나머지 4명을 각 직업의 무작위 영웅으로 · none = 예전 방식
const MIX = ((process.argv.find(a => /^--mix=/.test(a)) || '--mix=jitter').split('=')[1]); if (!['jitter', 'team', 'none'].includes(MIX)) throw new Error('--mix는 jitter, team, none 중 하나');
const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const byJob = {}; heroes.forEach(h => { (byJob[h.job] = byJob[h.job] || []).push(h.id); });
const teamOf = (t, idx, s) => { if (MIX !== 'team') return t; const r = rng(s * 131 + 7); return t.map((x, i) => i === idx ? x : { ...x, id: (L => L[Math.floor(r() * L.length)])(byJob[D.heroes.find(h => h.id === x.id).job]) }); };
function score(t0, idx, fA, m) { let w = 0, n = 0; for (let s = 1; s <= SEEDS; s++) for (const sw of [0, 1]) {
  const t = teamOf(t0, idx, s), cp = x => x.map(y => ({ ...y })), o = { seed: s * 7 + 3, statsOnly: true }, b = E.createBattle(D, cp(t), cp(t), o);
  if (MIX === 'jitter') { const r = rng(s * 977 + 11); b.A.forEach((u, i) => { const fh = 0.9 + 0.2 * r(), fa = 0.9 + 0.2 * r(); [u, b.E[i]].forEach(v => { v.maxHp *= fh; v.hp *= fh; v.atk *= fa; }); }); }
  const X = sw ? b.E : b.A, Y = sw ? b.A : b.E, M0 = X.reduce((a, u) => a + u.maxHp, 0); if (fA) fA(X[idx]); allUp(Y[idx], m);
  while (!b.result && b.time < 90) b.step(); const left = S => S.reduce((a, u) => a + Math.max(0, u.alive ? u.hp : 0), 0); w += (left(X) - left(Y)) / M0; n++; } return 0.5 + w / n; }
const ITER = 10, MLO = -0.6, MHI = 1.5;
function lvEquiv(t, idx, fA) { const f = m => score(t, idx, fA, m); let lo = MLO, hi = MHI; if (f(hi) > 0.5) return Infinity; if (f(lo) < 0.5) return -Infinity;
  for (let i = 0; i < ITER; i++) { const m = (lo + hi) / 2; if (f(m) > 0.5) lo = m; else hi = m; } return GL * (lo + hi) / 2 / G; }
// 재는 변화: [이름, 바꾸기, 이 변화가 능력치 몇 단위인가(직업 평균 기준), 1의 이름]
// 간격은 "초당 공격 수(1 ÷ 간격)"를 능력치로 보고 재요. 가치 합(Σ 능력치 × 가격)이 간격에도 똑같이 적용되게.
const ST = [
  ['hp', '체력 +20%', u => { u.maxHp *= 1.2; u.hp *= 1.2; }, a => a.hp * 0.2, '체력 1'],
  ['atk', '공격력 +20%', u => { u.atk *= 1.2; }, a => a.atk * 0.2, '공격력 1'],
  ['def', '방어 +20%', u => { u.def *= 1.2; }, a => a.def * 0.2, '방어 1'],
  ['spd', '공격 속도 +20%', u => { u.interval /= 1.2; }, a => 1.2 / a.iv - 1 / a.iv, '간격 −0.1초'],
  ['crit', '치명 +10%p', u => { u.crit += 0.1; }, () => 0.1, '치명 1%p'],
];
const t0 = Date.now(), L = {}, BAD = {};
for (const j of JOBS) { const t = teamFor(j), idx = t.findIndex(x => x.id === JOB[j].rep.id);
  const self = score(t, idx, null, 0); if (Math.abs(self - 0.5) > 1e-9) throw new Error('검산 실패: ' + JN[j] + ' 거울 전이 비김이 아님 ' + self);
  const chk = lvEquiv(t, idx, u => allUp(u, 0.25)), mono = [0.5, MHI].every(m => score(t, idx, null, m) < 0.5); // 기준표 B의 "못 잼" 규칙
  BAD[j] = !(chk > 0.5 && chk < 1.5) || !mono; L[j] = { chk };
  for (const s of ST) { L[j][s[0]] = lvEquiv(t, idx, s[2]); process.stderr.write('.'); } }
// 1의 가격(레벨), 직업 평균 영웅 = 1000점
const P = {}; // P[j][key] = 1단위당 레벨, P[j].scale = 레벨 → 점
for (const j of JOBS) { if (BAD[j]) continue; const a = JOB[j], p = {}; for (const s of ST) { const v = L[j][s[0]]; p[s[0]] = isFinite(v) ? v / s[3](a) : NaN; }
  const parts = { hp: a.hp * p.hp, atk: a.atk * p.atk, def: a.def * p.def, spd: (1 / a.iv) * p.spd, crit: a.crit * 100 * (p.crit / 100) };
  const tot = Object.values(parts).reduce((x, y) => x + y, 0); p.scale = 1000 / tot; p.parts = parts; p.tot = tot; P[j] = p;
  if (!(Object.values(parts).every(isFinite))) BAD[j] = true; }
// 영웅 가치(점). star: 체력·공격·방어 × 별 배율
const value = (h, star) => { const j = h.job, p = P[j], u = U[h.id], m = MM[(star || 1) - 1];
  return p.scale * (u.maxHp * m * p.hp + u.atk * m * p.atk + u.def * m * p.def + (1 / u.interval) * p.spd + u.crit * p.crit); };
for (const j of JOBS) if (!BAD[j]) { const a = JOB[j], p = P[j], v = p.scale * (a.hp * p.hp + a.atk * p.atk + a.def * p.def + (1 / a.iv) * p.spd + a.crit * p.crit); if (Math.abs(v - 1000) > 1e-6) throw new Error('검산 실패: 직업 평균 ≠ 1000 ' + j + ' ' + v); }

// 실측(기준표 D): 대표 영웅 자리에 바꿔 끼워 잰 레벨. 가장 최근 기준표 기록에서 읽어요
const dF = REC.list('기준표').pop(), DREC = dF ? JSON.parse(fs.readFileSync(require('path').join(REC.DIR, dF), 'utf8')) : null, DV = DREC && DREC.values['D 영웅'] || {};
const dOf = h => { const k = Object.keys(DV).find(x => x.startsWith(h.name + '(' + JN[h.job] + ' ')); return k == null ? null : DV[k]; };

// ── md
const fmtP = (j, s) => { const v = P[j][s[0]]; if (!isFinite(v)) return '못 잼'; const pt = v * P[j].scale * (s[0] === 'spd' ? 1 : s[0] === 'crit' ? 0.01 : 1);
  if (s[0] === 'spd') { const a = JOB[j], d = (1 / (a.iv - 0.1) - 1 / a.iv); return r0(d * v * P[j].scale) + '점'; } return (Math.abs(pt) >= 10 ? r0(pt) : Math.abs(pt) >= 1 ? r1(pt) : r2(pt)) + '점'; };
let md = '# 직업별 능력치 가격표 (능력치만, 2026-11-28)\n\n스킬(궁극기·패시브)을 뺀 능력치만이에요. 직업 효과는 남겼어요. 숫자는 지금 data.js 그대로이고, 게임 숫자는 안 바꿨어요.\n\n';
md += '- **1000점은 가상 기준이에요.** 직업마다 1레벨 1성 평균 영웅 = 1000점. 영웅 가치 = 능력치마다 (값 × 그 직업 가격)을 더한 것.\n';
md += '- 직업끼리 1000점은 같은 힘이 아니에요(각자 자기 직업 기준). 직업 사이는 조합 대결로 따로 봐요.\n';
md += '- 잰 방법: 표준 팀(수호·전사·궁수·마법 + 음유, 암살을 잴 땐 음유 대신 암살) 거울 전, 레벨 ' + LV + '. 직업 대표 영웅 한 명의 능력치를 올리고, 상대 같은 영웅의 레벨을 얼마나 올려야 비기는지(이분 탐색).\n';
md += '- 측정 단계: **' + STAGE + '단계** (시드 ' + SEEDS + '개 × 양쪽 = 한 번 잴 때 ' + SEEDS * 2 + '판). 1단계는 방향만 보는 빠른 확인이에요.\n';
md += '- 판 섞기: **' + { jitter: '팀 그대로, 판마다 자리별 체력·공격 ±10%(양쪽 같게)', team: '판마다 나머지 4명을 각 직업 무작위 영웅으로', none: '안 섞음(예전 방식, 절벽 문제 있음)' }[MIX] + '** (--mix=' + MIX + ')\n';
md += '- 대표 영웅: ' + JOBS.map(j => JN[j] + ' ' + JOB[j].rep.name).join(', ') + '\n\n';
md += '## 1. 직업별 가격표 (1의 가치, 점)\n\n| | ' + JOBS.map(j => JN[j]).join(' | ') + ' |\n|---|' + JOBS.map(() => '---').join('|') + '|\n';
for (const s of ST) md += '| ' + s[4] + ' | ' + JOBS.map(j => BAD[j] ? '못 잼' : fmtP(j, s)).join(' | ') + ' |\n';
md += '| 공격력 1 = 체력 몇 | ' + JOBS.map(j => BAD[j] ? '못 잼' : P[j].hp > 0 ? r1(P[j].atk / P[j].hp) : '체력 값 없음').join(' | ') + ' |\n';
md += '\n간격 −0.1초는 그 직업 평균 간격에서 0.1초 줄일 때예요(간격이 짧을수록 0.1초가 더 비싸요).\n';
md += '\n### 1000점의 몫 (직업 평균 영웅의 능력치가 각각 몇 점을 차지하나)\n\n| | ' + JOBS.map(j => JN[j]).join(' | ') + ' |\n|---|' + JOBS.map(() => '---').join('|') + '|\n';
for (const s of ST) md += '| ' + s[4].replace(/ .*/, '').replace('간격', '공격 속도') + ' | ' + JOBS.map(j => BAD[j] ? '못 잼' : r0(P[j].parts[s[0]] * P[j].scale)).join(' | ') + ' |\n';
md += '| 직업 평균 능력치 | ' + JOBS.map(j => { const a = JOB[j]; return '체력 ' + r0(a.hp) + ' · 공 ' + r0(a.atk) + ' · 방 ' + r0(a.def) + ' · 간격 ' + r2(a.iv) + ' · 치명 ' + r0(a.crit * 100) + '%'; }).join(' | ') + ' |\n';
md += '| 검산(체력·공격·방어 +25% = 1레벨, 1.0이 맞음) | ' + JOBS.map(j => r2(L[j].chk)).join(' | ') + ' |\n';
{ const X = JOBS.filter(j => BAD[j]); if (X.length) md += '\n⚠ ' + X.map(j => JN[j]).join('·') + ': 검산 줄이 0.5~1.5 밖이거나, 상대를 올려도 상대가 우세해지지 않았어요. 이 열은 못 잰 것으로 봐요.\n'; }
md += '\n음수 몫은 그 능력치를 올리면 오히려 손해라는 뜻이에요(1단계는 흔들림이 있어요).\n';

const GR = [...new Set(heroes.map(h => h.grade || 1))].sort();
md += '\n## 2. 직업 × 등급 × 성급 가치 (점, 평균 · 최저~최대 · 영웅 수)\n\n';
for (let s = 1; s <= MM.length; s++) { md += '### ' + s + '성 (체력·공격·방어 ×' + MM[s - 1] + ')\n\n| 직업 | ' + GR.map(g => g + '등급').join(' | ') + ' |\n|---|' + GR.map(() => '---').join('|') + '|\n';
  for (const j of JOBS) md += '| ' + JN[j] + ' | ' + GR.map(g => { if (BAD[j]) return '못 잼'; const V = heroes.filter(h => h.job === j && (h.grade || 1) === g).map(h => value(h, s)); return V.length ? r0(avg(V)) + ' · ' + r0(Math.min(...V)) + '~' + r0(Math.max(...V)) + ' · ' + V.length + '명' : '—'; }).join(' | ') + ' |\n';
  md += '\n'; }

md += '## 3. 영웅별 (1성)\n\n- 가치 = 가격표로 계산한 점수. 실측 = 기준표 D(대표 영웅 자리에 바꿔 끼워 잰 레벨, ' + (DREC ? DREC.at + ' ' + DREC.commit : '기록 없음') + '). 계산(레벨) = 가격표로 본 대표 영웅과의 차이를 레벨로.\n';
md += '- ⚠ = 같은 직업·등급 평균에서 ±10% 밖. 계산과 실측이 0.3레벨 넘게 다르면 "안 맞음".\n\n| 직업 | 등급 | 영웅 | 체력 | 공격 | 방어 | 간격 | 치명 | 가치 | 계산(레벨) | 실측(레벨) | |\n|---|---|---|---|---|---|---|---|---|---|---|---|\n';
const ROWS = [], miss = [];
for (const j of JOBS) for (const g of GR) for (const h of heroes.filter(x => x.job === j && (x.grade || 1) === g)) { const u = U[h.id];
  if (BAD[j]) { md += `| ${JN[j]} | ${g} | ${h.name} | ${r0(u.maxHp)} | ${r0(u.atk)} | ${r0(u.def)} | ${r2(u.interval)} | ${r0(u.crit * 100)}% | 못 잼 | | | |\n`; continue; }
  const v = value(h, 1), rep = heroes.find(x => x.id === JOB[j].rep.id), cl = (v - value(rep, 1)) / P[j].scale, ms = dOf(h);
  const grpAvg = avg(heroes.filter(x => x.job === j && (x.grade || 1) === g).map(x => value(x, 1))), out = Math.abs(v / grpAvg - 1) > 0.1, off = ms != null && Math.abs(cl - ms) > 0.3;
  if (ms != null) miss.push(Math.abs(cl - ms)); ROWS.push({ name: h.name, job: JN[j], g, v: r0(v), cl: r2(cl), ms });
  md += `| ${JN[j]} | ${g} | ${h.name} | ${r0(u.maxHp)} | ${r0(u.atk)} | ${r0(u.def)} | ${r2(u.interval)} | ${r0(u.crit * 100)}% | ${r0(v)}${out ? ' ⚠' : ''} | ${sg(r2(cl))} | ${ms == null ? '—' : sg(ms)} | ${off ? '안 맞음' : ''} |\n`; }
if (miss.length) md += '\n계산 vs 실측 평균 차이 ' + r2(avg(miss)) + '레벨, 0.3레벨 넘게 다른 영웅 ' + miss.filter(x => x > 0.3).length + '명 / ' + miss.length + '명.\n';

const v = {}; JOBS.forEach(j => { if (BAD[j]) { (v['못 잰 직업'] = v['못 잰 직업'] || {})[JN[j]] = 1; return; } const o = {}; ST.forEach(s => { o[s[4]] = r3(P[j][s[0]] * P[j].scale * (s[0] === 'crit' ? 0.01 : 1)); }); v['가격 ' + JN[j]] = o; });
v['영웅 1성'] = {}; ROWS.forEach(r => { v['영웅 1성'][r.name + '(' + r.job + ' ' + r.g + '등급)'] = r.v; });
const sv = REC.save('능력치_가격', v, { 레벨: LV, 단계: STAGE, 시드: SEEDS, 탐색: ITER, 섞기: MIX });
md += REC.compareMd(sv.prev, sv.rec) + '\n기록: `밸런스/기록/' + sv.file + '`\n';
fs.writeFileSync('밸런스/능력치_가격.md', md); process.stderr.write('\n' + r0((Date.now() - t0) / 1000) + '초\n'); console.log(md);
