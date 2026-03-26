#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/common.sh
source "$script_dir/lib/common.sh"

notify() {
  if command -v tt >/dev/null 2>&1; then
    tt notify "$1" || true
  fi
}

print_help() {
  echo "Usage: packages/agent-skills/scripts/ralph/loop.sh [input-file-path] [options]"
  echo ""
  echo "Run multiple Codex passes against a local input file."
  echo ""
  echo "Arguments:"
  echo "  [input-file-path]                 Local file passed to Codex with @file syntax"
  echo "                                    Default: packages/ralph/scripts/ralph/CHECKLIST.md"
  echo ""
  echo "Options:"
  echo "  -i, --iterations <count>           Number of iterations to run (default: 10)"
  echo "  -h, --help                         Show this help"
}

iterations=10
positionals=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    -i|--iterations)
      if [[ $# -lt 2 ]]; then
        echo "Error: $1 requires a value" >&2
        exit 1
      fi
      iterations="$2"
      shift 2
      ;;
    -h|--help)
      print_help
      exit 0
      ;;
    --*)
      echo "Unknown option: $1" >&2
      echo "Use --help for usage information" >&2
      exit 1
      ;;
    *)
      positionals+=("$1")
      shift
      ;;
  esac
done

if [[ "${#positionals[@]}" -gt 1 ]]; then
  echo "Error: At most one input file path is allowed" >&2
  echo "Usage: packages/ralph/scripts/ralph/loop.sh [input-file-path] [options]" >&2
  exit 1
fi

if ! [[ "$iterations" =~ ^[1-9][0-9]*$ ]]; then
  echo "Error: --iterations must be a positive integer, got: $iterations" >&2
  exit 1
fi

require_command "codex" "Codex CLI"

input_file="${positionals[0]:-$script_dir/CHECKLIST.md}"
instruction_file="$script_dir/INSTRUCTIONS.md"
progress_file="$script_dir/progress.txt"

require_file "$input_file" "Input file"
require_file "$instruction_file" "Prompt file"
require_file "$progress_file" "Progress file"

for ((i=1; i<=iterations; i++)); do
  echo "Iteration $i"
  echo "--------------------------------"
  result=$(codex exec --dangerously-bypass-approvals-and-sandbox "@$input_file @$progress_file @$instruction_file")

  echo "$result"

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "PRD complete, exiting."
    notify "PRD complete after $i iterations"
    exit 0
  fi
done

echo "PRD not complete after $iterations iterations." >&2
notify "PRD not complete after $iterations iterations"
exit 1
