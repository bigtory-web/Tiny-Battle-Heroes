// 방치형 RPG 전투 테스트베드 테이블. 숫자는 모두 임시값이에요. 여기만 고치면 전투·캠페인이 바뀌어요.
// 근거 문서: ../방치형RPG_전투테스트베드_기획.md
var IDLE_DATA = {
  // ───── 전투 기본 규칙 ─────
  battle: {
    dt: 0.1,            // 0.1초 단위로 진행
    timeLimit: 90,      // 넘기면 패배
    defK: 300,          // 피해 감소 = 방어 / (방어 + defK)
    energyMax: 100,
    startJitter: 0.4    // 첫 평타까지 0~이 값(초) 사이로 흩어져요 (모두 동시에 치지 않게)
  },

  // 레벨 성장: 능력치 × (1 + perLevel × (레벨 − 1))
  growth: { perLevel: 0.12 },

  // 진영 상성: 불 > 숲 > 물 > 불, 빛 ↔ 어둠은 서로 강해요
  elements: {
    names: { fire: '불', water: '물', forest: '숲', light: '빛', dark: '어둠' },
    beats: { fire: 'forest', forest: 'water', water: 'fire', light: 'dark', dark: 'light' }
  },

  // ───── 바꿔 끼우는 전투 요소 (기본값 = 첫 번째) ─────
  modules: {
    energy:   { pick: 'both',  options: {
      both:       { name: '평타 + 피격', onAttack: 20, onHitScale: 50 },
      attackOnly: { name: '평타만',     onAttack: 25, onHitScale: 0 },
      time:       { name: '시간',       onAttack: 0,  onHitScale: 0, perSec: 12 },
      kill:       { name: '평타 + 처치', onAttack: 20, onHitScale: 0, onKill: 40 } } },
    targeting: { pick: 'front', options: {
      front:   { name: '앞줄 먼저' },
      lowest:  { name: '체력 비율 낮은 적' },
      random:  { name: '무작위' },
      lane:    { name: '마주 보는 자리 먼저' } } },
    element:  { pick: 'normal', options: {
      none:   { name: '상성 없음', adv: 1,   dis: 1 },
      normal: { name: '상성 보통', adv: 1.3, dis: 0.75 },
      strong: { name: '상성 강함', adv: 1.5, dis: 0.6 } } },
    synergy:  { pick: 'off', options: {
      off: { name: '시너지 없음' },
      on:  { name: '같은 진영 3명 공격 +10% / 5명 +25%', at3: 0.10, at5: 0.25 } } },
    healDecay: { pick: 'off', options: {
      off: { name: '회복 그대로' },
      on:  { name: '시간이 지날수록 회복 감소', minMul: 0.3 } } },
    startEnergy: { pick: 'zero', options: {
      zero: { name: '첫 에너지 0', value: 0 },
      half: { name: '첫 에너지 50', value: 50 } } }
  },

  // ───── 영웅 (이름·콘셉트는 임시, 모두 오리지널) ─────
  // hp/atk/def: 1레벨 능력치, interval: 평타 간격(초), range: melee | ranged
  // ult: 궁극기 종류와 수치, passive: 없으면 null
  heroes: [
    { id: 'bear',   name: '바위곰',   role: 'tank',    el: 'forest', range: 'melee',  hp: 2200, atk: 70,  def: 160, interval: 1.6,
      ult: { kind: 'taunt', dur: 4, shieldPct: 0.25 }, passive: null },
    { id: 'knight', name: '철갑기사', role: 'tank',    el: 'light',  range: 'melee',  hp: 2000, atk: 75,  def: 180, interval: 1.6,
      ult: { kind: 'teamShield', mul: 1.6 }, passive: null },
    { id: 'blades', name: '쌍검',     role: 'warrior', el: 'fire',   range: 'melee',  hp: 1400, atk: 150, def: 90,  interval: 1.2,
      ult: { kind: 'strike', mul: 3.5 }, passive: null },
    { id: 'wolf',   name: '늑대발톱', role: 'warrior', el: 'forest', range: 'melee',  hp: 1300, atk: 130, def: 80,  interval: 0.9,
      ult: { kind: 'multi', hits: 3, mul: 1.3 }, passive: { kind: 'rage', below: 0.5, atk: 0.2 } },
    { id: 'shadow', name: '그림자',   role: 'warrior', el: 'dark',   range: 'melee',  hp: 1150, atk: 160, def: 70,  interval: 1.1,
      ult: { kind: 'backstab', mul: 3.2 }, passive: null },
    { id: 'hawk',   name: '매의눈',   role: 'ranged',  el: 'water',  range: 'ranged', hp: 1000, atk: 165, def: 60,  interval: 1.3,
      ult: { kind: 'snipe', mul: 3.4 }, passive: null },
    { id: 'rain',   name: '화살비',   role: 'ranged',  el: 'fire',   range: 'ranged', hp: 1000, atk: 140, def: 60,  interval: 1.3,
      ult: { kind: 'aoe', mul: 1.1 }, passive: null },
    { id: 'frost',  name: '얼음술사', role: 'mage',    el: 'water',  range: 'ranged', hp: 950,  atk: 150, def: 55,  interval: 1.5,
      ult: { kind: 'aoe', mul: 0.9, slow: 0.3, slowDur: 3 }, passive: null },
    { id: 'flame',  name: '불꽃술사', role: 'mage',    el: 'fire',   range: 'ranged', hp: 900,  atk: 170, def: 50,  interval: 1.6,
      ult: { kind: 'aoe', mul: 1.5 }, passive: null },
    { id: 'storm',  name: '번개술사', role: 'mage',    el: 'light',  range: 'ranged', hp: 950,  atk: 155, def: 55,  interval: 1.5,
      ult: { kind: 'chain', hits: 4, mul: 1.15 }, passive: null },
    { id: 'song',   name: '숲의노래', role: 'support', el: 'forest', range: 'ranged', hp: 1100, atk: 100, def: 70,  interval: 1.4,
      ult: { kind: 'healAll', mul: 2.4 }, passive: null },
    { id: 'drum',   name: '북치기',   role: 'support', el: 'dark',   range: 'ranged', hp: 1150, atk: 95,  def: 75,  interval: 1.4,
      ult: { kind: 'haste', amount: 0.3, dur: 5 }, passive: null }
  ],
  roles: { tank: '탱커', warrior: '전사', ranged: '원거리', mage: '마법', support: '지원' },

  // ───── 캠페인 ─────
  // 스테이지 n(0부터): 적 레벨 = 1 + n × levelStep, 벽 스테이지는 레벨 + wallBonus
  // 적 팀: 5명 (앞 2 / 뒤 3), 영웅 목록에서 스테이지마다 다르게 골라요. 10번째(보스)는 앞 가운데에 보스(체력 × bossHp, 공격 × bossAtk)
  campaign: {
    chapters: 3, perChapter: 10,
    levelStep: 1.0, wallBonus: 3, walls: [9, 14, 19, 26, 29],  // 1-10, 2-5, 2-10, 3-7, 3-10
    bossHp: 2.5, bossAtk: 1.15,
    enemyMul: 1.0,            // 적 전체 능력치 배율
    earlyMul: 0.55, earlyRamp: 0.04,  // 초반 적 배율: earlyMul에서 시작해 스테이지마다 earlyRamp씩 올라 1이 돼요
    reward: { base: 120, growth: 1.22 },   // 스테이지를 처음 깨면 골드 = base × growth^n
    idle: { base: 8, growth: 1.2, maxHours: 8 } // 방치 보상: 분당 골드 = base × growth^(깬 스테이지 수)
  },

  // 영웅 레벨업 가격 = base × growth^(레벨 − 1)
  levelCost: { base: 60, growth: 1.17, maxLevel: 60 },

  startLevel: 1
};

if (typeof module !== 'undefined') module.exports = IDLE_DATA;
