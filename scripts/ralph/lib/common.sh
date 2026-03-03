#!/usr/bin/env bash

die() {
  echo "Error: $*" >&2
  exit 1
}

require_command() {
  local command_name="$1"
  local display_name="$2"

  command -v "$command_name" >/dev/null 2>&1 || die "$display_name is required."
}

require_core_commands() {
  require_command "gh" "GitHub CLI (gh)"
  require_command "git" "git"
  require_command "codex" "Codex CLI"
}

require_single_issue_ref() {
  local positional_count="$1"
  local usage="$2"

  if [ "$positional_count" -ne 1 ]; then
    echo "Error: Exactly one GitHub PRD issue reference is required" >&2
    echo "Usage: $usage" >&2
    exit 1
  fi
}

issue_number_from_ref() {
  local issue_ref="$1"
  gh issue view "$issue_ref" --json number --jq '.number'
}

require_file() {
  local file_path="$1"
  local display_name="$2"

  [ -f "$file_path" ] || die "$display_name not found: $file_path"
}

write_prd_issue_list() {
  local issue_number="$1"
  local output_file="$2"
  local limit="${3:-}"
  local search_query

  printf -v search_query 'is:open in:body "#%s"' "$issue_number"

  if [ -n "$limit" ]; then
    gh issue list --limit "$limit" --search "$search_query" \
      | awk -v id="$issue_number" '$1 != id { print }' >"$output_file"
    return
  fi

  gh issue list --search "$search_query" \
    | awk -v id="$issue_number" '$1 != id { print }' >"$output_file"
}
