// 밸런스 기준표: node 밸런스/기준표.js [--stage=1|2|3] → 밸런스/기준표.md (2026-11-27)
// A. 직업별 레벨 성장(공식)  B. 직업별 능력치 가치(레벨 환산, 거울 전)  C. 업그레이드 한 번의 가치  D. 등급·별의 가치
// 사용자: "스킬 제외하고 능력치만으로 봤을 때 … 공격력 1과 체력 1, 다른 능력치의 가치를 계산해야 직업 간 밸런스를 조절할 수 있잖아"
// 사용자: "레벨1 기준 직업 능력치를 기본값과 레벨 수치를 정할 거야. 그리고 등급업 성급업도 구하려고" → 잣대를 체력에서 레벨로 바꿈, 레벨 1 기준
// 단계(사용자: "테스트 정도는 3단계로 나누고 이번엔 1단계 10판씩만"): 1 = 시드 10, 2 = 시드 100, 3 = 시드 200 (시드 하나 = 양쪽 바꿔 2판)
process.chdir(require('path').join(__dirname, '..'));
const fs = require('fs'), D = require(process.cwd() + '/data.js'), E = require(process.cwd() + '/engine.js');
const STAGE = +((process.argv.find(a => /^--stage=\d$/.test(a)) || '--stage=1').split('=')[1]);
const SEEDS = { 1: 10, 2: 100, 3: 200 }[STAGE]; if (!SEEDS) throw new Error('--stage는 1, 2, 3 중 하나');
const JOBS = ['guardian', 'warrior', 'archer', 'mage', 'bard', 'assassin'];
const JN = { guardian: '수호자', warrior: '전사', archer: '궁수', mage: '마법사', bard: '음유시인', assassin: '암살자' };
const K = D.battle.defK, CM = (D.crit && D.crit.mul) || 2, G = D.growth.perLevel, LV = 1;
const GL = 1 + G * (LV - 1); // 레벨 LV의 성장 배율. 체력·공격·방어 ×(1+x) = 레벨 GL·x/G 단계
const heroes = D.heroes.filter(h => !h.mob && JOBS.includes(h.job));
const unit1 = (id, lv) => E.createBattle(D, [{ id, slot: 0, level: lv || 1, star: 1 }], [{ id, slot: 0, level: 1 }], { seed: 1 }).A[0];
const avg = a => a.reduce((x, y) => x + y, 0) / a.length, r0 = x => Math.round(x), r1 = x => Math.round(x * 10) / 10, r2 = x => Math.round(x * 100) / 100;
const sg = x => (x >= 0 ? '+' : '') + x;

// 직업 평균 1레벨 능력치, 대표 영웅(평균에 가장 가까운 영웅)
const JOB = {};
for (const j of JOBS) { const L = heroes.filter(h => h.job === j).map(h => ({ h, u: unit1(h.id) }));
  const a = { hp: avg(L.map(x => x.u.maxHp)), atk: avg(L.map(x => x.u.atk)), def: avg(L.map(x => x.u.def)), iv: avg(L.map(x => x.u.interval)), crit: avg(L.map(x => x.u.crit)), n: L.length };
  const rep = L.map(x => ({ id: x.h.id, name: x.h.name, d: Math.abs(Math.log(x.u.maxHp / a.hp)) + Math.abs(Math.log(x.u.atk / a.atk)) + Math.abs(Math.log(x.u.interval / a.iv)) })).sort((p, q) => p.d - q.d)[0];
  JOB[j] = Object.assign(a, { rep }); }
let md = '# 밸런스 기준표 (능력치만, 2026-11-27)\n\n스킬(궁극기·패시브)을 뺀 능력치 기준이에요. 직업 효과(궁수 대상 고정, 암살자 순간이동 등)는 남겼어요. 숫자는 지금 data.js 그대로이고, 이 표를 보고 직업 기본 능력치·레벨 성장·등급·별·업그레이드를 정해요.\n\n';
md += '- 측정 단계: **' + STAGE + '단계** (시드 ' + SEEDS + '개 × 양쪽 = 한 번 잴 때 ' + SEEDS * 2 + '판). 1단계는 방향만 보는 빠른 확인이라 칸마다 ±0.3레벨쯤 흔들릴 수 있어요.\n\n';

