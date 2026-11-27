// 방치형 RPG 전투 테스트베드 엔진. 화면과 분리되어 있어서 Node에서도 같은 코드로 대량 실행해요.
//  battle(data, ally, enemy, { seed, modules, record }) → 실시간 자동 전투 한 판
//    ally/enemy: [{ id, level, slot(0~4: 0·1 앞줄, 2~4 뒷줄), mul?: { hp, atk } }]
//  stageTeam(data, n) → 캠페인 n번째 스테이지의 적 팀
//  campaign(data, { seed, modules, maxHours }) → 봇이 편성·전투·레벨업·방치를 반복하며 진행
//  compare(data, moduleKey, optionA, optionB, opts) → 요소 하나만 바꿔 캠페인을 나란히 비교
(function (root) {
  'use strict';

  function makeRng(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function heroById(data, id) { for (var i = 0; i < data.heroes.length; i++) if (data.heroes[i].id === id) return data.heroes[i];
    var M = data.mobs || []; for (var j = 0; j < M.length; j++) if (M[j].id === id) return M[j]; return null; }
  // 바꿔 끼우는 요소: opts.modules로 덮어쓸 수 있어요 ({ targeting: 'lowest' } 처럼)
  function mod(data, mods, key) { var m = data.modules[key], pick = (mods && mods[key]) || m.pick; return { pick: pick, o: m.options[pick] }; }

  // ───── 전투 한 판 ─────
  function createBattle(data, ally, enemy, opts) {
    opts = opts || {};
    var B = data.battle, rand = makeRng(opts.seed || 1), mods = opts.modules || {}, rec = opts.record;
    var EN = mod(data, mods, 'energy').o, TG = mod(data, mods, 'targeting').pick, EL = mod(data, mods, 'element').o;
    var SY = mod(data, mods, 'synergy'), HD = mod(data, mods, 'healDecay'), SE = mod(data, mods, 'startEnergy').o;
    var t = 0, log = [], uid = 0;

    function makeUnit(spec, side, team) {
      var h = heroById(data, spec.id), lv = spec.level || 1, g = 1 + data.growth.perLevel * (lv - 1), m = spec.mul || {};
      var hp = h.hp * g * (m.hp || 1);
      var AR = B.arena, p0 = AR.pos[spec.slot] || AR.pos[0], AIR = AR.air, isAir = !!h.air;
      return { uid: ++uid, id: h.id, name: h.name, h: h, side: side, slot: spec.slot, front: spec.slot < 2 || h.mob === 'goblin', level: lv,
        x: spec.x != null ? spec.x : (side === 'A' ? p0[0] : AR.w - p0[0]), y: spec.y != null ? spec.y : (isAir ? (AIR.yMin + AIR.yMax) / 2 : p0[1]), air: isAir, flying: isAir, stamina: isAir ? AIR.stamina : 0, face: side === 'A' ? 1 : -1, moving: false, tgt: null,
        reach: isAir ? AIR.reach : AR.reach[h.range], spd: isAir ? AIR.speed : AR.speed[h.range],
        maxHp: hp, hp: hp, atk: h.atk * g * (m.atk || 1), def: h.def * g, interval: h.interval, range: h.range, el: h.el,
        energy: SE.value, timer: rand() * B.startJitter, alive: true, shield: 0, taunt: 0, slow: 0, slowAmt: 0, haste: 0, hasteAmt: 0,
        boss: !!spec.boss, merc: !!spec.merc, homeY: isAir ? (spec.y != null ? spec.y : (AIR.yMin + AIR.yMax) / 2) : null, stats: { dealt: 0, taken: 0, healed: 0, ults: 0 } };
    }
    var A = ally.map(function (s) { return makeUnit(s, 'A'); }), E = enemy.map(function (s) { return makeUnit(s, 'E'); });
    function team(side) { return side === 'A' ? A : E; }
    function foes(u) { return u.side === 'A' ? E : A; }
    function alive(list) { return list.filter(function (x) { return x.alive; }); }

    // 진영 시너지: 같은 진영 3명 이상이면 공격 보너스
    if (SY.pick === 'on') [A, E].forEach(function (L) {
      var cnt = {}; L.forEach(function (u) { cnt[u.el] = (cnt[u.el] || 0) + 1; });
      L.forEach(function (u) { var c = cnt[u.el]; if (c >= 5) u.atk *= 1 + SY.o.at5; else if (c >= 3) u.atk *= 1 + SY.o.at3; });
    });

    function elemMul(a, d) {
      var beats = data.elements.beats;
      if (beats[a.el] === d.el) return EL.adv;
      if (beats[d.el] === a.el && !(a.el === 'light' || a.el === 'dark')) return EL.dis;
      return 1;
    }
    function atkOf(u) { var p = u.h.passive, a = u.atk; if (p && p.kind === 'rage' && u.hp / u.maxHp < p.below) a *= 1 + p.atk; if (u.buffT > 0) a *= 1 + u.buffAmt; return a; }

    function nearGoblin(u, F) { return (F || alive(foes(u))).filter(function (x) { return x.h.mob === 'goblin' && canHit(u, x) && dist(u, x) <= u.reach * 1.2; })[0] || null; }
    function canHit(a, b) { return !(b.flying && a.range === 'melee' && !a.flying); }
    // 공격 대상 고르기
    function pickTarget(u) {
      var F = alive(foes(u)).filter(function (x) { return canHit(u, x); }); if (!F.length) return null;
      var tauntU = F.filter(function (x) { return x.taunt > 0; }); if (tauntU.length) return tauntU[0];
      var gob = nearGoblin(u, F); if (gob) return gob; // 돈고블린이 사거리 근처에 있으면 먼저 노려요
      if (TG === 'lowest') return F.reduce(function (m, x) { return x.hp / x.maxHp < m.hp / m.maxHp ? x : m; });
      if (TG === 'random') return F[Math.floor(rand() * F.length)];
      var front = F.filter(function (x) { return x.front; }), pool = front.length ? front : F;
      if (TG === 'lane') { // 마주 보는 자리(같은 칸 번호)가 살아 있으면 그쪽
        var same = pool.filter(function (x) { return x.slot === u.slot || (u.slot >= 2 && x.slot === u.slot - 2); });
        if (same.length) return same[0];
      }
      return pool.reduce(function (m, x) { return x.slot < m.slot ? x : m; });
    }

    function hurt(src, dst, mul) {
      if (!dst.alive) return 0;
      var dmg = atkOf(src) * mul * (1 - dst.def / (dst.def + B.defK)) * elemMul(src, dst);
      var absorbed = Math.min(dst.shield, dmg); dst.shield -= absorbed; dmg -= absorbed;
      dst.hp -= dmg; src.stats.dealt += dmg + absorbed; dst.stats.taken += dmg + absorbed;
      if (EN.onHitScale) dst.energy = Math.min(B.energyMax, dst.energy + (dmg / dst.maxHp) * EN.onHitScale);
      if (dst.hp <= 0) { dst.hp = 0; dst.alive = false; if (EN.onKill) src.energy = Math.min(B.energyMax, src.energy + EN.onKill);
        if (rec) log.push({ t: t, kind: 'die', uid: dst.uid }); }
      if (rec) log.push({ t: t, kind: 'hit', from: src.uid, to: dst.uid, amt: Math.round(dmg + absorbed) });
      return dmg;
    }
    function heal(src, dst, amt) {
      if (!dst.alive) return;
      if (HD.pick === 'on') amt *= Math.max(HD.o.minMul, 1 - (t / B.timeLimit) * (1 - HD.o.minMul));
      var real = Math.min(amt, dst.maxHp - dst.hp); dst.hp += real; src.stats.healed += real;
      if (rec) log.push({ t: t, kind: 'heal', from: src.uid, to: dst.uid, amt: Math.round(real) });
    }

    function ultimate(u) {
      var U = u.h.ult, F = alive(foes(u)), T = alive(team(u.side)); u.stats.ults++;
      if (rec) log.push({ t: t, kind: 'ult', uid: u.uid, ult: U.kind });
      switch (U.kind) {
        case 'taunt': u.taunt = U.dur; u.shield += u.maxHp * U.shieldPct; break;
        case 'teamShield': T.forEach(function (x) { x.shield += atkOf(u) * U.mul; }); break;
        case 'strike': { var tg = pickTarget(u); if (tg) hurt(u, tg, U.mul); break; }
        case 'multi': for (var i = 0; i < U.hits; i++) { var tg2 = pickTarget(u); if (tg2) hurt(u, tg2, U.mul); } break;
        case 'backstab': { F = F.filter(function (x) { return canHit(u, x); }); var back = F.filter(function (x) { return !x.front; }), pool = back.length ? back : F;
          if (pool.length) hurt(u, pool.reduce(function (m, x) { return x.hp < m.hp ? x : m; }), U.mul); break; }
        case 'snipe': if (F.length) hurt(u, F.reduce(function (m, x) { return x.hp / x.maxHp < m.hp / m.maxHp ? x : m; }), U.mul); break;
        case 'aoe': F.forEach(function (x) { hurt(u, x, U.mul); if (U.slow) { x.slow = U.slowDur; x.slowAmt = U.slow; } }); break;
        case 'chain': for (var j = 0; j < U.hits; j++) { var L = alive(foes(u)); if (L.length) hurt(u, L[Math.floor(rand() * L.length)], U.mul); } break;
        case 'healAll': T.forEach(function (x) { heal(u, x, atkOf(u) * U.mul); }); break;
        case 'haste': T.forEach(function (x) { x.haste = U.dur; x.hasteAmt = U.amount; }); break;
      }
    }

    var result = null, fx = [], AR = B.arena;
    // ───── 팀 스킬: opts.skills = 아군(A), opts.enemySkills = 적(E). [{ id, level }]. 스킬마다 자기 쿨타임으로 자동 발동 ─────
    var SK = data.skills;
    function mkSkills(list, side) { return (list || []).map(function (s) {
      var def = skillById(data, s.id); return { def: def, side: side, lv: s.level || 1, mul: 1 + SK.perLevel * ((s.level || 1) - 1), timer: def.cd * SK.firstAt, fired: 0 }; }); }
    var skills = mkSkills(opts.skills, 'A'), enemySkills = mkSkills(opts.enemySkills, 'E'), allSkills = skills.concat(enemySkills);
    function skillHurt(dst, raw) {
      if (!dst.alive) return;
      var dmg = raw * (1 - dst.def / (dst.def + B.defK)), ab = Math.min(dst.shield, dmg); dst.shield -= ab; dmg -= ab; dst.hp -= dmg; dst.stats.taken += dmg + ab;
      if (rec) log.push({ t: t, kind: 'skillHit', to: dst.uid, amt: Math.round(dmg + ab) });
      if (dst.hp <= 0) { dst.hp = 0; dst.alive = false; if (rec) log.push({ t: t, kind: 'die', uid: dst.uid }); }
    }
    // 시너지 태그: { race | job | el: 값 또는 [값...] }. el: '*'은 가장 많은 같은 속성
    function tagMatch(tag, T) {
      if (!tag) return function () { return true; };
      var k = tag.race != null ? 'race' : tag.job != null ? 'job' : 'el', v = tag[k];
      if (v === '*') { var c = {}; T.forEach(function (x) { c[x.h[k]] = (c[x.h[k]] || 0) + 1; }); v = Object.keys(c).reduce(function (a, b) { return c[b] > (c[a] || 0) ? b : a; }, null); }
      var vs = [].concat(v); return function (x) { return vs.indexOf(x.h[k]) >= 0; };
    }
    function fireSkill(sk) {
      var d = sk.def, m = sk.mul, T = alive(sk.side === 'E' ? E : A), F = alive(sk.side === 'E' ? A : E); if (!T.length || !F.length) return;
      if (d.tag) { var ok = tagMatch(d.tag, T), nT = T.filter(ok).length;
        if (d.only) { T = T.filter(ok); if (!T.length) return; } // 조건 맞는 아군이 없으면 발동 안 해요
        if (d.per) m *= 1 + d.per * nT; }
      sk.fired++; if (rec) log.push({ t: t, kind: 'skill', id: d.id, side: sk.side });
      switch (d.kind) {
        case 'atkBuff': T.forEach(function (x) { x.buffT = d.dur; x.buffAmt = d.amount * m; }); break;
        case 'healPct': T.forEach(function (x) { var real = Math.min(x.maxHp * d.amount * m, x.maxHp - x.hp); x.hp += real; if (rec && real > 0) log.push({ t: t, kind: 'heal', to: x.uid, amt: Math.round(real) }); }); break;
        case 'shieldPct': T.forEach(function (x) { x.shield += x.maxHp * d.amount * m; }); break;
        case 'nuke': { var avg = T.reduce(function (s2, x) { return s2 + atkOf(x); }, 0) / T.length; F.forEach(function (x) { skillHurt(x, avg * d.amount * m); }); break; }
        case 'slowAll': F.forEach(function (x) { x.slow = d.dur; x.slowAmt = Math.min(0.8, d.amount * m); }); break;
        case 'hasteAll': T.forEach(function (x) { x.haste = d.dur; x.hasteAmt = d.amount * m; }); break;
        case 'execute': { var top = Math.max.apply(null, T.map(atkOf)), low = F.reduce(function (a, b) { return b.hp < a.hp ? b : a; }); skillHurt(low, top * d.amount * m); break; }
        case 'energyAll': T.forEach(function (x) { x.energy = Math.min(B.energyMax, x.energy + d.amount * m); }); break;
        case 'knockback': F.forEach(function (x) { var dir = sk.side === 'E' ? -1 : 1; // 상대 진영 쪽으로 밀어내요
          x.x += dir * d.amount * m; x.stun = Math.max(x.stun || 0, d.dur || 0); if (rec) log.push({ t: t, kind: 'knock', uid: x.uid, dx: dir * d.amount * m }); }); break;
        case 'volley': T.forEach(function (x) { var L2 = alive(sk.side === 'E' ? A : E); if (L2.length) skillHurt(L2[Math.floor(rand() * L2.length)], atkOf(x) * d.amount * m); }); break;
      }
    }
    var SELF_ULT = { taunt: 1, teamShield: 1, healAll: 1, haste: 1 }; // 사거리와 상관없이 쓰는 궁극기
    function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
    // 겹친 유닛끼리 살짝 밀어내요 (같은 편은 더 넓게)
    function separate(all) {
      for (var it = 0; it < 3; it++) // 여러 번 밀어서 한 명에게 몰려도 간격이 유지되게
      for (var i = 0; i < all.length; i++) for (var j = i + 1; j < all.length; j++) {
        var a = all[i], b = all[j]; if (!a.alive || !b.alive || a.flying !== b.flying) continue;
        var need = a.side === b.side ? AR.spacing : (AR.spacingFoe || AR.spacing * 0.8), d = dist(a, b);
        if (d >= need) continue;
        var nx = d > 0.01 ? (a.x - b.x) / d : 0, ny = d > 0.01 ? (a.y - b.y) / d : (i % 2 ? 1 : -1), push = (need - d) / 2;
        if (a.side !== b.side) { // 상대끼리: 공격으로 밀리지 않게, 움직이던 쪽만 물러나요 (둘 다 서 있으면 그대로)
          var wa = a.moving && !b.moving ? 2 : a.moving && b.moving ? 1 : 0, wb = b.moving && !a.moving ? 2 : a.moving && b.moving ? 1 : 0;
          a.x += nx * push * wa; a.y += ny * push * wa; b.x -= nx * push * wb; b.y -= ny * push * wb; continue; }
        a.x += nx * push; a.y += ny * push; b.x -= nx * push; b.y -= ny * push;
      }
      var AIR = AR.air;
      all.forEach(function (u) {
        u.x = Math.max(36, Math.min(AR.w - 36, u.x)); // 그림(2배, 폭 72)이 화면 밖으로 잘리지 않게
        if (u.flying && u.rising) { // 다시 날아오를 때: 원래 비행 높이(homeY)까지 빠르게 올라가요
          var hy = Math.max(AIR.yMin, Math.min(AIR.yMax, u.homeY != null ? u.homeY : AIR.yMax));
          u.y = Math.max(hy, u.y - (AIR.rise || AIR.climb) * B.dt); if (u.y <= hy + 0.5) u.rising = false; }
        else if (u.flying) { if (u.y > AIR.yMax) u.y = Math.max(AIR.yMax, u.y - AIR.climb * B.dt); else u.y = Math.max(AIR.yMin, u.y); }
        else { if (u.y < AR.yMin) u.y = Math.min(AR.yMin, u.y + AIR.climb * B.dt); else u.y = Math.min(AR.yMax, u.y); }
      });
    }
    function step() {
      if (result) return;
      t += B.dt;
      var all = A.concat(E);
      for (var si = 0; si < allSkills.length; si++) { var sk = allSkills[si]; sk.timer -= B.dt; if (sk.timer <= 0) { sk.timer += sk.def.cd; fireSkill(sk); } }
      if (!alive(E).length) result = 'win'; else if (!alive(A).length) result = 'lose';
      for (var k = 0; k < all.length && !result; k++) {
        var u = all[k]; if (!u.alive) continue;
        if (EN.perSec) u.energy = Math.min(B.energyMax, u.energy + EN.perSec * B.dt);
        ['taunt', 'slow', 'haste', 'buffT', 'stun'].forEach(function (f) { if (u[f] > 0) u[f] = Math.max(0, u[f] - B.dt); });
        var speed = (1 + (u.haste > 0 ? u.hasteAmt : 0)) * (1 - (u.slow > 0 ? u.slowAmt : 0));
        if (u.stun > 0) { u.moving = false; continue; } // 넉백으로 잠깐 멈춤
        if (u.h.mob === 'goblin') { // 돈고블린: 싸우지 않고 가장 가까운 상대에게서 도망쳐요. flee초가 지나면 사라져요
          var GB = data.events.goblin; u.age = (u.age || 0) + B.dt;
          if (u.age >= GB.flee) { u.alive = false; u.escaped = true; if (rec) log.push({ t: t, kind: 'escape', uid: u.uid });
            if (!alive(E).length) { result = 'win'; break; } if (!alive(A).length) { result = 'lose'; break; } continue; }
          // 전장 전체를 이리저리 뛰어다녀요 (무작위 지점으로 달리고, 상대가 너무 붙으면 옆으로 피해요)
          if (!u.wp || Math.abs(u.wp.x - u.x) + Math.abs(u.wp.y - u.y) < 12) u.wp = { x: 80 + rand() * (AR.w - 160), y: AR.yMin + rand() * (AR.yMax - AR.yMin) };
          var gvx = u.wp.x - u.x, gvy = u.wp.y - u.y, nf = alive(foes(u)).sort(function (a, b) { return dist(a, u) - dist(b, u); })[0];
          if (nf && dist(nf, u) < 45) { gvx += (u.x - nf.x) * 2; gvy += (u.y - nf.y) * 2; }
          var gl = Math.sqrt(gvx * gvx + gvy * gvy) || 1, gv = GB.speed * B.dt * (1 - (u.slow > 0 ? u.slowAmt : 0));
          u.x += gvx / gl * gv; u.y += gvy / gl * gv; u.face = gvx >= 0 ? 1 : -1; u.moving = true;
          continue; }
        if (u.air) {
          var AIRc = AR.air;
          if (u.flying) { u.stamina -= B.dt; if (u.stamina <= 0) { u.stamina = 0; u.flying = false; u.reach = AR.reach[u.h.range]; u.spd = AR.speed[u.h.range]; if (rec) log.push({ t: t, kind: 'land', uid: u.uid }); } }
          else { u.stamina += B.dt * AIRc.recover; if (u.stamina >= AIRc.stamina) { u.stamina = AIRc.stamina; u.flying = true; u.rising = true; u.reach = AIRc.reach; u.spd = AIRc.speed; if (rec) log.push({ t: t, kind: 'fly', uid: u.uid }); } }
        }
        // 대상: 없거나 죽었거나, 칠 수 없게 됐거나(날아올랐거나), 상대에 도발이 걸렸으면 다시 골라요
        var taunting = alive(foes(u)).some(function (x) { return x.taunt > 0 && canHit(u, x); });
        if (!u.tgt || !u.tgt.alive || !canHit(u, u.tgt) || (taunting && !(u.tgt.taunt > 0)) || (!taunting && u.tgt.h.mob !== 'goblin' && nearGoblin(u))) u.tgt = pickTarget(u);
        var tg = u.tgt;
        if (!tg) { // 칠 수 있는 적이 없으면 가장 가까운 적의 발밑으로 가서 내려오길 기다려요
          var near = alive(foes(u)).sort(function (a, b) { return Math.abs(a.x - u.x) - Math.abs(b.x - u.x); })[0];
          if (near) { var dx = near.x - u.x; u.face = dx >= 0 ? 1 : -1; u.moving = Math.abs(dx) > 30; if (u.moving) u.x += Math.sign(dx) * Math.min(Math.abs(dx) - 30, u.spd * B.dt); }
          u.timer = Math.max(0, u.timer - B.dt * speed); continue;
        }
        u.face = tg.x >= u.x ? 1 : -1;
        var d = dist(u, tg), inReach = d <= u.reach;
        u.moving = !inReach;
        if (!inReach) { var mv = Math.min(d - u.reach * 0.9, u.spd * B.dt * (1 - (u.slow > 0 ? u.slowAmt : 0))); u.x += (tg.x - u.x) / d * mv; u.y += (tg.y - u.y) / d * mv; }
        u.timer = Math.max(0, u.timer - B.dt * speed);
        if (u.timer > 0) continue;
        var ultReady = u.energy >= B.energyMax;
        if (!inReach && !(ultReady && SELF_ULT[u.h.ult.kind])) continue; // 사거리 밖이면 다가가기만 해요
        u.timer += u.interval;
        if (ultReady) { u.energy = 0; ultimate(u); }
        else { if (TG === 'lowest' || TG === 'random') { var nt = pickTarget(u); if (nt && dist(u, nt) <= u.reach) tg = u.tgt = nt; }
          hurt(u, tg, 1); u.energy = Math.min(B.energyMax, u.energy + EN.onAttack); }
        if (!alive(E).length) { result = 'win'; break; }
        if (!alive(A).length) { result = 'lose'; break; }
      }
      separate(all);
      if (!result && t >= B.timeLimit) result = 'timeout';
    }
    function finish() {
    var hpLeft = A.reduce(function (s, x) { return s + x.hp; }, 0) / A.reduce(function (s, x) { return s + x.maxHp; }, 0);
    var enemyLeft = E.reduce(function (s, x) { return s + x.hp; }, 0) / E.reduce(function (s, x) { return s + x.maxHp; }, 0);
    return { result: result, win: result === 'win', time: Math.round(t * 10) / 10, hpLeft: hpLeft, enemyLeft: enemyLeft,
      units: A.concat(E).map(function (x) { return { side: x.side, id: x.id, name: x.name, slot: x.slot, level: x.level, alive: x.alive, escaped: !!x.escaped, mob: x.h.mob || null, merc: !!x.merc,
        dealt: Math.round(x.stats.dealt), taken: Math.round(x.stats.taken), healed: Math.round(x.stats.healed), ults: x.stats.ults }; }),
      log: rec ? log : null };
    }
    var self = { A: A, E: E, skills: skills, enemySkills: enemySkills, step: step, finish: finish, get time() { return t; }, get result() { return result; }, log: log };
    return self;
  }
  function battle(data, ally, enemy, opts) {
    var b = createBattle(data, ally, enemy, opts);
    while (!b.result) b.step();
    return b.finish();
  }

  // ───── 캠페인 ─────
  function stageCount(data) { return data.campaign.chapters * data.campaign.perChapter; }
  function stageName(data, n) { return (Math.floor(n / data.campaign.perChapter) + 1) + '-' + (n % data.campaign.perChapter + 1); }
  // 적 팀: 초반엔 1~2명, 점점 5명까지. 코스트 높은 영웅은 뒤쪽 스테이지부터 나와요. 챕터 마지막은 보스
  function isFrontRole(h) { return h.role === 'tank' || h.role === 'warrior'; }
  function fromTable(arr, n) { return arr[Math.min(n, arr.length - 1)]; }
  function enemyMaxCost(data, n) { var c = 1; data.recruit.enemyMaxCost.forEach(function (x) { if (n >= x.from) c = x.cost; }); return c; }
  // 자리 배치: 탱커·전사는 앞(0·1)부터, 나머지는 뒤(2~4)부터 채워요
  function placeSlots(data, ids) { // ids: 영웅 id 문자열 또는 { id, ... } 객체 (같은 영웅이 여러 번 있어도 돼요)
    var used = [], out = [];
    function key(x) { return typeof x === 'string' ? x : x.id; }
    ids.slice().sort(function (a, b) { return isFrontRole(heroById(data, key(b))) - isFrontRole(heroById(data, key(a))); }).forEach(function (x) {
      var id = key(x), order = isFrontRole(heroById(data, id)) ? [0, 1, 2, 3, 4] : [2, 3, 4, 0, 1];
      var s = order.filter(function (i) { return used.indexOf(i) < 0; })[0]; used.push(s); out.push({ id: id, slot: s, ref: x });
    });
    return out;
  }
  // 특수 몹 이벤트 굴리기: null | { kind: 'goblin' | 'merchant' | 'merc', id?(용병 영웅) }
  function rollEvent(data, n, rnd) {
    var V = data.events; if (!V || n < V.from || (n + 1) % data.campaign.perChapter === 0 || rnd() >= V.chance) return null;
    var keys = Object.keys(V.weights), tot = 0; keys.forEach(function (k) { tot += V.weights[k]; });
    var r = rnd() * tot, kind = keys[0]; for (var i = 0; i < keys.length; i++) { r -= V.weights[keys[i]]; if (r < 0) { kind = keys[i]; break; } }
    var ev = { kind: kind };
    if (kind === 'merc') { var mc = enemyMaxCost(data, n) + (V.merc.costPlus || 0), pool = data.heroes.filter(function (h) { return h.art !== false && h.cost <= mc; });
      ev.id = pool[Math.floor(rnd() * pool.length)].id; ev.price = mercPrice(data, ev.id, n); }
    return ev;
  }
  function mercPrice(data, id, n) { return Math.round(data.events.merc.price * heroById(data, id).cost * Math.pow(data.shop.priceGrowth, n)); }
  // 방랑상인 진열: [{ type: 's'|'h', id, price }]
  function rollMerchant(data, n, rnd) { var M = data.events.merchant, out = [];
    var sk = data.skills.list.filter(function (x) { return (x.grade || 1) >= M.minGrade; }).map(function (x) { return x.id; });
    for (var i = 0; i < M.skills && sk.length; i++) { var id = sk.splice(Math.floor(rnd() * sk.length), 1)[0]; out.push({ type: 's', id: id, price: Math.round(skillPrice(data, id, n) * M.priceMul) }); }
    var hs = data.heroes.filter(function (h) { return h.art !== false; }).map(function (h) { return h.id; });
    for (var j = 0; j < M.heroes && hs.length; j++) { var hid = hs.splice(Math.floor(rnd() * hs.length), 1)[0]; out.push({ type: 'h', id: hid, price: Math.round(M.heroPrice * heroById(data, hid).cost * Math.pow(data.shop.priceGrowth, n)) }); }
    return out; }
  // 이 스테이지에서 울릴 수 있는 최대 횟수: 전장 빈자리만큼 (적이 이미 5명이면 0)
  // ev: 그 판 이벤트. 용병은 적 1명을 차지하니 빈자리에서 빼요
  function bellMax(data, n, ev) { if (!data.bell) return 0; var R0 = data.recruit, room = R0.fieldSlots - Math.min(R0.fieldSlots, fromTable(R0.enemyCount, n) + (ev && ev.kind === 'merc' ? 1 : 0));
    return Math.max(0, Math.min(data.bell.max, Math.floor(room / Math.max(1, data.bell.enemy)))); }
  function stageTeam(data, n, ev, bell) { bell = Math.max(0, Math.min(bell || 0, bellMax(data, n, ev)));
    var C = data.campaign, R = data.recruit, lv = Math.round(1 + n * C.levelStep + (C.walls.indexOf(n) >= 0 ? C.wallBonus : 0));
    var mercN = ev && ev.kind === 'merc' ? 1 : 0, base = fromTable(R.enemyCount, n), cnt = Math.min(R.fieldSlots, base + mercN + (data.bell ? data.bell.enemy * bell : 0)) - mercN, maxC = enemyMaxCost(data, n), rnd = makeRng(n * 977 + 13);
    var pool = data.heroes.filter(function (h) { return h.cost <= maxC && h.art !== false; }).map(function (h) { return h.id; });
    // 새로 풀린 코스트의 영웅이 앞에 오도록 섞어요 (그래야 새 영웅을 만날 수 있어요)
    for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp; }
    pool.sort(function (a, b) { return (heroById(data, b).cost === maxC) - (heroById(data, a).cost === maxC); });
    var picks = pool.slice(0, cnt);
    var em = C.enemyMul * Math.min(1, C.earlyMul + n * C.earlyRamp); // 초반 적은 약하게 시작해서 점점 원래 세기로
    var m = { hp: em, atk: em }, boss = (n + 1) % C.perChapter === 0;
    // 자리: 뽑힌 순서대로 차례로 앉혀요(종으로 적이 늘어도 먼저 있던 적의 자리가 안 바뀌게). 용병은 늘 4번 자리
    var usedSlots = mercN ? [4] : [], team = picks.map(function (id) { var order = isFrontRole(heroById(data, id)) ? [0, 1, 2, 3, 4] : [2, 3, 4, 0, 1];
      var s = order.filter(function (q) { return usedSlots.indexOf(q) < 0; })[0]; usedSlots.push(s); return { id: id, level: lv, slot: s, mul: m }; });
    if (boss) { var b = team.reduce(function (x, y) { return y.slot < x.slot ? y : x; }); b.boss = true; b.mul = { hp: C.bossHp * em, atk: C.bossAtk * em }; }
    var ES = C.enemySkills, ecount = 0, eskills = [];
    if (ES) { ES.table.forEach(function (x) { if (n >= x.from) ecount = x.count; }); if (boss && ecount) ecount += ES.bossExtra || 0;
      var sids = data.skills.list.map(function (x) { return x.id; });
      for (var k = sids.length - 1; k > 0; k--) { var r2 = Math.floor(rnd() * (k + 1)), t2 = sids[k]; sids[k] = sids[r2]; sids[r2] = t2; }
      eskills = sids.slice(0, Math.min(ecount, data.skills.slots)).map(function (id) { return { id: id, level: Math.min(data.skills.maxLevel, 1 + Math.floor(n / ES.levelEvery)) }; }); }
    if (ev && ev.kind === 'goblin') team.push({ id: 'goblin', level: lv, slot: 4, mul: m, mob: true });
    if (mercN) team.push({ id: ev.id, level: lv, slot: 4, mul: m, merc: true });
    return { n: n, name: stageName(data, n), level: lv, boss: boss, wall: C.walls.indexOf(n) >= 0, team: team, skills: eskills, event: ev || null, bell: bell };
  }
  function skillById(data, id) { var L = data.skills.list; for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; }
  function skillPrice(data, id, cleared) { return Math.round(skillById(data, id).price * Math.pow(data.shop.priceGrowth, cleared)); }
  function refreshPrice(data, n) { return Math.round(data.shop.refresh * Math.pow(data.shop.refreshGrowth, n)); }
  // 상점 진열: 스킬 목록에서 겹치지 않게 stock개
  // plv(플레이어 레벨)를 주면 그 레벨의 등급 확률(player.shopGrade)로 등급을 먼저 뽑고, 그 등급 안에서 골라요
  function rollShop(data, rnd, plv) { var ids = data.skills.list.map(function (x) { return x.id; }), out = [], W = plv && data.player ? perk(data, plv).shopGrade : null;
    while (out.length < Math.min(data.shop.stock, ids.length) && ids.length) {
      var cand = ids;
      if (W) { var byG = {}; ids.forEach(function (id) { var g = skillGrade(data, id); (byG[g] = byG[g] || []).push(id); });
        var tot = 0, g2; for (g2 = 1; g2 <= 4; g2++) if (byG[g2]) tot += W[g2 - 1] || 0;
        if (tot > 0) { var r = rnd() * tot; for (g2 = 1; g2 <= 4; g2++) { if (!byG[g2]) continue; r -= W[g2 - 1] || 0; if (r < 0) { cand = byG[g2]; break; } } } }
      var id = cand[Math.floor(rnd() * cand.length)]; out.push(id); ids.splice(ids.indexOf(id), 1); } return out; }
  // ───── 플레이어 레벨 ─────
  // xp(누적 경험치) → { level, cur(이번 레벨에서 쌓인 양), need(다음 레벨까지 필요한 양, 최고 레벨이면 0) }
  function playerLevel(data, xp) { var P = data.player, lv = 1, left = xp || 0;
    while (lv - 1 < P.need.length && left >= P.need[lv - 1]) { left -= P.need[lv - 1]; lv++; }
    return { level: lv, cur: lv - 1 < P.need.length ? left : 0, need: lv - 1 < P.need.length ? P.need[lv - 1] : 0, max: lv - 1 >= P.need.length }; }
  // 레벨 효과: { field 전장 칸, skillSlots 스킬 칸, shopGrade 등급 가중치 }
  function perk(data, lv) { var P = data.player, i = Math.max(0, Math.min((lv || 1) - 1, P.field.length - 1));
    return { field: P.field[i], skillSlots: P.skillSlots[i], shopGrade: P.shopGrade[Math.min(i, P.shopGrade.length - 1)] }; }
  // 살 수 있나: 새 스킬은 빈 칸이 있어야, 가진 스킬은 최고 레벨 전이어야
  function canTake(data, owned, id, slots) { var o = owned.filter(function (s) { return s.id === id; })[0]; return o ? o.level < data.skills.maxLevel : owned.length < (slots || data.skills.slots); }
  function takeSkill(data, owned, id) { var o = owned.filter(function (s) { return s.id === id; })[0]; if (o) o.level++; else owned.push({ id: id, level: 1 }); }
  // 스킬 판매: 판매가 = 지금 상점가 × 레벨 × sellRate
  function skillSellPrice(data, s, cleared) { return Math.round(skillPrice(data, s.id, cleared) * (s.level || 1) * (data.shop.sellRate == null ? 0.5 : data.shop.sellRate)); }
  function sellSkill(data, owned, id) { for (var i = 0; i < owned.length; i++) if (owned[i].id === id) return owned.splice(i, 1)[0]; return null; }
  function skillGrade(data, id) { return skillById(data, id).grade || 1; }
  // ───── 전리품 룰렛 ─────
  // 칸 키: 'h:<영웅 id>' 영웅 · 's:<스킬 id>' 스킬 두루마리 · 'g:<골드>' 골드 주머니
  function lootPool(data, st, rnd) {
    var L = data.recruit.loot || {}, out = st.team.filter(function (u) { return !u.mob; }).map(function (u) { return 'h:' + u.id; });
    if (L.skills !== false) (st.skills || []).forEach(function (s) { out.push('s:' + s.id); });
    var rew = data.campaign.reward.base * Math.pow(data.campaign.reward.growth, st.n);
    for (var i = 0; i < (L.goldSlots || 0) + (data.bell && st.bell ? data.bell.lootGold * st.bell : 0); i++) out.push('g:' + Math.max(1, Math.round(rew * ((L.goldMin || 0.3) + rnd() * ((L.goldMax || 0.7) - (L.goldMin || 0.3))))));
    return out;
  }
  // 전리품 다시 돌리기 비용 (k = 이번 판에서 이미 돌린 횟수, n = 이긴 스테이지 번호)
  function lootRerollPrice(data, k, n) { var RR = data.recruit.reroll; return Math.round(RR.base * Math.pow(RR.growth, k || 0) * Math.pow(data.shop.priceGrowth, Math.max(0, n || 0))); }
  function lootParse(key) { var i = key.indexOf(':'); if (i < 0) return { type: 'h', id: key }; var t = key.slice(0, i), v = key.slice(i + 1); return t === 'g' ? { type: 'g', amt: +v } : { type: t, id: v }; }
  function levelCost(data, lv) { return Math.round(data.levelCost.base * Math.pow(data.levelCost.growth, lv - 1)); }
  // 등급 배율 (합성 등급 1~maxGrade)
  function gradeMul(data, g) { var M = data.recruit.merge, arr = M ? M.mul : data.recruit.starMul; return arr[(g || 1) - 1] || arr[arr.length - 1] || 1; }
  function starMul(data, star) { return gradeMul(data, star); } // 예전 이름
  function power(data, id, lv, star) { var h = heroById(data, id), g = 1 + data.growth.perLevel * (lv - 1), s = starMul(data, star); return Math.sqrt(h.hp * g * s * h.atk * g * s / h.interval); }
  // 클리어 골드: 종을 울린 만큼 늘어요
  function stageReward(data, n, bell, ev) { var C = data.campaign; bell = Math.max(0, Math.min(bell || 0, bellMax(data, n, ev))); return Math.round(C.reward.base * Math.pow(C.reward.growth, n) * (1 + (data.bell ? data.bell.gold * (bell || 0) : 0))); }
  function costCap(data, cleared) { var c = data.recruit.costCap; if (c.enabled === false) return 999; return Math.min(c.max, c.start + Math.floor(cleared / c.every)); }

  // 봇의 편성: 힘 센 순서로, 코스트 상한과 전장 칸 안에서 채워요
  // roster: [{ id, level, star }]
  // roster: [{ uid?, id, level, grade (또는 star) }]. 같은 영웅이 여러 명이어도 각각 올려요
  function autoFormation(data, roster, cap, field) { field = field || data.recruit.fieldSlots;
    function gr(r) { return r.grade || r.star || 1; }
    var list = roster.slice().sort(function (a, b) { return power(data, b.id, b.level, gr(b)) - power(data, a.id, a.level, gr(a)); });
    var pick = [], used = 0;
    list.forEach(function (r) { var c = heroById(data, r.id).cost; if (pick.length < field && used + c <= cap) { pick.push(r); used += c; } });
    return placeSlots(data, pick).map(function (p) {
      var r = p.ref, s = gradeMul(data, gr(r)); return { uid: r.uid, id: p.id, level: r.level, grade: gr(r), star: gr(r), slot: p.slot, mul: { hp: s, atk: s } };
    });
  }
  // ───── 영웅 개체 (같은 영웅도 여러 명) ─────
  // units: [{ uid, id, grade }]
  function newUnit(units, id, grade) { var uid = units.reduce(function (m, u) { return Math.max(m, u.uid || 0); }, 0) + 1, u = { uid: uid, id: id, grade: grade || 1 }; units.push(u); return u; }
  function canMerge(data, a, b) { var M = data.recruit.merge || { maxGrade: data.recruit.maxStar };
    return !!(a && b && a.uid !== b.uid && a.id === b.id && (a.grade || 1) === (b.grade || 1) && (a.grade || 1) < M.maxGrade); }
  // b를 a에 겹쳐 합성: a 등급 +1, b는 사라져요. 반환: 합쳐진 a (안 되면 null)
  function mergeUnits(data, units, aUid, bUid) {
    var a = units.filter(function (u) { return u.uid === aUid; })[0], b = units.filter(function (u) { return u.uid === bUid; })[0];
    if (!canMerge(data, a, b)) return null; a.grade = (a.grade || 1) + 1; units.splice(units.indexOf(b), 1); return a; }
  // 봇용: 합칠 수 있는 짝을 모두 합쳐요. 반환: 합성 횟수
  function autoMerge(data, units) { var n = 0, again = true;
    while (again) { again = false;
      for (var i = 0; i < units.length && !again; i++) for (var j = i + 1; j < units.length; j++) if (canMerge(data, units[i], units[j])) { mergeUnits(data, units, units[i].uid, units[j].uid); n++; again = true; break; } }
    return n; }
  // 영입 한 명 처리: 가진 영웅이면 합성 조각, 아니면 새로 들어와요. 반환: 'merge' | 'star' | 'new'
  function addHero(data, owned, id) {
    var R = data.recruit, o = owned[id];
    if (o) {
      if (o.star >= R.maxStar) return 'max';
      o.pieces++; if (o.pieces >= R.mergeCount - 1) { o.star++; o.pieces = 0; return 'star'; }
      return 'merge';
    }
    owned[id] = { star: 1, pieces: 0 }; return 'new';
  }

  // 봇 진행: 도전 → 이기면 적 중 1명 영입 → 지면 출전 영웅을 고르게 레벨업 → 돈이 없으면 방치 보상을 기다림
  function campaign(data, opts) {
    opts = opts || {};
    var C = data.campaign, R = data.recruit, levels = {}, owned = {}, gold = 0, time = 0, stage = 0, best = 0, tries = 0, total = stageCount(data), maxT = (opts.maxHours || 48) * 3600;
    var units = []; newUnit(units, R.startHero, 1); levels[R.startHero] = data.startLevel;
    var log = [], attempts = 0, battleTime = 0, idleTime = 0, seed = (opts.seed || 1) * 7919, rnd = makeRng(seed + 5);
    var recruits = { new: 0, merge: 0, star: 0, max: 0, dropped: 0 }, skills = [], xp = 0, plv = 1, shop = rollShop(data, rnd, 1), rerolls = 0, sold = 0, spent = 0, stuck = false;
    // 상점 봇: 진열된 것 중 살 수 있는 걸 앞에서부터 사요. 반환: 산 개수
    function shopping() { var n = 0, again = true;
      while (again) { again = false;
        for (var i = 0; i < shop.length; i++) { var id = shop[i], p = skillPrice(data, id, stage);
          var SL = data.player ? perk(data, plv).skillSlots : data.skills.slots;
          if (canTake(data, skills, id, SL) && gold >= p) { gold -= p; spent += p; takeSkill(data, skills, id); shop.splice(i, 1); n++; again = true; break; }
          // 칸이 꽉 찼으면: 진열품보다 등급이 낮은 스킬 중 가장 낮은 것(같으면 레벨 낮은 것)을 팔고 사요
          if (skills.length >= SL && !skills.some(function (s) { return s.id === id; })) {
            var low = skills.slice().sort(function (a, b) { return skillGrade(data, a.id) - skillGrade(data, b.id) || a.level - b.level; })[0];
            if (low && skillGrade(data, low.id) < skillGrade(data, id)) { var sv = skillSellPrice(data, low, stage);
              if (gold + sv >= p) { sellSkill(data, skills, low.id); gold += sv; sold++; gold -= p; spent += p; takeSkill(data, skills, id); shop.splice(i, 1); n++; again = true; break; } } } } }
      return n; }
    var lastHp = 0, bells = { rung: 0, lost: 0 };
    var events = { goblin: { seen: 0, caught: 0, missed: 0 }, merchant: { seen: 0, bought: 0 }, merc: { seen: 0, hired: 0 } };
    // 영웅 하나 얻기 (용병·상인): 백팩이 꽉 차면 백팩에서 가장 약한 영웅보다 셀 때만 바꿔요. 반환: 얻었으면 true
    // 영웅 하나 얻기: 새 개체로 들어오고, 같은 영웅·같은 등급이 있으면 봇은 바로 합쳐요.
    // 백팩(전장에 없는 영웅)이 R.bag을 넘으면 가장 약한 영웅을 버려요. 반환: 새 영웅이 남았으면 true
    function gainHero(id, team) {
      var u = newUnit(units, id, 1); levels[id] = levels[id] || data.startLevel; recruits['new']++;
      var m = autoMerge(data, units); recruits.merge += m;
      var inTeam = team.map(function (x) { return x.uid; }), kept = true;
      for (;;) { var bag = units.filter(function (x) { return inTeam.indexOf(x.uid) < 0; }); if (bag.length <= R.bag) break;
        var wk = bag.sort(function (a, b) { return power(data, a.id, data.startLevel, a.grade) - power(data, b.id, data.startLevel, b.grade); })[0];
        if (wk === u) kept = false; units.splice(units.indexOf(wk), 1); recruits.dropped++; }
      return kept; }
    function roster() { return units.map(function (u) { return { uid: u.uid, id: u.id, level: levels[u.id] || data.startLevel, grade: u.grade }; }); }
    while (stage < total && time < maxT) {
      // 종 전략: opts.bell = 'never' | 'always' | 'smart'(앞 판을 여유 있게 이겼으면 울려요) 또는 숫자
      var bp = opts.bell || 'never', bellN = typeof bp === 'number' ? bp : bp === 'always' ? (data.bell ? data.bell.max : 0) : bp === 'smart' ? (lastHp > 0.75 ? 2 : lastHp > 0.5 ? 1 : 0) : 0;
      var ev = rollEvent(data, stage, rnd), team = autoFormation(data, roster(), costCap(data, best), data.player ? perk(data, plv).field : 0), st = stageTeam(data, stage, ev, bellN);
      bells.rung += bellN;
      if (ev) events[ev.kind].seen++;
      var res = battle(data, team, st.team, { seed: seed + attempts * 31, modules: opts.modules, skills: skills, enemySkills: st.skills });
      attempts++; tries++; time += res.time; battleTime += res.time;
      if (data.player) { xp += data.player.xpPerKill * res.units.filter(function (x) { return x.side === 'E' && !x.alive && !x.escaped; }).length; plv = playerLevel(data, xp).level; }
      shop = rollShop(data, rnd, plv); rerolls = 0; // 전투가 끝나면 상점이 새로 채워져요
      if (res.win) {
        var reward = stageReward(data, stage, bellN, ev); lastHp = res.hpLeft;
        gold += reward;
        // 특수 몹 보상
        if (ev && ev.kind === 'goblin') { if (res.units.some(function (x) { return x.mob === 'goblin' && !x.alive && !x.escaped; })) { gold += Math.round(reward * data.events.goblin.goldMul); events.goblin.caught++; } else events.goblin.missed++; }
        if (ev && ev.kind === 'merc') { if (gold >= ev.price && gainHero(ev.id, team)) { gold -= ev.price; spent += ev.price; events.merc.hired++; } }
        if (ev && ev.kind === 'merchant') { rollMerchant(data, stage, rnd).forEach(function (it) {
          if (gold < it.price) return;
          if (it.type === 's' && canTake(data, skills, it.id, data.player ? perk(data, plv).skillSlots : 0)) { gold -= it.price; spent += it.price; takeSkill(data, skills, it.id); events.merchant.bought++; }
          else if (it.type === 'h' && gainHero(it.id, team)) { gold -= it.price; spent += it.price; events.merchant.bought++; } }); }
        // 전리품: 영웅·스킬·골드 칸 중 하나 무작위
        // 전리품 1개: 나온 걸 받거나, 버리고 다시 돌려요. 봇은 골드 주머니(꽝)가 나오면 돈이 될 때 버리고 다시 돌려요
        var pool = lootPool(data, st, rnd), cur = Math.floor(rnd() * pool.length), rr = 0;
        while (lootParse(pool[cur]).type === 'g' && pool.some(function (k2) { return lootParse(k2).type !== 'g'; }) && gold >= lootRerollPrice(data, rr, stage)) {
          var rp2 = lootRerollPrice(data, rr, stage); gold -= rp2; spent += rp2; rr++; recruits.reroll = (recruits.reroll || 0) + 1;
          pool.splice(cur, 1); cur = Math.floor(rnd() * pool.length); }
        var pk = lootParse(pool[cur]), got = null, kind;
        if (pk.type === 'g') { gold += pk.amt; recruits.gold = (recruits.gold || 0) + 1; }
        else if (pk.type === 's') { if (canTake(data, skills, pk.id, data.player ? perk(data, plv).skillSlots : 0)) takeSkill(data, skills, pk.id); recruits.skill = (recruits.skill || 0) + 1; }
        else got = pk.id;
        if (got) { kind = gainHero(got, team) ? 'new' : 'dropped'; }
        log.push({ stage: stage, name: st.name, wall: st.wall, boss: st.boss, tries: tries, time: time, teamLv: team.map(function (x) { return x.level; }), plv: plv, field: team.length, battle: res.time, hpLeft: res.hpLeft, got: got, kind: kind, owned: units.length, maxGrade: units.reduce(function (m, u) { return Math.max(m, u.grade); }, 1) });
        stage++; tries = 0; best = Math.max(best, stage);
        shopping();
        continue;
      }
      lastHp = 0; if (bellN) bells.lost++;
      if (C.loseStepBack && stage > 0) stage = Math.max(0, stage - C.loseStepBack); // 지면 앞 스테이지로
      var bought = shopping();
      if (data.levelCost.enabled !== false) for (;;) { // 골드 레벨업 (꺼져 있으면 건너뛰어요)
        var lowest = team.slice().sort(function (a, b) { return levels[a.id] - levels[b.id]; })[0];
        var lv = levels[lowest.id]; if (lv >= data.levelCost.maxLevel) break;
        var cost = levelCost(data, lv); if (gold < cost) break;
        gold -= cost; levels[lowest.id]++; bought++;
        team = team.map(function (x) { x.level = levels[x.id]; return x; });
      }
      if (!bought) {
        // 방치 보상을 기다려요: 진열된 스킬 중 살 수 있는 가장 싼 것만큼 (없으면 새로고침 비용만큼) 쌓일 때까지
        if (C.idle.enabled === false) { if (C.loseStepBack) continue; stuck = true; break; }
        var perMin = C.idle.base * Math.pow(C.idle.growth, stage);
        var takeable = shop.filter(function (id) { return canTake(data, skills, id); }).map(function (id) { return skillPrice(data, id, stage); });
        var anyRoom = data.skills.list.some(function (x) { return canTake(data, skills, x.id); });
        if (!anyRoom) { stuck = true; break; } // 스킬도 다 찼고 레벨업도 없으면 더 강해질 방법이 없어요
        var need;
        if (takeable.length) need = Math.min.apply(null, takeable) - gold;
        else { var rp = refreshPrice(data, rerolls); if (gold >= rp) { gold -= rp; spent += rp; rerolls++; shop = rollShop(data, rnd); continue; } need = rp - gold; }
        var wait = Math.max(60, Math.ceil(need / perMin) * 60);
        gold += perMin * wait / 60; time += wait; idleTime += wait;
      }
    }
    return { cleared: stage, total: total, time: time, battleTime: battleTime, idleTime: idleTime, attempts: attempts, log: log, levels: levels, owned: units, units: units, recruits: recruits, skills: skills, spent: spent, sold: sold, stuck: stuck, xp: xp, plv: plv, events: events, bells: bells };
  }

  // 요소 하나만 바꿔 같은 시드로 캠페인을 돌려 비교
  function compare(data, key, a, b, opts) {
    opts = opts || {};
    var seeds = opts.seeds || [1, 2, 3], out = {};
    [a, b].forEach(function (pick) {
      var runs = seeds.map(function (s) { var m = {}; for (var k in (opts.modules || {})) m[k] = opts.modules[k]; m[key] = pick; return campaign(data, { seed: s, modules: m, maxHours: opts.maxHours }); });
      out[pick] = runs;
    });
    return out;
  }

  var api = { battle: battle, createBattle: createBattle, stageTeam: stageTeam, stageName: stageName, stageCount: stageCount, autoFormation: autoFormation,
    campaign: campaign, compare: compare, levelCost: levelCost, heroById: heroById, makeRng: makeRng,
    costCap: costCap, starMul: starMul, gradeMul: gradeMul, addHero: addHero, power: power, newUnit: newUnit, canMerge: canMerge, mergeUnits: mergeUnits, autoMerge: autoMerge,
    skillById: skillById, lootPool: lootPool, lootParse: lootParse, lootRerollPrice: lootRerollPrice, rollEvent: rollEvent, stageReward: stageReward, bellMax: bellMax, rollMerchant: rollMerchant, mercPrice: mercPrice, skillPrice: skillPrice, refreshPrice: refreshPrice, rollShop: rollShop, canTake: canTake, takeSkill: takeSkill, playerLevel: playerLevel, perk: perk, skillSellPrice: skillSellPrice, sellSkill: sellSkill };
  if (typeof module !== 'undefined') module.exports = api; else root.IdleEngine = api;
})(this);
