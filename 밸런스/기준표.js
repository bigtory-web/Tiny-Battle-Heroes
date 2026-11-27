// 밸런스 기준표: node 밸런스/기준표.js → 밸런스/기준표.md (2026-11-27)
// A. 직업별 레벨 성장(공식)  B. 직업별 능력치 가치(체력 환산, 거울 전)  C. 업그레이드 한 번의 가치
// 사용자: "스킬 제외하고 능력치만으로 봤을 때 … 공격력 1과 체력 1, 다른 능력치의 가치를 계산해야 직업 간 밸런스를 조절할 수 있잖아 … 궁수의 공격력 10%가 전사의 10%랑 같아?"
process.chdir(require('path').join(__dirname, '..'));
const fs = require('fs'), D = require(process.cwd() + '/data.js'), E = require(process.cwd() + '/engine.js');
const QUICK = process.argv.includes('--quick'); // 빠른 확인용(판 수·탐색 줄임)
const JOBS = ['guardian', 'warrior', 'archer', 'mage', 'bard', 'assassin'];
const JN = { guardian: '수호자', warrior: '전사', archer: '궁수', mage: '마법사', bard: '음유시인', assassin: '암살자' };
const K = D.battle.defK, CM = (D.crit && D.crit.mul) || 2, G = D.growth.perLevel, LV = 5;
const heroes = D.heroes.filter(h => !h.mob && JOBS.includes(h.job));
const unit1 = (id, lv) => E.createBattle(D, [{ id, slot: 0, level: lv || 1, star: 1 }], [{ id, slot: 0, level: 1 }], { seed: 1 }).A[0];
const avg = a => a.reduce((x, y) => x + y, 0) / a.length, r0 = x => Math.round(x), r1 = x => Math.round(x * 10) / 10, r2 = x => Math.round(x * 100) / 100;

// 직업 평균 1레벨 능력치, 대표 영웅(평균에 가장 가까운 영웅)
const JOB = {};
for (const j of JOBS) { const L = heroes.filter(h => h.job === j).map(h => ({ h, u: unit1(h.id) }));
  const a = { hp: avg(L.map(x => x.u.maxHp)), atk: avg(L.map(x => x.u.atk)), def: avg(L.map(x => x.u.def)), iv: avg(L.map(x => x.u.interval)), crit: avg(L.map(x => x.u.crit)), n: L.length };
  const rep = L.map(x => ({ id: x.h.id, name: x.h.name, d: Math.abs(Math.log(x.u.maxHp / a.hp)) + Math.abs(Math.log(x.u.atk / a.atk)) + Math.abs(Math.log(x.u.interval / a.iv)) })).sort((p, q) => p.d - q.d)[0];
  JOB[j] = Object.assign(a, { rep }); }
let md = '# 밸런스 기준표 (능력치만, 2026-11-27)\n\n스킬(궁극기·패시브)을 뺀 능력치 기준이에요. 직업 효과(궁수 대상 고정, 암살자 순간이동 등)는 남겼어요. 숫자는 지금 data.js 그대로이고, 이 표를 보고 성장률·직업 능력치·업그레이드 비용을 정해요.\n\n';

