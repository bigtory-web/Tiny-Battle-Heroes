// 밸런스 결과 기록(2026-11-27, 사용자: "이런 데이터들이 남아 있어야 비교가 될 텐데 너무 휘발성인 거 같아")
// save(이름, 값들, 설정) → 밸런스/기록/<이름>_<날짜_시각>_<커밋>.json 에 남기고, 같은 이름의 바로 전 기록을 돌려줘요.
// compareMd(전, 지금, 열 이름) → "지난번과 비교" 표(md). 값들은 { 줄 이름: { 열: 숫자 } } 꼴.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const DIR = path.join(__dirname, '기록');
function stamp() { const d = new Date(Date.now() + 9 * 3600e3).toISOString(); return d.slice(0, 10) + '_' + d.slice(11, 16).replace(':', ''); }
function commit() { try { return cp.execSync('git rev-parse --short HEAD', { cwd: path.join(__dirname, '..'), encoding: 'utf8' }).trim() + (cp.execSync('git status --porcelain data.js engine.js', { cwd: path.join(__dirname, '..'), encoding: 'utf8' }).trim() ? '+고침' : ''); } catch (e) { return '?'; } }
function list(name) { if (!fs.existsSync(DIR)) return []; return fs.readdirSync(DIR).filter(f => f.startsWith(name + '_') && f.endsWith('.json')).sort(); }
function save(name, values, settings) {
  fs.mkdirSync(DIR, { recursive: true }); const prevF = list(name).pop(), prev = prevF ? JSON.parse(fs.readFileSync(path.join(DIR, prevF), 'utf8')) : null;
  const rec = { name, at: stamp(), commit: commit(), settings: settings || {}, values };
  if (prev && JSON.stringify(prev.values) === JSON.stringify(values) && JSON.stringify(prev.settings) === JSON.stringify(rec.settings)) return { prev, rec, file: prevF + ' (지난번과 같아서 새로 안 남김)' };
  const f = name + '_' + rec.at + '_' + rec.commit.replace('+', '-') + '.json';
  fs.writeFileSync(path.join(DIR, f), JSON.stringify(rec, null, 1)); return { prev, rec, file: f }; }
function compareMd(prev, rec, cols) {
  if (!prev) return '\n## 지난번과 비교\n\n첫 기록이에요. 다음에 돌리면 여기에 바뀐 값이 나와요.\n';
  let md = '\n## 지난번과 비교\n\n지난 기록 ' + prev.at + ' (' + prev.commit + ') → 이번 ' + rec.at + ' (' + rec.commit + '). 바뀐 칸만 보여요.\n\n| 줄 | 값 | 전 | 지금 | 차이 |\n|---|---|---|---|---|\n', n = 0;
  for (const row in rec.values) for (const c of cols || Object.keys(rec.values[row])) { const a = prev.values[row] && prev.values[row][c], b = rec.values[row][c]; if (typeof a !== 'number' || typeof b !== 'number' || Math.abs(a - b) < 1e-9) continue; n++;
    md += '| ' + row + ' | ' + c + ' | ' + Math.round(a * 100) / 100 + ' | ' + Math.round(b * 100) / 100 + ' | ' + (b > a ? '+' : '') + Math.round((b - a) * 100) / 100 + (a ? ' (' + (b > a ? '+' : '') + Math.round((b / a - 1) * 100) + '%)' : '') + ' |\n'; }
  return n ? md : md.split('| 줄 |')[0] + '바뀐 값이 없어요.\n'; }
module.exports = { save, compareMd, list, DIR };
