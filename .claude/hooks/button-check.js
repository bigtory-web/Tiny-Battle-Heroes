// 버튼 규칙 경고 훅 (2026-11-27, 경고만 — 막지 않음). 화면규칙.md의 두 규칙을 index.html 변경분에서 찾는다.
//  ① 버튼 효과는 공통 줄 하나: 공통 줄 밖에서 button(또는 버튼 클래스)에 :hover/:active/:disabled 효과를 새로 적으면 경고
//  ② 버튼 모서리는 사각: 버튼 줄에 0이 아닌 border-radius를 새로 적으면 경고(도감 필터 칩 data-f는 예외)
// 보는 범위: git HEAD와 지금 index.html의 차이에서 "새로 들어간 줄"만(예전 줄은 안 봄).
// 쓰는 곳: .claude/settings.json PostToolUse(Edit|Write|MultiEdit). 사람이 직접 돌릴 땐: node .claude/hooks/button-check.js --self-test
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const EXCEPT = /\.upn|\.trslot|#shopBuy|\.spRe|data-f|버튼 효과는 이것 하나|열려 있음|\.tdais|단상|#z#z|^\s*button:not\(:disabled\):active\{translate/; // #z#z…·마지막 항목 = 공통 줄 자체 // 화면규칙.md 25줄 예외(강화 칸·초월 단상·빨간 값 버튼·열림 표시)와 도감 필터 칩
const BTN = /(^|[\s,>+~(])button\b|\.btn\b|Btn\b|\bbtn[A-Z-]/;
const FX = /:(hover|active|disabled)\b[^{]*\{[^}]*(filter|transform|translate|background|box-shadow|opacity|brightness)/;
const RADIUS = /border-radius\s*:\s*(?!0(px)?\s*[;!}])[^;}]+/;

function check(lines) {
  const out = [];
  for (const l of lines) {
    if (EXCEPT.test(l) || !BTN.test(l)) continue;
    if (FX.test(l)) out.push('① 공통 버튼 효과 밖에서 버튼 효과를 따로 적음: ' + l.trim().slice(0, 140));
    if (RADIUS.test(l)) out.push('② 버튼에 둥근 모서리(border-radius): ' + l.trim().slice(0, 140));
  }
  return out;
}

if (process.argv.includes('--self-test')) {
  const assert = require('assert');
  assert.strictEqual(check(['#fooBtn:hover{filter:brightness(1.3)}']).length, 1);
  assert.strictEqual(check(['button.x{border-radius:6px}']).length, 1);
  assert.strictEqual(check(['button.x{border-radius:0}']).length, 0);
  assert.strictEqual(check(['.chip[data-f]{border-radius:8px}']).length, 0, '도감 필터 칩 예외');
  assert.strictEqual(check(['.upn:hover{filter:brightness(1.2)}']).length, 0, '강화 칸 예외');
  assert.strictEqual(check(['.card{border-radius:8px}']).length, 0, '버튼 아님');
  console.log('ok · button-check');
  process.exit(0);
}

let input = '';
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const j = JSON.parse(input || '{}'), f = (j.tool_input && j.tool_input.file_path) || (j.tool_response && j.tool_response.filePath) || '';
    if (!/index\.html$/i.test(f) || /백업/.test(f)) return;
    const diff = execFileSync('git', ['diff', '-U0', 'HEAD', '--', 'index.html'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 });
    const added = diff.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).map(l => l.slice(1));
    const w = check(added);
    if (!w.length) return;
    const msg = '[버튼 규칙 경고 · 화면규칙.md] index.html 새 줄에서 ' + w.length + '건:\n- ' + w.slice(0, 6).join('\n- ') + (w.length > 6 ? '\n- …' : '') + '\n예외가 맞으면 그대로 두고, 아니면 공통 버튼 효과·사각 모서리로 맞춰 주세요(경고만, 막지 않음).';
    process.stdout.write(JSON.stringify({ systemMessage: '버튼 규칙 경고 ' + w.length + '건(화면규칙.md)', hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: msg } }));
  } catch (e) { /* 검사 실패는 작업을 막지 않음 */ }
});