// ── A. 레벨 성장 (공식)
md += '## A. 레벨이 오를 때 (공식)\n\n지금 규칙: 레벨마다 체력·공격·방어 × (1 + ' + G + ' × (레벨 − 1)). 공격 간격·치명·사거리·이동은 그대로.\n\n';
md += '- 평타 DPS = 공격력 ÷ 공격 간격 × (1 + 치명 확률 × (치명 배율 ' + CM + ' − 1))\n- 실질 체력(버티는 힘) = 체력 × (1 + 방어 ÷ ' + K + ')  ← 방어 ' + K + '마다 체력 한 번만큼 더 버팀\n- 전투력 = √(평타 DPS × 실질 체력)\n\n';
md += '### 직업 평균 1레벨 능력치\n\n| 직업 | 영웅 수 | 체력 | 공격력 | 방어 | 공격 간격 | 치명 | 평타 DPS | 실질 체력 | 전투력 | 대표 영웅(시뮬용) |\n|---|---|---|---|---|---|---|---|---|---|---|\n';
const dps = (a, g) => a.atk * g / a.iv * (1 + a.crit * (CM - 1)), ehp = (a, g) => a.hp * g * (1 + a.def * g / K), pw = (a, g) => Math.sqrt(dps(a, g) * ehp(a, g));
for (const j of JOBS) { const a = JOB[j]; md += `| ${JN[j]} | ${a.n} | ${r0(a.hp)} | ${r0(a.atk)} | ${r0(a.def)} | ${r2(a.iv)} | ${r0(a.crit * 100)}% | ${r1(dps(a, 1))} | ${r0(ehp(a, 1))} | ${r0(pw(a, 1))} | ${a.rep.name} |\n`; }
md += '\n### 레벨별 전투력 (1레벨 = 100)\n\n| 레벨 | ' + JOBS.map(j => JN[j]).join(' | ') + ' | 직전 레벨보다 |\n|---|' + JOBS.map(() => '---').join('|') + '|---|\n';
for (let L = 1; L <= 10; L++) { const g = 1 + G * (L - 1), gp = 1 + G * (L - 2); md += `| ${L} | ` + JOBS.map(j => r0(pw(JOB[j], g) / pw(JOB[j], 1) * 100)).join(' | ') + ` | ${L > 1 ? '+' + r0((pw(JOB.warrior, g) / pw(JOB.warrior, gp) - 1) * 100) + '% (전사)' : ''} |\n`; }
md += '\n체력·공격이 같은 비율로 크고 방어도 커서, 실질 체력은 레벨 배율보다 조금 더 빨리 커요(방어 ÷ ' + K + '이 커지니까). 오르는 폭(%)은 레벨이 높을수록 줄어요.\n\n';

// ── B. 능력치 가치 (거울 전, 체력 환산)
const RC = [52, 100, 150, 210, 262, 314, 366];
const reachUp = u => { let ci = 0; RC.forEach((r, i) => { if (Math.abs(r - u.reach) < Math.abs(RC[ci] - u.reach)) ci = i; }); u.reach = RC[Math.min(RC.length - 1, ci + 1)]; };
const STATS = [ // [이름, 단위 설명, 바꾸기, 몇 포인트인가(그 영웅 기준), 스킬 켬에서만]
  ['체력 +20%', '검산(≈20%여야 함)', u => { u.maxHp *= 1.2; u.hp *= 1.2; }, u => u.maxHp * 0.2, false, '체력 1'],
  ['공격력 +20%', '', u => { u.atk *= 1.2; }, u => u.atk * 0.2, false, '공격력 1'],
  ['방어 +20%', '', u => { u.def *= 1.2; }, u => u.def * 0.2, false, '방어 1'],
  ['공격 속도 +20%', '', u => { u.interval /= 1.2; }, null, false],
  ['치명 확률 +10%p', '', u => { u.crit += 0.1; }, null, false],
  ['사거리 +1칸', '', reachUp, null, false],
  ['이동 속도 +20%', '', u => { u.spd *= 1.2; }, null, false],
  ['궁극기 충전 +20%', '', u => { u.enMul = (u.enMul || 1) * 1.2; }, null, true],
];
const SEEDS = QUICK ? 30 : 100, ITER = QUICK ? 4 : 8, HMAX = 2;
const teamFor = j => { const ids = ['guardian', 'warrior', 'archer', 'mage', j === 'assassin' ? 'assassin' : 'bard'].map(x => JOB[x].rep.id); const slots = [0, 1, 3, 6, 4]; return ids.map((id, i) => ({ id, slot: slots[i], level: LV, star: 1 })); };
// 승패는 같은 팀끼리면 자리·시드로 거의 정해져서 한 명 버프로는 잘 안 움직여요. 그래서 끝났을 때 남은 체력 차이(버프 쪽 − 상대, 시작 전 팀 체력 합으로 나눔)를 평균해요. 0보다 크면 버프 쪽이 우세
function winRate(team, idx, fA, hB, statsOnly) { let w = 0, n = 0; for (let s = 1; s <= SEEDS; s++) for (const sw of [0, 1]) {
  const b = E.createBattle(D, team.map(x => ({ ...x })), team.map(x => ({ ...x })), { seed: s * 7 + 3, statsOnly });
  const X = sw ? b.E : b.A, Y = sw ? b.A : b.E, M0 = X.reduce((a, u) => a + u.maxHp, 0); fA(X[idx]); Y[idx].maxHp *= 1 + hB; Y[idx].hp *= 1 + hB;
  while (!b.result && b.time < 90) b.step(); const left = S => S.reduce((a, u) => a + Math.max(0, u.alive ? u.hp : 0), 0); w += (left(X) - left(Y)) / M0; n++; } return 0.5 + w / n; } // 0.5 = 비김
