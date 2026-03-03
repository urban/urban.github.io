#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/common.sh
source "$script_dir/lib/common.sh"

print_help() {
  echo "Usage: ./scripts/ralph/once.sh <github-prd-issue-number-or-url> [options]"
  echo ""
  echo "Run one Codex pass against a PRD GitHub issue using PROMPT.md."
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

require_single_issue_ref \
  "${#positionals[@]}" \
  "./scripts/ralph/once.sh <github-prd-issue-number-or-url> [options]"
require_core_commands

issue_ref="${positionals[0]}"
issue_number="$(issue_number_from_ref "$issue_ref")"
prd_issues_file="$(mktemp -t prd-issue.XXXXXX.md)"
trap 'rm -f "$prd_issues_file"' EXIT
prompt_file="$script_dir/PROMPT.md"
progress_file="$script_dir/PROGRESS.txt"

require_file "$prompt_file" "Prompt file"
require_file "$progress_file" "Progress file"
write_prd_issue_list "$issue_number" "$prd_issues_file"
# echo "PRD issue file: $prd_issues_file"

codex -a never exec --sandbox workspace-write "@$prd_issues_file @$progress_file @$prompt_file"
