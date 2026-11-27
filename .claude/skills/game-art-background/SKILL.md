---
name: game-art-background
description: 챕터 전투 배경이나 앞장식을 만들거나 고칠 때 쓴다.
---

# 배경·앞장식

먼저 `game-art-common`을 따른다.

## 규격

- **배경** `img/p/bg_<챕터>.png`, `_dusk`, `_night`: 720×402. 게임이 위 58줄을 잘라 올리고 아래를 뒤집어 채운다. 땅은 높이 59%에서 시작, 천장·하늘의 중요한 것은 14% 아래.
- **앞장식** `img/p/fg_<챕터>.png`, `_dusk`, `_night`: 720×80, 양쪽 모서리만 높고 가운데는 아주 낮게. 캐릭터보다 앞에 그려진다.

## 검수

- 챕터마다 **구조가** 달라 보여야 한다. ("비슷해 보여서.. 구조를 좀 더")
- 화풍은 기존 배경·캐릭터에 맞춘다. ("그래픽풍이 다른 것 같아" "이질적")
- 바닥은 캐릭터·칸이 서니 조용하게, 그러나 밋밋하지 않게. 벽과 땅 경계는 일자거나 애매하지 않게.
- 앞장식과 배경의 것(웅덩이 등)이 겹쳐 이상한 모양이 되지 않는지 합성해서 본다.

## 만들기

1. 코덱스에 구성부터 받고, 화풍이 다르면 기존 배경을 화풍 기준으로 주고 다시 받는다.
2. `pixelize.ps1`로 360×201 도트 → 720×402(부드럽게 줄이면 도트 느낌이 사라지고, 다수결로 줄이면 외곽선이 끊긴다).
3. 노을·밤은 같은 그림의 색만 `recolor.ps1`(모양이 어긋나지 않는다).
4. 앞장식은 마젠타 띠로 받아 `fgstrip.ps1`, 색은 같은 `recolor.ps1`.

## 게임 화면에 얹어 보기 (파일·저장 상태를 안 건드림)

`testbed-qa`(8766)에서 아래를 실행하고 화면을 찍는다.

```js
const im=new Image(); im.onload=()=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,-58);x.translate(0,im.height);x.scale(1,-1);x.drawImage(im,0,im.height-58,im.width,58,0,0,im.width,58);const s=document.createElement('style');s.textContent='.field{background:url('+c.toDataURL()+') 50% 50% / 100% 100.5% no-repeat !important}';document.head.appendChild(s)}; im.src='img/codex/<작업>/<그림>.png';
```