function hpEquiv(j, st, statsOnly) { const team = teamFor(j), idx = team.findIndex(x => x.id === JOB[j].rep.id);
  if (winRate(team, idx, st[2], HMAX, statsOnly) > 0.5) return HMAX; let lo = -0.5, hi = HMAX; if (winRate(team, idx, st[2], lo, statsOnly) < 0.5) return lo;
  for (let i = 0; i < ITER; i++) { const m = (lo + hi) / 2; if (winRate(team, idx, st[2], m, statsOnly) > 0.5) lo = m; else hi = m; } return (lo + hi) / 2; }
const t0 = Date.now(), B = {};
for (const mode of ['off', 'on']) for (const j of JOBS) for (const st of STATS) { if (st[4] && mode === 'off') continue; const h = hpEquiv(j, st, mode === 'off'); (B[mode] = B[mode] || {})[j + '|' + st[0]] = h; process.stderr.write('.'); }
process.stderr.write('\n' + Math.round((Date.now() - t0) / 1000) + '초\n');
md += '## B. 능력치 가치 — 체력으로 환산 (레벨 ' + LV + ', 거울 전)\n\n';
md += '- 표준 팀(수호자·전사·궁수·마법사 + 음유시인, 암살자를 잴 땐 음유시인 대신 암살자, 각 직업 대표 영웅, 레벨 ' + LV + ')끼리 싸워요. 한쪽은 그 직업 영웅 **한 명**에게만 능력치를 올리고, 다른 쪽은 같은 영웅 체력을 올려요. 둘이 똑같이 이길 때의 체력 증가(%)를 찾았어요(이분 탐색, 시드 ' + SEEDS + '개 × 양쪽).\n';
md += '- "체력 +N%"가 클수록 그 능력치가 그 직업에게 값져요. 맨 윗줄(체력 +20%)은 검산이라 ≈ +20%가 맞아요. "+200% 이상"은 체력으로는 못 따라잡을 만큼 값지다는 뜻, 음수는 오히려 손해예요.\n\n';
for (const mode of ['off', 'on']) {
  md += '### ' + (mode === 'off' ? '스킬 끔 (능력치만)' : '스킬 켬 (궁극기·패시브 포함)') + '\n\n| 능력치 | ' + JOBS.map(j => JN[j]).join(' | ') + ' |\n|---|' + JOBS.map(() => '---').join('|') + '|\n';
  for (const st of STATS) { if (st[4] && mode === 'off') continue; md += '| ' + st[0] + (st[1] ? ' (' + st[1] + ')' : '') + ' | ' + JOBS.map(j => { const h = B[mode][j + '|' + st[0]]; return h >= HMAX ? '+200% 이상' : (h >= 0 ? '+' : '') + r0(h * 100) + '%'; }).join(' | ') + ' |\n'; }
  md += '\n**1포인트 환산 (그 직업 대표 영웅 레벨 ' + LV + ' 기준)**\n\n| | ' + JOBS.map(j => JN[j]).join(' | ') + ' |\n|---|' + JOBS.map(() => '---').join('|') + '|\n';
  for (const st of STATS.filter(s => s[3])) { md += '| ' + st[5] + ' = 체력 | ' + JOBS.map(j => { const u = unit1(JOB[j].rep.id, LV), h = B[mode][j + '|' + st[0]]; if (h >= HMAX) return '매우 큼'; return r1(h * u.maxHp / st[3](u)); }).join(' | ') + ' |\n'; }
  md += '\n'; }

