#!/bin/bash
# Schedule the deterministic collector, never an unrestricted agent.
set -euo pipefail
umask 077

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
PYTHON_BIN=$(command -v python3) || { echo "Python 3.9+ is required."; exit 1; }
export JUNSHI_HOME=${JUNSHI_HOME:-"$HOME/.junshi"}
JUNSHI_HOME=$("$PYTHON_BIN" -c 'import os,pathlib; print(pathlib.Path(os.environ["JUNSHI_HOME"]).expanduser().resolve())')
export JUNSHI_HOME

if [[ ! -f "$JUNSHI_HOME/config.json" || ! -f "$JUNSHI_HOME/memory.sqlite3" ]]; then
  echo "Run research-junshi interactively first to configure sources and research interests."
  exit 1
fi
# Validate before touching the user's crontab.
"$PYTHON_BIN" -B - "$SCRIPT_DIR/scripts" <<'PY'
import json, sys
sys.path.insert(0, sys.argv[1])
from daily import validate_config
from junshi import Memory
m = Memory()
try:
    validate_config(json.loads((m.root / "config.json").read_text()))
    if not any((x["kind"] in ("interest", "project") and x["status"] == "active") or x["status"] == "liked" for x in m.context()):
        raise SystemExit("Add an active interest/project or liked memory first.")
finally:
    m.close()
PY

read -r -p "Daily time in this machine's timezone (HH:MM, default 08:00): " RUN_TIME
RUN_TIME=${RUN_TIME:-08:00}
if [[ ! "$RUN_TIME" =~ ^([01][0-9]|2[0-3]):([0-5][0-9])$ ]]; then
  echo "Invalid time; use HH:MM."
  exit 1
fi
HOUR=$((10#${RUN_TIME:0:2}))
MINUTE=$((10#${RUN_TIME:3:2}))

# Cron treats '%' specially even inside quotes; reject ambiguous paths.
for value in "$SCRIPT_DIR" "$PYTHON_BIN" "$JUNSHI_HOME"; do
  if [[ "$value" == *%* || "$value" == *$'\n'* || "$value" == *$'\r'* ]]; then
    echo "Cron paths must not contain percent signs or newlines."
    exit 1
  fi
done
CRON_CMD=$("$PYTHON_BIN" - "$PYTHON_BIN" "$SCRIPT_DIR/scripts/daily.py" "$JUNSHI_HOME" <<'PY'
import shlex, sys
python, script, home = sys.argv[1:]
print("JUNSHI_HOME=" + shlex.quote(home) + " " + shlex.join([python, "-B", script]) + " >> " + shlex.quote(home + "/cron-junshi.log") + " 2>&1")
PY
)
if ! EXISTING=$(LC_ALL=C crontab -l 2>&1); then
  if [[ "$EXISTING" == *"no crontab for"* ]]; then
    EXISTING=""
  else
    echo "Cannot safely read existing crontab: $EXISTING"
    exit 1
  fi
fi
if [[ "$EXISTING" == *research-junshi* ]]; then
  echo "Existing Junshi job(s):"
  printf '%s\n' "$EXISTING" | grep 'research-junshi'
  read -r -p "Replace these Junshi lines (including any legacy job)? [y/N]: " REPLACE
  [[ "$REPLACE" == y || "$REPLACE" == Y ]] || exit 0
fi
echo "Will schedule: $MINUTE $HOUR * * * $CRON_CMD # research-junshi"
read -r -p "Install this daily metadata digest job? [y/N]: " INSTALL
[[ "$INSTALL" == y || "$INSTALL" == Y ]] || exit 0
{ printf '%s\n' "$EXISTING" | awk '!/research-junshi/';
  printf '%s\n' "$MINUTE $HOUR * * * $CRON_CMD # research-junshi";
} | crontab -
echo "Scheduled at $RUN_TIME. Digests: $JUNSHI_HOME/digests/"
echo "Inspect or remove the marked Junshi line with: crontab -e"
