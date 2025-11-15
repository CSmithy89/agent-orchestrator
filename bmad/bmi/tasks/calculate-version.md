# Task: Calculate Version

**Purpose:** Calculate the next semantic version based on commits, changes, or explicit version bump

**Used By:** release, hotfix, changelog-generation workflows

**Inputs:**
- `current_version` - Current version (e.g., "1.2.3")
- `version_bump` - Explicit bump type (major, minor, patch, prerelease, auto) - defaults to "auto"
- `prerelease_identifier` - For prereleases (alpha, beta, rc) - optional
- `commit_range` - Git commit range to analyze (e.g., "v1.2.3..HEAD") - for auto detection
- `package_ecosystem` - Ecosystem (nodejs_npm, python_pypi, etc.) - for version file detection

**Outputs:**
- `next_version` - Calculated next version (e.g., "1.3.0")
- `version_bump_type` - Detected or applied bump type (major, minor, patch)
- `breaking_changes_detected` - Boolean indicating if breaking changes were found

---

## Version Bump Decision Logic

### 1. Explicit Version Bump (manual)

If `version_bump` is specified and not "auto":
- `major` → Increment major version (1.2.3 → 2.0.0)
- `minor` → Increment minor version (1.2.3 → 1.3.0)
- `patch` → Increment patch version (1.2.3 → 1.2.4)
- `prerelease` → Increment prerelease (1.2.3 → 1.2.4-alpha.1)

### 2. Auto-Detection from Conventional Commits

If `version_bump` is "auto", analyze commits in `commit_range`:

```bash
# Breaking changes (MAJOR bump)
git log v1.2.3..HEAD --oneline | grep -E "BREAKING CHANGE|!"

# Features (MINOR bump)
git log v1.2.3..HEAD --oneline | grep "^feat"

# Fixes (PATCH bump)
git log v1.2.3..HEAD --oneline | grep "^fix"
```

**Decision Tree:**
1. If breaking changes detected → MAJOR bump
2. Else if features detected → MINOR bump
3. Else if fixes detected → PATCH bump
4. Else → PATCH bump (default)

---

## Implementation Example

```bash
#!/bin/bash

# Function to calculate next version
calculate_version() {
  local current_version=$1
  local version_bump=$2  # major, minor, patch, prerelease, auto
  local prerelease_identifier=$3  # alpha, beta, rc (optional)
  local commit_range=$4  # e.g., "v1.2.3..HEAD"

  # Parse current version
  if [[ $current_version =~ ^v?([0-9]+)\.([0-9]+)\.([0-9]+)(-([a-zA-Z0-9.]+))?$ ]]; then
    local major="${BASH_REMATCH[1]}"
    local minor="${BASH_REMATCH[2]}"
    local patch="${BASH_REMATCH[3]}"
    local prerelease="${BASH_REMATCH[5]}"
  else
    echo "❌ Invalid version format: $current_version"
    exit 1
  fi

  local next_version=""
  local bump_type=""
  local breaking_detected=false

  # Auto-detect version bump from commits
  if [ "$version_bump" = "auto" ]; then
    # Check for breaking changes
    if git log "$commit_range" --oneline | grep -qE "BREAKING CHANGE|feat!|fix!|refactor!"; then
      version_bump="major"
      breaking_detected=true
    # Check for features
    elif git log "$commit_range" --oneline | grep -q "^feat"; then
      version_bump="minor"
    # Check for fixes
    elif git log "$commit_range" --oneline | grep -q "^fix"; then
      version_bump="patch"
    else
      # Default to patch if commits exist
      version_bump="patch"
    fi
  fi

  # Calculate next version
  case "$version_bump" in
    major)
      major=$((major + 1))
      minor=0
      patch=0
      next_version="${major}.${minor}.${patch}"
      bump_type="major"
      ;;
    minor)
      minor=$((minor + 1))
      patch=0
      next_version="${major}.${minor}.${patch}"
      bump_type="minor"
      ;;
    patch)
      patch=$((patch + 1))
      next_version="${major}.${minor}.${patch}"
      bump_type="patch"
      ;;
    prerelease)
      # Handle prerelease versioning
      if [ -z "$prerelease" ]; then
        # First prerelease
        patch=$((patch + 1))
        next_version="${major}.${minor}.${patch}-${prerelease_identifier}.1"
      else
        # Increment prerelease number
        if [[ $prerelease =~ ^([a-zA-Z]+)\.([0-9]+)$ ]]; then
          local pre_name="${BASH_REMATCH[1]}"
          local pre_num="${BASH_REMATCH[2]}"
          pre_num=$((pre_num + 1))
          next_version="${major}.${minor}.${patch}-${pre_name}.${pre_num}"
        else
          next_version="${major}.${minor}.${patch}-${prerelease_identifier}.1"
        fi
      fi
      bump_type="prerelease"
      ;;
    *)
      echo "❌ Invalid version bump type: $version_bump"
      exit 1
      ;;
  esac

  # Output results
  echo "next_version=${next_version}"
  echo "version_bump_type=${bump_type}"
  echo "breaking_changes_detected=${breaking_detected}"

  # Return as JSON for easier parsing
  cat <<EOF
{
  "next_version": "${next_version}",
  "version_bump_type": "${bump_type}",
  "breaking_changes_detected": ${breaking_detected},
  "current_version": "${current_version}"
}
EOF
}

# Usage
calculate_version "1.2.3" "auto" "" "v1.2.3..HEAD"
```

