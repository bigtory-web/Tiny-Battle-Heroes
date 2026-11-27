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
  function heroById(data, id) { for (var i = 0; i < data.heroes.length; i++) if (data.heroes[i].id === id) return data.heroes[i]; return null; }
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
      var AR = B.arena, p0 = AR.pos[spec.slot] || AR.pos[0];
      return { uid: ++uid, id: h.id, name: h.name, h: h, side: side, slot: spec.slot, front: spec.slot < 2, level: lv,
        x: side === 'A' ? p0[0] : AR.w - p0[0], y: p0[1], face: side === 'A' ? 1 : -1, moving: false, tgt: null,
        reach: AR.reach[h.range], spd: AR.speed[h.range],
        maxHp: hp, hp: hp, atk: h.atk * g * (m.atk || 1), def: h.def * g, interval: h.interval, range: h.range, el: h.el,
        energy: SE.value, timer: rand() * B.startJitter, alive: true, shield: 0, taunt: 0, slow: 0, slowAmt: 0, haste: 0, hasteAmt: 0,
        boss: !!spec.boss, stats: { dealt: 0, taken: 0, healed: 0, ults: 0 } };
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
    function atkOf(u) { var p = u.h.passive, a = u.atk; if (p && p.kind === 'rage' && u.hp / u.maxHp < p.below) a *= 1 + p.atk; return a; }

    // 공격 대상 고르기
    function pickTarget(u) {
      var F = alive(foes(u)); if (!F.length) return null;
      var tauntU = F.filter(function (x) { return x.taunt > 0; }); if (tauntU.length) return tauntU[0];
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
        case 'backstab': { var back = F.filter(function (x) { return !x.front; }), pool = back.length ? back : F;
          if (pool.length) hurt(u, pool.reduce(function (m, x) { return x.hp < m.hp ? x : m; }), U.mul); break; }
        case 'snipe': if (F.length) hurt(u, F.reduce(function (m, x) { return x.hp / x.maxHp < m.hp / m.maxHp ? x : m; }), U.mul); break;
        case 'aoe': F.forEach(function (x) { hurt(u, x, U.mul); if (U.slow) { x.slow = U.slowDur; x.slowAmt = U.slow; } }); break;
        case 'chain': for (var j = 0; j < U.hits; j++) { var L = alive(foes(u)); if (L.length) hurt(u, L[Math.floor(rand() * L.length)], U.mul); } break;
        case 'healAll': T.forEach(function (x) { heal(u, x, atkOf(u) * U.mul); }); break;
        case 'haste': T.forEach(function (x) { x.haste = U.dur; x.hasteAmt = U.amount; }); break;
      }
    }

    var result = null, fx = [], AR = B.arena;
    var SELF_ULT = { taunt: 1, teamShield: 1, healAll: 1, haste: 1 }; // 사거리와 상관없이 쓰는 궁극기
    function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
    // 겹친 유닛끼리 살짝 밀어내요 (같은 편은 더 넓게)
    function separate(all) {
      for (var i = 0; i < all.length; i++) for (var j = i + 1; j < all.length; j++) {
        var a = all[i], b = all[j]; if (!a.alive || !b.alive) continue;
        var need = a.side === b.side ? AR.spacing : AR.spacing * 0.8, d = dist(a, b);
        if (d >= need) continue;
        var nx = d > 0.01 ? (a.x - b.x) / d : 0, ny = d > 0.01 ? (a.y - b.y) / d : (i % 2 ? 1 : -1), push = (need - d) / 2;
        a.x += nx * push; a.y += ny * push; b.x -= nx * push; b.y -= ny * push;
      }
      all.forEach(function (u) { u.x = Math.max(20, Math.min(AR.w - 20, u.x)); u.y = Math.max(AR.yMin, Math.min(AR.yMax, u.y)); });
    }
    function step() {
      if (result) return;
      t += B.dt;
      var all = A.concat(E);
      for (var k = 0; k < all.length; k++) {
        var u = all[k]; if (!u.alive) continue;
        if (EN.perSec) u.energy = Math.min(B.energyMax, u.energy + EN.perSec * B.dt);
        ['taunt', 'slow', 'haste'].forEach(function (f) { if (u[f] > 0) u[f] = Math.max(0, u[f] - B.dt); });
        var speed = (1 + (u.haste > 0 ? u.hasteAmt : 0)) * (1 - (u.slow > 0 ? u.slowAmt : 0));
        // 대상: 없거나 죽었거나, 상대에 도발이 걸렸으면 다시 골라요
        var taunting = alive(foes(u)).some(function (x) { return x.taunt > 0; });
        if (!u.tgt || !u.tgt.alive || (taunting && !(u.tgt.taunt > 0))) u.tgt = pickTarget(u);
        var tg = u.tgt; if (!tg) continue;
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
      units: A.concat(E).map(function (x) { return { side: x.side, id: x.id, name: x.name, slot: x.slot, level: x.level, alive: x.alive,
        dealt: Math.round(x.stats.dealt), taken: Math.round(x.stats.taken), healed: Math.round(x.stats.healed), ults: x.stats.ults }; }),
      log: rec ? log : null };
    }
    var self = { A: A, E: E, step: step, finish: finish, get time() { return t; }, get result() { return result; }, log: log };
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
  function placeSlots(data, ids) {
    var used = [], out = [];
    ids.slice().sort(function (a, b) { return isFrontRole(heroById(data, b)) - isFrontRole(heroById(data, a)); }).forEach(function (id) {
      var order = isFrontRole(heroById(data, id)) ? [0, 1, 2, 3, 4] : [2, 3, 4, 0, 1];
      var s = order.filter(function (i) { return used.indexOf(i) < 0; })[0]; used.push(s); out.push({ id: id, slot: s });
    });
    return out;
  }
  function stageTeam(data, n) {
    var C = data.campaign, R = data.recruit, lv = Math.round(1 + n * C.levelStep + (C.walls.indexOf(n) >= 0 ? C.wallBonus : 0));
    var cnt = Math.min(R.fieldSlots, fromTable(R.enemyCount, n)), maxC = enemyMaxCost(data, n), rnd = makeRng(n * 977 + 13);
    var pool = data.heroes.filter(function (h) { return h.cost <= maxC; }).map(function (h) { return h.id; });
    // 새로 풀린 코스트의 영웅이 앞에 오도록 섞어요 (그래야 새 영웅을 만날 수 있어요)
    for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp; }
    pool.sort(function (a, b) { return (heroById(data, b).cost === maxC) - (heroById(data, a).cost === maxC); });
    var picks = pool.slice(0, cnt);
    var em = C.enemyMul * Math.min(1, C.earlyMul + n * C.earlyRamp); // 초반 적은 약하게 시작해서 점점 원래 세기로
    var m = { hp: em, atk: em }, boss = (n + 1) % C.perChapter === 0;
    var team = placeSlots(data, picks).map(function (p) { return { id: p.id, level: lv, slot: p.slot, mul: m }; });
    if (boss) { var b = team.reduce(function (x, y) { return y.slot < x.slot ? y : x; }); b.boss = true; b.mul = { hp: C.bossHp * em, atk: C.bossAtk * em }; }
    return { n: n, name: stageName(data, n), level: lv, boss: boss, wall: C.walls.indexOf(n) >= 0, team: team };
  }
  function levelCost(data, lv) { return Math.round(data.levelCost.base * Math.pow(data.levelCost.growth, lv - 1)); }
  function starMul(data, star) { return data.recruit.starMul[(star || 1) - 1] || 1; }
  function power(data, id, lv, star) { var h = heroById(data, id), g = 1 + data.growth.perLevel * (lv - 1), s = starMul(data, star); return Math.sqrt(h.hp * g * s * h.atk * g * s / h.interval); }
  function costCap(data, cleared) { var c = data.recruit.costCap; return Math.min(c.max, c.start + Math.floor(cleared / c.every)); }

  // 봇의 편성: 힘 센 순서로, 코스트 상한과 전장 칸 안에서 채워요
  // roster: [{ id, level, star }]
  function autoFormation(data, roster, cap) {
    var list = roster.slice().sort(function (a, b) { return power(data, b.id, b.level, b.star) - power(data, a.id, a.level, a.star); });
    var pick = [], used = 0;
    list.forEach(function (r) { var c = heroById(data, r.id).cost; if (pick.length < data.recruit.fieldSlots && used + c <= cap) { pick.push(r); used += c; } });
    var byId = {}; pick.forEach(function (r) { byId[r.id] = r; });
    return placeSlots(data, pick.map(function (r) { return r.id; })).map(function (p) {
      var r = byId[p.id], s = starMul(data, r.star); return { id: p.id, level: r.level, star: r.star, slot: p.slot, mul: { hp: s, atk: s } };
    });
  }
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
    var C = data.campaign, R = data.recruit, levels = {}, owned = {}, gold = 0, time = 0, stage = 0, tries = 0, total = stageCount(data), maxT = (opts.maxHours || 48) * 3600;
    owned[R.startHero] = { star: 1, pieces: 0 }; levels[R.startHero] = data.startLevel;
    var log = [], attempts = 0, battleTime = 0, idleTime = 0, seed = (opts.seed || 1) * 7919, rnd = makeRng(seed + 5);
    var recruits = { new: 0, merge: 0, star: 0, max: 0, dropped: 0 };
    function roster() { return Object.keys(owned).map(function (id) { return { id: id, level: levels[id], star: owned[id].star }; }); }
    while (stage < total && time < maxT) {
      var team = autoFormation(data, roster(), costCap(data, stage)), st = stageTeam(data, stage);
      var res = battle(data, team, st.team, { seed: seed + attempts * 31, modules: opts.modules });
      attempts++; tries++; time += res.time; battleTime += res.time;
      if (res.win) {
        var reward = Math.round(C.reward.base * Math.pow(C.reward.growth, stage));
        gold += reward;
        // 영입: 싸운 적 중 1명 무작위
        var got = st.team[Math.floor(rnd() * st.team.length)].id, kind;
        if (!owned[got]) {
          var inTeam = team.map(function (x) { return x.id; }), bag = Object.keys(owned).filter(function (id) { return inTeam.indexOf(id) < 0; });
          if (bag.length >= R.bag) {
            // 백팩이 꽉 참: 백팩에서 가장 약한 영웅과 새 영웅 중 약한 쪽을 버려요
            var weakest = bag.sort(function (a, b) { return power(data, a, levels[a], owned[a].star) - power(data, b, levels[b], owned[b].star); })[0];
            if (power(data, got, data.startLevel, 1) > power(data, weakest, levels[weakest], owned[weakest].star)) { delete owned[weakest]; delete levels[weakest]; }
            else { got = null; }
            recruits.dropped++;
          }
        }
        if (got) { kind = addHero(data, owned, got); if (kind === 'new') levels[got] = data.startLevel; recruits[kind]++; }
        log.push({ stage: stage, name: st.name, wall: st.wall, boss: st.boss, tries: tries, time: time, teamLv: team.map(function (x) { return x.level; }), battle: res.time, hpLeft: res.hpLeft, got: got, kind: kind, owned: Object.keys(owned).length });
        stage++; tries = 0;
        continue;
      }
      // 레벨업: 출전 영웅 중 가장 낮은 레벨부터, 살 수 있는 만큼
      var bought = 0;
      for (;;) {
        var lowest = team.slice().sort(function (a, b) { return levels[a.id] - levels[b.id]; })[0];
        var lv = levels[lowest.id]; if (lv >= data.levelCost.maxLevel) break;
        var cost = levelCost(data, lv); if (gold < cost) break;
        gold -= cost; levels[lowest.id]++; bought++;
        team = team.map(function (x) { x.level = levels[x.id]; return x; });
      }
      if (!bought) {
        // 방치 보상을 기다려요: 다음 레벨업 가격만큼 쌓일 때까지 (분당 골드 = idle.base × growth^깬 수)
        var low = team.slice().sort(function (a, b) { return levels[a.id] - levels[b.id]; })[0];
        var need = levelCost(data, levels[low.id]) - gold, perMin = C.idle.base * Math.pow(C.idle.growth, stage);
        var wait = Math.max(60, Math.ceil(need / perMin) * 60);
        gold += perMin * wait / 60; time += wait; idleTime += wait;
      }
    }
    return { cleared: stage, total: total, time: time, battleTime: battleTime, idleTime: idleTime, attempts: attempts, log: log, levels: levels, owned: owned, recruits: recruits };
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
    costCap: costCap, starMul: starMul, addHero: addHero, power: power };
  if (typeof module !== 'undefined') module.exports = api; else root.IdleEngine = api;
})(this);
