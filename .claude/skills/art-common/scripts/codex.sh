#!/usr/bin/env bash
# run the Codex CLI bundled with the desktop app.  usage (from the project root): codex.sh prompt.txt [log.txt]
CODEX="$(cygpath -u "$(powershell -NoProfile -Command "(Get-AppxPackage OpenAI.Codex).InstallLocation" | tr -d '\r')")/app/resources/codex.exe"
"$CODEX" exec --skip-git-repo-check -s workspace-write -m gpt-6.2-sol -c model_reasoning_effort=medium - < "$1" > "${2:-${1%.txt}.log}" 2>&1
