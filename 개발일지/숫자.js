// 개발일지 하루 숫자: node 개발일지/숫자.js 2026-11-23 → 개발일지/2026-11-23/숫자.md
// 토큰은 Claude Code 대화 기록(.jsonl)의 usage를 한국 시간 날짜로 합친 값이다. 이미지 세션이 부르는 Codex 사용량은 빠져 있다.
const fs = require('fs'), path = require('path'), os = require('os');
const day = process.argv[2] || new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const root = path.join(__dirname, '..');
const logDir = path.join(os.homedir(), '.claude', 'projects', 'C--Users-Home-Downloads----RPG------');
const kst = t => new Date(new Date(t).getTime() + 9 * 3600e3).toISOString().slice(0, 10);
const inDay = f => kst(fs.statSync(f).mtimeMs) === day;

// 세션별 토큰
const rows = [];
for (const f of fs.readdirSync(logDir).filter(x => x.endsWith('.jsonl'))) {
  let name = f.slice(0, 8), s = { n: 0, out: 0, inp: 0, cache: 0 };
  for (const l of fs.readFileSync(path.join(logDir, f), 'utf8').split('\n')) {
    if (!l) continue; let j; try { j = JSON.parse(l); } catch (e) { continue; }
    if (j.customTitle) name = j.customTitle;
    const u = j.message && j.message.usage; if (!u || !j.timestamp || kst(j.timestamp) !== day) continue;
    s.n++; s.out += u.output_tokens || 0; s.inp += (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0); s.cache += u.cache_read_input_tokens || 0;
  }
  if (s.n) rows.push([name, s]);
}
const k = n => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.round(n / 1e3) + 'k';

// 만든 것: 그날 저장된 백업·그림·게시 버전(index 백업 번호)
const bdir = path.join(root, '백업'); /* 2026-11-27 백업 파일은 루트에서 백업/ 폴더로 옮김 */
const backups = [root, bdir].filter(d => fs.existsSync(d)).flatMap(d => fs.readdirSync(d).filter(x => /\.v\d+[a-z]?\.\w+$/.test(x) && inDay(path.join(d, x))));
const imgs = [];
(function walk(d) { for (const x of fs.readdirSync(d)) { const p = path.join(d, x); fs.statSync(p).isDirectory() ? walk(p) : /\.png$/.test(x) && inDay(p) && imgs.push(x); } })(path.join(root, 'img'));
// UI는 index 백업을 더 만들지 않아서(v396에서 멈춤) 그날 index.html을 바꾼 git 커밋 수로 센다
const iv = require('child_process').execSync(`git log --since=${day}T00:00:00+09:00 --until=${day}T23:59:59+09:00 --format=%h -- index.html`, { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);
const items = ['기획', 'UI', '이미지'].map(s => { const p = path.join(__dirname, day, s + '.md'); if (!fs.existsSync(p)) return [s, 0, 0]; let t = fs.readFileSync(p, 'utf8'); const ri = t.indexOf('## 시간순 기록(원본)'); if (ri >= 0) t = t.slice(ri + 1); /* 2026-11-27: 맨 위 주제별 정리가 있으면 원본 아래만 센다(정리 절이 두 번 세지지 않게, UI 지적) */ return [s, (t.match(/^## /gm) || []).length, (t.match(/^## .*⭐/gm) || []).length]; });

const md = `# ${day} 숫자

## 만든 것
| 항목 | 수 |
|---|---|
| 화면 고친 횟수 (index.html 커밋) | ${iv.length}번 |
| 백업 파일 | ${backups.length}개 |
| 새로 저장된 그림 | ${imgs.length}장 |
${items.map(([s, n, st]) => `| 기록 항목 (${s}) | ${n}개 (⭐ ${st}) |`).join('\n')}

## 토큰 (Claude Code 대화 기록 기준, 대략)
| 세션 | 응답 수 | 출력 | 새 입력 | 캐시 읽기 |
|---|---|---|---|---|
${rows.map(([n, s]) => `| ${n} | ${s.n} | ${k(s.out)} | ${k(s.inp)} | ${k(s.cache)} |`).join('\n')}
| 합계 | ${rows.reduce((a, [, s]) => a + s.n, 0)} | ${k(rows.reduce((a, [, s]) => a + s.out, 0))} | ${k(rows.reduce((a, [, s]) => a + s.inp, 0))} | ${k(rows.reduce((a, [, s]) => a + s.cache, 0))} |

- 출력은 Claude가 쓴 양, 새 입력은 새로 읽은 양, 캐시 읽기는 이미 읽은 대화를 다시 본 양이다(값이 싸다).
- 이미지 세션이 부르는 Codex 사용량은 빠져 있다.
`;
fs.mkdirSync(path.join(__dirname, day), { recursive: true });
fs.writeFileSync(path.join(__dirname, day, '숫자.md'), md);
console.log(md);
