// 방치형 RPG 전투 테스트베드 테이블. 숫자는 모두 임시값이에요. 여기만 고치면 전투·캠페인이 바뀌어요.
// 근거 문서: ../방치형RPG_전투테스트베드_기획.md
var IDLE_DATA = {
  // ───── 전투 기본 규칙 ─────
  battle: {
    dt: 0.1,            // 0.1초 단위로 진행
    timeLimit: 90,      // 넘기면 패배
    enrage: { at: 40, perSec: 0.15, dusk: 30 }, // dusk: 이 초부터 at까지 해 질 녘으로 서서히 물들어요(화면만, 2026-11-25). 광폭화(밤의 분노): at초가 지나면 모든 평타·궁극기 피해가 초마다 +perSec배씩 커져요 (탱커끼리 시간 초과로 비기는 판을 막아요)
    defK: 300,          // 피해 감소 = 방어 / (방어 + defK)
    energyMax: 100,
    startJitter: 0.4,
    crowd: { pen: 40, stuck: 0.8, tauntWait: 1.5 }, jobTarget: { archer: 'far', assassin: 'lowHp' }, jobPassive: { guardian: { hitEnergy: 2 }, bard: { ultEnergy: 15 }, warrior: { allyDeathAtk: 0.1 }, mage: { attackEnergy: 10 } } /* 2026-11-26 직업 효과(사용자): 기사 = 맞으면 차는 궁극기 에너지 ×hitEnergy, 서포터 = 궁극기를 쓰면 다른 아군 에너지 +ultEnergy, 전사 = 아군(몹 제외)이 쓰러질 때마다 공격력 +allyDeathAtk(그 전투 동안 쌓임), 마법사 = 평타 때 궁극기 에너지 +attackEnergy 더(기본 평타 20). 값은 기획이 정한 처음 값 */ /* 2026-11-26: 직업별 공격 대상(사용자: "궁수는 먼거리적부터", "암살자=체력이낮은적. 까지."). far = 가장 먼 적, lowHp = 남은 체력(보호막 포함)이 가장 낮은 적. 도발·은신·돈고블린이 먼저. 끄려면 jobTarget 줄 삭제 */, // 2026-11-26: 근접이 대상을 고를 때 그 적에 이미 붙어 때리는 아군 1명마다 거리 +pen(px)처럼 쳐요. 대상 쪽으로 가는데 stuck초 동안 가까워지지 않으면 다른 적으로 바꿔요(아군 사이를 비집고 밀기만 하던 것). 도발한 적에게 막혔을 때는 tauntWait초 동안 사거리 안의 다른 적을 쳐요   // 첫 평타까지 0~이 값(초) 사이로 흩어져요 (모두 동시에 치지 않게)
    // 전장과 이동: 유닛이 상대에게 걸어가서 사거리 안에 들어와야 때려요 (단위: 전장 픽셀, 초)
    arena: {
      w: 720, h: 320, yMin: 142, yMax: 226, // yMin 162 → 146 (2026-11-22): 배치 칸 맨 윗줄(y148)도 땅 안  // yMax 262 → 226 (2026-11-18): 전장 아래쪽 띠는 백팩·상점 버튼 자리라 유닛이 내려오지 않아요 // 아래쪽 약 40%가 땅: 유닛은 이 띠 안에서만 상하좌우로 움직여요 (위쪽은 하늘)
      // 2026-11-23: 9칸 >>> 모양 (예전 11칸에서 맨 앞 위·아래 2칸을 빼고 앞으로 38 당김). 열마다 가운데 1칸이 앞, 위·아래 2칸이 뒤
      pos: [[290, 184], [252, 224], [252, 144], [214, 184], [176, 224], [176, 144], [138, 184], [100, 224], [100, 144]],
      lines: [0, 0, 0, 1, 1, 1, 2, 2, 2], // 칸마다 열: 0 전방열 · 1 중반열 · 2 후반열 (전투 시작 때 선 칸으로 정해져요)
      frontCells: [0, 1, 2], midCells: [3, 4, 5], backCells: [6, 7, 8], // 적 배치(2026-11-23 9칸): 사거리 1~2칸(melee·mid)은 전방열부터, 3~4칸(long·far)은 후반열부터, 넘치면 중반열 → 반대쪽 열 (pos 번호) // 2026-11-22: 화면 육각 9칸과 같은 좌표(앞줄부터, 적은 720−x)  // 왼쪽 팀 자리 0~4: 땅 가운데 거의 한 줄. 오른쪽 팀은 좌우를 뒤집어요. 5~7: 종으로 늘어난 적이 서는 자리
      // 사거리 4단계: 근거리·중거리·장거리·최장거리 (영웅 range 값). 근거리는 상대와 붙지 않게 조금 띄워요
      reach: { melee: 52, mid: 100, long: 150, far: 210 },   // 공격 사거리
      speed: { melee: 70, mid: 62, long: 55, far: 50 },      // 이동 속도 (초당)
      spacing: 62, spacingFoe: 46          // 같은 편끼리 이 거리보다 가까우면 서로 밀어내요 / 상대 편끼리는 spacingFoe (근접 사거리 40보다 작아야 붙어서 때려요)
    }
  },

  // 레벨 성장: 능력치 × (1 + perLevel × (레벨 − 1))
  growth: { perLevel: 0.25 }, // 2026-11-22: 레벨 1당 체력·공격 +25% (영웅 레벨 = 플레이어 레벨 + heroLvPlus, 적은 campaign.enemyLv)
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
      both:       { name: '평타 + 피격', onAttack: 20, onHitScale: 50, perSec: 3 }, // 2026-11-22: 초마다 3씩도 차요(발동 타입 영웅 포함, 시작 발동 제외)
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
  // 2026-11-23 직업 기준표: 등급1 기준 탱커 체력2000·방어160·초당평타45 / 전사 1250·80·110 / 궁수 800·50·140 / 마법사 800·50·90 / 서포터 1100·70·60, 등급 배율 1·1.12·1.25·1.4, 영웅마다 ±15% 안 (예전 값 data.v130.js)
  // hp/atk/def: 1레벨 능력치, interval: 평타 간격(초), range: melee(근) | mid(중) | long(장) | far(최장)
  // ult: 궁극기 종류와 수치, ultName: 궁극기 이름(아이콘은 img/p/ult_<id>.png)
  // passive: 패시브 { kind, v } (종류는 passives 표). 영웅 효과는 궁극기·패시브 2개이고, 각각 레벨이 있어요 (gradeEffects)
  // 2026-11-22: 프로토 24명 체력·공격을 등급 계단(역할 안 1 / 1.12 / 1.25 / 1.4)에 맞춰 조정. 피리소년·크라켄은 그대로
  // name·alias·sex(2026-11-25): name = 캐릭터 이름(사람 이름처럼), alias = 별칭(하는 일이 보이는 옛 이름, 상세 창에서만 작게), sex = f/m. 65명 전부(2026-11-25)
  heroes: [
    // shot(2026-11-25): 원거리 평타 투사체 그림 종류. arrow 화살 · stone 돌(포격수는 크게) · fire 불덩이 · ice 얼음 · bolt 번개 · orb 마법 구슬(진영 색) · note 음표. 없으면 진영 색 동그라미
    { id: 'bear',   name: '록시', alias: '바위곰', sex: 'f', race: 'beast', job: 'guardian', ultName: '바위 포효',   role: 'tank',    el: 'forest', range: 'melee', cost: 1, grade: 1,  hp: 1700, atk: 61, def: 160, interval: 1.6,
      ult: { trig: { kind: 'struck', n: 10 }, kind: 'taunt', dur: 4, shieldPct: 0.05, win: { kind: 'attackShield', v: 0.05, dur: 1, t: 4 }, desc: '10번 맞을 때마다 4초 동안 도발하고, 그동안 평타를 칠 때마다 최대 체력 5% 보호막을 얻는다.' }, passive: { kind: 'attackShield', v: 0.05, dur: 1 } },
    { id: 'knight', name: '안셀름', alias: '철갑기사', sex: 'm', race: 'human', job: 'guardian', ultName: '수호의 방패', role: 'tank',    el: 'light',  range: 'melee', cost: 2, grade: 2,  hp: 2060, atk: 75, def: 180, interval: 1.6,
      ult: { kind: 'teamShield', mul: 1.6, win: { kind: 'shieldGuard', v: 0.2, t: 5 }, desc: '아군 전체에게 보호막을 씌우고, 5초 동안 보호막이 있는 아군이 받는 피해가 20% 줄어든다.' }, passive: { kind: 'shieldGuard', v: 0.2 } },
    { id: 'blades', name: '블레이크', alias: '쌍검', sex: 'm', race: 'human', job: 'warrior', ultName: '화염 일섬',     role: 'warrior', el: 'fire',   range: 'melee', cost: 2, grade: 2,  hp: 1400, atk: 150, def: 90,  interval: 1.2,
      ult: { kind: 'strike', mul: 1.75, hits: 2, boost: 0.5, boostN: 3, desc: '공격력 175% 피해를 2번 주고, 다음 평타 3번의 피해가 50% 커진다.' } /* 2026-11-26: 350%×1 → 175%×2 (합 같음, 연타 연출) */, passive: { kind: 'secondHit', v: 0.6 } },
    { id: 'wolf',   name: '팽', alias: '늑대발톱', sex: 'm', race: 'beast', job: 'warrior', ultName: '연속 할퀴기', role: 'warrior', el: 'forest', range: 'melee', cost: 1, grade: 1,  hp: 1300, atk: 113, def: 80,  interval: 0.9,
      ult: { kind: 'multi', hits: 3, mul: 1.3, scale: 'missing', desc: '3번 할퀸다. 잃은 체력이 많을수록 한 번의 피해가 최대 2배가 된다.' }, passive: { kind: 'bloodHaste', v: 0.4 } },
    { id: 'shadow', name: '셰이드', alias: '그림자', sex: 'm', race: 'demon', job: 'warrior', ultName: '그림자 습격',   role: 'warrior', el: 'dark',   range: 'melee', cost: 3, grade: 4,  hp: 1488, atk: 160, def: 95,  interval: 1.1,
      ult: { kind: 'backstab', mul: 3.2, crit: true, stealth: 3, desc: '뒤쪽 적을 반드시 치명타로 찌르고 3초 동안 숨는다.' }, passive: { kind: 'ambush', v: 3 } },
    { id: 'hawk',   name: '아이리스', alias: '매의눈', sex: 'f', race: 'human', job: 'archer', ultName: '저격',   role: 'ranged',  el: 'water',  range: 'far', shot: 'arrow', cost: 2, grade: 2, hp: 1000, atk: 173, def: 60,  interval: 1.3,
      ult: { kind: 'snipe', mul: 3.4, win: { kind: 'execute', v: 1, below: 0.3 }, desc: '체력이 가장 낮은 적을 쏜다. 체력이 30% 아래인 적이면 피해가 2배다.' }, passive: { kind: 'execute', v: 0.5, below: 0.3 } },
    { id: 'rain',   name: '볼란', alias: '화살비', sex: 'm', race: 'elf', job: 'archer', ultName: '화살비',   role: 'ranged',  el: 'fire',   range: 'far', shot: 'arrow', cost: 1, grade: 1, hp: 920, atk: 155, def: 57,  interval: 1.3,
      ult: { kind: 'aoe', mul: 1, win: { kind: 'vsBurn', v: 0.5 }, desc: '적 전체에게 피해를 준다. 화상 걸린 적은 피해가 50% 커진다.' }, passive: { kind: 'burnRally', v: 0.05 } },
    { id: 'frost',  name: '네베', alias: '얼음술사', sex: 'f', race: 'elf', job: 'mage', ultName: '눈보라', role: 'mage',    el: 'water',  range: 'long', shot: 'ice', cost: 3, grade: 3, hp: 1150, atk: 194, def: 55,  interval: 1.5,
      ult: { cast: 1, kind: 'aoe', mul: 0.9, slow: 0.3, slowDur: 3, win: { kind: 'vsSlow', v: 0.6 }, desc: '1초 동안 주문을 외운 뒤 적 전체에게 피해를 주고 느리게 한다. 이미 느려진 적은 피해가 60% 커진다.' }, passive: { kind: 'vsSlow', v: 0.3 } },
    { id: 'flame',  name: '블레이즈', alias: '불꽃술사', sex: 'm', race: 'human', job: 'mage', ultName: '대폭발', role: 'mage',    el: 'fire',   range: 'long', shot: 'fire', cost: 3, grade: 3, hp: 900, atk: 170, def: 53,  interval: 1.6,
      ult: { cast: 1, kind: 'aoe', mul: 1.3, detonate: true, desc: '1초 동안 주문을 외운 뒤 적 전체에게 피해를 준다. 화상 걸린 적은 남은 화상 피해를 한 번에 받는다.' }, passive: { kind: 'burnBlast', v: 0.8, r: 90 } },
    { id: 'storm',  name: '볼트', alias: '번개술사', sex: 'm', race: 'human', job: 'mage', ultName: '연쇄 번개', role: 'mage',    el: 'light',  range: 'long', shot: 'bolt', cost: 3, grade: 3, hp: 950, atk: 155, def: 55,  interval: 1.5,
      ult: { kind: 'barrage', every: 0.4, hits: 4, mul: 1.15, win: { kind: 'ultRefund', v: 30 }, desc: '0.4초마다 번개를 4번 떨어뜨리고, 쓴 뒤 에너지 30이 남는다.' }, passive: { kind: 'ultRefund', v: 30 } },
    { id: 'song',   name: '멜로디', alias: '음유시인', sex: 'f', race: 'elf', job: 'bard', ultName: '숲의 노래', role: 'support', el: 'forest', range: 'mid', shot: 'note', cost: 2, grade: 2, hp: 1120, atk: 99, def: 70,  interval: 1.4,
      ult: { kind: 'healAll', mul: 2.4, win: { kind: 'healHaste', v: 0.15, dur: 3 }, desc: '아군 전체를 회복하고, 회복받은 아군의 공격 속도가 3초 동안 15% 빨라진다.' }, passive: { kind: 'healHaste', v: 0.15, dur: 2 } },
    { id: 'drum',   name: '탬버', alias: '북치기', sex: 'f', race: 'demon', job: 'bard', ultName: '전투 북소리',   role: 'support', el: 'dark',   range: 'mid', shot: 'note', cost: 1, grade: 1, hp: 1150, atk: 95, def: 75,  interval: 1.4,
      ult: { kind: 'haste', amount: 0.3, dur: 5, win: { kind: 'teamLifesteal', v: 0.15, t: 5 }, desc: '5초 동안 아군 공격 속도가 30% 빨라지고, 그동안 아군이 준 피해의 15%를 회복한다.' }, passive: { kind: 'lifestealEnergy', v: 2 } },
    { id: 'wyvern',  name: '와이엇', alias: '비룡기사', sex: 'm', race: 'human', job: 'warrior', ultName: '급강하', role: 'warrior', el: 'fire',   range: 'melee',  cost: 3, grade: 4, hp: 1500, atk: 157, def: 95, interval: 1.2,
      ult: { kind: 'dash', mul: 3.2, desc: '맨 뒤 적에게 뛰어들어 공격력 320% 피해를 준다.' }, passive: { kind: 'dive', v: 1 } },
    { id: 'harpy',   name: '페드라', alias: '하피', sex: 'f', race: 'beast', job: 'archer', ultName: '깃털 폭풍',     role: 'ranged',  el: 'forest', range: 'mid', shot: 'arrow', cost: 1, grade: 1, hp: 900, atk: 131, def: 50, interval: 1.1,
      ult: { kind: 'selfHaste', amount: 0.6, dur: 5, desc: '5초 동안 자신의 공격 속도가 60% 빨라진다.' }, passive: { kind: 'openHaste', v: 0.4, dur: 5 } },
    { id: 'pegasus', name: '트레사', alias: '밤추적자', sex: 'f', race: 'human', job: 'assassin', ultName: '사냥 표식', role: 'warrior', el: 'dark', range: 'melee', cost: 2, grade: 3, hp: 1328, atk: 155, def: 85, interval: 1.1,
      ult: { kind: 'mark', mul: 1.5, amount: 0.3, dur: 5, desc: '공격력이 가장 높은 적을 공격력 150%로 베고 표식을 남긴다. 5초 동안 그 적이 받는 피해가 30% 커진다.' }, passive: { kind: 'markKillEnergy', v: 50 } },
    { id: 'bat',     name: '베스퍼', alias: '박쥐마녀', sex: 'f', race: 'demon', job: 'mage', ultName: '박쥐 떼', role: 'mage',    el: 'dark',   range: 'long', shot: 'orb', cost: 2, grade: 2, hp: 762, atk: 129, def: 50, interval: 1.5,
      ult: { kind: 'barrage', every: 0.4, hits: 3, mul: 1.2, win: { kind: 'ultDrain', v: 0.3, t: 2 }, desc: '0.4초마다 박쥐를 3번 날리고, 준 피해의 30%를 회복한다.' }, passive: { kind: 'ultDrain', v: 0.3 } },
    // ── 추가 영웅 (종족·직업 빈칸 채우기). 새 영웅을 그림 없이 넣을 때는 art: false를 달면 적·전리품·목록에 안 나와요 ──
    { id: 'thorn',  name: '로즈', alias: '가시 수호자', sex: 'f', race: 'elf',   job: 'guardian', ultName: '가시 덩굴벽', role: 'tank',    el: 'forest', range: 'melee',  cost: 2, grade: 3, hp: 2780, atk: 94, def: 170, interval: 1.6,
      ult: { trig: { kind: 'struck', n: 5 }, kind: 'taunt', dur: 4, shieldPct: 0.1, win: { kind: 'thorns', v: 0.4, t: 4 }, desc: '5번 맞을 때마다 4초 동안 도발하고, 그동안 근접 공격으로 받은 피해의 40%를 공격자에게 돌려준다.' }, passive: { kind: 'thorns', v: 0.25 } },
    { id: 'gate',   name: '헬가', alias: '지옥문지기', sex: 'f', race: 'demon', job: 'guardian', ultName: '지옥문 봉인', role: 'tank',  el: 'dark',   range: 'melee',  cost: 3, grade: 4, hp: 2500, atk: 92, def: 190, interval: 1.7,
      ult: { kind: 'buff', win: { kind: 'guardShare', v: 0.5, t: 6 }, desc: '6초 동안 체력이 가장 낮은 아군이 받는 피해의 50%를 대신 받는다.' }, passive: { kind: 'guardShare', v: 0.3 } },
    { id: 'lion',   name: '레오', alias: '사자왕', sex: 'm',   race: 'beast', job: 'guardian',  ultName: '사자의 맹세', role: 'tank',    el: 'light',  range: 'melee',  cost: 3, grade: 4, hp: 2380, atk: 95, def: 190, interval: 1.5,
      ult: { kind: 'teamShield', mul: 1.5, rally: 0.05, desc: '아군 전체에게 보호막을 씌우고, 이번 전투 동안 자신의 공격력이 보호막을 얻은 아군 1명마다 5% 오른다.' }, passive: { kind: 'shieldRally', v: 0.03, max: 10 } },
    { id: 'shaman', name: '루나', alias: '늑대주술사', sex: 'f', race: 'beast', job: 'mage',   ultName: '가시 폭풍',   role: 'mage',    el: 'forest', range: 'long', shot: 'orb', cost: 2, grade: 3, hp: 1150, atk: 185, def: 55,  interval: 1.5,
      ult: { kind: 'aoe', mul: 1, teamEnergy: 15, race: 'beast', desc: '적 전체에게 피해를 주고, 다른 수인 아군의 에너지를 15 채운다.' }, passive: { kind: 'ultBeastEnergy', v: 15 } },
    { id: 'dancer', name: '마리나', alias: '검무희', sex: 'f',   race: 'elf',   job: 'warrior',  ultName: '물결 검무',   role: 'warrior', el: 'water',  range: 'melee',  cost: 2, grade: 2, hp: 1190, atk: 130, def: 80,  interval: 1.0,
      ult: { trig: { kind: 'hits', n: 4 }, kind: 'multi', hits: 3, mul: 1.1, win: { kind: 'hasteStack', v: 0.08, max: 10, t: 5 }, desc: '4번째 공격마다 3번 베고, 5초 동안 평타를 칠 때마다 공격 속도가 8%씩 빨라진다.' }, passive: { kind: 'hasteStack', v: 0.04, max: 10 } },
    { id: 'imp',    name: '스파키', alias: '화염임프', sex: 'f', race: 'demon', job: 'archer',   ultName: '불씨 화살',   role: 'ranged',  el: 'fire',   range: 'mid', shot: 'arrow', cost: 1, grade: 1, hp: 900, atk: 143, def: 55,  interval: 1.2,
      ult: { kind: 'snipe', mul: 2.8, win: { kind: 'killEnergy', v: 50 }, desc: '체력이 가장 낮은 적을 쏘고, 쓰러뜨리면 에너지 50을 돌려받는다.' }, passive: { kind: 'killBurn', v: 3 } },
    // ── 추가 영웅 43명 (2026-11-18, 모두 65명). 43명 모두 그림이 들어와서 풀었어요 ──
    { id: 'boar', name: '러시', alias: '멧돼지전사', sex: 'm', race: 'beast', job: 'warrior', ultName: '돌진', role: 'warrior', el: 'forest', range: 'melee', cost: 1, grade: 1, hp: 1250, atk: 135, def: 75, interval: 1.1,
      ult: { kind: 'dash', mul: 3, stun: 1, desc: '가장 먼 적에게 돌진해 공격력 300% 피해를 주고 1초 기절시킨다.' }, passive: { kind: 'firstStrike', v: 3, stun: 0.5 } },
    { id: 'squire', name: '섀도', alias: '독칼잡이', sex: 'm', race: 'human', job: 'assassin', ultName: '그림자 찌르기', role: 'warrior', el: 'dark', range: 'melee', cost: 1, grade: 1, hp: 1240, atk: 139, def: 68, interval: 1.1,
      ult: { kind: 'blink', mul: 2.6, chain: 1, back: true, desc: '체력이 가장 낮은 적의 등 뒤로 순간이동해 공격력 260%로 찌르고 제자리로 돌아온다.' }, passive: { kind: 'none', v: 0 } },
    { id: 'sprout', name: '블룸', alias: '새싹정령', sex: 'f', race: 'elf', job: 'bard', ultName: '새싹의 노래', role: 'support', el: 'forest', range: 'mid', shot: 'note', cost: 1, grade: 1, hp: 1160, atk: 97, def: 75, interval: 1.4,
      ult: { kind: 'buff', win: { kind: 'healEvery', v: 0.03, every: 1, t: 8 }, desc: '8초 동안 1초마다 체력이 가장 낮은 아군을 3% 회복한다.' }, passive: { kind: 'healEvery', v: 0.05, every: 5 } },
    { id: 'pup', name: '엠버', alias: '불강아지', sex: 'f', race: 'beast', job: 'archer', ultName: '불씨 뱉기', role: 'ranged', el: 'fire', range: 'mid', shot: 'fire', cost: 1, grade: 1, hp: 920, atk: 149, def: 55, interval: 1.25,
      ult: { kind: 'snipe', mul: 2, burn: 6, desc: '체력이 가장 낮은 적에게 피해를 주고 6초 화상을 입힌다.' }, passive: { kind: 'lowBurn', v: 0.5 } },
    { id: 'mudgolem', name: '매디', alias: '늪지기', sex: 'f', race: 'demon', job: 'guardian', ultName: '진흙 벽', role: 'tank', el: 'water', range: 'melee', cost: 1, grade: 1, hp: 2190, atk: 75, def: 160, interval: 1.6,
      ult: { kind: 'taunt', dur: 4, shieldPct: 0.1, win: { kind: 'hitSlow', v: 0.4, dur: 1, t: 4 }, desc: '4초 동안 도발하고, 그동안 자신을 때린 적을 1초 동안 40% 느리게 한다.' }, passive: { kind: 'hitSlow', v: 0.3, dur: 1 } },
    { id: 'slinger', name: '슬린', alias: '돌팔매꾼', sex: 'm', race: 'human', job: 'archer', ultName: '돌 세례', role: 'ranged', el: 'forest', range: 'far', shot: 'stone', cost: 1, grade: 1, hp: 910, atk: 149, def: 55, interval: 1.25,
      ult: { kind: 'buff', win: { kind: 'pierceChance', v: 1, t: 5 }, desc: '5초 동안 평타가 대상 뒤 적 1명까지 함께 맞힌다.' }, passive: { kind: 'pierceChance', v: 0.2 } },
    { id: 'candle', name: '칸델라', alias: '견습 마법사', sex: 'f', race: 'human', job: 'mage', ultName: '불똥', role: 'mage', el: 'fire', range: 'long', shot: 'fire', cost: 1, grade: 1, hp: 920, atk: 150, def: 50, interval: 1.5,
      ult: { kind: 'aoe', mul: 0.6, burnAll: 4, desc: '적 전체에게 약한 피해를 주고 모두 화상을 입힌다.' }, passive: { kind: 'burnHit', v: 1 } },
    { id: 'batling', name: '녹스', alias: '꼬마박쥐', sex: 'm', race: 'demon', job: 'warrior', ultName: '물어뜯기', role: 'warrior', el: 'dark', range: 'melee', cost: 1, grade: 1, hp: 1063, atk: 110, def: 85, interval: 1.1,
      ult: { trig: { kind: 'hits', n: 3 }, kind: 'multi', hits: 3, mul: 1.15, win: { kind: 'ultDrain', v: 0.2 }, desc: '3번째 공격마다 3번 물어뜯고, 준 피해의 20%를 회복한다.' }, passive: { kind: 'lifesteal', v: 0.15 } },
    { id: 'frog', name: '리비', alias: '개구리주술사', sex: 'f', race: 'beast', job: 'mage', ultName: '물벼락', role: 'mage', el: 'water', range: 'long', shot: 'orb', cost: 1, grade: 1, hp: 880, atk: 140, def: 50, interval: 1.5,
      ult: { kind: 'aoe', mul: 0.5, slow: 0.3, slowDur: 3, energyPerSlow: 10, desc: '적 전체를 느리게 하고, 느려진 적 1명마다 자신의 에너지가 10씩 찬다.' }, passive: { kind: 'energyStart', v: 25 } },
    { id: 'piper', name: '피프', alias: '피리소년', sex: 'm', race: 'human', job: 'bard', ultName: '행진곡', role: 'support', el: 'light', range: 'mid', shot: 'note', cost: 1, grade: 1, hp: 1140, atk: 97, def: 75, interval: 1.4,
      ult: { trig: { kind: 'start' }, kind: 'buff', teamEnergy: 20, desc: '전투가 시작되면 한 번, 다른 아군 전체의 에너지를 20 채운다.' }, passive: { kind: 'teamEnergyStart', v: 10 } },
    { id: 'mossguard', name: '모스', alias: '이끼수호병', sex: 'f', race: 'elf', job: 'guardian', ultName: '이끼 방벽', role: 'tank', el: 'forest', range: 'melee', cost: 1, grade: 1, hp: 2060, atk: 70, def: 150, interval: 1.6,
      ult: { kind: 'taunt', dur: 4, shieldPct: 0.1, win: { kind: 'hitHeal', v: 0.03, t: 4 }, desc: '4초 동안 도발하고, 그동안 맞을 때마다 최대 체력 3%를 회복한다.' }, passive: { kind: 'hitHeal', v: 0.01 } },
    { id: 'spark', name: '지프', alias: '번개쥐', sex: 'm', race: 'beast', job: 'warrior', ultName: '찌릿 돌진', role: 'warrior', el: 'light', range: 'melee', cost: 2, grade: 2, hp: 1350, atk: 145, def: 85, interval: 1.1,
      ult: { kind: 'zigzag', hits: 3, mul: 1.5, desc: '적 사이를 누비며 3명에게 공격력 150% 피해를 준다.' }, passive: { kind: 'chargeHit', v: 2 } },
    { id: 'ranger', name: '로빈', alias: '숲순찰대', sex: 'f', race: 'elf', job: 'archer', ultName: '관통 화살', role: 'ranged', el: 'forest', range: 'mid', shot: 'arrow', cost: 2, grade: 2, hp: 1030, atk: 166, def: 60, interval: 1.25,
      ult: { kind: 'pierce', mul: 2, win: { kind: 'killRush', v: 1 }, desc: '일직선으로 꿰뚫어 맞은 적 모두에게 피해를 준다. 쓰러뜨리면 바로 한 번 더 쏜다.' }, passive: { kind: 'killRush', v: 1 } },
    { id: 'shield', name: '버클리', alias: '방패병', sex: 'f', race: 'human', job: 'guardian', ultName: '철벽', role: 'tank', el: 'water', range: 'melee', cost: 2, grade: 2, hp: 2190, atk: 75, def: 160, interval: 1.6,
      ult: { kind: 'taunt', dur: 4, shieldPct: 0.1, win: { kind: 'hitShield', v: 0.02, n: 1, t: 4 }, desc: '4초 동안 도발하고, 그동안 맞을 때마다 최대 체력 2% 보호막을 얻는다.' }, passive: { kind: 'hitShield', v: 0.2, n: 10 } },
    { id: 'fox', name: '키츠', alias: '여우검객', sex: 'f', race: 'beast', job: 'warrior', ultName: '여우불 베기', role: 'warrior', el: 'fire', range: 'melee', cost: 2, grade: 2, hp: 1380, atk: 150, def: 85, interval: 1.1,
      ult: { kind: 'strike', mul: 2, crit: true, follow: 0.8, desc: '반드시 치명타로 베고, 같은 적을 공격력 80%로 한 번 더 벤다.' }, passive: { kind: 'critFollow', v: 0.5 } },
    { id: 'nun', name: '그레이스', alias: '수녀', sex: 'f', race: 'human', job: 'bard', ultName: '기도', role: 'support', el: 'light', range: 'mid', shot: 'orb', cost: 2, grade: 2, hp: 1120, atk: 95, def: 70, interval: 1.4,
      ult: { kind: 'healAll', mul: 2, win: { kind: 'endure', v: 1, t: 5 }, desc: '아군 전체를 회복하고, 5초 동안 쓰러질 피해를 받은 아군을 체력 1로 버티게 한다.' }, passive: { kind: 'endure', v: 1 } },
    { id: 'warlock', name: '헥사', alias: '흑마법사', sex: 'f', race: 'demon', job: 'mage', ultName: '어둠 구슬', role: 'mage', el: 'dark', range: 'long', shot: 'orb', cost: 2, grade: 2, hp: 960, atk: 155, def: 55, interval: 1.5,
      ult: { kind: 'barrage', every: 0.4, hits: 3, mul: 2.1, selfCost: 0.1, desc: '자기 체력 10%를 바쳐 0.4초마다 어둠 구슬을 3번 쏜다. 구슬 피해가 80% 커진다.' }, passive: { kind: 'bloodPact', v: 0.4, cost: 0.05, every: 3 } },
    { id: 'turtle', name: '셸리', alias: '거북기사', sex: 'f', race: 'beast', job: 'guardian', ultName: '등껍질 방패', role: 'tank', el: 'water', range: 'melee', cost: 2, grade: 2, hp: 2160, atk: 85, def: 185, interval: 1.55,
      ult: { kind: 'selfShield', shieldPct: 0.4, win: { kind: 'shieldBreakStun', v: 1, r: 90, t: 99 }, desc: '자신에게 최대 체력 40% 보호막을 두르고, 이 보호막이 깨지면 주변 적을 1초 기절시킨다.' }, passive: { kind: 'shieldBreakStun', v: 0.8, r: 90 } },
    { id: 'horn', name: '클라렌', alias: '뿔나팔수', sex: 'm', race: 'demon', job: 'bard', ultName: '전쟁 나팔', role: 'support', el: 'fire', range: 'mid', shot: 'note', cost: 2, grade: 2, hp: 1160, atk: 99, def: 75, interval: 1.4,
      ult: { trig: { kind: 'start' }, kind: 'haste', amount: 0.25, dur: 5, win: { kind: 'burnEnergy', v: 1, t: 5 }, desc: '전투가 시작되면 한 번, 5초 동안 아군 공격 속도가 25% 빨라지고, 그동안 화상 피해가 들어갈 때마다 아군 에너지가 1 찬다.' }, passive: { kind: 'burnEnergy', v: 1 } },
    { id: 'owl', name: '올리', alias: '올빼미궁수', sex: 'm', race: 'beast', job: 'archer', ultName: '야간 사격', role: 'ranged', el: 'dark', range: 'far', shot: 'arrow', cost: 2, grade: 2, hp: 970, atk: 166, def: 60, interval: 1.25,
      ult: { kind: 'zigzag', hits: 3, mul: 1.2, win: { kind: 'ultBlind', v: 0.5, dur: 2 }, desc: '서로 다른 적 3명에게 화살을 쏘고, 맞은 적은 2초 동안 공격이 50% 빗나간다.' }, passive: { kind: 'ultBlind', v: 0.5, dur: 2 } },
    { id: 'icefairy', name: '크리스탈', alias: '얼음요정', sex: 'f', race: 'elf', job: 'mage', ultName: '서리꽃', role: 'mage', el: 'water', range: 'long', shot: 'ice', cost: 2, grade: 2, hp: 920, atk: 150, def: 50, interval: 1.5,
      ult: { kind: 'chillAll', amount: 0.4, dur: 3, desc: '3초 동안 적 전체의 공격 속도를 40% 늦춘다.' }, passive: { kind: 'chillAura', v: 0.15, n: 3 } },
    { id: 'monk', name: '젠', alias: '수도승', sex: 'm', race: 'human', job: 'warrior', ultName: '연타', role: 'warrior', el: 'light', range: 'melee', cost: 2, grade: 3, hp: 1610, atk: 171, def: 85, interval: 1.1,
      ult: { kind: 'buff', win: { kind: 'comboN', v: 1, n: 1, t: 5 }, desc: '5초 동안 평타가 2번씩 나간다.' }, passive: { kind: 'comboN', v: 1, n: 4 } },
    { id: 'vine', name: '아이비', alias: '덩굴사냥꾼', sex: 'f', race: 'elf', job: 'warrior', ultName: '덩굴 채찍', role: 'warrior', el: 'forest', range: 'melee', cost: 2, grade: 3, hp: 1460, atk: 155, def: 90, interval: 1.1,
      ult: { kind: 'strike', mul: 1.5, hits: 2, root: 2, desc: '공격력 150% 피해를 2번 주고 맞은 적을 2초 동안 묶는다.' } /* 2026-11-26: 300%×1 → 150%×2 (합 같음, 연타 연출) */, passive: { kind: 'rootHit', v: 1 } },
    { id: 'gargoyle', name: '스톤', alias: '가고일', sex: 'm', race: 'demon', job: 'guardian', ultName: '석화', role: 'tank', el: 'dark', range: 'melee', cost: 3, grade: 3, hp: 2280, atk: 77, def: 170, interval: 1.6,
      ult: { kind: 'stone', dur: 3, heal: 0.2, desc: '3초 동안 돌이 되어 피해를 받지 않고 적을 끌어모은다. 풀리면 체력 20%를 회복한다.' }, passive: { kind: 'petrify', v: 0.2, dur: 3 } },
    { id: 'valkyrie', name: '레이븐', alias: '처형자', sex: 'f', race: 'human', job: 'assassin', ultName: '연쇄 처형', role: 'warrior', el: 'dark', range: 'melee', cost: 3, grade: 4, hp: 1510, atk: 186, def: 95, interval: 1.05,
      ult: { kind: 'blink', mul: 2.5, chain: 3, back: true, desc: '체력이 가장 낮은 적에게 순간이동해 공격력 250%로 벤다. 쓰러뜨리면 다음 적에게 이어서 벤다. 최대 3번. 다 베면 제자리로 돌아온다.' }, passive: { kind: 'killAtkStack', v: 0.15, max: 5 } },
    { id: 'assassin', name: '더크', alias: '암살자', sex: 'm', race: 'human', job: 'warrior', ultName: '급소 찌르기', role: 'warrior', el: 'dark', range: 'melee', cost: 2, grade: 3, hp: 1350, atk: 145, def: 85, interval: 1.1,
      ult: { kind: 'backstab', mul: 3.25, win: { kind: 'killStealth', v: 2 }, desc: '뒤쪽 적을 찌르고, 쓰러뜨리면 2초 동안 숨는다.' }, passive: { kind: 'killStealth', v: 1.5 } },
    { id: 'druid', name: '윌로', alias: '드루이드', sex: 'f', race: 'elf', job: 'mage', ultName: '가시 숲', role: 'mage', el: 'forest', range: 'long', shot: 'orb', cost: 3, grade: 3, hp: 990, atk: 161, def: 55, interval: 1.5,
      ult: { cast: 1, kind: 'aoe', mul: 0.95, forestHaste: true, desc: '1초 동안 주문을 외운 뒤 적 전체에게 피해를 주고, 숲 아군 전체에게 숲 가속을 1번씩 건다.' }, passive: { kind: 'forestHeal', v: 0.02 } },
    { id: 'tiger', name: '타이라', alias: '호랑이무사', sex: 'f', race: 'beast', job: 'warrior', ultName: '맹호 연격', role: 'warrior', el: 'fire', range: 'melee', cost: 3, grade: 4, hp: 1570, atk: 171, def: 95, interval: 1.1,
      ult: { trig: { kind: 'hits', n: 4 }, kind: 'multi', hits: 3, mul: 1.36, scale: 'low', desc: '4번째 공격마다 3번 벤다. 자신의 체력이 30% 아래면 피해가 2배가 된다.' }, passive: { kind: 'lowLifesteal', v: 0.3, below: 0.3 } },
    { id: 'succubus', name: '릴리스', alias: '서큐버스', sex: 'f', race: 'demon', job: 'bard', ultName: '매혹의 노래', role: 'support', el: 'dark', range: 'mid', shot: 'orb', cost: 2, grade: 3, hp: 1581, atk: 120, def: 75, interval: 1.4,
      ult: { kind: 'healAll', mul: 2.2, win: { kind: 'healSteal', v: 0.3 }, desc: '아군 전체를 회복하고, 회복량의 30%만큼 가장 약한 적의 체력을 빼앗는다.' }, passive: { kind: 'healSteal', v: 0.3 } },
    { id: 'cannon', name: '캐넌', alias: '포격수', sex: 'm', race: 'human', job: 'archer', ultName: '포격', role: 'ranged', el: 'fire', range: 'far', shot: 'stone', cost: 2, grade: 3, hp: 1090, atk: 186, def: 60, interval: 1.25,
      ult: { kind: 'bombard', mul: 2, r: 90, desc: '적이 가장 많이 모인 곳에 포탄을 떨어뜨려 주변 적에게 공격력 200% 피해를 준다.' }, passive: { kind: 'splash', v: 0.36 } },
    { id: 'coral', name: '코라', alias: '산호수호자', sex: 'f', race: 'elf', job: 'guardian', ultName: '산호 벽', role: 'tank', el: 'water', range: 'melee', cost: 3, grade: 3, hp: 2230, atk: 77, def: 170, interval: 1.6,
      ult: { kind: 'buff', win: { kind: 'teamShieldEvery', v: 0.04, every: 2, t: 8 }, desc: '8초 동안 2초마다 아군 전체에게 최대 체력 4% 보호막을 씌운다.' }, passive: { kind: 'teamShieldEvery', v: 0.05, every: 10 } },
    { id: 'thunderbird', name: '토라', alias: '천둥새', sex: 'f', race: 'beast', job: 'mage', ultName: '낙뢰', role: 'mage', el: 'light', range: 'long', shot: 'bolt', cost: 3, grade: 4, hp: 1030, atk: 170, def: 60, interval: 1.5,
      ult: { kind: 'barrage', every: 0.4, hits: 4, mul: 1.3, win: { kind: 'ultStack', v: 0.2, max: 5, t: 999 }, desc: '0.4초마다 낙뢰를 4번 떨어뜨린다. 쓸 때마다 다음 낙뢰 피해가 20% 커진다. 최대 5번 쌓인다.' }, passive: { kind: 'ultStack', v: 0.2, max: 5 } },
    { id: 'necro', name: '모르티아', alias: '사령술사', sex: 'f', race: 'demon', job: 'mage', ultName: '망자의 손', role: 'mage', el: 'dark', range: 'long', shot: 'orb', cost: 3, grade: 4, hp: 952, atk: 161, def: 60, interval: 1.5,
      ult: { kind: 'barrage', every: 0.4, hits: 4, mul: 1.3, win: { kind: 'killEnergy', v: 40, t: 2.5 }, desc: '0.4초마다 망자의 손을 4번 뻗고, 쓰러뜨린 적 1명마다 에너지 40을 돌려받는다.' }, passive: { kind: 'deathEnergy', v: 20 } },
    { id: 'moonarcher', name: '셀레네', alias: '달빛궁수', sex: 'f', race: 'elf', job: 'archer', ultName: '달빛 화살', role: 'ranged', el: 'light', range: 'mid', shot: 'arrow', cost: 2, grade: 3, hp: 1010, atk: 186, def: 60, interval: 1.25,
      ult: { kind: 'snipe', mul: 3, far: true, win: { kind: 'farShot', v: 0.6 }, desc: '가장 먼 적을 쏜다. 거리가 멀수록 피해가 최대 60% 커진다.' }, passive: { kind: 'farShot', v: 0.4 } },
    { id: 'minotaur', name: '힐다', alias: '황소뿔', sex: 'f', race: 'beast', job: 'guardian', ultName: '대지 강타', role: 'tank', el: 'fire', range: 'melee', cost: 3, grade: 3, hp: 2370, atk: 80, def: 170, interval: 1.6,
      ult: { kind: 'nova', mul: 2, r: 100, stun: 1, desc: '주변 적에게 공격력 200% 피해를 주고 1초 기절시킨다.' }, passive: { kind: 'hitNova', v: 1.5, n: 8, r: 90 } },
    { id: 'dragon', name: '드라코', alias: '용기사', sex: 'm', race: 'human', job: 'warrior', ultName: '용의 일격', role: 'warrior', el: 'fire', range: 'melee', cost: 3, grade: 4, hp: 1488, atk: 150, def: 95, interval: 1.1,
      ult: { kind: 'strike', mul: 3.6, win: { kind: 'ultBurnAmp', v: 2, dur: 4 }, desc: '공격력 360% 피해를 주고, 맞은 적의 화상 피해가 4초 동안 2배가 된다.' }, passive: { kind: 'ultBurnAmp', v: 2, dur: 4 } },
    { id: 'archmage', name: '테티스', alias: '대마법사', sex: 'f', race: 'human', job: 'mage', ultName: '해일', role: 'mage', el: 'water', range: 'long', shot: 'ice', cost: 3, grade: 4, hp: 1030, atk: 170, def: 60, interval: 1.5,
      ult: { cast: 1, kind: 'aoe', mul: 1, slow: 0.25, slowDur: 3, teamEnergy: 15, desc: '1초 동안 주문을 외운 뒤 적 전체에게 피해를 주고 느리게 하며, 다른 아군 전체의 에너지를 15 채운다.' }, passive: { kind: 'allyUltEnergy', v: 8 } },
    { id: 'worldtree', name: '이그드라', alias: '세계수정령', sex: 'f', race: 'elf', job: 'bard', ultName: '세계수의 숨결', role: 'support', el: 'forest', range: 'mid', shot: 'orb', cost: 3, grade: 4, hp: 1309, atk: 111, def: 85, interval: 1.4,
      ult: { kind: 'reviveAll', pct: 0.2, mul: 2.3, desc: '쓰러진 아군 모두를 체력 20%로 되살린다. 쓰러진 아군이 없으면 아군 전체를 회복한다.' }, passive: { kind: 'reviveEvery', v: 0.25, every: 12 } },
    { id: 'demonlord', name: '데미안', alias: '마왕', sex: 'm', race: 'demon', job: 'warrior', ultName: '암흑 참격', role: 'warrior', el: 'dark', range: 'melee', cost: 3, grade: 4, hp: 1488, atk: 155, def: 95, interval: 1.1,
      ult: { kind: 'backstab', mul: 3.4, deadBonus: 0.3, desc: '뒤쪽 적에게 큰 피해를 준다. 쓰러진 아군 1명마다 피해가 30% 커진다.' }, passive: { kind: 'martyr', v: 0.2 } },
    { id: 'phoenix', name: '이그나', alias: '불사조', sex: 'f', race: 'beast', job: 'mage', ultName: '불새의 날개', role: 'mage', el: 'fire', range: 'long', shot: 'fire', cost: 3, grade: 4, hp: 1070, atk: 176, def: 60, interval: 1.5,
      ult: { cast: 1, kind: 'aoe', mul: 1.2, win: { kind: 'rebirth', v: 0.5, r: 90, t: 999 }, desc: '1초 동안 주문을 외운 뒤 적 전체에게 피해를 준다. 이후 이번 전투에서 처음 쓰러지면 체력 50%로 되살아난다.' }, passive: { kind: 'rebirth', v: 0.5, r: 90 } },
    { id: 'seraph', name: '세라', alias: '세라핌', sex: 'f', race: 'elf', job: 'guardian', ultName: '천상의 방패', role: 'tank', el: 'light', range: 'melee', cost: 3, grade: 4, hp: 2380, atk: 85, def: 190, interval: 1.55,
      ult: { kind: 'revive1', pct: 0.3, mul: 1.6, desc: '쓰러진 아군 1명을 체력 30%로 되살린다. 쓰러진 아군이 없으면 아군 전체에게 보호막을 씌운다.' }, passive: { kind: 'reviveAlly', v: 0.3 } },
    { id: 'kraken', name: '애비', alias: '크라켄', sex: 'f', race: 'demon', job: 'guardian', ultName: '심해의 손아귀', role: 'tank', el: 'water', range: 'melee', cost: 3, grade: 4, hp: 2410, atk: 86, def: 190, interval: 1.6,
      ult: { trig: { kind: 'struck', n: 6 }, kind: 'taunt', dur: 5, shieldPct: 0.15, win: { kind: 'tauntDrain', v: 10, t: 5 }, desc: '6번 맞을 때마다 5초 동안 도발하고, 그동안 맞으면 공격자의 에너지 10을 빼앗는다.' }, passive: { kind: 'tauntDrain', v: 10 } },
    { id: 'windlord', name: '게일', alias: '바람의군주', sex: 'f', race: 'elf', job: 'archer', ultName: '폭풍 화살', role: 'ranged', el: 'forest', range: 'mid', shot: 'arrow', cost: 3, grade: 4, hp: 1100, atk: 209, def: 65, interval: 1.25,
      ult: { kind: 'buff', win: { kind: 'hasteDouble', v: 1, t: 5 }, desc: '5초 동안 평타로 화살을 2발 쏜다.' }, passive: { kind: 'hasteDouble', v: 1 } }
  ],
  ranges: { melee: '근거리', mid: '중거리', long: '장거리', far: '최장거리' },
  roles: { tank: '탱커', warrior: '전사', ranged: '원거리', mage: '마법', support: '지원' },
  // 종족·직업 (외형을 보고 나눴어요). 스킬·궁극기·시너지가 이 태그를 보고 효과가 달라지게 쓸 거예요
  // 속성은 elements(불·물·숲·빛·어둠)를 그대로 써요. role(탱커·전사…)은 전투 배치용이에요
  races: { human: '인간', elf: '엘프', beast: '수인', demon: '마족', monster: '몬스터' }, // monster: 몹 전용(영입 안 됨)
  jobs:  { guardian: '기사', assassin: '암살자', warrior: '전사', archer: '궁수', mage: '마법사', bard: '서포터' }, /* 2026-11-26: 힐러 → 서포터(사용자) */ jobDesc: { guardian: '맞을 때 궁극기 에너지가 2배로 찬다.', bard: '궁극기를 쓰면 다른 아군의 궁극기 에너지가 15 찬다.', warrior: '아군이 쓰러질 때마다 공격력이 10% 오른다.', archer: '가장 먼 적부터 공격한다.', assassin: '체력이 가장 낮은 적부터 공격한다.', mage: '평타를 칠 때 궁극기 에너지가 10 더 찬다.' }, // 2026-11-21: 수호자+성기사 → 기사(탱커), 사수 → 궁수, 음유시인 → 힐러, 암살자 추가 (id는 그대로)

  // ───── 캠페인 ─────
  // 스테이지 n(0부터): 적 레벨 = 1 + (지나온 스테이지마다 그 챕터의 levelStep) , 벽 스테이지는 레벨 + wallBonus
  // levelStep [1장, 2장, 3장]: 플레이어 성장(★·등급·스킬·전장 칸)이 1장 끝 무렵 거의 차기 때문에 2·3장은 적 레벨을 천천히 올려요.
  // 2·3장의 어려움은 레벨보다 적 조합·적 팀 스킬 수·벽·보스에서 나와요 (근거: 시드 40 × 6시간 봇 시뮬, 2026-11-18)
  // 적 팀: 5명 (앞 2 / 뒤 3), 영웅 목록에서 스테이지마다 다르게 골라요. 10번째(보스)는 앞 가운데에 보스(체력 × bossHp, 공격 × bossAtk)
  campaign: {
    chapters: 1, /* 2026-11-26: 지금은 1-10을 최종으로(사용자: "1-10을 최종으로 취급할꺼야 현재는"). 3장 전체로 되돌리려면 3 */ perChapter: 10, bossAt: [5, 10], // bossAt: 장마다 보스 판 번호 (2026-11-18: 5와 10)
    levelStep: [1.0, 0.3, 0.12], wallBonus: 2, walls: [9, 14, 19, 26, 29],  // 1-10, 2-5, 2-10, 3-7, 3-10
    bossHp: 1.8, bossAtk: 1.15, // 스킬 등급업을 넣은 뒤(2026-11-18) 다시 맞춘 값
    // 2026-11-22: 영웅 레벨 = 플레이어 레벨(+heroLvPlus). 적 레벨은 enemyLv 표 그대로(숨은 초반 배율 없음). 같은 영웅·같은 레벨이면 같은 능력치. 화면 레벨 표시는 E.heroLevel(D, plv)
    heroLv: 'player', heroLvPlus: 0, firstEnemy: 'frog', firstEnemyMul: 1, /* 2026-11-24: 0.5 → 1 (사용자: 같은 영웅인데 능력치가 달라 어색) */ // 1-1 적을 이 영웅으로 고정하고 체력·공격력 ×firstEnemyMul (시작 영웅 1명이 누구든 이기게: 0.7이면 뿔피리 30%) // 2026-11-22: 시작 영웅 2명으로 바꾸고 1레벨부터 시작(예전 +6)
    enemyLvSpread: 1, bossLvPlus: 4, // 적마다 레벨 ±spread(무작위), 보스는 +bossLvPlus 레벨 (이 값이 있으면 bossHp·bossAtk 배율은 안 써요)
    enemyLv: [1, 1, 2, 3, 3, 4, 4, 5, 5, 6,  8, 9, 11, 13, 15, 16, 18, 19, 20, 24,  22, 23, 24, 25, 25, 26, 29, 26, 26, 29], // 스테이지 번호(0부터)마다 적 레벨. 2026-11-22: 1-1~1-10 = 안 지고 왔을 때 그 판 시작 플레이어 레벨(적 수 × 처치 경험치로 계산). 보스는 +bossLvPlus
    enemyMul: 1.0,            // 적 전체 능력치 배율
    earlyMul: 0.3, earlyRamp: 0.03, // 2026-11-21: 특성을 다시 꺼서 0.25 → 0.3으로 되돌림  // 초반 적 배율: earlyMul에서 시작해 스테이지마다 earlyRamp씩 올라 1이 돼요
    reward: { base: 120, growth: 1 }, /* 2026-11-24: 비율 없앰(사용자: 후반에 너무 커져서). 클리어 골드는 player.clearGold(레벨별), 상자·홀짝 등은 base 120 고정 */   // 스테이지를 깨면 골드 = base × growth^n. 상점가 성장(shop.priceGrowth 1.12)보다 조금만 빠르게 (1.22였을 땐 끝에 골드가 쓴 양의 수십 배 남았어요)
    loseStepBack: 1,          // 지면 이만큼 앞 스테이지로 돌아가요 (0이면 그대로). 코스트 상한은 가장 멀리 간 기록 기준이라 줄지 않아요
    // 적 팀 스킬: from 스테이지부터 count개 (팀 스킬 목록에서 스테이지마다 정해져요). 레벨 = 1 + floor(스테이지 / levelEvery). 보스 스테이지는 +bossExtra개
    // ───── 제약(난이도 구간, 2026-11-27 뼈대, 숫자는 기획안 6번 초안 그대로 임시. 사용자: "난 근데 제약까지가보고싶어.") ─────
    //   lvPlus: 적 레벨 +N(장 보정에 더함) · gradeShift: 적 영웅 등급 확률을 플레이어 레벨 표에서 N칸 앞당김(적만) · relics: 적 유물 표(enemySkills.table 대신, 없으면 그대로) · medalMul: 판 끝 훈장 배율
    //   E.difficultyData(data, id)가 반영한 data를 돌려줘요. 순서: difficultyData(chapterData(D, 장), id) → metaData(…, 강화). 내 칸·횟수를 깎는 제약은 처음엔 안 넣음(기획결정기록 0-18)
    difficulty: { tiers: [
      { id: 'easy', name: '쉬움', desc: '적이 기본 세기로 나온다. 훈장 ×1.', lines: ['적이 기본 세기로 나온다.', '훈장 ×1'], lvPlus: 0, gradeShift: 0, relics: null, medalMul: 1 },
      { id: 'normal', name: '보통', desc: '적 레벨 +1. 더 높은 등급의 적이 나오고, 적 유물이 일찍 붙는다. 훈장 ×1.5.', lines: ['적 레벨 +1', '더 높은 등급의 적이 나온다.', '적 유물이 일찍 붙는다.', '훈장 ×1.5'], lvPlus: 1, gradeShift: 2, relics: [{ from: 1, count: 1 }, { from: 6, count: 2 }, { from: 12, count: 2 }, { from: 22, count: 3 }], medalMul: 1.5 },
      { id: 'hard', name: '어려움', desc: '적 레벨 +2. 높은 등급의 적이 많고, 적 유물이 더 일찍·더 많이 붙는다. 훈장 ×2.', lines: ['적 레벨 +2', '높은 등급의 적이 많다.', '적 유물이 더 일찍·더 많이 붙는다.', '훈장 ×2'], /* 2026-11-27 lines = 화면에 한 줄씩(사용자: "내용마다 구분해서 한줄씩") */ lvPlus: 2, gradeShift: 4, relics: [{ from: 0, count: 1 }, { from: 4, count: 2 }, { from: 12, count: 3 }, { from: 22, count: 3 }], medalMul: 2 } ] },
    enemySkills: { table: [{ from: 4, count: 1 }, { from: 12, count: 2 }, { from: 22, count: 3 }], levelEvery: 10, bossExtra: 0 }, // 보스 판에 스킬을 더 주면 3-10이 거의 못 깨는 벽이 돼서 0
    // 2026-11-26 장(챕터): 장마다 처음부터(플레이어 레벨 1) 10판. E.chapterData(data, 장 번호)가 이 표로 그 장의 data를 만들어요(판 번호는 0~9 그대로, 이름만 "2-1"처럼)
    //   lvPlus: 적 레벨 +N(1장 표에 더함) · swamp: 적 쪽 늪 칸 { cells: 판마다 칸 수, every: 이 초마다, amount: 늪에 선 적 공격력 +비율(계단식, 최대 없음) } · bellTiers: 그 장의 분노 단계 · groups: 같은 그룹 이벤트를 장별 확률로(키 = 굴려 나온 이벤트, 값 = 그룹 안 가중치)
    chapterDefs: [
      { featured: ['boar', 'ranger', 'minotaur', 'dragon'], featuredMul: 3, /* 2026-11-27 특별 출현: 등급별 1명, 기획이 외형 보고 고름(사용자: "임의로 니가 외형보고 등급별로1개씩"). 러시·로빈·힐다·드라코. 같은 등급 안에서 3배 잘 나옴(임시) */ name: '용의 초원', foeName: '용' /* 2026-11-27 챕터 이름은 분노 상징 캐릭터로(사용자: "용의 초원, 악어의 늪지대 이렇게 분노 상징하는 캐릭터들"). 예전 '초원' */, bg: 'img/p/bg_field.png', bgDusk: 'img/p/bg_field_dusk.png' },
      { featured: ['mudgolem', 'turtle', 'druid', 'kraken'], featuredMul: 3, /* 특별 출현: 매디(늪지기)·셸리(거북기사)·윌로(드루이드)·애비(크라켄) */ name: '악어의 늪지대', foeName: '악어', /* 예전 '늪지대' */ story: '초원을 지나면 안개 낀 늪지대가 나온다. 발이 빠지는 진흙 위에서 적들은 오래 버틸수록 사나워진다. 늪 한가운데에는 수상한 물약을 파는 개구리 상인이 산다.', /* 2026-11-27 챕터 이야기(사용자: "늪지대 스토리도 넣어줘") */ foeIcon: 'img/p/ui_swampfoe', bg: 'img/p/bg_swamp.png', bgDusk: 'img/p/bg_swamp_dusk.png', lvPlus: 1, swamp: { cells: 1, every: 5, amount: 0.01 } /* 2026-11-27: 5초마다 +1% (사용자: "늪칸효과 5초마다 1%로해.."). 예전 perSec 0.05 = 1초마다 +5% */, bellTiers: [['more'], ['relic'], ['swamp']], groups: { merchant: { merchant: 3, swampShop: 7 } } }
    ],
    idle: { enabled: false, base: 8, growth: 1.2, maxHours: 8 } // 방치 보상 (꺼짐: 방치형 게임이 아니에요). 골드는 스테이지 보상과 전리품으로만 들어와요
  },

  // 영웅 레벨업 가격 = base × growth^(레벨 − 1)
  // enabled: false → 골드로 레벨업하지 않아요 (레벨은 다른 방식으로 풀 예정). 골드는 상점 전용
  levelCost: { enabled: false, base: 60, growth: 1.17, maxLevel: 60 },

  // ───── 물약(2026-11-26, 2장 늪지 상인): 마시면 그 전투 동안만. 끝나면 이기든 지든 사라져요. kind는 열 유물 효과를 그대로 써요(대상만 다름)
  //   target: 'team' 아군 전체 · 'rand' 무작위 아군 1명(마실 때 정해져 머리 위에 표시) · kind 'swamp' = 늪 칸과 같은 1초마다 공격력 +amount
  potions: {
    sellRate: 0.5, // 2026-11-27: 물약 판매 값 = 산 값 × sellRate (반올림). 버릴 수 있게 상세 창에 [마시기]·[판매] 둘 다 (사용자: "산 값의 절반")
    grade: 1, // 2026-11-27: 물약 등급은 모두 일반(1). 상점 칸 테두리·등급 바탕에 씀 (사용자: "노멀이야 등급은. 물약은 모두")
    list: [
      { id: 'p_steel',  name: '강철 물약',   icon: '🛡️', kind: 'lineGuard',  target: 'team', amount: 0.1,  price: 40, desc: '이번 전투 동안 아군 전체가 받는 피해가 {a}% 줄어든다.' },
      { id: 'p_thorn',  name: '가시 물약',   icon: '🦔', kind: 'lineThorns', target: 'team', amount: 0.1,  price: 40, desc: '이번 전투 동안 아군 전체가 맞으면 받은 피해의 {a}%를 되돌려 준다.' },
      { id: 'p_energy', name: '기운 물약',   icon: '⚡', kind: 'lineEnergy', target: 'team', amount: 20,   price: 40, desc: '이번 전투에서 아군 전체가 궁극기 에너지 {a}을 들고 시작한다.' },
      { id: 'p_life',   name: '생명 물약',   icon: '💚', kind: 'lineCare',   target: 'team', amount: 0.2,  price: 40, desc: '이번 전투 동안 아군 전체가 받는 회복과 보호막이 {a}% 커진다.' },
      { id: 'p_swift',  name: '날쌘 물약',   icon: '💨', kind: 'lineHaste',  target: 'rand', amount: 0.4,  price: 50, desc: '이번 전투 동안 무작위 아군 1명의 공격 속도가 {a}% 빨라진다.' },
      { id: 'p_shadow', name: '그림자 물약', icon: '🌑', kind: 'lineHide',   target: 'rand', amount: 5,    price: 40, desc: '이번 전투에서 무작위 아군 1명은 처음 {a}초 동안 적의 목표가 되지 않는다.' },
      { id: 'p_wolf',   name: '늑대 물약',   icon: '🐺', kind: 'lineAtk',    target: 'rand', amount: 0.4,  price: 50, desc: '이번 전투 동안 무작위 아군 1명의 공격력이 {a}% 오른다.' },
      { id: 'p_swamp',  name: '늪 물약',     icon: '🫧', kind: 'swamp',      target: 'rand', amount: 0.01, every: 5, price: 60, /* 2026-11-27: 늪 칸과 같게 5초마다 +1% (예전 1초마다 +5%) */ desc: '이번 전투 동안 무작위 아군 1명은 5초마다 공격력 {a}%씩 오른다.' }
    ]
  },

  // ───── 팀 스킬 (상점에서 사요). 팀 전체에 적용되고, 스킬마다 자기 쿨타임(cd초)이 돌면 자동 발동 ─────
  // 레벨 효과: 수치 × (1 + perLevel × (레벨 − 1)). 같은 스킬을 또 사면 레벨 +1
  skills: {
    // 스킬은 레벨 없이 등급만 있어요. 태생 등급(list[].grade)에서 시작하고, 같은 스킬을 또 사면(전리품 두루마리로 또 받아도) 등급이 1 올라요. 최고 maxGrade(전설)
    // 효과 = 수치 × (1 + perGrade × 오른 등급 수). 첫 발동은 쿨타임의 firstAt배 시점
    // triggerOn: 연계 스킬(trigger)을 상점·적·전리품·상인에 내놓을지. 화면이 연계 스킬(쿨타임 0, 쌓임 수)을 보여 주게 되면 UI 세션이 true로 켜요
    triggerOn: true, // 2026-11-18 UI 세션: 화면 준비가 끝나서 켰어요
    slots: 10, gradeUp: true, maxGrade: 4, perGrade: 0.2, powerPerGrade: 0.05, // powerPerGrade: 화면 전투력에 유물 1개마다 지금 등급 × 이만큼 더해요(어림값)
    firstAt: 0.5,
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
      { id: 'howl',    grade: 2, name: '야성의 포효', icon: '🐾', cd: 9,  price: 150, kind: 'atkBuff', amount: 0.5, /* 2026-11-26 종족 유물 +25%: 0.4 */ dur: 4, tag: { race: 'beast' }, only: true, desc: '{d}초 동안 수인 아군의 공격력이 {a}% 오른다.' },
      { id: 'grove',   grade: 2, name: '숲의 축복', icon: '🍃', cd: 10, price: 160, kind: 'healPct', amount: 0.06, /* 2026-11-26 종족 유물 +20%: 0.05 */ tag: { race: 'elf' }, per: 0.5, desc: '아군 체력을 {a}% 회복한다. 엘프 1명마다 효과가 50% 커진다.' },
      { id: 'pact',    grade: 3, name: '피의 계약', icon: '🩸', cd: 11, price: 180, kind: 'nuke', amount: 0.44, /* 2026-11-26 종족 유물 +25%: 0.35 */ tag: { race: 'demon' }, per: 0.5, desc: '적 전체에게 아군 평균 공격력의 {a}%만큼 피해를 준다. 마족 1명마다 효과가 50% 커진다.' },
      { id: 'unity',   grade: 1, name: '인간의 단결', icon: '🤝', cd: 12, price: 140, kind: 'shieldPct', amount: 0.06, /* 2026-11-26 종족 유물 +20%: 0.05 */ tag: { race: 'human' }, per: 0.25, desc: '아군에게 최대 체력의 {a}%만큼 보호막을 씌운다. 인간 1명마다 효과가 25% 커진다.' },
      { id: 'bulwark', grade: 2, name: '방패벽', icon: '🧱', cd: 10, price: 160, kind: 'shieldPct', amount: 0.3, tag: { job: 'guardian' }, only: true, desc: '기사 아군에게 최대 체력의 {a}%만큼 보호막을 씌운다.' },
      { id: 'volley',  grade: 3, name: '일제 사격', icon: '🏹', cd: 8,  price: 180, kind: 'volley', amount: 1.5, tag: { job: 'archer' }, only: true, desc: '궁수 아군이 각자 무작위 적에게 공격력의 {a}%만큼 피해를 준다.' },
      { id: 'arcane',  grade: 3, name: '마력 공명', icon: '🔮', cd: 10, price: 170, kind: 'energyAll', amount: 40, tag: { job: 'mage' }, only: true, desc: '마법사 아군의 궁극기 에너지를 {a} 채운다.' },
      { id: 'chorus',  grade: 4, name: '합주',   icon: '🎶', cd: 12, price: 200, kind: 'hasteAll', amount: 0.15, dur: 5, tag: { job: 'bard' }, per: 0.6, desc: '{d}초 동안 아군 공격 속도가 {a}% 빨라진다. 서포터 1명마다 효과가 60% 커진다.' },
      { id: 'resonance', grade: 4, name: '원소 공명', icon: '🌈', cd: 11, price: 200, kind: 'atkBuff', amount: 0.06, dur: 5, tag: { el: '*' }, per: 1, desc: '{d}초 동안 아군 공격력이 {a}% 오른다. 가장 많은 같은 속성 1명마다 {a}%씩 더 오른다.' },
      // 연계 스킬(trigger, 2026-11-18): 쿨타임 없이 전투 내내 켜져 있어요. 조건(tag)에 맞는 아군에게 그 일이 생길 때마다 공격력이 amount씩 쌓여요(최대 max번)
      //   조건이 좁을수록(특정 종족·속성) 한 번에 오르는 양이 커요. to: 'self'면 일으킨 영웅만, 아니면 조건 맞는 아군 모두
      // ── 열 유물(2026-11-23): trigger 'line' = 전투 시작 때 선 열(0 전방 · 1 중반 · 2 후반)에 한 번 걸려요. 쿨타임 없음 ──
      { id: 'steelwall', grade: 2, name: '강철 방패', icon: '🛡️', cd: 0, price: 160, kind: 'lineGuard', trigger: 'line', line: 0, amount: 0.2, desc: '[전방열] 전방열 아군이 받는 피해가 {a}% 줄어든다.' },
      { id: 'spikemail', grade: 2, name: '가시 갑옷', icon: '🦔', cd: 0, price: 150, kind: 'lineThorns', trigger: 'line', line: 0, amount: 0.15, desc: '[전방열] 전방열 아군이 맞으면 받은 피해의 {a}%를 되돌려 준다.' },
      { id: 'warhorn', grade: 1, name: '지휘 북', icon: '🪘', cd: 0, price: 140, kind: 'lineEnergy', trigger: 'line', line: 1, amount: 30, desc: '[중반열] 중반열 아군이 궁극기 에너지 {a}을 들고 시작한다.' },
      { id: 'linkring', grade: 2, name: '연결 고리', icon: '🔗', cd: 0, price: 150, kind: 'lineCare', trigger: 'line', line: 1, amount: 0.3, desc: '[중반열] 중반열 아군이 받는 회복과 보호막이 {a}% 커진다.' },
      { id: 'hawknest', grade: 2, name: '매의 둥지', icon: '🪺', cd: 0, price: 160, kind: 'lineHaste', trigger: 'line', line: 2, amount: 0.2, desc: '[후반열] 후반열 아군의 공격 속도가 {a}% 빨라진다.' },
      { id: 'shadowcloak', grade: 3, name: '은신 망토', icon: '🧥', cd: 0, price: 180, kind: 'lineHide', trigger: 'line', line: 2, amount: 5, desc: '[후반열] 후반열 아군은 처음 {a}초 동안 적의 목표가 되지 않는다.' },
      { id: 'lonewolf', grade: 3, name: '홀로 선 자', icon: '🐺', cd: 0, price: 180, kind: 'lineAtk', trigger: 'line', alone: true, amount: 0.3, desc: '[열] 열에 아군이 혼자 서 있으면 그 아군의 공격력이 {a}% 오른다.' },
      { id: 'phalanx', grade: 2, name: '밀집 대형', icon: '🧱', cd: 0, price: 160, kind: 'lineDef', trigger: 'line', full: 3, amount: 30, desc: '[열] 열에 아군이 3명 서 있으면 그 열 아군 모두 방어가 {a} 오른다.' },
      // ── 별 유물(2026-11-23): 별 수로 세요(일반 ★3 = 3). 왕관은 전투 시작 때, 디딤돌은 ★1·★2 아군이 쓰러질 때 ──
      { id: 'starcrown', grade: 3, name: '별빛 왕관', icon: '👑', cd: 0, price: 180, kind: 'starCrown', trigger: 'line', amount: 0.02, desc: '[별] 아군 별 합계 1개마다 아군 전체 공격력이 {a}% 오른다.' },
      { id: 'steppingstone', grade: 2, name: '디딤돌', icon: '🪨', cd: 0, price: 150, kind: 'starStep', trigger: 'death', amount: 40, desc: '[별] ★1·★2 아군이 쓰러지면 같은 열에서 별이 가장 높은 아군의 궁극기 에너지가 {a} 찬다.' },
      { id: 'fervor',  grade: 1, name: '전장의 열기', icon: '🔥', cd: 0, price: 120, kind: 'stack', trigger: 'attack', amount: 0.005, max: 30, desc: '아군이 평타를 칠 때마다 아군 공격력이 {a}% 오른다. 최대 {m}번 쌓인다.' },
      { id: 'resolve', grade: 2, name: '인간의 기세', icon: '⚔️', cd: 0, price: 150, kind: 'stack', trigger: 'attack', tag: { race: 'human' }, amount: 0.025, /* 2026-11-26 종족 유물 +25%: 0.02 */ max: 15, desc: '[인간] 인간 아군이 평타를 칠 때마다 인간 아군 공격력이 {a}% 오른다. 최대 {m}번 쌓인다.' },
      { id: 'kindle',  grade: 3, name: '불씨', icon: '🕯️', cd: 0, price: 180, kind: 'stack', trigger: 'burn', tag: { el: 'fire' }, amount: 0.02, max: 20, desc: '[불] 화상 피해가 들어갈 때마다 불 아군 공격력이 {a}% 오른다. 최대 {m}번 쌓인다.' },
      { id: 'pulse',   grade: 3, name: '숲의 맥박', icon: '🌿', cd: 0, price: 180, kind: 'stack', trigger: 'haste', tag: { el: 'forest' }, to: 'self', amount: 0.03, max: 12, desc: '[숲] 숲 아군이 가속을 얻을 때마다 그 아군 공격력이 {a}% 오른다. 최대 {m}번 쌓인다.' },
      { id: 'rime',    grade: 3, name: '서리 손아귀', icon: '🧊', cd: 0, price: 180, kind: 'stack', trigger: 'chill', tag: { el: 'water' }, amount: 0.02, max: 15, desc: '[얼음] 얼음으로 적을 느리게 할 때마다 얼음 아군 공격력이 {a}% 오른다. 최대 {m}번 쌓인다.' },
      { id: 'grace',   grade: 3, name: '빛의 축복', icon: '✨', cd: 0, price: 180, kind: 'stack', trigger: 'heal', tag: { el: 'light' }, amount: 0.02, max: 15, desc: '[빛] 빛 아군이 회복할 때마다 빛 아군 공격력이 {a}% 오른다. 최대 {m}번 쌓인다.' },
      { id: 'dread',   grade: 4, name: '암흑의 공포', icon: '🌑', cd: 0, price: 210, kind: 'stack', trigger: 'stun', tag: { el: 'dark' }, amount: 0.06, max: 10, desc: '[어둠] 적을 기절시킬 때마다 어둠 아군 공격력이 {a}% 오른다. 최대 {m}번 쌓인다.' }
    ]
  },
  // 상점: 전투가 끝날 때마다 무작위 stock개가 새로 들어와요. 가격 = price × priceGrowth^(깬 스테이지 수)
  // 새로고침 비용 = refresh × refreshGrowth^(이번 판 새로고침 횟수), 전투가 끝나면 횟수 초기화
  // 스킬 판매가 = 지금 상점가 × 레벨 × sellRate (오래되거나 등급이 낮은 스킬을 팔아 자리를 비워요)
  // ───── 플레이어 체력 ─────
  // 지면 살아남은 적들이 왼쪽으로 걸어 나가며 체력을 깎아요. 적 1명마다 base + perGrade × (등급 − 1) (일반 1 · 고급 2 · 희귀 3 · 전설 4), 보스는 + bossExtra
  // 체력이 남아 있으면 같은 판에 다시 도전해요. 0이 되면 패배: 판 전체가 1-1부터 다시 시작해요(영웅·스킬·골드·마나스톤·레벨 모두 처음으로)
  // recoverOnBoss: 장 보스(10번째 판)를 깨면 체력이 다 차요
  // consolation 위로금(2026-11-22): 진 판 골드 = 클리어 골드 × perDamage × 적에게 준 피해 비율(최소 min). 한 명도 못 잡아도 받아요. 연패할수록 × (1 + streakBonus × (연패 − 1)), streakMax연패까지
  //   지면 상점이 그대로 남으니, 이 골드로 남은 물건을 살 수 있어요
  life: { enabled: true, max: 10, perLevel: 1, lastStand: true, /* 2026-11-24: 플레이어 레벨업마다 하트 +1(최대 없음, 시작 max는 10). lastStand: 한 판(런)에 처음 0이 되면 죽지 않고 1로 남음 */ base: 1, perGrade: 1, bossExtra: 0, recoverOnBoss: true, consolation: { perDamage: 0.5, min: 0.1, minGold: 50, streakBonus: 0.5, streakMax: 3 }, loseCampfire: true, // loseCampfire(2026-11-22): 지면(체력이 남았을 때) 모닥불이 나와 영웅 1명을 룰렛으로 받고 같은 판에 다시 도전 // minGold: 지면 적어도 이만큼 (2026-11-24: 200 → 50. 진 판이 이긴 판(120G~)보다 많이 받던 문제. 50 = 상점 리셋 1번 값)
  },

  // ───── 마나스톤 (두 번째 재화) ─────
  // 전리품 룰렛에 가끔(loot.chance) 마나스톤 칸이 1개 끼어요(amount개). 상점에서 높은 등급 스킬을 살 때 들어요(skillCost: 사고 난 뒤의 스킬 등급 → 개수).
  // exclusive: true면 상점 물건마다 재화가 하나예요. skillCost에 있는 등급(희귀·전설)은 마나스톤만, 그 아래(일반·고급)는 골드만 받아요
  // 방랑상인 진열은 골드만 받아요(더 비싸게 파는 대신 마나스톤이 없어도 살 수 있는 길).
  // enabled: false면 전리품에 안 나오고 상점도 골드만 받아요 (화면이 마나스톤을 다룰 준비가 되면 켜요)
  mana: { enabled: false, exclusive: true, // 2026-11-21: 마나스톤 꺼 봄(골드 하나로). 다시 켜면 상점 rows.mana·몹·상자·덤도 되돌려야 해요
    name: '마나스톤', loot: { chance: 0.15, amount: 1 }, skillCost: { 3: 1, 4: 2 } },

  // rows: 두 줄 진열 (마나스톤 exclusive일 때). 윗줄 골드로 사는 물건 gold개, 아랫줄 마나스톤으로 사는 물건 mana개. 없으면 stock개 한 줄
  // 2026-11-22: 상점 윗줄 영웅 heroes칸(값 = heroPrice × 등급 × priceGrowth^깬 판), 아랫줄 유물. 새로고침 없음(refresh 0) — 판을 깨야 새로 채워져요
  shop: { rows: { gold: 4, mana: 0 }, heroes: 0, heroPrice: 110, stock: 3, priceGrowth: 1, /* 2026-11-24: 1.12 → 1. 유물·룰렛 리셋·상인·용병 가격 고정 */ refresh: 50, refreshGrowth: 1, refreshMax: 1, // refresh(2026-11-23): 상점 리셋 50G 고정, 스테이지마다 refreshMax번 (화면 "리셋 50G (1)", 누르면 (0), 다음 스테이지로 넘어가면 다시 채워져요). 예전 0(끔)
    sellRate: 0.5, tagBoost: 1 }, // tagBoost(2026-11-21): 내 영웅 태그에 맞는 유물이 맞는 영웅 1명마다 1배씩 더 잘 나와요(상점·두루마리)

  startLevel: 1,
  // ───── 위험 종 ─────
  // 전투 전에 종을 울려(0~max번) 판을 키워요. 한 번 울릴 때마다 적 enemy명 추가, 그 자리에서 바로 골드 = 클리어 골드(레벨별) × instant[몇 번째] 획득.
  // 지면 종으로 받은 골드는 그대로 둬요(2026-11-23). 대신 같은 판에 다시 도전할 때는 이미 받은 횟수만큼 골드가 없어요(2026-11-24, bellPaid). gold·lootGold는 0이면 꺼짐
  // 늘어난 적도 전리품 후보에 들어가요. 적은 세지지 않아요. 종은 어느 판이든 max번까지 울릴 수 있고, 적은 5명을 넘어 최대 5+max명까지 늘어요
  // skill: 종 1번마다 적 스킬 +N개(2026-11-18). 있던 스킬은 그대로 두고 뒤에 붙어요(최대 skills.slots)
  // 2026-11-21: 종 효과가 무작위로 바뀌었어요. k번째로 울리면 tiers[k-1]에서 하나가 나와요(같은 판·같은 레벨이면 늘 같은 효과). enemy·skill은 이제 안 써요(0)
  //   rage 적 공격력 +v · tough 적 체력 +v · haste 적 공격 속도 +v · relic 적 유물 +1 · star 적 1명 별 +1 · elite 한 등급 위 영웅 1명 추가 · endure 적 전체 첫 쓰러짐 1번 버팀
  //   (more·energy·curse도 엔진에 남아 있어요. tiers에 넣으면 다시 써요)
  bell: { max: 3, enemy: 0, skill: 0, instant: [0.2, 0.3, 0.5], /* 2026-11-25: k번째 종 = 클리어 골드 × instant[k-1] (3번이면 클리어 골드만큼). 예전 0.6 × 120 = 72G 고정 */ gold: 0, lootGold: 0,
    tiers: [['more'], ['relic'], ['star']], // 2026-11-23: 순서 고정 — 1번 적 추가 · 2번 적 유물 · 3번 무작위 적 별 +1. 예전 [['rage','tough','haste'],['relic','star'],['elite','endure']]
    fx: {
      rage:   { name: '분노', icon: '💢', v: 0.15, desc: '적 전체의 공격력이 15% 오른다.' },
      tough:  { name: '단단함', icon: '🪨', v: 0.2, desc: '적 전체의 체력이 20% 오른다.' },
      star:   { name: '정예', icon: '⭐', v: 1, desc: '적 1명이 별 하나 위로 나온다.' },
      endure: { name: '불굴', icon: '🛡️', v: 1, desc: '적 전체가 처음 쓰러질 때 한 번 체력 1로 버틴다.' },
      more:   { name: '증원', icon: '➕', v: 1,    desc: '적 1명이 더 나온다.' },
      haste:  { name: '성급함', icon: '💨', v: 0.15, desc: '적 전체의 공격 속도가 15% 빨라진다.' },
      relic:  { name: '발굴', /* 2026-11-26: 적 유물 → 발굴(사용자) */ icon: '📜', v: 1,    desc: '적 팀이 유물 1개를 더 갖는다.' },
      energy: { name: '선제', icon: '⚡', v: 50,   desc: '적 전체가 궁극기 에너지 50을 들고 시작한다.' },
      elite:  { name: '강적 출현', icon: '👑', v: 1, desc: '한 등급 위 영웅 1명이 더 나온다.' },
      curse:  { name: '저주', icon: '🕯️', v: 0.3, desc: '우리 팀의 회복량과 보호막이 30% 줄어든다.' },
      swamp:  { name: '늪지대', icon: '🌿', v: 1, desc: '적 쪽 늪지대 1칸이 늘어난다.' } /* 2026-11-27 이름 늪 확장 → 늪지대 (사용자: "분노3단계 늪확장>늪지대 늪지대1칸이") */ // 2026-11-26: 2장 분노 3단계(정예 대신)
    } },

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
    stageKinds: ['campfire', 'merchant', 'chest', 'altar', 'mobs', 'fairy', 'groll', 'mimic', 'dais', 'swampShop'], /* 2026-11-26: swampShop 늪지 상인(2장, 방랑상인 그룹) */ /* 2026-11-26: dais 단상 */ // 2026-11-26: 홀짝(oddeven) 뺌(사용자: 이벤트에서 홀짝은 제거해). 되돌리려면 'oddeven'을 넣고 weights에 oddeven 추가
    fixed: { 1: 'fairy' }, // 2026-11-22 몹 판 끔(예전 2: 'mobs') // 2026-11-21: 1-2 앞엔 요정, 1-3 앞엔 몹이 꼭 나와요 { 스테이지 번호(0부터): 이벤트 }
    fork: false, // 2026-11-22 끔(사용자: 우측 선택지는 하나만). 갈림길: 이벤트 스테이지가 나오면 2개 중 골라요 (fixed 판은 그대로)
    off: [], // 도구: 여기 적은 이벤트 종류는 안 나와요(예: ['chest']). campfire를 끄면 시작 모닥불도 없어요 (2026-11-18)
    forceEvery: 0, // 도구: N이면 스테이지 N개마다 이벤트 스테이지가 100% 나와요(2면 1-2·1-4 뒤에). 0이면 꺼짐(평소 확률 chance)
    from: 2, chance: 0.18, weights: { goblin: 0, /* 2026-11-26 홀짝(oddeven) 뺌 → groll(돈고블린 룰렛) */ groll: 3, merchant: 3, merc: 3, campfire: 2, chest: 0, /* 2026-11-26 보물상자 → 미믹(mimic). 되돌리려면 chest 3, mimic 0 */ mimic: 3, altar: 3, mobs: 0, fairy: 3, dais: 3 /* 2026-11-26 단상 화면 연결 */ }, // chest: 화면 작업이 끝나서 3으로 켰어요 (2026-11-18 UI 세션) // campfire: 화면 작업이 끝나서 2로 켰어요 (2026-11-18 UI 세션)
    // 도감 이벤트 탭용 이름·설명 (2026-11-21)
    info: {
      campfire: { name: '모닥불', desc: '모닥불에 둘러앉은 영웅 중 1명이 룰렛으로 동료가 된다. 전투는 없다.' },
      merchant: { name: '방랑상인', desc: '희귀 이상 유물과 영웅을 싸게 파는 특별 상점이 열린다. 전투는 없다.' },
      swampShop: { name: '늪지 상인', desc: '물약을 판다. 물약은 마신 그 전투에서만 힘이 되고, 전투가 끝나면 사라진다.' }, // 2026-11-27 (사용자: "물약을 판다 물약이 뭔지 알려주면 끝")
      chest:    { name: '보물상자', desc: '정해진 시간 동안 상자를 때린다. 많이 깎을수록 골드·마나스톤·유물 보상이 쌓인다. 지지 않는다.' },
      altar:    { name: '초월 제단', desc: '백팩 영웅을 재료로 넣어 전장 영웅을 초월시킨다. 초월은 여기서만 할 수 있다.' },
      fairy:    { name: '요정', desc: '요정이 유물 룰렛을 돌려 1개를 준다. 전투는 없다.' },
      mobs:     { name: '몹', desc: '몹 1마리가 나온다. 쓰러뜨리면 그 몹의 전리품 중 1개를 룰렛으로 얻는다. 져도 체력이 닳지 않는다.' },
      mimic:    { name: '미믹', desc: '미믹 여러 마리가 나온다. 미믹은 색깔별로 방해한다(갈색 둔화, 파랑 실명, 왕관 밀치기). 방해할 때 피해 1을 준다. 시간 안에 잡은 미믹마다 보상을 받는다. 지지 않는다.' },
      groll:    { name: '돈고블린 룰렛', desc: '돈고블린에게 골드를 내고 룰렛을 돌린다. 나온 것을 받거나 포기한다. 골드 칸은 낸 골드의 2배. 전투는 없다.' },
      oddeven:  { name: '돈고블린 홀짝', desc: '돈고블린과 홀짝 내기를 한다. 맞히면 건 골드의 2배를 받고, 틀리면 건 골드를 잃는다. 전투는 없다.' },
      dais:     { name: '양탄자', desc: '밤하늘 털을 지닌 양이 마법 털로 짠 양탄자를 우리 쪽 무작위 칸에 깔아 준다. 종류는 룰렛으로 정한다. 그 칸에 선 영웅은 양탄자의 종족이나 속성이 더해진다. 양탄자는 다음 판에도 남는다. 전투는 없다.' }, // 2026-11-26: 이름 단상 → 양탄자(사용자: "이거 단상이라고 안 하고 양탄자라고 할게"). id는 dais 그대로
      merc:     { name: '떠돌이 용병', desc: '용병이 적 편에서 함께 싸운다. 이기면 골드를 내고 바로 영입할 수 있다.' }
    },
    campfire: { count: 6, atStart: true, startPicks: 1 }, /* 2026-11-27: 시작 모닥불은 1개만 고름. 영구 강화 가운데 칸(모닥불)을 찍으면 +1 (사용자: "첨 시작하면 2개고르잖아. 1개만고르게해. 그리고 여기서 찍으면 1개더"). 예전 2 */ // 2026-11-22: 3 → 6 (모닥불 둘레 6칸)
    // altar 초월 제단(2026-11-18 새로): 전투 없는 이벤트 스테이지(번호는 직전 그대로). 여기서만 초월할 수 있어요(transcend.at). 제단마다 1번(transcend.perAltar) 하고 나가면 다음 스테이지로 가요
    altar: {},
    // dais 양탄자(2026-11-26, 처음 이름은 단상): 받으면 무작위 단상 1개(종족 또는 속성, kinds 비중). 우리 쪽 칸에 놓고, 그 칸에 선 영웅은 그 종족·속성이 더해져요(원래 것은 그대로, 진영 발판과 같은 구조). 다음 판에도 남아요(개수 제한 없음)
    //   2026-11-26: 칸은 판에 들어올 때 양탄자 없는 칸 중 무작위로 고정(rollDaisCell). 모든 칸에 양탄자가 있을 때만 그중 한 칸을 덮어요(대체). 개수 제한 없음. 리셋은 종류만, player.daisReroll[레벨]번. 값은 룰렛 리셋과 같아요(lootRerollPrice, 2026-11-26 사용자: "리셋 가격 표시해주고, 옆에 리셋 기회도 표시"). 직업은 안 붙어요(사용자: "직업은 아님")
    dais: { kinds: { race: 1, el: 1 }, grade: 4 /* 2026-11-26: 양탄자 등급은 전설(사용자: "양탄자는 등급이 전설이야"). 틀·이름 색은 전설 등급색 */ }, // 2026-11-26: 개수 제한(max 2) 없앰
    // 이벤트 대사 말풍선(2026-11-26, 사용자: "이벤트 스테이지에서 진입 시랑 버튼 누른 뒤 대사하듯이 말하면 생명력이 잇을거같아" / "말할때 타이핑연출로" / "버튼 누른뒤라는건 저때가 아니라 이벤트 종료 후"). enter: 판에 들어와 캐릭터가 다 나온 뒤 한 번, done: 이벤트를 마친 뒤(받기·구매·초월·영입 등을 끝내고 팝업이 닫힌 뒤) 한 번. 줄마다 하나를 무작위로 골라요. 타이핑 연출, 전투 중에는 안 나와요
    lines: {
      campfire: { enter: ['어서 와! 여행을 해 보자!', '어서 와, 같이 갈 사람을 찾고 있었어!', '반가워! 불 좀 쬐고 가!'], done: ['좋은 여행 되길!', '잘 부탁해!', '조심히 다녀와!'] }, // 2026-11-26: 모닥불 오른쪽 자리(둘레 2번째, CF_POS[1]) 영웅이 말해요(사용자: "말풍선은 이 위에 넣어 줘. 어서 와 여행을 해 보자! 이런 걸로"). 예전 '... ...'
      merchant: { enter: ['오늘만 이 가격!', '어서 오세요~', '귀한 물건 있어요.'], done: ['또 오세요~', '좋은 거래였어요!', '길 조심해요.'] },
      swampShop: { enter: ['개굴, 물약 사 가!', '늪에선 이게 최고지.', '한 모금이면 힘이 나!'], done: ['쭉 들이켜!', '개굴~ 또 와!', '늪 조심해!'] },
      groll:    { enter: ['한 판 해 볼 텨?', '운 좀 시험해 봐!', '골드 있지? 히히.'], done: ['다음엔 대박이야!', '또 와, 히히.', '재밌었지?'] },
      fairy:    { enter: ['반짝반짝, 선물 줄게!', '어머, 손님이네?', '반짝! 기다렸어~'], done: ['잘 다녀와!', '조심히 다녀와~', '또 놀러 와!'] }, // 사용자: "요정이면 반짝반짝 선물줄게! 버튼 누른뒤 잘 다녀와! 이런느낌"
      dais:     { enter: ['음매~ 별빛 털 보여 줄까?', '밤하늘로 짠 깔개야.', '포근한 힘이 필요해?'], done: ['깔개 잘 써 줘~', '별빛이 함께하길.', '음매, 또 봐!'] }, // 2026-11-26: 단상 캐릭터 = 밤하늘 털 양(자기 마법 털로 짠 깔개를 깔아 힘을 줌)
      altar:    { enter: ['천칭이 기울었네요…', '힘을 원하나요?', '와서 앉아요.'], done: ['균형이 맞춰졌어요.', '힘이 하나가 됐어요.', '잘 다루세요.'] } // 떠돌이 용병·미믹·단상은 대사 없음(사용자: "떠돌이는 제외 미믹도")
    },
    goblin:   { goldMul: 2.5, flee: 10, speed: 90 },
    // merchant 방랑상인(2026-11-18 바뀜): 전투 없는 이벤트 스테이지예요(번호는 직전 그대로). 들르면 특별 상점만 열리고, 나가면 다음 스테이지로 가요
    //   battle: false = 전투 없음. 진열 = 희귀 이상 스킬 skills개 + 영웅 heroes명. 값은 원래 값(스킬은 상점 값·재화 그대로, 영웅은 heroPrice 식) × discount, 최소 minPrice
    swampShop: { count: 4 }, // 2026-11-26 늪지 상인: 물약 count개를 팔아요(겹치지 않게). 2026-11-27부터는 player.swampSlots(레벨별)가 있으면 그걸 씀. 들 수 있는 개수는 player.potion(레벨별)
    merchant: { battle: false, skills: 2, minGrade: 3, discount: 0.5, minPrice: 1, heroes: 1, heroPrice: 110, offMin: 0.5, offStep: 5, reroll: { cost: 50, max: [1] } }, // 2026-11-26: 상품마다 할인율 다름(최대 할인율×offMin ~ 최대, 5% 단위, 1개는 최대). reroll: 방랑상점 다시 돌리기 비용·횟수(플레이어 레벨별 표, 지금 모든 레벨 1번)
    // chest 보물상자(2026-11-18 새로): 그 판에는 보물상자 1마리만 나와요. 공격도 이동도 안 하고 단단하기만 해요. dur초가 지나면 사라져요
    //   입힌 피해 비율(최대 체력 대비)이 tiers의 at을 넘을 때마다 그 칸 보상을 더해 받아요(누적). gold는 그 스테이지 클리어 보상 × 값, mana는 마나스톤 개수, scroll은 스킬 두루마리 개수
    //   지는 일이 없어요(체력도 안 닳아요). 판 클리어 골드·경험치는 없고 칸 보상만 받아요
    //   종: 울릴 때마다 상자가 업그레이드돼요. 체력 ×(1 + bell.hp × 횟수), 보상 ×(1 + bell.reward × 횟수)(마나·두루마리는 내림, 최소 원래 개수). 이 판에서는 종 즉시 골드가 없어요
    // mimic 미믹(2026-11-26, 보물상자 판 대신): 미믹 player.mimicCount[레벨]마리(Lv kingFrom부터 1마리는 왕관 미믹). 공격 안 함, every초마다 영웅 1명 방해
    //   일반 = 둔화(slowDur초, slowAmt), 왕관 = 밀치기(knock px + knockStun초 기절). dur초가 지나면 남은 미믹은 도망. 잡은 미믹마다 보상(구간 보상·말풍선 없음)
    //   보상: 일반 = 클리어 골드 × gold, 왕관 = 유물 1개 + 클리어 골드 × kingGold. 체력 = mobs의 mimic·mimicKing hp × 스테이지 배율. slots = 적 쪽 칸 번호
    // 2026-11-26 배치: 1열(우리 쪽에 가까운 줄) 갈색, 2열 파랑, 3열 가운데 왕관. 칸 번호는 battle.arena.pos 순서(0 = 1열 가운데, 2 = 1열 위, 3 = 2열 가운데, 5 = 2열 위, 6 = 3열 가운데). 갈색 짝수·파랑 홀수 칸은 화면 색 고르기(slot % 2)와 맞춤
    //   blueHp: 파랑 미믹 체력 배율(갈색보다 셈). blueRange: 파랑 미믹 사거리(mid = 2칸, 갈색은 melee 1칸, 왕관은 mobs의 far 4칸). dmg: 방해할 때 그 영웅에게 주는 고정 피해. 방해는 색깔별: 갈색 둔화(slow*), 파랑 실명(blind*: blindDur초 동안 평타가 blindAmt 확률로 빗나감), 왕관 밀치기(knock*)
    mimic: { dur: 20, kingFrom: 7, slowDur: 2, slowAmt: 0.4, knock: 40, knockStun: 0.4, gold: 0.3, kingGold: 0.5, blueHp: 1.5, blueRange: 'mid', dmg: 1, blindDur: 2, blindAmt: 0.5, slots: { w: [0, 2, 1], b: [3, 5, 4], k: [6] } },
    // 미믹 방해 스킬 이름·설명(2026-11-26, 상세 창 스킬 칸용). w 갈색, b 파랑, k 왕관. 평타(공속 = mobs의 interval, 피해 = dmg)로 에너지가 차면 쓴다. 위 숫자(slowDur·blindAmt·knock 등)를 바꾸면 설명도 같이 고친다
    mimicSkills: {
      w: { name: '끈적한 침', desc: '에너지가 차면 영웅 1명을 2초 동안 40% 느리게 한다.' },
      b: { name: '먹물 뿜기', desc: '에너지가 차면 영웅 1명의 평타가 2초 동안 50% 확률로 빗나가게 한다.' },
      k: { name: '뚜껑 박치기', desc: '에너지가 차면 영웅 1명을 뒤로 밀치고 0.4초 기절시킨다.' }
    },
    chest: { dur: 15, // 체력·방어는 mobs의 chest 값 (스테이지 레벨·초반 배율을 똑같이 받아요)
      tiers: [ { at: 0.25, gold: 0.5 }, { at: 0.5, gold: 1 }, { at: 0.75, gold: 0.5, scroll: 1 }, { at: 1, gold: 1.5 } ],
      bell: { hp: 0.5, reward: 0.7 }, // grades가 있으면 안 써요 (2026-11-24: 보물상자 판에는 용 버튼 없음)
      // grades(2026-11-24): 상자 등급 = player.chestGrade[레벨]. 등급이 높을수록 체력(hp 배율)이 크고 보상 칸이 많아요(3/4/5칸). tiers 형식은 위와 같아요
      grades: [
        { hp: 1,   tiers: [ { at: 1/3, gold: 0.5 }, { at: 2/3, gold: 1 }, { at: 1, gold: 1, scroll: 1 } ] },
        { hp: 1.5, tiers: [ { at: 0.25, gold: 0.5 }, { at: 0.5, gold: 1 }, { at: 0.75, gold: 0.5, scroll: 1 }, { at: 1, gold: 1.5 } ] },
        { hp: 2.2, tiers: [ { at: 0.2, gold: 0.5 }, { at: 0.4, gold: 1 }, { at: 0.6, gold: 0.5, scroll: 1 }, { at: 0.8, gold: 1 }, { at: 1, gold: 1.5, scroll: 1 } ] } ] },
    // mobs 몹 무리(2026-11-21 새로): 이벤트 스테이지(번호는 직전 그대로). 영웅 대신 drops가 있는 몹 1마리가 나와요(체력 × hp). drops 칸이 미리 정해져요
    //   몹을 쓰러뜨리면 그 몹의 drops 칸 중 1개가 룰렛으로 나와요. 못 쓰러뜨려도 지지 않아요(체력 안 닳음, 보상 없음). 판 클리어 골드는 없어요
    //   drops 키: g 골드(그 스테이지 클리어 보상 × gold) · m 마나스톤 mana개 · s 유물 두루마리 1개(상점 확률) · p 진영 발판 1개(속성 무작위). 같은 키를 여러 번 적으면 더 잘 나와요
    mobs: { gold: 0.6, mana: 1, hp: 1 }, // 2026-11-22: 몹 종류마다 pack마리, 1마리당 loot개 전리품(말풍선). 쓰러뜨린 몹의 전리품을 모두 받아요(최대 3개). 체력은 몹의 hpMul
    // fairy 요정(2026-11-21): 전투 없는 이벤트 스테이지(번호는 직전 그대로). 유물 count개가 룰렛에 올라 1개를 얻어요(상점 확률·내 영웅 태그 가중). 칸이 꽉 차면 못 받아요(봇은 버려요)
    fairy: { count: 4, triggerAt: [1] }, // triggerAt: 이 스테이지 번호(0부터)의 요정은 연계 유물(trigger)만 후보로 내요 (1 = 1-2 앞)
    // oddeven 돈고블린 홀짝(2026-11-21): 전투 없는 이벤트 스테이지(번호는 직전 그대로). 돈고블린이 내기를 걸어요. 골드 bet(그 스테이지 클리어 보상 × bet)을 걸고 홀/짝을 고르면,
    //   맞히면 건 돈 × win을 돌려받고(원금 포함), 틀리면 건 돈을 잃어요. 안 걸고 지나가도 돼요. 골드가 모자라면 걸 수 없어요. (전투 중 돈고블린은 weights 0으로 꺼짐)
    // groll 돈고블린 룰렛(2026-11-26, 홀짝 대신): 전투 없는 이벤트 스테이지. 돌릴 때마다 골드 = 그 판 클리어 골드 × cost. 후보는 전투 승리 룰렛과 같고(그 판 적 영웅·유물, 레벨 가중치),
    //   골드 칸은 낸 골드 × goldWin. 결과는 받거나 포기(리셋 없음). 돌리는 횟수는 player.grollSpins(레벨별)
    //   2026-11-26: 후보는 전투 룰렛이 아니라 이 표로 따로 뽑아요(상점처럼 레벨별 등급 가중치). 같은 스테이지 안에서는 돌릴 때마다 같은 구성
    groll: { cost: 1, goldWin: 2, heroes: 4, skills: 1, goldSlots: 1,
      grade: [[70, 25, 5, 0], [65, 28, 7, 0], [55, 30, 13, 2], [50, 32, 15, 3], [42, 33, 19, 6],   // [일반, 고급, 희귀, 전설] 레벨 1~10. 처음 값은 player.shopGrade와 같게
              [36, 34, 22, 8], [30, 34, 25, 11], [25, 33, 28, 14], [20, 32, 30, 18], [15, 30, 33, 22]] },
    oddeven: { bet: 1, win: 2, maxBets: 3 }, // 2026-11-24: 가운데 버튼으로 bet만큼씩 최대 maxBets번 넣어요(누를 때마다 골드 차감). 맞히면 넣은 합 × win
    // 진영 발판(2026-11-21, 22 바뀜): 몹 전리품 'p'. 받으면 빈 칸 중 무작위 한 곳에 깔려요. 그 칸에 선 영웅은 누구든 전투 동안 발판 진영이 더해져요(원래 진영은 그대로)
    //   (속성 시너지·상성·속성 고유 효과·속성 조건 유물 모두 바뀐 속성으로 쳐요). 판이 새로 시작되면 사라져요
    merc:     { price: 90, costPlus: 1 } // 용병 코스트는 그 스테이지 적 최고 코스트 + costPlus까지
  },
  // 특수 몹 (영웅 목록과 따로). 능력치는 스테이지 레벨·배율을 똑같이 받아요
  mobs: [
    { id: 'goblin', name: '돈고블린', mob: 'goblin', race: 'monster', job: null, el: 'dark', range: 'melee', role: 'warrior', cost: 0, art: false,
      hp: 1100, atk: 0, def: 40, interval: 1, ultName: '', ult: null, passive: null },
    // 보물상자: 공격·이동 안 함 (events.chest)
    { id: 'chest', name: '보물상자', mob: 'chest', race: 'monster', job: null, el: 'earth', range: 'melee', role: 'warrior', cost: 0, art: false,
      hp: 10000, atk: 0, def: 60, interval: 99, ultName: '', ult: null, passive: null },
    // 미믹(2026-11-26, events.mimic): 공격 안 함, 방해만. king = 왕관 미믹
    { id: 'mimic', name: '미믹', mob: 'mimic', race: 'monster', job: null, el: 'earth', range: 'melee', role: 'tank', cost: 0, art: false,
      hp: 3000, atk: 0, def: 60, interval: 1, /* 2026-11-26: 공속 1(평타 = events.mimic.dmg 고정 피해) */ ultName: '', ult: null, passive: null },
    { id: 'mimicKing', name: '왕관 미믹', mob: 'mimic', king: true, race: 'monster', job: null, el: 'earth', range: 'far', /* 2026-11-26: 사거리 4칸(침 뱉기) */ role: 'tank', cost: 0, art: false,
      hp: 6000, atk: 0, def: 80, interval: 1, ultName: '', ult: null, passive: null },
    // 몹 무리용 (events.mobs). 그림은 아직 없어요(art: false)
    { id: 'm_slime', name: '슬라임', mob: 'slime', race: 'monster', job: null, el: 'water', range: 'melee', role: 'tank', cost: 0, art: false,
      hp: 1600, atk: 60, def: 100, interval: 1.4, ultName: '', ult: null, passive: null, drops: ['g', 'g', 'p'], pack: 3, loot: 1, hpMul: 1.2 },
    { id: 'm_bat', name: '박쥐', mob: 'bat', race: 'monster', job: null, el: 'dark', range: 'melee', role: 'warrior', cost: 0, art: false,
      hp: 900, atk: 110, def: 60, interval: 0.9, ultName: '', ult: null, passive: null, drops: ['g', 's', 'p'], pack: 2, loot: 1, hpMul: 1.3 },
    { id: 'm_skeleton', name: '해골 병사', mob: 'skeleton', race: 'monster', job: null, el: 'dark', range: 'melee', role: 'warrior', cost: 0, art: false,
      hp: 1200, atk: 120, def: 90, interval: 1.2, ultName: '', ult: null, passive: null, drops: ['g', 's', 's', 'p'], pack: 2, loot: 1, hpMul: 1.6 },
    // 보스급 몹: 혼자 나오고 전리품 3개를 들고 있어요 (그림은 이미지 세션)
    { id: 'm_ogre', name: '오우거', mob: 'ogre', race: 'monster', job: null, el: 'earth', range: 'melee', role: 'tank', cost: 0, art: false, boss: true,
      hp: 2600, atk: 170, def: 120, interval: 1.8, ultName: '', ult: null, passive: null, drops: ['g', 's', 's', 'p'], pack: 1, loot: 3, hpMul: 3 }
  ],

  // ───── 플레이어 레벨 ─────
  // 적을 1명 쓰러뜨릴 때마다 경험치 xpPerKill (진 판에서 쓰러뜨린 적도 쳐요)
  // need[L-1] = L레벨에서 다음 레벨까지 필요한 경험치. 최고 레벨 = need 길이 + 1
  // 아래 표는 레벨별 값(index = 레벨 - 1): field 전장 칸 수, skillSlots 팀 스킬 칸 수,
  // shopGrade 상점 진열 등급 확률 가중치 [일반, 고급, 희귀, 전설]
  // heroBonus 영웅 덤(2026-11-18): 적으로 나온 영웅(전리품)과 모닥불 영웅에 chance[등급] 확률로 덤이 붙어요. 화면은 그 캐릭터 위 말풍선
  //   kinds: 덤 종류 비중 s=유물, g=골드(클리어 보상 × gold), m=마나스톤 mana개
  heroBonus: { chance: { 1: 0.5, 2: 0.35, 3: 0.2, 4: 0.1 }, kinds: { s: 5, g: 3, m: 0 }, gold: 0.5, mana: 1 },
  player: {
    xpPerKill: 1, xpLoseMin: 1, // xpLoseMin(2026-11-22): 진 판에서 처치로 받은 경험치가 이보다 적으면 이만큼은 채워 줘요
    // 레벨업 선택(2026-11-22 바뀜): 레벨이 오르면 둘 중 하나를 골라요. 누르면 룰렛 없이 바로 무작위 1개 강화
    //   relic = 가진 유물 중 무작위 1개 등급 +1(최고 등급 제외) · skill = 가진 영웅 중 무작위 1명의 스킬 레벨 +1(최대 transcend.maxLv)
    levelPick: null, // 2026-11-22 꺼 봄. 켜려면 ['relic', 'skill']
    need:       [2, 3, 4, 5, 6, 7, 8, 9, 10],
    field:      [2, 3, 3, 4, 4, 5, 5, 5, 5, 5],
    daisReroll: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3], // 2026-11-26: 단상 리셋 횟수(값은 룰렛 리셋과 같음)
    eventReroll: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3], // 2026-11-26: 모닥불·요정 룰렛 리셋 횟수(값은 룰렛 리셋과 같음. 사용자: "리셋넣어 플레이어레벨에맞춰서. 페어리도 동일.")
    skillSlots: [4, 5, 5, 6, 6, 7, 8, 8, 9, 10], // 2026-11-22: 유물 칸이 레벨에 따라 열려요(4→10)
    shopSlots:  [3, 3, 4, 4, 5, 5, 6, 6, 6, 6],
    mimicCount: [3, 3, 3, 3, 4, 4, 4, 4, 4, 4], // 2026-11-26: 미믹 판 마리 수(Lv5부터 4마리)
    mimicBlue: [1, 1, 1, 1, 2, 2, 2, 2, 2, 2], // 2026-11-26: 그중 파랑 미믹 수. 나머지는 갈색(왕관은 Lv7부터 1마리, 갈색 자리를 씀)
    grollSpins: [1, 1, 1, 2, 2, 2, 3, 3, 3, 3], // 2026-11-26: 돈고블린 룰렛을 한 판에 돌릴 수 있는 횟수(Lv4·Lv7에 +1)
    merchantSlots:  [3, 3, 4, 4, 5, 5, 6, 6, 6, 6], // 2026-11-26: 방랑상인 상품 수(유물+영웅). 일반 상점 칸 수와 같게 (사용자: "방랑상점도 레벨에 의해 상품 개수 늘어나도록")
    swampSlots:     [4, 4, 4, 4, 5, 5, 6, 6, 6, 6], // 2026-11-27: 늪지 상인이 파는 물약 수. 4개에서 Lv5·Lv7에 1개씩(방랑상인 칸이 열리는 레벨에 맞춤, 임시). 사용자: "늪지 상점도 레벨 제한으로 슬롯 2개 있어. 일단은."
    merchantHeroes: [1, 1, 1, 1, 2, 2, 2, 2, 2, 2], // 2026-11-26: 그중 영웅 수. 나머지는 유물 (events.merchant.skills·heroes 대신 씀)
    campfire:   [3, 3, 4, 4, 5, 5, 6, 6, 6, 6], // 2026-11-23: 모닥불 영웅 수. 3명에서 Lv3·5·7에 1명씩 6명까지. 자리는 둘레 1·3·5번 먼저, 그다음 2·4·6번 // 2026-11-23: 상점 칸 2행×3열 6칸 중 열린 칸. 3칸에서 시작해 Lv3·Lv5·Lv7에 1칸씩 (잠긴 칸에 "LvN" 글자)
    merchantOff: [30, 33, 36, 40, 43, 46, 50, 53, 56, 60], // 2026-11-24: 방랑상인 할인율(%). 레벨이 오르면 더 할인 (events.merchant.discount 대신 씀)
    chestGrade: [1, 1, 1, 2, 2, 2, 2, 3, 3, 3], // 2026-11-24: 보물상자 등급(1~3). Lv4부터 2등급, Lv8부터 3등급
    clearGold:  [120, 140, 160, 180, 200, 220, 240, 260, 280, 300], // 2026-11-24: 스테이지 클리어 골드. 레벨마다 +20 (영구 강화 재료 후보)
    // lootWeight 2026-11-24: 전투 룰렛·모닥불 칸 가중치 [일반, 고급, 희귀, 전설, 골드]. 유물 칸은 유물 등급 열, 마나스톤은 골드 열
    lootWeight: [[10, 5, 2, 1, 10], [10, 5, 2, 1, 10], [10, 5.5, 2.5, 1, 10], [10, 5.5, 2.5, 1.2, 10], [10, 6, 3, 1.5, 10],
                 [10, 6, 3.5, 1.8, 10], [10, 6.5, 4, 2, 10], [10, 6.5, 4, 2.3, 10], [10, 7, 4.5, 2.6, 10], [10, 7, 5, 3, 10]],
    potion:     [1, 1, 2, 2, 2, 3, 3, 3, 3, 3], // 2026-11-26: 물약 칸(들 수 있는 물약 수). Lv3·Lv6에 1칸씩 (사용자: "여러개팔고 레벨로 제한"). 예전 모든 레벨 2칸
    bag:        [5, 5, 6, 6, 6, 7, 7, 7, 7, 7], // 2026-11-26: 백팩 최대 7칸(사용자: "7칸으로할꺼야"). Lv3·Lv6에 1칸씩. 예전 [5,5,6,6,6,7,7,7,8,8] (Lv9에 8칸)
    // heroGrade: 적·용병·상인으로 나오는 영웅 등급 확률 가중치 [일반, 고급, 희귀, 전설] (레벨 1~10)
    heroGrade:  [[85, 15, 0, 0], [70, 25, 5, 0], [58, 30, 11, 1], [48, 32, 17, 3], [40, 32, 23, 5],
                 [32, 32, 28, 8], [26, 30, 33, 11], [20, 28, 37, 15], [15, 26, 40, 19], [10, 24, 42, 24]],
    shopGrade:  [[70, 25, 5, 0], [65, 28, 7, 0], [55, 30, 13, 2], [50, 32, 15, 3], [42, 33, 19, 6],
                 [36, 34, 22, 8], [30, 34, 25, 11], [25, 33, 28, 14], [20, 32, 30, 18], [15, 30, 33, 22]]
  },
  // ───── 영구 강화(2026-11-27 뼈대, 숫자는 모두 임시. 사용자: "일단 임의로하라니까?") ─────
  // 기획: 영구강화_기획안.md 4번. 2026-11-27 자유형 망으로 바꿈(사용자: "응 자유형으로 바꾸자. 그리고 시작은 모닥불로 하자"): 가운데 모닥불 칸에서 갈래가 뻗고, 칸의 req(이어진 앞 칸) 중 하나라도 찍었으면 찍을 수 있어요. lines는 갈래(색 구분용)
  // 2026-11-27 토탈 레벨은 뺐다(영웅 풀이 챕터별이라 혜택이 없어짐, 사용자: "1번뺄게")
  // 칸 종류: key = player 레벨 표 줄에 add씩 더함(cap을 안 넘게) · shift = 레벨 표를 단계만큼 앞당김(등급 확률) · path = 그 값에 add씩 더함 · hero = 직업(job, 'all'은 팀 전체) 능력치 + add
  // cost[i] = i+1단계 비용(훈장). E.metaData(data, state)가 강화를 반영한 data를 돌려줘요(봇·화면 둘 다 이걸 씀)
  meta: {
    medal: { clear: 1, boss: 2, firstClear: 10 }, // 판이 끝날 때 받는 훈장: 판 클리어마다 clear, 보스 판(5·10) +boss, 장 첫 클리어 +firstClear (기획안 3번 초안)
    flatAlso: ['mimicBlue'], // "영구 강화로" 모드에서 칸 key 말고도 Lv1에 고정할 레벨 표 줄(미믹 수에 딸린 파랑 미믹 수)
    lines: [
      { id: 'start', name: '모닥불', nodes: [
        { id: 'start', name: '시작 모닥불 +1', path: 'events.campfire.startPicks', add: 1, cost: [5] } ] }, // 가운데. req 없음 = 처음부터 찍을 수 있음
      { id: 'bag', name: '백팩', nodes: [
        { id: 'bag', req: ['start'], name: '백팩 칸', key: 'bag', add: 1, cap: 7, cost: [6, 12] },
        { id: 'relic', req: ['bag'], name: '유물 칸', key: 'skillSlots', add: 1, cap: 10, cost: [8, 16] },
        { id: 'potion', req: ['bag'], name: '물약 칸', key: 'potion', add: 1, cap: 3, cost: [6, 12] } ] },
      { id: 'shop', name: '상점', nodes: [
        { id: 'shopSlot', req: ['start'], name: '상점 칸', key: 'shopSlots', add: 1, cap: 6, cost: [8, 16] },
        { id: 'shopReset', req: ['shopSlot'], name: '상점 리셋', path: 'shop.refreshMax', add: 1, cost: [6, 12] },
        { id: 'merchSlot', req: ['shopSlot'], name: '상인 상품 수', key: 'merchantSlots', add: 1, cap: 6, cost: [6, 12] },
        { id: 'swampSlot', req: ['merchSlot'], name: '늪지 상인 물약 수', key: 'swampSlots', add: 1, cap: 6, cost: [6, 12] }, // 2026-11-27 (사용자: "말했지 내가? 플레이어레벨 그거 해당하는거 이미.")
        { id: 'merchHero', req: ['merchSlot'], name: '상인 영웅 수', key: 'merchantHeroes', add: 1, cap: 2, cost: [10] },
        { id: 'merchOff', req: ['merchSlot'], name: '상인 할인', key: 'merchantOff', add: 5, cap: 60, cost: [6, 12] },
        { id: 'shopGrade', req: ['shopReset'], name: '상점 등급 확률', shift: 'shopGrade', cost: [8, 16] } ] },
      { id: 'event', name: '이벤트', nodes: [
        { id: 'startGold', req: ['start'], name: '시작 골드', path: 'campaign.startGold', add: 50, cost: [4, 8, 12] },
        { id: 'life', req: ['startGold'], name: '시작 하트', path: 'life.max', add: 2, cost: [4, 8, 12] },
        { id: 'clearGold', req: ['startGold'], name: '클리어 골드', key: 'clearGold', add: 10, cost: [5, 10, 15] },
        { id: 'lootReset', req: ['clearGold'], name: '전투 룰렛 리셋', path: 'recruit.reroll.max', add: 1, cost: [8] },
        { id: 'campfire', req: ['startGold'], name: '모닥불 영웅 수', key: 'campfire', add: 1, cap: 6, cost: [6, 12] },
        { id: 'eventReset', req: ['campfire'], name: '모닥불·요정 리셋', key: 'eventReroll', add: 1, cost: [6, 12] },
        { id: 'daisReset', req: ['eventReset'], name: '양탄자 리셋', key: 'daisReroll', add: 1, cost: [6, 12] },
        { id: 'groll', req: ['campfire'], name: '돈고블린 룰렛', key: 'grollSpins', add: 1, cost: [6, 12] },
        { id: 'mimic', req: ['campfire'], name: '미믹 수', key: 'mimicCount', add: 1, cap: 4, cost: [8] },
        { id: 'chest', req: ['mimic'], name: '보물상자 등급', key: 'chestGrade', add: 1, cap: 3, cost: [10] },
        { id: 'lootGrade', req: ['lootReset'], name: '전리품 등급 확률', shift: 'lootWeight', cost: [8, 16] } ] },
      // 영웅 줄: 직업마다 어울리는 능력치만(사용자 "2로하자"). 직업별 능력치는 기획 제안표(사용자 확인 전) 그대로 임시. atk·hp·def = +비율, crit = +확률
      { id: 'h_guardian', name: '기사', job: 'guardian', nodes: [
        { id: 'g_hp', req: ['t_hp'], name: '기사 체력', hero: 'hp', add: 0.05, cost: [5, 10, 15] }, { id: 'g_def', req: ['g_hp'], name: '기사 방어력', hero: 'def', add: 0.05, cost: [5, 10, 15] } ] },
      { id: 'h_warrior', name: '전사', job: 'warrior', nodes: [
        { id: 'w_atk', req: ['t_hp'], name: '전사 공격력', hero: 'atk', add: 0.05, cost: [5, 10, 15] }, { id: 'w_hp', req: ['w_atk'], name: '전사 체력', hero: 'hp', add: 0.05, cost: [5, 10, 15] } ] },
      { id: 'h_assassin', name: '암살자', job: 'assassin', nodes: [
        { id: 'a_atk', req: ['t_hp'], name: '암살자 공격력', hero: 'atk', add: 0.05, cost: [5, 10, 15] }, { id: 'a_crit', req: ['a_atk'], name: '암살자 치명타', hero: 'crit', add: 0.02, cost: [5, 10, 15] } ] },
      { id: 'h_archer', name: '궁수', job: 'archer', nodes: [
        { id: 'r_atk', req: ['t_hp'], name: '궁수 공격력', hero: 'atk', add: 0.05, cost: [5, 10, 15] }, { id: 'r_crit', req: ['r_atk'], name: '궁수 치명타', hero: 'crit', add: 0.02, cost: [5, 10, 15] } ] },
      { id: 'h_mage', name: '마법사', job: 'mage', nodes: [
        { id: 'm_atk', req: ['t_hp'], name: '마법사 공격력', hero: 'atk', add: 0.05, cost: [5, 10, 15] }, { id: 'm_hp', req: ['m_atk'], name: '마법사 체력', hero: 'hp', add: 0.05, cost: [5, 10, 15] } ] },
      { id: 'h_bard', name: '서포터', job: 'bard', nodes: [
        { id: 'b_hp', req: ['t_hp'], name: '서포터 체력', hero: 'hp', add: 0.05, cost: [5, 10, 15] }, { id: 'b_def', req: ['b_hp'], name: '서포터 방어력', hero: 'def', add: 0.05, cost: [5, 10, 15] } ] },
      { id: 'h_all', name: '팀 전체', job: 'all', nodes: [
        { id: 't_hp', req: ['start'], name: '팀 체력', hero: 'hp', add: 0.03, cost: [8, 16, 24] }, { id: 't_atk', req: ['t_hp'], name: '팀 공격력', hero: 'atk', add: 0.03, cost: [8, 16, 24] } ] }
    ]
  },
  // 등급 테두리 색: 코스트 1·2·3 (캐릭터 그림 외곽선)
  // 영웅 등급: 영웅마다 정해진 희귀도(heroes[].grade 1~5). 캐릭터 외곽선 색으로 보여요. 합성으로는 안 바뀌어요(합성은 성급 ★)
  // 어떤 등급의 영웅이 적·용병·상인으로 나올지는 플레이어 레벨에 따른 확률(player.heroGrade)로 정해져요
  heroGrades: { 1: { name: '일반', color: '#d9dde8' }, 2: { name: '고급', color: '#5fcf6a' }, 3: { name: '희귀', color: '#4fa3ff' }, 4: { name: '전설', color: '#ffb02e' } },
  gradeColor: { 1: '#d9dde8', 2: '#5fcf6a', 3: '#4fa3ff', 4: '#ffb02e' }, // 등급 → 외곽선 색 (heroGrades와 같음, 스킬 등급 색과도 같아요)
  // 영웅 효과 2개(궁극기·패시브)의 기본 레벨: 등급이 높을수록 효과가 더 붙고(일반은 패시브 없음) 기본 레벨이 높아요.
  // 성급(★)은 능력치만 올려요. 효과 레벨: 궁극기 수치 × (1 + ultPer × (레벨 − 1)), 패시브 수치 × (1 + pasPer × (레벨 − 1)), 최대 maxLv
  // 2026-11-18: 영웅 스킬은 모두 1개(궁극기)예요. 스킬2(패시브)는 꺼졌어요(pas 0). 희귀·전설은 스킬1이 2레벨로 시작해요
  gradeEffects: { 1: { ult: 1, pas: 0 }, 2: { ult: 1, pas: 0 }, 3: { ult: 1, pas: 0 }, 4: { ult: 1, pas: 0 }, // 2026-11-21: 스킬 1개 규칙(특성 끔) · 등급으로 스킬 레벨이 오르는 효과 뺌(희귀·전설도 1레벨, 초월로만 올라요)
    passiveOn: { star: 3, grade: 1 }, // 2026-11-23: 패시브는 모든 등급 영웅이 ★3이 되면 켜져요(처음엔 희귀·전설만 → 일반·고급도: 1·2성 영웅 역할을 뚜렷하게). 초월로는 안 옮겨져요(궁극기만). 끄려면 이 줄을 지워요
    ultPer: 0.3, pasPer: 0.6, maxLv: 1 }, // 2026-11-22: 스킬 레벨 뺌(maxLv 1)
  // 초월: 영웅(기존)에 재료 영웅(아무 영웅이나)을 넣으면 재료는 사라지고, 재료 영웅의 스킬(궁극기)이 기존 영웅에 추가 스킬로 붙어요
  //   이미 가진 스킬이면(재료가 같은 영웅이거나 전에 넣은 영웅과 같으면) 그 스킬 레벨 +1 (승급). 레벨당 위력 +ultPer(30%), 최대 maxLv
  //   스킬 칸: 기본 스킬 포함 최대 maxSkills개. 꽉 차면 새 스킬은 못 넣고 가진 스킬의 승급만 돼요
  //   추가 스킬은 기본 스킬과 함께 발동해요(궁극기 에너지가 차면 기본 → 추가 순서로 모두 써요). 성급·레벨은 그대로, 합성하면 초월 스킬도 합쳐져요(같은 스킬은 높은 레벨)
  // at: 이 이벤트 스테이지에서만 초월돼요(2026-11-18). 비우면 아무 때나
  transcend: { enabled: true, maxSkills: 2, maxLv: 1, at: 'altar', perAltar: 1, trMaterial: false /* 2026-11-26: 이미 초월한 영웅은 재료로 못 씀 */ }, // perAltar(2026-11-23): 제단 한 번에 초월 1번만 (영웅마다도 maxSkills 2라 추가 스킬 1개까지) // maxSkills 2: 기본 + 추가 1개. 2026-11-22: 스킬 레벨 없음 — 같은 영웅을 넣으면 같은 스킬이 2개(동시에 발동)
  // 패시브 종류. {v}는 그 레벨의 수치(%는 100을 곱해 보여요)
  passives: { // 2026-11-21: 영웅마다 다른 특성(캐릭터_특성표.md). {v}=값×100%, {n}=값
    shieldAlly: { name: '방패 내밀기', desc: '전투가 시작되면 가장 가까운 아군에게 그 아군 최대 체력 {v}% 보호막을 씌운다.' },
    shieldGuard: { name: '철벽 자세', desc: '보호막이 있는 동안 받는 피해가 {v}% 줄어든다.' },
    shieldBreakStun: { name: '등껍질 충격', desc: '보호막이 깨지면 주변 적을 {n}초 기절시킨다.' },
    shieldRally: { name: '왕의 결의', desc: '아군이 보호막을 얻을 때마다 공격력이 {v}% 오른다. 최대 10번 쌓인다.' },
    ultHasteShielded: { name: '진군 명령', desc: '궁극기를 쓰면 보호막이 있는 아군의 공격 속도가 3초 동안 {v}% 빨라진다.' },
    reviveAlly: { name: '천상의 손길', desc: '처음 쓰러진 아군을 체력 {v}%로 되살린다. 한 번만 발동한다.' },
    teamShieldEvery: { name: '산호 장막', desc: '10초마다 아군 전체에게 최대 체력 {v}% 보호막을 씌운다.' },
    hitShield: { name: '버티기', desc: '10번 맞을 때마다 최대 체력 {v}% 보호막을 얻는다.' },
    overhealShield: { name: '넘치는 빛', desc: '회복이 넘친 만큼 그 아군에게 보호막으로 씌운다.' },
    attackShield: { name: '바위 피부', desc: '평타를 칠 때마다 1초 동안 최대 체력 {v}% 보호막을 얻는다.' },
    thorns: { name: '가시', desc: '근접 공격을 받으면 받은 피해의 {v}%를 공격자에게 돌려준다.' },
    hitHeal: { name: '이끼 재생', desc: '맞을 때마다 최대 체력 {v}%를 회복한다.' },
    hitSlow: { name: '끈적한 진흙', desc: '자신을 때린 적을 1초 동안 {v}% 느리게 한다.' },
    petrify: { name: '석화', desc: '체력이 처음 반 아래로 떨어지면 3초 동안 돌이 되어 피해를 받지 않고, 풀리면 체력 {v}%를 회복한다.' },
    tauntDrain: { name: '심해의 갈증', desc: '도발 중에 맞으면 공격자의 궁극기 에너지 {n}을 빼앗는다.' },
    guardShare: { name: '지옥의 계약', desc: '체력이 가장 낮은 아군이 받는 피해의 {v}%를 대신 받는다.' },
    hitNova: { name: '분노의 발굽', desc: '8번 맞을 때마다 주변 적에게 공격력 {v}% 피해를 준다.' },
    bloodHaste: { name: '피의 냄새', desc: '잃은 체력에 비례해 공격 속도가 최대 {v}% 빨라진다.' },
    firstStrike: { name: '첫 돌격', desc: '첫 평타가 {n}배 피해를 주고 맞은 적을 0.5초 기절시킨다.' },
    lowLifesteal: { name: '맹수의 갈증', desc: '체력이 30% 아래면 준 피해의 {v}%를 회복한다.' },
    comboN: { name: '연환', desc: '평타 4번마다 한 번 더 친다.' },
    chargeHit: { name: '전광석화', desc: '움직인 뒤 첫 평타가 {n}배 피해를 준다.' },
    critFollow: { name: '여우 꼬리', desc: '치명타가 터지면 같은 적을 공격력 {v}%로 한 번 더 벤다.' },
    hasteStack: { name: '흐르는 검', desc: '평타를 칠 때마다 공격 속도가 {v}% 빨라진다. 최대 10번 쌓인다.' },
    openHaste: { name: '선제 비행', desc: '전투가 시작되면 5초 동안 공격 속도가 {v}% 빨라진다.' },
    pierceChance: { name: '튕긴 돌', desc: '평타가 {v}% 확률로 뒤쪽 적 1명을 함께 맞힌다.' },
    hasteDouble: { name: '바람 화살', desc: '가속 중에는 평타로 화살을 2발 쏜다.' },
    secondHit: { name: '쌍검술', desc: '평타 2번째마다 피해가 {v}% 커진다.' },
    rootHit: { name: '휘감기', desc: '평타에 맞은 적은 {n}초 동안 움직이지 못한다.' },
    ultRefund: { name: '잔류 전하', desc: '궁극기를 쓴 뒤 에너지 {n}이 남는다.' },
    ultStack: { name: '폭풍 축적', desc: '궁극기를 쓸 때마다 다음 궁극기 피해가 {v}% 커진다. 최대 5번 쌓인다.' },
    allyUltEnergy: { name: '마력 공명', desc: '아군이 궁극기를 쓸 때마다 에너지 {n}을 얻는다.' },
    energyStart: { name: '선제', desc: '전투가 시작되면 궁극기 에너지를 {n} 채운다.' },
    vsSlow: { name: '혹한', desc: '느려진 적에게 주는 피해가 {v}% 커진다.' },
    chillAura: { name: '서리 바람', desc: '느려진 적이 3명 이상이면 아군 공격 속도가 {v}% 빨라진다.' },
    ultBeastEnergy: { name: '무리의 부름', desc: '궁극기를 쓰면 다른 수인 아군의 에너지를 {n} 채운다.' },
    forestHeal: { name: '숲의 숨결', desc: '숲 아군이 가속을 얻을 때마다 그 아군 체력을 {v}% 회복한다.' },
    burnHit: { name: '촛농', desc: '평타에 맞은 적에게 {n}초 화상을 입힌다.' },
    burnBlast: { name: '연쇄 폭발', desc: '화상 걸린 적이 쓰러지면 주변 적에게 공격력 {v}% 폭발 피해를 준다.' },
    rebirth: { name: '환생', desc: '처음 쓰러지면 체력 {v}%로 되살아나고 주변 적에게 화상을 입힌다.' },
    splash: { name: '광역', desc: '평타가 주변 적에게도 {v}%만큼 피해를 준다.' },
    burnRally: { name: '불타는 전장', desc: '화상 걸린 적 1명마다 공격력이 {v}% 오른다.' },
    killBurn: { name: '불씨 줍기', desc: '적을 쓰러뜨리면 다음 평타가 {n}초 화상을 입힌다.' },
    lowBurn: { name: '물어뜯는 불', desc: '체력이 반 아래인 적을 치면 화상을 입힌다.' },
    ultBurnAmp: { name: '용의 화염', desc: '궁극기에 맞은 적의 화상 피해가 4초 동안 {n}배가 된다.' },
    dive: { name: '급강하 돌입', desc: '전투가 시작되면 맨 뒤 적에게 뛰어든다.' },
    burnEnergy: { name: '불의 나팔', desc: '화상 피해가 들어갈 때마다 아군 전체 에너지가 {n} 찬다.' },
    ultDrain: { name: '피의 연회', desc: '궁극기로 준 피해의 {v}%를 회복한다.' },
    lifesteal: { name: '흡혈', desc: '준 피해의 {v}%만큼 체력을 회복한다.' },
    bloodPact: { name: '피의 대가', desc: '3초마다 체력 5%를 바쳐 다음 공격 피해가 {v}% 커진다.' },
    deathEnergy: { name: '영혼 수확', desc: '적이 쓰러질 때마다 에너지 {n}을 얻는다.' },
    healSteal: { name: '생기 강탈', desc: '궁극기 회복량의 {v}%만큼 가장 약한 적의 체력을 빼앗는다.' },
    martyr: { name: '군주의 분노', desc: '아군이 쓰러질 때마다 공격력과 최대 체력이 {v}% 오른다.' },
    lifestealEnergy: { name: '피의 북소리', desc: '아군이 흡혈할 때마다 에너지 {n}을 얻는다.' },
    ambush: { name: '그림자 잠복', desc: '전투가 시작되면 {n}초 동안 숨어서 노려지지 않고, 첫 공격은 반드시 치명타다.' },
    execute: { name: '약점 포착', desc: '체력이 30% 아래인 적에게 주는 피해가 {v}% 커진다.' },
    killRush: { name: '연속 사냥', desc: '적을 쓰러뜨리면 바로 다음 평타를 쏜다.' },
    markKillEnergy: { name: '사냥감 추적', desc: '표식이 남은 적이 쓰러지면 궁극기 에너지를 {n} 얻는다.' }, // 2026-11-23 밤추적자
    killAtkStack: { name: '피의 연쇄', desc: '적을 쓰러뜨릴 때마다 공격력이 {v}% 오른다. 최대 5번 쌓인다.' }, // 2026-11-23 처형자
    farShot: { name: '달빛 저격', desc: '멀리 있는 적일수록 피해가 최대 {v}% 커진다.' },
    ultBlind: { name: '어둠의 눈', desc: '궁극기에 맞은 적은 2초 동안 공격이 {v}% 빗나간다.' },
    killStealth: { name: '잠적', desc: '적을 쓰러뜨리면 {n}초 동안 숨는다.' },
    healHaste: { name: '생기의 선율', desc: '회복받은 아군의 공격 속도가 2초 동안 {v}% 빨라진다.' },
    healEvery: { name: '새싹 이슬', desc: '5초마다 체력이 가장 낮은 아군을 {v}% 회복한다.' },
    endure: { name: '수호 기도', desc: '쓰러질 피해를 받은 아군을 체력 1로 버티게 한다. 한 번만 발동한다.' },
    teamEnergyStart: { name: '출정 행진', desc: '전투가 시작되면 아군 전체 에너지를 {n} 채운다.' },
    reviveEvery: { name: '세계수의 씨앗', desc: '12초마다 쓰러진 아군 1명을 체력 {v}%로 되살린다.' }
  },

  // ───── 영입·코스트·백팩·합성 ─────
  recruit: {
    startHero: 'bear',          // 처음 가진 영웅 1명
    startExtra: 0, // 2026-11-22: 다시 1명으로 시작(사용자). 예전 1              // 2026-11-22: 시작할 때 모닥불 영웅 말고 1명 더 받아요(1레벨 등급 확률로). 1-1은 2:1로 시작
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
    sell: { grade: [5, 10, 20, 40] }, // 백팩 영웅 판매가(2026-11-23): 등급(일반·고급·희귀·전설)별 ★1 값 × 합쳐진 수(★2 = 2명, ★3 = 4명)
    // 합성: 같은 영웅·같은 성급 2명을 겹쳐 놓으면 1명이 되고 성급 +1 (★1 → ★2 → ★3, 최대 maxStar).
    // 같은 영웅도 여러 명을 각각 전장에 올릴 수 있어요. 합성은 겹쳐 놓을 때만 일어나요
    // auto: true면 같은 영웅·같은 성급을 얻는 순간 바로 합쳐요(겹쳐 놓을 필요 없음). 이미 있던 쪽(전장이면 전장 자리)에 남고, ★2끼리 생기면 이어서 ★3까지 합쳐요
    merge: { maxStar: 3, mul: [1, 1.8, 3.2], auto: true },   // 성급별 체력·공격 배율
    mergeCount: 2, maxStar: 3, starMul: [1, 1.8, 3.2], // (예전 이름, 호환용: merge와 같은 값)
    // 스테이지 n(0부터)의 적 수: 배열 끝을 넘으면 마지막 값
    enemyCount: [1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5], // 2026-11-22: 1-4부터 3판마다 1명씩 (아군 출전 수보다 같거나 많게). 예전 [1, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 5]
    // 전리품 룰렛 칸: 이긴 판의 적 영웅 + 그 판 적이 쓰던 스킬(두루마리) + 골드 주머니 goldSlots개 (1개: 전장 위 미리 보기와 같아요)
    // 골드 주머니 액수 = 그 스테이지 클리어 보상 × (goldMin ~ goldMax) 사이 무작위. 꽝 느낌이 나도록 작게
  // (아래 heroBonus 참고) 적·모닥불 영웅에는 덤이 붙을 수 있어요. 그 영웅을 얻으면 덤도 받아요
    loot: { goldSlots: 1, goldMin: 1, goldMax: 1, skills: true }, /* 2026-11-24: 주머니 = 그 레벨 클리어 골드 그대로(예전 0.3~0.7배 무작위) */
    // 전리품은 이긴 판마다 1개만 받아요. 나온 후보를 받거나, 버리고 다시 돌려요(버린 후보는 그 판 룰렛에서 빠져요)
    // 다시 돌리기 비용 = base × growth^(이번 판에서 돌린 횟수) × shop.priceGrowth^(스테이지)
    reroll: { base: 60, growth: 1, /* 2026-11-24: 1.8 → 1 고정 */ max: [1], fairy: true, campfire: true /* 2026-11-26: 모닥불 룰렛에도 리셋. 모닥불·요정 횟수는 player.eventReroll */ }, // 2026-11-23: 모든 레벨 1번(예전 Lv6부터 2번). fairy: 요정 룰렛에도 리셋 1번. 레벨로 늘리는 건 나중에 영구 강화 트리에서 // max(2026-11-23): 룰렛 1번당 리셋 기회. 플레이어 레벨 1~5는 1번, 6부터 2번(표 끝 값이 계속). 다음 룰렛에서 다시 채워져요
    // 적으로 나오는 영웅의 최고 코스트: from 스테이지부터
    enemyMaxCost: [{ from: 0, cost: 1 }, { from: 4, cost: 2 }, { from: 10, cost: 3 }]
  }
};

if (typeof module !== 'undefined') module.exports = IDLE_DATA;