// ── A. 레벨 성장 (공식)
md += '## A. 레벨이 오를 때 (공식)\n\n지금 규칙: 레벨마다 체력·공격·방어 × (1 + ' + G + ' × (레벨 − 1)). 공격 간격·치명·사거리·이동은 그대로.\n\n';
md += '- 평타 DPS = 공격력 ÷ 공격 간격 × (1 + 치명 확률 × (치명 배율 ' + CM + ' − 1))\n- 실질 체력(버티는 힘) = 체력 × (1 + 방어 ÷ ' + K + ')  ← 방어 ' + K + '마다 체력 한 번만큼 더 버팀\n- 전투력 = √(평타 DPS × 실질 체력)\n\n';
md += '### 직업 평균 1레벨 능력치\n\n| 직업 | 영웅 수 | 체력 | 공격력 | 방어 | 공격 간격 | 치명 | 평타 DPS | 실질 체력 | 전투력 | 대표 영웅(시뮬용) |\n|---|---|---|---|---|---|---|---|---|---|---|\n';
const dps = (a, g) => a.atk * g / a.iv * (1 + a.crit * (CM - 1)), ehp = (a, g) => a.hp * g * (1 + a.def * g / K), pw = (a, g) => Math.sqrt(dps(a, g) * ehp(a, g));
for (const j of JOBS) { const a = JOB[j]; md += `| ${JN[j]} | ${a.n} | ${r0(a.hp)} | ${r0(a.atk)} | ${r0(a.def)} | ${r2(a.iv)} | ${r0(a.crit * 100)}% | ${r1(dps(a, 1))} | ${r0(ehp(a, 1))} | ${r0(pw(a, 1))} | ${a.rep.name} |\n`; }
md += '\n### 레벨별 전투력 (1레벨 = 100)\n\n| 레벨 | ' + JOBS.map(j => JN[j]).join(' | ') + ' | 직전 레벨보다 |\n|---|' + JOBS.map(() => '---').join('|') + '|---|\n';
for (let L = 1; L <= 10; L++) { const g = 1 + G * (L - 1), gp = 1 + G * (L - 2); md += `| ${L} | ` + JOBS.map(j => r0(pw(JOB[j], g) / pw(JOB[j], 1) * 100)).join(' | ') + ` | ${L > 1 ? '+' + r0((pw(JOB.warrior, g) / pw(JOB.warrior, gp) - 1) * 100) + '% (전사)' : ''} |\n`; }
md += '\n체력·공격이 같은 비율로 크고 방어도 커서, 실질 체력은 레벨 배율보다 조금 더 빨리 커요(방어 ÷ ' + K + '이 커지니까). 오르는 폭(%)은 레벨이 높을수록 줄어요.\n\n';

// ── B. 능력치 가치 (거울 전, 레벨 환산)
const RC = [52, 100, 150, 210, 262, 314, 366];
const reachUp = u => { let ci = 0; RC.forEach((r, i) => { if (Math.abs(r - u.reach) < Math.abs(RC[ci] - u.reach)) ci = i; }); u.reach = RC[Math.min(RC.length - 1, ci + 1)]; };
const allUp = (u, m) => { u.maxHp *= 1 + m; u.hp *= 1 + m; u.atk *= 1 + m; u.def *= 1 + m; }; // 레벨이 바꾸는 세 능력치
const STATS = [ // [이름, 메모, 바꾸기, 이 변화가 몇 포인트인가(그 영웅 기준), 스킬 켬에서만, 포인트 단위]
  ['체력·공격·방어 +25%', '검산: 1.0이어야 함', u => allUp(u, 0.25), null, false],
  ['체력 +20%', '', u => { u.maxHp *= 1.2; u.hp *= 1.2; }, u => u.maxHp * 0.2, false, '체력'],
  ['공격력 +20%', '', u => { u.atk *= 1.2; }, u => u.atk * 0.2, false, '공격력'],
  ['방어 +20%', '', u => { u.def *= 1.2; }, u => u.def * 0.2, false, '방어'],
  ['공격 속도 +20%', '', u => { u.interval /= 1.2; }, () => 20, false, '공격 속도 %'],
  ['치명 확률 +10%p', '', u => { u.crit += 0.1; }, () => 10, false, '치명 %p'],
  ['사거리 +1칸', '', reachUp, () => 1, false, '사거리 칸'],
  ['이동 속도 +20%', '', u => { u.spd *= 1.2; }, () => 20, false, '이동 속도 %'],
  ['궁극기 충전 +20%', '', u => { u.enMul = (u.enMul || 1) * 1.2; }, () => 20, true, '궁극기 충전 %'],
];
const ITER = 8, MLO = -0.6, MHI = 1.5; // 상대 영웅 체력·공격·방어 −60% ~ +150% 안에서 찾음
const LVLO = r1(GL * MLO / G), LVHI = r1(GL * MHI / G);
const teamFor = j => { const ids = ['guardian', 'warrior', 'archer', 'mage', j === 'assassin' ? 'assassin' : 'bard'].map(x => JOB[x].rep.id); const slots = [0, 1, 3, 6, 4]; return ids.map((id, i) => ({ id, slot: slots[i], level: LV, star: 1 })); };
// 같은 팀끼리면 승패가 자리·시드로 거의 정해져서, 끝났을 때 남은 체력 차이(X − Y, X 시작 체력 합으로 나눔)를 평균해요. 0.5 = 비김
function score(tX, tY, idx, fA, m, statsOnly) { let w = 0, n = 0; for (let s = 1; s <= SEEDS; s++) for (const sw of [0, 1]) {
  const cp = t => t.map(x => ({ ...x })), o = { seed: s * 7 + 3, statsOnly }, b = sw ? E.createBattle(D, cp(tY), cp(tX), o) : E.createBattle(D, cp(tX), cp(tY), o);
  const X = sw ? b.E : b.A, Y = sw ? b.A : b.E, M0 = X.reduce((a, u) => a + u.maxHp, 0); if (fA) fA(X[idx]); allUp(Y[idx], m);
  while (!b.result && b.time < 90) b.step(); const left = S => S.reduce((a, u) => a + Math.max(0, u.alive ? u.hp : 0), 0); w += (left(X) - left(Y)) / M0; n++; } return 0.5 + w / n; }
