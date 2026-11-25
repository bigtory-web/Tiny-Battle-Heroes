#!/bin/bash
# 1등급 영웅 스프라이트 시트를 코덱스로 만든다 (요청문은 "${DOC:-img/gemini/요청문_1등급.md}" 그대로).
# 사용: bash img/tools/codex_sheet.sh <id> [id ...]   (프로젝트 루트에서, 한 번에 4개씩)
#   결과: img/codex/<id>_sheet.png (코덱스 원본), 로그 img/codex/<id>_codex.log
#   후처리(64x64 8칸)는 따로: 노드 스크립트(mk2.js, pal.js)
CODEX="$(cygpath -u "$(powershell -NoProfile -Command "(Get-AppxPackage OpenAI.Codex).InstallLocation" | tr -d '\r')")/app/resources/codex.exe"
[ -x "$CODEX" ] || { echo "codex.exe not found"; exit 1; }
mkdir -p img/codex
run() { local id="$1" out="img/codex/$1_sheet.png"
  [ -f "$out" ] && { echo "$id: exists, skipped"; return; }
  sed -n "/^## .*(\`$id\`)/,/^---/p" "${DOC:-img/gemini/요청문_1등급.md}" | sed -n '/^```text/,/^```$/p' | sed '1d;$d' > "img/codex/${id}_prompt_block.txt"
  [ -s "img/codex/${id}_prompt_block.txt" ] || { echo "$id: no prompt block"; return; }
  { printf 'Look at the image img/gemini/ref/%s_x8.png (the reference character, a pixel art character on a white background). Generate ONE new image with your image generation tool and save it as %s. The image request is below; follow it exactly.\n\n' "$id" "$out"; cat "img/codex/${id}_prompt_block.txt"; printf '\n\nPython is not installed on this computer: do not use python. If you need to copy or move the generated file, use PowerShell Copy-Item, and keep the image exactly as generated (do not resize or edit it). Do not modify or create any other file.\n'; } > "img/codex/${id}_prompt.txt"
  "$CODEX" exec --skip-git-repo-check -s workspace-write -m "${CODEX_MODEL:-gpt-6.2-sol}" -c model_reasoning_effort=medium - < "img/codex/${id}_prompt.txt" > "img/codex/${id}_codex.log" 2>&1
  if [ ! -f "$out" ]; then # 저장이 안 됐으면 로그에 찍힌 코덱스 보관 경로에서 가져온다
    src="$(grep -o 'C:\\Users\\Home\\.codex\\generated_images\\[^'"'"' "]*\.png' "img/codex/${id}_codex.log" | tail -1 | sed 's/\\/\/g')"
    [ -n "$src" ] && cp "$(cygpath -u "$src")" "$out"
  fi
  [ -f "$out" ] && echo "$id: ok" || echo "$id: FAILED (see img/codex/${id}_codex.log)"
}
for id in "$@"; do run "$id" & while [ "$(jobs -rp | wc -l)" -ge 4 ]; do sleep 2; done; done
wait
