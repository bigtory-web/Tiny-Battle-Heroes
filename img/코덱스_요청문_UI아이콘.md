# 코덱스 요청문 (UI 아이콘 8개)

이모지로 나오던 자리를 채울 그림이에요. 원본은 `img/px/`에 저장하고, 후처리(`img/tools/pixfix.ps1`)로 `img/p/`에 넣어요.

| 파일 | 격자 | 후처리 | 자리 |
|---|---|---|---|
| hud_level | 16x16 | `-Kind hud` | 상단 바 레벨 |
| ui_shop | 24x24 | `-Kind icon` | 오른쪽 버튼 상점 |
| ui_book | 24x24 | `-Kind icon` | 오른쪽 버튼 도감 |
| ui_tool | 24x24 | `-Kind icon` | 오른쪽 버튼 도구 |
| ui_reroll | 24x24 | `-Kind icon` | 상점 새로고침 |
| ui_boss | 16x16 | `-Kind hud` | 스테이지 바 보스 칸 |
| ui_lock | 16x16 | `-Kind hud` | 도감 잠긴 스킬2 |
| ui_team | 16x16 | `-Kind hud` | DPS 미터 팀 스킬 합계 |

---

## A. 16x16 공통 문단 (hud_level, ui_boss, ui_lock, ui_team)
```
모바일 RPG 화면에 들어갈 작은 픽셀 아트 아이콘 1장을 만들어 줘. 같은 게임의 기존 아이콘과 같은 그림체야.
그림체 기준(꼭 열어 봐): img/p/hud_gold.png, img/p/hud_skill.png (16x16 확정 그림).
그림체: 정확히 16x16 픽셀 격자로 그린 도트 아이콘을 1024 캔버스에 확대한 모습. 한 픽셀이 64px 크기의 큼직한 정사각 블록. 안티에일리어싱 없음, 모든 블록이 같은 크기로 격자에 딱 맞게.
외곽선: 1블록 두께의 짙은 갈색·검정 외곽선. 음영은 기본색과 그림자색 2단, 하이라이트 1블록 정도. 8색 이하. 디더링 없음.
구도: 상징 하나를 16x16 안에 꽉 차게(둘레 1블록 여백). 16px로 작게 보여도 알아보게 단순한 실루엣.
크기와 배경: 1024x1024 정사각, 투명 배경 PNG. 글자·숫자·테두리 틀 없음. 오리지널.
등급 색 테두리나 빛나는 외곽 효과는 넣지 마.
```

```
대상: 플레이어 레벨: 다섯 꼭지 별 하나. 노랑·금색, 왼쪽 위에 하이라이트 1블록.
저장: img/px/hud_level.png
```

```
대상: 보스 스테이지 표시: 뾰족한 꼭지 3개가 있는 작은 금색 왕관. 가운데 꼭지에 빨간 보석 1블록.
저장: img/px/ui_boss.png
```

```
대상: 잠김: 회색 철 자물쇠. 위쪽 고리는 둥글게, 몸통 가운데에 검은 열쇠 구멍.
저장: img/px/ui_lock.png
```

```
대상: 팀 스킬 합계: 하늘색 반짝임 별빛 하나(십자 모양 큰 반짝임 + 옆에 작은 반짝임 1개).
저장: img/px/ui_team.png
```

## B. 24x24 공통 문단 (ui_shop, ui_book, ui_tool, ui_reroll)
```
모바일 RPG 화면 버튼에 들어갈 픽셀 아트 아이콘 1장을 만들어 줘. 같은 게임의 기존 아이콘과 같은 그림체야.
그림체 기준(꼭 열어 봐): img/p/skill_rally.png, img/p/ui_bell.png (24x24 확정 그림).
그림체: 정확히 24x24 픽셀 격자로 그린 도트 아이콘을 1024 캔버스에 확대한 모습. 큼직한 정사각 블록, 안티에일리어싱 없음, 모든 블록이 격자에 딱 맞게.
외곽선: 1블록 두께의 짙은 갈색 외곽선. 2~3단 명암, 12색 이하. 디더링 없음.
구도: 상징 하나를 크게, 둘레 1블록 여백. 배경 판·원형 틀 없이 물건만.
크기와 배경: 1024x1024 정사각, 투명 배경 PNG. 글자·숫자·테두리 틀 없음. 오리지널.
등급 색 테두리나 빛나는 외곽 효과는 넣지 마.
```

```
대상: 상점: 갈색 가죽 돈주머니. 끈으로 묶은 입구, 입구 위로 금화 1~2닢이 살짝 보이게.
저장: img/px/ui_shop.png
```

```
대상: 도감: 닫힌 두꺼운 책. 짙은 빨강 가죽 표지, 금색 모서리 장식, 앞면 가운데에 금색 작은 문양 1개.
저장: img/px/ui_book.png
```

```
대상: 도구(설정): 회색 철 톱니바퀴 하나. 이 8개, 가운데 구멍.
저장: img/px/ui_tool.png
```

```
대상: 새로고침: 하얀 주사위 하나를 3/4 각도로. 윗면에 점 1개, 보이는 옆면에 점 2·3개. 점은 짙은 갈색.
저장: img/px/ui_reroll.png
```

---

## 후처리
```
powershell -ExecutionPolicy Bypass -File img\tools\pixfix.ps1 -Src img\px\hud_level.png -Out img\p\hud_level.png -Kind hud
powershell -ExecutionPolicy Bypass -File img\tools\pixfix.ps1 -Src img\px\ui_boss.png  -Out img\p\ui_boss.png  -Kind hud
powershell -ExecutionPolicy Bypass -File img\tools\pixfix.ps1 -Src img\px\ui_lock.png  -Out img\p\ui_lock.png  -Kind hud
powershell -ExecutionPolicy Bypass -File img\tools\pixfix.ps1 -Src img\px\ui_team.png  -Out img\p\ui_team.png  -Kind hud
powershell -ExecutionPolicy Bypass -File img\tools\pixfix.ps1 -Src img\px\ui_shop.png  -Out img\p\ui_shop.png  -Kind icon
powershell -ExecutionPolicy Bypass -File img\tools\pixfix.ps1 -Src img\px\ui_book.png  -Out img\p\ui_book.png  -Kind icon
powershell -ExecutionPolicy Bypass -File img\tools\pixfix.ps1 -Src img\px\ui_tool.png  -Out img\p\ui_tool.png  -Kind icon
powershell -ExecutionPolicy Bypass -File img\tools\pixfix.ps1 -Src img\px\ui_reroll.png -Out img\p\ui_reroll.png -Kind icon
```
