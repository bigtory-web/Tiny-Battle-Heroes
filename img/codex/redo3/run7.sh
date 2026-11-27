#!/usr/bin/env bash
CODEX="$(cygpath -u "$(powershell -NoProfile -Command "(Get-AppxPackage OpenAI.Codex).InstallLocation" | tr -d '\r')")/app/resources/codex.exe"
for id in coral vine; do
  { echo "Two game sprites are attached, enlarged 8 times (every 8x8 block is one sprite pixel). Image 1 is the knight (style and body template). Image 2 is the current draft of a character. Use both as reference images for your image generation tool, generate ONE new image and save it as img/codex/redo3/${id}_src7.png (save it even if the size differs slightly)."
    echo "Redraw image 2 keeping its design, colors, face, pose, size and pixel size EXACTLY. Change ONLY this:"
    cat img/codex/redo3/fix7_$id.txt
    echo "Rules: every outer edge, including the border of the head and hair shape, is outlined in the same very dark brown as the knight outline, never ending in the hair color. Eyes like image 2: each eye is 1 white pixel column plus 2 iris pixel columns, both eyes the same width, and each eyebrow line is only 1 pixel thick. Never copy the knight sword, shield, helmet or plume. Hard square pixels, no anti-aliasing. Full body centered, 1024x1024 PNG, flat solid pure magenta background FF00FF, no text, no shadow. Python is not installed on this computer: do not use python. Use PowerShell Copy-Item to copy the generated file. Do not modify or create any other file."
  } > img/codex/redo3/${id}_prompt7.txt
  "$CODEX" exec --skip-git-repo-check -s workspace-write -m gpt-6.2-sol -c model_reasoning_effort=medium --image=img/codex/redo3/knight_x8.png --image=img/codex/redo3/${id}_new6_x8.png - < img/codex/redo3/${id}_prompt7.txt > img/codex/redo3/${id}7.log 2>&1 &
done
wait
for id in coral vine; do [ -f img/codex/redo3/${id}_src7.png ] && echo "$id: ok" || echo "$id: FAILED"; done
