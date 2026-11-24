# Codex 작업: fx.js 마무리 (기획 Claude / 실행 Codex)

폴더: C:\Users\Home\Downloads\방치형RPG_테스트베드\
고칠 수 있는 파일: fx.js, fx/ 폴더 안 파일만. index.html, data.js, engine.js, img/ 안의 기존 파일은 절대 고치지 마세요.

## 1. fx.js의 SHEETS 채우기
- img/fx/에 있는 fx_*.json 9개를 읽어서, fx.js 안 `var SHEETS = { ... }`를 채워 주세요.
- 이름과 파일 짝: poof=fx_poof, coin=fx_coin, levelup=fx_levelup, heal=fx_heal, shield=fx_shield, frost=fx_frost, chain=fx_chain, hit=fx_hit, slash=fx_slash
- 각 항목: `{ file, w, h, cols, n, fps, loop, px, py, speed, scaleK, cut }`
  - w, h는 meta.pixelfx.frameSize, cols는 columns, n은 frames, fps와 loop는 그대로
  - px, py는 meta.pixelfx.pivot(기준점, 보통 발밑). pivot이 배열이 아니면 형식을 보고 x, y로 바꿔 주세요
  - speed(기본 배속): 효과 전체 길이(n/fps)가 0.6~0.9초가 되도록 정해요. 예: 1.6초 효과면 speed 2
  - scaleK: 1로 시작해요. 우리 영웅 그림이 36px를 약 2.2배로 그려요. 효과 한 프레임 크기가 영웅보다 지나치게 크면(예: 폭 200px 넘음) 0.5~0.7로 줄여 주세요
  - cut: 1. 꼬리가 너무 길면(끝에 거의 빈 프레임이 많으면) 0.7~0.85
- 나머지 fx.js 코드는 바꾸지 마세요. 문법 오류가 없게 `node -e "require('./fx.js')"`로 확인해 주세요(window가 없어도 this로 내보내요).

## 2. 테스트 페이지 fx/fx-test.html
- 어두운 배경의 720×400 캔버스를 2배(image-rendering: pixelated)로 띄우고 ../fx.js를 불러요.
- FX.names()의 버튼을 한 줄로 만들어 주세요. 누르면 캔버스 가운데(360, 260)에서 그 효과를 FX.play로 재생해요. knock는 opts {dx: 30}, stun은 {dur: 2}예요.
- '전부' 버튼: 모든 효과를 가로로 나눠 한 번에 재생해요.
- 화면 아래 div 하나에 FX.playOn 시험용 상자(120×120)를 두고, 'poof를 상자 위에' 버튼으로 FX.playOn(상자, 'poof')를 재생해요.
- 루프: requestAnimationFrame에서 FX.update(dt); FX.draw(ctx,'back'); 가운데에 회색 36×36 사각형을 2.2배로 그려 영웅 자리를 표시하고, FX.draw(ctx,'front').
- 이미지 스무딩은 꺼요.

## 3. 확인
- node로 fx/fx-test.html을 띄울 필요는 없어요. 대신 `node -e`로 fx.js를 불러 FX.names()가 9개 시트 이름과 파티클 이름(spark, ultRing, skillHit, death, knock, takeoff, poof, coin, stun, levelup)을 모두 포함하는지 출력해 주세요.

## 보고 (한국어, 짧게)
- 채운 SHEETS 표(이름, 프레임 크기, 프레임 수, fps, speed, scaleK, cut)
- 바꾼 파일 목록
- 문제점
