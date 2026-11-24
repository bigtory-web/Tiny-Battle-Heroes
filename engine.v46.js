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
      var AR = B.arena, p0 = AR.pos[spec.slot] || AR.pos[0];
      return { uid: ++uid, id: h.id, name: h.name, h: h, side: side, slot: spec.slot, front: spec.slot < 2 || h.mob === 'goblin' || h.mob === 'chest', level: lv,
        x: spec.x != null ? spec.x : (side === 'A' ? p0[0] : AR.w - p0[0]), y: spec.y != null ? spec.y : p0[1], face: side === 'A' ? 1 : -1, moving: false, tgt: null,
        reach: AR.reach[h.range], spd: AR.speed[h.range],
        maxHp: hp, hp: hp, atk: h.atk * g * (m.atk || 1), def: h.def * g, interval: h.interval, range: h.range, el: h.el,
        energy: SE.value, timer: rand() * B.startJitter, alive: true, shield: 0, taunt: 0, slow: 0, slowAmt: 0, haste: 0, hasteAmt: 0,
        grade: h.grade || 1, ultLv: 0, pasLv: 0, uk: 1, pas: null, pv: 0, crit: critChance(data, h),
        boss: !!spec.boss, merc: !!spec.merc, stats: { dealt: 0, taken: 0, healed: 0, ults: 0 } };
    }
    var A = ally.map(function (s) { return makeUnit(s, 'A'); }), E = enemy.map(function (s) { return makeUnit(s, 'E'); });
    // 영웅 효과 2개: 궁극기·패시브. 레벨 = spec.ultLv / spec.pasLv (없으면 등급 기본 레벨). 성급은 능력치만 올려요
    var GE = data.gradeEffects || { 1: { ult: 1, pas: 1 }, ultPer: 0.25, pasPer: 0.5, maxLv: 5 };
    A.concat(E).forEach(function (u, i) { var spec = i < A.length ? ally[i] : enemy[i - A.length], base = GE[u.grade] || GE[1] || { ult: 1, pas: 0 };
      var TRD = data.transcend || {}, lvCap = Math.max(GE.maxLv || 5, TRD.enabled ? TRD.maxLv || 5 : 0);
      u.ultLv = Math.min(lvCap, spec.ultLv || base.ult);
      // 초월 추가 스킬: spec.extra = [{ from: 영웅 id, lv }]. 그 영웅의 궁극기를 그 레벨 위력으로 함께 써요
      u.extra = (spec.extra || []).map(function (e) { var hh = heroById(data, e.from); return hh && hh.ult ? { from: e.from, ult: hh.ult, el: hh.el, lv: e.lv, k: 1 + (GE.ultPer || 0) * (Math.min(lvCap, e.lv) - 1) } : null; }).filter(Boolean); u.pasLv = u.h.passive ? Math.min(GE.maxLv || 5, spec.pasLv != null ? spec.pasLv : base.pas) : 0;
      u.uk = 1 + (GE.ultPer || 0) * (u.ultLv - 1);
      if (u.pasLv > 0) { u.pas = u.h.passive; u.pv = u.pas.v * (1 + (GE.pasPer || 0) * (u.pasLv - 1)); } });
    // 시작할 때 걸리는 패시브
    A.concat(E).forEach(function (u) { if (!u.pas) return; var k = u.pas.kind;
      if (k === 'shieldStart') u.shield += u.maxHp * u.pv;
      else if (k === 'energyStart') u.energy = Math.min(B.energyMax, u.energy + u.pv);
      else if (k === 'haste') u.interval /= 1 + u.pv;
      else if (k === 'auraAtk') (u.side === 'A' ? A : E).forEach(function (x) { x.atk *= 1 + u.pv; }); });
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
    function atkOf(u) { var a = u.atk; if (u.pas && u.pas.kind === 'rage' && u.hp / u.maxHp < 0.5) a *= 1 + u.pv; if (u.buffT > 0) a *= 1 + u.buffAmt; if (u.stkAtk) a *= 1 + u.stkAtk; return a; }

    function nearGoblin(u, F) { return (F || alive(foes(u))).filter(function (x) { return x.h.mob === 'goblin' && dist(u, x) <= u.reach * 1.2; })[0] || null; }
    // 공격 대상 고르기
    function pickTarget(u) {
      var F = alive(foes(u)); if (!F.length) return null;
      var tauntU = F.filter(function (x) { return x.taunt > 0; }); if (tauntU.length) return tauntU[0];
      var gob = nearGoblin(u, F); if (gob) return gob; // 돈고블린이 사거리 근처에 있으면 먼저 노려요
      if (TG === 'near') return F.reduce(function (m, x) { return dist(u, x) < dist(u, m) ? x : m; }); // 실제로 가장 가까운 적 (앞에 선 유닛이 먼저 맞아요)
      if (TG === 'lowest') return F.reduce(function (m, x) { return x.hp / x.maxHp < m.hp / m.maxHp ? x : m; });
      if (TG === 'random') return F[Math.floor(rand() * F.length)];
      var front = F.filter(function (x) { return x.front; }), pool = front.length ? front : F;
      if (TG === 'lane') { // 마주 보는 자리(같은 칸 번호)가 살아 있으면 그쪽
        var same = pool.filter(function (x) { return x.slot === u.slot || (u.slot >= 2 && x.slot === u.slot - 2); });
        if (same.length) return same[0];
      }
      return pool.reduce(function (m, x) { return x.slot < m.slot ? x : m; });
    }

    var magic = false, burning = false; // 지금 피해가 스킬(궁극기·팀 스킬)에서 나왔는지: 로그 hit.mag로 화면이 평타와 색을 구분해요
    function hurt(src, dst, mul) {
      if (!dst.alive) return 0;
      var crit = !burning && rand() < (src.crit || 0) + (src.pas && src.pas.kind === 'crit' ? src.pv : 0); if (crit) mul *= (data.crit && data.crit.mul) || 2; // 화상 틱은 치명타 없음
      if (B.enrage && t > B.enrage.at) mul *= 1 + B.enrage.perSec * (t - B.enrage.at); // 광폭화: 오래 끌면 양쪽 피해가 점점 커져요
      var dmg = atkOf(src) * mul * (1 - dst.def / (dst.def + B.defK)) * elemMul(src, dst);
      var absorbed = Math.min(dst.shield, dmg); dst.shield -= absorbed; dmg -= absorbed;
      dst.hp -= dmg; src.stats.dealt += dmg + absorbed; dst.stats.taken += dmg + absorbed;
      if (EN.onHitScale) dst.energy = Math.min(B.energyMax, dst.energy + (dmg / dst.maxHp) * EN.onHitScale);
      if (dst.hp <= 0) { dst.hp = 0; dst.alive = false; if (EN.onKill) src.energy = Math.min(B.energyMax, src.energy + EN.onKill);
        if (rec) log.push({ t: t, kind: 'die', uid: dst.uid }); }
      if (rec) log.push({ t: t, kind: 'hit', from: src.uid, to: dst.uid, amt: Math.round(dmg + absorbed), crit: crit || undefined, mag: magic || undefined, burn: burning || undefined });
      if (src.pas && src.pas.kind === 'lifesteal' && src.alive && dmg > 0) heal(src, src, dmg * src.pv);
      if (dst.pas && dst.pas.kind === 'thorns' && src.range === 'melee' && src.alive && dmg + absorbed > 0) { var rf = (dmg + absorbed) * dst.pv; src.hp -= rf; dst.stats.dealt += rf; src.stats.taken += rf;
        if (rec) log.push({ t: t, kind: 'skillHit', to: src.uid, amt: Math.round(rf), thorns: true });
        if (src.hp <= 0) { src.hp = 0; src.alive = false; if (rec) log.push({ t: t, kind: 'die', uid: src.uid }); } }
      if (ultSrc === src && ultEl && !burning) { ultHit = true; elemHit(src, dst, dmg, ultEl); }
      return dmg;
    }
    function heal(src, dst, amt) {
      if (!dst.alive) return;
      if (HD.pick === 'on') amt *= Math.max(HD.o.minMul, 1 - (t / B.timeLimit) * (1 - HD.o.minMul));
      var real = Math.min(amt, dst.maxHp - dst.hp); dst.hp += real; src.stats.healed += real;
      if (rec) log.push({ t: t, kind: 'heal', from: src.uid, to: dst.uid, amt: Math.round(real) });
    }

    // 속성 효과는 스킬(궁극기)에 붙어요: 스킬이 맞힌 적마다 생기고, 아무도 안 맞히는 스킬이면 가장 가까운 적(불·얼음·어둠) 또는 자기 편(숲·빛)에 한 번 생겨요
    var ultSrc = null, ultEl = null, ultHit = false;
    function ultimate(u, ult0, k0, el) { var ps = ultSrc, pe = ultEl, ph = ultHit; ultSrc = u; ultEl = el || u.el; ultHit = false;
      ultimate0(u, ult0, k0);
      if (!ultHit && u.alive) { var e0 = ultEl; if (e0 === 'forest' || e0 === 'light') elemHit(u, null, atkOf(u), e0); else { var nt = pickTarget(u); if (nt) elemHit(u, nt, atkOf(u), e0); } }
      ultSrc = ps; ultEl = pe; ultHit = ph; }
    function ultimate0(u, ult0, k0) {
      magic = true; var U0 = ult0 || u.h.ult, k = k0 || u.uk || 1, U = {}; for (var q in U0) U[q] = U0[q]; if (U.mul) U.mul *= k; if (U.shieldPct) U.shieldPct *= k; if (U.amount) U.amount *= k; // 궁극기 레벨만큼 세져요
      var F = alive(foes(u)), T = alive(team(u.side)); u.stats.ults++;
      if (rec) log.push({ t: t, kind: 'ult', uid: u.uid, ult: U.kind });
      switch (U.kind) {
        case 'taunt': u.taunt = U.dur; u.shield += u.maxHp * U.shieldPct; break;
        case 'teamShield': T.forEach(function (x) { x.shield += atkOf(u) * U.mul; }); break;
        case 'strike': { var tg = pickTarget(u); if (tg) hurt(u, tg, U.mul); break; }
        case 'multi': for (var i = 0; i < U.hits; i++) { var tg2 = pickTarget(u); if (tg2) hurt(u, tg2, U.mul); } break;
        case 'backstab': { var back = TG === 'near' ? F.slice().sort(function (a, b) { return dist(u, b) - dist(u, a); }).slice(0, Math.max(1, F.length - 2)) : F.filter(function (x) { return !x.front; }), pool = back.length ? back : F; // 가까운 2명을 뺀 뒤쪽
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
      var def = skillById(data, s.id); return { def: def, side: side, lv: s.level || 1, mul: 1 + (SK.gradeUp ? SK.perGrade : SK.perLevel) * ((s.level || 1) - 1), timer: def.cd * SK.firstAt, fired: 0 }; }); }
    var skills = mkSkills(opts.skills, 'A'), enemySkills = mkSkills(opts.enemySkills, 'E'), allSkills = skills.concat(enemySkills);
    // ───── 연계 스킬(def.trigger): 쿨타임 없이, 조건(tag)에 맞는 아군에게 그 일이 생길 때마다 공격력이 쌓여요(최대 max번, 그 전투 동안) ─────
    // trigger: 'attack'(평타) | 'burn'(화상 피해) | 'haste'(숲 가속) | 'heal'(빛 회복) | 'chill'(얼음 둔화) | 'stun'(어둠 기절). to: 'self'(일으킨 영웅) | 'tag'(조건 맞는 아군 모두)
    function trig(kind, u) { for (var i = 0; i < allSkills.length; i++) { var sk = allSkills[i], d = sk.def; if (d.trigger !== kind || sk.side !== u.side) continue;
        var T = alive(team(u.side)), ok = tagMatch(d.tag, T); if (!ok(u)) continue;
        (d.to === 'self' ? [u] : T.filter(ok)).forEach(function (x) { x.stk = x.stk || {}; if ((x.stk[d.id] || 0) >= d.max) return; x.stk[d.id] = (x.stk[d.id] || 0) + 1; x.stkAtk = (x.stkAtk || 0) + d.amount * sk.mul; });
        sk.fired++; } }
    // ───── 속성 고유 효과(data.elementFx): 그 속성 영웅의 평타가 맞으면 늘 생겨요 ─────
    var EFX = data.elementFx || {};
    function elemHit(u, tg, dmg, el) { el = el || u.el; var F = EFX[el]; if (!F) return; if (!tg && el !== 'forest' && el !== 'light') return;
      if (el === 'fire') { tg.burn = { src: u, left: F.dur, tick: 1 }; }
      else if (el === 'forest') { u.fst = Math.min(F.max, (u.fst || 0) + 1); u.fstT = F.dur; trig('haste', u); }
      else if (el === 'water' && tg.alive) { tg.chill = F.dur; tg.chillAmt = F.slow; if (rec) log.push({ t: t, kind: 'fx', fx: 'chill', uid: tg.uid }); trig('chill', u); }
      else if (el === 'light' && dmg > 0) { var lo = alive(team(u.side)).sort(function (a, b) { return a.hp / a.maxHp - b.hp / b.maxHp; })[0]; if (lo) { heal(u, lo, dmg * F.heal); trig('heal', u); } }
      else if (el === 'dark' && tg.alive && rand() < F.chance) { tg.stun = Math.max(tg.stun || 0, F.dur); if (rec) log.push({ t: t, kind: 'fx', fx: 'stun', uid: tg.uid }); trig('stun', u); } }
    function elemTick(x) { // 매 프레임: 화상 피해(1초마다), 숲 가속·얼음 둔화 시간
      if (x.burn) { x.burn.left -= B.dt; x.burn.tick -= B.dt; if (x.burn.tick <= 0) { x.burn.tick += 1; var bs = x.burn.src; magic = burning = true; hurt(bs, x, EFX.fire.mul); magic = burning = false; if (bs.alive) trig('burn', bs); }
        if (x.burn.left <= 0 || !x.alive) x.burn = null; }
      if (x.fstT > 0) { x.fstT -= B.dt; if (x.fstT <= 0) x.fst = 0; }
      if (x.chill > 0) x.chill = Math.max(0, x.chill - B.dt); }
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
    function fireSkill(sk) { magic = true;
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
        var a = all[i], b = all[j]; if (!a.alive || !b.alive) continue;
        var need = a.side === b.side ? AR.spacing : (AR.spacingFoe || AR.spacing * 0.8), d = dist(a, b);
        if (d >= need) continue;
        var nx = d > 0.01 ? (a.x - b.x) / d : 0, ny = d > 0.01 ? (a.y - b.y) / d : (i % 2 ? 1 : -1), push = (need - d) / 2;
        if (a.side !== b.side) { // 상대끼리: 공격으로 밀리지 않게, 움직이던 쪽만 물러나요 (둘 다 서 있으면 그대로)
          var wa = a.moving && !b.moving ? 2 : a.moving && b.moving ? 1 : 0, wb = b.moving && !a.moving ? 2 : a.moving && b.moving ? 1 : 0;
          a.x += nx * push * wa; a.y += ny * push * wa; b.x -= nx * push * wb; b.y -= ny * push * wb; continue; }
        a.x += nx * push; a.y += ny * push; b.x -= nx * push; b.y -= ny * push;
      }
      all.forEach(function (u) {
        u.x = Math.max(36, Math.min(AR.w - 36, u.x)); // 그림(2배, 폭 72)이 화면 밖으로 잘리지 않게
        u.y = Math.max(AR.yMin, Math.min(AR.yMax, u.y)); // 땅 띠 안에서만 움직여요
      });
    }
    function step() {
      if (result) return;
      t += B.dt;
      var all = A.concat(E);
      for (var si = 0; si < allSkills.length; si++) { var sk = allSkills[si]; if (sk.def.trigger) continue; sk.timer -= B.dt; if (sk.timer <= 0) { sk.timer += sk.def.cd; fireSkill(sk); } }
      if (!alive(E).length) result = 'win'; else if (!alive(A).length) result = 'lose';
      for (var k = 0; k < all.length && !result; k++) {
        var u = all[k]; if (!u.alive) continue;
        if (EN.perSec) u.energy = Math.min(B.energyMax, u.energy + EN.perSec * B.dt);
        if (u.pas && u.pas.kind === 'auraRegen') alive(team(u.side)).forEach(function (x) { if (x.hp < x.maxHp) heal(u, x, x.maxHp * u.pv * B.dt); });
        ['taunt', 'slow', 'haste', 'buffT', 'stun'].forEach(function (f) { if (u[f] > 0) u[f] = Math.max(0, u[f] - B.dt); });
        elemTick(u); if (!u.alive) { if (!alive(E).length) { result = 'win'; break; } if (!alive(A).length) { result = 'lose'; break; } continue; }
        var speed = (1 + (u.haste > 0 ? u.hasteAmt : 0) + (u.fst ? u.fst * EFX.forest.per : 0)) * (1 - (u.slow > 0 ? u.slowAmt : 0)) * (1 - (u.chill > 0 ? u.chillAmt : 0));
        if (u.stun > 0) { u.moving = false; continue; } // 넉백으로 잠깐 멈춤
        if (u.h.mob === 'chest') { // 보물상자: 아무것도 안 해요. dur초가 지나면 사라져요(그때까지 입힌 피해로 보상)
          u.age = (u.age || 0) + B.dt; u.moving = false;
          if (u.age >= data.events.chest.dur) { u.alive = false; u.escaped = true; if (rec) log.push({ t: t, kind: 'escape', uid: u.uid });
            if (!alive(E).length) { result = 'win'; break; } }
          continue; }
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
        // 대상: 없거나 죽었거나, 상대에 도발이 걸렸으면 다시 골라요
        var taunting = alive(foes(u)).some(function (x) { return x.taunt > 0; });
        if (!u.tgt || !u.tgt.alive || (taunting && !(u.tgt.taunt > 0)) || (!taunting && u.tgt.h.mob !== 'goblin' && nearGoblin(u))) u.tgt = pickTarget(u);
        var tg = u.tgt;
        if (!tg) { // 칠 수 있는 적이 없으면 가장 가까운 적 쪽으로 다가가요
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
        var ultReady = !!u.h.ult && u.energy >= B.energyMax; // 몹은 궁극기가 없어요
        if (!inReach && !(ultReady && SELF_ULT[u.h.ult.kind])) continue; // 사거리 밖이면 다가가기만 해요
        u.timer += u.interval;
        if (ultReady) { u.energy = 0; ultimate(u); (u.extra || []).forEach(function (e) { if (u.alive) ultimate(u, e.ult, e.k, e.el); }); } // 초월 추가 스킬도 함께 써요
        else { if (TG === 'lowest' || TG === 'random') { var nt = pickTarget(u); if (nt && dist(u, nt) <= u.reach) tg = u.tgt = nt; }
          magic = false; hurt(u, tg, 1); trig('attack', u); u.energy = Math.min(B.energyMax, u.energy + EN.onAttack);
          if (u.pas && u.pas.kind === 'splash') alive(foes(u)).forEach(function (x) { if (x !== tg && dist(x, tg) <= 70) hurt(u, x, u.pv); }); }
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
      units: A.concat(E).map(function (x) { return { side: x.side, id: x.id, name: x.name, slot: x.slot, level: x.level, alive: x.alive, ultLv: x.ultLv, pasLv: x.pasLv, escaped: !!x.escaped, mob: x.h.mob || null, merc: !!x.merc, boss: !!x.boss,
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
  // 보스 판: 장 안 번호(1부터)가 campaign.bossAt에 있으면. 없으면 장 마지막 판
  function isBoss(data, n) { var C = data.campaign, i = n % C.perChapter + 1; return (C.bossAt || [C.perChapter]).indexOf(i) >= 0; }
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
  // 이벤트 스테이지(전투 대신 들르는 판): 스테이지 수를 쓰지 않고 n과 n+1 사이(n.5)에 들어가요
  function isEventStage(data, kind) { var K = (data.events && data.events.stageKinds) || ['campfire', 'merchant', 'chest']; return K.indexOf(kind) >= 0 && !(kind === 'merchant' && !merchantNoBattle(data)); }
  // opts.battleOnly: 이벤트 스테이지는 빼고 굴려요 (이벤트 스테이지를 들른 뒤 그 스테이지 전투, 또는 다시 도전할 때)
  function rollEvent(data, n, rnd, plv, opts) {
    var V = data.events; if (!V) return null;
    // forceEvery: N이면 스테이지 N개마다(n % N === 0) 이벤트 스테이지가 100% 나와요 (도구용, 0이면 꺼짐). 보스 앞도 나와요
    var force = !(opts && opts.battleOnly) && V.forceEvery > 0 && n > 0 && n % V.forceEvery === 0;
    if (!force && (n < V.from || isBoss(data, n) || rnd() >= V.chance)) return null;
    var keys = Object.keys(V.weights).filter(function (k) { return (V.off || []).indexOf(k) < 0; }).filter(function (k) { return force ? isEventStage(data, k) : !(opts && opts.battleOnly && isEventStage(data, k)); }), tot = 0; keys.forEach(function (k) { tot += V.weights[k]; });
    if (!keys.length || tot <= 0) return null; var r = rnd() * tot, kind = keys[0]; for (var i = 0; i < keys.length; i++) { r -= V.weights[keys[i]]; if (r < 0) { kind = keys[i]; break; } }
    var ev = { kind: kind };
    if (kind === 'merc') { ev.id = pickHeroByGrade(data, rnd, plv); ev.price = mercPrice(data, ev.id, n); }
    if (kind === 'mobs') rollMobs(data, n, rnd, plv, ev);
    if (kind === 'campfire') { ev.ids = rollCampfire(data, rnd, plv); ev.bonus = ev.ids.map(function (id) { return heroBonus(data, id, n, rnd, plv); }); }
    return ev;
  }
  // 몹 무리: drops가 있는 몹 1마리를 뽑고, 그 몹의 drops 칸을 실제 물건 키로 정해요 (ev.ids = [id], ev.drops = 칸 키들)
  function rollMobs(data, n, rnd, plv, ev) { var M = (data.mobs || []).filter(function (m) { return m.drops && m.drops.length; }), MB = data.events.mobs || {}, rew = stageReward(data, n, 0, null);
    ev.ids = []; ev.drops = []; if (!M.length) return ev; var m = M[Math.floor(rnd() * M.length)], got = []; ev.ids.push(m.id);
    m.drops.forEach(function (k) { var sid = k === 's' ? rollScroll(data, rnd, plv, got) : null; if (sid) got.push({ id: sid, level: 1 });
      ev.drops.push(k === 'm' ? 'm:' + (MB.mana || 1) : sid ? 's:' + sid : 'g:' + Math.max(1, Math.round(rew * (MB.gold || 0.5) * (0.7 + rnd() * 0.6)))); });
    return ev; }
  // 몹 무리 전리품 칸: 몹을 쓰러뜨렸으면(units: 전투 결과) 그 몹의 drops 칸 전부, 아니면 빈 배열. units가 없으면 전부
  function mobLoot(st, units) { var dead = !units || units.some(function (x) { return x.side === 'E' && x.mob && !x.alive; }); return dead && st.event ? st.event.drops.slice() : []; }
  // 모닥불: 영웅 count명이 둘러앉아 있어요. 말풍선을 누르면 룰렛이 돌아 그중 1명이 동료가 돼요(전투 없음). 등급은 플레이어 레벨 확률(atStart면 레벨 1 확률)
  function rollCampfire(data, rnd, plv) { var CF = data.events.campfire, out = []; for (var i = 0; i < CF.count; i++) out.push(pickHeroByGrade(data, rnd, plv || 1, out)); return out; }
  // 이벤트 스테이지 이름: 스테이지 n 전에 들르면 앞 스테이지 이름 + '.5' (1-1과 1-2 사이 = 1-1.5). 맨 처음(시작 모닥불)은 '1-0.5'
  function eventStageName(data, n) { if (n <= 0) return '1-0.5'; return stageName(data, n - 1) + '.5'; }
  function campfireAtStart(data) { var CF = data.events && data.events.campfire; return !!(CF && CF.atStart) && (data.events.off || []).indexOf('campfire') < 0; }
  function mercPrice(data, id, n) { return Math.round(data.events.merc.price * heroGrade(data, id) * Math.pow(data.shop.priceGrowth, n)); } // 등급이 높을수록 비싸요
  // 방랑상인 진열: [{ type: 's'|'h', id, gold, mana, price, cur: 'gold'|'mana' }]. 값은 원래 값 × discount, 최소 minPrice (재화는 하나만)
  // owned(가진 스킬)를 주면 가진 스킬은 등급업 값으로 쳐요. price는 그 재화의 값이에요
  function merchantPrice(data, v) { var M = data.events.merchant, d = M.discount != null ? M.discount : (M.priceMul || 1); return v > 0 ? Math.max(M.minPrice || 1, Math.round(v * d)) : 0; }
  function rollMerchant(data, n, rnd, plv, owned) { var M = data.events.merchant, out = [];
    var sk = skillPool(data).filter(function (x) { return (x.grade || 1) >= M.minGrade && canTake(data, owned || [], x.id, 999); }).map(function (x) { return x.id; });
    for (var i = 0; i < M.skills && sk.length; i++) { var id = sk.splice(Math.floor(rnd() * sk.length), 1)[0], bp = skillBuyPrice(data, id, n, owned || []), g = merchantPrice(data, bp.gold), mn = bp.gold > 0 ? 0 : merchantPrice(data, bp.mana);
      out.push({ type: 's', id: id, gold: g, mana: mn, price: g || mn, cur: g ? 'gold' : 'mana' }); }
    var gotH = [];
    for (var j = 0; j < M.heroes; j++) { var hid = pickHeroByGrade(data, rnd, (plv || 1) + 2, gotH), hp = merchantPrice(data, M.heroPrice * heroGrade(data, hid) * Math.pow(data.shop.priceGrowth, n)); gotH.push(hid);
      out.push({ type: 'h', id: hid, gold: hp, mana: 0, price: hp, cur: 'gold' }); } // 상인은 레벨 +2 확률로 조금 더 좋은 영웅
    return out; }
  function merchantNoBattle(data) { var M = data.events && data.events.merchant; return !!(M && M.battle === false); }
  // 보물상자 보상: frac = 입힌 피해 / 최대 체력(0~1), bell = 울린 횟수. 반환 { tier(넘은 칸 수), gold, mana, scroll(두루마리 개수), next(다음 칸 at, 없으면 null) }
  function chestReward(data, n, bell, frac) { var CH = data.events.chest, CB = CH.bell || {}, mul = 1 + (CB.reward || 0) * (bell || 0), base = stageReward(data, n, 0, null), out = { tier: 0, gold: 0, mana: 0, scroll: 0, next: null };
    CH.tiers.forEach(function (T) { if (frac + 1e-9 >= T.at) { out.tier++; out.gold += (T.gold || 0) * base * mul;
        if (T.mana) out.mana += Math.max(T.mana, Math.floor(T.mana * mul)); if (T.scroll) out.scroll += Math.max(T.scroll, Math.floor(T.scroll * mul)); }
      else if (out.next == null) out.next = T.at; });
    out.gold = Math.round(out.gold); return out; }
  // 두루마리 1장: 상점 등급 확률로 스킬 하나 (가질 수 있는 것 중에서)
  function rollScroll(data, rnd, plv, owned) { var ids = rollShop(data, rnd, plv, owned || []); return ids.length ? ids[Math.floor(rnd() * ids.length)] : null; }
  // 이 스테이지에서 울릴 수 있는 최대 횟수: 전장 빈자리만큼 (적이 이미 5명이면 0)
  // ev: 그 판 이벤트. 용병은 적 1명을 차지하니 빈자리에서 빼요
  function bellMax(data, n, ev) { return data.bell ? data.bell.max : 0; } // 어느 판이든 max번 (적은 5명을 넘어도 돼요)
  // 스테이지 n(0부터)의 적 레벨. levelStep이 숫자면 스테이지마다 그만큼, 배열이면 챕터별 오름폭 [1장, 2장, 3장]
  function stageLevel(data, n) { var C = data.campaign, S = C.levelStep, lv = 1;
    if (typeof S === 'number') lv += n * S; else for (var i = 0; i < n; i++) lv += S[Math.min(Math.floor(i / C.perChapter), S.length - 1)];
    return Math.round(lv + (C.walls.indexOf(n) >= 0 ? C.wallBonus : 0)); }
  function stageTeam(data, n, ev, bell, plv) { plv = plv || 1; bell = Math.max(0, Math.min(bell || 0, bellMax(data, n, ev)));
    var C = data.campaign, R = data.recruit, lv = stageLevel(data, n);
    var mercN = ev && ev.kind === 'merc' ? 1 : 0, base = fromTable(R.enemyCount, n), cnt = Math.min(R.fieldSlots, base + mercN) - mercN + (data.bell ? data.bell.enemy * bell : 0), rnd = makeRng(n * 977 + 13 + plv * 7919);
    // 적 영웅: 플레이어 레벨의 등급 확률(player.heroGrade)로 한 명씩 뽑아요. 같은 스테이지·레벨이면 늘 같은 적, 종으로 늘어난 적은 뒤에 붙어요
    var picks = []; for (var pi = 0; pi < cnt; pi++) picks.push(pickHeroByGrade(data, rnd, plv, picks));
    var em = C.enemyMul * Math.min(1, C.earlyMul + n * C.earlyRamp); // 초반 적은 약하게 시작해서 점점 원래 세기로
    var m = { hp: em, atk: em }, boss = isBoss(data, n);
    // 자리: 뽑힌 순서대로 차례로 앉혀요(종으로 적이 늘어도 먼저 있던 적의 자리가 안 바뀌게). 용병은 늘 4번 자리
    var usedSlots = mercN ? [4] : [], team = picks.map(function (id) { var order = isFrontRole(heroById(data, id)) ? [0, 1, 2, 3, 4, 5, 6, 7] : [2, 3, 4, 0, 1, 5, 6, 7];
      var s = order.filter(function (q) { return usedSlots.indexOf(q) < 0; })[0]; usedSlots.push(s); return { id: id, level: lv, slot: s, mul: m }; });
    if (boss) { var b = team.reduce(function (x, y) { return y.slot < x.slot ? y : x; }); b.boss = true; b.mul = { hp: C.bossHp * em, atk: C.bossAtk * em }; }
    var ES = C.enemySkills, ecount = 0, eskills = [];
    if (ES) { ES.table.forEach(function (x) { if (n >= x.from) ecount = x.count; }); if (boss && ecount) ecount += ES.bossExtra || 0;
      var sids = skillPool(data).map(function (x) { return x.id; }), rndS = makeRng(n * 977 + 29 + plv * 7919); // 적 스킬은 따로 굴려요: 종으로 적이 늘어도 스킬이 바뀌지 않게
      for (var k = sids.length - 1; k > 0; k--) { var r2 = Math.floor(rndS() * (k + 1)), t2 = sids[k]; sids[k] = sids[r2]; sids[r2] = t2; }
      eskills = sids.slice(0, Math.min(ecount + (data.bell && data.bell.skill || 0) * bell, data.skills.slots)).map(function (id) { return { id: id, level: data.skills.gradeUp ? 1 : Math.min(data.skills.maxLevel, 1 + Math.floor(n / ES.levelEvery)) }; }); } // 적 스킬은 태생 등급 그대로
    if (ev && ev.kind === 'mobs') return { n: n, name: stageName(data, n), level: lv, boss: false, wall: false, skills: [], event: ev, bell: 0, // 몹 무리 판: 적 스킬·종 없음
      team: ev.ids.map(function (id) { var hm = (data.events.mobs || {}).hp || 1; return { id: id, level: lv, slot: 0, mul: { hp: em * hm, atk: em }, mob: true }; }) };
    if (ev && ev.kind === 'chest') { // 보물상자 판: 상자 1마리만, 적 스킬 없음. 종을 울릴 때마다 체력이 늘어요
      var CB = data.events.chest.bell || {}, hm = 1 + (CB.hp || 0) * bell;
      return { n: n, name: stageName(data, n), level: lv, boss: false, wall: false, team: [{ id: 'chest', level: lv, slot: 0, mul: { hp: em * hm, atk: 0 }, mob: true }], skills: [], event: ev, bell: bell }; }
    var rndB = makeRng(n * 977 + 41 + plv * 7919); team.forEach(function (u) { u.bonus = heroBonus(data, u.id, n, rndB, plv); }); // 따로 굴려요: 종으로 적이 늘어도 있던 덤은 그대로
    if (ev && ev.kind === 'goblin') team.push({ id: 'goblin', level: lv, slot: 4, mul: m, mob: true });
    if (mercN) team.push({ id: ev.id, level: lv, slot: 4, mul: m, merc: true });
    return { n: n, name: stageName(data, n), level: lv, boss: boss, wall: C.walls.indexOf(n) >= 0, team: team, skills: eskills, event: ev || null, bell: bell };
  }
  // 영웅 덤(2026-11-18): 이 영웅을 얻으면 같이 받는 보상. null | { type: 's', id }(유물) | { type: 'g'|'m', amt }. 등급이 낮을수록 잘 붙어요
  function heroBonus(data, id, n, rnd, plv) { var B = data.heroBonus; if (!B || rnd() >= (B.chance[heroGrade(data, id)] || 0)) return null;
    var K = B.kinds, tot = K.s + K.g + K.m, r = rnd() * tot;
    if (r < K.s) { var sid = rollScroll(data, rnd, plv, []); if (sid) return { type: 's', id: sid }; r = K.s; }
    if (r < K.s + K.g) return { type: 'g', amt: Math.max(1, Math.round(data.campaign.reward.base * Math.pow(data.campaign.reward.growth, n) * B.gold)) };
    return { type: 'm', amt: B.mana }; }
  // 상점·적·상인이 고를 수 있는 스킬 목록 (연계 스킬은 skills.triggerOn일 때만)
  function skillPool(data) { return data.skills.list.filter(function (x) { return !x.trigger || data.skills.triggerOn; }); }
  function skillById(data, id) { var L = data.skills.list; for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; }
  function skillPrice(data, id, cleared) { return Math.round(skillById(data, id).price * Math.pow(data.shop.priceGrowth, cleared)); }
  // 상점에서 이 스킬을 살 때 드는 마나스톤 (꺼져 있으면 0)
  // owned(가진 스킬 목록)를 주면, 이미 가진 스킬은 등급업한 뒤의 등급으로 쳐요
  function skillManaPrice(data, id, owned) { var MN = data.mana; if (!MN || !MN.enabled) return 0; var o = (owned || []).filter(function (x) { return x.id === id; })[0];
    return MN.skillCost[o ? Math.min(data.skills.maxGrade || 4, skillGradeNow(data, o) + 1) : skillGrade(data, id)] || 0; }
  // 상점 구매 가격 { gold, mana }. mana.exclusive면 둘 중 하나만 0이 아니에요 (희귀·전설은 마나스톤만, 나머지는 골드만)
  function skillBuyPrice(data, id, cleared, owned) { var mp = skillManaPrice(data, id, owned);
    if (mp > 0 && data.mana && data.mana.exclusive) return { gold: 0, mana: mp };
    return { gold: skillPrice(data, id, cleared), mana: mp }; }
  function refreshPrice(data, n) { return Math.round(data.shop.refresh * Math.pow(data.shop.refreshGrowth, n)); }
  // 상점 진열: 스킬 목록에서 겹치지 않게 stock개
  // plv(플레이어 레벨)를 주면 그 레벨의 등급 확률(player.shopGrade)로 등급을 먼저 뽑고, 그 등급 안에서 골라요
  // shop.rows가 있으면 두 줄 진열: 골드로 사는 물건 rows.gold개 + 마나스톤으로 사는 물건 rows.mana개 (반환 배열은 골드 줄이 앞)
  // owned(가진 스킬)를 주면 등급업 뒤 가격으로 줄을 나누고, 최고 등급인 스킬은 빼요
  function rollShop(data, rnd, plv, owned) { var SR = data.shop.rows; if (SR && data.mana && data.mana.enabled && data.mana.exclusive) return rollShopRows(data, rnd, plv, owned || []);
    var ids = skillPool(data).map(function (x) { return x.id; }), out = [], W = plv && data.player ? perk(data, plv).shopGrade : null;
    while (out.length < Math.min(data.shop.stock, ids.length) && ids.length) {
      var cand = ids;
      if (W) { var byG = {}; ids.forEach(function (id) { var g = skillGrade(data, id); (byG[g] = byG[g] || []).push(id); });
        var tot = 0, g2; for (g2 = 1; g2 <= 4; g2++) if (byG[g2]) tot += W[g2 - 1] || 0;
        if (tot > 0) { var r = rnd() * tot; for (g2 = 1; g2 <= 4; g2++) { if (!byG[g2]) continue; r -= W[g2 - 1] || 0; if (r < 0) { cand = byG[g2]; break; } } } }
      var id = cand[Math.floor(rnd() * cand.length)]; out.push(id); ids.splice(ids.indexOf(id), 1); } return out; }
  function rollShopRows(data, rnd, plv, owned) { var SR = data.shop.rows, W = plv && data.player ? perk(data, plv).shopGrade : null, out = [];
    var all = skillPool(data).map(function (x) { return x.id; }).filter(function (id) { return canTake(data, owned, id, 999); });
    function target(id) { var o = owned.filter(function (x) { return x.id === id; })[0]; return o ? Math.min(data.skills.maxGrade || 4, skillGradeNow(data, o) + 1) : skillGrade(data, id); }
    [["gold", false], ["mana", true]].forEach(function (row) { var pool = all.filter(function (id) { return (skillBuyPrice(data, id, 0, owned).mana > 0) === row[1]; });
      for (var k = 0; k < (SR[row[0]] || 0) && pool.length; k++) { var tot = 0, ws = pool.map(function (id) { var w = W ? (W[target(id) - 1] || 0) + 1 : 1; tot += w; return w; }), x = rnd() * tot, j = 0;
        while (j < pool.length - 1 && (x -= ws[j]) >= 0) j++; out.push(pool.splice(j, 1)[0]); } });
    return out; }
  // ───── 플레이어 레벨 ─────
  // xp(누적 경험치) → { level, cur(이번 레벨에서 쌓인 양), need(다음 레벨까지 필요한 양, 최고 레벨이면 0) }
  function playerLevel(data, xp) { var P = data.player, lv = 1, left = xp || 0;
    while (lv - 1 < P.need.length && left >= P.need[lv - 1]) { left -= P.need[lv - 1]; lv++; }
    return { level: lv, cur: lv - 1 < P.need.length ? left : 0, need: lv - 1 < P.need.length ? P.need[lv - 1] : 0, max: lv - 1 >= P.need.length }; }
  // 레벨 효과: { field 전장 칸, skillSlots 스킬 칸, shopGrade 등급 가중치 }
  function perk(data, lv) { var P = data.player, i = Math.max(0, Math.min((lv || 1) - 1, P.field.length - 1));
    return { field: P.field[i], skillSlots: P.skillSlots[i], shopGrade: P.shopGrade[Math.min(i, P.shopGrade.length - 1)] }; }
  // 살 수 있나: 새 스킬은 빈 칸이 있어야, 가진 스킬은 최고 레벨 전이어야
  function canTake(data, owned, id, slots) { var o = owned.filter(function (s) { return s.id === id; })[0]; return o ? o.level < skillMaxLevel(data, id) : owned.length < (slots || data.skills.slots); }
  function takeSkill(data, owned, id) { var o = owned.filter(function (s) { return s.id === id; })[0]; if (o) o.level++; else owned.push({ id: id, level: 1 }); }
  // 스킬 판매: 판매가 = 지금 상점가 × 레벨 × sellRate
  function skillSellPrice(data, s, cleared) { return Math.round(skillPrice(data, s.id, cleared) * (s.level || 1) * (data.shop.sellRate == null ? 0.5 : data.shop.sellRate)); }
  function sellSkill(data, owned, id) { for (var i = 0; i < owned.length; i++) if (owned[i].id === id) return owned.splice(i, 1)[0]; return null; }
  function skillGrade(data, id) { return skillById(data, id).grade || 1; } // 태생 등급
  // 등급업: s = { id, level }. level 1이 태생 등급, 1 오를 때마다 등급 +1
  function skillGradeNow(data, s) { return data.skills.gradeUp ? Math.min(data.skills.maxGrade || 4, skillGrade(data, s.id) + (s.level || 1) - 1) : skillGrade(data, s.id); }
  // 화면용 전투력에 곱할 유물 배율: 1 + 지금 등급 × powerPerGrade 합 (예: 3등급 유물 1개 = +15%)
  // shortcut: 유물 종류·조건을 안 따지는 어림값, 전투력 비교가 실제 승패와 자주 어긋나면 종류별 기대값으로 바꿔요
  function relicPowerMul(data, owned) { var p = data.skills.powerPerGrade || 0; return 1 + (owned || []).reduce(function (a, s) { return a + p * skillGradeNow(data, s); }, 0); }
  function skillMaxLevel(data, id) { return data.skills.gradeUp ? (data.skills.maxGrade || 4) - skillGrade(data, id) + 1 : data.skills.maxLevel; }
  // ───── 전리품 룰렛 ─────
  // 칸 키: 'h:<영웅 id>' 영웅 · 's:<스킬 id>' 스킬 두루마리 · 'g:<골드>' 골드 주머니 · 'm:<개수>' 마나스톤
  function lootPool(data, st, rnd) {
    var L = data.recruit.loot || {}, out = st.team.filter(function (u) { return !u.mob; }).map(function (u) { return 'h:' + u.id; });
    if (L.skills !== false) (st.skills || []).forEach(function (s) { out.push('s:' + s.id); });
    var rew = data.campaign.reward.base * Math.pow(data.campaign.reward.growth, st.n);
    var bellMul = 1 + (data.bell && st.bell ? data.bell.lootGold * st.bell : 0); // 종을 울린 만큼 주머니가 두둑해져요 (칸 수는 그대로)
    for (var i = 0; i < (L.goldSlots || 0); i++) out.push('g:' + Math.max(1, Math.round(rew * bellMul * ((L.goldMin || 0.3) + rnd() * ((L.goldMax || 0.7) - (L.goldMin || 0.3))))));
    var MN = data.mana; if (MN && MN.enabled && rnd() < MN.loot.chance) out.push('m:' + MN.loot.amount); // 마나스톤: 가끔만 끼어요
    return out;
  }
  // 전리품 다시 돌리기 비용 (k = 이번 판에서 이미 돌린 횟수, n = 이긴 스테이지 번호)
  function lootRerollPrice(data, k, n) { var RR = data.recruit.reroll; return Math.round(RR.base * Math.pow(RR.growth, k || 0) * Math.pow(data.shop.priceGrowth, Math.max(0, n || 0))); }
  function lootParse(key) { var i = key.indexOf(':'); if (i < 0) return { type: 'h', id: key }; var t = key.slice(0, i), v = key.slice(i + 1); return t === 'g' || t === 'm' ? { type: t, amt: +v } : { type: t, id: v }; }
  function levelCost(data, lv) { return Math.round(data.levelCost.base * Math.pow(data.levelCost.growth, lv - 1)); }
  // 등급 배율 (합성 등급 1~maxGrade)
  // 성급 배율 (합성 ★1~maxStar)
  function starMul(data, star) { var M = data.recruit.merge, arr = M ? M.mul : data.recruit.starMul; return arr[(star || 1) - 1] || arr[arr.length - 1] || 1; }
  function gradeMul(data, star) { return starMul(data, star); } // 예전 이름 (성급 배율)
  // 영웅 효과 레벨 (화면용): { ult, pas } — 등급 기본값
  function effectLevels(data, id) { var GE = data.gradeEffects || {}, b = GE[heroGrade(data, id)] || { ult: 1, pas: 0 }, h = heroById(data, id); return { ult: b.ult, pas: h && h.passive ? b.pas : 0 }; }
  function passiveValue(data, id, lv) { var h = heroById(data, id), GE = data.gradeEffects || {}; return h && h.passive && lv > 0 ? h.passive.v * (1 + (GE.pasPer || 0) * (lv - 1)) : 0; }
  // 치명타 확률(기본 능력): 영웅 crit > 예전 치명타 패시브 수치 > 역할 기본값
  function critChance(data, h) { var C = data.crit; if (!C || !h) return 0; return h.crit != null ? h.crit : h.passive && h.passive.kind === 'crit' ? h.passive.v : (C.base[h.role] || 0); }
  function heroGrade(data, id) { var h = heroById(data, id); return (h && h.grade) || 1; } // 영웅 고유 등급 1~5
  // 플레이어 레벨의 등급 확률로 영웅 하나 뽑기. exclude에 든 영웅은 피하고, 그 등급에 없으면 가까운 등급에서
  function pickHeroByGrade(data, rnd, plv, exclude) { exclude = exclude || [];
    var P = data.player, W = P && P.heroGrade ? P.heroGrade[Math.max(0, Math.min((plv || 1) - 1, P.heroGrade.length - 1))] : [1, 1, 1, 1, 1];
    var tot = W.reduce(function (a, b) { return a + b; }, 0), r = rnd() * tot, g = 1; for (var k = 0; k < W.length; k++) { r -= W[k]; if (r < 0) { g = k + 1; break; } }
    var PL0 = data.recruit.pool, all = data.heroes.filter(function (h) { return h.art !== false && (!PL0 || !PL0.length || PL0.indexOf(h.id) >= 0); });
    for (var dd = 0; dd < 5; dd++) for (var sgn = -1; sgn <= 1; sgn += 2) { var gg = g + dd * sgn;
      var c = all.filter(function (h) { return (h.grade || 1) === gg && exclude.indexOf(h.id) < 0; }); if (c.length) return c[Math.floor(rnd() * c.length)].id; }
    return all[Math.floor(rnd() * all.length)].id; }
  // 화면용 전투력(정수): 능력치 힘 × 스킬 배율(기본 스킬 승급 + 초월 스킬 레벨당 ultPer). u = { id, star, tr }
  function unitPower(data, u, lv) { var GE = data.gradeEffects || {}, per = GE.ultPer || 0.3, sk = unitSkills(data, u), base = effectLevels(data, u.id).ult || 1;
    var mul = 1 + per * (sk[0].lv - base) + sk.slice(1).reduce(function (a, s) { return a + per * s.lv; }, 0);
    return Math.round(power(data, u.id, lv || data.startLevel, u.star || 1) * mul); }
  function power(data, id, lv, star) { var h = heroById(data, id), g = 1 + data.growth.perLevel * (lv - 1), s = starMul(data, star); return Math.sqrt(h.hp * g * s * h.atk * g * s / h.interval); }
  // 클리어 골드: 종을 울린 만큼 늘어요
  // 종 한 번에 바로 받는 골드
  function bellGold(data, n) { var C = data.campaign; return data.bell && data.bell.instant ? Math.round(C.reward.base * Math.pow(C.reward.growth, n) * data.bell.instant) : 0; }
  function stageReward(data, n, bell, ev) { var C = data.campaign; bell = Math.max(0, Math.min(bell || 0, bellMax(data, n, ev))); return Math.round(C.reward.base * Math.pow(C.reward.growth, n) * (1 + (data.bell ? data.bell.gold * (bell || 0) : 0))); }
  function costCap(data, cleared) { var c = data.recruit.costCap; if (c.enabled === false) return 999; return Math.min(c.max, c.start + Math.floor(cleared / c.every)); }

  // 봇의 편성: 힘 센 순서로, 코스트 상한과 전장 칸 안에서 채워요
  // roster: [{ id, level, star }]
  // roster: [{ uid?, id, level, grade (또는 star) }]. 같은 영웅이 여러 명이어도 각각 올려요
  function autoFormation(data, roster, cap, field) { field = field || data.recruit.fieldSlots;
    function gr(r) { return r.star || 1; }
    var list = roster.slice().sort(function (a, b) { return power(data, b.id, b.level, gr(b)) - power(data, a.id, a.level, gr(a)); });
    var pick = [], used = 0;
    list.forEach(function (r) { var c = heroById(data, r.id).cost; if (pick.length < field && used + c <= cap) { pick.push(r); used += c; } });
    return placeSlots(data, pick).map(function (p) {
      var r = p.ref, s = gradeMul(data, gr(r)); return { uid: r.uid, id: p.id, level: r.level, star: gr(r), grade: heroGrade(data, p.id), slot: p.slot, mul: { hp: s, atk: s }, ultLv: r.ultLv, extra: r.extra };
    });
  }
  // ───── 영웅 개체 (같은 영웅도 여러 명) ─────
  // units: [{ uid, id, grade }]
  // units: [{ uid, id, star }]. 등급(희귀도)은 영웅마다 고정이라 heroGrade(data, id)로 봐요
  function newUnit(units, id, star) { var uid = units.reduce(function (m, u) { return Math.max(m, u.uid || 0); }, 0) + 1, u = { uid: uid, id: id, star: star || 1 }; units.push(u); return u; }
  function canMerge(data, a, b) { var M = data.recruit.merge || {}, mx = M.maxStar || data.recruit.maxStar || 3;
    return !!(a && b && a.uid !== b.uid && a.id === b.id && Math.max(a.star || 1, b.star || 1) < mx); } // 성급이 달라도 돼요: 2성 + 1성 = 3성 (2026-11-18)
  // b를 a에 겹쳐 합성: a 성급 = 둘 중 높은 성급 +1, b는 사라져요. 반환: 합쳐진 a (안 되면 null)
  function mergeUnits(data, units, aUid, bUid) {
    var a = units.filter(function (u) { return u.uid === aUid; })[0], b = units.filter(function (u) { return u.uid === bUid; })[0];
    if (!canMerge(data, a, b)) return null; a.star = Math.max(a.star || 1, b.star || 1) + 1;
    if (b.tr) { a.tr = a.tr || {}; var TRm = data.transcend || {}; Object.keys(b.tr).forEach(function (k) { // 초월 스킬 합치기: 같은 스킬은 높은 레벨, 새 스킬은 칸이 남을 때만
      if (a.tr[k] != null || k === a.id) a.tr[k] = Math.max(a.tr[k] || 0, b.tr[k]); else if (1 + Object.keys(a.tr).filter(function (q) { return q !== a.id; }).length < (TRm.maxSkills || 3)) a.tr[k] = b.tr[k]; }); }
    units.splice(units.indexOf(b), 1); return a; }
  // 봇용: 합칠 수 있는 짝을 모두 합쳐요. 반환: 합성 횟수
  function autoMerge(data, units) { var n = 0, again = true;
    while (again) { again = false;
      for (var i = 0; i < units.length && !again; i++) for (var j = i + 1; j < units.length; j++) if (canMerge(data, units[i], units[j])) { mergeUnits(data, units, units[i].uid, units[j].uid); n++; again = true; break; } }
    return n; }
  // ───── 초월 ─────
  // unit.tr = { 영웅 id: 레벨 }. 자기 id 키는 기본 스킬의 추가 레벨(승급 횟수), 다른 id는 추가 스킬(레벨 1부터)
  // 이 개체의 스킬 목록: [{ from, lv, main }] (main = 기본 스킬). lv은 등급 기본 레벨 + 승급
  function unitSkills(data, u) { var TR = data.transcend || {}, cap = TR.maxLv || 5, tr = u.tr || {}, base = effectLevels(data, u.id).ult || 1;
    var out = [{ from: u.id, lv: Math.min(cap, base + (tr[u.id] || 0)), main: true }];
    Object.keys(tr).forEach(function (k) { if (k !== u.id) out.push({ from: k, lv: Math.min(cap, tr[k]), main: false }); }); return out; }
  // a에 재료 m을 넣을 수 있는지: 'up'(같은 스킬 승급) | 'add'(새 스킬) | null
  function canTranscend(data, a, m) { var TR = data.transcend; if (!TR || !TR.enabled || !a || !m || a.uid === m.uid) return null;
    var sk = unitSkills(data, a), same = sk.filter(function (s) { return s.from === m.id; })[0];
    if (same) return same.lv < (TR.maxLv || 5) ? 'up' : null;
    return sk.length < (TR.maxSkills || 3) ? 'add' : null; }
  // 초월: m(재료)을 a에 넣어요. m은 사라져요. 반환: { unit: a, kind: 'up'|'add', from, lv } (안 되면 null)
  function transcend(data, units, aUid, mUid) {
    var a = units.filter(function (u) { return u.uid === aUid; })[0], m = units.filter(function (u) { return u.uid === mUid; })[0], kind = canTranscend(data, a, m);
    if (!kind) return null; a.tr = a.tr || {}; a.tr[m.id] = (a.tr[m.id] || 0) + 1; units.splice(units.indexOf(m), 1);
    var s = unitSkills(data, a).filter(function (x) { return x.from === m.id; })[0]; return { unit: a, kind: kind, from: m.id, lv: s.lv }; }
  // 전투용: roster 항목에 넣을 { ultLv, extra }
  function unitBattleSpec(data, u) { var sk = unitSkills(data, u); return { ultLv: sk[0].lv, extra: sk.slice(1).map(function (s) { return { from: s.from, lv: s.lv }; }) }; }
  // 영웅 얻기(화면·봇 공용): 새 개체를 넣고, recruit.merge.auto면 같은 영웅·같은 성급과 바로 합쳐요.
  // 이미 있던 개체가 남아요(전장 자리 유지). 반환: { unit: 최종으로 남은 개체, merged: 합성 횟수 }
  function gainUnit(data, units, id) {
    var u = newUnit(units, id, 1), M = data.recruit.merge || {}, n = 0;
    if (!M.auto) return { unit: u, merged: 0 };
    for (;;) { var o = units.filter(function (x) { return canMerge(data, x, u); })[0]; if (!o) break;
      mergeUnits(data, units, o.uid, u.uid); u = o; n++; }
    return { unit: u, merged: n }; }
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
    var units = [];
    function startHero() { var id = R.startHero; if (campfireAtStart(data)) { var ids = rollCampfire(data, rnd, 1); id = ids[Math.floor(rnd() * ids.length)]; events.campfire.seen++; } newUnit(units, id, 1); levels[id] = data.startLevel; }
    var log = [], attempts = 0, battleTime = 0, idleTime = 0, seed = (opts.seed || 1) * 7919, rnd = makeRng(seed + 5);
    var recruits = { new: 0, merge: 0, star: 0, max: 0, dropped: 0 }, skills = [], xp = 0, plv = 1, shop = rollShop(data, rnd, 1), rerolls = 0, sold = 0, spent = 0, stuck = false, mana = 0, manaGot = 0, manaSpent = 0;
    // 상점 봇: 진열된 것 중 살 수 있는 걸 앞에서부터 사요. 반환: 산 개수
    function shopping() { var n = 0, again = true;
      while (again) { again = false;
        for (var i = 0; i < shop.length; i++) { var id = shop[i], cost = skillBuyPrice(data, id, stage, skills), p = cost.gold;
          var SL = data.player ? perk(data, plv).skillSlots : data.skills.slots;
          var mp = cost.mana; if (mana < mp) continue; // 마나스톤이 모자라면 못 사요
          if (canTake(data, skills, id, SL) && gold >= p) { gold -= p; spent += p; mana -= mp; manaSpent += mp; takeSkill(data, skills, id); shop.splice(i, 1); n++; again = true; break; }
          // 칸이 꽉 찼으면: 진열품보다 등급이 낮은 스킬 중 가장 낮은 것(같으면 레벨 낮은 것)을 팔고 사요
          if (skills.length >= SL && !skills.some(function (s) { return s.id === id; })) {
            var low = skills.slice().sort(function (a, b) { return skillGradeNow(data, a) - skillGradeNow(data, b); })[0];
            if (low && skillGradeNow(data, low) < skillGrade(data, id)) { var sv = skillSellPrice(data, low, stage);
              if (gold + sv >= p) { sellSkill(data, skills, low.id); gold += sv; sold++; gold -= p; spent += p; mana -= mp; manaSpent += mp; takeSkill(data, skills, id); shop.splice(i, 1); n++; again = true; break; } } } } }
      return n; }
    var LF = data.life && data.life.enabled ? data.life : null, life = LF ? LF.max : 0, streak = 0, lossSpins = 0, runs = [], runStart = 0, lossGoldSum = 0;
    // 체력이 0이 되면 판 전체를 처음(1-1)으로: 영웅·스킬·골드·마나스톤·경험치를 모두 잃어요
    function resetRun() { runs.push({ best: best, time: time - runStart }); runStart = time;
      units.length = 0; levels = {}; startHero();
      skills.length = 0; gold = 0; mana = 0; xp = 0; plv = 1; stage = 0; best = 0; tries = 0; streak = 0; life = LF.max; lastHp = 0; shop = rollShop(data, rnd, 1, skills); }
    var lastHp = 0, bells = { rung: 0, lost: 0 }, fails = []; // fails[n] = 스테이지 n에서 진 횟수
    var events = { goblin: { seen: 0, caught: 0, missed: 0 }, merchant: { seen: 0, bought: 0 }, merc: { seen: 0, hired: 0 }, campfire: { seen: 0 }, chest: { seen: 0, tiers: 0, gold: 0 } };
    startHero(); // 첫 영웅 (모닥불이면 3명 중 룰렛으로 1명)
    // 이벤트 스테이지(모닥불·방랑상인·보물상자)는 스테이지 수를 쓰지 않아요: 시작 모닥불 뒤 첫 전투가 1-1이고, 판 중 이벤트는 n과 n+1 사이(n.5)예요
    var arrived = false; // 새 스테이지에 막 올라왔을 때만 이벤트 스테이지가 나올 수 있어요 (다시 도전할 때는 안 나와요)
    // 영웅 하나 얻기 (용병·상인): 백팩이 꽉 차면 백팩에서 가장 약한 영웅보다 셀 때만 바꿔요. 반환: 얻었으면 true
    // 영웅 하나 얻기: 새 개체로 들어오고, 같은 영웅·같은 등급이 있으면 봇은 바로 합쳐요.
    // 백팩(전장에 없는 영웅)이 R.bag을 넘으면 가장 약한 영웅을 버려요. 반환: 새 영웅이 남았으면 true
    function gainHero(id, team) {
      var u = newUnit(units, id, 1); levels[id] = levels[id] || data.startLevel; recruits['new']++;
      var m = autoMerge(data, units); recruits.merge += m;
      var inTeam = team.map(function (x) { return x.uid; }), kept = true;
      for (;;) { var bag = units.filter(function (x) { return inTeam.indexOf(x.uid) < 0; }); if (bag.length <= R.bag) break;
        // 버릴 영웅: 합성 짝(같은 영웅)이 있으면 한 단계 위 성급의 힘으로 쳐서 남겨요 (★1만 계속 버리면 ★3까지 못 가요)
        var mx = (R.merge && R.merge.maxStar) || R.maxStar || 3, val = function (x) { var pair = units.some(function (y) { return y !== x && y.id === x.id; });
          return power(data, x.id, data.startLevel, pair ? Math.min(mx, x.star + 1) : x.star); };
        var wk = bag.sort(function (a, b) { return val(a) - val(b); })[0];
        if (wk === u) kept = false;
        var host = !(data.transcend || {}).at && units.filter(function (x) { return x !== wk && inTeam.indexOf(x.uid) >= 0 && canTranscend(data, x, wk); }).sort(function (a, b) { return (canTranscend(data, b, wk) === 'up') - (canTranscend(data, a, wk) === 'up') || val(b) - val(a); })[0];
        if (host) { transcend(data, units, host.uid, wk.uid); recruits.transcend = (recruits.transcend || 0) + 1; } // 봇: 버릴 영웅은 전장 영웅에 초월 재료로 넣어요 (같은 스킬 승급 먼저)
        else { units.splice(units.indexOf(wk), 1); recruits.dropped++; } }
      return kept; }
    function giveBonus(b) { if (!b) return; recruits.bonus = (recruits.bonus || 0) + 1; if (b.type === 'g') gold += b.amt; else if (b.type === 'm') { mana += b.amt; manaGot += b.amt; } else if (canTake(data, skills, b.id, data.player ? perk(data, plv).skillSlots : 0)) takeSkill(data, skills, b.id); }
    function roster() { return units.map(function (u) { var bs = unitBattleSpec(data, u); return { uid: u.uid, id: u.id, level: levels[u.id] || data.startLevel, star: u.star, ultLv: bs.ultLv, extra: bs.extra }; }); }
    while (stage < total && time < maxT) {
      // 종 전략: opts.bell = 'never' | 'always' | 'smart'(앞 판을 여유 있게 이겼으면 울려요) 또는 숫자
      var bp = opts.bell || 'never', bellN = typeof bp === 'number' ? bp : bp === 'always' ? (data.bell ? data.bell.max : 0) : bp === 'smart' ? (lastHp > 0.75 ? 2 : lastHp > 0.5 ? 1 : 0) : 0;
      var ev = rollEvent(data, stage, rnd, plv, { battleOnly: !arrived }); arrived = false;
      var team = autoFormation(data, roster(), costCap(data, best), data.player ? perk(data, plv).field : 0), st = stageTeam(data, stage, ev, bellN, plv);
      if (ev && ev.kind === 'merchant' && merchantNoBattle(data)) bellN = 0;
      bellN = Math.min(bellN, bellMax(data, stage, ev)); bells.rung += bellN; var bellPaid = ev && ev.kind === 'chest' ? 0 : bellN * bellGold(data, stage); gold += bellPaid;
      if (ev) { events[ev.kind] = events[ev.kind] || { seen: 0 }; events[ev.kind].seen++; }
      if (ev && ev.kind === 'merchant' && merchantNoBattle(data)) { // 방랑상인 판: 싸우지 않고 특별 상점만 열고 넘어가요
        rollMerchant(data, stage, rnd, plv, skills).forEach(function (it) {
          var have = it.cur === 'mana' ? mana : gold; if (have < it.price) return;
          var ok = it.type === 's' ? canTake(data, skills, it.id, data.player ? perk(data, plv).skillSlots : 0) && (takeSkill(data, skills, it.id), true) : gainHero(it.id, team);
          if (!ok) return; if (it.cur === 'mana') { mana -= it.price; manaSpent += it.price; } else { gold -= it.price; spent += it.price; } events.merchant.bought++; });
        continue; } // 이벤트 스테이지: 스테이지는 그대로, 바로 그 스테이지 전투로 가요
      if (ev && ev.kind === 'chest') { // 보물상자 판: 지지 않아요. 입힌 피해 구간만큼 보상받고 넘어가요
        var cres = battle(data, team, st.team, { seed: seed + attempts * 31, modules: opts.modules, skills: skills, enemySkills: [] }); attempts++; time += cres.time; battleTime += cres.time;
        var cr = chestReward(data, stage, bellN, 1 - cres.enemyLeft); gold += cr.gold; mana += cr.mana; manaGot += cr.mana;
        for (var cs = 0; cs < cr.scroll; cs++) { var sid = rollScroll(data, rnd, plv, skills); if (sid && canTake(data, skills, sid, data.player ? perk(data, plv).skillSlots : 0)) takeSkill(data, skills, sid); }
        events.chest.tiers = (events.chest.tiers || 0) + cr.tier; events.chest.gold = (events.chest.gold || 0) + cr.gold;
        shop = rollShop(data, rnd, plv, skills); rerolls = 0; continue; }
      if (ev && ev.kind === 'mobs') { // 몹 무리 판: 지지 않아요. 몹을 쓰러뜨리면 그 몹의 drops 칸 중 1개를 받고 넘어가요
        var mres = battle(data, team, st.team, { seed: seed + attempts * 31, modules: opts.modules, skills: skills, enemySkills: [] }); attempts++; time += mres.time; battleTime += mres.time;
        var mpool = mobLoot(st, mres.units); events.mobs.killed = (events.mobs.killed || 0) + mpool.length;
        if (mpool.length) { var mk = lootParse(mpool[Math.floor(rnd() * mpool.length)]); events.mobs[mk.type] = (events.mobs[mk.type] || 0) + 1;
          if (mk.type === 'g') gold += mk.amt; else if (mk.type === 'm') { mana += mk.amt; manaGot += mk.amt; } else if (canTake(data, skills, mk.id, data.player ? perk(data, plv).skillSlots : 0)) takeSkill(data, skills, mk.id); }
        shop = rollShop(data, rnd, plv, skills); rerolls = 0; continue; }
      if (ev && data.transcend && ev.kind === data.transcend.at) { // 초월 제단: 백팩 영웅을 전장 영웅에 초월 재료로 넣고 넘어가요 (같은 스킬 승급 먼저)
        units.filter(function (x) { return team.every(function (t) { return t.uid !== x.uid; }); }).forEach(function (wk) {
          var host = units.filter(function (x) { return team.some(function (t) { return t.uid === x.uid; }) && canTranscend(data, x, wk); }).sort(function (a, b) { return (canTranscend(data, b, wk) === 'up') - (canTranscend(data, a, wk) === 'up'); })[0];
          if (host) { transcend(data, units, host.uid, wk.uid); recruits.transcend = (recruits.transcend || 0) + 1; } });
        continue; }
      if (ev && ev.kind === 'campfire') { var ci = Math.floor(rnd() * ev.ids.length); gainHero(ev.ids[ci], team); giveBonus(ev.bonus && ev.bonus[ci]); continue; } // 모닥불: 싸우지 않고 1명 얻고, 같은 스테이지 전투로 가요
      var res = battle(data, team, st.team, { seed: seed + attempts * 31, modules: opts.modules, skills: skills, enemySkills: st.skills });
      attempts++; tries++; time += res.time; battleTime += res.time;
      if (data.player) { xp += data.player.xpPerKill * res.units.filter(function (x) { return x.side === 'E' && !x.alive && !x.escaped; }).length; plv = playerLevel(data, xp).level; }
      shop = rollShop(data, rnd, plv, skills); rerolls = 0; // 전투가 끝나면 상점이 새로 채워져요
      if (res.win) {
        var reward = stageReward(data, stage, bellN, ev); lastHp = res.hpLeft;
        gold += reward;
        // 특수 몹 보상
        if (ev && ev.kind === 'goblin') { if (res.units.some(function (x) { return x.mob === 'goblin' && !x.alive && !x.escaped; })) { gold += Math.round(reward * data.events.goblin.goldMul); events.goblin.caught++; } else events.goblin.missed++; }
        if (ev && ev.kind === 'merc') { if (gold >= ev.price && gainHero(ev.id, team)) { gold -= ev.price; spent += ev.price; events.merc.hired++; } }
        if (ev && ev.kind === 'merchant') { rollMerchant(data, stage, rnd, plv).forEach(function (it) {
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
        else if (pk.type === 'm') { mana += pk.amt; manaGot += pk.amt; }
        else if (pk.type === 's') { if (canTake(data, skills, pk.id, data.player ? perk(data, plv).skillSlots : 0)) takeSkill(data, skills, pk.id); recruits.skill = (recruits.skill || 0) + 1; }
        else got = pk.id;
        if (got) { kind = gainHero(got, team) ? 'new' : 'dropped'; var gb = st.team.filter(function (x) { return x.id === got && x.bonus; })[0]; giveBonus(gb && gb.bonus); }
        log.push({ stage: stage, name: st.name, wall: st.wall, boss: st.boss, tries: tries, time: time, teamLv: team.map(function (x) { return x.level; }), plv: plv, field: team.length, battle: res.time, hpLeft: res.hpLeft, got: got, kind: kind, owned: units.length, maxStar: units.reduce(function (m, u) { return Math.max(m, u.star); }, 1), maxGrade: units.reduce(function (m, u) { return Math.max(m, heroGrade(data, u.id)); }, 1) });
        if (LF) { streak = 0; if (st.boss && LF.recoverOnBoss) life = LF.max; } // 장 보스를 깨면 체력이 다 차요
        stage++; tries = 0; best = Math.max(best, stage); arrived = true;
        shopping();
        continue;
      }
      lastHp = 0; fails[stage] = (fails[stage] || 0) + 1; if (bellN) { bells.lost++; gold = Math.max(0, gold - bellPaid); } // 지면 종 골드는 도로 빠져요
      if (LF) { // 체력: 살아남은 적만큼 깎이고, 위로금을 받고, 같은 판에 다시 도전해요. 0이 되면 판 전체가 끝나요
        streak++; var kills = res.units.filter(function (x) { return x.side === 'E' && !x.alive && !x.escaped && !x.mob; }).length;
        var lg = lossGold(data, stage, kills, streak); gold += lg; lossGoldSum += lg;
        life -= lossDamage(data, res.units); if (life <= 0) { resetRun(); continue; }
        var llp = lossLootPrice(data, stage); if (llp && gold >= llp) { var lpool = lossLootPool(data, st, rnd); if (lpool.length) { gold -= llp; spent += llp; lossSpins++;
          var lk = lootParse(lpool[Math.floor(rnd() * lpool.length)]);
          if (lk.type === 'm') { mana += lk.amt; manaGot += lk.amt; } else if (lk.type === 's') { if (canTake(data, skills, lk.id, data.player ? perk(data, plv).skillSlots : 0)) takeSkill(data, skills, lk.id); } else { gainHero(lk.id, team); var lb = st.team.filter(function (x) { return x.id === lk.id && x.bonus; })[0]; giveBonus(lb && lb.bonus); } } } } // 진 판 전리품 영웅도 덤을 줘요
      else if (C.loseStepBack && stage > 0) stage = Math.max(0, stage - C.loseStepBack); // 지면 앞 스테이지로
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
        if (C.idle.enabled === false) { if (C.loseStepBack || LF) continue; stuck = true; break; }
        var perMin = C.idle.base * Math.pow(C.idle.growth, stage);
        var takeable = shop.filter(function (id) { return canTake(data, skills, id); }).map(function (id) { return skillPrice(data, id, stage); });
        var anyRoom = data.skills.list.some(function (x) { return canTake(data, skills, x.id); });
        if (!anyRoom) { stuck = true; break; } // 스킬도 다 찼고 레벨업도 없으면 더 강해질 방법이 없어요
        var need;
        if (takeable.length) need = Math.min.apply(null, takeable) - gold;
        else { var rp = refreshPrice(data, rerolls); if (gold >= rp) { gold -= rp; spent += rp; rerolls++; shop = rollShop(data, rnd, plv, skills); continue; } need = rp - gold; }
        var wait = Math.max(60, Math.ceil(need / perMin) * 60);
        gold += perMin * wait / 60; time += wait; idleTime += wait;
      }
    }
    return { cleared: stage, total: total, time: time, battleTime: battleTime, idleTime: idleTime, attempts: attempts, log: log, levels: levels, owned: units, units: units, recruits: recruits, skills: skills, spent: spent, sold: sold, stuck: stuck, xp: xp, plv: plv, events: events, bells: bells, fails: fails, gold: gold, runs: runs, life: life, lossGold: lossGoldSum, lossSpins: lossSpins, mana: { got: manaGot, spent: manaSpent, left: mana } };
  }

  // ───── 플레이어 체력 (life) ─────
  // 진 판에서 살아남은 적 1명마다 깎이는 체력: base + perGrade × (등급 − 1). 보스는 + bossExtra. 돈고블린·도망친 적은 안 깎아요
  // units: battle 결과의 units (side E만 봐요)
  function lossDamage(data, units) { var L = data.life; if (!L || !L.enabled) return 0; var d = 0;
    units.forEach(function (x) { if (x.side !== 'E' || !x.alive || x.escaped || x.mob) return; d += L.base + L.perGrade * (heroGrade(data, x.id) - 1) + (x.boss ? (L.bossExtra || 0) : 0); });
    return d; }
  // 진 판 위로금: 클리어 골드 × perKill × 쓰러뜨린 적 수 × (1 + streakBonus × (연패 − 1), 최대 streakMax연패)
  function lossGold(data, n, kills, streak) { var L = data.life; if (!L || !L.enabled || !L.consolation) return 0; var CO = L.consolation, C = data.campaign;
    var k = 1 + (CO.streakBonus || 0) * (Math.min(streak || 1, CO.streakMax || 3) - 1);
    return Math.round(C.reward.base * Math.pow(C.reward.growth, n) * CO.perKill * kills * k); }

  // 진 판 룰렛: 골드를 내면 한 번 돌릴 수 있어요. 후보는 그 판 적 영웅·적 스킬·마나스톤(가끔)이고 골드 주머니는 빠져요
  function lossLootPrice(data, n) { var LL = data.life && data.life.lossLoot, C = data.campaign; return LL && LL.enabled ? Math.round(C.reward.base * Math.pow(C.reward.growth, n) * LL.price) : 0; }
  function lossLootPool(data, st, rnd) { return lootPool(data, st, rnd).filter(function (k) { return lootParse(k).type !== 'g'; }); }

  // ───── 전투 전 판단 돕기 (편성 화면용) ─────
  // 승산 미리 보기: 지금 편성으로 n판을 몰래 돌려 본 결과. { win: 승률 0~1, hpLeft: 이긴 판의 평균 남은 체력 비율, label: '유리'|'팽팽'|'불리' }
  function forecast(data, team, st, skills, opts) { opts = opts || {}; var n = opts.n || 12, w = 0, hp = 0;
    if (!team.length) return { win: 0, hpLeft: 0, label: '불리' };
    for (var i = 1; i <= n; i++) { var res = battle(data, team, st.team, { seed: i * 9973, modules: opts.modules, skills: skills, enemySkills: st.skills }); if (res.win) { w++; hp += res.hpLeft; } }
    var p = w / n; return { win: p, hpLeft: w ? hp / w : 0, label: p >= 0.7 ? '유리' : p >= 0.35 ? '팽팽' : '불리' }; }
  // 속성 상성: 공격자 속성 a가 방어자 속성 d에게 'adv'(유리) | 'dis'(불리) | null. 배율은 modules.element
  function elemAdv(data, a, d) { var b = data.elements.beats; return b[a] === d ? 'adv' : (b[d] === a && a !== 'light' && a !== 'dark') ? 'dis' : null; }

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

  var api = { battle: battle, createBattle: createBattle, stageTeam: stageTeam, stageLevel: stageLevel, stageName: stageName, stageCount: stageCount, autoFormation: autoFormation,
    campaign: campaign, compare: compare, forecast: forecast, elemAdv: elemAdv, lossDamage: lossDamage, lossGold: lossGold, lossLootPrice: lossLootPrice, lossLootPool: lossLootPool, levelCost: levelCost, heroById: heroById, makeRng: makeRng,
    costCap: costCap, starMul: starMul, gradeMul: gradeMul, heroGrade: heroGrade, pickHeroByGrade: pickHeroByGrade, effectLevels: effectLevels, relicPowerMul: relicPowerMul, passiveValue: passiveValue, addHero: addHero, power: power, newUnit: newUnit, canMerge: canMerge, mergeUnits: mergeUnits, autoMerge: autoMerge, gainUnit: gainUnit,
    skillById: skillById, heroBonus: heroBonus, isBoss: isBoss, critChance: critChance, lootPool: lootPool, mobLoot: mobLoot, lootParse: lootParse, lootRerollPrice: lootRerollPrice, rollEvent: rollEvent, rollCampfire: rollCampfire, campfireAtStart: campfireAtStart, stageReward: stageReward, bellMax: bellMax, bellGold: bellGold, rollMerchant: rollMerchant, isEventStage: isEventStage, eventStageName: eventStageName, unitSkills: unitSkills, canTranscend: canTranscend, transcend: transcend, unitBattleSpec: unitBattleSpec, unitPower: unitPower, skillPool: skillPool, merchantPrice: merchantPrice, merchantNoBattle: merchantNoBattle, chestReward: chestReward, rollScroll: rollScroll, mercPrice: mercPrice, skillPrice: skillPrice, skillManaPrice: skillManaPrice, skillBuyPrice: skillBuyPrice, skillGradeNow: skillGradeNow, skillMaxLevel: skillMaxLevel, refreshPrice: refreshPrice, rollShop: rollShop, canTake: canTake, takeSkill: takeSkill, playerLevel: playerLevel, perk: perk, skillSellPrice: skillSellPrice, sellSkill: sellSkill };
  if (typeof module !== 'undefined') module.exports = api; else root.IdleEngine = api;
})(this);
