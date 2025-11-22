# Task: Generate Release Notes

**Purpose:** Generate release notes from commits, PRs, and changelog

**Used By:** release, changelog-generation workflows

**Inputs:**
- `commit_range` - Git commit range to analyze (e.g., "v1.2.3..HEAD")
- `release_version` - Version being released (e.g., "1.3.0")
- `release_type` - Type of release (major, minor, patch, prerelease, hotfix)
- `changelog_format` - Format (keep-a-changelog, conventional-commits, github-releases, custom)
- `include_prs` - Boolean to include PR links (default: true)
- `include_contributors` - Boolean to include contributor list (default: true)

**Outputs:**
- `release_notes` - Generated release notes in markdown
- `breaking_changes` - List of breaking changes detected
- `contributors` - List of contributors for this release

---

## Release Notes Structure

### Keep a Changelog Format

```markdown
## [1.3.0] - 2025-11-15

### Added
- New user authentication system (#123)
- Support for OAuth2 providers (#125)

### Changed
- Updated database schema for better performance (#127)
- Improved error messages (#128)

### Deprecated
- Legacy authentication API (will be removed in 2.0.0)

### Removed
- Support for Node.js 14 (EOL)

### Fixed
- Null pointer exception in user service (#130)
- Memory leak in websocket handler (#132)

### Security
- Patched XSS vulnerability in input validation (#135)

### Breaking Changes
- Authentication API endpoint changed from /auth to /api/v2/auth
- Removed deprecated getUserById() method
```

### Conventional Commits Format

```markdown
# 1.3.0 (2025-11-15)

## Features

* **auth:** add OAuth2 provider support (abc1234)
* **ui:** implement dark mode toggle (def5678)

## Bug Fixes

* **api:** resolve null pointer in user service (ghi9012)
* **websocket:** fix memory leak in handler (jkl3456)

## Performance Improvements

* **database:** optimize query performance with indexes (mno7890)

## BREAKING CHANGES

* **auth:** Authentication endpoint changed to /api/v2/auth
```

### GitHub Releases Format

```markdown
## What's Changed

### New Features 🚀
* Add OAuth2 provider support by @username in #123
* Implement dark mode toggle by @username in #125

### Bug Fixes 🐛
* Fix null pointer in user service by @username in #130
* Resolve memory leak in websocket by @username in #132

### Performance Improvements ⚡
* Optimize database queries by @username in #127

### Documentation 📚
* Update API documentation by @username in #128

**Full Changelog**: https://github.com/org/repo/compare/v1.2.3...v1.3.0
```

---

## Implementation Example

