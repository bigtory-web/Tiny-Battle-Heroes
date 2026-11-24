// 전투·화면 이펙트 (이펙트 세션 담당 파일). 전역 FX를 내보내요.
//
//   FX.play(name, x, y, opts)   효과 하나 재생. x, y는 전장 논리 좌표(캔버스 720×400, OFF 80 포함 = UI의 posOf 값)
//   FX.update(dt)               매 프레임 한 번 (초 단위)
//   FX.draw(ctx, layer)         layer: 'back'(유닛 뒤) | 'front'(유닛 앞, 기본)
//   FX.clear()                  전투 시작·끝에 모두 지우기
//   FX.playOn(el, name, opts)   DOM 요소(편성 화면 등) 위에 작은 캔버스를 띄워 재생하고 끝나면 지워요
//   FX.preload()                스프라이트 시트 그림을 미리 불러요 (안 불러도 처음 쓸 때 불러요)
//   FX.names()                  쓸 수 있는 효과 이름 목록
//
// 공통 opts: layer, scale(그림 배율, 기본 FX.scale), speed(재생 배속), color, flip(왼쪽 보기),
//            follow(function → [x, y], 유닛을 따라다니게), until(function → false면 끝)
//
// 그림 효과(스프라이트 시트)는 img/fx/에 있으면 그걸 쓰고, 아직 없거나 못 불러오면 같은 이름의 픽셀 파티클로 대신 그려요.
// 시트 출처: pixelfx (https://github.com/patch-gg/pixelfx, MIT). img/fx/LICENSE_pixelfx.txt 참고
(function (root) {
  'use strict';
  var FX = { scale: 2.2, base: 'img/fx/', list: [] };

  // ───── 스프라이트 시트 목록 (img/fx/<file>.png, 칸 크기·열 수·프레임 수·fps·기준점은 시트 JSON의 meta.pixelfx 값) ─────
  // speed: 우리 전투 템포에 맞춘 기본 배속, scaleK: FX.scale에 곱하는 크기 보정, cut: 앞쪽 몇 %만 재생(0~1)
  var SHEETS = {
    poof: { file: 'fx_poof', w: 112, h: 92, cols: 7, n: 49, fps: 30, loop: false, px: 56, py: 80, speed: 2.2, scaleK: 1, cut: 0.85 },
    coin: { file: 'fx_coin', w: 160, h: 88, cols: 8, n: 91, fps: 30, loop: false, px: 80, py: 78, speed: 4, scaleK: 1, cut: 1 },
    levelup: { file: 'fx_levelup', w: 176, h: 138, cols: 9, n: 97, fps: 30, loop: false, px: 88, py: 114, speed: 4.3, scaleK: 1, cut: 0.85 },
    heal: { file: 'fx_heal', w: 256, h: 136, cols: 7, n: 88, fps: 30, loop: false, px: 128, py: 104, speed: 3.9, scaleK: 0.6, cut: 0.85 },
    shield: { file: 'fx_shield', w: 88, h: 84, cols: 9, n: 72, fps: 30, loop: true, px: 44, py: 68, speed: 3.2, scaleK: 1, cut: 1 },
    frost: { file: 'fx_frost', w: 140, h: 120, cols: 10, n: 97, fps: 30, loop: false, px: 70, py: 106, speed: 4.3, scaleK: 1, cut: 1 },
    chain: { file: 'fx_chain', w: 248, h: 104, cols: 5, n: 55, fps: 30, loop: false, px: 40, py: 82, speed: 2.4, scaleK: 0.6, cut: 0.85 },
    hit: { file: 'fx_hit', w: 128, h: 88, cols: 5, n: 28, fps: 30, loop: false, px: 64, py: 72, speed: 1.25, scaleK: 1, cut: 1 },
    slash: { file: 'fx_slash', w: 136, h: 104, cols: 5, n: 24, fps: 30, loop: false, px: 44, py: 92, speed: 1.05, scaleK: 1, cut: 1 }
  };

  // ───── 공통 도구 ─────
  function R(v) { return Math.round(v); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function px(ctx, x, y, s, c, a) { ctx.globalAlpha = a; ctx.fillStyle = c; ctx.fillRect(R(x - s / 2), R(y - s / 2), s, s); }

  var IMG = {}; // file → Image
  function sheetImg(sh) {
    var im = IMG[sh.file];
    if (!im) { im = IMG[sh.file] = new Image(); im.onerror = function () { im.bad = true; }; im.src = FX.base + sh.file + '.png'; }
    return im.complete && im.naturalWidth && !im.bad ? im : null;
  }
  FX.preload = function () { Object.keys(SHEETS).forEach(function (k) { sheetImg(SHEETS[k]); }); };
  FX.names = function () { var o = {}; Object.keys(SHEETS).concat(Object.keys(RECIPES)).forEach(function (k) { o[k] = 1; }); return Object.keys(o); };

  // ───── 시트 재생 ─────
  function sheetFx(sh, x, y, o) {
    var t = 0, sp = (o.speed || 1) * (sh.speed || 1), n = Math.max(1, Math.floor(sh.n * (sh.cut || 1))), dur = n / sh.fps;
    return {
      update: function (dt) { t += dt * sp; return sh.loop && o.until ? o.until() !== false : t < dur; },
      draw: function (ctx) {
        var im = sheetImg(sh); if (!im) return;
        var f = sh.loop ? Math.floor(t * sh.fps) % sh.n : Math.min(n - 1, Math.floor(t * sh.fps));
        var k = (o.scale || FX.scale) * (sh.scaleK || 1), p = o.follow ? o.follow() : [x, y];
        var sx = (f % sh.cols) * sh.w, sy = Math.floor(f / sh.cols) * sh.h;
        ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
        ctx.translate(R(p[0]), R(p[1])); if (o.flip) ctx.scale(-1, 1);
        ctx.drawImage(im, sx, sy, sh.w, sh.h, R(-sh.px * k), R(-sh.py * k), R(sh.w * k), R(sh.h * k));
        ctx.restore();
      }
    };
  }

  // ───── 픽셀 파티클 (시트가 없을 때, 또는 시트가 필요 없는 작은 효과) ─────
  // 점 하나: { x, y, vx, vy, g(중력), t(남은 시간), max, s(크기 px), c(색), fade }
  function particles(list, extraDraw) {
    return {
      update: function (dt) {
        var alive = false;
        list.forEach(function (d) { if (d.t <= 0) return; d.t -= dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vy += (d.g || 0) * dt; if (d.t > 0) alive = true; });
        return alive;
      },
      draw: function (ctx) {
        ctx.save(); list.forEach(function (d) { if (d.t > 0) px(ctx, d.x, d.y, d.s || 4, d.c, d.fade === false ? 1 : Math.min(1, d.t / (d.max || .5) * 1.5)); });
        if (extraDraw) extraDraw(ctx); ctx.restore();
      }
    };
  }
  // 퍼지는 고리 (피격 섬광·궁극기 고리): 픽셀 사각 고리
  function ringFx(x, y, o) {
    var t = 0, max = o.dur || .15, r0 = o.r0 || 18, r1 = o.r1 || 24, w = o.w || 3, c = o.color || '#fff';
    return {
      update: function (dt) { t += dt; return t < max; },
      draw: function (ctx) {
        var k = t / max, r = R(r0 + (r1 - r0) * k), a = 1 - k;
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = c;
        for (var i = 0; i < 24; i++) { var an = i / 24 * Math.PI * 2; ctx.fillRect(R(x + Math.cos(an) * r - w / 2), R(y + Math.sin(an) * r - w / 2), w, w); }
        ctx.restore();
      }
    };
  }

  var RECIPES = {
    // 평타 피격 섬광 (index.html 'hit' 이벤트의 흰 고리)
    spark: function (x, y, o) { return ringFx(x, y, { dur: .15, r0: 16, r1: 24, w: 3, color: o.color || '#fff' }); },
    // 궁극기 발동 고리 (진영 색)
    ultRing: function (x, y, o) { return ringFx(x, y, { dur: .5, r0: 30, r1: 60, w: 5, color: o.color || '#ffd34d' }); },
    // 팀 스킬 피해 (노란 고리)
    skillHit: function (x, y, o) { return ringFx(x, y, { dur: .3, r0: 24, r1: 44, w: 4, color: o.color || '#ffd34d' }); },
    // 쓰러짐: 회색 먼지가 사방으로
    death: function (x, y) {
      var L = []; for (var i = 0; i < 12; i++) { var a = Math.random() * 6.28; L.push({ x: x + Math.cos(a) * 10, y: y + Math.sin(a) * 10, vx: Math.cos(a) * 80, vy: Math.sin(a) * 80, t: .5, max: .5, s: 4, c: i % 2 ? '#888' : '#aaa' }); }
      return particles(L);
    },
    // 넉백: 밀려난 자리 발밑 흙먼지 + 밀리는 방향 바람줄 (opts.dx = 밀린 거리, +면 오른쪽)
    knock: function (x, y, o) {
      var dx = o.dx || 20, sx0 = x - dx, sg = dx > 0 ? 1 : -1, L = [];
      for (var i = 0; i < 8; i++) L.push({ x: sx0, y: y + 22, vx: -sg * rnd(40, 110), vy: -rnd(10, 40), g: 120, t: .35, max: .35, s: 4, c: i % 2 ? '#b59c7a' : '#d8cdb8' });
      for (var j = 0; j < 5; j++) L.push({ x: sx0 + sg * j * 10, y: y - 20 + (j % 3) * 14, vx: sg * 420, vy: 0, t: .14, max: .14, s: 3, c: '#f3f0e6' });
      return particles(L);
    },
    // 비행 이륙: 발밑 흙먼지 양옆 + 위로 치솟는 바람 줄기 (y = 땅 높이 발밑)
    takeoff: function (x, y) {
      var L = [];
      for (var i = 0; i < 10; i++) { var sd = i % 2 ? 1 : -1; L.push({ x: x + sd * rnd(4, 12), y: y - 2, vx: sd * rnd(60, 150), vy: -rnd(20, 60), g: 160, t: .35, max: .35, s: 4, c: i % 3 ? '#b59c7a' : '#8a7458' }); }
      for (var j = 0; j < 6; j++) L.push({ x: x - 14 + j * 6, y: y - 10, vx: 0, vy: -rnd(380, 500), t: .22, max: .22, s: 3, c: '#f3f0e6' });
      return particles(L);
    },
    // 펑 연기 (돈고블린 도망, 종으로 생긴 적). 시트 'poof'가 있으면 그걸 써요
    poof: function (x, y, o) {
      var L = []; for (var i = 0; i < 14; i++) { var a = Math.random() * 6.28; L.push({ x: x + Math.cos(a) * 8, y: y - 10 + Math.sin(a) * 8, vx: Math.cos(a) * 50, vy: Math.sin(a) * 50 - 20, t: .6, max: .6, s: 6, c: i % 3 ? '#d8d2c4' : '#a9a39a' }); }
      return particles(L);
    },
    // 금화 튀기기 (돈고블린을 잡았을 때). 시트 'coin'이 있으면 그걸 써요
    coin: function (x, y) {
      var L = []; for (var i = 0; i < 22; i++) { var a = Math.random() * 6.28, sp = rnd(60, 150); L.push({ x: x, y: y - 10, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, g: 260, t: .8, max: .8, s: 4, c: i % 2 ? '#ffd34d' : '#f2b53a' }); }
      return particles(L);
    },
    // 기절 별: 머리 위를 도는 별 3개. opts.follow(머리 위치), opts.until(기절이 끝나면 false)
    stun: function (x, y, o) {
      var t = 0;
      return {
        update: function (dt) { t += dt; return o.until ? o.until() !== false : t < (o.dur || 1.5); },
        draw: function (ctx) {
          var p = o.follow ? o.follow() : [x, y], a0 = t * 6.25;
          ctx.save();
          for (var i = 0; i < 3; i++) { var a = a0 + i * 2.09, sx = p[0] + Math.cos(a) * 13, sy = p[1] + Math.sin(a) * 4, c = i ? '#ffd34d' : '#fff6bc';
            ctx.globalAlpha = 1; ctx.fillStyle = c; ctx.fillRect(R(sx) - 1, R(sy) - 3, 2, 6); ctx.fillRect(R(sx) - 3, R(sy) - 1, 6, 2); }
          ctx.restore();
        }
      };
    },
    // 레벨업 반짝임: 금빛 점이 위로 솟고 반짝여요. 시트 'levelup'이 있으면 그걸 써요
    levelup: function (x, y) {
      var L = []; for (var i = 0; i < 18; i++) L.push({ x: x + rnd(-18, 18), y: y + rnd(-6, 6), vx: rnd(-10, 10), vy: -rnd(60, 160), t: rnd(.5, .9), max: .9, s: i % 4 ? 3 : 5, c: i % 3 ? '#ffd34d' : '#fff4bc' });
      return particles(L);
    }
  };

  // ───── 재생 ─────
  function make(name, x, y, o) {
    var sh = SHEETS[name];
    if (sh && !o.procedural) { var im = sheetImg(sh); if (im || !RECIPES[name]) return sheetFx(sh, x, y, o); }
    var r = RECIPES[name]; return r ? r(x, y, o) : null;
  }
  FX.play = function (name, x, y, opts) {
    var o = opts || {}, f = make(name, x, y, o); if (!f) return null;
    f.layer = o.layer || 'front'; f.name = name; FX.list.push(f); return f;
  };
  FX.update = function (dt) { FX.list = FX.list.filter(function (f) { return f.update(dt) !== false; }); };
  FX.draw = function (ctx, layer) {
    var L = layer || 'front'; ctx.save(); ctx.imageSmoothingEnabled = false;
    FX.list.forEach(function (f) { if (f.layer === L) f.draw(ctx); });
    ctx.restore(); ctx.globalAlpha = 1;
  };
  FX.clear = function () { FX.list = []; };

  // ───── DOM 위에서 재생 (편성 화면의 종 '뭉게뭉게 팡' 등) ─────
  // el 가운데(opts.dx, dy로 이동)에 size×size 캔버스를 띄워요. 그 안의 좌표는 가운데가 (size/2, size/2)
  FX.playOn = function (el, name, opts) {
    var o = opts || {}, size = o.size || 160, cv = document.createElement('canvas'), ctx = cv.getContext('2d');
    cv.width = size; cv.height = size; cv.className = 'fxon'; // 전장 캔버스 테두리 스타일이 붙지 않게
    cv.style.cssText = 'position:absolute;left:50%;top:50%;width:' + size + 'px;height:' + size + 'px;margin:' + (-size / 2 + (o.dy || 0)) + 'px 0 0 ' + (-size / 2 + (o.dx || 0)) + 'px;pointer-events:none;image-rendering:pixelated;z-index:' + (o.z || 30);
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.appendChild(cv);
    var f = make(name, size / 2, size / 2 + (o.cy || 0), o), last = performance.now();
    if (!f) { cv.remove(); return null; }
    (function tick(now) {
      var dt = Math.min(.1, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, size, size); var on = f.update(dt) !== false; ctx.imageSmoothingEnabled = false; f.draw(ctx);
      if (on && cv.isConnected) requestAnimationFrame(tick); else cv.remove();
    })(last);
    return cv;
  };

  FX._sheets = SHEETS; FX._recipes = RECIPES;
  root.FX = FX;
})(typeof window !== 'undefined' ? window : this);
