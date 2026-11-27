#!/usr/bin/env bash
# redraw heroes with the real game sprites attached to Codex (-i), not just named in the text.  usage (project root): bash img/codex/redo3/run.sh flame vine coral
CODEX="$(cygpath -u "$(powershell -NoProfile -Command "(Get-AppxPackage OpenAI.Codex).InstallLocation" | tr -d '\r')")/app/resources/codex.exe"
for id in "$@"; do
  cat img/codex/redo3/head.txt img/codex/redo3/$id.txt img/codex/redo3/tail.txt | sed "s/ID/$id/g" > img/codex/redo3/${id}_prompt.txt
  "$CODEX" exec --skip-git-repo-check -s workspace-write -m gpt-6.2-sol -c model_reasoning_effort=medium --image=img/p/knight.png --image=img/p/$id.png - < img/codex/redo3/${id}_prompt.txt > img/codex/redo3/$id.log 2>&1 &
done
wait
for id in "$@"; do [ -f img/codex/redo3/${id}_src.png ] && echo "$id: ok" || echo "$id: FAILED"; done
