#!/usr/bin/env bash
# attack frames for one hero: current attack frames (2x2) + confirmed still, both 8x, attached to Codex.  usage: atk_req.sh <id>
id="$1"; d=img/codex/redo3/sheet
sed "s/flame/$id/g" $d/atk_make.ps1 > $d/atk_make_$id.ps1 && powershell -NoProfile -ExecutionPolicy Bypass -File $d/atk_make_$id.ps1 || exit 1
[ -f $d/${id}_atk_x8.png ] && [ -f $d/${id}_still_x8.png ] || { echo "attach files missing"; exit 1; }
{ cat <<EOT
Two images are attached.
Image 1 is the current attack animation of a game character: a 2 x 2 sheet on magenta, 4 frames read left to right, top to bottom, enlarged 8 times (every 8x8 block is one sprite pixel).
Image 2 is the NEW design of the same character (one still frame, enlarged 8 times).
Use both as reference images for your image generation tool. Generate ONE new image: a 2 x 2 sheet with the same layout, 4 attack frames of the character of image 2 (same hair, face, armor or clothes, colors, outline, size and position inside its cell).
EOT
  cat $d/motion_$id.txt
  echo "Head, face, body and feet stay identical to image 2 in all 4 frames. Save it as $d/${id}_atk_src.png (save it even if the size differs slightly). Hard square pixels at the same pixel size as the attached images, very dark brown outline, no anti-aliasing, flat solid pure magenta background FF00FF, no grid lines, no text, no shadow, no slash effects. Python is not installed on this computer: do not use python. Use PowerShell Copy-Item to copy the generated file. Do not modify or create any other file."
} > $d/${id}_atk_prompt.txt
CODEX="$(cygpath -u "$(powershell -NoProfile -Command "(Get-AppxPackage OpenAI.Codex).InstallLocation" | tr -d '\r')")/app/resources/codex.exe"
"$CODEX" exec --skip-git-repo-check -s workspace-write -m gpt-6.2-sol -c model_reasoning_effort=medium --image=$d/${id}_atk_x8.png --image=$d/${id}_still_x8.png - < $d/${id}_atk_prompt.txt > $d/${id}_atk.log 2>&1
[ -f $d/${id}_atk_src.png ] && echo "$id: ok" || echo "$id: FAILED"
