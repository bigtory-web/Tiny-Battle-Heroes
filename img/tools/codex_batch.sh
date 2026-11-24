#!/bin/bash
# Draw new-style heroes with Codex, using the knight v2 sprite as the body template.
# Usage: bash img/tools/codex_batch.sh <list file> [suffix]
#   list file: one hero per line, "id|description" (no double quotes in the text)
#              or "id|fixes|previous" to redraw img/pixellab/<previous>_src.png with only those fixes
#   output: img/pixellab/<id>_<suffix>_src.png (1024px, magenta background); clean with gridsnap.ps1
# Run from the project root. Skips heroes whose output already exists, so it can be re-run after failures.
LIST="$1"; SUF="${2:-v3}"; JOBS=4
# the WindowsApps folder cannot be listed, so ask Windows where the Codex app is (the version folder changes on update)
CODEX="$(cygpath -u "$(powershell -NoProfile -Command "(Get-AppxPackage OpenAI.Codex).InstallLocation" | tr -d '\r')")/app/resources/codex.exe"
[ -x "$CODEX" ] || { echo "codex.exe not found"; exit 1; }
TAIL="Rules: keep the knight image as the exact BODY TEMPLATE: the same head size, the same tiny short body and small feet, the same stance and camera angle seen slightly from above, the same overall size inside the picture as the knight (no taller and no wider), and pixel blocks exactly as large as the knight pixel blocks (do not draw finer or coarser pixels). Only replace the hair, headwear, costume and held items: remove the knight sword and shield completely and hold ONLY the items listed for the new character, nothing else; it should look like the same doll wearing a different outfit, drawn by the same artist for the same game. The head must stay as huge as the knight head, wider than the torso, more than half of the body height. Keep weapons, held items, wings, tails and cloth ends close to the body so the whole picture is no wider than the knight with sword and shield; nothing sticks far out to the sides. Head ornaments (hats, crowns, horns, ears) stay smaller than the head itself. Draw hair and cloth as simple solid masses with clean outlines, no loose strands, no thin lines. Same thick dark brown outline, same flat 2 to 3 step shading, same calm muted saturation, hard square pixels, no anti-aliasing, no blur, no gradients. Keep neighbouring parts in clearly different brightness so each part reads separately. Do not use pure magenta or hot pink anywhere on the character. The held weapon or item must read clearly at small size: big enough, a clean simple shape, and in a color that stands out from the costume behind it. Face like the knight: two simple open eyes only, drawn exactly like the knight eyes (same shape, size and spacing, both fully visible, no hair over them), calm, not smiling, no nose, no mouth. Body and held items turned toward the right. Full body centered, flat solid pure magenta background color FF00FF with nothing else in it, square 1024x1024 PNG. Do not modify or create any other file."
run() { # id, description (or fixes), previous attempt name (optional)
  local out="img/pixellab/$1_${SUF}_src.png"
  [ -f "$out" ] && { echo "$1: exists, skipped"; return; }
  local look="Look at the image img/pixellab/knight_v2_x8.png (a chibi pixel art knight girl on a green background)." ask="Draw a NEW character: $2"
  if [ -n "$3" ]; then
    look="Look at two images: img/pixellab/knight_v2_x8.png (style and body reference: a chibi pixel art knight girl on a green background) and img/pixellab/$3_src.png (a previous attempt at another character on a magenta background)."
    ask="Redraw the character from the previous attempt, keeping its design, colors, pose, size and look exactly, changing ONLY this: $2"
  fi
  "$CODEX" exec --skip-git-repo-check -s workspace-write "$look Generate ONE new image with your image generation tool and save it as $out. $ask $TAIL" < /dev/null > "img/pixellab/$1_${SUF}_codex.log" 2>&1 # /dev/null: codex would otherwise eat the rest of the list from stdin
  [ -f "$out" ] && echo "$1: ok" || echo "$1: FAILED (see img/pixellab/$1_${SUF}_codex.log)"
}
while IFS='|' read -r id desc prev; do
  [ -z "$id" ] && continue
  run "$id" "$desc" "$prev" &
  while [ "$(jobs -rp | wc -l)" -ge "$JOBS" ]; do sleep 2; done
done < "$LIST"
wait