// X 쪽 변화가 상대 같은 영웅 레벨 몇 단계와 같은가
function lvEquiv(tX, tY, idx, fA, statsOnly) {
  const f = m => score(tX, tY, idx, fA, m, statsOnly); let lo = MLO, hi = MHI;
  if (f(hi) > 0.5) return LVHI; if (f(lo) < 0.5) return LVLO;
  for (let i = 0; i < ITER; i++) { const m = (lo + hi) / 2; if (f(m) > 0.5) lo = m; else hi = m; } return GL * (lo + hi) / 2 / G; }
const t0 = Date.now(), B = {}, MONO = {}; // MONO: 상대 그 영웅을 +50%, +150% 올리면 상대가 우세해야 정상(아니면 그 열은 못 잼)
for (const mode of ['off', 'on']) for (const j of JOBS) { const t = teamFor(j), idx = t.findIndex(x => x.id === JOB[j].rep.id); (MONO[mode] = MONO[mode] || {})[j] = [0.5, MHI].every(m => score(t, t, idx, null, m, mode === 'off') < 0.5); }
for (const mode of ['off', 'on']) for (const j of JOBS) for (const st of STATS) { if (st[4] && mode === 'off') continue; const t = teamFor(j), idx = t.findIndex(x => x.id === JOB[j].rep.id); (B[mode] = B[mode] || {})[j + '|' + st[0]] = lvEquiv(t, t, idx, st[2], mode === 'off'); process.stderr.write('.'); }
const CHK = STATS[0][0], bad = (mode, j) => { const c = B[mode][j + '|' + CHK]; return !(c > 0.5 && c < 1.5) || !MONO[mode][j]; }; // 검산 줄이 0.5~1.5 밖이거나, 상대를 올려도 상대가 우세해지지 않으면 그 열은 못 믿음
const fmtL = v => v >= LVHI ? LVHI + ' 이상' : v <= LVLO ? LVLO + ' 이하' : sg(r2(v));
md += '## B. 능력치 가치 — 레벨로 환산 (레벨 ' + LV + ', 거울 전)\n\n';
md += '- 표준 팀(수호자·전사·궁수·마법사 + 음유시인, 암살자를 잴 땐 음유시인 대신 암살자, 각 직업 대표 영웅, 레벨 ' + LV + ')끼리 싸워요. 한쪽은 그 직업 영웅 **한 명**에게만 능력치를 올리고, 다른 쪽은 같은 영웅의 체력·공격·방어를 같이 올려요(= 레벨). 둘이 비길 때 상대가 올린 양을 레벨 단계로 적었어요(이분 탐색).\n';
md += '- 레벨 ' + LV + '에서 레벨 1단계 = 체력·공격·방어 +' + r0(G / GL * 100) + '%. 클수록 그 직업에게 값진 능력치예요. 맨 윗줄은 검산이라 1.0 근처가 맞고, 1.0에서 벗어난 만큼이 그 열의 흔들림이에요. 음수는 오히려 손해예요.\n\n';
for (const mode of ['off', 'on']) {
  const L = STATS.filter(s => !(s[4] && mode === 'off'));
  md += '### ' + (mode === 'off' ? '스킬 끔 (능력치만)' : '스킬 켬 (궁극기·패시브 포함)') + '\n\n| 능력치 (레벨 단계) | ' + JOBS.map(j => JN[j]).join(' | ') + ' |\n|---|' + JOBS.map(() => '---').join('|') + '|\n';
  for (const st of L) md += '| ' + st[0] + (st[1] ? ' (' + st[1] + ')' : '') + ' | ' + JOBS.map(j => bad(mode, j) ? '못 잼' : fmtL(B[mode][j + '|' + st[0]])).join(' | ') + ' |\n';
  { const X = JOBS.filter(j => bad(mode, j)); if (X.length) md += '\n⚠ ' + X.map(j => JN[j]).join('·') + ': 상대 영웅을 +50%나 +150% 올려도 상대가 우세해지지 않거나 검산 줄이 1.0에서 크게 벗어났어요. 이 열은 못 잰 것으로 봐요.\n'; }
  md += '\n**레벨 1단계를 이 능력치 하나로만 채우면** (그 직업 대표 영웅 레벨 ' + LV + ' 기준, 위 값을 직선으로 늘린 어림값)\n\n| | ' + JOBS.map(j => JN[j]).join(' | ') + ' |\n|---|' + JOBS.map(() => '---').join('|') + '|\n';
  for (const st of L.filter(s => s[3])) md += '| ' + st[5] + ' | ' + JOBS.map(j => { if (bad(mode, j)) return '못 잼'; const u = unit1(JOB[j].rep.id, LV), v = B[mode][j + '|' + st[0]]; if (v <= 0) return '손해'; if (v < 0.1) return '거의 없음'; const p = st[3](u) / v; return (p >= 10 ? r0(p) : r1(p)) + (/%|칸/.test(st[5]) ? st[5].replace(/^.* /, '') : ''); }).join(' | ') + ' |\n';
  { const hp = STATS[1], at = STATS[2]; md += '| 공격력 1 = 체력 | ' + JOBS.map(j => { if (bad(mode, j)) return '못 잼'; const u = unit1(JOB[j].rep.id, LV), vh = B[mode][j + '|' + hp[0]], va = B[mode][j + '|' + at[0]]; return vh < 0.1 ? '체력 값이 거의 없음' : r1((va / at[3](u)) / (vh / hp[3](u))); }).join(' | ') + ' |\n'; }
  md += '\n'; }

