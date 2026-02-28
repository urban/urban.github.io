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
  echo "  --yolo                             Use dangerous Codex mode (bypass approvals and sandbox)"
  echo "  -h, --help                         Show this help"
}

yolo=false
positionals=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --yolo)
      yolo=true
      shift
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
  echo "Usage: ./scripts/ralph/once.sh <github-prd-issue-number-or-url> [options]" >&2
  exit 1
fi

command -v gh >/dev/null 2>&1 || {
  echo "Error: GitHub CLI (gh) is required." >&2
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
prompt_file="$script_dir/prompt-once.md"
prompt_file_yolo="$script_dir/prompt-once-yolo.md"
progress_file="$script_dir/progress.txt"

if [ ! -f "$prompt_file" ]; then
  echo "Error: Prompt file not found: $prompt_file" >&2
  exit 1
fi

if [ ! -f "$progress_file" ]; then
  echo "Error: Progress file not found: $progress_file" >&2
  exit 1
fi

# gh issue view "$issue_ref" --json number,title,body,url --jq '"# PRD Issue #\(.number): \(.title)\n\nURL: \(.url)\n\n\(.body)"' >"$prd_issues_file"
gh issue list --search "is:open in:body \"#${issue_number}\"" \
  | awk -v id="$issue_number" '$1 != id { print }' >"$prd_issues_file"
echo "PRD issue file: $prd_issues_file"

git_writes_likely_blocked=false
repo_root="$(git rev-parse --show-toplevel)"
repo_root_real="$(cd "$repo_root" && pwd -P)"
git_index_path="$(git rev-parse --git-path index)"
if [[ "$git_index_path" != /* ]]; then
  git_index_path="$repo_root_real/$git_index_path"
fi
git_index_real="$(cd "$(dirname "$git_index_path")" && pwd -P)/$(basename "$git_index_path")"
if [[ "$git_index_real" != "$repo_root_real/"* ]]; then
  git_writes_likely_blocked=true
fi

if [ "$yolo" = true ]; then
  codex exec --dangerously-bypass-approvals-and-sandbox "@$prd_issues_file @$progress_file @$prompt_file_yolo"
else
  # In some worktree layouts, git metadata (for example `.git/index`) is
  # outside the checkout path. In workspace-write sandbox mode, git write
  # operations are likely blocked in that case.
  if [ "$git_writes_likely_blocked" = true ]; then
    echo "Warning: Git metadata appears to be outside the checkout path." >&2
    echo "Warning: sandboxed Codex may be unable to run git write commands." >&2
  fi
  codex -a never exec --sandbox workspace-write "@$prd_issues_file @$progress_file @$prompt_file"
fi
