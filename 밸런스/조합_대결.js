// 조합 대 조합(평타만): node 밸런스/조합_대결.js [--stage=1|2|3] → 밸런스/조합_대결.md (2026-11-28)
// 사용자: "다른 직업 간에는 가치를 그렇게 비교하는게 아니라 조합끼리로 비교하자" / "조합대 조합으로 평타 기준으로 비교를 해볼까?"
// 5명 팀, 레벨 1, 1성, 스킬 끔(statsOnly), 직업마다 대표 영웅(직업 평균에 가장 가까운 영웅) 한 종류만 씀. 모든 조합이 서로 한 번씩 붙어요.
process.chdir(require('path').join(__dirname, '..'));
const fs = require('fs'), D = require(process.cwd() + '/data.js'), E = require(process.cwd() + '/engine.js');
const STAGE = +((process.argv.find(a => /^--stage=\d$/.test(a)) || '--stage=1').split('=')[1]);
const SEEDS = { 1: 10, 2: 100, 3: 200 }[STAGE]; if (!SEEDS) throw new Error('--stage는 1, 2, 3 중 하나');
const JOBS = ['guardian', 'warrior', 'archer', 'mage', 'bard', 'assassin'];
const JN = { guardian: '수호', warrior: '전사', archer: '궁수', mage: '마법', bard: '음유', assassin: '암살' };
const avg = a => a.reduce((x, y) => x + y, 0) / a.length, r0 = x => Math.round(x), r2 = x => Math.round(x * 100) / 100;
const unit1 = id => E.createBattle(D, [{ id, slot: 0, level: 1, star: 1 }], [{ id, slot: 0, level: 1 }], { seed: 1 }).A[0];
const REP = {}; // 기준표.js와 같은 방법으로 고른 대표 영웅
for (const j of JOBS) { const L = D.heroes.filter(h => !h.mob && h.job === j).map(h => ({ h, u: unit1(h.id) })), a = { hp: avg(L.map(x => x.u.maxHp)), atk: avg(L.map(x => x.u.atk)), iv: avg(L.map(x => x.u.interval)) };
  REP[j] = L.map(x => ({ h: x.h, d: Math.abs(Math.log(x.u.maxHp / a.hp)) + Math.abs(Math.log(x.u.atk / a.atk)) + Math.abs(Math.log(x.u.interval / a.iv)) })).sort((p, q) => p.d - q.d)[0].h; }
// 자리: 게임의 적 배치 규칙과 같게, 사거리 long·far는 뒷줄(6·7·8)부터, 나머지는 앞줄(0·1·2)부터 채움
function place(jobs) { const used = []; return jobs.map(j => { const h = REP[j], back = h.range === 'long' || h.range === 'far', s = (back ? [6, 7, 8, 3, 4, 5, 0, 1, 2] : [0, 1, 2, 3, 4, 5, 6, 7, 8]).find(q => !used.includes(q)); used.push(s); return { id: h.id, slot: s, level: 1, star: 1 }; }); }
const rep = (j, n) => Array(n).fill(j), TEAMS = [];
JOBS.forEach(j => TEAMS.push([JN[j] + ' 5', rep(j, 5)]));
JOBS.filter(j => j !== 'guardian').forEach(j => TEAMS.push(['수호 1 + ' + JN[j] + ' 4', ['guardian'].concat(rep(j, 4))]));
JOBS.filter(j => j !== 'guardian').forEach(j => TEAMS.push(['수호 2 + ' + JN[j] + ' 3', rep('guardian', 2).concat(rep(j, 3))]));
TEAMS.push(['직업 하나씩(암살 빼고)', ['guardian', 'warrior', 'archer', 'mage', 'bard']]);
if (new Set(TEAMS.map(t => t[0])).size !== TEAMS.length) throw new Error('조합 이름이 겹침');
// X가 Y를 상대로: 승률(시간 초과는 0.5), 남은 체력 차(X − Y, 각자 시작 체력 합으로 나눈 비율)
function duel(tX, tY) { let w = 0, d = 0, n = 0; for (let s = 1; s <= SEEDS; s++) for (const sw of [0, 1]) {
  const cp = t => t.map(x => ({ ...x })), b = sw ? E.createBattle(D, cp(tY), cp(tX), { seed: s * 7 + 3, statsOnly: true }) : E.createBattle(D, cp(tX), cp(tY), { seed: s * 7 + 3, statsOnly: true });
  const X = sw ? b.E : b.A, Y = sw ? b.A : b.E, left = S => S.reduce((a, u) => a + Math.max(0, u.alive ? u.hp : 0), 0) / S.reduce((a, u) => a + u.maxHp, 0);
  while (!b.result && b.time < 90) b.step(); const lx = left(X), ly = left(Y); w += lx > 0 && ly <= 0 ? 1 : ly > 0 && lx <= 0 ? 0 : 0.5; d += lx - ly; n++; } return { w: w / n, d: d / n }; }
