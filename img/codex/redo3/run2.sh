#!/usr/bin/env bash
# redraw heroes with the real game sprites attached to Codex (-i), not just named in the text.  usage (project root): bash img/codex/redo3/run.sh flame vine coral
CODEX="$(cygpath -u "$(powershell -NoProfile -Command "(Get-AppxPackage OpenAI.Codex).InstallLocation" | tr -d '\r')")/app/resources/codex.exe"
for id in "$@"; do
  cat img/codex/redo3/head2.txt img/codex/redo3/$id.txt img/codex/redo3/tail2.txt | sed "s/ID/$id/g" > img/codex/redo3/${id}_prompt2.txt
  "$CODEX" exec --skip-git-repo-check -s workspace-write -m gpt-6.2-sol -c model_reasoning_effort=medium --image=img/codex/redo3/knight_x8.png --image=img/codex/redo3/${id}_x8.png - < img/codex/redo3/${id}_prompt2.txt > img/codex/redo3/${id}2.log 2>&1 &
done
wait
for id in "$@"; do [ -f img/codex/redo3/${id}_src2.png ] && echo "$id: ok" || echo "$id: FAILED"; done
