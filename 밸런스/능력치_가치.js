// 능력치 가치: node 밸런스/능력치_가치.js → 밸런스/능력치_가치.md (2026-11-27)
// 같은 팀끼리 싸우게 하고(거울 전), 한쪽 팀 전원에게 능력치 하나만 +10% 주었을 때 이기는 비율이 얼마나 오르나를 잰다.
// 50%에서 많이 오를수록 그 능력치 10%가 값지다. 팀은 기본 영웅 풀에서 5명씩 무작위, 레벨 5, 1성.
process.chdir(require('path').join(__dirname, '..'));
const D = require(process.cwd() + '/data.js'), E = require(process.cwd() + '/engine.js');
const RC = [52, 100, 150, 210, 262, 314, 366];
const STATS = {
  '체력 +10%': u => { u.maxHp *= 1.1; u.hp *= 1.1; },
  '공격력 +10%': u => { u.atk *= 1.1; },
  '방어 +10%': u => { u.def *= 1.1; },
  '공격 속도 +10%': u => { u.interval /= 1.1; },
  '치명타 확률 +10%': u => { u.crit *= 1.1; },
  '이동 속도 +10%': u => { u.spd *= 1.1; },
  '궁극기 충전 +10%': u => { u.enMul = (u.enMul || 1) * 1.1; },
  '사거리 +1칸': u => { let ci = 0; RC.forEach((r, i) => { if (Math.abs(r - u.reach) < Math.abs(RC[ci] - u.reach)) ci = i; }); u.reach = RC[Math.min(RC.length - 1, ci + 1)]; },
};
function rng(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
const pool = D.recruit.pool, N = 300, lv = 5;
const teams = []; for (let i = 0; i < N; i++) { const r = rng(i + 7), L = pool.slice(), t = []; for (let k = 0; k < 5; k++) t.push({ id: L.splice(Math.floor(r() * L.length), 1)[0], slot: [0, 1, 2, 3, 6][k], level: lv, star: 1 }); teams.push(t); }
function win(f) { let w = 0, n = 0; teams.forEach((t, i) => { for (const sideBuff of ['A', 'E']) { const b = E.createBattle(D, t.map(x => ({ ...x })), t.map(x => ({ ...x })), { seed: i * 2 + 1 }); if (f) (sideBuff === 'A' ? b.A : b.E).forEach(f); while (!b.result && b.time < 120) b.step(); if (b.result) { n++; if ((b.result === 'win') === (sideBuff === 'A')) w++; } } }); return w / n; }
const base = win(null);
let md = '# 능력치 가치 (거울 전)\n\n- 같은 팀끼리 싸우고, 한쪽 팀 전원에게 능력치 하나만 올려 준 뒤 이긴 비율. 팀 ' + N + '개 × 양쪽 번갈아(' + N * 2 + '판), 기본 영웅 풀에서 5명 무작위, 레벨 ' + lv + ', 1성, 유물·시너지 없음.\n- 아무것도 안 올렸을 때 이긴 비율: ' + Math.round(base * 1000) / 10 + '% (같은 팀이라 50% 근처가 정상)\n\n| 올린 능력치 | 이긴 비율 | 50%보다 |\n|---|---|---|\n';
const res = Object.entries(STATS).map(([k, f]) => [k, win(f)]).sort((a, b) => b[1] - a[1]);
res.forEach(([k, w]) => { md += '| ' + k + ' | ' + Math.round(w * 1000) / 10 + '% | ' + (w >= 0.5 ? '+' : '') + Math.round((w - 0.5) * 1000) / 10 + '%p |\n'; });
md += '\n## 공식으로 본 관계\n\n- 받는 피해 = 1 − 방어 ÷ (방어 + ' + D.battle.defK + '). 버티는 힘(실질 체력) = 체력 ÷ (1 − 감소율) = 체력 × (1 + 방어 ÷ ' + D.battle.defK + ').\n- 그래서 방어 ' + D.battle.defK + '이 늘 때마다 실질 체력이 처음 체력만큼(×1) 늘어요. 방어가 낮은 영웅일수록 방어 10%의 가치가 작아요.\n- 평타 DPS = 공격력 ÷ 공격 간격 × (1 + 치명 확률 × (치명 배율 − 1)). 공격력 +10%와 공격 속도 +10%는 평타에서는 같은 값이고, 궁극기 피해는 공격력만 키워요.\n';
{ const REC = require('./기록.js'), v = {}; res.forEach(([k, w]) => v[k] = { 이긴비율: w }); const s = REC.save('능력치_가치', v, { 팀: N, 레벨: lv }); md += '\n기록: 밸런스/기록/' + s.file + '\n' + REC.compareMd(s.prev, s.rec); }
require('fs').writeFileSync('밸런스/능력치_가치.md', md); console.log(md);
