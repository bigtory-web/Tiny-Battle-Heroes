// 방치형 RPG 전투 테스트베드 테이블. 숫자는 모두 임시값이에요. 여기만 고치면 전투·캠페인이 바뀌어요.
// 근거 문서: ../방치형RPG_전투테스트베드_기획.md
var IDLE_DATA = {
  // ───── 전투 기본 규칙 ─────
  battle: {
    dt: 0.1,            // 0.1초 단위로 진행
    timeLimit: 90,      // 넘기면 패배
    defK: 300,          // 피해 감소 = 방어 / (방어 + defK)
    energyMax: 100,
    startJitter: 0.4,   // 첫 평타까지 0~이 값(초) 사이로 흩어져요 (모두 동시에 치지 않게)
    // 전장과 이동: 유닛이 상대에게 걸어가서 사거리 안에 들어와야 때려요 (단위: 전장 픽셀, 초)
    arena: {
      w: 480, h: 320, yMin: 162, yMax: 262, // 아래쪽 약 40%가 땅: 유닛은 이 띠 안에서만 상하좌우로 움직여요 (위쪽은 하늘)
      pos: [[140, 185], [140, 240], [80, 168], [42, 212], [80, 258]], // 왼쪽 팀 자리 0~4, 오른쪽 팀은 좌우를 뒤집어요
      reach: { melee: 46, ranged: 130 },   // 공격 사거리
      speed: { melee: 90, ranged: 70 },    // 이동 속도 (초당)
      spacing: 40                          // 유닛끼리 이 거리보다 가까우면 서로 밀어내요 (상대 편끼리는 0.8배)
    }
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
    { id: 'bear',   name: '바위곰',   role: 'tank',    el: 'forest', range: 'melee', cost: 1,  hp: 2200, atk: 70,  def: 160, interval: 1.6,
      ult: { kind: 'taunt', dur: 4, shieldPct: 0.25 }, passive: null },
    { id: 'knight', name: '철갑기사', role: 'tank',    el: 'light',  range: 'melee', cost: 2,  hp: 2000, atk: 75,  def: 180, interval: 1.6,
      ult: { kind: 'teamShield', mul: 1.6 }, passive: null },
    { id: 'blades', name: '쌍검',     role: 'warrior', el: 'fire',   range: 'melee', cost: 2,  hp: 1400, atk: 150, def: 90,  interval: 1.2,
      ult: { kind: 'strike', mul: 3.5 }, passive: null },
    { id: 'wolf',   name: '늑대발톱', role: 'warrior', el: 'forest', range: 'melee', cost: 1,  hp: 1300, atk: 130, def: 80,  interval: 0.9,
      ult: { kind: 'multi', hits: 3, mul: 1.3 }, passive: { kind: 'rage', below: 0.5, atk: 0.2 } },
    { id: 'shadow', name: '그림자',   role: 'warrior', el: 'dark',   range: 'melee', cost: 3,  hp: 1150, atk: 160, def: 70,  interval: 1.1,
      ult: { kind: 'backstab', mul: 3.2 }, passive: null },
    { id: 'hawk',   name: '매의눈',   role: 'ranged',  el: 'water',  range: 'ranged', cost: 2, hp: 1000, atk: 165, def: 60,  interval: 1.3,
      ult: { kind: 'snipe', mul: 3.4 }, passive: null },
    { id: 'rain',   name: '화살비',   role: 'ranged',  el: 'fire',   range: 'ranged', cost: 1, hp: 1000, atk: 140, def: 60,  interval: 1.3,
      ult: { kind: 'aoe', mul: 1.1 }, passive: null },
    { id: 'frost',  name: '얼음술사', role: 'mage',    el: 'water',  range: 'ranged', cost: 3, hp: 950,  atk: 150, def: 55,  interval: 1.5,
      ult: { kind: 'aoe', mul: 0.9, slow: 0.3, slowDur: 3 }, passive: null },
    { id: 'flame',  name: '불꽃술사', role: 'mage',    el: 'fire',   range: 'ranged', cost: 3, hp: 900,  atk: 170, def: 50,  interval: 1.6,
      ult: { kind: 'aoe', mul: 1.5 }, passive: null },
    { id: 'storm',  name: '번개술사', role: 'mage',    el: 'light',  range: 'ranged', cost: 3, hp: 950,  atk: 155, def: 55,  interval: 1.5,
      ult: { kind: 'chain', hits: 4, mul: 1.15 }, passive: null },
    { id: 'song',   name: '숲의노래', role: 'support', el: 'forest', range: 'ranged', cost: 2, hp: 1100, atk: 100, def: 70,  interval: 1.4,
      ult: { kind: 'healAll', mul: 2.4 }, passive: null },
    { id: 'drum',   name: '북치기',   role: 'support', el: 'dark',   range: 'ranged', cost: 1, hp: 1150, atk: 95,  def: 75,  interval: 1.4,
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
  // enabled: false → 골드로 레벨업하지 않아요 (레벨은 다른 방식으로 풀 예정). 골드는 상점 전용
  levelCost: { enabled: false, base: 60, growth: 1.17, maxLevel: 60 },

  // ───── 팀 스킬 (상점에서 사요). 팀 전체에 적용되고, 스킬마다 자기 쿨타임(cd초)이 돌면 자동 발동 ─────
  // 레벨 효과: 수치 × (1 + perLevel × (레벨 − 1)). 같은 스킬을 또 사면 레벨 +1
  skills: {
    slots: 4, maxLevel: 5, perLevel: 0.3, firstAt: 0.5, // 첫 발동은 쿨타임의 firstAt배 시점
    list: [
      { id: 'rally',   name: '응원가',   icon: '📯', cd: 9,  price: 150, kind: 'atkBuff', amount: 0.25, dur: 4,  desc: '아군 공격 +{a}% {d}초' },
      { id: 'mend',    name: '치유의 비', icon: '🌧️', cd: 10, price: 160, kind: 'healPct', amount: 0.10,          desc: '아군 체력 {a}% 회복' },
      { id: 'ward',    name: '수호막',   icon: '🛡️', cd: 12, price: 170, kind: 'shieldPct', amount: 0.12,        desc: '아군 보호막 최대 체력의 {a}%' },
      { id: 'meteor',  name: '유성',     icon: '☄️', cd: 11, price: 200, kind: 'nuke', amount: 0.8,             desc: '적 전체에 아군 평균 공격의 {a}% 피해' },
      { id: 'frost',   name: '서리 바람', icon: '🌬️', cd: 12, price: 140, kind: 'slowAll', amount: 0.3, dur: 3,  desc: '적 전체 {a}% 느려짐 {d}초' },
      { id: 'drums',   name: '전투 북',  icon: '🥁', cd: 11, price: 150, kind: 'hasteAll', amount: 0.25, dur: 4, desc: '아군 공격 속도 +{a}% {d}초' },
      { id: 'snipe',   name: '정조준',   icon: '🎯', cd: 7,  price: 130, kind: 'execute', amount: 1.6,          desc: '체력 가장 낮은 적에게 아군 최고 공격의 {a}% 피해' },
      { id: 'charge',  name: '기운 충전', icon: '⚡', cd: 13, price: 180, kind: 'energyAll', amount: 30,         desc: '아군 궁극기 에너지 +{a}' }
    ]
  },
  // 상점: 전투가 끝날 때마다 무작위 stock개가 새로 들어와요. 가격 = price × priceGrowth^(깬 스테이지 수)
  // 새로고침 비용 = refresh × refreshGrowth^(이번 판 새로고침 횟수), 전투가 끝나면 횟수 초기화
  shop: { stock: 3, priceGrowth: 1.12, refresh: 40, refreshGrowth: 1.6 },

  startLevel: 1,

  // ───── 영입·코스트·백팩·합성 ─────
  recruit: {
    startHero: 'bear',          // 처음 가진 영웅 1명
    // 출전 코스트 상한 = start + floor(깬 스테이지 수 / every), 최대 max
    costCap: { start: 3, every: 3, max: 10 },
    fieldSlots: 5,               // 전장 칸
    bag: 5,                      // 백팩 칸 (전장에 안 올린 영웅)
    mergeCount: 3,               // 같은 영웅 이 수만큼 모이면 별 +1 (가진 1명 + 중복 2명)
    maxStar: 3,
    starMul: [1, 1.8, 3.2],      // 별에 따른 체력·공격 배율
    // 스테이지 n(0부터)의 적 수: 배열 끝을 넘으면 마지막 값
    enemyCount: [1, 1, 2, 2, 3, 3, 4, 4, 5],
    // 적으로 나오는 영웅의 최고 코스트: from 스테이지부터
    enemyMaxCost: [{ from: 0, cost: 1 }, { from: 4, cost: 2 }, { from: 10, cost: 3 }]
  }
};

if (typeof module !== 'undefined') module.exports = IDLE_DATA;
