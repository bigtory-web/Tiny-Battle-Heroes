// 밸런스 대시보드(아티팩트)에 올릴 CSV 만들기: node 밸런스/대시보드_데이터.js → 밸런스/대시보드/*.csv (2026-11-27)
// 사용자: "아티팩트 이 안에서 보고 싶다는 거지", "시각적인 걸로"
process.chdir(require('path').join(__dirname, '..'));
const fs = require('fs'), path = require('path'), D = require(process.cwd() + '/data.js'), E = require(process.cwd() + '/engine.js');
const OUT = '밸런스/대시보드'; fs.mkdirSync(OUT, { recursive: true });
const JN = { guardian: '수호자', warrior: '전사', archer: '궁수', mage: '마법사', bard: '음유시인', assassin: '암살자' };
const RG = { melee: '근거리', mid: '중거리', long: '장거리', far: '최장거리' };
const csv = (rows, cols) => [cols.join(',')].concat(rows.map(r => cols.map(c => { const v = r[c]; return typeof v === 'string' && /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','))).join('\n') + '\n';
const K = D.battle.defK, CM = (D.crit && D.crit.mul) || 2;

// 1) 영웅 1레벨: 능력치 + 실측 DPS(혼자 30초 허수아비, 방어 0·속성 없음, 5판)
const heroes = [];
for (const h of D.heroes) { if (h.mob || !JN[h.job]) continue; let dealt = 0; const N = 5, T = 30;
  for (let s = 1; s <= N; s++) { const b = E.createBattle(D, [{ id: h.id, slot: 0, level: 1, star: 1 }], [{ id: 'knight', slot: 0, level: 1, mul: { hp: 1e4, atk: 0 } }], { seed: s }); b.E[0].def = 0; b.E[0].el = 'none'; b.E[0].el2 = null; while (!b.result && b.time < T) b.step(); dealt += b.A[0].stats.dealt; }
  const u = E.createBattle(D, [{ id: h.id, slot: 0, level: 1, star: 1 }], [{ id: 'knight', slot: 0, level: 1 }], { seed: 1 }).A[0];
  heroes.push({ hero: h.name, grade: h.grade || 1, job: JN[h.job], range: RG[h.range] || h.range, hp: Math.round(u.maxHp), atk: Math.round(u.atk), def: Math.round(u.def), interval: +u.interval.toFixed(2), crit: Math.round(u.crit * 100),
    base_dps: Math.round(u.atk / u.interval * (1 + u.crit * (CM - 1))), dps: Math.round(dealt / N / T), ehp: Math.round(u.maxHp * (1 + u.def / K)) }); }
fs.writeFileSync(path.join(OUT, 'heroes.csv'), csv(heroes, ['hero', 'grade', 'job', 'range', 'hp', 'atk', 'def', 'interval', 'crit', 'base_dps', 'dps', 'ehp']));

// 2) 힘 곡선: 챕터 3 × 난이도 3, 업그레이드 안 찍음, 봇 20판(첫 판)
const DN = { easy: 'EASY', normal: 'NORMAL', hard: 'HARD' }, curve = [];
for (let ch = 1; ch <= 3; ch++) for (const df of ['easy', 'normal', 'hard']) { const d = E.difficultyData(E.chapterData(D, ch), df);
  E.powerCurve(d, { runs: 20, meta: { mode: 'meta', nodes: {} } }).forEach(r => curve.push({ chapter: ch, difficulty: DN[df], stage: r.name, step: r.stage + 1, boss: r.boss ? 1 : 0, clear_rate: Math.round(r.clearRate * 100), first_win: Math.round(r.firstWin * 100), tries: Math.round(r.tries * 10) / 10, my_power: r.myPow, foe_power: r.foePow, ratio: r.ratio, hp_left: r.hpLeft, player_level: r.plv })); }
fs.writeFileSync(path.join(OUT, 'curve.csv'), csv(curve, ['chapter', 'difficulty', 'stage', 'step', 'boss', 'clear_rate', 'first_win', 'tries', 'my_power', 'foe_power', 'ratio', 'hp_left', 'player_level']));

// 3) 능력치 가치(기준표 B): 최신 기록 JSON, 없으면 기준표.md 표를 읽음
const sv = []; const recs = fs.existsSync('밸런스/기록') ? fs.readdirSync('밸런스/기록').filter(f => f.startsWith('기준표_')).sort() : [];
if (recs.length) { const v = JSON.parse(fs.readFileSync('밸런스/기록/' + recs.pop(), 'utf8')).values; for (const row in v) { const m = row.match(/^B (스킬끔|스킬켬) (.+)$/); if (!m) continue; for (const st in v[row]) sv.push({ mode: m[1] === '스킬끔' ? '스킬 끔' : '스킬 켬', job: m[2], stat: st, hp_equiv: v[row][st] }); } }
else { const md = fs.readFileSync('밸런스/기준표.md', 'utf8'); let mode = null, jobs = null;
  for (const line of md.split('\n')) { if (/^### 스킬 끔/.test(line)) mode = '스킬 끔'; else if (/^### 스킬 켬/.test(line)) mode = '스킬 켬'; else if (/^## C/.test(line) || line.startsWith('**1포인트')) mode = null;
    if (!mode || !line.startsWith('|')) continue; const c = line.split('|').slice(1, -1).map(s => s.trim()); if (c[0] === '능력치') { jobs = c.slice(1); continue; } if (!jobs || /^-+$/.test(c[0]) || !/[+-]\d|이상/.test(c[1] || '')) continue;
    c.slice(1).forEach((x, i) => { const n = /이상/.test(x) ? 200 : parseInt(x.replace('%', ''), 10); if (!isNaN(n)) sv.push({ mode, job: jobs[i], stat: c[0].replace(/ \(.*\)$/, ''), hp_equiv: n }); }); } }
fs.writeFileSync(path.join(OUT, 'stat_value.csv'), csv(sv, ['mode', 'job', 'stat', 'hp_equiv']));
console.log('heroes', heroes.length, 'curve', curve.length, 'stat_value', sv.length);
