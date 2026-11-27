---
name: playlink-deploy
description: 플레이 링크(전투 테스트베드 아티팩트)를 배포할 때 쓴다.
---

# 플레이 링크 배포

주소: https://claude.ai/artifact/SWRCk5W1xyJfTmzjWdDNXB

## 언제

고칠 때마다 하지 않고 30분에 한 번 모아서, 묻지 않고 한다. 하루 200번 한도(한국 오전 9시에 풀림). 사용자는 로컬로 확인하므로 배포 얘기를 먼저 꺼내지 않는다.

## 순서

1. 커밋·push가 끝난 상태에서 빌드: `node build-artifact.js . <스크래치>/deploy`
2. 지난 배포 커밋 이후 바뀐 그림: `git diff --name-only <지난 배포 커밋> HEAD -- img/p` (`img/codex`, `img/pixellab`은 시안이라 올리지 않는다)
3. 올라가 있는 판을 먼저 읽는다(읽지 않으면 거절된다).
4. 게시: `url`은 위 주소, `file_path`는 빌드한 `index.html`, `files`에는 `data.js`, `engine.js`, `fx.js`와 바뀐 그림, `root`는 빌드 폴더. `label`에 커밋 번호.
   - 바뀐 js·그림을 `files`에 넣지 않으면 예전 것이 그대로 남는다.
5. 확인: `data.js`와 바뀐 그림을 `path`로 읽어 크기를 로컬과 맞춘다. 버전 번호와 확인 못 한 것(브라우저에서 안 열어 봄 등)을 남긴다.

## 알아 둘 것

- 한 버전의 파일 수 한도는 512. `ult_`·`pas_`·`skill_`·`up_`·`pot_` 그림은 `build-artifact.js`가 `index.html` 안에 묶으므로 `files`에 넣지 않는다. 코드의 경로 모양이 바뀌면 빌드가 일부러 멈춘다.
- 읽기 결과가 대화에 크게 남으므로 서브에이전트에게 맡기고, 같은 에이전트를 `SendMessage`로 다시 부른다.
- 게시본을 지우는 것은 사용자가 말할 때만.
