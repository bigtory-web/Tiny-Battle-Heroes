#!/usr/bin/env bash
# redraw from the previous attempt (attached 8x), changing only the listed points
CODEX="$(cygpath -u "$(powershell -NoProfile -Command "(Get-AppxPackage OpenAI.Codex).InstallLocation" | tr -d '\r')")/app/resources/codex.exe"
for id in vine coral; do
  { cat <<EOT
Two game sprites are attached, enlarged 8 times (every 8x8 block is one sprite pixel). Image 1 is the knight (style and body template). Image 2 is the current draft of a character. Use both as reference images for your image generation tool, generate ONE new image and save it as img/codex/redo3/${id}_src5.png (save it even if the size differs slightly).
Redraw image 2 keeping its design, colors, face, eyes, pose, size and pixel size EXACTLY. Change ONLY this:
EOT
    cat img/codex/redo3/${id}_fix.txt
    echo "Thick dark brown outline with no gaps, hard square pixels, no anti-aliasing. Full body centered, 1024x1024 PNG, flat solid pure magenta background FF00FF, no text, no shadow. Python is not installed on this computer: do not use python. Use PowerShell Copy-Item to copy the generated file. Do not modify or create any other file."
  } > img/codex/redo3/${id}_prompt5.txt
  "$CODEX" exec --skip-git-repo-check -s workspace-write -m gpt-6.2-sol -c model_reasoning_effort=medium --image=img/codex/redo3/knight_x8.png --image=img/codex/redo3/${id}_new3_x8.png - < img/codex/redo3/${id}_prompt5.txt > img/codex/redo3/${id}5.log 2>&1 &
done
wait
for id in vine coral; do [ -f img/codex/redo3/${id}_src5.png ] && echo "$id: ok" || echo "$id: FAILED"; done