// ── C. 업그레이드 한 번
md += '## C. 업그레이드 한 번의 가치 (능력치 노드)\n\n- 한 단계 올렸을 때 그 능력치가 몇 % 오르는지, 공식 전투력(√(평타 DPS × 실질 체력))이 몇 % 오르는지, 그게 레벨 ' + LV + '→' + (LV + 1) + ' 한 번의 몇 %인지, 훈장 1개당 전투력 %.\n\n| 노드 | 대상 | 한 단계 | 전투력 ↑ | 레벨업 1번 대비 | 훈장(1단계) | 훈장 1개당 |\n|---|---|---|---|---|---|---|\n';
const lvStep = pw(JOB.warrior, 1 + G * LV) / pw(JOB.warrior, 1 + G * (LV - 1)) - 1;
const SN = { hp: '체력', atk: '공격력', def: '방어', crit: '치명' };
for (const L of D.meta.lines) for (const N of L.nodes) { if (!N.hero) continue; const tgt = L.job === 'all' || !L.job ? '팀 전체' : (JN[L.job] || L.job), a = JOB[L.job] || JOB.warrior, g = 1 + G * (LV - 1);
  const b = { hp: a.hp, atk: a.atk, def: a.def, iv: a.iv, crit: a.crit }; if (N.hero === 'crit') b.crit += N.add; else b[N.hero] *= 1 + N.add;
  const up = pw(b, g) / pw(a, g) - 1, c = N.cost[0];
  md += `| ${N.name} | ${tgt} | ${SN[N.hero] || N.hero} +${N.hero === 'crit' ? r1(N.add * 100) + '%p' : r1(N.add * 100) + '%'} | +${r2(up * 100)}% | ${r0(up / lvStep * 100)}% | ${c} | ${r2(up * 100 / c)}% |\n`; }
md += '\n레벨업 1번(레벨 ' + LV + '→' + (LV + 1) + ') = 전투력 +' + r1(lvStep * 100) + '%. 공식 전투력이라 사거리·공속이 궁극기에 주는 효과는 빠져요(B 표 참고).\n';
{ const REC = require('./기록.js'), v = {}; JOBS.forEach(j => { const a = JOB[j]; v['A ' + JN[j]] = { 체력: r0(a.hp), 공격력: r0(a.atk), 방어: r0(a.def), 공격간격: r2(a.iv), 평타DPS: r1(dps(a, 1)), 실질체력: r0(ehp(a, 1)) }; });
  for (const mode in B) for (const k in B[mode]) { const [j, st] = k.split('|'); (v['B ' + (mode === 'off' ? '스킬끔 ' : '스킬켬 ') + JN[j]] = v['B ' + (mode === 'off' ? '스킬끔 ' : '스킬켬 ') + JN[j]] || {})[st] = r0(B[mode][k] * 100); }
  const s = REC.save('기준표', v, { 레벨: LV, 시드: SEEDS, 탐색: ITER, 빠른확인: QUICK }); md += '\n기록: 밸런스/기록/' + s.file + '\n' + REC.compareMd(s.prev, s.rec); }
fs.writeFileSync('밸런스/기준표.md', md); console.log(md);
