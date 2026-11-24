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
      w: 720, h: 320, yMin: 162, yMax: 262, // 아래쪽 약 40%가 땅: 유닛은 이 띠 안에서만 상하좌우로 움직여요 (위쪽은 하늘)
      pos: [[220, 196], [168, 238], [116, 196], [64, 238], [40, 180]], // 왼쪽 팀 자리 0~4: 땅 가운데 거의 한 줄. 오른쪽 팀은 좌우를 뒤집어요
      // 사거리 4단계: 근거리·중거리·장거리·최장거리 (영웅 range 값). 근거리는 상대와 붙지 않게 조금 띄워요
      reach: { melee: 52, mid: 100, long: 150, far: 210 },   // 공격 사거리
      speed: { melee: 70, mid: 62, long: 55, far: 50 },      // 이동 속도 (초당)
      // 공중: 하늘 띠(yMin~yMax)를 날아요. 나는 동안 스태미너가 닳고, 0이 되면 땅에 내려와 싸워요.
      // 땅에서 스태미너가 다 차면 다시 날아올라요. 날고 있는 동안에는 땅의 근접 영웅이 칠 수 없어요 (원거리·마법·스킬은 맞아요)
      air: { yMin: 66, yMax: 150, stamina: 7, recover: 1.4, climb: 140, rise: 650, reach: 150, speed: 80 }, // climb: 내려올 때 속도, rise: 다시 날아오를 때 원래 높이까지 '팍' 올라가는 속도
      spacing: 62, spacingFoe: 46          // 같은 편끼리 이 거리보다 가까우면 서로 밀어내요 / 상대 편끼리는 spacingFoe (근접 사거리 40보다 작아야 붙어서 때려요)
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
  // hp/atk/def: 1레벨 능력치, interval: 평타 간격(초), range: melee(근) | mid(중) | long(장) | far(최장)
  // ult: 궁극기 종류와 수치, ultName: 궁극기 이름(아이콘은 img/p/ult_<id>.png), passive: 없으면 null
  heroes: [
    { id: 'bear',   name: '바위곰', race: 'beast', job: 'guardian', ultName: '바위 포효',   role: 'tank',    el: 'forest', range: 'melee', cost: 1,  hp: 2200, atk: 70,  def: 160, interval: 1.6,
      ult: { kind: 'taunt', dur: 4, shieldPct: 0.25 }, passive: null },
    { id: 'knight', name: '철갑기사', race: 'human', job: 'paladin', ultName: '수호의 방패', role: 'tank',    el: 'light',  range: 'melee', cost: 2,  hp: 2000, atk: 75,  def: 180, interval: 1.6,
      ult: { kind: 'teamShield', mul: 1.6 }, passive: null },
    { id: 'blades', name: '쌍검', race: 'human', job: 'warrior', ultName: '화염 일섬',     role: 'warrior', el: 'fire',   range: 'melee', cost: 2,  hp: 1400, atk: 150, def: 90,  interval: 1.2,
      ult: { kind: 'strike', mul: 3.5 }, passive: null },
    { id: 'wolf',   name: '늑대발톱', race: 'beast', job: 'warrior', ultName: '연속 할퀴기', role: 'warrior', el: 'forest', range: 'melee', cost: 1,  hp: 1300, atk: 130, def: 80,  interval: 0.9,
      ult: { kind: 'multi', hits: 3, mul: 1.3 }, passive: { kind: 'rage', below: 0.5, atk: 0.2 } },
    { id: 'shadow', name: '그림자', race: 'demon', job: 'warrior', ultName: '그림자 습격',   role: 'warrior', el: 'dark',   range: 'melee', cost: 3,  hp: 1150, atk: 160, def: 70,  interval: 1.1,
      ult: { kind: 'backstab', mul: 3.2 }, passive: null },
    { id: 'hawk',   name: '매의눈', race: 'human', job: 'archer', ultName: '저격',   role: 'ranged',  el: 'water',  range: 'far', cost: 2, hp: 1000, atk: 165, def: 60,  interval: 1.3,
      ult: { kind: 'snipe', mul: 3.4 }, passive: null },
    { id: 'rain',   name: '화살비', race: 'elf', job: 'archer', ultName: '화살비',   role: 'ranged',  el: 'fire',   range: 'far', cost: 1, hp: 1000, atk: 140, def: 60,  interval: 1.3,
      ult: { kind: 'aoe', mul: 1.1 }, passive: null },
    { id: 'frost',  name: '얼음술사', race: 'elf', job: 'mage', ultName: '눈보라', role: 'mage',    el: 'water',  range: 'long', cost: 3, hp: 950,  atk: 150, def: 55,  interval: 1.5,
      ult: { kind: 'aoe', mul: 0.9, slow: 0.3, slowDur: 3 }, passive: null },
    { id: 'flame',  name: '불꽃술사', race: 'human', job: 'mage', ultName: '대폭발', role: 'mage',    el: 'fire',   range: 'long', cost: 3, hp: 900,  atk: 170, def: 50,  interval: 1.6,
      ult: { kind: 'aoe', mul: 1.5 }, passive: null },
    { id: 'storm',  name: '번개술사', race: 'human', job: 'mage', ultName: '연쇄 번개', role: 'mage',    el: 'light',  range: 'long', cost: 3, hp: 950,  atk: 155, def: 55,  interval: 1.5,
      ult: { kind: 'chain', hits: 4, mul: 1.15 }, passive: null },
    { id: 'song',   name: '숲의노래', race: 'elf', job: 'bard', ultName: '숲의 노래', role: 'support', el: 'forest', range: 'mid', cost: 2, hp: 1100, atk: 100, def: 70,  interval: 1.4,
      ult: { kind: 'healAll', mul: 2.4 }, passive: null },
    { id: 'drum',   name: '북치기', race: 'demon', job: 'bard', ultName: '전투 북소리',   role: 'support', el: 'dark',   range: 'mid', cost: 1, hp: 1150, atk: 95,  def: 75,  interval: 1.4,
      ult: { kind: 'haste', amount: 0.3, dur: 5 }, passive: null },
    // ── 공중 영웅 (air: true) ──
    { id: 'wyvern',  name: '비룡기사', race: 'human', job: 'warrior', ultName: '급강하', role: 'warrior', el: 'fire',   range: 'melee',  cost: 3, air: true, hp: 1500, atk: 150, def: 85, interval: 1.2,
      ult: { kind: 'strike', mul: 3.2 }, passive: null },
    { id: 'harpy',   name: '하피', race: 'beast', job: 'archer', ultName: '깃털 폭풍',     role: 'ranged',  el: 'forest', range: 'mid', cost: 1, air: true, hp: 900,  atk: 120, def: 50, interval: 1.1,
      ult: { kind: 'multi', hits: 3, mul: 1.1 }, passive: null },
    { id: 'pegasus', name: '천마기사', race: 'human', job: 'paladin', ultName: '천상의 빛', role: 'support', el: 'light',  range: 'mid', cost: 2, air: true, hp: 1100, atk: 95,  def: 70, interval: 1.4,
      ult: { kind: 'healAll', mul: 2.0 }, passive: null },
    { id: 'bat',     name: '박쥐마녀', race: 'demon', job: 'mage', ultName: '박쥐 떼', role: 'mage',    el: 'dark',   range: 'long', cost: 2, air: true, hp: 900,  atk: 150, def: 50, interval: 1.5,
      ult: { kind: 'chain', hits: 3, mul: 1.2 }, passive: null },
    // ── 추가 영웅 (종족·직업 빈칸 채우기). 새 영웅을 그림 없이 넣을 때는 art: false를 달면 적·전리품·목록에 안 나와요 ──
    { id: 'thorn',  name: '가시덩굴', race: 'elf',   job: 'guardian', ultName: '가시 덩굴벽', role: 'tank',    el: 'forest', range: 'melee',  cost: 2, hp: 2100, atk: 70,  def: 150, interval: 1.6,
      ult: { kind: 'taunt', dur: 4, shieldPct: 0.3 }, passive: null },
    { id: 'gate',   name: '지옥문지기', race: 'demon', job: 'guardian', ultName: '지옥문 봉인', role: 'tank',  el: 'dark',   range: 'melee',  cost: 3, hp: 2500, atk: 85,  def: 170, interval: 1.7,
      ult: { kind: 'taunt', dur: 5, shieldPct: 0.35 }, passive: null },
    { id: 'lion',   name: '사자왕',   race: 'beast', job: 'paladin',  ultName: '사자의 맹세', role: 'tank',    el: 'light',  range: 'melee',  cost: 3, hp: 2100, atk: 95,  def: 165, interval: 1.5,
      ult: { kind: 'teamShield', mul: 1.7 }, passive: null },
    { id: 'shaman', name: '늑대주술사', race: 'beast', job: 'mage',   ultName: '가시 폭풍',   role: 'mage',    el: 'forest', range: 'long', cost: 2, hp: 950,  atk: 145, def: 55,  interval: 1.5,
      ult: { kind: 'aoe', mul: 1.0, slow: 0.25, slowDur: 3 }, passive: null },
    { id: 'dancer', name: '검무희',   race: 'elf',   job: 'warrior',  ultName: '물결 검무',   role: 'warrior', el: 'water',  range: 'melee',  cost: 2, hp: 1300, atk: 140, def: 80,  interval: 1.0,
      ult: { kind: 'multi', hits: 3, mul: 1.25 }, passive: null },
    { id: 'imp',    name: '화염임프', race: 'demon', job: 'archer',   ultName: '불씨 화살',   role: 'ranged',  el: 'fire',   range: 'mid', cost: 1, hp: 900,  atk: 130, def: 55,  interval: 1.2,
      ult: { kind: 'snipe', mul: 2.8 }, passive: null }
  ],
  ranges: { melee: '근거리', mid: '중거리', long: '장거리', far: '최장거리' },
  roles: { tank: '탱커', warrior: '전사', ranged: '원거리', mage: '마법', support: '지원' },
  // 종족·직업 (외형을 보고 나눴어요). 스킬·궁극기·시너지가 이 태그를 보고 효과가 달라지게 쓸 거예요
  // 속성은 elements(불·물·숲·빛·어둠)를 그대로 써요. role(탱커·전사…)은 전투 배치용이에요
  races: { human: '인간', elf: '엘프', beast: '수인', demon: '마족' },
  jobs:  { guardian: '수호자', paladin: '성기사', warrior: '전사', archer: '사수', mage: '마법사', bard: '음유시인' },

  // ───── 캠페인 ─────
  // 스테이지 n(0부터): 적 레벨 = 1 + n × levelStep, 벽 스테이지는 레벨 + wallBonus
  // 적 팀: 5명 (앞 2 / 뒤 3), 영웅 목록에서 스테이지마다 다르게 골라요. 10번째(보스)는 앞 가운데에 보스(체력 × bossHp, 공격 × bossAtk)
  campaign: {
    chapters: 3, perChapter: 10,
    levelStep: 1.0, wallBonus: 3, walls: [9, 14, 19, 26, 29],  // 1-10, 2-5, 2-10, 3-7, 3-10
    bossHp: 2.5, bossAtk: 1.15,
    enemyMul: 1.0,            // 적 전체 능력치 배율
    earlyMul: 0.55, earlyRamp: 0.04,  // 초반 적 배율: earlyMul에서 시작해 스테이지마다 earlyRamp씩 올라 1이 돼요
    reward: { base: 120, growth: 1.22 },   // 스테이지를 깨면 골드 = base × growth^n
    loseStepBack: 1,          // 지면 이만큼 앞 스테이지로 돌아가요 (0이면 그대로). 코스트 상한은 가장 멀리 간 기록 기준이라 줄지 않아요
    // 적 팀 스킬: from 스테이지부터 count개 (팀 스킬 목록에서 스테이지마다 정해져요). 레벨 = 1 + floor(스테이지 / levelEvery). 보스 스테이지는 +bossExtra개
    enemySkills: { table: [{ from: 4, count: 1 }, { from: 12, count: 2 }, { from: 22, count: 3 }], levelEvery: 10, bossExtra: 1 },
    idle: { enabled: false, base: 8, growth: 1.2, maxHours: 8 } // 방치 보상 (꺼짐: 방치형 게임이 아니에요). 골드는 스테이지 보상과 전리품으로만 들어와요
  },

  // 영웅 레벨업 가격 = base × growth^(레벨 − 1)
  // enabled: false → 골드로 레벨업하지 않아요 (레벨은 다른 방식으로 풀 예정). 골드는 상점 전용
  levelCost: { enabled: false, base: 60, growth: 1.17, maxLevel: 60 },

  // ───── 팀 스킬 (상점에서 사요). 팀 전체에 적용되고, 스킬마다 자기 쿨타임(cd초)이 돌면 자동 발동 ─────
  // 레벨 효과: 수치 × (1 + perLevel × (레벨 − 1)). 같은 스킬을 또 사면 레벨 +1
  skills: {
    slots: 4, maxLevel: 1, perLevel: 0.3, firstAt: 0.5, // 레벨 없음(등급만): maxLevel 1이면 같은 스킬은 다시 못 사요. 첫 발동은 쿨타임의 firstAt배 시점
    // 스킬 등급 1~4: 일반·고급·희귀·전설. 아이콘 테두리 색으로 구분하고, 전설은 테두리에 빛이 돌아요
    grades: { 1: { name: '일반', color: '#d9dde8' }, 2: { name: '고급', color: '#5fcf6a' }, 3: { name: '희귀', color: '#4fa3ff' }, 4: { name: '전설', color: '#ffb02e' } },
    list: [
      { id: 'rally',   grade: 2, name: '응원가',   icon: '📯', cd: 9,  price: 150, kind: 'atkBuff', amount: 0.25, dur: 4,  desc: '아군 공격 +{a}% {d}초' },
      { id: 'mend',    grade: 3, name: '치유의 비', icon: '🌧️', cd: 10, price: 160, kind: 'healPct', amount: 0.10,          desc: '아군 체력 {a}% 회복' },
      { id: 'ward',    grade: 2, name: '수호막',   icon: '🛡️', cd: 12, price: 170, kind: 'shieldPct', amount: 0.12,        desc: '아군 보호막 최대 체력의 {a}%' },
      { id: 'meteor',  grade: 4, name: '유성',     icon: '☄️', cd: 11, price: 200, kind: 'nuke', amount: 0.8,             desc: '적 전체에 아군 평균 공격의 {a}% 피해' },
      { id: 'frost',   grade: 1, name: '서리 바람', icon: '🌬️', cd: 12, price: 140, kind: 'slowAll', amount: 0.3, dur: 3,  desc: '적 전체 {a}% 느려짐 {d}초' },
      { id: 'drums',   grade: 3, name: '전투 북',  icon: '🥁', cd: 11, price: 150, kind: 'hasteAll', amount: 0.25, dur: 4, desc: '아군 공격 속도 +{a}% {d}초' },
      { id: 'snipe',   grade: 1, name: '정조준',   icon: '🎯', cd: 7,  price: 130, kind: 'execute', amount: 1.6,          desc: '체력 가장 낮은 적에게 아군 최고 공격의 {a}% 피해' },
      { id: 'charge',  grade: 4, name: '기운 충전', icon: '⚡', cd: 13, price: 180, kind: 'energyAll', amount: 30,         desc: '아군 궁극기 에너지 +{a}' },
      { id: 'gust',    grade: 2, name: '돌풍',     icon: '🌪️', cd: 9,  price: 160, kind: 'knockback', amount: 70, dur: 0.8, desc: '적 전체를 뒤로 밀어내고 {d}초 멈춤' },
      // ── 시너지 스킬: tag = 종족(race)·직업(job)·속성(el) 조건 ──
      // only: true → 조건에 맞는 아군에게만 효과. per: 조건에 맞는 살아 있는 아군 1명마다 효과 +per배 (0명이면 기본값만)
      { id: 'howl',    grade: 2, name: '야성의 포효', icon: '🐾', cd: 9,  price: 150, kind: 'atkBuff', amount: 0.4, dur: 4, tag: { race: 'beast' }, only: true, desc: '수인 아군 공격 +{a}% {d}초' },
      { id: 'grove',   grade: 2, name: '숲의 축복', icon: '🍃', cd: 10, price: 160, kind: 'healPct', amount: 0.05, tag: { race: 'elf' }, per: 0.5, desc: '아군 체력 {a}% 회복, 엘프 1명마다 +50%' },
      { id: 'pact',    grade: 3, name: '피의 계약', icon: '🩸', cd: 11, price: 180, kind: 'nuke', amount: 0.35, tag: { race: 'demon' }, per: 0.5, desc: '적 전체에 아군 평균 공격의 {a}% 피해, 마족 1명마다 +50%' },
      { id: 'unity',   grade: 1, name: '인간의 단결', icon: '🤝', cd: 12, price: 140, kind: 'shieldPct', amount: 0.05, tag: { race: 'human' }, per: 0.25, desc: '아군 보호막 최대 체력의 {a}%, 인간 1명마다 +25%' },
      { id: 'bulwark', grade: 2, name: '방패벽', icon: '🧱', cd: 10, price: 160, kind: 'shieldPct', amount: 0.3, tag: { job: ['guardian', 'paladin'] }, only: true, desc: '수호자·성기사 아군 보호막 최대 체력의 {a}%' },
      { id: 'volley',  grade: 3, name: '일제 사격', icon: '🏹', cd: 8,  price: 180, kind: 'volley', amount: 1.5, tag: { job: 'archer' }, only: true, desc: '사수 아군이 각자 무작위 적에게 공격의 {a}% 피해' },
      { id: 'arcane',  grade: 3, name: '마력 공명', icon: '🔮', cd: 10, price: 170, kind: 'energyAll', amount: 40, tag: { job: 'mage' }, only: true, desc: '마법사 아군 궁극기 에너지 +{a}' },
      { id: 'chorus',  grade: 4, name: '합주',   icon: '🎶', cd: 12, price: 200, kind: 'hasteAll', amount: 0.15, dur: 5, tag: { job: 'bard' }, per: 0.6, desc: '아군 공격 속도 +{a}% {d}초, 음유시인 1명마다 +60%' },
      { id: 'resonance', grade: 4, name: '원소 공명', icon: '🌈', cd: 11, price: 200, kind: 'atkBuff', amount: 0.06, dur: 5, tag: { el: '*' }, per: 1, desc: '아군 공격 +{a}% {d}초, 가장 많은 같은 속성 1명마다 +{a}%' }
    ]
  },
  // 상점: 전투가 끝날 때마다 무작위 stock개가 새로 들어와요. 가격 = price × priceGrowth^(깬 스테이지 수)
  // 새로고침 비용 = refresh × refreshGrowth^(이번 판 새로고침 횟수), 전투가 끝나면 횟수 초기화
  // 스킬 판매가 = 지금 상점가 × 레벨 × sellRate (오래되거나 등급이 낮은 스킬을 팔아 자리를 비워요)
  shop: { stock: 3, priceGrowth: 1.12, refresh: 40, refreshGrowth: 1.6, sellRate: 0.5 },

  startLevel: 1,
  // ───── 위험 종 ─────
  // 전투 전에 종을 울려(0~max번) 판을 키워요. 한 번 울릴 때마다 적 enemy명 추가, 클리어 골드 +gold, 전리품 골드 주머니 액수 +lootGold배.
  // 늘어난 적도 전리품 후보에 들어가요. 지면 보상은 없어요. 적은 세지지 않아요: 전장(5칸)에 빈자리가 있는 만큼만 울릴 수 있어요
  bell: { max: 3, enemy: 1, gold: 0.4, lootGold: 0.5 },

  // ───── 특수 몹 이벤트 ─────
  // from 스테이지부터, 보스가 아닌 판에 chance 확률로 이벤트 1개 (weights 비율로 고름). 전투 전 편성 화면에서 미리 보여요
  // goblin 돈고블린: 싸우지 않고 도망쳐요. flee초 안에 잡으면 클리어 골드 × goldMul 추가, 놓치면 사라져요 (경험치도 없음)
  // merchant 방랑상인: 전투에는 안 나와요. 이기면 특별 상점이 열려요 (희귀 이상 스킬 skills개 + 영웅 heroes명, 비싸게)
  // merc 떠돌이 용병: 적으로 함께 싸워요. 이기면 골드를 내고 바로 영입할 수 있어요 (값 = price × 코스트 × priceGrowth^스테이지)
  events: {
    from: 2, chance: 0.18, weights: { goblin: 4, merchant: 3, merc: 3 },
    goblin:   { goldMul: 2.5, flee: 10, speed: 90 },
    merchant: { skills: 2, minGrade: 3, priceMul: 1.3, heroes: 1, heroPrice: 110 },
    merc:     { price: 90, costPlus: 1 } // 용병 코스트는 그 스테이지 적 최고 코스트 + costPlus까지
  },
  // 특수 몹 (영웅 목록과 따로). 능력치는 스테이지 레벨·배율을 똑같이 받아요
  mobs: [
    { id: 'goblin', name: '돈고블린', mob: 'goblin', race: 'beast', job: null, el: 'dark', range: 'melee', role: 'warrior', cost: 0, art: false,
      hp: 1100, atk: 0, def: 40, interval: 1, ultName: '', ult: null, passive: null }
  ],

  // ───── 플레이어 레벨 ─────
  // 적을 1명 쓰러뜨릴 때마다 경험치 xpPerKill (진 판에서 쓰러뜨린 적도 쳐요)
  // need[L-1] = L레벨에서 다음 레벨까지 필요한 경험치. 최고 레벨 = need 길이 + 1
  // 아래 표는 레벨별 값(index = 레벨 - 1): field 전장 칸 수, skillSlots 팀 스킬 칸 수,
  // shopGrade 상점 진열 등급 확률 가중치 [일반, 고급, 희귀, 전설]
  player: {
    xpPerKill: 1,
    need:       [2, 3, 4, 5, 6, 7, 8, 9, 10],
    field:      [2, 3, 3, 4, 4, 5, 5, 5, 5, 5],
    skillSlots: [1, 1, 2, 2, 3, 3, 4, 4, 4, 4],
    shopGrade:  [[70, 25, 5, 0], [65, 28, 7, 0], [55, 30, 13, 2], [50, 32, 15, 3], [42, 33, 19, 6],
                 [36, 34, 22, 8], [30, 34, 25, 11], [25, 33, 28, 14], [20, 32, 30, 18], [15, 30, 33, 22]]
  },
  // 등급 테두리 색: 코스트 1·2·3 (캐릭터 그림 외곽선)
  // 영웅 등급(합성 등급): 모든 영웅은 1등급으로 들어오고, 합성할 때마다 +1. 캐릭터 외곽선 색으로 보여요 (코스트 색이 아니에요)
  heroGrades: { 1: { name: '일반', color: '#d9dde8' }, 2: { name: '고급', color: '#5fcf6a' }, 3: { name: '희귀', color: '#4fa3ff' }, 4: { name: '영웅', color: '#c77dff' }, 5: { name: '전설', color: '#ffb02e' } },
  gradeColor: { 1: '#d9dde8', 2: '#5fcf6a', 3: '#4fa3ff', 4: '#c77dff', 5: '#ffb02e' }, // 등급 → 외곽선 색 (heroGrades와 같음)

  // ───── 영입·코스트·백팩·합성 ─────
  recruit: {
    startHero: 'bear',          // 처음 가진 영웅 1명
    // 출전 코스트 상한 = start + floor(깬 스테이지 수 / every), 최대 max
    costCap: { enabled: false, start: 3, every: 3, max: 10 }, // 꺼짐: 출전 제한은 플레이어 레벨의 전장 칸 수(player.field)만 써요. 영웅 cost(1~3)는 등급(외곽선 색)·적 등장 시기·가격용으로 남아요
    fieldSlots: 5,               // 전장 칸
    bag: 5,                      // 백팩 칸 (전장에 안 올린 영웅)
    // 합성: 같은 영웅·같은 등급 2명을 겹쳐 놓으면 1명이 되고 등급 +1 (최대 maxGrade).
    // 같은 영웅도 여러 명을 각각 전장에 올릴 수 있어요. 합성은 겹쳐 놓을 때만 일어나요
    merge: { maxGrade: 5, mul: [1, 1.6, 2.5, 3.8, 5.6] },   // 등급별 체력·공격 배율
    mergeCount: 2, maxStar: 5, starMul: [1, 1.6, 2.5, 3.8, 5.6], // (예전 이름, 호환용: merge와 같은 값)
    // 스테이지 n(0부터)의 적 수: 배열 끝을 넘으면 마지막 값
    enemyCount: [1, 1, 2, 2, 3, 3, 4, 4, 5],
    // 전리품 룰렛 칸: 이긴 판의 적 영웅 + 그 판 적이 쓰던 스킬(두루마리) + 골드 주머니 goldSlots개 (1개: 전장 위 미리 보기와 같아요)
    // 골드 주머니 액수 = 그 스테이지 클리어 보상 × (goldMin ~ goldMax) 사이 무작위. 꽝 느낌이 나도록 작게
    loot: { goldSlots: 1, goldMin: 0.3, goldMax: 0.7, skills: true },
    // 전리품은 이긴 판마다 1개만 받아요. 나온 후보를 받거나, 버리고 다시 돌려요(버린 후보는 그 판 룰렛에서 빠져요)
    // 다시 돌리기 비용 = base × growth^(이번 판에서 돌린 횟수) × shop.priceGrowth^(스테이지)
    reroll: { base: 60, growth: 1.8 },
    // 적으로 나오는 영웅의 최고 코스트: from 스테이지부터
    enemyMaxCost: [{ from: 0, cost: 1 }, { from: 4, cost: 2 }, { from: 10, cost: 3 }]
  }
};

if (typeof module !== 'undefined') module.exports = IDLE_DATA;