// ── C. 업그레이드 한 번
md += '## C. 업그레이드 한 번의 가치 (능력치 노드)\n\n- 한 단계 올렸을 때 그 능력치가 몇 % 오르는지, 공식 전투력(√(평타 DPS × 실질 체력))이 몇 % 오르는지, 그게 레벨 ' + LV + '→' + (LV + 1) + ' 한 번의 몇 %인지, 훈장 1개당 전투력 %.\n\n| 노드 | 대상 | 한 단계 | 전투력 ↑ | 레벨업 1번 대비 | 훈장(1단계) | 훈장 1개당 |\n|---|---|---|---|---|---|---|\n';
const lvStep = pw(JOB.warrior, 1 + G * LV) / pw(JOB.warrior, 1 + G * (LV - 1)) - 1;
const SN = { hp: '체력', atk: '공격력', def: '방어', crit: '치명' };
for (const L of D.meta.lines) for (const N of L.nodes) { if (!N.hero) continue; const tgt = L.job === 'all' || !L.job ? '팀 전체' : (JN[L.job] || L.job), a = JOB[L.job] || JOB.warrior, g = 1 + G * (LV - 1);
  const b = { hp: a.hp, atk: a.atk, def: a.def, iv: a.iv, crit: a.crit }; if (N.hero === 'crit') b.crit += N.add; else b[N.hero] *= 1 + N.add;
  const up = pw(b, g) / pw(a, g) - 1, c = N.cost[0];
  md += `| ${N.name} | ${tgt} | ${SN[N.hero] || N.hero} +${N.hero === 'crit' ? r1(N.add * 100) + '%p' : r1(N.add * 100) + '%'} | +${r2(up * 100)}% | ${r0(up / lvStep * 100)}% | ${c} | ${r2(up * 100 / c)}% |\n`; }
md += '\n레벨업 1번(레벨 ' + LV + '→' + (LV + 1) + ') = 전투력 +' + r1(lvStep * 100) + '%. 공식 전투력이라 사거리·공속이 궁극기에 주는 효과는 빠져요(B 표 참고).\n\n';

