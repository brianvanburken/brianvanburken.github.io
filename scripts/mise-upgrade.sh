#!/usr/bin/env bash
set -euo pipefail

# Setup committer
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

# Get current branch
BASE=$(git rev-parse --abbrev-ref HEAD)

# Read mise tools
tools=$(mise outdated --bump --json | jq -r 'keys[]')
for tool in $tools; do

  # Bump the tool, if no changes, continue to next
  mise upgrade --bump --local "$tool"
  mise lock
  if git diff --quiet; then
    git checkout -- .
    continue
  fi

  # Take bumped version
  version=$(mise ls --local --json "$tool" | jq -r '.[0].version')
  safe_tool=$(printf '%s' "$tool" | tr -c 'A-Za-z0-9._-' '-')

  # Create PR branch
  BRANCH="mise-upgrade-${safe_tool}-${GITHUB_RUN_ID}"
  git checkout -b "$BRANCH"

  # Add files, commit, and push
  git add mise.toml mise.lock
  MSG="chore(deps): upgrade mise \"$tool\" to $version"
  git commit -m "$MSG"
  git push origin "$BRANCH"

  # Create PR
  gh pr create \
    --base "$BASE" \
    --head "$BRANCH" \
    --title "$MSG" \
    --body "Automated upgrade of \`$tool\` to \`$version\` via \`mise upgrade --bump\`." \
    --label "dependencies" \
    --label "mise"

  git checkout "$BASE"
done
