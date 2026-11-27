// 큰 아이콘(얼굴만)에 새 영웅 그림이 어떻게 잘리는지 본다. 브라우저(localhost:8766)에서:
//   await new Promise(ok => { const s = document.createElement('script'); s.src = '.claude/skills/game-ui-screen-work/face.js'; s.onload = ok; document.body.appendChild(s); });
//   await window.__face('flame')
// 왼쪽이 그림 전체, 오른쪽이 아이콘에 나오는 부분. 계산은 index.html의 faceAt와 같아야 한다(FZ 2.05).
window.__face = async function (id) {
  const FZ = 2.05, im = new Image(); im.src = 'img/p/' + id + '.png?' + Date.now(); await im.decode();
  const w = im.width, h = im.height, c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
  const d = x.getImageData(0, 0, w, h).data, on = (px, py) => d[(py * w + px) * 4 + 3] > 40;
  let x0 = w, x1 = 0; for (let y = Math.floor(h * .6); y < h; y++) for (let px = 0; px < w; px++) if (on(px, y)) { x0 = Math.min(x0, px); x1 = Math.max(x1, px); }
  const cx = x1 > x0 ? (x0 + x1) / 2 : w / 2;
  let top = -1; for (let y = 0; y < h && top < 0; y++) { let n = 0; for (let px = Math.round(cx - w * .18); px <= cx + w * .18; px++) if (px >= 0 && px < w && on(px, y)) n++; if (n >= 4) top = y; } if (top < 0) top = 0;
  let sx = 0, k = 0; for (let y = top; y < Math.min(h, top + h * .28); y++) for (let px = Math.round(cx - w * .24); px <= cx + w * .24; px++) if (px >= 0 && px < w && on(px, y)) { sx += px + .5; k++; }
  const hx = k ? sx / k : w / 2, S = w / FZ;
  const o = document.getElementById('face') || document.createElement('canvas'); o.id = 'face'; o.width = 600; o.height = 300; o.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;width:600px;height:300px;background:#555';
  const g = o.getContext('2d'); g.clearRect(0, 0, 600, 300); g.imageSmoothingEnabled = false; g.drawImage(im, 0, 0, w, h, 0, 0, 300, 300); g.drawImage(im, hx - S / 2, top - .03 * S, S, S, 300, 0, 300, 300); document.body.appendChild(o);
  return { 머리꼭대기: top, 보이는_세로: [Math.round(top - .03 * S), Math.round(top + .97 * S)] };
};
