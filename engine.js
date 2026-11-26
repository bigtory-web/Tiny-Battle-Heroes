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
      var HB = side === 'A' && data.heroBoost ? data.heroBoost : null, hb = function (s) { return HB ? ((HB[h.job] || {})[s] || 0) + ((HB.all || {})[s] || 0) : 0; }; // 2026-11-27 영구 강화 영웅 줄(우리 편만). shortcut: 방어력도 %라 탱커만 득, 숫자 정할 때 고정값으로 바꿀지 봄
      var hp = h.hp * g * (m.hp || 1) * (1 + hb('hp'));
      var AR = B.arena, p0 = AR.pos[spec.slot] || AR.pos[0];
      return { uid: ++uid, id: h.id, name: h.name, h: h, side: side, slot: spec.slot, star: spec.star || 1, line: AR.lines ? (AR.lines[spec.slot] || 0) : (spec.slot < 2 ? 0 : 1), front: (AR.lines ? (AR.lines[spec.slot] || 0) === 0 : spec.slot < 2) || h.mob === 'goblin' || h.mob === 'chest', level: lv,
        x: spec.x != null ? spec.x : (side === 'A' ? p0[0] : AR.w - p0[0]), y: spec.y != null ? spec.y : p0[1], face: side === 'A' ? 1 : -1, moving: false, tgt: null,
        reach: AR.reach[h.range], spd: AR.speed[h.range],
        maxHp: hp, hp: hp, atk: h.atk * g * (m.atk || 1) * (1 + hb('atk')), def: h.def * g * (1 + hb('def')), interval: h.interval / (spec.spd || 1), range: h.range, swampV: spec.swamp || 0, swampE: spec.swampE || 0, /* 2026-11-26 늪: 살아 있는 1초마다 공격력 +swampV. 2026-11-27: swampE가 있으면 swampE초마다 계단식(늪 칸) */ race2: spec.race2 && spec.race2 !== h.race ? spec.race2 : null, /* 단상으로 더해진 종족 */ el: spec.el || h.el, el2: spec.el2 && spec.el2 !== (spec.el || h.el) ? spec.el2 : null, // el2: 진영 발판으로 더해진 진영 // spec.el: 진영 발판 위면 그 진영
        energy: h.ult && h.ult.trig ? (h.ult.trig.kind === 'start' ? B.energyMax : 0) : Math.min(B.energyMax, SE.value + (spec.energy || 0)), trig: h.ult && h.ult.trig || null, timer: rand() * B.startJitter, alive: true, shield: 0, taunt: 0, slow: 0, slowAmt: 0, haste: 0, hasteAmt: 0,
        grade: h.grade || 1, ultLv: 0, pasLv: 0, uk: 1, pas: null, pv: 0, crit: critChance(data, h) + hb('crit'),
        boss: !!spec.boss, merc: !!spec.merc, blue: !!spec.blue, endureOnce: !!spec.endure, stats: { dealt: 0, taken: 0, healed: 0, ults: 0, shield: 0 } };
    }
    var A = ally.map(function (s) { return makeUnit(s, 'A'); }), E = enemy.map(function (s) { return makeUnit(s, 'E'); });
    // 영웅 효과 2개: 궁극기·패시브. 레벨 = spec.ultLv / spec.pasLv (없으면 등급 기본 레벨). 성급은 능력치만 올려요
    var GE = data.gradeEffects || { 1: { ult: 1, pas: 1 }, ultPer: 0.25, pasPer: 0.5, maxLv: 5 };
    A.concat(E).forEach(function (u, i) { var spec = i < A.length ? ally[i] : enemy[i - A.length], base = GE[u.grade] || GE[1] || { ult: 1, pas: 0 };
      var TRD = data.transcend || {}, lvCap = Math.max(GE.maxLv || 5, TRD.enabled ? TRD.maxLv || 5 : 0);
      u.ultLv = Math.min(lvCap, spec.ultLv || base.ult);
      // 초월 추가 스킬: spec.extra = [{ from: 영웅 id, lv }]. 그 영웅의 궁극기를 그 레벨 위력으로 함께 써요
      u.extra = (spec.extra || []).map(function (e) { var hh = heroById(data, e.from); return hh && hh.ult ? { from: e.from, ult: hh.ult, el: hh.el, lv: e.lv, k: 1 + (GE.ultPer || 0) * (Math.min(lvCap, e.lv) - 1) } : null; }).filter(Boolean); var PO = GE.passiveOn, pas0 = PO && (spec.star || 1) >= PO.star && u.grade >= PO.grade ? 1 : base.pas; /* 패시브: 등급 PO.grade 이상 영웅이 ★PO.star가 되면 켜져요 */ u.pasLv = u.h.passive ? Math.min(GE.maxLv || 5, spec.pasLv != null ? spec.pasLv : pas0) : 0;
      u.uk = 1 + (GE.ultPer || 0) * (u.ultLv - 1);
      if (u.pasLv > 0) { u.pas = u.h.passive; u.pv = u.pas.v * (1 + (GE.pasPer || 0) * (u.pasLv - 1)); } });
    // 시작할 때 걸리는 패시브
    A.concat(E).forEach(function (u) { if (!u.pas) return; var k = u.pas.kind, mine = u.side === 'A' ? A : E, opp = u.side === 'A' ? E : A;
      if (k === 'shieldAlly') { var na = mine.filter(function (x) { return x !== u; }).sort(function (a, b) { return dist(a, u) - dist(b, u); })[0] || u; na.shield += na.maxHp * u.pv; }
      else if (k === 'openHaste') { u.haste = PP(u).dur; u.hasteAmt = u.pv; }
      else if (k === 'teamEnergyStart') mine.forEach(function (x) { x.energy = Math.min(B.energyMax, x.energy + u.pv); });
      else if (k === 'ambush') u.stealth = u.pv;
      else if (k === 'dive' && opp.length) { var bk = opp.reduce(function (m, x) { return Math.abs(x.x - u.x) > Math.abs(m.x - u.x) ? x : m; }); u.x = bk.x - u.face * 40; u.y = bk.y; }
      if (k === 'shieldStart') u.shield += u.maxHp * u.pv;
      else if (k === 'energyStart') u.energy = Math.min(B.energyMax, u.energy + u.pv);
      else if (k === 'haste') u.interval /= 1 + u.pv;
      else if (k === 'auraAtk') (u.side === 'A' ? A : E).forEach(function (x) { x.atk *= 1 + u.pv; }); });
    function team(side) { return side === 'A' ? A : E; }
    function foes(u) { return u.side === 'A' ? E : A; }
    function JP(u) { return (u && B.jobPassive && B.jobPassive[u.h.job]) || {}; } // 2026-11-26 직업 효과
    function alive(list) { return list.filter(function (x) { return x.alive; }); }
    // ───── 영웅 특성(2026-11-21): has(u, 종류) = 살아 있고 그 특성을 가졌는지. 같은 편/상대 편에서 그 특성 가진 영웅들 ─────
    function on(u, k) { return (u.pas && u.pas.kind === k) || (u.winT > 0 && u.win && u.win.kind === k); }
    function has(u, k) { return !!u && u.alive && on(u, k); }
    function holders(side, k) { return alive(team(side)).filter(function (x) { return on(x, k); }); }
    function PP(u) { return u.winT > 0 && u.win ? u.win : (u.pas || {}); } // 지금 켜진 효과의 값들
    function reviveU(src, d, pct) { d.alive = true; d.hp = d.maxHp * pct; d.shield = 0; d.burn = null; d.stun = 0; if (rec) log.push({ t: t, kind: 'heal', from: src.uid, to: d.uid, amt: Math.round(d.hp) }); }
    var shSrc = null; // 지금 행동 중인 영웅: 그 사이에 생긴 보호막을 이 영웅이 준 것으로 세요 (DPS 창)
    function addShield(x, amt) { if (!x.alive || amt <= 0) return; if (x.lineCare) amt *= 1 + x.lineCare; if (x.side === 'A' && opts.curse) amt *= 1 - opts.curse; x.shield += amt; if (rec) log.push({ t: t, kind: 'shield', from: shSrc ? shSrc.uid : undefined, to: x.uid, amt: Math.round(amt) }); /* 2026-11-26: 방패 숫자 연출용 */ if (shSrc && shSrc.stats) shSrc.stats.shield += amt; holders(x.side, 'shieldRally').forEach(function (l) { if ((l.rallyN || 0) < (PP(l).max || 10)) { l.rallyN = (l.rallyN || 0) + 1; l.stkAtk = (l.stkAtk || 0) + l.pv; } }); }
    function gainEnergy(x, n) { if (x.alive) x.energy = Math.min(B.energyMax, x.energy + n); }
    function lifestealHeal(u, amt) { if (amt <= 0) return; heal(u, u, amt); holders(u.side, 'lifestealEnergy').forEach(function (d) { gainEnergy(d, d.pv); }); }
    // 쓰러짐 처리(모든 피해가 여기로): 버팀·환생·부활을 먼저 보고, 진짜 쓰러지면 처치·아군 쓰러짐 특성
    function die(dst, src) {
      var nun = holders(dst.side, 'endure').filter(function (x) { return x.winT > 0 || !x.pUsed; })[0];
      if (nun) { if (!(nun.winT > 0)) nun.pUsed = true; dst.hp = 1; return; }
      if (dst.endureOnce) { dst.endureOnce = false; dst.hp = 1; return; } // 종 효과 불굴
      if (on(dst, 'rebirth') && !dst.pUsed) { dst.pUsed = true; dst.hp = dst.maxHp * dst.pv; alive(foes(dst)).forEach(function (x) { if (dist(x, dst) <= (PP(dst).r || 90)) x.burn = { src: dst, left: (EFX.fire || {}).dur || 4, tick: 1 }; }); return; }
      var sr = holders(dst.side, 'reviveAlly').filter(function (x) { return x !== dst && !x.pUsed; })[0];
      if (sr && !dst.h.mob) { sr.pUsed = true; dst.hp = dst.maxHp * sr.pv; if (rec) log.push({ t: t, kind: 'heal', from: sr.uid, to: dst.uid, amt: Math.round(dst.hp) }); return; }
      dst.hp = 0; dst.alive = false; if (rec) log.push({ t: t, kind: 'die', uid: dst.uid });
      if (!dst.h.mob) alive(team(dst.side)).forEach(function (x) { var v = JP(x).allyDeathAtk; if (v) x.atk *= 1 + v; }); // 전사: 아군이 쓰러질 때마다 공격력
      if (!dst.h.mob && (dst.star || 1) <= 2) allSkills.forEach(function (sk) { if (sk.def.kind !== 'starStep' || sk.side !== dst.side) return; /* 디딤돌: ★1·★2가 쓰러지면 같은 열 별 최고 아군에게 에너지 */
        var L = alive(team(dst.side)).filter(function (x) { return x.line === dst.line; }); if (!L.length) return; gainEnergy(L.reduce(function (m, x) { return (x.star || 1) > (m.star || 1) ? x : m; }), sk.def.amount * sk.mul); sk.fired++; });
      if (dst.markT > 0) holders(dst.side === 'A' ? 'E' : 'A', 'markKillEnergy').forEach(function (hh) { gainEnergy(hh, hh.pas.v); }); /* 밤추적자: 표식 적이 쓰러지면 에너지 */
      if (src && src.side !== dst.side && src.pas && src.pas.kind === 'killAtkStack' && src.alive) src.kStk = Math.min(src.pas.max || 5, (src.kStk || 0) + 1); /* 처형자: 쓰러뜨릴 때마다 공격력 쌓기 */
      if (src && src.side !== dst.side) { if (EN.onKill) gainEnergy(src, EN.onKill);
        if (has(src, 'killRush')) src.timer = 0; if (has(src, 'killEnergy')) gainEnergy(src, src.pv); if (has(src, 'killStealth')) src.stealth = src.pv; if (has(src, 'killBurn')) src.nextBurn = true; }
      holders(dst.side === 'A' ? 'E' : 'A', 'deathEnergy').forEach(function (n) { gainEnergy(n, n.pv); });
      if (dst.burn) holders(dst.side === 'A' ? 'E' : 'A', 'burnBlast').forEach(function (f) { alive(team(dst.side)).forEach(function (x) { if (dist(x, dst) <= (PP(f).r || 90)) skillHurt(x, atkOf(f) * f.pv, f); }); });
      if (!dst.h.mob) holders(dst.side, 'martyr').forEach(function (m) { m.atk *= 1 + m.pv; var add = m.maxHp * m.pv; m.maxHp += add; m.hp += add; });
    }
    function guardOf(dst) { var g = holders(dst.side, 'guardShare').filter(function (x) { return x !== dst; })[0]; if (!g) return null;
      var lo = alive(team(dst.side)).reduce(function (m, x) { return x.hp / x.maxHp < m.hp / m.maxHp ? x : m; }); return lo === dst ? g : null; }

    // 진영 시너지: 같은 진영 3명 이상이면 공격 보너스
    if (SY.pick === 'on') [A, E].forEach(function (L) {
      var cnt = {}; L.forEach(function (u) { cnt[u.el] = (cnt[u.el] || 0) + 1; if (u.el2) cnt[u.el2] = (cnt[u.el2] || 0) + 1; });
      L.forEach(function (u) { var c = Math.max(cnt[u.el], u.el2 ? cnt[u.el2] : 0); if (c >= 5) u.atk *= 1 + SY.o.at5; else if (c >= 3) u.atk *= 1 + SY.o.at3; });
    });

    function elemMul(a, d) {
      var beats = data.elements.beats;
      if (beats[a.el] === d.el) return EL.adv;
      if (beats[d.el] === a.el && !(a.el === 'light' || a.el === 'dark')) return EL.dis;
      return 1;
    }
    function atkOf(u) { var a = u.atk; if (u.swampV) a *= 1 + u.swampV * (u.swampE ? Math.floor(t / u.swampE) : t); if (u.kStk) a *= 1 + u.pas.v * u.kStk; if (u.pas && u.pas.kind === 'rage' && u.hp / u.maxHp < 0.5) a *= 1 + u.pv; if (u.buffT > 0) a *= 1 + u.buffAmt; if (u.stkAtk) a *= 1 + u.stkAtk;
      if (u.pas && u.pas.kind === 'burnRally') a *= 1 + u.pv * alive(foes(u)).filter(function (x) { return x.burn; }).length; return a; }

    function nearGoblin(u, F) { return (F || alive(foes(u))).filter(function (x) { return x.h.mob === 'goblin' && dist(u, x) <= u.reach * 1.2; })[0] || null; }
    function F0hack(u, list) { var CW = B.crowd || {}, cpen = u.range === 'melee' ? (CW.pen || 0) : 0, mates = alive(team(u.side)).filter(function (y) { return y !== u && y.tgt; }); var sc = function (x) { return dist(u, x) + cpen * mates.filter(function (y) { return y.tgt === x && dist(y, x) <= y.reach + 8; }).length; }; return list.reduce(function (m, x) { return sc(x) < sc(m) ? x : m; }); } // 막혔을 때 다른 대상 고르기(아군이 덜 붙은 가까운 적)
    // 공격 대상 고르기
    function pickTarget(u) {
      var F0 = alive(foes(u)); if (!F0.length) return null; var F = F0.filter(function (x) { return !(x.stealth > 0); }); if (!F.length) F = F0; // 숨은 적은 못 노려요
      var tauntU = F.filter(function (x) { return x.taunt > 0; }); if (tauntU.length) return tauntU[0];
      var gob = nearGoblin(u, F); if (gob) return gob; // 돈고블린이 사거리 근처에 있으면 먼저 노려요
      var JT = B.jobTarget && B.jobTarget[u.h.job]; if (JT === 'far') return F.reduce(function (m, x) { return dist(u, x) > dist(u, m) ? x : m; }); if (JT === 'lowHp') return F.reduce(function (m, x) { return x.hp + (x.shield || 0) < m.hp + (m.shield || 0) ? x : m; }); // 2026-11-26 직업별 대상: 궁수 가장 먼 적, 암살자 체력 가장 낮은 적
      if (TG === 'near') { var CW = B.crowd || {}, cpen = u.range === 'melee' ? (CW.pen || 0) : 0, mates = cpen ? alive(team(u.side)).filter(function (y) { return y !== u && y.tgt; }) : []; /* 2026-11-26: 근접은 아군이 이미 붙어 때리는 적을 덜 골라요(사용자: "다른캐릭터가 또 그대상을때릴때 사이를비집으면 … 계속 밀고 들어오려고만해") */
        var sc = function (x) { return dist(u, x) + (cpen ? cpen * mates.filter(function (y) { return y.tgt === x && dist(y, x) <= y.reach + 8; }).length : 0); };
        return F.reduce(function (m, x) { return sc(x) < sc(m) ? x : m; }); } // 실제로 가장 가까운 적 (앞에 선 유닛이 먼저 맞아요)
      if (TG === 'lowest') return F.reduce(function (m, x) { return x.hp / x.maxHp < m.hp / m.maxHp ? x : m; });
      if (TG === 'random') return F[Math.floor(rand() * F.length)];
      var front = F.filter(function (x) { return x.front; }), pool = front.length ? front : F;
      if (TG === 'lane') { // 마주 보는 자리(같은 칸 번호)가 살아 있으면 그쪽
        var same = pool.filter(function (x) { return B.arena.lines ? x.slot % 3 === u.slot % 3 : (x.slot === u.slot || (u.slot >= 2 && x.slot === u.slot - 2)); }); // 9칸: 같은 높이(가운데·아래·위)
        if (same.length) return same[0];
      }
      return pool.reduce(function (m, x) { return x.slot < m.slot ? x : m; });
    }

    var magic = false, burning = false; // 지금 피해가 스킬(궁극기·팀 스킬)에서 나왔는지: 로그 hit.mag로 화면이 평타와 색을 구분해요
    function hurt(src, dst, mul) {
      if (!dst.alive || dst.stone > 0) return 0; // 돌이 된 동안은 피해 없음
      var basic = !magic && !burning;
      if (basic && src.blind > 0 && rand() < (src.blindAmt || 0)) return 0; // 실명: 평타가 빗나가요
      var crit = !burning && rand() < (src.crit || 0) + (src.pas && src.pas.kind === 'crit' ? src.pv : 0);
      if (has(src, 'ambush') && !src.pUsed2) { src.pUsed2 = true; crit = true; }
      if (src.forceCrit && !burning) { src.forceCrit = false; crit = true; } // 그림자: 첫 공격은 치명타
      if (crit) mul *= (data.crit && data.crit.mul) || 2; // 화상 틱은 치명타 없음
      if (basic && has(src, 'firstStrike') && !src.pUsed) { src.pUsed = true; mul *= src.pv; dst.stun = Math.max(dst.stun || 0, PP(src).stun || 0.5); }
      if (basic && src.charged && has(src, 'chargeHit')) { src.charged = false; mul *= src.pv; }
      if (has(src, 'vsSlow') && (dst.slow > 0 || dst.chill > 0)) mul *= 1 + src.pv;
      if (has(src, 'vsBurn') && dst.burn) mul *= 1 + src.pv;
      if (has(src, 'execute') && dst.hp / dst.maxHp < (PP(src).below || 0.3)) mul *= 1 + src.pv;
      if (has(src, 'farShot')) mul *= 1 + src.pv * Math.min(1, dist(src, dst) / 210);
      if (!burning && src.pact && has(src, 'bloodPact')) { src.pact = false; mul *= 1 + src.pv; }
      if (magic && ultSrc === src && src.ultStk) mul *= 1 + src.pv * src.ultStk; // 천둥새: 쌓인 만큼 궁극기가 세져요
      if (B.enrage && t > B.enrage.at) mul *= 1 + B.enrage.perSec * (t - B.enrage.at); // 광폭화: 오래 끌면 양쪽 피해가 점점 커져요
      var dmg = atkOf(src) * mul * (1 - dst.def / (dst.def + B.defK)) * elemMul(src, dst);
      if (dst.markT > 0) dmg *= 1 + (dst.markV || 0); // 표식: 받는 피해 증가
      if (dst.lineDR) dmg *= 1 - Math.min(0.8, dst.lineDR); // 열 유물: 받는 피해 감소
      var sg = dst.shield > 0 && holders(dst.side, 'shieldGuard')[0]; if (sg) dmg *= 1 - sg.pv;
      var gd = guardOf(dst); if (gd) { var share = dmg * gd.pv; dmg -= share; var ga = Math.min(gd.shield, share); gd.shield -= ga; gd.hp -= share - ga; gd.stats.taken += share; if (gd.hp <= 0) die(gd, src); }
      var hadSh = dst.shield > 0, absorbed = Math.min(dst.shield, dmg); dst.shield -= absorbed; dmg -= absorbed;
      dst.hp -= dmg; src.stats.dealt += dmg + absorbed; dst.stats.taken += dmg + absorbed;
      if (dst.trig) { if (dst.trig.kind === 'struck') dst.energy = Math.min(B.energyMax, dst.energy + B.energyMax / dst.trig.n); } // 발동 타입: 피격 N회마다
      else if (EN.onHitScale) dst.energy = Math.min(B.energyMax, dst.energy + (dmg / dst.maxHp) * EN.onHitScale * (JP(dst).hitEnergy || 1)); // 기사: 맞으면 차는 에너지 배
      if (rec) log.push({ t: t, kind: 'hit', from: src.uid, to: dst.uid, amt: Math.round(dmg + absorbed), crit: crit || undefined, mag: magic || undefined, burn: burning || undefined });
      if (dst.hp <= 0) die(dst, src);
      if (hadSh && dst.shield <= 0 && has(dst, 'shieldBreakStun')) alive(foes(dst)).forEach(function (x) { if (dist(x, dst) <= (PP(dst).r || 90)) x.stun = Math.max(x.stun || 0, dst.pv); });
      // 때린 쪽 특성
      if (src.alive && dmg > 0) { var ls = 0;
        if (on(src, 'lifesteal')) ls += dmg * src.pv;
        holders(src.side, 'teamLifesteal').forEach(function (d) { ls += dmg * d.pv; });
        if (has(src, 'lowLifesteal') && src.hp / src.maxHp < (PP(src).below || 0.3)) ls += dmg * src.pv;
        if (magic && ultSrc === src && has(src, 'ultDrain')) ls += dmg * src.pv;
        if (ls) lifestealHeal(src, ls); }
      if (magic && ultSrc === src && !burning) { if (has(src, 'ultBurnAmp')) { dst.burnAmp = PP(src).dur || 4; dst.burnAmpV = src.pv; } if (has(src, 'ultBlind')) { dst.blind = PP(src).dur || 2; dst.blindAmt = src.pv; } }
      if (crit && basic && has(src, 'critFollow') && !src.inFollow && dst.alive) { src.inFollow = true; hurt(src, dst, src.pv); src.inFollow = false; }
      // 맞은 쪽 특성
      if (dmg + absorbed > 0 && dst.alive) {
        if (has(dst, 'hitHeal')) heal(dst, dst, dst.maxHp * dst.pv);
        if (has(dst, 'hitSlow') && src.alive) { src.slow = Math.max(src.slow || 0, PP(dst).dur || 1); src.slowAmt = Math.max(src.slow > 0 ? src.slowAmt || 0 : 0, dst.pv); }
        if (has(dst, 'tauntDrain') && dst.taunt > 0 && src.alive) { var st = Math.min(src.energy, dst.pv); src.energy -= st; gainEnergy(dst, st); }
        if (has(dst, 'hitShield')) { dst.hitC = (dst.hitC || 0) + 1; if (dst.hitC % (PP(dst).n || 10) === 0) addShield(dst, dst.maxHp * dst.pv); }
        if (has(dst, 'hitNova')) { dst.hitC = (dst.hitC || 0) + 1; if (dst.hitC % (PP(dst).n || 8) === 0) { var pm = magic; magic = true; alive(foes(dst)).forEach(function (x) { if (dist(x, dst) <= (PP(dst).r || 90)) hurt(dst, x, dst.pv); }); magic = pm; } }
        if (has(dst, 'petrify') && !dst.pUsed && dst.hp / dst.maxHp < 0.5) { dst.pUsed = true; dst.stone = PP(dst).dur || 3; } }
      if (dst.lineTh && src.alive && dmg + absorbed > 0) { var rl = (dmg + absorbed) * dst.lineTh; src.hp -= rl; dst.stats.dealt += rl; src.stats.taken += rl; if (rec) log.push({ t: t, kind: 'skillHit', to: src.uid, amt: Math.round(rl), thorns: true }); if (src.hp <= 0) die(src, dst); } // 열 유물: 맞으면 되돌리기
      if (src.alive && on(dst, 'thorns') && src.range === 'melee' && src.alive && dmg + absorbed > 0) { var rf = (dmg + absorbed) * dst.pv; src.hp -= rf; dst.stats.dealt += rf; src.stats.taken += rf;
        if (rec) log.push({ t: t, kind: 'skillHit', to: src.uid, amt: Math.round(rf), thorns: true });
        if (src.hp <= 0) die(src, dst); }
      if (ultSrc === src && ultEl && !burning) { ultHit = true; elemHit(src, dst, dmg, ultEl); }
      return dmg;
    }
    function heal(src, dst, amt) {
      if (!dst.alive) return; if (dst.lineCare) amt *= 1 + dst.lineCare;
      if (HD.pick === 'on') amt *= Math.max(HD.o.minMul, 1 - (t / B.timeLimit) * (1 - HD.o.minMul));
      if (dst.side === 'A' && opts.curse) amt *= 1 - opts.curse; // 종 효과 저주
      var real = Math.min(amt, dst.maxHp - dst.hp); dst.hp += real; src.stats.healed += real;
      if (has(src, 'overhealShield') && amt > real) addShield(dst, (amt - real) * src.pv);
      if (has(src, 'healHaste') && real > 0 && !(dst.haste > 0 && dst.hasteAmt > src.pv)) { dst.haste = PP(src).dur || 2; dst.hasteAmt = src.pv; }
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
      var F = alive(foes(u)), T = alive(team(u.side)); u.stats.ults++; if (JP(u).ultEnergy) T.forEach(function (x) { if (x !== u) gainEnergy(x, JP(u).ultEnergy); }); // 서포터: 궁극기를 쓰면 다른 아군 에너지
      // shortcut: 초월 추가 스킬의 창도 같은 u.win을 써서 기본 스킬 창을 덮어써요, 둘 다 창이 있는 조합이 많아지면 창을 여러 개로 나눠요
      if (U0.win) { u.win = U0.win; u.winT = U0.win.t || 0.5; u.pv = (U0.win.v || 0) * k; u.evT = 0; u.atkC2 = 0; u.dStk = 0; }
      if (rec) log.push({ t: t, kind: 'ult', uid: u.uid, ult: U.kind });
      switch (U.kind) {
        case 'taunt': u.taunt = U.dur; addShield(u, u.maxHp * U.shieldPct); break;
        case 'teamShield': T.forEach(function (x) { addShield(x, atkOf(u) * U.mul); }); if (U.rally) u.stkAtk = (u.stkAtk || 0) + U.rally * T.length; break;
        case 'strike': { var tg = pickTarget(u); if (tg) { if (U.crit) u.forceCrit = true; hurt(u, tg, U.mul); for (var hi = 1; hi < (U.hits || 1) && tg.alive; hi++) hurt(u, tg, U.mul); /* 2026-11-26 hits: 같은 적을 여러 번(연타 연출) */ if (U.follow && tg.alive) hurt(u, tg, U.follow); if (U.root && tg.alive) tg.root = U.root; } if (U.boost) { u.boostN = U.boostN || 3; u.boostV = U.boost; } break; }
        case 'multi': { var mm = U.mul; if (U.scale === 'missing') mm *= 1 + (1 - u.hp / u.maxHp); if (U.scale === 'low' && u.hp / u.maxHp < 0.3) mm *= 2;
          for (var i = 0; i < U.hits; i++) { var tg2 = pickTarget(u); if (tg2) hurt(u, tg2, mm); } break; }
        case 'zigzag': F.slice().sort(function () { return rand() - 0.5; }).slice(0, U.hits).forEach(function (x) { hurt(u, x, U.mul); }); break;
        case 'blink': var bx0 = u.x, by0 = u.y, bf0 = u.face; for (var bc = 0; bc < (U.chain || 1); bc++) { var BF = alive(foes(u)); if (!BF.length) break; var bt0 = BF.reduce(function (m, x) { return x.hp / x.maxHp < m.hp / m.maxHp ? x : m; });
          u.x = bt0.x + u.face * 30; u.y = bt0.y; u.face = -u.face; hurt(u, bt0, U.mul); if (bt0.alive) break; } if (U.back) { u.x = bx0; u.y = by0; u.face = bf0; } break; // 등 뒤로 순간이동해 베고, 쓰러뜨리면 다음 적으로. back이면 제자리로 돌아와요
        case 'mark': if (F.length) { var mk = F.reduce(function (m, x) { return atkOf(x) > atkOf(m) ? x : m; }); hurt(u, mk, U.mul); if (mk.alive) { mk.markT = U.dur; mk.markV = U.amount; } } break;
        case 'barrage': u.brg = { left: U.hits, every: U.every || 0.4, t: 0, mul: U.mul, el: ultEl }; break; // 여러 번 공격: 0.4초마다 1번씩 (첫 발은 바로)
        case 'shieldOne': { var na = T.filter(function (x) { return x !== u; }).sort(function (a, b) { return dist(a, u) - dist(b, u); })[0] || u; addShield(na, na.maxHp * U.shieldPct); break; }
        case 'selfShield': addShield(u, u.maxHp * U.shieldPct); break;
        case 'revive1': { var d1 = team(u.side).filter(function (x) { return !x.alive && !x.escaped && !x.h.mob; })[0]; if (d1) reviveU(u, d1, U.pct); else T.forEach(function (x) { addShield(x, atkOf(u) * (U.mul || 1)); }); break; }
        case 'reviveAll': { var ds = team(u.side).filter(function (x) { return !x.alive && !x.escaped && !x.h.mob; }); if (ds.length) ds.forEach(function (x) { reviveU(u, x, U.pct); }); else T.forEach(function (x) { heal(u, x, atkOf(u) * (U.mul || 1.5)); }); break; }
        case 'stone': u.stone = U.dur; u.taunt = U.dur; u.pv = U.heal * k; break; // 돌이 풀릴 때 u.pv만큼 회복
        case 'buff': break; // 스킬 창만 켜요
        case 'selfHaste': u.haste = U.dur; u.hasteAmt = U.amount; break;
        case 'chillAll': F.forEach(function (x) { x.slow = U.dur; x.slowAmt = Math.min(0.8, U.amount); }); break;
        case 'nova': F.forEach(function (x) { if (dist(x, u) <= (U.r || 100)) { hurt(u, x, U.mul); x.stun = Math.max(x.stun || 0, U.stun || 1); } }); break;
        case 'dash': if (F.length) { var far = F.reduce(function (m, x) { return dist(u, x) > dist(u, m) ? x : m; }); u.x = far.x - u.face * 40; u.y = far.y; hurt(u, far, U.mul); if (U.stun && far.alive) far.stun = Math.max(far.stun || 0, U.stun); } break;
        case 'bombard': if (F.length) { var rr = U.r || 90, ctr = F.reduce(function (m, x) { var c1 = F.filter(function (y) { return dist(x, y) <= rr; }).length, c0 = F.filter(function (y) { return dist(m, y) <= rr; }).length; return c1 > c0 ? x : m; });
          F.forEach(function (x) { if (dist(x, ctr) <= rr) hurt(u, x, U.mul); }); } break;
        case 'pierce': { var pt = pickTarget(u); if (pt) F.forEach(function (x) { if (x === pt || Math.abs(x.y - pt.y) < 35) hurt(u, x, U.mul); }); break; }
        case 'backstab': { if (U.crit) u.forceCrit = true; if (U.deadBonus) U.mul *= 1 + U.deadBonus * team(u.side).filter(function (x) { return !x.alive && !x.escaped; }).length; var back = TG === 'near' ? F.slice().sort(function (a, b) { return dist(u, b) - dist(u, a); }).slice(0, Math.max(1, F.length - 2)) : F.filter(function (x) { return !x.front; }), pool = back.length ? back : F; // 가까운 2명을 뺀 뒤쪽
          if (pool.length) hurt(u, pool.reduce(function (m, x) { return x.hp < m.hp ? x : m; }), U.mul); if (U.stealth) u.stealth = U.stealth; break; }
        case 'snipe': if (F.length) { var sn = U.far ? F.reduce(function (m, x) { return dist(u, x) > dist(u, m) ? x : m; }) : F.reduce(function (m, x) { return x.hp / x.maxHp < m.hp / m.maxHp ? x : m; });
          hurt(u, sn, U.mul); if (U.burn && sn.alive) sn.burn = { src: u, left: U.burn, tick: 1 }; } break;
        case 'aoe': F.forEach(function (x) { hurt(u, x, U.mul); if (U.slow) { x.slow = U.slowDur; x.slowAmt = U.slow; } }); break;
        case 'chain': for (var j = 0; j < U.hits; j++) { var L = alive(foes(u)); if (L.length) hurt(u, L[Math.floor(rand() * L.length)], U.mul); } break;
        case 'healAll': T.forEach(function (x) { heal(u, x, atkOf(u) * U.mul); }); break;
        case 'haste': T.forEach(function (x) { x.haste = U.dur; x.hasteAmt = U.amount; }); break;
      }
      if (U.teamEnergy) T.forEach(function (x) { if (x !== u && (!U.race || x.h.race === U.race || x.race2 === U.race)) gainEnergy(x, U.teamEnergy); });
      if (U.energyPerSlow) gainEnergy(u, U.energyPerSlow * F.filter(function (x) { return x.alive && x.slow > 0; }).length);
      if (U.forestHaste) T.forEach(function (x) { if (x.alive && x.el === 'forest') elemHit(x, null, 0, 'forest'); });
      if (U.burnAll) F.forEach(function (x) { if (x.alive) x.burn = { src: u, left: U.burnAll, tick: 1 }; });
      if (U.detonate) F.forEach(function (x) { if (x.alive && x.burn) { var bl = Math.ceil(x.burn.left); x.burn = null; skillHurt(x, atkOf(u) * ((EFX.fire || {}).mul || 0.3) * bl, u); } });
      if (U.selfCost) u.hp = Math.max(1, u.hp - u.maxHp * U.selfCost);
    }

    var result = null, fx = [], AR = B.arena;
    // ───── 팀 스킬: opts.skills = 아군(A), opts.enemySkills = 적(E). [{ id, level }]. 스킬마다 자기 쿨타임으로 자동 발동 ─────
    var SK = data.skills;
    function mkSkills(list, side) { return (list || []).map(function (s) {
      var def = skillById(data, s.id); return { def: def, side: side, lv: s.level || 1, mul: 1 + (SK.gradeUp ? SK.perGrade : SK.perLevel) * ((s.level || 1) - 1), timer: def.cd * SK.firstAt, fired: 0 }; }); }
    var skills = mkSkills(opts.skills, 'A'), enemySkills = mkSkills(opts.enemySkills, 'E'), allSkills = skills.concat(enemySkills);
    allSkills.forEach(function (sk) { sk.stats = { dealt: 0, healed: 0, shield: 0, casts: 0 }; }); // 유물별 기록 (DPS 창 유물 판)
    var status = { A: { burn: 0, slow: 0, stun: 0 }, E: { burn: 0, slow: 0, stun: 0 } }; // 그 편이 상대에게 건 상태이상 횟수 (걸리기 시작한 순간만 세요)
    // shortcut: 유물 몫은 발동 순간의 체력·보호막 변화로 세요. 유물이 건 화상의 지속 피해는 빠져요. 필요해지면 피해 함수에 출처를 넘겨요
    function relicRun(sk) { var mine = sk.side === 'E' ? E : A, foe = sk.side === 'E' ? A : E, sum = function (L, k) { return L.reduce(function (s, x) { return s + Math.max(0, x[k] || 0); }, 0); };
      var f0 = sum(foe, 'hp') + sum(foe, 'shield'), h0 = sum(mine, 'hp'), s0 = sum(mine, 'shield'); fireSkill(sk);
      sk.stats.casts++; sk.stats.dealt += Math.max(0, f0 - sum(foe, 'hp') - sum(foe, 'shield')); sk.stats.healed += Math.max(0, sum(mine, 'hp') - h0); sk.stats.shield += Math.max(0, sum(mine, 'shield') - s0); }
    // ───── 열 유물(def.trigger === 'line', 2026-11-23): 전투 시작 때 선 열(u.line 0 전방 · 1 중반 · 2 후반)로 한 번 정해져요. line 없으면 모든 열, alone = 그 열에 혼자일 때, full = 그 열에 full명 이상일 때 ─────
    allSkills.forEach(function (sk) { var d = sk.def; if (d.trigger !== 'line') return; var T = team(sk.side), v = d.amount * sk.mul, cnt = {}, starSum = T.filter(function (x) { return !x.h.mob; }).reduce(function (a, x) { return a + (x.star || 1); }, 0);
      T.forEach(function (x) { cnt[x.line] = (cnt[x.line] || 0) + 1; });
      T.forEach(function (x) { if (d.line != null && x.line !== d.line) return; if (d.alone && cnt[x.line] !== 1) return; if (d.full && cnt[x.line] < d.full) return;
        if (d.kind === 'lineGuard') x.lineDR = (x.lineDR || 0) + v; else if (d.kind === 'lineThorns') x.lineTh = (x.lineTh || 0) + v; else if (d.kind === 'lineEnergy') x.energy = Math.min(B.energyMax, x.energy + v);
        else if (d.kind === 'lineCare') x.lineCare = (x.lineCare || 0) + v; else if (d.kind === 'lineHaste') x.interval /= 1 + v; else if (d.kind === 'lineHide') x.stealth = Math.max(x.stealth || 0, v);
        else if (d.kind === 'lineAtk') x.atk *= 1 + v; else if (d.kind === 'starCrown') x.atk *= 1 + v * starSum; else if (d.kind === 'lineDef') x.def += v; }); sk.fired++; });
    // ───── 물약(2026-11-26): opts.potions = [{ id, slot? }] 우리 편에 전투 시작 때 한 번. target 'rand'는 slot(마실 때 정한 영웅), 없으면 무작위 1명. 열 유물과 같은 효과 ─────
    var potionLog = []; (opts.potions || []).forEach(function (pt) { var P = potionById(data, pt.id); if (!P) return; var T = alive(A).filter(function (x) { return !x.h.mob; }); if (!T.length) return;
      if (P.target === 'rand') { var one = T.filter(function (x) { return x.slot === pt.slot; })[0] || T[Math.floor(rand() * T.length)]; T = [one]; }
      T.forEach(function (x) { var v = P.amount, k = P.kind; if (k === 'swamp') { x.swampV = (x.swampV || 0) + v; if (P.every) x.swampE = P.every; } else if (k === 'lineGuard') x.lineDR = (x.lineDR || 0) + v; else if (k === 'lineThorns') x.lineTh = (x.lineTh || 0) + v; else if (k === 'lineEnergy') x.energy = Math.min(B.energyMax, x.energy + v);
        else if (k === 'lineCare') x.lineCare = (x.lineCare || 0) + v; else if (k === 'lineHaste') x.interval /= 1 + v; else if (k === 'lineHide') x.stealth = Math.max(x.stealth || 0, v); else if (k === 'lineAtk') x.atk *= 1 + v; });
      potionLog.push({ id: P.id, uids: T.map(function (x) { return x.uid; }), slots: T.map(function (x) { return x.slot; }) }); });
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
      else if (el === 'forest') { u.fst = Math.min(F.max, (u.fst || 0) + 1); u.fstT = F.dur; trig('haste', u); holders(u.side, 'forestHeal').forEach(function (d) { heal(d, u, u.maxHp * d.pv); }); }
      else if (el === 'water' && tg.alive) { tg.chill = F.dur; tg.chillAmt = F.slow; if (rec) log.push({ t: t, kind: 'fx', fx: 'chill', uid: tg.uid }); trig('chill', u); }
      else if (el === 'light' && dmg > 0) { var lo = alive(team(u.side)).sort(function (a, b) { return a.hp / a.maxHp - b.hp / b.maxHp; })[0]; if (lo) { heal(u, lo, dmg * F.heal); trig('heal', u); } }
      else if (el === 'dark' && tg.alive && rand() < F.chance) { tg.stun = Math.max(tg.stun || 0, F.dur); if (rec) log.push({ t: t, kind: 'fx', fx: 'stun', uid: tg.uid }); trig('stun', u); } }
    function elemTick(x) { // 매 프레임: 화상 피해(1초마다), 숲 가속·얼음 둔화 시간
      if (x.burn) { x.burn.left -= B.dt; x.burn.tick -= B.dt; if (x.burn.tick <= 0) { x.burn.tick += 1; var bs = x.burn.src; magic = burning = true; hurt(bs, x, EFX.fire.mul * (x.burnAmp > 0 ? x.burnAmpV || 1 : 1)); magic = burning = false; if (bs.alive) trig('burn', bs);
          holders(bs.side, 'burnEnergy').forEach(function (h) { alive(team(bs.side)).forEach(function (y) { gainEnergy(y, h.pv); }); }); }
        if (x.burn.left <= 0 || !x.alive) x.burn = null; }
      if (x.fstT > 0) { x.fstT -= B.dt; if (x.fstT <= 0) x.fst = 0; }
      if (x.chill > 0) x.chill = Math.max(0, x.chill - B.dt); }
    var relicNow = null; // 2026-11-26: 지금 발동 중인 유물 id(유물 DPS 창이 유물별 피해·회복을 세게 기록에 붙여요)
    function skillHurt(dst, raw, src) {
      if (!dst.alive || dst.stone > 0) return;
      var dmg = raw * (1 - dst.def / (dst.def + B.defK)), ab = Math.min(dst.shield, dmg); dst.shield -= ab; dmg -= ab; dst.hp -= dmg; dst.stats.taken += dmg + ab;
      if (rec) log.push({ t: t, kind: 'skillHit', to: dst.uid, amt: Math.round(dmg + ab), relic: relicNow || undefined });
      if (dst.hp <= 0) die(dst, src || null);
    }
    // 시너지 태그: { race | job | el: 값 또는 [값...] }. el: '*'은 가장 많은 같은 속성
    function tagMatch(tag, T) {
      if (!tag) return function () { return true; };
      var k = tag.race != null ? 'race' : tag.job != null ? 'job' : 'el', v = tag[k];
      var val = function (x) { return k === 'el' ? x.el : x.h[k]; }, vals = function (x) { return k === 'el' && x.el2 ? [x.el, x.el2] : k === 'race' && x.race2 ? [x.h.race, x.race2] : [val(x)]; }; /* 단상 종족도 쳐요 */ // 진영은 발판으로 더해진 것까지 // 속성은 발판으로 바뀐 값
      if (v === '*') { var c = {}; T.forEach(function (x) { vals(x).forEach(function (q) { c[q] = (c[q] || 0) + 1; }); }); v = Object.keys(c).reduce(function (a, b) { return c[b] > (c[a] || 0) ? b : a; }, null); }
      var vs = [].concat(v); return function (x) { return vals(x).some(function (q) { return vs.indexOf(q) >= 0; }); };
    }
    function fireSkill(sk) { magic = true;
      var d = sk.def, m = sk.mul, T = alive(sk.side === 'E' ? E : A), F = alive(sk.side === 'E' ? A : E); if (!T.length || !F.length) return;
      if (d.tag) { var ok = tagMatch(d.tag, T), nT = T.filter(ok).length;
        if (d.only) { T = T.filter(ok); if (!T.length) return; } // 조건 맞는 아군이 없으면 발동 안 해요
        if (d.per) m *= 1 + d.per * nT; }
      sk.fired++; if (rec) log.push({ t: t, kind: 'skill', id: d.id, side: sk.side }); relicNow = d.id;
      switch (d.kind) {
        case 'atkBuff': T.forEach(function (x) { x.buffT = d.dur; x.buffAmt = d.amount * m; }); break;
        case 'healPct': T.forEach(function (x) { var real = Math.min(x.maxHp * d.amount * m, x.maxHp - x.hp); x.hp += real; if (rec && real > 0) log.push({ relic: d.id, t: t, kind: 'heal', to: x.uid, amt: Math.round(real) }); }); break;
        case 'shieldPct': T.forEach(function (x) { addShield(x, x.maxHp * d.amount * m); }); break;
        case 'nuke': { var avg = T.reduce(function (s2, x) { return s2 + atkOf(x); }, 0) / T.length; F.forEach(function (x) { skillHurt(x, avg * d.amount * m); }); break; }
        case 'slowAll': F.forEach(function (x) { x.slow = d.dur; x.slowAmt = Math.min(0.8, d.amount * m); }); break;
        case 'hasteAll': T.forEach(function (x) { x.haste = d.dur; x.hasteAmt = d.amount * m; }); break;
        case 'execute': { var top = Math.max.apply(null, T.map(atkOf)), low = F.reduce(function (a, b) { return b.hp < a.hp ? b : a; }); skillHurt(low, top * d.amount * m); break; }
        case 'energyAll': T.forEach(function (x) { x.energy = Math.min(B.energyMax, x.energy + d.amount * m); }); break;
        case 'knockback': F.forEach(function (x) { if (x.h.mob === 'chest') return; /* 보물상자는 자리 고정 */ var dir = sk.side === 'E' ? -1 : 1; // 상대 진영 쪽으로 밀어내요
          x.x += dir * d.amount * m; x.stun = Math.max(x.stun || 0, d.dur || 0); if (rec) log.push({ t: t, kind: 'knock', uid: x.uid, dx: dir * d.amount * m }); }); break;
        case 'volley': T.forEach(function (x) { var L2 = alive(sk.side === 'E' ? A : E); if (L2.length) skillHurt(L2[Math.floor(rand() * L2.length)], atkOf(x) * d.amount * m); }); break;
      }
      relicNow = null;
    }
    function afterUlt(u, healed) { var T = alive(team(u.side));
      if (has(u, 'ultRefund')) u.energy = Math.min(B.energyMax, u.pv);
      if (has(u, 'ultStack')) u.ultStk = Math.min(PP(u).max || 5, (u.ultStk || 0) + 1);
      if (has(u, 'ultBeastEnergy')) T.forEach(function (x) { if (x !== u && (x.h.race === 'beast' || x.race2 === 'beast')) gainEnergy(x, u.pv); });
      if (has(u, 'ultHasteShielded')) T.forEach(function (x) { if (x.shield > 0) { x.haste = PP(u).dur || 3; x.hasteAmt = Math.max(x.hasteAmt || 0, u.pv); } });
      if (has(u, 'healSteal') && healed > 0) { var F = alive(foes(u)); if (F.length) skillHurt(F.reduce(function (m, x) { return x.hp / x.maxHp < m.hp / m.maxHp ? x : m; }), healed * u.pv, u); }
      holders(u.side, 'allyUltEnergy').forEach(function (a) { if (a !== u) gainEnergy(a, a.pv); }); }
    function afterAttack(u, tg) { if (!u.alive) return; magic = false;
      if (has(u, 'attackShield')) { u.shield = Math.max(0, u.shield - (u.bSh || 0)); u.bSh = u.maxHp * u.pv; addShield(u, u.bSh); u.bShT = PP(u).dur || 1; }
      if (has(u, 'hasteStack')) u.dStk = Math.min(PP(u).max || 10, (u.dStk || 0) + 1);
      if (has(u, 'pierceChance') && rand() < u.pv) { var bk = alive(foes(u)).filter(function (x) { return x !== tg; }).sort(function (a, b) { return dist(a, tg) - dist(b, tg); })[0]; if (bk) hurt(u, bk, 1); }
      if (has(u, 'hasteDouble') && (u.haste > 0 || u.fst > 0 || u.winT > 0)) { var t2 = tg && tg.alive ? tg : pickTarget(u); if (t2) hurt(u, t2, u.pv); }
      if (!tg || !tg.alive) return;
      if (has(u, 'rootHit')) tg.root = Math.max(tg.root || 0, u.pv);
      if (has(u, 'burnHit')) tg.burn = { src: u, left: u.pv, tick: 1 };
      if (has(u, 'lowBurn') && tg.hp / tg.maxHp < u.pv) tg.burn = { src: u, left: (EFX.fire || {}).dur || 4, tick: 1 };
      if (u.nextBurn && has(u, 'killBurn')) { u.nextBurn = false; tg.burn = { src: u, left: u.pv, tick: 1 }; }
      if (has(u, 'comboN')) { u.atkC2 = (u.atkC2 || 0) + 1; if (u.atkC2 % (PP(u).n || 4) === 0) hurt(u, tg, u.pv); } }
    var SELF_ULT = { taunt: 1, teamShield: 1, healAll: 1, haste: 1, shieldOne: 1, selfShield: 1, revive1: 1, reviveAll: 1, stone: 1, buff: 1, selfHaste: 1, chillAll: 1, dash: 1 }; // 사거리와 상관없이 쓰는 궁극기
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
        if (a.moving !== b.moving) { // 같은 편: 움직이는 쪽만 위아래로 비켜 돌아가요. 서 있는(때리는) 쪽은 그대로 (2026-11-26, 롤토체스처럼)
          var mv = a.moving ? a : b, st = mv === a ? b : a, sy = Math.abs(mv.y - st.y) > 0.5 ? Math.sign(mv.y - st.y) : (mv.uid % 2 ? 1 : -1);
          mv.y += sy * push * 2; continue; } // 앞으로는 막지 않아요: 땅 띠(84px)가 좁아 비킬 틈이 없으면 살짝 겹쳐 지나가요
        a.x += nx * push; a.y += ny * push; b.x -= nx * push; b.y -= ny * push; // 둘 다 서 있거나 둘 다 움직이면 반씩
      }
      all.forEach(function (u) {
        u.x = Math.max(36, Math.min(AR.w - 36, u.x)); // 그림(2배, 폭 72)이 화면 밖으로 잘리지 않게
        u.y = Math.max(AR.yMin, Math.min(AR.yMax, u.y)); // 땅 띠 안에서만 움직여요
      });
    }
    function step() {
      if (result) return;
      t += B.dt;
      var all = A.concat(E); shSrc = null;
      for (var si = 0; si < allSkills.length; si++) { var sk = allSkills[si]; if (sk.def.trigger) continue; sk.timer -= B.dt; if (sk.timer <= 0) { sk.timer += sk.def.cd; relicRun(sk); } }
      if (!alive(E).length) result = 'win'; else if (!alive(A).length) result = 'lose';
      for (var k = 0; k < all.length && !result; k++) {
        var u = all[k]; if (!u.alive) continue; shSrc = u;
        if (EN.perSec && !(u.trig && u.trig.kind === 'start')) u.energy = Math.min(B.energyMax, u.energy + EN.perSec * B.dt);
        if (u.pas && u.pas.kind === 'auraRegen') alive(team(u.side)).forEach(function (x) { if (x.hp < x.maxHp) heal(u, x, x.maxHp * u.pv * B.dt); });
        ['taunt', 'slow', 'haste', 'buffT', 'stun', 'stealth', 'root', 'blind', 'burnAmp', 'winT', 'markT', 'tbT'].forEach(function (f) { if (u[f] > 0) u[f] = Math.max(0, u[f] - B.dt); });
        if (u.stone > 0) { u.stone -= B.dt; if (u.stone <= 0) { u.stone = 0; heal(u, u, u.maxHp * u.pv); } u.moving = false; continue; } // 가고일: 돌이 된 동안 아무것도 안 해요
        if (u.bShT > 0) { u.bShT -= B.dt; if (u.bShT <= 0) { u.shield = Math.max(0, u.shield - (u.bSh || 0)); u.bSh = 0; } } // 바위곰: 1초 보호막이 사라져요
        if (PP(u).every) { var EP = PP(u); u.evT = (u.evT || 0) + B.dt; if (u.evT >= EP.every) { u.evT -= EP.every; var pk = EP.kind, mt = alive(team(u.side));
          if (pk === 'teamShieldEvery') mt.forEach(function (x) { addShield(x, x.maxHp * u.pv); });
          else if (pk === 'healEvery' && mt.length) { var lo = mt.reduce(function (m, x) { return x.hp / x.maxHp < m.hp / m.maxHp ? x : m; }); heal(u, lo, lo.maxHp * u.pv); }
          else if (pk === 'bloodPact' && !u.pact) { u.hp = Math.max(1, u.hp - u.maxHp * (PP(u).cost || 0.05)); u.pact = true; }
          else if (pk === 'reviveEvery') { var dd = team(u.side).filter(function (x) { return !x.alive && !x.escaped && !x.h.mob; })[0]; if (dd) { dd.alive = true; dd.hp = dd.maxHp * u.pv; dd.shield = 0; dd.burn = null; dd.stun = 0; if (rec) log.push({ t: t, kind: 'heal', from: u.uid, to: dd.uid, amt: Math.round(dd.hp) }); } } } }
        elemTick(u); if (!u.alive) { if (!alive(E).length) { result = 'win'; break; } if (!alive(A).length) { result = 'lose'; break; } continue; }
        var speed = (1 + (u.haste > 0 ? u.hasteAmt : 0) + (u.fst ? u.fst * EFX.forest.per : 0)) * (1 - (u.slow > 0 ? u.slowAmt : 0)) * (1 - (u.chill > 0 ? u.chillAmt : 0));
        if (has(u, 'bloodHaste')) speed *= 1 + u.pv * (1 - u.hp / u.maxHp);
        if (u.dStk && on(u, 'hasteStack')) speed *= 1 + u.dStk * u.pv;
        holders(u.side, 'chillAura').forEach(function (f) { if (alive(foes(u)).filter(function (x) { return x.slow > 0 || x.chill > 0; }).length >= (PP(f).n || 3)) speed *= 1 + f.pv; });
        if (u.stun > 0 && u.h.mob !== 'mimic') { u.moving = false; continue; } /* 미믹은 기절해도 도망 시간은 봐요(아래에서 방해만 멈춤) */
        if (u.brg) { u.brg.t -= B.dt; if (u.brg.t <= 0) { u.brg.t += u.brg.every; var BF2 = alive(foes(u)); if (BF2.length) { var ps2 = ultSrc, pe2 = ultEl; ultSrc = u; ultEl = u.brg.el || u.el; magic = true;
            hurt(u, BF2[Math.floor(rand() * BF2.length)], u.brg.mul); magic = false; ultSrc = ps2; ultEl = pe2; } if (--u.brg.left <= 0) u.brg = null;
            if (!alive(E).length) { result = 'win'; break; } if (!alive(A).length) { result = 'lose'; break; } } }
        if (u.castT > 0) { u.castT -= B.dt; u.moving = false; if (u.castT <= 0) { u.castT = 0; var hc = u.stats.healed; ultimate(u); (u.extra || []).forEach(function (e) { if (u.alive) ultimate(u, e.ult, e.k, e.el); }); afterUlt(u, u.stats.healed - hc); // 주문 끝: 스킬이 나가요 (기절하면 멈췄다가 이어서 외워요)
            if (!alive(E).length) { result = 'win'; break; } if (!alive(A).length) { result = 'lose'; break; } } continue; } // 넉백으로 잠깐 멈춤
        if (u.h.mob === 'mimic') { /* 미믹(2026-11-26): 평타 = 고정 피해 dmg, 에너지가 차면 영웅 1명 방해(갈색 둔화, 파랑 실명, 왕관 밀치기). dur초가 지나면 도망 */
          var MM = data.events.mimic || {}; u.age = (u.age || 0) + B.dt; u.moving = false;
          if (t >= (MM.dur || 20)) { /* 전투 시간 기준(기절해도 흘러요) */ u.alive = false; u.escaped = true; if (rec) log.push({ t: t, kind: 'escape', uid: u.uid }); if (!alive(E).length) { result = 'win'; break; } continue; }
          if (u.stun > 0) continue; u.mt = (u.mt == null ? rand() * 0.5 : u.mt) + B.dt; /* 2026-11-26: 공속(interval)마다 평타(고정 피해 dmg, 사거리 안 가장 가까운 영웅), 평타로 에너지가 차면 방해 스킬(사용자: 공속을 쳐야지 스킬 생기자나) */
          var mrc = u.blue ? (B.arena.reach[MM.blueRange || 'mid'] || u.reach) : u.reach; /* 사거리: 갈색 1칸(melee), 파랑 2칸(blueRange), 왕관 4칸(mobs range far) */
          if (u.mt >= u.interval) { u.mt -= u.interval; var MF = alive(foes(u)).filter(function (x) { return dist(u, x) <= mrc; }); if (MF.length) { var mt2 = MF.reduce(function (m, x) { return dist(u, x) < dist(u, m) ? x : m; }); /* 사거리 안에서 가장 가까운 영웅 */
            if (MM.dmg) { var mab = Math.min(mt2.shield || 0, MM.dmg); mt2.shield -= mab; mt2.hp -= MM.dmg - mab; u.stats.dealt += MM.dmg; mt2.stats.taken += MM.dmg; if (rec) log.push({ t: t, kind: 'hit', from: u.uid, to: mt2.uid, amt: MM.dmg, mm: u.blue || u.h.king ? 'spit' : 'bite' }); /* mm: 화면 연출(갈색 깨물기, 파랑·왕관 침 투사체) */ if (mt2.hp <= 0) die(mt2, u); }
            u.energy = Math.min(B.energyMax, u.energy + (EN.onAttack || 0));
            if (u.energy >= B.energyMax && mt2.alive) { u.energy = 0; var mv2 = mt2; /* 방해는 평타 대상에게 */
            if (u.h.king) { var kdx = (mv2.side === 'A' ? -1 : 1) * (MM.knock || 40); mv2.x += kdx; mv2.stun = Math.max(mv2.stun || 0, MM.knockStun || 0.4); if (rec) { log.push({ t: t, kind: 'knock', uid: mv2.uid, dx: kdx }); log.push({ t: t, kind: 'mimicFx', uid: u.uid, to: mv2.uid, fx: 'knock' }); } }
            else if (u.blue) { mv2.blind = Math.max(mv2.blind || 0, MM.blindDur || 2); mv2.blindAmt = Math.max(mv2.blindAmt || 0, MM.blindAmt || 0.5); if (rec) log.push({ t: t, kind: 'mimicFx', uid: u.uid, to: mv2.uid, fx: 'blind' }); } /* 파랑 = 실명(2026-11-26: 색깔별 방해) */
            else { mv2.slow = Math.max(mv2.slow || 0, MM.slowDur || 2); mv2.slowAmt = Math.max(mv2.slowAmt || 0, MM.slowAmt || 0.4); if (rec) log.push({ t: t, kind: 'mimicFx', uid: u.uid, to: mv2.uid, fx: 'slow' }); } } } }
          continue; }
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
        if (!u.tgt || !u.tgt.alive || (taunting && !(u.tgt.taunt > 0) && !(u.tbT > 0)) || (!taunting && u.tgt.h.mob !== 'goblin' && nearGoblin(u))) u.tgt = pickTarget(u);
        var tg = u.tgt; if (tg && dist(u, tg) > u.reach) { /* 2026-11-26: 대상이 막혀 못 닿으면 사거리 안의 적부터 쳐요(같은 편이 안 비켜 주니 갇히지 않게) */ var nr = alive(foes(u)).filter(function (x) { return dist(u, x) <= u.reach && x.h.mob !== 'chest'; })[0]; if (nr && !(tg.taunt > 0)) tg = u.tgt = nr; }
        if (tg && dist(u, tg) > u.reach && tg.h.mob !== 'goblin' && (B.crowd || {}).stuck) { /* 2026-11-26: 대상 쪽으로 가는데 가까워지지 않으면(아군에 막힘) crowd.stuck초 뒤 다른 적으로 바꿔요 */ var dNow = dist(u, tg); u.stuckT = (u.lastTg === tg && u.lastD != null && dNow >= u.lastD - 0.5) ? (u.stuckT || 0) + B.dt : 0; u.lastTg = tg; u.lastD = dNow;
          if (u.stuckT >= B.crowd.stuck && tg.taunt > 0) { /* 도발한 적에게 막혀 못 닿으면 tauntWait초 동안 사거리 안의 다른 적을 쳐요 */ var nr2 = alive(foes(u)).filter(function (x) { return x !== tg && dist(u, x) <= u.reach && x.h.mob !== 'chest' && !(x.stealth > 0); })[0]; if (nr2) { u.tbT = B.crowd.tauntWait || 1.5; tg = u.tgt = nr2; } u.stuckT = 0; u.lastD = null; }
          else if (u.stuckT >= B.crowd.stuck) { var old = tg; u.tgt = null; var others = alive(foes(u)).filter(function (x) { return x !== old && !(x.stealth > 0); }); if (others.length) { var keep = F0hack(u, others); tg = u.tgt = keep; } else tg = u.tgt = old; u.stuckT = 0; u.lastD = null; } }
        if (!tg) { // 칠 수 있는 적이 없으면 가장 가까운 적 쪽으로 다가가요
          var near = alive(foes(u)).sort(function (a, b) { return Math.abs(a.x - u.x) - Math.abs(b.x - u.x); })[0];
          if (near) { var dx = near.x - u.x; u.face = dx >= 0 ? 1 : -1; u.moving = Math.abs(dx) > 30; if (u.moving) u.x += Math.sign(dx) * Math.min(Math.abs(dx) - 30, u.spd * B.dt); }
          u.timer = Math.max(0, u.timer - B.dt * speed); continue;
        }
        u.face = tg.x >= u.x ? 1 : -1;
        var d = dist(u, tg), inReach = d <= u.reach;
        u.moving = !inReach;
        if (!inReach && u.root > 0) u.moving = false; // 묶이면 못 움직여요
        else if (!inReach) { if (has(u, 'chargeHit')) u.charged = true; var mv = Math.min(d - u.reach * 0.9, u.spd * B.dt * (1 - (u.slow > 0 ? u.slowAmt : 0))); u.x += (tg.x - u.x) / d * mv; u.y += (tg.y - u.y) / d * mv; }
        u.timer = Math.max(0, u.timer - B.dt * speed);
        if (u.timer > 0) continue;
        var ultReady = !!u.h.ult && u.energy >= B.energyMax && !u.trigDone; if (ultReady && u.trig && u.trig.kind === 'start') u.trigDone = true; // 전투 시작형은 한 번만 // 몹은 궁극기가 없어요
        if (!inReach && !(ultReady && SELF_ULT[u.h.ult.kind])) continue; // 사거리 밖이면 다가가기만 해요
        u.timer += u.interval;
        if (ultReady && u.h.ult.cast) { u.energy = 0; u.castT = u.h.ult.cast; u.moving = false; if (rec) log.push({ t: t, kind: 'cast', uid: u.uid, dur: u.h.ult.cast }); continue; } // 마법사: 주문을 외우기 시작해요
        if (ultReady) { u.energy = 0; var hb = u.stats.healed; ultimate(u); (u.extra || []).forEach(function (e) { if (u.alive) ultimate(u, e.ult, e.k, e.el); }); // 초월 추가 스킬도 함께 써요
          afterUlt(u, u.stats.healed - hb); }
        else { if (TG === 'lowest' || TG === 'random') { var nt = pickTarget(u); if (nt && dist(u, nt) <= u.reach) tg = u.tgt = nt; }
          magic = false; var am = 1; if (u.boostN > 0) { am *= 1 + u.boostV; u.boostN--; } if (has(u, 'secondHit')) { u.atkC = (u.atkC || 0) + 1; if (u.atkC % 2 === 0) am *= 1 + u.pv; }
          hurt(u, tg, am); trig('attack', u); u.energy = Math.min(B.energyMax, u.energy + (u.trig ? (u.trig.kind === 'hits' ? B.energyMax / u.trig.n : 0) : EN.onAttack + (JP(u).attackEnergy || 0))); afterAttack(u, tg); /* 마법사: 평타 때 에너지 더 */ // 발동 타입: N번째 공격마다 에너지
          if (u.pas && u.pas.kind === 'splash') alive(foes(u)).forEach(function (x) { if (x !== tg && dist(x, tg) <= 70) hurt(u, x, u.pv); }); }
        if (!alive(E).length) { result = 'win'; break; }
        if (!alive(A).length) { result = 'lose'; break; }
      }
      separate(all);
      shSrc = null; all.forEach(function (u) { var o = u.side === 'A' ? 'E' : 'A', s = u.alive && u.stun > 0, l = u.alive && u.slow > 0, b = u.alive && !!u.burn;
        if (s && !u._ps) status[o].stun++; if (l && !u._pl) status[o].slow++; if (b && !u._pb) status[o].burn++; u._ps = s; u._pl = l; u._pb = b; });
      if (!result && t >= B.timeLimit) result = 'timeout';
    }
    function finish() {
    var hpLeft = A.reduce(function (s, x) { return s + x.hp; }, 0) / A.reduce(function (s, x) { return s + x.maxHp; }, 0);
    var enemyLeft = E.reduce(function (s, x) { return s + x.hp; }, 0) / E.reduce(function (s, x) { return s + x.maxHp; }, 0);
    return { result: result, win: result === 'win', time: Math.round(t * 10) / 10, hpLeft: hpLeft, enemyLeft: enemyLeft,
      units: A.concat(E).map(function (x) { return { side: x.side, id: x.id, name: x.name, slot: x.slot, level: x.level, alive: x.alive, ultLv: x.ultLv, pasLv: x.pasLv, escaped: !!x.escaped, mob: x.h.mob || null, merc: !!x.merc, boss: !!x.boss,
        maxHp: Math.round(x.maxHp), hp: Math.round(Math.max(0, x.hp)), /* 2026-11-24: 위로금 피해 비율(dmgFrac)이 읽어요 */ dealt: Math.round(x.stats.dealt), taken: Math.round(x.stats.taken), healed: Math.round(x.stats.healed), ults: x.stats.ults, shield: Math.round(x.stats.shield) }; }),
      relics: allSkills.map(function (sk) { return { side: sk.side, id: sk.def.id, dealt: Math.round(sk.stats.dealt), healed: Math.round(sk.stats.healed), shield: Math.round(sk.stats.shield), casts: sk.stats.casts }; }), status: status,
      log: rec ? log : null };
    }
    var self = { A: A, E: E, skills: skills, enemySkills: enemySkills, status: status, potions: potionLog, /* 2026-11-26: 마신 물약이 걸린 영웅(화면 표시용) */ step: step, finish: finish, get time() { return t; }, get result() { return result; }, log: log };
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
  function stageName(data, n) { return (Math.floor(n / data.campaign.perChapter) + (data.campaign.chapterNo || 1)) + '-' + (n % data.campaign.perChapter + 1); } // chapterNo: E.chapterData로 만든 장이면 그 장 번호부터
  // 2026-11-26 장(챕터): 그 장의 data를 만들어요. 판 번호는 0~9 그대로 쓰고(장마다 처음부터), 적 레벨 +lvPlus, 늪 칸, 분노 단계, 이벤트 그룹만 바꿔요. 1장이면 data 그대로
  function chapterData(data, c) { var C = data.campaign, def = (C.chapterDefs || [])[(c || 1) - 1]; if (!def || (c || 1) <= 1) return data;
    var d = {}; for (var k in data) d[k] = data[k]; var cp = function (o) { var r = {}; for (var q in o) r[q] = o[q]; return r; };
    d.campaign = cp(C); d.campaign.chapters = 1; d.campaign.chapterNo = c; d.campaign.chapterDef = def; d.campaign.swamp = def.swamp || null;
    if (def.lvPlus) d.campaign.enemyLv = C.enemyLv.slice(0, C.perChapter).map(function (x) { return x + def.lvPlus; });
    if (def.bellTiers && data.bell) { d.bell = cp(data.bell); d.bell.tiers = def.bellTiers; }
    if (def.groups && data.events) { d.events = cp(data.events); d.events.groups = def.groups; }
    return d; }
  // 2026-11-27 장 고르기 화면용 장 정보(사용자: "이 화면에서 난이도뿐만 아니라 분노랑 맵 특징 같은 내용도 필요하지 않을까?"). 글은 데이터에서 만들어요
  //   { no, name, bg, lvPlus, feats: [{ name, desc }], bell: [{ tier, name, desc }], events: [{ name, desc, note }] }
  function chapterInfo(data, c) { var C = data.campaign, def = (C.chapterDefs || [])[(c || 1) - 1] || {}, BF = (data.bell && data.bell.fx) || {}, INF = (data.events && data.events.info) || {}, out = { no: c || 1, name: def.name || '', bg: def.bg || '', lvPlus: def.lvPlus || 0, feats: [], bell: [], events: [] };
    if (def.swamp) out.feats.push({ name: '늪지대', desc: '적 쪽 칸 ' + (def.swamp.cells || 0) + '곳이 늪지대다. 해당 영웅은 ' + (def.swamp.every || 1) + '초마다 공격력 ' + Math.round((def.swamp.amount != null ? def.swamp.amount : def.swamp.perSec || 0) * 100) + '%씩 오른다.' });
    if (def.lvPlus) out.feats.push({ name: '적 레벨', desc: '적 레벨이 ' + def.lvPlus + ' 높다.' });
    (def.bellTiers || (data.bell && data.bell.tiers) || []).forEach(function (T, i) { T.forEach(function (k) { var F = BF[k] || {}; out.bell.push({ tier: i + 1, name: F.name || k, desc: F.desc || '' }); }); });
    var G = def.groups || {}; for (var g in G) { var W = G[g], tot = 0, k2; for (k2 in W) tot += W[k2]; for (k2 in W) if (k2 !== g) out.events.push({ name: (INF[k2] || {}).name || k2, desc: (INF[k2] || {}).desc || '', note: ((INF[g] || {}).name || g) + ' 자리에 ' + Math.round(W[k2] / tot * 100) + '% 확률로 나온다.' }); }
    return out; }
  // 2026-11-27 제약(난이도): 그 구간의 data를 만들어요. 적 레벨 +lvPlus, 적 영웅 등급 앞당김, 적 유물 표, 훈장 배율. 쉬움(또는 없음)이면 data 그대로
  function difficultyData(data, id) { var C = data.campaign, T = ((C.difficulty || {}).tiers || []).filter(function (t) { return t.id === id; })[0]; if (!T || (!T.lvPlus && !T.gradeShift && !T.relics && (T.medalMul || 1) === 1)) return data;
    var d = {}; for (var k in data) d[k] = data[k]; var cp = function (o) { var r = {}; for (var q in o) r[q] = o[q]; return r; };
    d.campaign = cp(C); d.campaign.diff = T; if (T.lvPlus && C.enemyLv) d.campaign.enemyLv = C.enemyLv.map(function (x) { return x + T.lvPlus; });
    if (T.relics && C.enemySkills) { d.campaign.enemySkills = cp(C.enemySkills); d.campaign.enemySkills.table = T.relics; }
    return d; }
  // 적 팀: 초반엔 1~2명, 점점 5명까지. 코스트 높은 영웅은 뒤쪽 스테이지부터 나와요. 챕터 마지막은 보스
  function isFrontRole(h) { return h.role === 'tank' || h.role === 'warrior'; }
  function fromTable(arr, n) { return arr[Math.min(n, arr.length - 1)]; }
  function enemyMaxCost(data, n) { var c = 1; data.recruit.enemyMaxCost.forEach(function (x) { if (n >= x.from) c = x.cost; }); return c; }
  // 자리 배치: 탱커·전사는 앞(0·1)부터, 나머지는 뒤(2~4)부터 채워요
  function placeSlots(data, ids) { // ids: 영웅 id 문자열 또는 { id, ... } 객체 (같은 영웅이 여러 번 있어도 돼요)
    var used = [], out = [];
    function key(x) { return typeof x === 'string' ? x : x.id; }
    ids.slice().sort(function (a, b) { return isFrontRole(heroById(data, key(b))) - isFrontRole(heroById(data, key(a))); }).forEach(function (x) {
      var id = key(x), order = data.battle.arena.lines ? (isFrontRole(heroById(data, id)) ? [0, 1, 2, 3, 4, 5, 6, 7, 8] : [6, 7, 8, 3, 4, 5, 0, 1, 2]) : (isFrontRole(heroById(data, id)) ? [0, 1, 2, 3, 4] : [2, 3, 4, 0, 1]); // 9칸: 탱커·전사는 전방열부터, 나머지는 후반열부터
      var s = order.filter(function (i) { return used.indexOf(i) < 0; })[0]; used.push(s); out.push({ id: id, slot: s, ref: x });
    });
    return out;
  }
  // 특수 몹 이벤트 굴리기: null | { kind: 'goblin' | 'merchant' | 'merc', id?(용병 영웅) }
  // 이벤트 스테이지(전투 대신 들르는 판): 스테이지 수를 쓰지 않고 n과 n+1 사이(n.5)에 들어가요
  function isEventStage(data, kind) { var K = (data.events && data.events.stageKinds) || ['campfire', 'merchant', 'chest']; return K.indexOf(kind) >= 0 && !(kind === 'merchant' && !merchantNoBattle(data)); }
  // opts.battleOnly: 이벤트 스테이지는 빼고 굴려요 (이벤트 스테이지를 들른 뒤 그 스테이지 전투, 또는 다시 도전할 때)
  // 2026-11-26 물약(늪지 상인): 겹치지 않게 count개 id
  function potionSellPrice(data, id) { var P = potionById(data, id); return P ? Math.round(P.price * ((data.potions || {}).sellRate || 0.5)) : 0; } // 2026-11-27: 물약 판매 값 = 산 값의 절반
  function potionById(data, id) { return ((data.potions || {}).list || []).filter(function (p) { return p.id === id; })[0] || null; }
  function rollPotions(data, rnd, plv) { var SS = data.player && data.player.swampSlots, L = ((data.potions || {}).list || []).map(function (p) { return p.id; }), n = Math.min(L.length, SS ? SS[Math.max(0, Math.min((plv || 1) - 1, SS.length - 1))] : ((data.events || {}).swampShop || {}).count || 4), /* 2026-11-27: 파는 수는 레벨별(player.swampSlots) */ out = [];
    while (out.length < n) out.push(L.splice(Math.floor(rnd() * L.length), 1)[0]); return out; }
  function rollEvent(data, n, rnd, plv, opts) {
    var V = data.events; if (!V) return null;
    // forceEvery: N이면 스테이지 N개마다(n % N === 0) 이벤트 스테이지가 100% 나와요 (도구용, 0이면 꺼짐). 보스 앞도 나와요
    var force = !(opts && opts.battleOnly) && V.forceEvery > 0 && n > 0 && n % V.forceEvery === 0;
    var fixedK = opts && opts.forceKind ? opts.forceKind : !(opts && opts.battleOnly) && V.fixed && V.fixed[n] && (V.off || []).indexOf(V.fixed[n]) < 0 ? V.fixed[n] : null; // 정해 둔 판에는 그 이벤트가 꼭 나와요
    if (!fixedK && !force && (n < V.from || isBoss(data, n) || rnd() >= V.chance)) return null;
    var keys = Object.keys(V.weights).filter(function (k) { return (V.off || []).indexOf(k) < 0; }).filter(function (k) { return force ? isEventStage(data, k) : !(opts && opts.battleOnly && isEventStage(data, k)); }), tot = 0; keys.forEach(function (k) { tot += V.weights[k]; });
    if (!keys.length || tot <= 0) return null; var r = rnd() * tot, kind = keys[0]; for (var i = 0; i < keys.length; i++) { r -= V.weights[keys[i]]; if (r < 0) { kind = keys[i]; break; } }
    if (fixedK) kind = fixedK;
    var GR = V.groups && V.groups[kind]; if (GR && !fixedK) { var gk = Object.keys(GR), gt = gk.reduce(function (a, k) { return a + GR[k]; }, 0), gr = rnd() * gt; for (var gi = 0; gi < gk.length; gi++) { gr -= GR[gk[gi]]; if (gr < 0) { kind = gk[gi]; break; } } } // 2026-11-26: 같은 그룹(예: 방랑상인·늪지 상인)은 장별 확률로 하나
    var ev = { kind: kind };
    if (kind === 'swampShop') ev.ids = rollPotions(data, rnd, plv);
    if (kind === 'merc') { ev.id = pickHeroByGrade(data, rnd, plv); ev.price = mercPrice(data, ev.id, n); }
    if (kind === 'mobs') rollMobs(data, n, rnd, plv, ev);
    if (kind === 'mimic') rollMimic(data, n, rnd, plv, ev);
    if (kind === 'dais') ev.tag = rollDais(data, rnd);
    if (kind === 'fairy') { ev.ids = []; var FY = V.fairy || {}; if ((FY.triggerAt || []).indexOf(n) >= 0) { var W = data.player ? perk(data, plv).shopGrade : null, tp = skillPool(data).filter(function (x) { return x.trigger && (!W || W[(x.grade || 1) - 1] > 0); }); // 2026-11-23: 플레이어 레벨 등급 확률로 (1레벨에 전설 안 나오게)
      while (ev.ids.length < (FY.count || 4) && tp.length) { var tw = tp.reduce(function (s, x) { return s + (W ? W[(x.grade || 1) - 1] : 1); }, 0), tr = rnd() * tw, ti = 0; while (ti < tp.length - 1 && (tr -= (W ? W[(tp[ti].grade || 1) - 1] : 1)) >= 0) ti++; ev.ids.push(tp.splice(ti, 1)[0].id); } return ev; } // 연계 유물만
       for (var fi = 0; fi < ((V.fairy || {}).count || 4); fi++) { var fs0 = rollShop(data, rnd, plv, ev.ids.map(function (x) { return { id: x, level: 1 }; }), opts && opts.team); if (fs0.length) ev.ids.push(fs0[Math.floor(rnd() * fs0.length)]); } } // 요정: 겹치지 않는 유물 후보
    if (kind === 'campfire') { ev.ids = rollCampfire(data, rnd, plv); ev.bonus = ev.ids.map(function (id) { return heroBonus(data, id, n, rnd, plv); }); }
    // 갈림길(2026-11-22): 이벤트 스테이지면 다른 이벤트 스테이지 하나를 더 뽑아 둘 중 고르게 해요. { kind: 'fork', options: [ev, ev2] } (정해 둔 판은 갈림길 없음)
    if (V.fork && !(opts && (opts.forceKind || opts.noFork)) && !(V.fixed && V.fixed[n]) && isEventStage(data, kind)) {
      var k2s = keys.filter(function (k) { return k !== kind && isEventStage(data, k); }), t2 = 0; k2s.forEach(function (k) { t2 += V.weights[k]; });
      if (k2s.length && t2 > 0) { var r2 = rnd() * t2, kind2 = k2s[0]; for (var i2 = 0; i2 < k2s.length; i2++) { r2 -= V.weights[k2s[i2]]; if (r2 < 0) { kind2 = k2s[i2]; break; } }
        var o2 = {}; for (var q in (opts || {})) o2[q] = opts[q]; o2.forceKind = kind2; return { kind: 'fork', options: [ev, rollEvent(data, n, rnd, plv, o2)] }; } }
    return ev;
  }
  // 몹 무리: drops가 있는 몹 1마리를 뽑고, 그 몹의 drops 칸을 실제 물건 키로 정해요 (ev.ids = [id], ev.drops = 칸 키들)
  // 몹 판: drops가 있는 몹 종류 하나를 뽑아 pack마리. ev.ids = 몹 id들, ev.drops[i] = i번째 몹이 든 전리품 키 배열(loot개)
  // 미믹 판(2026-11-26): ev.ids = 미믹 id들, ev.drops[i] = i번째 미믹을 잡으면 받는 키들 (g:골드, s:유물)
  function rollMimic(data, n, rnd, plv, ev) { var MM = data.events.mimic || {}, P = data.player, li = Math.max(0, (plv || 1) - 1), cnt = P && P.mimicCount ? P.mimicCount[Math.min(li, P.mimicCount.length - 1)] : 3, rew = stageReward(data, n, 0, null, plv);
    var nk = (plv || 1) >= (MM.kingFrom || 99) ? 1 : 0, nb = Math.min(cnt - nk, P && P.mimicBlue ? P.mimicBlue[Math.min(li, P.mimicBlue.length - 1)] : 0), nw = cnt - nk - nb; /* 갈색 nw, 파랑 nb, 왕관 nk 순서 */
    ev.ids = []; ev.drops = []; ev.blue = []; for (var i = 0; i < cnt; i++) { var king = i >= nw + nb; ev.ids.push(king ? 'mimicKing' : 'mimic'); ev.blue.push(!king && i >= nw);
      if (king) { var sid = rollScroll(data, rnd, plv, []); ev.drops.push((sid ? ['s:' + sid] : []).concat(['g:' + Math.max(1, Math.round(rew * (MM.kingGold || 0.5)))])); } else ev.drops.push(['g:' + Math.max(1, Math.round(rew * (MM.gold || 0.3)))]); }
    return ev; }
  function rollMobs(data, n, rnd, plv, ev) { var M = (data.mobs || []).filter(function (m) { return m.drops && m.drops.length; }), MB = data.events.mobs || {}, rew = stageReward(data, n, 0, null), els = Object.keys(data.elements.names);
    ev.ids = []; ev.drops = []; if (!M.length) return ev; var m = M[Math.floor(rnd() * M.length)], got = [];
    for (var i = 0; i < (m.pack || 1); i++) { ev.ids.push(m.id); var bag = [];
      for (var j = 0; j < (m.loot || 1); j++) { var k = m.drops[Math.floor(rnd() * m.drops.length)], sid = k === 's' ? rollScroll(data, rnd, plv, got) : null; if (sid) got.push({ id: sid, level: 1 });
        bag.push(k === 'p' ? 'p:' + els[Math.floor(rnd() * els.length)] : k === 'm' ? 'm:' + (MB.mana || 1) : sid ? 's:' + sid : 'g:' + Math.max(1, Math.round(rew * (MB.gold || 0.5) * (0.7 + rnd() * 0.6)))); }
      ev.drops.push(bag); }
    return ev; }
  // 몹 무리 전리품 칸: 몹을 쓰러뜨렸으면(units: 전투 결과) 그 몹의 drops 칸 전부, 아니면 빈 배열. units가 없으면 전부
  // 진영 발판: pads = { 전장 칸 번호: 속성 }. 그 칸에 선 영웅은 전투 동안 그 진영이 더해져요(원래 진영 + 발판 진영 둘 다: 시너지·진영 조건 유물에 쳐요. 상성·속성 효과는 원래 진영)
  function padTeam(team, pads) { return !pads ? team : team.map(function (x) { var el = pads[x.slot]; if (!el) return x; var y = {}; for (var q in x) y[q] = x[q]; if (String(el).indexOf('r:') === 0) y.race2 = el.slice(2); else y.el2 = el; return y; }); } // 단상(2026-11-26): 'r:종족'이면 종족, 아니면 속성
  // 단상 1개 뽑기: 'r:beast' 같은 종족이나 'fire' 같은 속성. not을 주면 그것과 다른 걸 뽑아요(다시 돌리기)
  function rollDais(data, rnd, not) { var DS = (data.events && data.events.dais) || {}, K = DS.kinds || { race: 1, el: 1 }, rc = Object.keys(data.races || {}).filter(function (r) { return r !== 'monster'; }).map(function (r) { return 'r:' + r; }), el = Object.keys(data.elements.names);
    for (var tries = 0; tries < 20; tries++) { var pool = rnd() * ((K.race || 0) + (K.el || 0)) < (K.race || 0) ? rc : el, v = pool[Math.floor(rnd() * pool.length)]; if (v !== not) return v; } return v; }
  // 양탄자 칸 뽑기(2026-11-26): 우리 쪽 칸(battle.arena.pos 번호) 중 양탄자가 없는 칸에서 무작위. 모든 칸에 양탄자가 있을 때만 양탄자 칸 중 하나를 골라 덮어요(개수 제한 없음. 사용자: "빈슬롯 중에서 하고 없으면 있는 슬롯도 포함", "빈칸이 이렇게 많은데 왜?")
  function rollDaisCell(data, rnd, pads) { var n = data.battle.arena.pos.length, has = Object.keys(pads || {}).map(Number), pool = [], i;
    for (i = 0; i < n; i++) if (has.indexOf(i) < 0) pool.push(i);
    if (!pool.length) pool = has;
    return pool.length ? pool[Math.floor(rnd() * pool.length)] : 0; }
  function eventRerolls(data, plv) { var P = data.player && data.player.eventReroll; return P ? P[Math.max(0, Math.min((plv || 1) - 1, P.length - 1))] : rerollMax(data, plv); } // 모닥불·요정 룰렛 리셋 횟수
  function daisRerolls(data, plv) { var P = data.player && data.player.daisReroll; return P ? P[Math.max(0, Math.min((plv || 1) - 1, P.length - 1))] : 0; }
  // 돈고블린 홀짝: 걸 골드(스테이지 n), 결과 판정. pick = 'odd' | 'even', roll = 1~6 같은 숫자
  // 돈고블린 룰렛(2026-11-26): 한 번 돌리는 값, 레벨별 횟수, 후보(골드 칸 = 낸 값 × goldWin)
  function grollCost(data, n, plv) { var G = data.events.groll || {}; return Math.max(1, Math.round(stageReward(data, n, 0, null, plv) * (G.cost || 1))); }
  function grollSpins(data, plv) { var S = data.player && data.player.grollSpins; return S ? S[Math.max(0, Math.min((plv || 1) - 1, S.length - 1))] : 1; }
  // 후보(2026-11-26 별도 표): 영웅 heroes명 + 유물 skills개 + 골드 goldSlots칸(낸 값 × goldWin). 등급은 groll.grade[레벨]. rnd를 안 주면 스테이지·레벨로 고정 시드 → 같은 스테이지는 같은 구성
  function rollGroll(data, n, rnd, plv, owned) { var G = data.events.groll || {}, W = G.grade ? G.grade[Math.max(0, Math.min((plv || 1) - 1, G.grade.length - 1))] : [1, 1, 1, 1], out = [];
    rnd = rnd || makeRng(n * 7919 + (plv || 1) * 104729 + 17);
    function pickG() { var t = W.reduce(function (a, b) { return a + b; }, 0), x = rnd() * t; for (var k = 0; k < W.length; k++) { x -= W[k]; if (x < 0) return k + 1; } return 1; }
    var PL0 = data.recruit.pool, hs = data.heroes.filter(function (h) { return !h.mob && h.art !== false && (!PL0 || !PL0.length || PL0.indexOf(h.id) >= 0); });
    for (var i = 0; i < (G.heroes || 0) && hs.length; i++) { var g = pickG(), c = []; for (var d = 0; d < 4 && !c.length; d++) c = hs.filter(function (h) { return Math.abs((h.grade || 1) - g) === d; }); var h = c[Math.floor(rnd() * c.length)]; hs.splice(hs.indexOf(h), 1); out.push('h:' + h.id); }
    var sk = skillPool(data).filter(function (x) { return canTake(data, owned || [], x.id, 999); });
    for (var j = 0; j < (G.skills || 0) && sk.length; j++) { var g2 = pickG(), c2 = []; for (var d2 = 0; d2 < 4 && !c2.length; d2++) c2 = sk.filter(function (x) { return Math.abs((x.grade || 1) - g2) === d2; }); var s = c2[Math.floor(rnd() * c2.length)]; sk.splice(sk.indexOf(s), 1); out.push('s:' + s.id); }
    var gold = grollCost(data, n, plv) * (G.goldWin || 2); for (var q = 0; q < (G.goldSlots || 0); q++) out.push('g:' + gold);
    return out; }
  function oddEvenBet(data, n) { var O = data.events.oddeven || {}; return Math.max(1, Math.round(stageReward(data, n, 0, null) * (O.bet || 1))); }
  function oddEvenResult(data, n, pick, roll, k) { var bet = oddEvenBet(data, n) * Math.max(1, Math.min(k || 1, (data.events.oddeven || {}).maxBets || 1)), win = (roll % 2 === 1 ? 'odd' : 'even') === pick; return { bet: bet, win: win, gain: win ? bet * ((data.events.oddeven || {}).win || 2) - bet : -bet }; }
  function mobLoot(st, units) { var out = []; if (!st.event || !st.event.drops) return out; // 쓰러뜨린 몹(units: 전투 결과)이 든 전리품을 모두. units가 없으면 전부
    st.team.forEach(function (u, i) { var dead = !units || units.some(function (x) { return x.side === 'E' && x.slot === u.slot && !x.alive && !x.escaped; }); if (dead) out = out.concat(st.event.drops[i] || []); }); return out; }
  // 모닥불: 영웅 count명이 둘러앉아 있어요. 말풍선을 누르면 룰렛이 돌아 그중 1명이 동료가 돼요(전투 없음). 등급은 플레이어 레벨 확률(atStart면 레벨 1 확률)
  function rollCampfire(data, rnd, plv) { var CF = data.events.campfire, out = [], cn = data.player && data.player.campfire ? perk(data, plv).campfire : CF.count; for (var i = 0; i < cn; i++) out.push(pickHeroByGrade(data, rnd, plv || 1, out)); return out; }
  function campfireAtStart(data) { var CF = data.events && data.events.campfire; return !!(CF && CF.atStart) && (data.events.off || []).indexOf('campfire') < 0; }
  function mercPrice(data, id, n) { return Math.round(data.events.merc.price * heroGrade(data, id) * Math.pow(data.shop.priceGrowth, n)); } // 등급이 높을수록 비싸요
  // 방랑상인 진열: [{ type: 's'|'h', id, gold, mana, price, cur: 'gold'|'mana' }]. 값은 원래 값 × discount, 최소 minPrice (재화는 하나만)
  // owned(가진 스킬)를 주면 가진 스킬은 등급업 값으로 쳐요. price는 그 재화의 값이에요
  function merchantOff(data, plv) { var P = data.player, M = data.events.merchant; return P && P.merchantOff ? P.merchantOff[Math.max(0, Math.min((plv || 1) - 1, P.merchantOff.length - 1))] : Math.round((1 - (M.discount != null ? M.discount : (M.priceMul || 1))) * 100); } // 방랑상인 할인율(%)
  function merchantPrice(data, v, plv) { var M = data.events.merchant, d = 1 - merchantOff(data, plv) / 100; return v > 0 ? Math.max(M.minPrice || 1, Math.round(v * d)) : 0; }
  function rollMerchant(data, n, rnd, plv, owned) { var M = data.events.merchant, out = [], PL = data.player, li = Math.max(0, (plv || 1) - 1), nH = PL && PL.merchantHeroes ? PL.merchantHeroes[Math.min(li, PL.merchantHeroes.length - 1)] : M.heroes, nS = PL && PL.merchantSlots ? PL.merchantSlots[Math.min(li, PL.merchantSlots.length - 1)] - nH : M.skills; /* 2026-11-26: 상품 수가 플레이어 레벨 따라 */
    var sk = skillPool(data).filter(function (x) { return (x.grade || 1) >= M.minGrade && canTake(data, owned || [], x.id, 999); }).map(function (x) { return x.id; });
    for (var i = 0; i < nS && sk.length; i++) { var id = sk.splice(Math.floor(rnd() * sk.length), 1)[0], bp = skillBuyPrice(data, id, n, owned || []);
      out.push({ type: 's', id: id, base: bp.gold || bp.mana, cur: bp.gold > 0 ? 'gold' : 'mana' }); }
    var gotH = [];
    for (var j = 0; j < nH; j++) { var hid = pickHeroByGrade(data, rnd, (plv || 1) + 2, gotH); gotH.push(hid);
      out.push({ type: 'h', id: hid, base: Math.round(M.heroPrice * heroGrade(data, hid) * Math.pow(data.shop.priceGrowth, n)), cur: 'gold' }); } // 상인은 레벨 +2 확률로 조금 더 좋은 영웅
    // 2026-11-26: 상품마다 할인율이 달라요(최대 = 레벨 할인율). offMin×최대 ~ 최대 사이 offStep 단위, 한 개는 꼭 최대 ("UP TO 50%")
    var mx = merchantOff(data, plv), st = M.offStep || 5, lo = Math.ceil(mx * (M.offMin != null ? M.offMin : 0.5) / st) * st, top = out.length ? Math.floor(rnd() * out.length) : -1;
    out.forEach(function (it, k) { var o = k === top ? mx : Math.min(mx, lo + st * Math.floor(rnd() * (Math.floor((mx - lo) / st) + 1))), p = it.base > 0 ? Math.max(M.minPrice || 1, Math.round(it.base * (1 - o / 100))) : 0;
      it.off = o; it.price = p; it.gold = it.cur === 'gold' ? p : 0; it.mana = it.cur === 'mana' ? p : 0; });
    return out; }
  function merchantNoBattle(data) { var M = data.events && data.events.merchant; return !!(M && M.battle === false); }
  // 보물상자 보상: frac = 입힌 피해 / 최대 체력(0~1), bell = 울린 횟수. 반환 { tier(넘은 칸 수), gold, mana, scroll(두루마리 개수), next(다음 칸 at, 없으면 null) }
  function chestGrade(data, plv) { var P = data.player, CH = data.events.chest; if (!CH.grades || !P || !P.chestGrade) return null; return Math.max(1, Math.min(CH.grades.length, P.chestGrade[Math.max(0, Math.min((plv || 1) - 1, P.chestGrade.length - 1))])); } // 보물상자 등급(1~3), 표가 없으면 null
  function chestTiers(data, plv) { var g = chestGrade(data, plv); return g ? data.events.chest.grades[g - 1].tiers : data.events.chest.tiers; }
  function chestReward(data, n, bell, frac, plv) { var CH = data.events.chest, CB = CH.bell || {}, G = chestGrade(data, plv), mul = G ? 1 : 1 + (CB.reward || 0) * (bell || 0), base = stageReward(data, n, 0, null), out = { tier: 0, gold: 0, mana: 0, scroll: 0, next: null, tiers: 0 };
    var TT = chestTiers(data, plv); out.tiers = TT.length; TT.forEach(function (T) { if (frac + 1e-9 >= T.at) { out.tier++; out.gold += (T.gold || 0) * base * mul;
        if (T.mana) out.mana += Math.max(T.mana, Math.floor(T.mana * mul)); if (T.scroll) out.scroll += Math.max(T.scroll, Math.floor(T.scroll * mul)); }
      else if (out.next == null) out.next = T.at; });
    out.gold = Math.round(out.gold); return out; }
  // 두루마리 1장: 상점 등급 확률로 스킬 하나 (가질 수 있는 것 중에서)
  function rollScroll(data, rnd, plv, owned, team) { var ids = rollShop(data, rnd, plv, owned || [], team); return ids.length ? ids[Math.floor(rnd() * ids.length)] : null; }
  // 이 스테이지에서 울릴 수 있는 최대 횟수: 전장 빈자리만큼 (적이 이미 5명이면 0)
  // ev: 그 판 이벤트. 용병은 적 1명을 차지하니 빈자리에서 빼요
  function bellMax(data, n, ev) { if (ev && ev.kind === 'chest' && data.events.chest.grades) return 0; return data.bell ? data.bell.max : 0; } // 어느 판이든 max번 (적은 5명을 넘어도 돼요)
  // 스테이지 n(0부터)의 적 레벨. levelStep이 숫자면 스테이지마다 그만큼, 배열이면 챕터별 오름폭 [1장, 2장, 3장]
  // 시작 덤 영웅: recruit.startExtra명, 플레이어 1레벨 등급 확률로 (have와 겹치지 않게). 화면도 새 판 시작 때 이걸 써요
  function startExtras(data, rnd, have) { var out = []; for (var i = 0; i < (data.recruit.startExtra || 0); i++) out.push(pickHeroByGrade(data, rnd, 1, (have || []).concat(out))); return out; }
  // 레벨업 선택지 후보: hero = 가진 영웅 id 중 무작위, relic = 가진 유물 중 최고 등급이 아닌 것 무작위 (없으면 null)
  // 레벨업 보상 종류: 새 레벨(lv)마다 levelPick을 번갈아 1개. 그 종류에 후보가 없으면 다른 종류, 둘 다 없으면 null
  function levelPickKind(data, lv, units, owned) { var P = data.player.levelPick || []; for (var i = 0; i < P.length; i++) { var k = P[(lv + i) % P.length]; if (levelPickRoll(data, function () { return 0; }, k, units, owned) != null) return k; } return null; }
  function levelPickRoll(data, rnd, kind, units, owned) { var L;
    if (kind === 'hero') { L = (units || []).filter(function (u) { return !heroById(data, u.id).mob; }).map(function (u) { return u.id; }); }
    else if (kind === 'skill') { L = (units || []).filter(function (u) { return unitSkills(data, u)[0].lv < ((data.transcend || {}).maxLv || 5); }).map(function (u) { return u.uid; }); } // 스킬: 개체 uid
    else { L = (owned || []).filter(function (s) { return canTake(data, owned, s.id, 999); }).map(function (s) { return s.id; }); }
    return L.length ? L[Math.floor(rnd() * L.length)] : null; }
  // 캐릭터 강화(=초월 강화): 그 개체의 기본 스킬 레벨 +1 (초월 승급과 같은 칸 u.tr[자기 id])
  function skillUp(data, units, uid) { var u = (units || []).filter(function (x) { return x.uid === uid; })[0]; if (!u) return false; u.tr = u.tr || {}; u.tr[u.id] = (u.tr[u.id] || 0) + 1; return true; }
  function heroLevel(data, plv) { var C = data.campaign; return C.heroLv === 'player' ? (plv || 1) + (C.heroLvPlus || 0) : data.startLevel; } // 내 영웅 레벨(= HUD에 보이는 플레이어 레벨)
  function stageLevel(data, n) { var C = data.campaign, S = C.levelStep, lv = 1; if (C.enemyLv) return C.enemyLv[Math.min(n, C.enemyLv.length - 1)]; // 2026-11-22: 적 레벨 표(보이는 레벨 = 실제 세기)
    if (typeof S === 'number') lv += n * S; else for (var i = 0; i < n; i++) lv += S[Math.min(Math.floor(i / C.perChapter), S.length - 1)];
    return Math.round(lv + (C.walls.indexOf(n) >= 0 ? C.wallBonus : 0)); }
  // 종 효과: k번째 울림은 tiers[k-1]에서 하나 (스테이지·레벨로 정해져요)
  function bellFx(data, n, bell, plv) { var BL = data.bell, out = []; if (!BL || !BL.tiers) return out;
    for (var k = 0; k < (bell || 0) && k < BL.tiers.length; k++) { var r = makeRng(n * 977 + 53 + (plv || 1) * 7919 + k * 131), L = BL.tiers[k]; r(); out.push(L[Math.floor(r() * L.length)]); } return out; }
  function stageTeam(data, n, ev, bell, plv) { plv = plv || 1; bell = Math.max(0, Math.min(bell || 0, bellMax(data, n, ev)));
    var C = data.campaign, R = data.recruit, lv = stageLevel(data, n);
    var mercN = ev && ev.kind === 'merc' ? 1 : 0, base = fromTable(R.enemyCount, n), cnt = Math.min(R.fieldSlots, base + mercN) - mercN + (data.bell ? data.bell.enemy * bell : 0), rnd = makeRng(n * 977 + 13 + plv * 7919);
    // 적 영웅: 플레이어 레벨의 등급 확률(player.heroGrade)로 한 명씩 뽑아요. 같은 스테이지·레벨이면 늘 같은 적, 종으로 늘어난 적은 뒤에 붙어요
    var bfx = (ev && (ev.kind === 'mobs' || ev.kind === 'chest')) ? [] : bellFx(data, n, bell, plv), BFX = (data.bell && data.bell.fx) || {}, bv = function (k) { return (BFX[k] || {}).v || 0; }, bhas = function (k) { return bfx.indexOf(k) >= 0; };
    var baseCnt = cnt; if (bhas('more')) cnt += bv('more');
    var picks = []; for (var pi = 0; pi < cnt; pi++) picks.push(pickHeroByGrade(data, rnd, plv + ((C.diff || {}).gradeShift || 0), picks)); /* 2026-11-27 제약: 적 등급만 앞당김 */ if (n === 0 && C.firstEnemy && picks.length) picks[0] = C.firstEnemy; // 1-1 적 고정
    if (bhas('elite')) { var topG = picks.reduce(function (g, id) { return Math.max(g, heroGrade(data, id)); }, 1), eg = Math.min(4, topG + 1), PL = data.heroes.filter(function (h) { return h.art !== false && (h.grade || 1) === eg && picks.indexOf(h.id) < 0; });
      if (PL.length) picks.push(PL[Math.floor(rnd() * PL.length)].id); }
    var em = C.heroLv === 'player' ? C.enemyMul : C.enemyMul * Math.min(1, C.earlyMul + n * C.earlyRamp); // 영웅 레벨 = 플레이어 레벨이면 숨은 초반 배율 없음 // 초반 적은 약하게 시작해서 점점 원래 세기로
    if (n === 0 && C.firstEnemyMul) em *= C.firstEnemyMul; // 1-1은 시작 영웅 혼자서도 이기게
    var m = { hp: em, atk: em }, boss = isBoss(data, n);
    // 자리·레벨은 따로 굴려요(2026-11-23): 종으로 적이 늘어도 있던 적의 자리·레벨이 그대로. 자리: 뽑힌 순서대로 차례로 앉혀요(종으로 적이 늘어도 먼저 있던 적의 자리가 안 바뀌게). 용병은 늘 4번 자리
    var AP = data.battle.arena, FC = AP.frontCells || [0, 1, 2], MC = AP.midCells || [3, 4, 5], BC = AP.backCells || [6, 7, 8, 9, 10], rndP = makeRng(n * 977 + 61 + plv * 7919), rndL = makeRng(n * 977 + 67 + plv * 7919), shuf = function (L) { L = L.slice(); for (var q = L.length - 1; q > 0; q--) { var j = Math.floor(rndP() * (q + 1)), tq = L[q]; L[q] = L[j]; L[j] = tq; } return L; }, frontOrd = shuf(FC), midOrd = shuf(MC), backOrd = shuf(BC);
    var usedSlots = (mercN || (ev && ev.kind === 'goblin')) ? [4] : [], team = picks.map(function (id) { var rg = heroById(data, id).range, order = (rg === 'long' || rg === 'far') ? (AP.lines ? backOrd.concat(midOrd, frontOrd) : midOrd.concat(backOrd, frontOrd)) : frontOrd.concat(midOrd, backOrd); // 2026-11-23: 사거리 1~2칸은 앞 1~2줄, 3~4칸은 3~4줄에서 무작위, 그 줄이 차면 다음 줄
      var s = order.filter(function (q) { return usedSlots.indexOf(q) < 0; })[0]; usedSlots.push(s); var sp = lv >= 3 ? C.enemyLvSpread || 0 : 0; return { id: id, level: Math.max(1, lv + (sp ? Math.floor(rndL() * (2 * sp + 1)) - sp : 0)), slot: s, mul: m }; }); // 적마다 레벨이 조금씩 달라요
    if (boss) { var b = team.slice(0, baseCnt).reduce(function (x, y) { return y.slot < x.slot ? y : x; }); b.boss = true; if (C.bossLvPlus != null) b.level = lv + C.bossLvPlus; else b.mul = { hp: C.bossHp * em, atk: C.bossAtk * em }; } // 보스: 레벨이 더 높아요(보이는 차이)
    var ES = C.enemySkills, ecount = 0, eskills = [];
    if (ES) { ES.table.forEach(function (x) { if (n >= x.from) ecount = x.count; }); if (boss && ecount) ecount += ES.bossExtra || 0;
      var sids = skillPool(data).map(function (x) { return x.id; }), rndS = makeRng(n * 977 + 29 + plv * 7919); // 적 스킬은 따로 굴려요: 종으로 적이 늘어도 스킬이 바뀌지 않게
      for (var k = sids.length - 1; k > 0; k--) { var r2 = Math.floor(rndS() * (k + 1)), t2 = sids[k]; sids[k] = sids[r2]; sids[r2] = t2; }
      eskills = sids.slice(0, Math.min(ecount + (data.bell && data.bell.skill || 0) * bell + (bhas('relic') ? bv('relic') : 0), data.skills.slots)).map(function (id) { return { id: id, level: data.skills.gradeUp ? 1 : Math.min(data.skills.maxLevel, 1 + Math.floor(n / ES.levelEvery)) }; }); } // 적 스킬은 태생 등급 그대로
    if (ev && ev.kind === 'mobs') return { n: n, name: stageName(data, n), level: lv, boss: false, wall: false, skills: [], event: ev, bell: 0, // 몹 무리 판: 적 스킬·종 없음
      team: ev.ids.map(function (id, i) { var hm = ((data.events.mobs || {}).hp || 1) * (heroById(data, id).hpMul || 1); return { id: id, level: lv, slot: i, mul: { hp: em * hm, atk: em }, mob: true, drop: ev.drops[i] || [] }; }) };
    if (ev && ev.kind === 'mimic') { var MS = (data.events.mimic || {}).slots || [0, 1, 2, 3], MC = { w: 0, b: 0, k: 0 }; return { n: n, name: stageName(data, n), level: lv, boss: false, wall: false, skills: [], event: ev, bell: 0, /* 미믹 판: 적 스킬·종 없음, 공격력 0 */
      team: ev.ids.map(function (id, i) { var k = id === 'mimicKing' ? 'k' : ev.blue && ev.blue[i] ? 'b' : 'w', sl = Array.isArray(MS) ? MS[i] : (MS[k] || [])[MC[k]++]; /* 예전 저장(ev.blue 없음)은 모두 갈색 자리 */
        return { id: id, level: lv, slot: sl != null ? sl : i, mul: { hp: em * (k === 'b' ? (data.events.mimic.blueHp || 1) : 1), atk: 0 }, mob: true, blue: k === 'b', drop: ev.drops[i] || [] }; }) }; }
    if (ev && ev.kind === 'chest') { // 보물상자 판: 상자 1마리만, 적 스킬 없음. 종을 울릴 때마다 체력이 늘어요
      var CB = data.events.chest.bell || {}, CG = chestGrade(data, plv), hm = CG ? data.events.chest.grades[CG - 1].hp : 1 + (CB.hp || 0) * bell;
      return { n: n, name: stageName(data, n), level: lv, boss: false, wall: false, team: [{ id: 'chest', level: lv, slot: 3, /* 2026-11-24: 가운데 줄 가운데(화면 5번 칸) */ mul: { hp: em * hm, atk: 0 }, mob: true }], skills: [], event: ev, bell: bell }; }
    var rndB = makeRng(n * 977 + 41 + plv * 7919); team.forEach(function (u) { u.bonus = heroBonus(data, u.id, n, rndB, plv); if (bhas('haste')) u.spd = 1 + bv('haste'); if (bhas('energy')) u.energy = bv('energy'); if (bhas('endure')) u.endure = 1;
      if (bhas('rage') || bhas('tough')) u.mul = { hp: (u.mul.hp || 1) * (1 + (bhas('tough') ? bv('tough') : 0)), atk: (u.mul.atk || 1) * (1 + (bhas('rage') ? bv('rage') : 0)) }; });
    if (bhas('star') && team.length) { var sU = team[Math.floor(rndB() * team.length)], sg = gradeMul(data, 1 + bv('star')) / gradeMul(data, 1); sU.star = 1 + bv('star'); sU.mul = { hp: sU.mul.hp * sg, atk: sU.mul.atk * sg }; } // 정예: 무작위 적 1명 별 +1 (2026-11-23) // 따로 굴려요: 종으로 적이 늘어도 있던 덤은 그대로
    // 2026-11-26 늪 칸(2장): 적 쪽 칸 cells개(+분노 '늪 확장'). 적이 선 칸에서 먼저 골라요(빈 늪은 뜻이 없어서). 늪에 선 적은 살아 있는 every초마다 공격력 +amount(최대 없음, 2026-11-27 계단식)
    var SW = C.swamp, swamp = []; if (SW && team.length) { var rndW = makeRng(n * 977 + 71 + plv * 7919), occ = team.map(function (u) { return u.slot; }), nW = (SW.cells || 0) + (bhas('swamp') ? bv('swamp') : 0);
      for (var wi = occ.length - 1; wi > 0; wi--) { var wj = Math.floor(rndW() * (wi + 1)), wt = occ[wi]; occ[wi] = occ[wj]; occ[wj] = wt; }
      swamp = occ.slice(0, nW); team.forEach(function (u) { if (swamp.indexOf(u.slot) >= 0) { u.swamp = SW.amount != null ? SW.amount : SW.perSec; u.swampE = SW.every || 0; } }); }
    if (ev && ev.kind === 'goblin') team.push({ id: 'goblin', level: lv, slot: 4, mul: m, mob: true });
    if (mercN) team.push({ id: ev.id, level: lv, slot: 4, mul: m, merc: true });
    return { n: n, name: stageName(data, n), level: lv, boss: boss, wall: C.walls.indexOf(n) >= 0, team: team, skills: eskills, event: ev || null, bell: bell, bellFx: bfx, curse: bhas('curse') ? bv('curse') : 0, swamp: swamp };
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
  // team: 내 영웅 id 목록(선택). 그 영웅들 태그에 맞는 유물이 더 잘 나와요 (shop.tagBoost: 맞는 영웅 1명마다 뽑힐 확률 +배)
  function tagFit(data, id, team) { var d0 = skillById(data, id), tg = d0 && d0.tag; if (!tg || !team || !team.length) return 0; var k = tg.race != null ? 'race' : tg.job != null ? 'job' : 'el', v = tg[k]; if (v === '*') return 0; var vs = [].concat(v);
    return team.filter(function (hid) { var h = heroById(data, hid); return h && vs.indexOf(h[k]) >= 0; }).length; }
  function rollShop(data, rnd, plv, owned, team) { var SR = data.shop.rows; if (SR) return rollShopRows(data, rnd, plv, owned || [], team);
    var ids = skillPool(data).map(function (x) { return x.id; }), out = [], W = plv && data.player ? perk(data, plv).shopGrade : null;
    while (out.length < Math.min(data.shop.stock, ids.length) && ids.length) {
      var cand = ids;
      if (W) { var byG = {}; ids.forEach(function (id) { var g = skillGrade(data, id); (byG[g] = byG[g] || []).push(id); });
        var tot = 0, g2; for (g2 = 1; g2 <= 4; g2++) if (byG[g2]) tot += W[g2 - 1] || 0;
        if (tot > 0) { var r = rnd() * tot; for (g2 = 1; g2 <= 4; g2++) { if (!byG[g2]) continue; r -= W[g2 - 1] || 0; if (r < 0) { cand = byG[g2]; break; } } } }
      var id = cand[Math.floor(rnd() * cand.length)]; out.push(id); ids.splice(ids.indexOf(id), 1); } return out; }
  // 상점 영웅 칸: [{ id, price }] heroes개. 등급 확률은 플레이어 레벨(heroGrade 표), 서로 겹치지 않아요
  function rollShopHeroes(data, rnd, plv, n) { var S = data.shop, out = [], got = [];
    for (var i = 0; i < (S.heroes || 0); i++) { var id = pickHeroByGrade(data, rnd, plv || 1, got); if (!id) break; got.push(id); out.push({ id: id, price: Math.round((S.heroPrice || 110) * heroGrade(data, id) * Math.pow(S.priceGrowth, n || 0)) }); }
    return out; }
  function rollShopRows(data, rnd, plv, owned, team) { var TB = data.shop.tagBoost || 0; var SR = data.shop.rows, W = plv && data.player ? perk(data, plv).shopGrade : null, out = [];
    var all = skillPool(data).map(function (x) { return x.id; }).filter(function (id) { return canTake(data, owned, id, 999); });
    function target(id) { var o = owned.filter(function (x) { return x.id === id; })[0]; return o ? Math.min(data.skills.maxGrade || 4, skillGradeNow(data, o) + 1) : skillGrade(data, id); }
    [["gold", false], ["mana", true]].forEach(function (row) { var pool = all.filter(function (id) { return (skillBuyPrice(data, id, 0, owned).mana > 0) === row[1]; });
      var nRow = row[0] === 'gold' && plv && data.player && data.player.shopSlots ? perk(data, plv).shopSlots : (SR[row[0]] || 0); for (var k = 0; k < nRow && pool.length; k++) { var tot = 0, ws = pool.map(function (id) { var w = (W ? (W[target(id) - 1] || 0) : 1) * (1 + TB * tagFit(data, id, team)); tot += w; return w; }); if (!tot) { ws = pool.map(function () { return 1; }); tot = pool.length; } var x = rnd() * tot, j = 0; // 2026-11-23: 확률 0인 등급은 안 나와요(예전 +1 때문에 1레벨에도 전설이 나왔어요)
        while (j < pool.length - 1 && (x -= ws[j]) >= 0) j++; out.push(pool.splice(j, 1)[0]); } });
    return out; }
  // ───── 플레이어 레벨 ─────
  // xp(누적 경험치) → { level, cur(이번 레벨에서 쌓인 양), need(다음 레벨까지 필요한 양, 최고 레벨이면 0) }
  function playerLevel(data, xp) { var P = data.player, lv = 1, left = xp || 0;
    while (lv - 1 < P.need.length && left >= P.need[lv - 1]) { left -= P.need[lv - 1]; lv++; }
    return { level: lv, cur: lv - 1 < P.need.length ? left : 0, need: lv - 1 < P.need.length ? P.need[lv - 1] : 0, max: lv - 1 >= P.need.length }; }
  // 레벨 효과: { field 전장 칸, skillSlots 스킬 칸, shopGrade 등급 가중치 }
  function perk(data, lv) { var P = data.player, i = Math.max(0, Math.min((lv || 1) - 1, P.field.length - 1));
    return { field: P.field[i], skillSlots: P.skillSlots[i], shopGrade: P.shopGrade[Math.min(i, P.shopGrade.length - 1)], shopSlots: P.shopSlots ? P.shopSlots[Math.min(i, P.shopSlots.length - 1)] : 0, campfire: P.campfire ? P.campfire[Math.min(i, P.campfire.length - 1)] : 0, clearGold: P.clearGold ? P.clearGold[Math.min(i, P.clearGold.length - 1)] : 0, lootWeight: P.lootWeight ? P.lootWeight[Math.min(i, P.lootWeight.length - 1)] : null, bag: P.bag ? Math.min(10, P.bag[Math.min(i, P.bag.length - 1)]) : data.recruit.bag, potion: P.potion ? P.potion[Math.min(i, P.potion.length - 1)] : 2 }; }
  // 살 수 있나: 새 스킬은 빈 칸이 있어야, 가진 스킬은 최고 레벨 전이어야
  function canTake(data, owned, id, slots) { var o = owned.filter(function (s) { return s.id === id; })[0]; return o ? o.level < skillMaxLevel(data, id) : owned.length < (slots || data.skills.slots); }
  function takeSkill(data, owned, id) { var o = owned.filter(function (s) { return s.id === id; })[0]; if (o) o.level++; else owned.push({ id: id, level: 1 }); }
  // 스킬 판매: 판매가 = 지금 상점가 × 레벨 × sellRate
  function skillSellPrice(data, s, cleared) { return Math.round(skillPrice(data, s.id, cleared) * (s.level || 1) * (data.shop.sellRate == null ? 0.5 : data.shop.sellRate)); }
  // 영웅 판매가 = 등급별 값 × 합쳐진 수 (★1 1명 · ★2 2명 · ★3 4명)
  // 열·별 유물이 걸리는 아군 (화면 표시용, 전투 시작 때 규칙과 같아요). team: [{ slot, star? }] → 걸리는 아군의 순번 배열. 열·별 유물이 아니면 null(= 모두)
  function relicTargets(data, sid, team) { var d = skillById(data, sid), L = data.battle.arena.lines; if (!d || (d.trigger !== 'line' && d.trigger !== 'death')) return null;
    var ln = function (x) { return L ? (L[x.slot] || 0) : (x.slot < 2 ? 0 : 1); }, cnt = {}; team.forEach(function (x) { cnt[ln(x)] = (cnt[ln(x)] || 0) + 1; }); var out = [];
    team.forEach(function (x, i) { var l = ln(x); if (d.line != null && l !== d.line) return; if (d.alone && cnt[l] !== 1) return; if (d.full && cnt[l] < d.full) return; if (d.kind === 'starStep' && (x.star || 1) > 2) return; out.push(i); }); return out; }
  function heroSellPrice(data, id, star) { var G = (data.recruit.sell || {}).grade || [5, 10, 20, 40]; return G[Math.min(heroGrade(data, id), G.length) - 1] * Math.pow(2, (star || 1) - 1); }
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
  function lootPool(data, st, rnd, plv) {
    var L = data.recruit.loot || {}, out = st.team.filter(function (u) { return !u.mob; }).map(function (u) { return 'h:' + u.id; });
    if (L.skills !== false) (st.skills || []).forEach(function (s) { out.push('s:' + s.id); });
    var rew = (plv && perk(data, plv).clearGold) || data.campaign.reward.base * Math.pow(data.campaign.reward.growth, st.n);
    var bellMul = 1 + (data.bell && st.bell ? data.bell.lootGold * st.bell : 0); // 종을 울린 만큼 주머니가 두둑해져요 (칸 수는 그대로)
    for (var i = 0; i < (L.goldSlots || 0); i++) out.push('g:' + Math.max(1, Math.round(rew * bellMul * ((L.goldMin || 0.3) + rnd() * ((L.goldMax || 0.7) - (L.goldMin || 0.3))))));
    var MN = data.mana; if (MN && MN.enabled && rnd() < MN.loot.chance) out.push('m:' + MN.loot.amount); // 마나스톤: 가끔만 끼어요
    return out;
  }
  // 룰렛 결과 칸 번호: player.lootWeight[레벨] 가중치로 뽑아요 (영웅·유물 = 등급 열, 골드·마나 = 골드 열). 표가 없으면 1/n
  function lootPick(data, keys, plv, rnd) { var W = perk(data, plv).lootWeight; if (!W) return Math.floor(rnd() * keys.length);
    var w = keys.map(function (k) { var p = lootParse(k); return p.type === 'h' ? W[heroGrade(data, p.id) - 1] : p.type === 's' ? W[skillGrade(data, p.id) - 1] : W[4]; }), t = w.reduce(function (a, b) { return a + b; }, 0), x = rnd() * t;
    for (var i = 0; i < w.length; i++) { x -= w[i]; if (x < 0) return i; } return w.length - 1; }
  // 전리품 다시 돌리기 비용 (k = 이번 판에서 이미 돌린 횟수, n = 이긴 스테이지 번호)
  // 룰렛 1번당 리셋 기회 (recruit.reroll.max[플레이어 레벨-1], 표가 짧으면 마지막 값). 표가 없으면 무제한
  function rerollMax(data, plv) { var M = data.recruit.reroll.max; return M ? M[Math.min((plv || 1) - 1, M.length - 1)] : Infinity; }
  // n: 가격 단계 = 깬 스테이지 번호 - 1 (게임 화면과 같은 값. 1-1·1-2는 기본값)
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
  function bellGold(data, n, from, to, plv) { var B = data.bell, I = B && B.instant, base = stageReward(data, n, 0, null, plv), s = 0; if (!I) return 0; from = from || 0; to = to == null ? from + 1 : to; // from번 다음부터 to번까지 울린 골드 합. 2026-11-25: k번째 = 클리어 골드 × instant[k-1]
    for (var k = from; k < to; k++) s += Math.round(base * (typeof I === 'number' ? I : I[Math.min(k, I.length - 1)])); return s; }
  function stageReward(data, n, bell, ev, plv) { var C = data.campaign, CG = plv && perk(data, plv).clearGold; bell = Math.max(0, Math.min(bell || 0, bellMax(data, n, ev))); return Math.round((CG || C.reward.base * Math.pow(C.reward.growth, n)) * (1 + (data.bell ? data.bell.gold * (bell || 0) : 0))); }
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
    var out = [{ from: u.id, lv: 1, main: true }]; // 2026-11-22: 스킬 레벨 없음. 재료 1명 = 그 영웅 스킬 1개 추가(같은 영웅이면 같은 스킬 2개)
    Object.keys(tr).forEach(function (k) { for (var i = 0; i < tr[k]; i++) out.push({ from: k, lv: 1, main: false }); }); return out.slice(0, TR.maxSkills || 3); }
  // a에 재료 m을 넣을 수 있는지: 'up'(같은 스킬 하나 더) | 'add'(새 스킬) | null
  function canTranscend(data, a, m) { var TR = data.transcend; if (!TR || !TR.enabled || !a || !m || a.uid === m.uid) return null;
    if (TR.trMaterial === false && m.tr && Object.keys(m.tr).length) return null; // 2026-11-26: 이미 초월한 영웅은 재료로도 못 써요(사용자: "이미 초월한건 재료로도 못쓰게 하자. 일단은.")
    var sk = unitSkills(data, a), same = sk.filter(function (s) { return s.from === m.id; })[0];
    return sk.length < (TR.maxSkills || 3) ? (same ? 'up' : 'add') : null; } // 'up' = 같은 스킬 하나 더
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

  // 봇 진행: 도전 → 이기면 적 중 1명 영입 → 지면 출전 영웅을 고르게 레벨업 → 돈이 없으면 방치 보상을 기다림
  // ───── 영구 강화(2026-11-27 뼈대): state = { medals, nodes: { 칸id: 찍은 단계 } }. 표는 data.meta ─────
  // metaData: 강화를 반영한 data를 새로 만들어 돌려줘요(원본은 그대로). 봇은 campaign(opts.meta), 화면은 D 대신 이걸 쓰면 돼요
  // state.mode === 'meta'(도구 "영구 강화로"): 영구 강화로 옮긴 레벨 표 줄(칸의 key + flatAlso)은 레벨로 안 오르고 Lv1 값에 고정. 등장 확률·출전 인원은 그대로 레벨로 (2026-11-27 사용자: "레벨에 대한 효과는.. 없이")
  function metaData(data, state) { var M = data.meta, S = (state && state.nodes) || (state && state.mode === 'meta' ? {} : null); if (!M || !S) return data;
    var cp = function (o) { if (!o) return o; var r = {}; for (var q in o) r[q] = o[q]; return r; }, d = cp(data), HB = {};
    d.player = cp(data.player); d.shop = cp(data.shop); d.campaign = cp(data.campaign); d.life = cp(data.life); d.recruit = cp(data.recruit); if (d.recruit) d.recruit.reroll = cp(data.recruit.reroll);
    if (state.mode === 'meta') { var flat = (M.flatAlso || []).slice(); M.lines.forEach(function (L) { L.nodes.forEach(function (N) { if (N.key) flat.push(N.key); }); }); flat.forEach(function (k) { var r = d.player[k]; if (r) d.player[k] = r.map(function () { return r[0]; }); }); }
    M.lines.forEach(function (L) { L.nodes.forEach(function (N) { var n = Math.min(S[N.id] || 0, N.cost.length); if (!n) return;
      if (N.key && d.player[N.key]) d.player[N.key] = d.player[N.key].map(function (v) { var w = v + N.add * n; return N.cap != null ? Math.max(v, Math.min(w, N.cap)) : w; });
      else if (N.shift && d.player[N.shift]) { var row = d.player[N.shift]; d.player[N.shift] = row.map(function (v, i) { return row[Math.min(i + n, row.length - 1)]; }); } // 등급 확률 = 레벨 표를 n칸 앞당김
      else if (N.path) { var ks = N.path.split('.'), o = d; for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]] = cp(o[ks[i]]); /* 지나는 객체는 복사(원본 data를 안 바꾸게) */ var last = ks[ks.length - 1], v0 = o[last]; o[last] = Array.isArray(v0) ? v0.map(function (x) { return x + N.add * n; }) : (v0 || 0) + N.add * n; }
      else if (N.hero) { var J = HB[L.job] || (HB[L.job] = {}); J[N.hero] = (J[N.hero] || 0) + N.add * n; } }); });
    d.heroBoost = HB; return d; }
  function metaNode(data, id) { var r = null; ((data.meta || {}).lines || []).forEach(function (L) { L.nodes.forEach(function (N) { if (N.id === id) r = N; }); }); return r; }
  // 자유형 망(2026-11-27): req가 없거나(가운데) req 중 하나라도 1단계 이상 찍었으면 찍을 수 있어요
  // metaStatus → 'max'(다 찍음) | 'open'(찍을 수 있음, 일부 찍은 것 포함) | 'locked'(앞 칸을 아직 안 찍음, 화면에선 ?로 둘 수 있음)
  function metaStatus(data, state, id) { var N = metaNode(data, id), S = (state && state.nodes) || {}; if (!N) return null; var n = S[id] || 0; if (n >= N.cost.length) return 'max';
    return !N.req || !N.req.length || N.req.some(function (q) { return (S[q] || 0) > 0; }) ? 'open' : 'locked'; }
  function metaNext(data, state, id) { var N = metaNode(data, id), n = ((state && state.nodes) || {})[id] || 0; return N && metaStatus(data, state, id) === 'open' ? { node: N, step: n + 1, cost: N.cost[n] } : null; }
  function metaBuy(data, state, id) { var nx = metaNext(data, state, id); if (!nx || (state.medals || 0) < nx.cost) return false; state.medals -= nx.cost; (state.nodes || (state.nodes = {}))[id] = nx.step; return true; } // state를 바꿔요
  function metaMedals(data, cleared, firstClear) { var M = (data.meta || {}).medal || {}, m = 0; for (var i = 0; i < (cleared || 0); i++) m += (M.clear || 0) + (isBoss(data, i) ? M.boss || 0 : 0); return Math.round((m + (firstClear ? M.firstClear || 0 : 0)) * (((data.campaign || {}).diff || {}).medalMul || 1)); } // 판 끝 훈장(제약 배율은 제약이 생기면 곱함)
  function campaign(data, opts) {
    opts = opts || {}; if (opts.meta) data = metaData(data, opts.meta); // 2026-11-27 영구 강화
    var C = data.campaign, R = data.recruit, levels = {}, owned = {}, gold = C.startGold || 0, time = 0, stage = 0, best = 0, tries = 0, total = stageCount(data), maxT = (opts.maxHours || 48) * 3600;
    var units = [];
    function startHero() { var id = R.startHero; if (campfireAtStart(data)) { var ids = rollCampfire(data, rnd, 1); id = ids.splice(lootPick(data, ids, 1, rnd), 1)[0]; events.campfire.seen++; for (var sp = 1; sp < (data.events.campfire.startPicks || 1) && ids.length; sp++) { var x2 = ids.splice(lootPick(data, ids, 1, rnd), 1)[0]; newUnit(units, x2, 1); levels[x2] = data.startLevel; } } newUnit(units, id, 1); levels[id] = data.startLevel;
      startExtras(data, rnd, [id]).forEach(function (x) { newUnit(units, x, 1); levels[x] = data.startLevel; }); }
    var log = [], attempts = 0, battleTime = 0, idleTime = 0, seed = (opts.seed || 1) * 7919, rnd = makeRng(seed + 5);
    var recruits = { new: 0, merge: 0, star: 0, max: 0, dropped: 0 }, skills = [], pads = {}, xp = 0, plv = 1, shop = rollShop(data, rnd, 1), rerolls = 0, sold = 0, spent = 0, stuck = false, mana = 0, manaGot = 0, manaSpent = 0;
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
      for (var h = 0; h < shopH.length; h++) if (gold >= shopH[h].price) { gold -= shopH[h].price; spent += shopH[h].price; gainHero(shopH[h].id, team); recruits.shopHero = (recruits.shopHero || 0) + 1; shopH.splice(h, 1); h--; n++; } // shortcut: 봇은 유물 다음 남은 골드로 영웅을 그냥 사요, 밸런스를 볼 때 고르는 기준을 넣어요
      return n; }
    var shopH = rollShopHeroes(data, rnd, 1, 0);
    var LF = data.life && data.life.enabled ? data.life : null, life = LF ? LF.max : 0, stood = false, streak = 0, runs = [], runStart = 0, lossGoldSum = 0;
    // 체력이 0이 되면 판 전체를 처음(1-1)으로: 영웅·스킬·골드·마나스톤·경험치를 모두 잃어요
    function resetRun() { runs.push({ best: best, time: time - runStart }); runStart = time;
      units.length = 0; levels = {}; startHero();
      skills.length = 0; pads = {}; gold = C.startGold || 0; mana = 0; xp = 0; plv = 1; stage = 0; best = 0; tries = 0; streak = 0; bellPaidN = 0; life = LF.max; stood = false; lastHp = 0; shop = rollShop(data, rnd, 1, skills); shopH = rollShopHeroes(data, rnd, 1, 0); }
    var lastHp = 0, bells = { rung: 0, lost: 0 }, fails = [], bellPaidN = 0; // bellPaidN: 이 판에서 골드를 이미 받은 종 횟수 // fails[n] = 스테이지 n에서 진 횟수
    var potions = []; // 2026-11-26 봇: 들고 있는 물약 id(최대 player.potion, 레벨별). 다음 일반 전투에 모두 마셔요
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
      for (;;) { var bag = units.filter(function (x) { return inTeam.indexOf(x.uid) < 0; }); if (bag.length <= (data.player ? perk(data, plv).bag : R.bag)) break;
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
    function roster() { return units.map(function (u) { var bs = unitBattleSpec(data, u); return { uid: u.uid, id: u.id, level: C.heroLv === 'player' ? heroLevel(data, plv) : levels[u.id] || data.startLevel, star: u.star, ultLv: bs.ultLv, extra: bs.extra }; }); }
    while (stage < total && time < maxT) {
      // 종 전략: opts.bell = 'never' | 'always' | 'smart'(앞 판을 여유 있게 이겼으면 울려요) 또는 숫자
      var bp = opts.bell || 'never', bellN = typeof bp === 'number' ? bp : bp === 'always' ? (data.bell ? data.bell.max : 0) : bp === 'smart' ? (lastHp > 0.75 ? 2 : lastHp > 0.5 ? 1 : 0) : 0;
      var ev = rollEvent(data, stage, rnd, plv, { battleOnly: !arrived, team: units.map(function (x) { return x.id; }) }); if (ev && ev.kind === 'fork') ev = ev.options[Math.floor(rnd() * ev.options.length)]; arrived = false; // 봇: 갈림길은 아무거나
      var team = autoFormation(data, roster(), costCap(data, best), data.player ? perk(data, plv).field : 0), st = stageTeam(data, stage, ev, bellN, plv);
      if (ev && ev.kind === 'merchant' && merchantNoBattle(data)) bellN = 0;
      bellN = Math.min(bellN, bellMax(data, stage, ev)); bells.rung += bellN; var bellPaid = ev && ev.kind === 'chest' ? 0 : (bellN > bellPaidN ? bellGold(data, stage, bellPaidN, bellN, plv) : 0); gold += bellPaid; bellPaidN = Math.max(bellPaidN, bellN); // 같은 판에서 이미 받은 종 골드는 다시 안 줘요(2026-11-24)
      if (ev) { events[ev.kind] = events[ev.kind] || { seen: 0 }; events[ev.kind].seen++; }
      if (ev && ev.kind === 'swampShop') { var HOLD = data.player ? perk(data, plv).potion : 2; (ev.ids || []).forEach(function (pid) { var P = potionById(data, pid); if (P && potions.length < HOLD && gold >= P.price * 2) { gold -= P.price; spent += P.price; potions.push(pid); events.swampShop.bought = (events.swampShop.bought || 0) + 1; } }); continue; } // 봇: 늪지 상인은 골드가 값의 2배 이상이면 칸이 찰 때까지 사요
      if (ev && ev.kind === 'merchant' && merchantNoBattle(data)) { // 방랑상인 판: 싸우지 않고 특별 상점만 열고 넘어가요
        rollMerchant(data, stage, rnd, plv, skills).forEach(function (it) {
          var have = it.cur === 'mana' ? mana : gold; if (have < it.price) return;
          var ok = it.type === 's' ? canTake(data, skills, it.id, data.player ? perk(data, plv).skillSlots : 0) && (takeSkill(data, skills, it.id), true) : gainHero(it.id, team);
          if (!ok) return; if (it.cur === 'mana') { mana -= it.price; manaSpent += it.price; } else { gold -= it.price; spent += it.price; } events.merchant.bought++; });
        continue; } // 이벤트 스테이지: 스테이지는 그대로, 바로 그 스테이지 전투로 가요
      if (ev && ev.kind === 'chest') { // 보물상자 판: 지지 않아요. 입힌 피해 구간만큼 보상받고 넘어가요
        var cres = battle(data, padTeam(team, pads), st.team, { seed: seed + attempts * 31, modules: opts.modules, skills: skills, enemySkills: [] }); attempts++; time += cres.time; battleTime += cres.time;
        var cr = chestReward(data, stage, bellN, 1 - cres.enemyLeft, plv); gold += cr.gold; mana += cr.mana; manaGot += cr.mana;
        for (var cs = 0; cs < cr.scroll; cs++) { var sid = rollScroll(data, rnd, plv, skills, units.map(function (x) { return x.id; })); if (sid && canTake(data, skills, sid, data.player ? perk(data, plv).skillSlots : 0)) takeSkill(data, skills, sid); }
        events.chest.tiers = (events.chest.tiers || 0) + cr.tier; events.chest.gold = (events.chest.gold || 0) + cr.gold;
        shop = rollShop(data, rnd, plv, skills, units.map(function (x) { return x.id; })); rerolls = 0; continue; }
      if (ev && ev.kind === 'mimic') { /* 미믹 판(2026-11-26): 지지 않아요. 잡은 미믹마다 보상(골드, 왕관은 유물+골드) */
        var mmres = battle(data, padTeam(team, pads), st.team, { seed: seed + attempts * 31, modules: opts.modules, skills: skills, enemySkills: [] }); attempts++; time += mmres.time; battleTime += mmres.time;
        events.mimic = events.mimic || {}; events.mimic.seen = (events.mimic.seen || 0) + 1; events.mimic.gold = events.mimic.gold || 0; events.mimic.killed = events.mimic.killed || 0;
        mobLoot(st, mmres.units).forEach(function (key) { var mk = lootParse(key); if (mk.type === 'g') { gold += mk.amt; events.mimic.gold += mk.amt; } else if (mk.type === 's' && canTake(data, skills, mk.id, data.player ? perk(data, plv).skillSlots : 0)) takeSkill(data, skills, mk.id); });
        events.mimic.killed += mmres.units.filter(function (x) { return x.side === 'E' && !x.alive && !x.escaped; }).length;
        shop = rollShop(data, rnd, plv, skills, units.map(function (x) { return x.id; })); rerolls = 0; continue; }
      if (ev && ev.kind === 'mobs') { // 몹 무리 판: 지지 않아요. 몹을 쓰러뜨리면 그 몹의 drops 칸 중 1개를 받고 넘어가요
        var mres = battle(data, padTeam(team, pads), st.team, { seed: seed + attempts * 31, modules: opts.modules, skills: skills, enemySkills: [] }); attempts++; time += mres.time; battleTime += mres.time;
        var mpool = mobLoot(st, mres.units); events.mobs.killed = (events.mobs.killed || 0) + mpool.length;
        mpool.forEach(function (key) { var mk = lootParse(key); events.mobs[mk.type] = (events.mobs[mk.type] || 0) + 1;
          if (mk.type === 'p') { var fs2 = data.battle.arena.lines ? data.battle.arena.pos.length : data.player ? perk(data, plv).field : data.recruit.fieldSlots; var emp = []; for (var ps = 0; ps < fs2; ps++) if (!pads[ps]) emp.push(ps); if (emp.length) pads[emp[Math.floor(rnd() * emp.length)]] = mk.id; } // 빈 칸 중 무작위 한 곳 (꽉 차면 버려요)
          else if (mk.type === 'g') gold += mk.amt; else if (mk.type === 'm') { mana += mk.amt; manaGot += mk.amt; } else if (canTake(data, skills, mk.id, data.player ? perk(data, plv).skillSlots : 0)) takeSkill(data, skills, mk.id); }); // 쓰러뜨린 몹의 전리품 전부
        shop = rollShop(data, rnd, plv, skills, units.map(function (x) { return x.id; })); rerolls = 0; continue; }
      if (ev && data.transcend && ev.kind === data.transcend.at) { // 초월 제단: 백팩 영웅을 전장 영웅에 초월 재료로 넣고 넘어가요 (같은 스킬 승급 먼저)
        units.filter(function (x) { return team.every(function (t) { return t.uid !== x.uid; }); }).forEach(function (wk) {
          var host = units.filter(function (x) { return team.some(function (t) { return t.uid === x.uid; }) && canTranscend(data, x, wk); }).sort(function (a, b) { return (canTranscend(data, b, wk) === 'up') - (canTranscend(data, a, wk) === 'up'); })[0];
          if (host) { transcend(data, units, host.uid, wk.uid); recruits.transcend = (recruits.transcend || 0) + 1; } });
        continue; }
      if (ev && ev.kind === 'dais') { /* 봇: 다시 돌리지 않고, 양탄자 없는 무작위 칸(rollDaisCell)에 놓아요. 다 차 있으면 그 칸을 덮어요 */ events.dais.got = (events.dais.got || 0) + 1; pads[rollDaisCell(data, rnd, pads)] = ev.tag; continue; }
      if (ev && ev.kind === 'groll') { events.groll = events.groll || { passed: 0 }; events.groll.passed++; continue; } // 봇: 돈고블린 룰렛은 안 돌리고 지나가요
      if (ev && ev.kind === 'oddeven') { events.oddeven.passed = (events.oddeven.passed || 0) + 1; continue; } // 봇: 내기는 안 하고 지나가요(기대값 0)
      if (ev && ev.kind === 'fairy') { if (ev.ids.length) { var fid = ev.ids[lootPick(data, ev.ids, plv, rnd)]; if (canTake(data, skills, fid, data.player ? perk(data, plv).skillSlots : 0)) takeSkill(data, skills, fid); } continue; } // 요정: 룰렛으로 유물 1개
      if (ev && ev.kind === 'campfire') { var ci = lootPick(data, ev.ids, plv, rnd); gainHero(ev.ids[ci], team); giveBonus(ev.bonus && ev.bonus[ci]); continue; } // 모닥불: 싸우지 않고 1명 얻고, 같은 스테이지 전투로 가요
      var plvAt = plv; // 클리어 골드·전리품은 화면처럼 전투 시작 때 레벨로 (2026-11-24)
      var res = battle(data, padTeam(team, pads), st.team, { seed: seed + attempts * 31, modules: opts.modules, skills: skills, enemySkills: st.skills, curse: st.curse, potions: potions.map(function (id) { return { id: id }; }) }); if (potions.length) { events.potionDrunk = (events.potionDrunk || 0) + potions.length; potions = []; } // 물약은 마신 전투가 끝나면 사라져요
      attempts++; tries++; time += res.time; battleTime += res.time;
      if (data.player) { var gx = data.player.xpPerKill * res.units.filter(function (x) { return x.side === 'E' && !x.alive && !x.escaped; }).length; if (!res.win) gx = Math.max(gx, data.player.xpLoseMin || 0); xp += gx; var plv0 = plv; plv = playerLevel(data, xp).level; if (LF && LF.perLevel) life += (plv - plv0) * LF.perLevel;
        for (var lp = plv0; lp < plv && data.player.levelPick; lp++) { var LK = levelPickKind(data, lp + 1, units, skills); // 레벨마다 하나만, 번갈아
          if (LK === 'relic') { var rid = levelPickRoll(data, rnd, 'relic', units, skills); if (rid) { takeSkill(data, skills, rid); recruits.lvRelic = (recruits.lvRelic || 0) + 1; } } else if (LK === 'skill') { var sid2 = levelPickRoll(data, rnd, 'skill', units, skills); if (sid2 != null && skillUp(data, units, sid2)) recruits.lvSkill = (recruits.lvSkill || 0) + 1; } } }
      if (res.win) { shop = rollShop(data, rnd, plv, skills, units.map(function (x) { return x.id; })); shopH = rollShopHeroes(data, rnd, plv, stage + 1); rerolls = 0; // 판을 깨야 상점이 새로 채워져요
        var reward = stageReward(data, stage, bellN, ev, plvAt); lastHp = res.hpLeft;
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
        var pool = lootPool(data, st, rnd, plvAt), cur = lootPick(data, pool, plvAt, rnd), rr = 0;
        while (lootParse(pool[cur]).type === 'g' && pool.some(function (k2) { return lootParse(k2).type !== 'g'; }) && rr < rerollMax(data, plv) && gold >= lootRerollPrice(data, rr, stage - 1)) {
          var rp2 = lootRerollPrice(data, rr, stage - 1); gold -= rp2; spent += rp2; rr++; recruits.reroll = (recruits.reroll || 0) + 1;
          pool.splice(cur, 1); cur = lootPick(data, pool, plvAt, rnd); }
        var pk = lootParse(pool[cur]), got = null, kind;
        if (pk.type === 'g') { gold += pk.amt; recruits.gold = (recruits.gold || 0) + 1; }
        else if (pk.type === 'm') { mana += pk.amt; manaGot += pk.amt; }
        else if (pk.type === 's') { if (canTake(data, skills, pk.id, data.player ? perk(data, plv).skillSlots : 0)) takeSkill(data, skills, pk.id); recruits.skill = (recruits.skill || 0) + 1; }
        else got = pk.id;
        if (got) { kind = gainHero(got, team) ? 'new' : 'dropped'; var gb = st.team.filter(function (x) { return x.id === got && x.bonus; })[0]; giveBonus(gb && gb.bonus); }
        log.push({ stage: stage, name: st.name, wall: st.wall, boss: st.boss, tries: tries, time: time, teamLv: team.map(function (x) { return x.level; }), plv: plv, field: team.length, battle: res.time, hpLeft: res.hpLeft, got: got, kind: kind, owned: units.length, maxStar: units.reduce(function (m, u) { return Math.max(m, u.star); }, 1), maxGrade: units.reduce(function (m, u) { return Math.max(m, heroGrade(data, u.id)); }, 1) });
        if (LF) { streak = 0; if (st.boss && LF.recoverOnBoss) life = Math.max(life, LF.max); } // 장 보스를 깨면 체력이 다 차요
        stage++; tries = 0; bellPaidN = 0; best = Math.max(best, stage); arrived = true;
        shopping();
        continue;
      }
      lastHp = 0; fails[stage] = (fails[stage] || 0) + 1; if (bellN) bells.lost++; // 2026-11-23: 종 골드는 져도 그대로 (난이도를 올린 값)
      if (LF) { // 체력: 살아남은 적만큼 깎이고, 위로금을 받고, 같은 판에 다시 도전해요. 0이 되면 판 전체가 끝나요
        streak++; var kills = res.units.filter(function (x) { return x.side === 'E' && !x.alive && !x.escaped && !x.mob; }).length;
        var lg = lossGold(data, stage, kills, streak, dmgFrac(res.units)); gold += lg; lossGoldSum += lg;
        life -= lossDamage(data, res.units); if (life <= 0 && LF.lastStand && !stood) { life = 1; stood = true; } if (life <= 0) { resetRun(); continue; }
        if (LF.loseCampfire) { var lcf = rollCampfire(data, rnd, plv); if (lcf.length) { gainHero(lcf[lootPick(data, lcf, plv, rnd)], team); recruits.loseCampfire = (recruits.loseCampfire || 0) + 1; } } // 진 뒤 모닥불: 영웅 1명
        } // 진 판 전리품 룰렛(lossLoot)은 2026-11-25에 지움
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
        else { var rp = refreshPrice(data, rerolls); if (gold >= rp && rerolls < (data.shop.refreshMax || Infinity)) { gold -= rp; spent += rp; rerolls++; shop = rollShop(data, rnd, plv, skills, units.map(function (x) { return x.id; })); continue; } need = rp - gold; }
        var wait = Math.max(60, Math.ceil(need / perMin) * 60);
        gold += perMin * wait / 60; time += wait; idleTime += wait;
      }
    }
    return { cleared: stage, total: total, time: time, battleTime: battleTime, idleTime: idleTime, attempts: attempts, log: log, levels: levels, owned: units, units: units, recruits: recruits, skills: skills, spent: spent, sold: sold, stuck: stuck, xp: xp, plv: plv, events: events, bells: bells, fails: fails, gold: gold, runs: runs, life: life, lossGold: lossGoldSum, mana: { got: manaGot, spent: manaSpent, left: mana } };
  }

  // ───── 플레이어 체력 (life) ─────
  // 진 판에서 살아남은 적 1명마다 깎이는 체력: base + perGrade × (등급 − 1). 보스는 + bossExtra. 돈고블린·도망친 적은 안 깎아요
  // units: battle 결과의 units (side E만 봐요)
  function lossDamage(data, units) { var L = data.life; if (!L || !L.enabled) return 0; var d = 0;
    units.forEach(function (x) { if (x.side !== 'E' || !x.alive || x.escaped || x.mob) return; d += L.base + L.perGrade * (heroGrade(data, x.id) - 1) + (x.boss ? (L.bossExtra || 0) : 0); });
    return d; }
  // 진 판 위로금: 클리어 골드 × perKill × 쓰러뜨린 적 수 × (1 + streakBonus × (연패 − 1), 최대 streakMax연패)
  // 위로금. frac = 적에게 준 피해 비율(0~1, dmgFrac). perDamage가 없으면 예전 방식(처치 수 × perKill)
  function lossGold(data, n, kills, streak, frac) { var L = data.life; if (!L || !L.enabled || !L.consolation) return 0; var CO = L.consolation, C = data.campaign;
    var k = 1 + (CO.streakBonus || 0) * (Math.min(streak || 1, CO.streakMax || 3) - 1), amt = CO.perDamage != null ? CO.perDamage * Math.max(CO.min || 0, frac || 0) : (CO.perKill || 0) * kills;
    return Math.max(CO.minGold || 0, Math.round(C.reward.base * Math.pow(C.reward.growth, n) * amt * k)); }
  // 적 팀에 준 피해 비율: (최대 체력 − 남은 체력) 합 ÷ 최대 체력 합 (전투 결과 units)
  function dmgFrac(units) { var mx = 0, lost = 0; (units || []).forEach(function (u) { if (u.side !== 'E') return; mx += u.maxHp; lost += u.maxHp - Math.max(0, u.alive ? u.hp : 0); }); return mx ? lost / mx : 0; }



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

  var api = { battle: battle, createBattle: createBattle, chapterData: chapterData, potionById: potionById, difficultyData: difficultyData, chapterInfo: chapterInfo, metaData: metaData, metaNext: metaNext, metaBuy: metaBuy, metaStatus: metaStatus, metaNode: metaNode, metaMedals: metaMedals, potionSellPrice: potionSellPrice, rollPotions: rollPotions, stageTeam: stageTeam, heroLevel: heroLevel, levelPickRoll: levelPickRoll, levelPickKind: levelPickKind, skillUp: skillUp, startExtras: startExtras, bellFx: bellFx, stageLevel: stageLevel, stageName: stageName, stageCount: stageCount, autoFormation: autoFormation,
    campaign: campaign, compare: compare, lossDamage: lossDamage, lossGold: lossGold, dmgFrac: dmgFrac, levelCost: levelCost, heroById: heroById, makeRng: makeRng,
    costCap: costCap, starMul: starMul, gradeMul: gradeMul, heroGrade: heroGrade, pickHeroByGrade: pickHeroByGrade, effectLevels: effectLevels, relicPowerMul: relicPowerMul, passiveValue: passiveValue, power: power, newUnit: newUnit, canMerge: canMerge, mergeUnits: mergeUnits, autoMerge: autoMerge, gainUnit: gainUnit,
    skillById: skillById, heroSellPrice: heroSellPrice, relicTargets: relicTargets, heroBonus: heroBonus, isBoss: isBoss, critChance: critChance, lootPool: lootPool, lootPick: lootPick, chestGrade: chestGrade, chestTiers: chestTiers, mobLoot: mobLoot, grollCost: grollCost, grollSpins: grollSpins, rollGroll: rollGroll, oddEvenBet: oddEvenBet, oddEvenResult: oddEvenResult, padTeam: padTeam, lootParse: lootParse, lootRerollPrice: lootRerollPrice, rerollMax: rerollMax, rollEvent: rollEvent, rollDais: rollDais, rollDaisCell: rollDaisCell, daisRerolls: daisRerolls, eventRerolls: eventRerolls, rollCampfire: rollCampfire, campfireAtStart: campfireAtStart, stageReward: stageReward, bellMax: bellMax, bellGold: bellGold, rollMerchant: rollMerchant, isEventStage: isEventStage, unitSkills: unitSkills, canTranscend: canTranscend, transcend: transcend, unitBattleSpec: unitBattleSpec, unitPower: unitPower, skillPool: skillPool, merchantPrice: merchantPrice, merchantOff: merchantOff, merchantNoBattle: merchantNoBattle, chestReward: chestReward, rollScroll: rollScroll, mercPrice: mercPrice, skillPrice: skillPrice, skillManaPrice: skillManaPrice, skillBuyPrice: skillBuyPrice, skillGradeNow: skillGradeNow, skillMaxLevel: skillMaxLevel, refreshPrice: refreshPrice, rollShop: rollShop, rollShopHeroes: rollShopHeroes, canTake: canTake, takeSkill: takeSkill, playerLevel: playerLevel, perk: perk, skillSellPrice: skillSellPrice, sellSkill: sellSkill };
  if (typeof module !== 'undefined') module.exports = api; else root.IdleEngine = api;
})(this);
