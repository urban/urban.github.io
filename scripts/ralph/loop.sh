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
  echo "Usage: ./scripts/ralph/loop.sh <github-prd-issue-number-or-url> [options]"
  echo ""
  echo "Run multiple Codex passes against a PRD GitHub issue tasks using prompt-once-yolo.md."
  echo ""
  echo "Arguments:"
  echo "  <github-prd-issue-number-or-url>  Issue number (e.g. 123) or full GitHub issue URL"
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

require_single_issue_ref \
  "${#positionals[@]}" \
  "./scripts/ralph/loop.sh <github-prd-issue-number-or-url> [options]"

if ! [[ "$iterations" =~ ^[1-9][0-9]*$ ]]; then
  echo "Error: --iterations must be a positive integer, got: $iterations" >&2
  exit 1
fi

require_core_commands

issue_ref="${positionals[0]}"
issue_number="$(issue_number_from_ref "$issue_ref")"
prd_issues_file="$(mktemp -t prd-issue.XXXXXX.md)"
trap 'rm -f "$prd_issues_file"' EXIT
prompt_file="$script_dir/PROMPT.md"
progress_file="$script_dir/PROGRESS.txt"

require_file "$prompt_file" "Prompt file"
require_file "$progress_file" "Progress file"
write_prd_issue_list "$issue_number" "$prd_issues_file" "1000"
echo "PRD issue file: $prd_issues_file"

for ((i=1; i<=iterations; i++)); do
  echo "Iteration $i"
  echo "--------------------------------"
  result=$(codex exec --dangerously-bypass-approvals-and-sandbox "@$prd_issues_file @$progress_file @$prompt_file")

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
