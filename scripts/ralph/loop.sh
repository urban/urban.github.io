#!/usr/bin/env bash
set -euo pipefail

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

if [ "${#positionals[@]}" -ne 1 ]; then
  echo "Error: Exactly one GitHub PRD issue reference is required" >&2
  echo "Usage: ./scripts/ralph/loop.sh <github-prd-issue-number-or-url> [options]" >&2
  exit 1
fi

if ! [[ "$iterations" =~ ^[1-9][0-9]*$ ]]; then
  echo "Error: --iterations must be a positive integer, got: $iterations" >&2
  exit 1
fi

command -v gh >/dev/null 2>&1 || {
  echo "Error: GitHub CLI (gh) is required." >&2
  exit 1
}
command -v docker >/dev/null 2>&1 || {
  echo "Error: Docker CLI is required." >&2
  exit 1
}
docker sandbox --help >/dev/null 2>&1 || {
  echo "Error: Docker sandbox command is required (docker sandbox ...)." >&2
  exit 1
}
command -v git >/dev/null 2>&1 || {
  echo "Error: git is required." >&2
  exit 1
}
command -v codex >/dev/null 2>&1 || {
  echo "Error: Codex CLI is required." >&2
  exit 1
}

issue_ref="${positionals[0]}"
issue_number="$(gh issue view "$issue_ref" --json number --jq '.number')"
prd_issues_file="$(mktemp -t prd-issue.XXXXXX.md)"
trap 'rm -f "$prd_issues_file"' EXIT
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
prompt_file="$script_dir/prompt-once-yolo.md"
progress_file="$script_dir/progress.txt"

if [ ! -f "$prompt_file" ]; then
  echo "Error: Prompt file not found: $prompt_file" >&2
  exit 1
fi

if [ ! -f "$progress_file" ]; then
  echo "Error: Progress file not found: $progress_file" >&2
  exit 1
fi


gh issue list --limit 1000 --search "is:open in:body \"#${issue_number}\"" \
  | awk -v id="$issue_number" '$1 != id { print }' >"$prd_issues_file"
echo "PRD issue file: $prd_issues_file"

for ((i=1; i<=iterations; i++)); do
  echo "Iteration $i"
  echo "--------------------------------"
  result=$(docker sandbox run codex exec --dangerously-bypass-approvals-and-sandbox "@$prd_issues_file @$progress_file @$prompt_file")

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
