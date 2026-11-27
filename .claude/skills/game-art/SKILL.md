---
name: game-art
description: 타이니 배틀 히어로즈 그림 작업 절차. 배경(낮·노을·밤), 전장 앞장식, 24×24 아이콘, 분노 아이콘, 칸 장식을 코덱스로 만들고 도트로 다듬어 게임에 넣을 때 쓴다. 새 챕터 그림, 새 아이콘, "도트 느낌", "외곽선", "화풍 맞추기" 요청에 쓴다.
---

# 게임 그림 작업

그림만 만든다. 코드·화면 배치는 "2. UI 및 이펙트", 규칙·숫자는 "1. 기획" 몫이다.

## 순서

1. `화면규칙.md`와 `역할/이미지.md`를 읽는다.
2. 방법이 정해지지 않은 요청이면 "이렇게 하려고 해요"를 한 줄로 먼저 말한다. 모습·자리가 애매하면 묻는다.
3. **1장 시안 → 사용자 확인 → 나머지.** 확인 전에는 `img/codex/<작업>/`에만 두고 `img/p/`는 바꾸지 않는다.
4. 보여 주기 전에 스스로 검수한다: 확대해서 한 번, 게임 화면(또는 합성)에서 한 번.
5. 개발일지 `개발일지/<날짜>/이미지.md` 맨 아래에 한 항목, 내 파일만 `git add`, 커밋·push.
6. 연결은 UI에 부탁한다(파일 이름·크기·언제 쓰는지). 같은 이름을 덮어쓰면 그것도 알린다. 이 세션은 배포하지 않는다.

## 코덱스

프로젝트 루트에서 `bash .claude/skills/game-art/scripts/codex.sh img/codex/<작업>/prompt.txt`

요청문에 늘 넣는 것:
- 참고 그림 경로와 "무엇을 따라 하고 무엇을 버릴지". 화풍은 **게임에 이미 있는 그림을 화풍 기준으로** 지정한다.
- 저장 경로. "크기가 조금 달라도 저장해라"(안 넣으면 저장을 미루고 묻는다. 그때 원본은 `~/.codex/generated_images/`에 있다).
- 바탕 `#FF00FF` 단색, 글자·그림자·번짐 없음.
- "Python is not installed on this computer: do not use python. Use PowerShell Copy-Item to copy the generated file. Do not modify or create any other file."

## 스크립트 (`scripts/`, 프로젝트 루트에서 `powershell -NoProfile -ExecutionPolicy Bypass -File ...`)

| 스크립트 | 하는 일 | 주요 값 |
|---|---|---|
| `pixelize.ps1 -In -Out` | 큰 원본 → 도트(40색, 2×2점), 얇은 외곽선 안 끊김 | `-W 360 -H 201`(배경 720×402), 선이 끊기면 `-Dark` 낮추기 |
| `recolor.ps1 -In -OutDusk -OutNight` | 같은 그림의 색만 노을(보라)·밤(붉음) | 수정 동굴용: 채도 높은 색 = 빛나는 것. 다른 챕터는 색 값을 고쳐 쓴다 |
| `fgstrip.ps1 -In -Out` | 마젠타 띠 원본 → 앞장식 720×80, 바깥 외곽선 | |
| `iconfit.ps1 -Sheet -Names 'a,b' -OutDir` | 아이콘 시트 → 24×24 여러 장 | `-Size 22`, 한 장뿐이면 `-Gap 30` |
| `gridfit.ps1 -In -Block 43 -Show` | 도트 원본의 격자를 읽어 24×24로 | 24를 넘으면 `-DropRows '4 19' -DropCols '4 19'`로 평평한 줄을 뺀다 |

## 종류별 틀

- **배경** `img/p/bg_<챕터>.png`, `_dusk`, `_night`: 720×402. 게임이 위 58줄을 잘라 올리고 아래를 뒤집어 채운다. 땅은 높이 59%에서 시작, 천장·하늘의 중요한 것은 14% 아래. 바닥은 조용하게(캐릭터·칸이 위에 선다) 하되 밋밋하지 않게, 벽과 땅 경계는 일자로 두지 않는다. 앞 챕터와 **구조가** 달라 보여야 한다.
- **앞장식** `img/p/fg_<챕터>.png` 3장: 720×80, 양쪽 모서리만 높고 가운데는 아주 낮게. 배경의 웅덩이 같은 것과 겹치지 않는지 합성해서 본다.
- **아이콘** 24×24 투명: 굵은 도트, 짙은 외곽선, 3색 명암, 왼쪽 위에서 빛.
- **표시가 붙는 아이콘**: 본 그림은 가운데 크게, 작은 표시는 오른쪽 아래에 1점 외곽선으로 겹친다(예: `img/codex/center/centerall.ps1`).
- **분노 아이콘** `img/p/<이름>1~3.png`와 `_blink.png`(없으면 깜빡일 때 깨짐): 기존 `ui_foe*`, `ui_swampfoe*`와 같은 얼굴 틀, 단계가 오를수록 색이 바뀌고 이빨·뿔이 는다.
- **칸 그림** 94×62: 육각 바닥은 47×31 도트의 2배. 양탄자(`pad_*.png`)와 겹치는지 같이 본다(수정 칸은 가운데를 비우고 꼭짓점 장식).

## 게임 화면에 얹어 보기 (파일·저장 상태를 안 건드림)

`.claude/launch.json`의 `testbed`(8765). 배경은 브라우저에서 아래를 실행하고 화면을 찍는다. 챕터를 바꾸거나 버튼을 눌러 저장 상태를 바꾸지 않는다. 팝업이 가리면 `.popw{display:none}`만 숨긴다.

```js
const im=new Image(); im.onload=()=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,-58);x.translate(0,im.height);x.scale(1,-1);x.drawImage(im,0,im.height-58,im.width,58,0,0,im.width,58);const s=document.createElement('style');s.textContent='.field{background:url('+c.toDataURL()+') 50% 50% / 100% 100.5% no-repeat !important}';document.head.appendChild(s)}; im.src='img/codex/<작업>/<그림>.png';
```

## 겪은 함정

- 부드럽게 줄이면 도트 느낌이 사라지고, 다수결로 줄이면 외곽선이 끊긴다 → `pixelize.ps1`.
- 마젠타 바탕이 팔레트를 다 차지해 물체가 뭉개진다(`pixelize.ps1`이 따로 뺀다).
- 24점보다 촘촘하게 그린 아이콘은 줄이면 깨진다 → 격자를 읽어 줄을 빼거나(`gridfit.ps1`) 다시 찍는다. 처음부터 직접 찍으면 원본 디자인을 잃기 쉽다.
- PowerShell: 변수·해시 키는 대소문자를 안 가린다. `[int]`는 반올림(`[math]::Floor`). 함수 이름 `R` 금지. 메서드 인자 안에서 `$m[$x,$y]`는 파싱 오류(변수에 먼저 담기). 한글이 든 글은 UTF-8 파일에서 읽는다.
- 코덱스 모델이 갑자기 "not supported"면 잠시 뒤 다시 해 보고, 그래도 안 되면 사용자에게 알린다.
- 픽셀랩은 쓰기 전에 비용부터 말한다.
