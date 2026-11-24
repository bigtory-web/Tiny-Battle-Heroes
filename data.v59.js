// 방치형 RPG 전투 테스트베드 테이블. 숫자는 모두 임시값이에요. 여기만 고치면 전투·캠페인이 바뀌어요.
// 근거 문서: ../방치형RPG_전투테스트베드_기획.md
var IDLE_DATA = {
  // ───── 전투 기본 규칙 ─────
  battle: {
    dt: 0.1,            // 0.1초 단위로 진행
    timeLimit: 90,      // 넘기면 패배
    enrage: { at: 40, perSec: 0.15 }, // 광폭화: at초가 지나면 모든 평타·궁극기 피해가 초마다 +perSec배씩 커져요 (탱커끼리 시간 초과로 비기는 판을 막아요)
    defK: 300,          // 피해 감소 = 방어 / (방어 + defK)
    energyMax: 100,
    startJitter: 0.4,   // 첫 평타까지 0~이 값(초) 사이로 흩어져요 (모두 동시에 치지 않게)
    // 전장과 이동: 유닛이 상대에게 걸어가서 사거리 안에 들어와야 때려요 (단위: 전장 픽셀, 초)
    arena: {
      w: 720, h: 320, yMin: 162, yMax: 226, // yMax 262 → 226 (2026-11-18): 전장 아래쪽 띠는 백팩·상점 버튼 자리라 유닛이 내려오지 않아요 // 아래쪽 약 40%가 땅: 유닛은 이 띠 안에서만 상하좌우로 움직여요 (위쪽은 하늘)
      pos: [[220, 184], [168, 220], [116, 184], [64, 220], [40, 172], [92, 166], [140, 224], [20, 220]], // 왼쪽 팀 자리 0~4: 땅 가운데 거의 한 줄. 오른쪽 팀은 좌우를 뒤집어요. 5~7: 종으로 늘어난 적이 서는 자리
      // 사거리 4단계: 근거리·중거리·장거리·최장거리 (영웅 range 값). 근거리는 상대와 붙지 않게 조금 띄워요
      reach: { melee: 52, mid: 100, long: 150, far: 210 },   // 공격 사거리
      speed: { melee: 70, mid: 62, long: 55, far: 50 },      // 이동 속도 (초당)
      spacing: 62, spacingFoe: 46          // 같은 편끼리 이 거리보다 가까우면 서로 밀어내요 / 상대 편끼리는 spacingFoe (근접 사거리 40보다 작아야 붙어서 때려요)
    }
  },

  // 레벨 성장: 능력치 × (1 + perLevel × (레벨 − 1))
  growth: { perLevel: 0.12 },
  // 치명타(2026-11-18): 모든 캐릭터의 기본 능력. 피해는 늘 mul배(2배), 확률만 달라요. 영웅에 crit를 적으면 그 값, 예전 치명타 패시브 영웅은 그 수치, 나머지는 역할 기본값
  crit: { mul: 2, base: { tank: 0.05, warrior: 0.1, ranged: 0.15, mage: 0.1, support: 0.05 } },

  // 진영 상성: 불 > 숲 > 물 > 불, 빛 ↔ 어둠은 서로 강해요
  elements: {
    names: { fire: '불', water: '얼음', forest: '숲', light: '빛', dark: '어둠' }, // 2026-11-18: 물 → 얼음 (id는 water 그대로)
    beats: { fire: 'forest', forest: 'water', water: 'fire', light: 'dark', dark: 'light' }
  },
  // 속성 고유 효과(2026-11-18): 그 속성 영웅의 스킬(궁극기·초월 스킬)에 늘 붙어요. 평타에는 없어요
  //   스킬이 맞힌 적마다 생기고, 아무도 안 맞히는 스킬(보호막·회복 등)이면 가장 가까운 적(불·얼음·어둠) 또는 자기(숲·빛)에 한 번 생겨요
  //   초월로 붙인 스킬은 그 재료 영웅의 속성 효과를 가져와요. 연계 스킬(trigger)이 이 일들에 반응해요
  //   fire 화상: dur초 동안 1초마다 공격력 × mul 피해 (다시 맞으면 시간 새로)
  //   forest 가속: 스킬마다 자기 공속 +per (최대 max번 쌓임, dur초 지나면 사라짐)
  //   water 얼음: 맞은 적 공속 -slow, dur초
  //   light 회복: 준 피해 × heal만큼 체력 비율이 가장 낮은 아군 회복
  //   dark 기절: chance 확률로 dur초 동안 아무것도 못 해요
  elementFx: {
    fire:   { dur: 4, mul: 0.3 },
    forest: { per: 0.12, max: 4, dur: 6 },
    water:  { slow: 0.3, dur: 3 },
    light:  { heal: 0.4 },
    dark:   { chance: 1, dur: 1.2 }
  },


  // ───── 바꿔 끼우는 전투 요소 (기본값 = 첫 번째) ─────
  modules: {
    energy:   { pick: 'both',  options: {
      both:       { name: '평타 + 피격', onAttack: 20, onHitScale: 50 },
      attackOnly: { name: '평타만',     onAttack: 25, onHitScale: 0 },
      time:       { name: '시간',       onAttack: 0,  onHitScale: 0, perSec: 12 },
      kill:       { name: '평타 + 처치', onAttack: 20, onHitScale: 0, onKill: 40 } } },
    targeting: { pick: 'near', options: {
      front:   { name: '앞줄 먼저' },
      near:    { name: '가장 가까운 적 (선 자리대로)' },
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
  // ult: 궁극기 종류와 수치, ultName: 궁극기 이름(아이콘은 img/p/ult_<id>.png)
  // passive: 패시브 { kind, v } (종류는 passives 표). 영웅 효과는 궁극기·패시브 2개이고, 각각 레벨이 있어요 (gradeEffects)
  heroes: [
    { id: 'bear',   name: '바위곰', race: 'beast', job: 'guardian', ultName: '바위 포효',   role: 'tank',    el: 'forest', range: 'melee', cost: 1, grade: 1,  hp: 2200, atk: 70,  def: 160, interval: 1.6,
      ult: { kind: 'taunt', dur: 4, shieldPct: 0.25 }, passive: { kind: 'thorns', v: 0.2 } },
    { id: 'knight', name: '철갑기사', race: 'human', job: 'paladin', ultName: '수호의 방패', role: 'tank',    el: 'light',  range: 'melee', cost: 2, grade: 2,  hp: 2000, atk: 75,  def: 180, interval: 1.6,
      ult: { kind: 'teamShield', mul: 1.6 }, passive: { kind: 'shieldStart', v: 0.15 } },
    { id: 'blades', name: '쌍검', race: 'human', job: 'warrior', ultName: '화염 일섬',     role: 'warrior', el: 'fire',   range: 'melee', cost: 2, grade: 2,  hp: 1400, atk: 150, def: 90,  interval: 1.2,
      ult: { kind: 'strike', mul: 3.5 }, passive: { kind: 'crit', v: 0.15 } },
    { id: 'wolf',   name: '늑대발톱', race: 'beast', job: 'warrior', ultName: '연속 할퀴기', role: 'warrior', el: 'forest', range: 'melee', cost: 1, grade: 1,  hp: 1300, atk: 130, def: 80,  interval: 0.9,
      ult: { kind: 'multi', hits: 3, mul: 1.3 }, passive: { kind: 'rage', v: 0.25 } },
    { id: 'shadow', name: '그림자', race: 'demon', job: 'warrior', ultName: '그림자 습격',   role: 'warrior', el: 'dark',   range: 'melee', cost: 3, grade: 4,  hp: 1150, atk: 160, def: 70,  interval: 1.1,
      ult: { kind: 'backstab', mul: 3.2 }, passive: { kind: 'crit', v: 0.25 } },
    { id: 'hawk',   name: '매의눈', race: 'human', job: 'archer', ultName: '저격',   role: 'ranged',  el: 'water',  range: 'far', cost: 2, grade: 2, hp: 1000, atk: 165, def: 60,  interval: 1.3,
      ult: { kind: 'snipe', mul: 3.4 }, passive: { kind: 'crit', v: 0.2 } },
    { id: 'rain',   name: '화살비', race: 'elf', job: 'archer', ultName: '화살비',   role: 'ranged',  el: 'fire',   range: 'far', cost: 1, grade: 1, hp: 1000, atk: 140, def: 60,  interval: 1.3,
      ult: { kind: 'aoe', mul: 1.1 }, passive: { kind: 'splash', v: 0.3 } },
    { id: 'frost',  name: '얼음술사', race: 'elf', job: 'mage', ultName: '눈보라', role: 'mage',    el: 'water',  range: 'long', cost: 3, grade: 3, hp: 950,  atk: 150, def: 55,  interval: 1.5,
      ult: { kind: 'aoe', mul: 0.9, slow: 0.3, slowDur: 3 }, passive: { kind: 'splash', v: 0.25 } },
    { id: 'flame',  name: '불꽃술사', race: 'human', job: 'mage', ultName: '대폭발', role: 'mage',    el: 'fire',   range: 'long', cost: 3, grade: 3, hp: 900,  atk: 170, def: 50,  interval: 1.6,
      ult: { kind: 'aoe', mul: 1.5 }, passive: { kind: 'splash', v: 0.35 } },
    { id: 'storm',  name: '번개술사', race: 'human', job: 'mage', ultName: '연쇄 번개', role: 'mage',    el: 'light',  range: 'long', cost: 3, grade: 3, hp: 950,  atk: 155, def: 55,  interval: 1.5,
      ult: { kind: 'chain', hits: 4, mul: 1.15 }, passive: { kind: 'energyStart', v: 30 } },
    { id: 'song',   name: '숲의노래', race: 'elf', job: 'bard', ultName: '숲의 노래', role: 'support', el: 'forest', range: 'mid', cost: 2, grade: 2, hp: 1100, atk: 100, def: 70,  interval: 1.4,
      ult: { kind: 'healAll', mul: 2.4 }, passive: { kind: 'auraRegen', v: 0.01 } },
    { id: 'drum',   name: '북치기', race: 'demon', job: 'bard', ultName: '전투 북소리',   role: 'support', el: 'dark',   range: 'mid', cost: 1, grade: 1, hp: 1150, atk: 95,  def: 75,  interval: 1.4,
      ult: { kind: 'haste', amount: 0.3, dur: 5 }, passive: { kind: 'auraAtk', v: 0.08 } },
    { id: 'wyvern',  name: '비룡기사', race: 'human', job: 'warrior', ultName: '급강하', role: 'warrior', el: 'fire',   range: 'melee',  cost: 3, grade: 4, hp: 1500, atk: 150, def: 85, interval: 1.2,
      ult: { kind: 'strike', mul: 3.2 }, passive: { kind: 'lifesteal', v: 0.15 } },
    { id: 'harpy',   name: '하피', race: 'beast', job: 'archer', ultName: '깃털 폭풍',     role: 'ranged',  el: 'forest', range: 'mid', cost: 1, grade: 1, hp: 900,  atk: 120, def: 50, interval: 1.1,
      ult: { kind: 'multi', hits: 3, mul: 1.1 }, passive: { kind: 'haste', v: 0.15 } },
    { id: 'pegasus', name: '천마기사', race: 'human', job: 'paladin', ultName: '천상의 빛', role: 'support', el: 'light',  range: 'mid', cost: 2, grade: 3, hp: 1100, atk: 95,  def: 70, interval: 1.4,
      ult: { kind: 'healAll', mul: 2.0 }, passive: { kind: 'auraRegen', v: 0.012 } },
    { id: 'bat',     name: '박쥐마녀', race: 'demon', job: 'mage', ultName: '박쥐 떼', role: 'mage',    el: 'dark',   range: 'long', cost: 2, grade: 2, hp: 900,  atk: 150, def: 50, interval: 1.5,
      ult: { kind: 'chain', hits: 3, mul: 1.2 }, passive: { kind: 'lifesteal', v: 0.2 } },
    // ── 추가 영웅 (종족·직업 빈칸 채우기). 새 영웅을 그림 없이 넣을 때는 art: false를 달면 적·전리품·목록에 안 나와요 ──
    { id: 'thorn',  name: '가시덩굴', race: 'elf',   job: 'guardian', ultName: '가시 덩굴벽', role: 'tank',    el: 'forest', range: 'melee',  cost: 2, grade: 3, hp: 2100, atk: 70,  def: 150, interval: 1.6,
      ult: { kind: 'taunt', dur: 4, shieldPct: 0.3 }, passive: { kind: 'thorns', v: 0.25 } },
    { id: 'gate',   name: '지옥문지기', race: 'demon', job: 'guardian', ultName: '지옥문 봉인', role: 'tank',  el: 'dark',   range: 'melee',  cost: 3, grade: 4, hp: 2500, atk: 85,  def: 170, interval: 1.7,
      ult: { kind: 'taunt', dur: 5, shieldPct: 0.35 }, passive: { kind: 'shieldStart', v: 0.25 } },
    { id: 'lion',   name: '사자왕',   race: 'beast', job: 'paladin',  ultName: '사자의 맹세', role: 'tank',    el: 'light',  range: 'melee',  cost: 3, grade: 4, hp: 2100, atk: 95,  def: 165, interval: 1.5,
      ult: { kind: 'teamShield', mul: 1.7 }, passive: { kind: 'auraAtk', v: 0.1 } },
    { id: 'shaman', name: '늑대주술사', race: 'beast', job: 'mage',   ultName: '가시 폭풍',   role: 'mage',    el: 'forest', range: 'long', cost: 2, grade: 3, hp: 950,  atk: 145, def: 55,  interval: 1.5,
      ult: { kind: 'aoe', mul: 1.0, slow: 0.25, slowDur: 3 }, passive: { kind: 'energyStart', v: 25 } },
    { id: 'dancer', name: '검무희',   race: 'elf',   job: 'warrior',  ultName: '물결 검무',   role: 'warrior', el: 'water',  range: 'melee',  cost: 2, grade: 2, hp: 1300, atk: 140, def: 80,  interval: 1.0,
      ult: { kind: 'multi', hits: 3, mul: 1.25 }, passive: { kind: 'haste', v: 0.2 } },
    { id: 'imp',    name: '화염임프', race: 'demon', job: 'archer',   ultName: '불씨 화살',   role: 'ranged',  el: 'fire',   range: 'mid', cost: 1, grade: 1, hp: 900,  atk: 130, def: 55,  interval: 1.2,
      ult: { kind: 'snipe', mul: 2.8 }, passive: { kind: 'crit', v: 0.2 } },
    // ── 추가 영웅 43명 (2026-11-18, 모두 65명). 43명 모두 그림이 들어와서 풀었어요 ──
    { id: 'boar', name: '멧돼지전사', race: 'beast', job: 'warrior', ultName: '돌진', role: 'warrior', el: 'forest', range: 'melee', cost: 1, grade: 1, hp: 1250, atk: 135, def: 75, interval: 1.1,
      ult: { kind: 'strike', mul: 3.1 }, passive: { kind: 'rage', v: 0.25 } },
    { id: 'squire', name: '견습기사', race: 'human', job: 'paladin', ultName: '방패 올리기', role: 'tank', el: 'light', range: 'melee', cost: 1, grade: 1, hp: 2000, atk: 80, def: 170, interval: 1.55,
      ult: { kind: 'teamShield', mul: 1.55 }, passive: { kind: 'shieldStart', v: 0.15 } },
    { id: 'sprout', name: '새싹정령', race: 'elf', job: 'bard', ultName: '새싹의 노래', role: 'support', el: 'forest', range: 'mid', cost: 1, grade: 1, hp: 1160, atk: 100, def: 75, interval: 1.4,
      ult: { kind: 'healAll', mul: 2 }, passive: { kind: 'auraRegen', v: 0.01 } },
    { id: 'pup', name: '불강아지', race: 'beast', job: 'archer', ultName: '불씨 뱉기', role: 'ranged', el: 'fire', range: 'mid', cost: 1, grade: 1, hp: 930, atk: 135, def: 55, interval: 1.25,
      ult: { kind: 'snipe', mul: 2.8 }, passive: { kind: 'crit', v: 0.15 } },
    { id: 'mudgolem', name: '진흙골렘', race: 'demon', job: 'guardian', ultName: '진흙 벽', role: 'tank', el: 'water', range: 'melee', cost: 1, grade: 1, hp: 2190, atk: 75, def: 160, interval: 1.6,
      ult: { kind: 'taunt', dur: 4, shieldPct: 0.25 }, passive: { kind: 'thorns', v: 0.2 } },
    { id: 'slinger', name: '돌팔매꾼', race: 'human', job: 'archer', ultName: '돌 세례', role: 'ranged', el: 'forest', range: 'far', cost: 1, grade: 1, hp: 910, atk: 135, def: 55, interval: 1.25,
      ult: { kind: 'multi', hits: 3, mul: 1.15 }, passive: { kind: 'haste', v: 0.15 } },
    { id: 'candle', name: '촛불마법사', race: 'human', job: 'mage', ultName: '불똥', role: 'mage', el: 'fire', range: 'long', cost: 1, grade: 1, hp: 920, atk: 150, def: 50, interval: 1.5,
      ult: { kind: 'aoe', mul: 1.1 }, passive: { kind: 'splash', v: 0.3 } },
    { id: 'batling', name: '꼬마박쥐', race: 'demon', job: 'warrior', ultName: '물어뜯기', role: 'warrior', el: 'dark', range: 'melee', cost: 1, grade: 1, hp: 1350, atk: 145, def: 85, interval: 1.1,
      ult: { kind: 'multi', hits: 3, mul: 1.15 }, passive: { kind: 'lifesteal', v: 0.15 } },
    { id: 'frog', name: '개구리주술사', race: 'beast', job: 'mage', ultName: '물벼락', role: 'mage', el: 'water', range: 'long', cost: 1, grade: 1, hp: 900, atk: 145, def: 50, interval: 1.5,
      ult: { kind: 'aoe', mul: 0.85, slow: 0.25, slowDur: 3 }, passive: { kind: 'energyStart', v: 25 } },
    { id: 'piper', name: '피리소년', race: 'human', job: 'bard', ultName: '행진곡', role: 'support', el: 'light', range: 'mid', cost: 1, grade: 1, hp: 1140, atk: 100, def: 75, interval: 1.4,
      ult: { kind: 'haste', amount: 0.25, dur: 5 }, passive: { kind: 'auraAtk', v: 0.08 } },
    { id: 'mossguard', name: '이끼수호병', race: 'elf', job: 'guardian', ultName: '이끼 방벽', role: 'tank', el: 'forest', range: 'melee', cost: 1, grade: 1, hp: 2060, atk: 70, def: 150, interval: 1.6,
      ult: { kind: 'taunt', dur: 4, shieldPct: 0.25 }, passive: { kind: 'shieldStart', v: 0.15 } },
    { id: 'spark', name: '번개쥐', race: 'beast', job: 'warrior', ultName: '찌릿 돌진', role: 'warrior', el: 'light', range: 'melee', cost: 2, grade: 2, hp: 1350, atk: 145, def: 85, interval: 1.1,
      ult: { kind: 'strike', mul: 3.29 }, passive: { kind: 'haste', v: 0.17 } },
    { id: 'ranger', name: '숲순찰대', race: 'elf', job: 'archer', ultName: '관통 화살', role: 'ranged', el: 'forest', range: 'mid', cost: 2, grade: 2, hp: 1030, atk: 150, def: 60, interval: 1.25,
      ult: { kind: 'snipe', mul: 2.97 }, passive: { kind: 'crit', v: 0.17 } },
    { id: 'shield', name: '방패병', race: 'human', job: 'guardian', ultName: '철벽', role: 'tank', el: 'water', range: 'melee', cost: 2, grade: 2, hp: 2190, atk: 75, def: 160, interval: 1.6,
      ult: { kind: 'taunt', dur: 4, shieldPct: 0.28 }, passive: { kind: 'thorns', v: 0.22 } },
    { id: 'fox', name: '여우검객', race: 'beast', job: 'warrior', ultName: '여우불 베기', role: 'warrior', el: 'fire', range: 'melee', cost: 2, grade: 2, hp: 1380, atk: 150, def: 85, interval: 1.1,
      ult: { kind: 'strike', mul: 3.29 }, passive: { kind: 'crit', v: 0.17 } },
    { id: 'nun', name: '수녀', race: 'human', job: 'bard', ultName: '기도', role: 'support', el: 'light', range: 'mid', cost: 2, grade: 2, hp: 1120, atk: 95, def: 70, interval: 1.4,
      ult: { kind: 'healAll', mul: 2.12 }, passive: { kind: 'auraRegen', v: 0.011 } },
    { id: 'warlock', name: '흑마법사', race: 'demon', job: 'mage', ultName: '어둠 구슬', role: 'mage', el: 'dark', range: 'long', cost: 2, grade: 2, hp: 960, atk: 155, def: 55, interval: 1.5,
      ult: { kind: 'chain', hits: 3, mul: 1.17 }, passive: { kind: 'lifesteal', v: 0.17 } },
    { id: 'turtle', name: '거북기사', race: 'beast', job: 'paladin', ultName: '등껍질 방패', role: 'tank', el: 'water', range: 'melee', cost: 2, grade: 2, hp: 2160, atk: 85, def: 185, interval: 1.55,
      ult: { kind: 'teamShield', mul: 1.64 }, passive: { kind: 'shieldStart', v: 0.17 } },
    { id: 'horn', name: '뿔나팔수', race: 'demon', job: 'bard', ultName: '전쟁 나팔', role: 'support', el: 'fire', range: 'mid', cost: 2, grade: 2, hp: 1140, atk: 100, def: 75, interval: 1.4,
      ult: { kind: 'haste', amount: 0.27, dur: 5 }, passive: { kind: 'auraAtk', v: 0.09 } },
    { id: 'owl', name: '올빼미궁수', race: 'beast', job: 'archer', ultName: '야간 사격', role: 'ranged', el: 'dark', range: 'far', cost: 2, grade: 2, hp: 1010, atk: 150, def: 60, interval: 1.25,
      ult: { kind: 'multi', hits: 3, mul: 1.22 }, passive: { kind: 'crit', v: 0.17 } },
    { id: 'icefairy', name: '얼음요정', race: 'elf', job: 'mage', ultName: '서리꽃', role: 'mage', el: 'water', range: 'long', cost: 2, grade: 2, hp: 920, atk: 150, def: 50, interval: 1.5,
      ult: { kind: 'aoe', mul: 0.9, slow: 0.25, slowDur: 3 }, passive: { kind: 'splash', v: 0.33 } },
    { id: 'monk', name: '수도승', race: 'human', job: 'warrior', ultName: '연타', role: 'warrior', el: 'light', range: 'melee', cost: 2, grade: 3, hp: 1400, atk: 150, def: 85, interval: 1.1,
      ult: { kind: 'multi', hits: 3, mul: 1.29 }, passive: { kind: 'rage', v: 0.3 } },
    { id: 'vine', name: '덩굴사냥꾼', race: 'elf', job: 'warrior', ultName: '덩굴 채찍', role: 'warrior', el: 'forest', range: 'melee', cost: 2, grade: 3, hp: 1460, atk: 155, def: 90, interval: 1.1,
      ult: { kind: 'strike', mul: 3.47 }, passive: { kind: 'lifesteal', v: 0.18 } },
    { id: 'gargoyle', name: '가고일', race: 'demon', job: 'guardian', ultName: '석화', role: 'tank', el: 'dark', range: 'melee', cost: 3, grade: 3, hp: 2280, atk: 75, def: 165, interval: 1.6,
      ult: { kind: 'taunt', dur: 4, shieldPct: 0.31 }, passive: { kind: 'thorns', v: 0.24 } },
    { id: 'valkyrie', name: '발키리', race: 'human', job: 'paladin', ultName: '빛의 창', role: 'tank', el: 'light', range: 'melee', cost: 3, grade: 4, hp: 2280, atk: 90, def: 195, interval: 1.55,
      ult: { kind: 'teamShield', mul: 1.83 }, passive: { kind: 'auraAtk', v: 0.1 } },
    { id: 'assassin', name: '암살자', race: 'human', job: 'warrior', ultName: '급소 찌르기', role: 'warrior', el: 'dark', range: 'melee', cost: 2, grade: 3, hp: 1350, atk: 145, def: 85, interval: 1.1,
      ult: { kind: 'backstab', mul: 3.25 }, passive: { kind: 'crit', v: 0.18 } },
    { id: 'druid', name: '드루이드', race: 'elf', job: 'mage', ultName: '가시 숲', role: 'mage', el: 'forest', range: 'long', cost: 3, grade: 3, hp: 990, atk: 160, def: 55, interval: 1.5,
      ult: { kind: 'aoe', mul: 0.95, slow: 0.25, slowDur: 3 }, passive: { kind: 'energyStart', v: 30 } },
    { id: 'tiger', name: '호랑이무사', race: 'beast', job: 'warrior', ultName: '맹호 연격', role: 'warrior', el: 'fire', range: 'melee', cost: 3, grade: 4, hp: 1510, atk: 165, def: 95, interval: 1.1,
      ult: { kind: 'multi', hits: 3, mul: 1.36 }, passive: { kind: 'rage', v: 0.33 } },
    { id: 'succubus', name: '서큐버스', race: 'demon', job: 'bard', ultName: '매혹의 노래', role: 'support', el: 'dark', range: 'mid', cost: 2, grade: 3, hp: 1190, atk: 100, def: 75, interval: 1.4,
      ult: { kind: 'healAll', mul: 2.24 }, passive: { kind: 'lifesteal', v: 0.18 } },
    { id: 'cannon', name: '포격수', race: 'human', job: 'archer', ultName: '포격', role: 'ranged', el: 'fire', range: 'far', cost: 2, grade: 3, hp: 1050, atk: 155, def: 60, interval: 1.25,
      ult: { kind: 'aoe', mul: 1.23 }, passive: { kind: 'splash', v: 0.36 } },
    { id: 'coral', name: '산호수호자', race: 'elf', job: 'guardian', ultName: '산호 벽', role: 'tank', el: 'water', range: 'melee', cost: 3, grade: 3, hp: 2230, atk: 75, def: 160, interval: 1.6,
      ult: { kind: 'taunt', dur: 4, shieldPct: 0.31 }, passive: { kind: 'shieldStart', v: 0.18 } },
    { id: 'thunderbird', name: '천둥새', race: 'beast', job: 'mage', ultName: '낙뢰', role: 'mage', el: 'light', range: 'long', cost: 3, grade: 4, hp: 1030, atk: 170, def: 60, interval: 1.5,
      ult: { kind: 'chain', hits: 4, mul: 1.3 }, passive: { kind: 'energyStart', v: 33 } },
    { id: 'necro', name: '사령술사', race: 'demon', job: 'mage', ultName: '망자의 손', role: 'mage', el: 'dark', range: 'long', cost: 3, grade: 4, hp: 1070, atk: 175, def: 60, interval: 1.5,
      ult: { kind: 'chain', hits: 4, mul: 1.3 }, passive: { kind: 'lifesteal', v: 0.2 } },
    { id: 'moonarcher', name: '달빛궁수', race: 'elf', job: 'archer', ultName: '달빛 화살', role: 'ranged', el: 'light', range: 'mid', cost: 2, grade: 3, hp: 1010, atk: 150, def: 60, interval: 1.25,
      ult: { kind: 'snipe', mul: 3.14 }, passive: { kind: 'crit', v: 0.18 } },
    { id: 'minotaur', name: '미노타우로스', race: 'beast', job: 'guardian', ultName: '대지 강타', role: 'tank', el: 'fire', range: 'melee', cost: 3, grade: 3, hp: 2370, atk: 80, def: 170, interval: 1.6,
      ult: { kind: 'taunt', dur: 4, shieldPct: 0.31 }, passive: { kind: 'rage', v: 0.3 } },
    { id: 'dragon', name: '용기사', race: 'human', job: 'warrior', ultName: '용의 일격', role: 'warrior', el: 'fire', range: 'melee', cost: 3, grade: 4, hp: 1400, atk: 150, def: 85, interval: 1.1,
      ult: { kind: 'strike', mul: 3.66 }, passive: { kind: 'crit', v: 0.2 } },
    { id: 'archmage', name: '대마법사', race: 'human', job: 'mage', ultName: '해일', role: 'mage', el: 'water', range: 'long', cost: 3, grade: 4, hp: 1030, atk: 170, def: 60, interval: 1.5,
      ult: { kind: 'aoe', mul: 1, slow: 0.25, slowDur: 3 }, passive: { kind: 'energyStart', v: 33 } },
    { id: 'worldtree', name: '세계수정령', race: 'elf', job: 'bard', ultName: '세계수의 숨결', role: 'support', el: 'forest', range: 'mid', cost: 3, grade: 4, hp: 1300, atk: 110, def: 85, interval: 1.4,
      ult: { kind: 'healAll', mul: 2.36 }, passive: { kind: 'auraRegen', v: 0.013000000000000001 } },
    { id: 'demonlord', name: '마왕', race: 'demon', job: 'warrior', ultName: '암흑 참격', role: 'warrior', el: 'dark', range: 'melee', cost: 3, grade: 4, hp: 1430, atk: 155, def: 90, interval: 1.1,
      ult: { kind: 'backstab', mul: 3.42 }, passive: { kind: 'lifesteal', v: 0.2 } },
    { id: 'phoenix', name: '불사조', race: 'beast', job: 'mage', ultName: '불새의 날개', role: 'mage', el: 'fire', range: 'long', cost: 3, grade: 4, hp: 1050, atk: 170, def: 60, interval: 1.5,
      ult: { kind: 'aoe', mul: 1.3 }, passive: { kind: 'splash', v: 0.39 } },
    { id: 'seraph', name: '세라핌', race: 'elf', job: 'paladin', ultName: '천상의 방패', role: 'tank', el: 'light', range: 'melee', cost: 3, grade: 4, hp: 2150, atk: 85, def: 185, interval: 1.55,
      ult: { kind: 'teamShield', mul: 1.83 }, passive: { kind: 'auraAtk', v: 0.1 } },
    { id: 'kraken', name: '크라켄', race: 'demon', job: 'guardian', ultName: '심해의 손아귀', role: 'tank', el: 'water', range: 'melee', cost: 3, grade: 4, hp: 2410, atk: 80, def: 175, interval: 1.6,
      ult: { kind: 'taunt', dur: 5, shieldPct: 0.34 }, passive: { kind: 'thorns', v: 0.26 } },
    { id: 'windlord', name: '바람의군주', race: 'elf', job: 'archer', ultName: '폭풍 화살', role: 'ranged', el: 'forest', range: 'mid', cost: 3, grade: 4, hp: 1110, atk: 165, def: 65, interval: 1.25,
      ult: { kind: 'multi', hits: 3, mul: 1.36 }, passive: { kind: 'haste', v: 0.2 } }
  ],
  ranges: { melee: '근거리', mid: '중거리', long: '장거리', far: '최장거리' },
  roles: { tank: '탱커', warrior: '전사', ranged: '원거리', mage: '마법', support: '지원' },
  // 종족·직업 (외형을 보고 나눴어요). 스킬·궁극기·시너지가 이 태그를 보고 효과가 달라지게 쓸 거예요
  // 속성은 elements(불·물·숲·빛·어둠)를 그대로 써요. role(탱커·전사…)은 전투 배치용이에요
  races: { human: '인간', elf: '엘프', beast: '수인', demon: '마족' },
  jobs:  { guardian: '수호자', paladin: '성기사', warrior: '전사', archer: '사수', mage: '마법사', bard: '음유시인' },

  // ───── 캠페인 ─────
  // 스테이지 n(0부터): 적 레벨 = 1 + (지나온 스테이지마다 그 챕터의 levelStep) , 벽 스테이지는 레벨 + wallBonus
  // levelStep [1장, 2장, 3장]: 플레이어 성장(★·등급·스킬·전장 칸)이 1장 끝 무렵 거의 차기 때문에 2·3장은 적 레벨을 천천히 올려요.
  // 2·3장의 어려움은 레벨보다 적 조합·적 팀 스킬 수·벽·보스에서 나와요 (근거: 시드 40 × 6시간 봇 시뮬, 2026-11-18)
  // 적 팀: 5명 (앞 2 / 뒤 3), 영웅 목록에서 스테이지마다 다르게 골라요. 10번째(보스)는 앞 가운데에 보스(체력 × bossHp, 공격 × bossAtk)
  campaign: {
    chapters: 3, perChapter: 10, bossAt: [5, 10], // bossAt: 장마다 보스 판 번호 (2026-11-18: 5와 10)
    levelStep: [1.0, 0.3, 0.12], wallBonus: 2, walls: [9, 14, 19, 26, 29],  // 1-10, 2-5, 2-10, 3-7, 3-10
    bossHp: 1.8, bossAtk: 1.15, // 스킬 등급업을 넣은 뒤(2026-11-18) 다시 맞춘 값
    enemyMul: 1.0,            // 적 전체 능력치 배율
    earlyMul: 0.4, earlyRamp: 0.03, // 체력 시스템(2026-11-18) 뒤 1장 목표로 다시 맞춘 값 (예전 0.55 / 0.04)  // 초반 적 배율: earlyMul에서 시작해 스테이지마다 earlyRamp씩 올라 1이 돼요
    reward: { base: 120, growth: 1.15 },   // 스테이지를 깨면 골드 = base × growth^n. 상점가 성장(shop.priceGrowth 1.12)보다 조금만 빠르게 (1.22였을 땐 끝에 골드가 쓴 양의 수십 배 남았어요)
    loseStepBack: 1,          // 지면 이만큼 앞 스테이지로 돌아가요 (0이면 그대로). 코스트 상한은 가장 멀리 간 기록 기준이라 줄지 않아요
    // 적 팀 스킬: from 스테이지부터 count개 (팀 스킬 목록에서 스테이지마다 정해져요). 레벨 = 1 + floor(스테이지 / levelEvery). 보스 스테이지는 +bossExtra개
    enemySkills: { table: [{ from: 4, count: 1 }, { from: 12, count: 2 }, { from: 22, count: 3 }], levelEvery: 10, bossExtra: 0 }, // 보스 판에 스킬을 더 주면 3-10이 거의 못 깨는 벽이 돼서 0
    idle: { enabled: false, base: 8, growth: 1.2, maxHours: 8 } // 방치 보상 (꺼짐: 방치형 게임이 아니에요). 골드는 스테이지 보상과 전리품으로만 들어와요
  },

  // 영웅 레벨업 가격 = base × growth^(레벨 − 1)
  // enabled: false → 골드로 레벨업하지 않아요 (레벨은 다른 방식으로 풀 예정). 골드는 상점 전용
  levelCost: { enabled: false, base: 60, growth: 1.17, maxLevel: 60 },

  // ───── 팀 스킬 (상점에서 사요). 팀 전체에 적용되고, 스킬마다 자기 쿨타임(cd초)이 돌면 자동 발동 ─────
  // 레벨 효과: 수치 × (1 + perLevel × (레벨 − 1)). 같은 스킬을 또 사면 레벨 +1
  skills: {
    // 스킬은 레벨 없이 등급만 있어요. 태생 등급(list[].grade)에서 시작하고, 같은 스킬을 또 사면(전리품 두루마리로 또 받아도) 등급이 1 올라요. 최고 maxGrade(전설)
    // 효과 = 수치 × (1 + perGrade × 오른 등급 수). 첫 발동은 쿨타임의 firstAt배 시점
    // triggerOn: 연계 스킬(trigger)을 상점·적·전리품·상인에 내놓을지. 화면이 연계 스킬(쿨타임 0, 쌓임 수)을 보여 주게 되면 UI 세션이 true로 켜요
    triggerOn: true, // 2026-11-18 UI 세션: 화면 준비가 끝나서 켰어요
    slots: 10, gradeUp: true, maxGrade: 4, perGrade: 0.2, firstAt: 0.5,
    // 스킬 등급 1~4: 일반·고급·희귀·전설. 아이콘 테두리 색으로 구분하고, 전설은 테두리에 빛이 돌아요
    grades: { 1: { name: '일반', color: '#d9dde8' }, 2: { name: '고급', color: '#5fcf6a' }, 3: { name: '희귀', color: '#4fa3ff' }, 4: { name: '전설', color: '#ffb02e' } },
    list: [
      { id: 'rally',   grade: 2, name: '응원가',   icon: '📯', cd: 9,  price: 150, kind: 'atkBuff', amount: 0.25, dur: 4,  desc: '{d}초 동안 아군 공격력이 {a}% 오른다.' },
      { id: 'mend',    grade: 3, name: '치유의 비', icon: '🌧️', cd: 10, price: 160, kind: 'healPct', amount: 0.10,          desc: '아군 체력을 {a}% 회복한다.' },
      { id: 'ward',    grade: 2, name: '수호막',   icon: '🛡️', cd: 12, price: 170, kind: 'shieldPct', amount: 0.12,        desc: '아군에게 최대 체력의 {a}%만큼 보호막을 씌운다.' },
      { id: 'meteor',  grade: 4, name: '유성',     icon: '☄️', cd: 11, price: 200, kind: 'nuke', amount: 0.8,             desc: '적 전체에게 아군 평균 공격력의 {a}%만큼 피해를 준다.' },
      { id: 'frost',   grade: 1, name: '서리 바람', icon: '🌬️', cd: 12, price: 140, kind: 'slowAll', amount: 0.3, dur: 3,  desc: '{d}초 동안 적 전체가 {a}% 느려진다.' },
      { id: 'drums',   grade: 3, name: '전투 북',  icon: '🥁', cd: 11, price: 150, kind: 'hasteAll', amount: 0.25, dur: 4, desc: '{d}초 동안 아군 공격 속도가 {a}% 빨라진다.' },
      { id: 'snipe',   grade: 1, name: '정조준',   icon: '🎯', cd: 7,  price: 130, kind: 'execute', amount: 1.6,          desc: '체력이 가장 낮은 적에게 아군 최고 공격력의 {a}%만큼 피해를 준다.' },
      { id: 'charge',  grade: 4, name: '기운 충전', icon: '⚡', cd: 13, price: 180, kind: 'energyAll', amount: 30,         desc: '아군 궁극기 에너지를 {a} 채운다.' },
      { id: 'gust',    grade: 2, name: '돌풍',     icon: '🌪️', cd: 9,  price: 160, kind: 'knockback', amount: 70, dur: 0.8, desc: '적 전체를 뒤로 밀어내고 {d}초 동안 멈추게 한다.' },
      // ── 시너지 스킬: tag = 종족(race)·직업(job)·속성(el) 조건 ──
      // only: true → 조건에 맞는 아군에게만 효과. per: 조건에 맞는 살아 있는 아군 1명마다 효과 +per배 (0명이면 기본값만)
      { id: 'howl',    grade: 2, name: '야성의 포효', icon: '🐾', cd: 9,  price: 150, kind: 'atkBuff', amount: 0.4, dur: 4, tag: { race: 'beast' }, only: true, desc: '{d}초 동안 수인 아군의 공격력이 {a}% 오른다.' },
      { id: 'grove',   grade: 2, name: '숲의 축복', icon: '🍃', cd: 10, price: 160, kind: 'healPct', amount: 0.05, tag: { race: 'elf' }, per: 0.5, desc: '아군 체력을 {a}% 회복한다. 엘프 1명마다 효과가 50% 커진다.' },
      { id: 'pact',    grade: 3, name: '피의 계약', icon: '🩸', cd: 11, price: 180, kind: 'nuke', amount: 0.35, tag: { race: 'demon' }, per: 0.5, desc: '적 전체에게 아군 평균 공격력의 {a}%만큼 피해를 준다. 마족 1명마다 효과가 50% 커진다.' },
      { id: 'unity',   grade: 1, name: '인간의 단결', icon: '🤝', cd: 12, price: 140, kind: 'shieldPct', amount: 0.05, tag: { race: 'human' }, per: 0.25, desc: '아군에게 최대 체력의 {a}%만큼 보호막을 씌운다. 인간 1명마다 효과가 25% 커진다.' },
      { id: 'bulwark', grade: 2, name: '방패벽', icon: '🧱', cd: 10, price: 160, kind: 'shieldPct', amount: 0.3, tag: { job: ['guardian', 'paladin'] }, only: true, desc: '수호자·성기사 아군에게 최대 체력의 {a}%만큼 보호막을 씌운다.' },
      { id: 'volley',  grade: 3, name: '일제 사격', icon: '🏹', cd: 8,  price: 180, kind: 'volley', amount: 1.5, tag: { job: 'archer' }, only: true, desc: '사수 아군이 각자 무작위 적에게 공격력의 {a}%만큼 피해를 준다.' },
      { id: 'arcane',  grade: 3, name: '마력 공명', icon: '🔮', cd: 10, price: 170, kind: 'energyAll', amount: 40, tag: { job: 'mage' }, only: true, desc: '마법사 아군의 궁극기 에너지를 {a} 채운다.' },
      { id: 'chorus',  grade: 4, name: '합주',   icon: '🎶', cd: 12, price: 200, kind: 'hasteAll', amount: 0.15, dur: 5, tag: { job: 'bard' }, per: 0.6, desc: '{d}초 동안 아군 공격 속도가 {a}% 빨라진다. 음유시인 1명마다 효과가 60% 커진다.' },
      { id: 'resonance', grade: 4, name: '원소 공명', icon: '🌈', cd: 11, price: 200, kind: 'atkBuff', amount: 0.06, dur: 5, tag: { el: '*' }, per: 1, desc: '{d}초 동안 아군 공격력이 {a}% 오른다. 가장 많은 같은 속성 1명마다 {a}%씩 더 오른다.' },
      // 연계 스킬(trigger, 2026-11-18): 쿨타임 없이 전투 내내 켜져 있어요. 조건(tag)에 맞는 아군에게 그 일이 생길 때마다 공격력이 amount씩 쌓여요(최대 max번)
      //   조건이 좁을수록(특정 종족·속성) 한 번에 오르는 양이 커요. to: 'self'면 일으킨 영웅만, 아니면 조건 맞는 아군 모두
      { id: 'fervor',  grade: 1, name: '전장의 열기', icon: '🔥', cd: 0, price: 120, kind: 'stack', trigger: 'attack', amount: 0.005, max: 30, desc: '아군이 평타를 칠 때마다 아군 공격력이 {a}% 오른다. 최대 {m}번 쌓인다.' },
      { id: 'resolve', grade: 2, name: '인간의 기세', icon: '⚔️', cd: 0, price: 150, kind: 'stack', trigger: 'attack', tag: { race: 'human' }, amount: 0.02, max: 15, desc: '[인간] 인간 아군이 평타를 칠 때마다 인간 아군 공격력이 {a}% 오른다. 최대 {m}번 쌓인다.' },
      { id: 'kindle',  grade: 3, name: '불씨', icon: '🕯️', cd: 0, price: 0, kind: 'stack', trigger: 'burn', tag: { el: 'fire' }, amount: 0.02, max: 20, desc: '[불] 화상 피해가 들어갈 때마다 불 아군 공격력이 {a}% 오른다. 최대 {m}번 쌓인다.' },
      { id: 'pulse',   grade: 3, name: '숲의 맥박', icon: '🌿', cd: 0, price: 0, kind: 'stack', trigger: 'haste', tag: { el: 'forest' }, to: 'self', amount: 0.03, max: 12, desc: '[숲] 숲 아군이 가속을 얻을 때마다 그 아군 공격력이 {a}% 오른다. 최대 {m}번 쌓인다.' },
      { id: 'rime',    grade: 3, name: '서리 손아귀', icon: '🧊', cd: 0, price: 0, kind: 'stack', trigger: 'chill', tag: { el: 'water' }, amount: 0.02, max: 15, desc: '[얼음] 얼음으로 적을 느리게 할 때마다 얼음 아군 공격력이 {a}% 오른다. 최대 {m}번 쌓인다.' },
      { id: 'grace',   grade: 3, name: '빛의 축복', icon: '✨', cd: 0, price: 0, kind: 'stack', trigger: 'heal', tag: { el: 'light' }, amount: 0.02, max: 15, desc: '[빛] 빛 아군이 회복할 때마다 빛 아군 공격력이 {a}% 오른다. 최대 {m}번 쌓인다.' },
      { id: 'dread',   grade: 4, name: '암흑의 공포', icon: '🌑', cd: 0, price: 0, kind: 'stack', trigger: 'stun', tag: { el: 'dark' }, amount: 0.06, max: 10, desc: '[어둠] 적을 기절시킬 때마다 어둠 아군 공격력이 {a}% 오른다. 최대 {m}번 쌓인다.' }
    ]
  },
  // 상점: 전투가 끝날 때마다 무작위 stock개가 새로 들어와요. 가격 = price × priceGrowth^(깬 스테이지 수)
  // 새로고침 비용 = refresh × refreshGrowth^(이번 판 새로고침 횟수), 전투가 끝나면 횟수 초기화
  // 스킬 판매가 = 지금 상점가 × 레벨 × sellRate (오래되거나 등급이 낮은 스킬을 팔아 자리를 비워요)
  // ───── 플레이어 체력 ─────
  // 지면 살아남은 적들이 왼쪽으로 걸어 나가며 체력을 깎아요. 적 1명마다 base + perGrade × (등급 − 1) (일반 1 · 고급 2 · 희귀 3 · 전설 4), 보스는 + bossExtra
  // 체력이 남아 있으면 같은 판에 다시 도전해요. 0이 되면 패배: 판 전체가 1-1부터 다시 시작해요(영웅·스킬·골드·마나스톤·레벨 모두 처음으로)
  // recoverOnBoss: 장 보스(10번째 판)를 깨면 체력이 다 차요
  // consolation 위로금: 진 판에서도 쓰러뜨린 적 1명마다 클리어 골드 × perKill. 연패할수록 × (1 + streakBonus × (연패 − 1)), streakMax연패까지
  life: { enabled: true, max: 10, base: 1, perGrade: 1, bossExtra: 0, recoverOnBoss: true, consolation: { perKill: 0.1, streakBonus: 0.5, streakMax: 3 },
    // lossLoot: 진 판에도 전리품 룰렛이 떠요. 돌리려면 골드 = 그 판 클리어 골드 × price. 후보는 적 영웅·적 스킬·마나스톤(골드 주머니는 빠져요). 안 돌리고 넘어가도 돼요
    lossLoot: { enabled: true, price: 0.5 } },

  // ───── 마나스톤 (두 번째 재화) ─────
  // 전리품 룰렛에 가끔(loot.chance) 마나스톤 칸이 1개 끼어요(amount개). 상점에서 높은 등급 스킬을 살 때 들어요(skillCost: 사고 난 뒤의 스킬 등급 → 개수).
  // exclusive: true면 상점 물건마다 재화가 하나예요. skillCost에 있는 등급(희귀·전설)은 마나스톤만, 그 아래(일반·고급)는 골드만 받아요
  // 방랑상인 진열은 골드만 받아요(더 비싸게 파는 대신 마나스톤이 없어도 살 수 있는 길).
  // enabled: false면 전리품에 안 나오고 상점도 골드만 받아요 (화면이 마나스톤을 다룰 준비가 되면 켜요)
  mana: { enabled: true, exclusive: true, name: '마나스톤', loot: { chance: 0.15, amount: 1 }, skillCost: { 3: 1, 4: 2 } },

  // rows: 두 줄 진열 (마나스톤 exclusive일 때). 윗줄 골드로 사는 물건 gold개, 아랫줄 마나스톤으로 사는 물건 mana개. 없으면 stock개 한 줄
  shop: { rows: { gold: 3, mana: 3 }, stock: 3, priceGrowth: 1.12, refresh: 40, refreshGrowth: 1.6, sellRate: 0.5 },

  startLevel: 1,
  // ───── 위험 종 ─────
  // 전투 전에 종을 울려(0~max번) 판을 키워요. 한 번 울릴 때마다 적 enemy명 추가, 그 자리에서 바로 골드 = 클리어 보상 × instant 획득.
  // 지면 종으로 받은 골드는 도로 빠져요 (그래야 일부러 지면서 골드를 모을 수 없어요). gold·lootGold는 0이면 꺼짐
  // 늘어난 적도 전리품 후보에 들어가요. 적은 세지지 않아요. 종은 어느 판이든 max번까지 울릴 수 있고, 적은 5명을 넘어 최대 5+max명까지 늘어요
  // skill: 종 1번마다 적 스킬 +N개(2026-11-18). 있던 스킬은 그대로 두고 뒤에 붙어요(최대 skills.slots)
  bell: { max: 3, enemy: 1, skill: 1, instant: 0.6, gold: 0, lootGold: 0 },

  // ───── 특수 몹 이벤트 ─────
  // from 스테이지부터, 보스가 아닌 판에 chance 확률로 이벤트 1개 (weights 비율로 고름). 전투 전 편성 화면에서 미리 보여요
  // goblin 돈고블린: 싸우지 않고 도망쳐요. flee초 안에 잡으면 클리어 골드 × goldMul 추가, 놓치면 사라져요 (경험치도 없음)
  // merchant 방랑상인: 전투에는 안 나와요. 이기면 특별 상점이 열려요 (희귀 이상 스킬 skills개 + 영웅 heroes명, 비싸게)
  // merc 떠돌이 용병: 적으로 함께 싸워요. 이기면 골드를 내고 바로 영입할 수 있어요 (값 = price × 코스트 × priceGrowth^스테이지)
  events: {
    // campfire 모닥불: 영웅 count명이 모닥불에 둘러앉아 있어요. 종 버튼 대신 말풍선 버튼을 누르면 룰렛이 돌아 1명을 얻어요. 그 판은 전투 없이 넘어가요(골드·경험치 없음)
    //   atStart: true면 게임(그리고 체력 0 뒤 새 판)을 이 모닥불로 시작해요. 시작 영웅이 매번 달라져요(recruit.startHero는 꺼졌을 때만 써요)
    //   이벤트 스테이지(2026-11-18 바뀜): 모닥불·방랑상인·보물상자는 스테이지 수를 쓰지 않아요. 스테이지를 깨고 다음으로 올라갈 때 n과 n+1 사이(1-1.5처럼)에 들러요
    //   시작 모닥불은 1-0.5이고 첫 전투는 1-1이에요. 들른 뒤에는 그 다음 스테이지 전투로 가요(다시 도전할 때는 안 나와요). 목록 = stageKinds
    stageKinds: ['campfire', 'merchant', 'chest', 'altar'],
    off: [], // 도구: 여기 적은 이벤트 종류는 안 나와요(예: ['chest']). campfire를 끄면 시작 모닥불도 없어요 (2026-11-18)
    forceEvery: 0, // 도구: N이면 스테이지 N개마다 이벤트 스테이지가 100% 나와요(2면 1-2.5, 1-4.5…). 0이면 꺼짐(평소 확률 chance)
    from: 2, chance: 0.18, weights: { goblin: 4, merchant: 3, merc: 3, campfire: 2, chest: 3, altar: 3 }, // chest: 화면 작업이 끝나서 3으로 켰어요 (2026-11-18 UI 세션) // campfire: 화면 작업이 끝나서 2로 켰어요 (2026-11-18 UI 세션)
    campfire: { count: 3, atStart: true },
    // altar 초월 제단(2026-11-18 새로): 전투 없는 이벤트 스테이지(n.5). 여기서만 초월할 수 있어요(transcend.at). 횟수 제한 없이 하고 나가면 다음 스테이지로 가요
    altar: {},
    goblin:   { goldMul: 2.5, flee: 10, speed: 90 },
    // merchant 방랑상인(2026-11-18 바뀜): 전투 없는 이벤트 스테이지예요(n.5). 들르면 특별 상점만 열리고, 나가면 다음 스테이지로 가요
    //   battle: false = 전투 없음. 진열 = 희귀 이상 스킬 skills개 + 영웅 heroes명. 값은 원래 값(스킬은 상점 값·재화 그대로, 영웅은 heroPrice 식) × discount, 최소 minPrice
    merchant: { battle: false, skills: 2, minGrade: 3, discount: 0.5, minPrice: 1, heroes: 1, heroPrice: 110 },
    // chest 보물상자(2026-11-18 새로): 그 판에는 보물상자 1마리만 나와요. 공격도 이동도 안 하고 단단하기만 해요. dur초가 지나면 사라져요
    //   입힌 피해 비율(최대 체력 대비)이 tiers의 at을 넘을 때마다 그 칸 보상을 더해 받아요(누적). gold는 그 스테이지 클리어 보상 × 값, mana는 마나스톤 개수, scroll은 스킬 두루마리 개수
    //   지는 일이 없어요(체력도 안 닳아요). 판 클리어 골드·경험치는 없고 칸 보상만 받아요
    //   종: 울릴 때마다 상자가 업그레이드돼요. 체력 ×(1 + bell.hp × 횟수), 보상 ×(1 + bell.reward × 횟수)(마나·두루마리는 내림, 최소 원래 개수). 이 판에서는 종 즉시 골드가 없어요
    chest: { dur: 15, // 체력·방어는 mobs의 chest 값 (스테이지 레벨·초반 배율을 똑같이 받아요)
      tiers: [ { at: 0.25, gold: 0.5 }, { at: 0.5, gold: 0.5, mana: 1 }, { at: 0.75, gold: 0.5, scroll: 1 }, { at: 1, gold: 1, mana: 1 } ],
      bell: { hp: 0.5, reward: 0.7 } },
    merc:     { price: 90, costPlus: 1 } // 용병 코스트는 그 스테이지 적 최고 코스트 + costPlus까지
  },
  // 특수 몹 (영웅 목록과 따로). 능력치는 스테이지 레벨·배율을 똑같이 받아요
  mobs: [
    { id: 'goblin', name: '돈고블린', mob: 'goblin', race: 'beast', job: null, el: 'dark', range: 'melee', role: 'warrior', cost: 0, art: false,
      hp: 1100, atk: 0, def: 40, interval: 1, ultName: '', ult: null, passive: null },
    // 보물상자: 공격·이동 안 함 (events.chest)
    { id: 'chest', name: '보물상자', mob: 'chest', race: 'beast', job: null, el: 'earth', range: 'melee', role: 'warrior', cost: 0, art: false,
      hp: 10000, atk: 0, def: 60, interval: 99, ultName: '', ult: null, passive: null }
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
    skillSlots: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10], // 레벨 제한 없음: 처음부터 10칸
    // heroGrade: 적·용병·상인으로 나오는 영웅 등급 확률 가중치 [일반, 고급, 희귀, 전설] (레벨 1~10)
    heroGrade:  [[85, 15, 0, 0], [70, 25, 5, 0], [58, 30, 11, 1], [48, 32, 17, 3], [40, 32, 23, 5],
                 [32, 32, 28, 8], [26, 30, 33, 11], [20, 28, 37, 15], [15, 26, 40, 19], [10, 24, 42, 24]],
    shopGrade:  [[70, 25, 5, 0], [65, 28, 7, 0], [55, 30, 13, 2], [50, 32, 15, 3], [42, 33, 19, 6],
                 [36, 34, 22, 8], [30, 34, 25, 11], [25, 33, 28, 14], [20, 32, 30, 18], [15, 30, 33, 22]]
  },
  // 등급 테두리 색: 코스트 1·2·3 (캐릭터 그림 외곽선)
  // 영웅 등급: 영웅마다 정해진 희귀도(heroes[].grade 1~5). 캐릭터 외곽선 색으로 보여요. 합성으로는 안 바뀌어요(합성은 성급 ★)
  // 어떤 등급의 영웅이 적·용병·상인으로 나올지는 플레이어 레벨에 따른 확률(player.heroGrade)로 정해져요
  heroGrades: { 1: { name: '일반', color: '#d9dde8' }, 2: { name: '고급', color: '#5fcf6a' }, 3: { name: '희귀', color: '#4fa3ff' }, 4: { name: '전설', color: '#ffb02e' } },
  gradeColor: { 1: '#d9dde8', 2: '#5fcf6a', 3: '#4fa3ff', 4: '#ffb02e' }, // 등급 → 외곽선 색 (heroGrades와 같음, 스킬 등급 색과도 같아요)
  // 영웅 효과 2개(궁극기·패시브)의 기본 레벨: 등급이 높을수록 효과가 더 붙고(일반은 패시브 없음) 기본 레벨이 높아요.
  // 성급(★)은 능력치만 올려요. 효과 레벨: 궁극기 수치 × (1 + ultPer × (레벨 − 1)), 패시브 수치 × (1 + pasPer × (레벨 − 1)), 최대 maxLv
  // 2026-11-18: 영웅 스킬은 모두 1개(궁극기)예요. 스킬2(패시브)는 꺼졌어요(pas 0). 희귀·전설은 스킬1이 2레벨로 시작해요
  gradeEffects: { 1: { ult: 1, pas: 0 }, 2: { ult: 1, pas: 0 }, 3: { ult: 2, pas: 0 }, 4: { ult: 2, pas: 0 }, ultPer: 0.3, pasPer: 0.6, maxLv: 2 },
  // 초월: 영웅(기존)에 재료 영웅(아무 영웅이나)을 넣으면 재료는 사라지고, 재료 영웅의 스킬(궁극기)이 기존 영웅에 추가 스킬로 붙어요
  //   이미 가진 스킬이면(재료가 같은 영웅이거나 전에 넣은 영웅과 같으면) 그 스킬 레벨 +1 (승급). 레벨당 위력 +ultPer(30%), 최대 maxLv
  //   스킬 칸: 기본 스킬 포함 최대 maxSkills개. 꽉 차면 새 스킬은 못 넣고 가진 스킬의 승급만 돼요
  //   추가 스킬은 기본 스킬과 함께 발동해요(궁극기 에너지가 차면 기본 → 추가 순서로 모두 써요). 성급·레벨은 그대로, 합성하면 초월 스킬도 합쳐져요(같은 스킬은 높은 레벨)
  // at: 이 이벤트 스테이지에서만 초월돼요(2026-11-18). 비우면 아무 때나
  transcend: { enabled: true, maxSkills: 2, maxLv: 5, at: 'altar' }, // maxSkills 2(2026-11-18): 기본 + 추가 1개. 같은 스킬 승급은 계속 돼요
  // 패시브 종류. {v}는 그 레벨의 수치(%는 100을 곱해 보여요)
  passives: {
    thorns:      { name: '가시',     desc: '근접 공격을 받으면 받은 피해의 {v}%를 되돌려 준다.' },
    shieldStart: { name: '선봉 방패', desc: '전투가 시작되면 최대 체력의 {v}%만큼 보호막을 얻는다.' },
    crit:        { name: '치명타',   desc: '평타와 궁극기가 {v}% 확률로 2배 피해를 준다.' },
    rage:        { name: '분노',     desc: '체력이 50% 아래로 떨어지면 공격력이 {v}% 오른다.' },
    splash:      { name: '광역',     desc: '평타가 주변 적에게도 {v}%만큼 피해를 준다.' },
    energyStart: { name: '선제',     desc: '전투가 시작되면 궁극기 에너지를 {n} 채운다.' },
    auraRegen:   { name: '치유의 기운', desc: '아군 전체가 1초마다 최대 체력의 {v}%를 회복한다.' },
    auraAtk:     { name: '고무',     desc: '아군 전체의 공격력이 {v}% 오른다.' },
    lifesteal:   { name: '흡혈',     desc: '준 피해의 {v}%만큼 체력을 회복한다.' },
    haste:       { name: '신속',     desc: '공격 속도가 {v}% 빨라진다.' }
  },

  // ───── 영입·코스트·백팩·합성 ─────
  recruit: {
    startHero: 'bear',          // 처음 가진 영웅 1명
    // pool: 프로토타입용 등장 영웅(2026-11-18, 등급마다 6명 = 24명). 종족 6명씩, 속성 4~5명씩, 직업·역할도 섞고 등급마다 앞줄 2명 이상
    //   적·모닥불·용병·상인·전리품이 이 안에서만 나와요. 빈 배열이면 65명 전부 나와요
    pool: ['bear', 'batling', 'rain', 'piper', 'frog', 'squire',
           'dancer', 'knight', 'bat', 'song', 'owl', 'horn',
           'thorn', 'monk', 'succubus', 'frost', 'cannon', 'shaman',
           'tiger', 'kraken', 'windlord', 'valkyrie', 'necro', 'phoenix'],
    // 출전 코스트 상한 = start + floor(깬 스테이지 수 / every), 최대 max
    costCap: { enabled: false, start: 3, every: 3, max: 10 }, // 꺼짐: 출전 제한은 플레이어 레벨의 전장 칸 수(player.field)만 써요. 영웅 cost(1~3)는 등급(외곽선 색)·적 등장 시기·가격용으로 남아요
    fieldSlots: 5,               // 전장 칸
    bag: 5,                      // 백팩 칸 (전장에 안 올린 영웅)
    // 합성: 같은 영웅·같은 성급 2명을 겹쳐 놓으면 1명이 되고 성급 +1 (★1 → ★2 → ★3, 최대 maxStar).
    // 같은 영웅도 여러 명을 각각 전장에 올릴 수 있어요. 합성은 겹쳐 놓을 때만 일어나요
    // auto: true면 같은 영웅·같은 성급을 얻는 순간 바로 합쳐요(겹쳐 놓을 필요 없음). 이미 있던 쪽(전장이면 전장 자리)에 남고, ★2끼리 생기면 이어서 ★3까지 합쳐요
    merge: { maxStar: 3, mul: [1, 1.8, 3.2], auto: true },   // 성급별 체력·공격 배율
    mergeCount: 2, maxStar: 3, starMul: [1, 1.8, 3.2], // (예전 이름, 호환용: merge와 같은 값)
    // 스테이지 n(0부터)의 적 수: 배열 끝을 넘으면 마지막 값
    enemyCount: [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5], // 체력 시스템 뒤 1장을 완만하게 (예전 [1, 1, 2, 2, 3, 3, 4, 4, 5])
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
