// 20스테이지 임시 데이터(밸런스/등급확률_20스테이지.md 표)로 봇을 돌려 구간별 출전 팀의 별·등급 구성과 영웅 한 명 평균 힘(1성 일반 = 100)을 지금 배율 vs 제안 배율로 비교. data.js 안 바꿈. node 밸런스/구간_별등급.js [판 수] (2026-11-28)
process.chdir(require('path').join(__dirname, '..'));
const D0 = require(process.cwd() + '/data.js'), E = require(process.cwd() + '/engine.js');
const cl = o => Array.isArray(o) ? o.map(cl) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, cl(v)])) : o; const D = cl(D0);
const HG = [[85,15,0,0],[78,20,2,0],[71,24,5,0],[65,27,8,0],[59,29,11,0],[54,31,15,0],[49,32,16,3],[44,32,20,4],[39,32,24,5],[34,32,27,6],[29,32,30,8],[24,32,34,10],[20,31,37,12],[20,29,36,15],[20,28,35,17],[20,26,34,20],[20,25,33,22],[20,23,32,25],[20,22,31,27],[20,20,30,30]];
D.campaign.perChapter = 20; D.campaign.bossAt = [10, 20]; D.player.heroGrade = HG; D.campaign.gradeLv = HG.map((_, i) => i + 1);
D.campaign.enemyLv = D0.campaign.enemyLv.slice(0, 20).map(x => x); // 예전 3챕터용 30칸의 앞 20칸(임시)
const N = +process.argv[2] || 200, seg = s => s <= 6 ? '초반' : s <= 13 ? '중반' : '후반', A = {};
let reach = [];
for (let sd = 1; sd <= N; sd++) { const r = E.campaign(D, { seed: sd }); reach.push(r.cleared);
  const last = {}; r.log.forEach(x => { if (x.comp) last[x.stage] = x.comp; }); // 스테이지마다 마지막 도전 팀
  for (const st in last) { const g = seg(+st + 1); A[g] = A[g] || { n: 0, star: { 1: 0, 2: 0, 3: 0 }, grade: { 1: 0, 2: 0, 3: 0, 4: 0 }, comp: [] }; const c = last[st]; A[g].n++; c.forEach(([s, gr]) => { A[g].star[s]++; A[g].grade[gr]++; A[g].comp.push([s, gr]); }); } }
const CUR = { s: [1, 1.8, 3.2], g: [1, 1.03, 1.12, 1.13] }, NEW = { s: [1, 1.4, 2.0], g: [1, 1.1, 1.2, 1.3] };
const idx = (L, P) => Math.round(L.reduce((a, [s, g]) => a + P.s[s - 1] * P.g[g - 1], 0) / L.length * 100);
console.log('봇', N, '판, 도달 평균', (reach.reduce((a, b) => a + b, 0) / N).toFixed(1), '/ 20, 20 깬 판', reach.filter(x => x >= 20).length);
for (const g of ['초반', '중반', '후반']) { const a = A[g]; if (!a) continue; const tot = a.comp.length;
  console.log(g, '| 팀 수', a.n, '| 별 1·2·3성', [1, 2, 3].map(s => Math.round(100 * a.star[s] / tot) + '%').join(' '), '| 등급 일반·고급·희귀·전설', [1, 2, 3, 4].map(x => Math.round(100 * a.grade[x] / tot) + '%').join(' '), '| 영웅 한 명 평균 힘: 지금', idx(a.comp, CUR), '· 제안', idx(a.comp, NEW)); }