---

## Reading Current Version from Package Files

### Node.js (package.json)

```bash
current_version=$(jq -r '.version' package.json)
```

### Python (pyproject.toml or setup.py)

```bash
# pyproject.toml
current_version=$(grep -E '^version\s*=' pyproject.toml | sed -E 's/version\s*=\s*"(.+)"/\1/')

# Or use poetry
current_version=$(poetry version -s)
```

### Rust (Cargo.toml)

```bash
current_version=$(grep -E '^version\s*=' Cargo.toml | head -1 | sed -E 's/version\s*=\s*"(.+)"/\1/')
```

### Go (version in git tags)

```bash
current_version=$(git describe --tags --abbrev=0 2>/dev/null | sed 's/^v//')
```

### .NET (*.csproj)

```bash
current_version=$(grep -oP '<Version>\K[^<]+' *.csproj | head -1)
```

---

## Writing Next Version to Package Files

### Node.js (package.json)

```bash
jq ".version = \"${next_version}\"" package.json > package.json.tmp
mv package.json.tmp package.json
```

### Python (pyproject.toml)

```bash
sed -i "s/^version\s*=.*/version = \"${next_version}\"/" pyproject.toml
```

### Rust (Cargo.toml)

```bash
sed -i "0,/^version\s*=.*/s//version = \"${next_version}\"/" Cargo.toml
```

### .NET (*.csproj)

```bash
sed -i "s/<Version>.*<\/Version>/<Version>${next_version}<\/Version>/" *.csproj
```

---

## Usage Example

```yaml
# From release workflow
<step n="4" goal="Calculate Next Version">
  <action>Invoke task: calculate-version</action>
    - current_version: {current_version from package file}
    - version_bump: {version_bump_type}  # or "auto"
    - prerelease_identifier: {prerelease_id if applicable}
    - commit_range: "{last_tag}..HEAD"

  <action>Parse output JSON to get next_version</action>
  <action>Display: "Version bump: {current_version} → {next_version} ({bump_type})"</action>
  <action if="breaking_changes_detected">WARN: "Breaking changes detected!"</action>
</step>
```

---

## Conventional Commit Detection Patterns

### Breaking Changes (MAJOR bump)

```
feat!: new API breaking backward compatibility
fix!: remove deprecated method
BREAKING CHANGE: API endpoint changed
```

### Features (MINOR bump)

```
feat: add new user authentication
feat(api): add new endpoint for profile
```

### Fixes (PATCH bump)

```
fix: resolve null pointer exception
fix(ui): correct button alignment
```

### Other commit types (PATCH bump)

```
refactor: simplify authentication logic
perf: improve database query performance
docs: update API documentation
```

---

## Prerelease Version Examples

### Alpha releases

```
1.2.3 → 1.2.4-alpha.1 (first alpha)
1.2.4-alpha.1 → 1.2.4-alpha.2 (next alpha)
```

### Beta releases

```
1.2.4-alpha.3 → 1.2.4-beta.1 (promote to beta)
1.2.4-beta.1 → 1.2.4-beta.2 (next beta)
```

### Release candidates

```
1.2.4-beta.2 → 1.2.4-rc.1 (promote to rc)
1.2.4-rc.1 → 1.2.4 (promote to stable)
```

---

## Hotfix Version Calculation

For hotfix releases:
- Always PATCH bump from production version
- Never MAJOR or MINOR bump in hotfix

```bash
# If production is 1.2.3 and hotfix needed
hotfix_version="1.2.4"

# If hotfix on older version (e.g., 1.1.5 still in use)
hotfix_version="1.1.6"
```