// ── D. 등급·별
const MM = (D.recruit.merge && D.recruit.merge.mul) || D.recruit.starMul;
md += '## D. 등급과 별의 가치 (레벨 환산)\n\n### 별(성급) — 공식\n\n별은 체력·공격·방어에 같은 배율을 곱해서 레벨과 똑같이 셀 수 있어요. 레벨이 높을수록 레벨 1단계가 작아져서, 같은 별이 더 많은 레벨이 돼요.\n\n| 별 | 배율 | 레벨 1에서 | 레벨 5에서 | 레벨 10에서 |\n|---|---|---|---|---|\n';
for (let s = 2; s <= MM.length; s++) md += `| ${s}성 | ×${MM[s - 1]} | +${r1((MM[s - 1] - 1) / G)}레벨 | +${r1((1 + 4 * G) * (MM[s - 1] - 1) / G)}레벨 | +${r1((1 + 9 * G) * (MM[s - 1] - 1) / G)}레벨 |\n`;
md += '\n### 등급 — 영웅마다 대표 영웅과 바꿔 끼워 잼 (스킬 끔)\n\n표준 팀에서 그 직업 대표 영웅 자리에 그 영웅을 넣고, 상대는 대표 영웅 그대로 레벨만 올려서 비기는 지점을 찾았어요. 0 = 대표 영웅과 같음, +1 = 대표 영웅보다 레벨 1 센 것.\n\n';
const HV = []; for (const h of heroes) { const tY = teamFor(h.job), idx = tY.findIndex(x => x.id === JOB[h.job].rep.id), tX = tY.map((x, i) => i === idx ? { ...x, id: h.id } : x);
  HV.push({ id: h.id, name: h.name, job: h.job, grade: h.grade || 1, lv: h.id === JOB[h.job].rep.id ? 0 : lvEquiv(tX, tY, idx, null, true) }); process.stderr.write(','); }
const GR = [...new Set(HV.map(x => x.grade))].sort();
md += '| 직업 | ' + GR.map(g => g + '등급').join(' | ') + ' | 등급 1단계당 |\n|---|' + GR.map(() => '---').join('|') + '|---|\n';
for (const j of JOBS) { const cells = GR.map(g => { const L = HV.filter(x => x.job === j && x.grade === g); return L.length ? { v: avg(L.map(x => x.lv)), n: L.length, g } : null; });
  const ok = cells.filter(Boolean), slope = ok.length > 1 ? (ok[ok.length - 1].v - ok[0].v) / (ok[ok.length - 1].g - ok[0].g) : null;
  md += '| ' + JN[j] + ' | ' + cells.map(c => c ? sg(r2(c.v)) + ' (' + c.n + '명)' : '—').join(' | ') + ' | ' + (slope === null ? '—' : sg(r2(slope))) + ' |\n'; }
md += '\n등급 1단계당 = (가장 높은 등급 평균 − 가장 낮은 등급 평균) ÷ 등급 차이. 영웅 한 명씩 값은 기록 파일(D 영웅 줄)에 있어요.\n';
process.stderr.write('\n' + Math.round((Date.now() - t0) / 1000) + '초\n');

{ const REC = require('./기록.js'), v = {}; JOBS.forEach(j => { const a = JOB[j]; v['A ' + JN[j]] = { 체력: r0(a.hp), 공격력: r0(a.atk), 방어: r0(a.def), 공격간격: r2(a.iv), 평타DPS: r1(dps(a, 1)), 실질체력: r0(ehp(a, 1)) }; });
  for (const mode in B) for (const k in B[mode]) { const [j, st] = k.split('|'), mn = (mode === 'off' ? '스킬끔 ' : '스킬켬 ') + JN[j]; if (bad(mode, j)) { (v['못 잰 열'] = v['못 잰 열'] || {})[mn] = 1; continue; } (v['L ' + mn] = v['L ' + mn] || {})[st] = r2(B[mode][k]); } // L = 레벨 환산(2026-11-27부터. 그 전 B 줄은 체력 %)
  v['D 영웅'] = {}; HV.forEach(x => { v['D 영웅'][x.name + '(' + JN[x.job] + ' ' + x.grade + '등급)'] = r2(x.lv); });
  const s = REC.save('기준표', v, { 레벨: LV, 단계: STAGE, 시드: SEEDS, 탐색: ITER, 잣대: '레벨' }); md += '\n기록: 밸런스/기록/' + s.file + '\n' + REC.compareMd(s.prev, s.rec); }
fs.writeFileSync('밸런스/기준표.md', md); console.log(md);
