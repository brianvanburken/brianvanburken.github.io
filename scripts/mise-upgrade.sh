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
  safe_version=$(printf '%s' "$version" | tr -c 'A-Za-z0-9._-' '-')

  BRANCH_PREFIX="mise-upgrade-${safe_tool}-"
  BRANCH="${BRANCH_PREFIX}${safe_version}"

  # Skip if a PR for this exact version already exists
  if gh pr list --head "$BRANCH" --json number --jq '.[0].number' | grep -q .; then
    git checkout -- .
    mise install
    continue
  fi

  # Close any open PRs for older versions of this tool
  gh pr list --state open --json number,headRefName \
    | jq -r --arg prefix "$BRANCH_PREFIX" \
        '.[] | select(.headRefName | startswith($prefix)) | .number' \
    | xargs -r -I{} gh pr close {} --comment "Superseded by a newer version." --delete-branch

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
  mise install
done