```bash
#!/bin/bash

# Function to generate release notes
generate_release_notes() {
  local commit_range=$1
  local release_version=$2
  local release_type=$3
  local changelog_format=$4
  local include_prs=${5:-true}
  local include_contributors=${6:-true}

  local release_date=$(date +%Y-%m-%d)
  local release_notes=""
  local breaking_changes=()
  local contributors=()

  echo "📝 Generating release notes for ${release_version}..."

  # Collect commits
  local commits=$(git log "$commit_range" --oneline --no-merges)

  # Parse commits by type
  local features=$(echo "$commits" | grep "^[a-f0-9]* feat" || true)
  local fixes=$(echo "$commits" | grep "^[a-f0-9]* fix" || true)
  local breaking=$(git log "$commit_range" --oneline --grep="BREAKING CHANGE" --grep="!" --grep-reflog || true)
  local perf=$(echo "$commits" | grep "^[a-f0-9]* perf" || true)
  local refactor=$(echo "$commits" | grep "^[a-f0-9]* refactor" || true)
  local docs=$(echo "$commits" | grep "^[a-f0-9]* docs" || true)
  local chore=$(echo "$commits" | grep "^[a-f0-9]* chore" || true)
  local security=$(git log "$commit_range" --oneline --grep="security" --grep="vulnerability" -i || true)

  # Get contributors
  if [ "$include_contributors" = true ]; then
    contributors=($(git log "$commit_range" --format="%an" | sort -u))
  fi

  # Generate release notes based on format
  case "$changelog_format" in
    keep-a-changelog)
      release_notes=$(generate_keep_a_changelog_format)
      ;;
    conventional-commits)
      release_notes=$(generate_conventional_commits_format)
      ;;
    github-releases)
      release_notes=$(generate_github_releases_format)
      ;;
    custom)
      release_notes=$(generate_custom_format)
      ;;
    *)
      echo "❌ Unknown changelog format: $changelog_format"
      return 1
      ;;
  esac

  # Output results
  echo "$release_notes"

  # Output breaking changes
  if [ -n "$breaking" ]; then
    echo ""
    echo "## Breaking Changes Detected:"
    echo "$breaking"
  fi

  # Output contributors
  if [ "$include_contributors" = true ]; then
    echo ""
    echo "## Contributors (${#contributors[@]}):"
    printf '%s\n' "${contributors[@]}"
  fi
}

# Generate Keep a Changelog format
generate_keep_a_changelog_format() {
  cat <<EOF
## [${release_version}] - ${release_date}

### Added
$(format_commits "$features" "keep-a-changelog")

### Changed
$(format_commits "$refactor" "keep-a-changelog")

### Fixed
$(format_commits "$fixes" "keep-a-changelog")

### Security
$(format_commits "$security" "keep-a-changelog")

### Performance
$(format_commits "$perf" "keep-a-changelog")

### Breaking Changes
$(format_commits "$breaking" "keep-a-changelog")
EOF
}

# Generate Conventional Commits format
generate_conventional_commits_format() {
  cat <<EOF
# ${release_version} (${release_date})

## Features
$(format_commits "$features" "conventional-commits")

## Bug Fixes
$(format_commits "$fixes" "conventional-commits")

## Performance Improvements
$(format_commits "$perf" "conventional-commits")

## Refactoring
$(format_commits "$refactor" "conventional-commits")

## Documentation
$(format_commits "$docs" "conventional-commits")

## BREAKING CHANGES
$(format_breaking_changes "$breaking")
EOF
}

# Generate GitHub Releases format
generate_github_releases_format() {
  cat <<EOF
## What's Changed in ${release_version}

### New Features 🚀
$(format_commits_with_prs "$features")

### Bug Fixes 🐛
$(format_commits_with_prs "$fixes")

### Performance Improvements ⚡
$(format_commits_with_prs "$perf")

### Documentation 📚
$(format_commits_with_prs "$docs")

### Other Changes
$(format_commits_with_prs "$chore")

**Full Changelog**: https://github.com/${GITHUB_REPO}/compare/${previous_tag}...v${release_version}
EOF
}

# Format commits for different styles
format_commits() {
  local commits=$1
  local format=$2

  if [ -z "$commits" ]; then
    echo "- No changes"
    return
  fi

  while IFS= read -r commit; do
    local hash=$(echo "$commit" | awk '{print $1}')
    local message=$(echo "$commit" | cut -d' ' -f2-)

    # Remove conventional commit prefix
    message=$(echo "$message" | sed -E 's/^(feat|fix|perf|refactor|docs|chore|test|style|ci|build)(\([^)]+\))?: //')

    # Extract PR number if present
    local pr_number=$(echo "$message" | grep -oE '\(#[0-9]+\)' | head -1)

    if [ "$format" = "keep-a-changelog" ]; then
      echo "- ${message} (${hash:0:7})"
    elif [ "$format" = "conventional-commits" ]; then
      echo "* ${message} (${hash:0:7})"
    fi
  done <<< "$commits"
}

# Format commits with PR links
format_commits_with_prs() {
  local commits=$1

  if [ -z "$commits" ]; then
    echo "- No changes"
    return
  fi

  while IFS= read -r commit; do
    local hash=$(echo "$commit" | awk '{print $1}')
    local message=$(echo "$commit" | cut -d' ' -f2-)

    # Remove conventional commit prefix
    message=$(echo "$message" | sed -E 's/^(feat|fix|perf|refactor|docs|chore|test|style|ci|build)(\([^)]+\))?: //')

    # Extract PR number if present
    local pr_number=$(echo "$message" | grep -oE '#[0-9]+' | head -1)

    # Get author
    local author=$(git log -1 --format="%an" "$hash")

    if [ -n "$pr_number" ]; then
      echo "* ${message} by @${author} in ${pr_number}"
    else
      echo "* ${message} by @${author} (${hash:0:7})"
    fi
  done <<< "$commits"
}

# Format breaking changes with details
format_breaking_changes() {
  local breaking_commits=$1

  if [ -z "$breaking_commits" ]; then
    echo "- No breaking changes"
    return
  fi

  while IFS= read -r commit; do
    local hash=$(echo "$commit" | awk '{print $1}')

    # Get full commit message with body
    local full_message=$(git log -1 --format="%B" "$hash")

    # Extract BREAKING CHANGE section if present
    local breaking_section=$(echo "$full_message" | sed -n '/BREAKING CHANGE:/,/^$/p')

    if [ -n "$breaking_section" ]; then
      echo "### ${hash:0:7}"
      echo "$breaking_section"
      echo ""
    else
      local message=$(echo "$commit" | cut -d' ' -f2-)
      echo "* ${message} (${hash:0:7})"
    fi
  done <<< "$breaking_commits"
}

# Usage
generate_release_notes "v1.2.3..HEAD" "1.3.0" "minor" "keep-a-changelog" true true
```

