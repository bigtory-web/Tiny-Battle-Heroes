// 이펙트를 한 장에 늘어놓아 보는 임시 장치. 프로젝트 폴더에서:
//   node .claude/skills/game-ui-fx/preview.js on    (확인)
//   node .claude/skills/game-ui-fx/preview.js off   (끝나면 꼭)
// on이면 index.html에 window.__rx를 넣고 _sheet_tmp.js(window.__sheet)를 만든다. off면 둘 다 지운다.
const fs = require('fs'), vm = require('vm');
const mode = process.argv[2];
if (mode !== 'on' && mode !== 'off') { console.log('on 또는 off'); process.exit(1); }
const HOOK = "  window.__rx = function(c2, n, o, k){ var main = ctx; ctx = c2; if (PXK.test(n)){ o.k = n; pxLayer(); pxCx.setTransform(1,0,0,1,0,0); pxCx.clearRect(0,0,pxCv.width,pxCv.height); fxPixel(o, k); pxFlush(); } else { ctx.save(); UXF[n](o, k); ctx.restore(); } ctx = main; };\n";
const AT = '  function uxRgb(c){';
let s = fs.readFileSync('index.html', 'utf8');
const a = s.indexOf('  window.__rx = function');
if (a >= 0) s = s.slice(0, a) + s.slice(s.indexOf('\n', a) + 1);
if (mode === 'on') {
  for (const need of [AT, 'function fxPixel(', 'function pxFlush(', 'var PXK ']) if (!s.includes(need)) throw new Error('index.html이 바뀌었어요: ' + need);
  s = s.replace(AT, HOOK + AT);
  fs.writeFileSync('_sheet_tmp.js', `// window.__sheet([[이름표, UXF이름, 옵션], ...], { ks: [.2, .45, .72], hero: 'monk' })
window.__sheet = async function(list, opt){
  opt = opt || {}; const ks = opt.ks || [.2, .45, .72], im = new Image(); im.src = 'img/p/' + (opt.hero || 'monk') + '.png'; await im.decode();
  const cols = Math.min(7, list.length), CW = 170, CH = 140, rows = Math.ceil(list.length / cols), o = document.createElement('canvas'); o.id = 'sheet'; o.width = cols * CW; o.height = rows * (CH * ks.length + 26);
  o.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;background:#4a4458;image-rendering:pixelated;width:' + o.width + 'px;height:' + o.height + 'px'; const c = o.getContext('2d'); c.imageSmoothingEnabled = false;
  list.forEach((e, i) => { const X = (i % cols) * CW, Y = Math.floor(i / cols) * (CH * ks.length + 26);
    ks.forEach((k, j) => { const t = document.createElement('canvas'); t.width = 720; t.height = 400; const g = t.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(im, 328, 238, 64, 64); window.__rx(g, e[1], Object.assign({ x: 360, y: 300, dir: 1 }, e[2]), k); c.drawImage(t, 275, 180, 170, CH, X, Y + 26 + j * CH, 170, CH); });
    c.fillStyle = '#fff'; c.font = '15px sans-serif'; c.textAlign = 'center'; c.fillText(e[0], X + CW / 2, Y + 18); c.strokeStyle = '#221d2a'; c.strokeRect(X, Y, CW, CH * ks.length + 26); });
  document.body.appendChild(o); return o.width + 'x' + o.height;
};
`);
} else if (fs.existsSync('_sheet_tmp.js')) fs.unlinkSync('_sheet_tmp.js');
fs.writeFileSync('index.html', s);
for (const x of s.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(x[1]);
console.log(mode, 'hook:', s.includes('__rx'), 'sheet:', fs.existsSync('_sheet_tmp.js'));
