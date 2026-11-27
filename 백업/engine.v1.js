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
      return { uid: ++uid, id: h.id, name: h.name, h: h, side: side, slot: spec.slot, front: spec.slot < 2, level: lv,
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

    var result = null, fx = [];
    function step() {
      if (result) return;
      t += B.dt;
      var all = A.concat(E);
      for (var k = 0; k < all.length; k++) {
        var u = all[k]; if (!u.alive) continue;
        if (EN.perSec) u.energy = Math.min(B.energyMax, u.energy + EN.perSec * B.dt);
        ['taunt', 'slow', 'haste'].forEach(function (f) { if (u[f] > 0) u[f] = Math.max(0, u[f] - B.dt); });
        var speed = (1 + (u.haste > 0 ? u.hasteAmt : 0)) * (1 - (u.slow > 0 ? u.slowAmt : 0));
        u.timer -= B.dt * speed;
        if (u.timer > 0) continue;
        u.timer += u.interval;
        if (u.energy >= B.energyMax) { u.energy = 0; ultimate(u); }
        else { var tg = pickTarget(u); if (tg) { hurt(u, tg, 1); u.energy = Math.min(B.energyMax, u.energy + EN.onAttack); } }
        if (!alive(E).length) { result = 'win'; break; }
        if (!alive(A).length) { result = 'lose'; break; }
      }
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
  // 적 팀: 스테이지마다 다른 조합 (앞줄은 탱커·전사, 뒷줄은 나머지), 10번째는 보스
  function stageTeam(data, n) {
    var C = data.campaign, lv = Math.round(1 + n * C.levelStep + (C.walls.indexOf(n) >= 0 ? C.wallBonus : 0));
    var fronts = data.heroes.filter(function (h) { return h.role === 'tank' || h.role === 'warrior'; });
    var backs = data.heroes.filter(function (h) { return !(h.role === 'tank' || h.role === 'warrior'); });
    var pickF = [fronts[n % fronts.length], fronts[(n * 3 + 1) % fronts.length]];
    if (pickF[0] === pickF[1]) pickF[1] = fronts[(n + 2) % fronts.length];
    var pickB = [backs[n % backs.length], backs[(n * 2 + 3) % backs.length], backs[(n * 5 + 1) % backs.length]];
    for (var i = 1; i < 3; i++) while (pickB.slice(0, i).indexOf(pickB[i]) >= 0) pickB[i] = backs[(backs.indexOf(pickB[i]) + 1) % backs.length];
    var em = C.enemyMul * Math.min(1, C.earlyMul + n * C.earlyRamp); // 초반 적은 약하게 시작해서 점점 원래 세기로
    var m = { hp: em, atk: em }, boss = (n + 1) % C.perChapter === 0;
    var team = [
      { id: pickF[0].id, level: lv, slot: 0, mul: boss ? { hp: C.bossHp * em, atk: C.bossAtk * em } : m, boss: boss },
      { id: pickF[1].id, level: lv, slot: 1, mul: m },
      { id: pickB[0].id, level: lv, slot: 2, mul: m }, { id: pickB[1].id, level: lv, slot: 3, mul: m }, { id: pickB[2].id, level: lv, slot: 4, mul: m }
    ];
    return { n: n, name: stageName(data, n), level: lv, boss: boss, wall: C.walls.indexOf(n) >= 0, team: team };
  }
  function levelCost(data, lv) { return Math.round(data.levelCost.base * Math.pow(data.levelCost.growth, lv - 1)); }
  function power(data, id, lv) { var h = heroById(data, id), g = 1 + data.growth.perLevel * (lv - 1); return Math.sqrt(h.hp * g * h.atk * g / h.interval); }

  // 봇의 편성: 앞줄 = 탱커·전사 중 힘 센 2명, 뒷줄 = 나머지 중 힘 센 3명
  // (같은 편성 규칙으로 요소만 바꿔 비교하려고 일부러 단순하게)
  function autoFormation(data, levels) {
    var ids = Object.keys(levels).sort(function (a, b) { return power(data, b, levels[b]) - power(data, a, levels[a]); });
    var isFront = function (id) { var r = heroById(data, id).role; return r === 'tank' || r === 'warrior'; };
    var front = ids.filter(isFront).slice(0, 2), back = ids.filter(function (id) { return !isFront(id); }).slice(0, 3);
    // 탱커가 있으면 반드시 앞줄에 1명
    var tank = ids.filter(function (id) { return heroById(data, id).role === 'tank'; })[0];
    if (tank && front.indexOf(tank) < 0) front[1] = tank;
    return front.map(function (id, i) { return { id: id, level: levels[id], slot: i }; })
      .concat(back.map(function (id, i) { return { id: id, level: levels[id], slot: 2 + i }; }));
  }

  // 봇 진행: 도전 → 지면 편성 5명을 고르게 레벨업 → 돈이 없으면 방치 보상을 기다림 → 다시 도전
  function campaign(data, opts) {
    opts = opts || {};
    var C = data.campaign, levels = {}, gold = 0, time = 0, stage = 0, tries = 0, total = stageCount(data), maxT = (opts.maxHours || 48) * 3600;
    data.heroes.forEach(function (h) { levels[h.id] = data.startLevel; });
    var log = [], attempts = 0, battleTime = 0, idleTime = 0, seed = (opts.seed || 1) * 7919;
    while (stage < total && time < maxT) {
      var team = autoFormation(data, levels), st = stageTeam(data, stage);
      var res = battle(data, team, st.team, { seed: seed + attempts * 31, modules: opts.modules });
      attempts++; tries++; time += res.time; battleTime += res.time;
      if (res.win) {
        var reward = Math.round(C.reward.base * Math.pow(C.reward.growth, stage));
        gold += reward;
        log.push({ stage: stage, name: st.name, wall: st.wall, boss: st.boss, tries: tries, time: time, teamLv: team.map(function (x) { return x.level; }), battle: res.time, hpLeft: res.hpLeft });
        stage++; tries = 0;
        continue;
      }
      // 레벨업: 편성 5명 중 가장 낮은 레벨부터, 살 수 있는 만큼
      var bought = 0;
      for (;;) {
        var lowest = team.slice().sort(function (a, b) { return levels[a.id] - levels[b.id]; })[0];
        var lv = levels[lowest.id]; if (lv >= data.levelCost.maxLevel) break;
        var cost = levelCost(data, lv); if (gold < cost) break;
        gold -= cost; levels[lowest.id]++; bought++;
        team = team.map(function (x) { return { id: x.id, level: levels[x.id], slot: x.slot }; });
      }
      if (!bought) {
        // 방치 보상을 기다려요: 다음 레벨업 가격만큼 쌓일 때까지 (분당 골드 = idle.base × growth^깬 수)
        var low = team.slice().sort(function (a, b) { return levels[a.id] - levels[b.id]; })[0];
        var need = levelCost(data, levels[low.id]) - gold, perMin = C.idle.base * Math.pow(C.idle.growth, stage);
        var wait = Math.max(60, Math.ceil(need / perMin) * 60);
        gold += perMin * wait / 60; time += wait; idleTime += wait;
      }
    }
    return { cleared: stage, total: total, time: time, battleTime: battleTime, idleTime: idleTime, attempts: attempts, log: log, levels: levels };
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
    campaign: campaign, compare: compare, levelCost: levelCost, heroById: heroById, makeRng: makeRng };
  if (typeof module !== 'undefined') module.exports = api; else root.IdleEngine = api;
})(this);