---

## Usage Example

```yaml
# From release workflow
<step n="8" goal="Generate Release Notes">
  <action>Invoke task: generate-release-notes</action>
    - commit_range: "{last_tag}..HEAD"
    - release_version: {version}
    - release_type: {release_type}
    - changelog_format: "keep-a-changelog"
    - include_prs: true
    - include_contributors: true

  <action>Save release notes to: {output_folder}/RELEASE_NOTES_{version}.md</action>
  <action>Display release notes preview</action>
  <action>Append to CHANGELOG.md</action>
</step>
```

---

## Extracting PR Information

### Using GitHub CLI

```bash
# Get PR number from commit
pr_number=$(gh pr list --search "$commit_hash" --state merged --json number --jq '.[0].number')

# Get PR details
gh pr view "$pr_number" --json title,author,labels
```

### From Commit Message

```bash
# Extract PR number from merge commit
pr_number=$(git log -1 --oneline "$commit_hash" | grep -oE '#[0-9]+' | sed 's/#//')
```

---

## Breaking Changes Detection

### From Conventional Commits

```
feat!: change API endpoint structure

BREAKING CHANGE: The /api/users endpoint has been moved to /api/v2/users
```

### From Commit Body

```bash
# Search commit bodies for BREAKING CHANGE
git log v1.2.3..HEAD --format="%H %s" --grep="BREAKING CHANGE"
```

---

## Contributors List

### With GitHub Usernames

```bash
# Get contributors with GitHub usernames
git log v1.2.3..HEAD --format="%an|%ae" | sort -u | while IFS='|' read name email; do
  gh api "search/users?q=$email" --jq '.items[0].login' 2>/dev/null || echo "$name"
done
```

### With Commit Counts

```bash
# Get contributors with commit counts
git shortlog -sn v1.2.3..HEAD
```

---

## Custom Release Notes Template

Create custom templates for specific needs:

```markdown
## 🎉 ${release_version} Release

**Release Date:** ${release_date}
**Release Type:** ${release_type}

### ✨ Highlights

${highlights}

### 📊 Statistics

- **Commits:** ${commit_count}
- **Contributors:** ${contributor_count}
- **Files Changed:** ${files_changed}
- **Lines Added:** ${lines_added}
- **Lines Removed:** ${lines_removed}

### 🚀 New Features

${features}

### 🐛 Bug Fixes

${fixes}

### ⚠️ Breaking Changes

${breaking_changes}

### 👥 Contributors

Thanks to our amazing contributors:
${contributors}
```

---

## Automated Release Notes via GitHub

### Using GitHub Actions

```yaml
- name: Generate Release Notes
  uses: actions/github-script@v6
  with:
    script: |
      const { data } = await github.rest.repos.generateReleaseNotes({
        owner: context.repo.owner,
        repo: context.repo.repo,
        tag_name: 'v${{ inputs.version }}',
        previous_tag_name: '${{ inputs.previous_tag }}'
      });
      return data.body;
```
