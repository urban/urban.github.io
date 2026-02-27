#!/usr/bin/env bash
set -euo pipefail

print_help() {
  echo "Usage: ./scripts/ralph/once.sh <github-prd-issue-number-or-url> [options]"
  echo ""
  echo "Run one Codex pass against a PRD GitHub issue using prompt-once.md."
  echo ""
  echo "Arguments:"
  echo "  <github-prd-issue-number-or-url>  Issue number (e.g. 123) or full GitHub issue URL"
  echo ""
  echo "Options:"
  echo "  -h, --help                         Show this help"
}

positionals=()
while [[ $# -gt 0 ]]; do
  case "$1" in
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
  echo "Usage: ./scripts/ralph/once.sh <github-prd-issue-number-or-url> [options]" >&2
  exit 1
fi

command -v gh >/dev/null 2>&1 || {
  echo "Error: GitHub CLI (gh) is required." >&2
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
prompt_file="$script_dir/prompt-once.md"

if [ ! -f "$prompt_file" ]; then
  echo "Error: Prompt file not found: $prompt_file" >&2
  exit 1
fi

# gh issue view "$issue_ref" --json number,title,body,url --jq '"# PRD Issue #\(.number): \(.title)\n\nURL: \(.url)\n\n\(.body)"' >"$prd_issues_file"
gh issue list --search "is:open in:body \"#${issue_number}\"" \
  | awk -v id="$issue_number" '$1 != id { print }' >"$prd_issues_file"
echo "PRD issue file: $prd_issues_file"

# codex exec -a never --sandbox workspace-write "@$prd_issues_file @progress.txt @$prompt_file"
codex exec -a never --sandbox workspace-write "@$prd_issues_file @progress.txt @$prompt_file"
