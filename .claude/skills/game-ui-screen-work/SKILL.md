---
name: game-ui-screen-work
description: 화면 배치·버튼·팝업을 고치거나 확인할 때 쓴다.
---

# 화면 고치기와 확인

"2. UI 및 이펙트"의 기본 절차다. 유물·스킬 이펙트는 `game-ui-fx`, 끝나면 `task-wrapup`, 배포는 `game-ui-playlink-deploy`.

## 1. 시작 전

- `화면규칙.md`를 다시 읽는다. 고치거나 검사하기 전마다 읽는다(컴팩트 뒤에는 읽은 내용이 빠질 수 있다). 새 화면 규칙은 그 파일에 더한다.
- 말한 것만 바꾼다. 자리·모양·범위가 애매하면 짐작하지 말고 묻는다. 요청은 보던 그 화면만 고치고, 같은 틀의 다른 화면으로 넓히기 전에 묻는다.
- `data.js`·`engine.js`의 숫자와 규칙은 기획 몫이다. 화면 때문에 꼭 필요하면 기획에 먼저 알린다.

## 2. 고치기

- `index.html`(CSS와 화면 코드), `fx.js`, `fx/`.
- 여러 줄 바꾸기는 Write 도구로 스크래치 폴더에 node 스크립트를 만들어 돌린다. 바꿀 글이 **정확히 한 곳**인지 확인하고, 끝에 `vm.Script`로 `<script>` 문법을 본다. `node -e`·heredoc은 `$('…')`와 백슬래시가 셸에서 깨진 적이 있다.
- 이미지 세션이 같은 이름으로 그림을 바꾸면 배포할 때 `files`에 넣어야 바뀐다.

## 3. 확인 (`testbed-qa`, http://localhost:8766)

`localhost:8765`는 사용자의 저장 데이터라 열지 않는다. 8766 서버가 이미 떠 있으면 `preview_start` 대신 그 주소로 `navigate` 한다.

시험하려고 저장을 바꾸기 전에 백업하고, 끝나면 돌려놓는다.

```js
// 백업
var K=['idle-testbed-v2','idle-testbed-upgrade','idle-testbed-meta'];
if(!sessionStorage.getItem('qaBak')) sessionStorage.setItem('qaBak', JSON.stringify(K.map(k=>[k,localStorage.getItem(k)])));
// 저장을 바꾼 뒤에는 닫힐 때 덮어쓰이지 않게
var v=JSON.stringify(S); localStorage.setItem(K[0],v); addEventListener('beforeunload',()=>localStorage.setItem(K[0],v)); location.reload();
// 복원
var B=JSON.parse(sessionStorage.getItem('qaBak')); var put=()=>B.forEach(([k,v])=>v==null?localStorage.removeItem(k):localStorage.setItem(k,v));
put(); addEventListener('beforeunload',put); sessionStorage.removeItem('qaBak'); location.reload();
```

- 볼 것: 콘솔 오류, 위치·크기 숫자, 화면 캡처. 크게 볼 때는 1600×900으로 바꾸고 끝나면 desktop으로 되돌린다.
- 콘솔에는 예전 오류가 남아 있다. 지금 난 것인지 구분한다.
- 창이 숨겨져 있으면 애니메이션이 멈춰 팝업이 흐리게 찍힌다. `document.getAnimations().forEach(a=>a.finish())`나 `currentTime`으로 원하는 순간을 맞춰 찍는다.

## 4. 팝업·이벤트 바로 띄우기

백업한 뒤, 저장(`S` = `idle-testbed-v2`)에 아래 값을 넣고 새로고침한다. 넣기 전에 `S.offer`·`S.offerIds`·`S.offerMode`·`S.pending`·`S.evOffer`는 `null`로 비운다(남은 팝업이 가린다. 남은 미믹 팝업은 `#mmGet`).

| 보고 싶은 것 | 넣는 값 | 그다음 |
|---|---|---|
| 돈고블린 룰렛 | `S.event={kind:'groll'}`, `S.gold=999` | `#evBet` 누르기 |
| 모닥불·요정 | `S.event={kind:'campfire'}` 또는 `'fairy'` | `#talkBtn` |
| 늪지·수정 상인 | `S.event={kind:'swampShop'/'crystalShop', ids:[물건 id]}` | `#talkBtn` |
| 미믹 결과창 | `S.event=null`, `S.mimicPend={m:['mimic','mimicKing'], miss:['mimic','mimic:g2'], loot:['g:36']}` | 저절로 뜸 |
| 유물이 걸린 전투 | `S.event=null`, `S.skills=[{id:'gust',lv:1}]` | `#fightBtn` |

업그레이드 효과는 판 시작 때 정해지므로 `S.meta`에 `idle-testbed-upgrade`의 `nodes`를 넣어야 지금 판에 반영된다.

## 5. 새 영웅 그림의 얼굴 자르기

그림이 바뀌면 큰 아이콘에서 눈·입·턱이 들어오는지 본다. `face.js`(이 폴더) 머리말의 두 줄을 브라우저에서 실행한다. 잘리면 UI 코드를 바꾸지 말고 이미지 세션에 알리고, 예외를 둘지는 사용자에게 묻는다(토라는 "예외 없이"로 그대로 둠).

## 6. 업그레이드 새 칸 연결

기획이 `data.js`에 칸을 넣으면 UI는 세 가지를 한다.
1. `index.html` `UPPOS`에 자리: `req` 칸 근처의 빈 자리.
2. 아이콘이 없으면 이미지 세션에 `img/p/up_<id>.png`(24px 1배)를 부탁한다. 그동안은 이름 글자로 보인다.
3. 아이콘이 오면 `UPICO`에 이름을 더한다.
확인: 백업 → 업그레이드 화면 → [모두 찍기] → 겹침과 아이콘 → 복원.

## 겪은 함정

- 부드럽게 처리(smoothImg) 줄이 `.swampc`처럼 클래스의 배경 그림을 덮어쓴다. 새 칸 장식은 새 클래스로.
- 흔한 클래스 이름(`field` 등)은 전장 CSS와 겹친다.
- `toast()`는 바로 끝나게 되어 있어 알림이 안 뜬다.
- 사용자에게 보일 모양을 고를 일은 두세 안을 한 화면에 놓고 보여 준다.