const N = TEAMS.length, M = TEAMS.map(() => Array(N).fill(null)), t0 = Date.now();
for (let i = 0; i < N; i++) for (let k = i + 1; k < N; k++) { const r = duel(place(TEAMS[i][1]), place(TEAMS[k][1])); M[i][k] = r; M[k][i] = { w: 1 - r.w, d: -r.d }; process.stderr.write('.'); }
const self = duel(place(TEAMS[N - 1][1]), place(TEAMS[N - 1][1])); // 검산: 같은 팀끼리는 승률 0.5·체력 차 0이어야 함
if (Math.abs(self.w - 0.5) > 1e-9 || Math.abs(self.d) > 1e-9) throw new Error('검산 실패: 같은 팀끼리 ' + JSON.stringify(self));
const rows = TEAMS.map((t, i) => ({ i, name: t[0], w: avg(M[i].filter(Boolean).map(x => x.w)), d: avg(M[i].filter(Boolean).map(x => x.d)) })).sort((a, b) => b.w - a.w || b.d - a.d);
const pc = x => r0(x * 100) + '%', sg = x => (x >= 0 ? '+' : '') + r0(x * 100) + '%';
let md = '# 조합 대 조합 (평타만, 2026-11-28)\n\n5명 팀끼리 스킬 없이(궁극기·패시브 끔, 직업 효과는 남김) 싸운 결과예요. 레벨 1, 1성, 직업마다 대표 영웅 한 종류만 썼어요. 게임 숫자는 지금 data.js 그대로예요.\n\n';
md += '- 측정 단계: **' + STAGE + '단계** (시드 ' + SEEDS + '개 × 양쪽 = 한 판 붙을 때 ' + SEEDS * 2 + '판). 조합 ' + N + '개가 서로 한 번씩.\n';
md += '- 대표 영웅: ' + JOBS.map(j => JN[j] + ' = ' + REP[j].name).join(', ') + '\n- 자리: 사거리 긴 영웅은 뒷줄부터, 나머지는 앞줄부터 채움(적 배치 규칙과 같음).\n- 승률 = 다른 조합 전부를 상대로 한 평균. 체력 차 = 끝났을 때 남은 체력 비율(우리 − 상대) 평균. 90초 안에 안 끝나면 비김.\n\n';
md += '## 순위\n\n| 순위 | 조합 | 평균 승률 | 평균 체력 차 |\n|---|---|---|---|\n' + rows.map((r, n) => `| ${n + 1} | ${r.name} | ${pc(r.w)} | ${sg(r.d)} |`).join('\n') + '\n';
md += '\n## 서로 붙은 결과 (가로줄 조합이 세로줄 조합을 이긴 비율)\n\n번호는 위 순위예요.\n\n| | ' + rows.map((r, n) => n + 1).join(' | ') + ' |\n|---|' + rows.map(() => '---').join('|') + '|\n';
rows.forEach((r, n) => { md += `| ${n + 1} ${r.name} | ` + rows.map(c => c.i === r.i ? '·' : pc(M[r.i][c.i].w)).join(' | ') + ' |\n'; });
{ const REC = require('./기록.js'), v = {}; rows.forEach(r => { v[r.name] = { 승률: r2(r.w), 체력차: r2(r.d) }; }); const s = REC.save('조합_대결', v, { stage: STAGE, seeds: SEEDS, level: 1 }); md += REC.compareMd(s.prev, s.rec); md += '\n기록: `밸런스/기록/' + s.file + '`\n'; }
fs.writeFileSync('밸런스/조합_대결.md', md); console.error('\n' + r0((Date.now() - t0) / 1000) + '초'); console.log(md);
