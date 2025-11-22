# Task: Publish to Registry

**Purpose:** Publish package to the appropriate registry (npm, PyPI, crates.io, NuGet, etc.)

**Used By:** release, hotfix workflows

**Inputs:**
- `package_ecosystem` - Ecosystem (nodejs_npm, python_pypi, rust_crates, etc.)
- `registry` - Target registry (npm, PyPI, crates.io, NuGet, etc.)
- `version` - Version being published (e.g., "1.2.3")
- `registry_token_env` - Environment variable name for registry token (e.g., "NPM_TOKEN")
- `dry_run` - Boolean to test publish without actually publishing (default: false)
- `access` - Access level (public, restricted) - for npm

**Outputs:**
- `publish_success` - Boolean indicating if publish succeeded
- `registry_url` - URL to published package on registry
- `publish_time` - Time taken to publish

---

## Registry Detection

Based on `package_ecosystem`, select the appropriate publish command:

| Ecosystem | Registry | Publish Command |
|-----------|----------|-----------------|
| nodejs_npm | npm | `npm publish` |
| python_pypi | PyPI | `twine upload dist/*` |
| rust_crates | crates.io | `cargo publish` |
| dotnet_nuget | NuGet | `dotnet nuget push` |
| ruby_gems | RubyGems | `gem push` |
| go_pkg | Go Proxy | `GOPROXY=proxy.golang.org go list -m` |
| java_maven | Maven Central | `mvn deploy` |
| php_packagist | Packagist | Auto via GitHub webhook |

---

## Implementation Example

```bash
#!/bin/bash

# Function to publish to registry
publish_to_registry() {
  local package_ecosystem=$1
  local registry=$2
  local version=$3
  local registry_token_env=$4
  local dry_run=${5:-false}
  local access=${6:-public}

  local publish_success=false
  local registry_url=""
  local start_time=$(date +%s)

  echo "📦 Publishing ${version} to ${registry}..."

  # Authenticate if token provided
  if [ -n "$registry_token_env" ]; then
    local token="${!registry_token_env}"
    if [ -z "$token" ]; then
      echo "❌ Registry token not found: ${registry_token_env}"
      return 1
    fi
  fi

  # Publish based on ecosystem
  case "$package_ecosystem" in
    nodejs_npm)
      publish_nodejs_npm "$version" "$token" "$dry_run" "$access"
      ;;
    python_pypi)
      publish_python_pypi "$version" "$token" "$dry_run"
      ;;
    rust_crates)
      publish_rust_crates "$version" "$token" "$dry_run"
      ;;
    dotnet_nuget)
      publish_dotnet_nuget "$version" "$token" "$dry_run"
      ;;
    ruby_gems)
      publish_ruby_gems "$version" "$token" "$dry_run"
      ;;
    go_pkg)
      publish_go_pkg "$version"
      ;;
    java_maven)
      publish_java_maven "$version" "$dry_run"
      ;;
    php_packagist)
      publish_php_packagist "$version"
      ;;
    *)
      echo "❌ Unsupported package ecosystem: $package_ecosystem"
      return 1
      ;;
  esac

  local exit_code=$?
  local end_time=$(date +%s)
  local publish_time=$((end_time - start_time))

  if [ $exit_code -eq 0 ]; then
    publish_success=true
    echo "✅ Published successfully to ${registry} in ${publish_time}s"
  else
    echo "❌ Publish failed with exit code: $exit_code"
  fi

  # Output results
  echo "publish_success=${publish_success}"
  echo "registry_url=${registry_url}"
  echo "publish_time=${publish_time}s"
}

# Node.js npm publish
publish_nodejs_npm() {
  local version=$1
  local token=$2
  local dry_run=$3
  local access=$4

  # Configure npm authentication
  if [ -n "$token" ]; then
    echo "//registry.npmjs.org/:_authToken=${token}" > ~/.npmrc
  fi

  # Build if needed
  if [ -f "package.json" ] && jq -e '.scripts.build' package.json > /dev/null; then
    echo "Building package..."
    npm run build
  fi

  # Publish
  if [ "$dry_run" = true ]; then
    npm publish --dry-run --access "$access"
  else
    npm publish --access "$access"
  fi

  local exit_code=$?

  # Get registry URL
  local package_name=$(jq -r '.name' package.json)
  registry_url="https://www.npmjs.com/package/${package_name}/v/${version}"

  return $exit_code
}

# Python PyPI publish
publish_python_pypi() {
  local version=$1
  local token=$2
  local dry_run=$3

  # Build distribution
  echo "Building distribution..."
  python -m build

  # Configure twine authentication
  if [ -n "$token" ]; then
    export TWINE_USERNAME="__token__"
    export TWINE_PASSWORD="$token"
  fi

  # Publish with twine
  if [ "$dry_run" = true ]; then
    twine check dist/*
  else
    twine upload dist/*
  fi

  local exit_code=$?

  # Get registry URL
  local package_name=$(grep -E '^name\s*=' pyproject.toml | sed -E 's/name\s*=\s*"(.+)"/\1/')
  registry_url="https://pypi.org/project/${package_name}/${version}/"

  return $exit_code
}

# Rust crates.io publish
publish_rust_crates() {
  local version=$1
  local token=$2
  local dry_run=$3

  # Login to crates.io
  if [ -n "$token" ]; then
    cargo login "$token"
  fi

  # Publish
  if [ "$dry_run" = true ]; then
    cargo publish --dry-run
  else
    cargo publish
  fi

  local exit_code=$?

  # Get registry URL
  local package_name=$(grep -E '^\s*name\s*=' Cargo.toml | head -1 | sed -E 's/.*name\s*=\s*"(.+)".*/\1/')
  registry_url="https://crates.io/crates/${package_name}/${version}"

  return $exit_code
}

# .NET NuGet publish
publish_dotnet_nuget() {
  local version=$1
  local token=$2
  local dry_run=$3

  # Build package
  echo "Building NuGet package..."
  dotnet pack -c Release

  # Find .nupkg file
  local nupkg_file=$(find . -name "*.${version}.nupkg" | head -1)

  if [ -z "$nupkg_file" ]; then
    echo "❌ .nupkg file not found for version ${version}"
    return 1
  fi

  # Publish
  if [ "$dry_run" = true ]; then
    echo "Dry run: Would publish ${nupkg_file}"
    return 0
  else
    dotnet nuget push "$nupkg_file" --api-key "$token" --source https://api.nuget.org/v3/index.json
  fi

  local exit_code=$?

  # Get registry URL (requires package name)
  local package_name=$(basename "$nupkg_file" | sed "s/.${version}.nupkg//")
  registry_url="https://www.nuget.org/packages/${package_name}/${version}"

  return $exit_code
}

# Ruby RubyGems publish
publish_ruby_gems() {
  local version=$1
  local token=$2
  local dry_run=$3

  # Build gem
  echo "Building gem..."
  gem build *.gemspec

  # Find .gem file
  local gem_file=$(find . -name "*.gem" | grep "${version}" | head -1)

  if [ -z "$gem_file" ]; then
    echo "❌ .gem file not found for version ${version}"
    return 1
  fi

  # Configure credentials
  if [ -n "$token" ]; then
    mkdir -p ~/.gem
    echo "---" > ~/.gem/credentials
    echo ":rubygems_api_key: ${token}" >> ~/.gem/credentials
    chmod 0600 ~/.gem/credentials
  fi

  # Publish
  if [ "$dry_run" = true ]; then
    echo "Dry run: Would push ${gem_file}"
    return 0
  else
    gem push "$gem_file"
  fi

  local exit_code=$?

  # Get registry URL
  local gem_name=$(basename "$gem_file" .gem | sed "s/-${version}//")
  registry_url="https://rubygems.org/gems/${gem_name}/versions/${version}"

  return $exit_code
}

# Go pkg (publish via git tag)
publish_go_pkg() {
  local version=$1

  # Go modules are published via git tags
  # The tag should already exist from the release workflow
  # This just verifies the tag is accessible

  echo "Verifying Go module accessibility..."

  # Get module name
  local module_name=$(go list -m 2>/dev/null)

  if [ -z "$module_name" ]; then
    echo "❌ Not a Go module"
    return 1
  fi

  # Verify tag exists
  if ! git tag | grep -q "v${version}"; then
    echo "❌ Tag v${version} not found"
    return 1
  fi

  echo "✅ Go module ${module_name}@v${version} will be available via GOPROXY"

  registry_url="https://pkg.go.dev/${module_name}@v${version}"

  return 0
}

# Java Maven Central publish
publish_java_maven() {
  local version=$1
  local dry_run=$3

  # Maven Central requires GPG signing and OSSRH credentials
  # These should be configured in ~/.m2/settings.xml

  if [ "$dry_run" = true ]; then
    mvn deploy -DskipTests -Dgpg.skip
  else
    mvn deploy -DskipTests
  fi

  local exit_code=$?

  # Get artifact details from pom.xml
  local group_id=$(mvn help:evaluate -Dexpression=project.groupId -q -DforceStdout)
  local artifact_id=$(mvn help:evaluate -Dexpression=project.artifactId -q -DforceStdout)

  registry_url="https://search.maven.org/artifact/${group_id}/${artifact_id}/${version}/jar"

  return $exit_code
}

# PHP Packagist (auto-publish via webhook)
publish_php_packagist() {
  local version=$1

  # Packagist auto-publishes when a new tag is pushed to GitHub
  # This just verifies composer.json exists and is valid

  if [ ! -f "composer.json" ]; then
    echo "❌ composer.json not found"
    return 1
  fi

  # Validate composer.json
  composer validate --no-check-all --strict

  local exit_code=$?

  # Get package name
  local package_name=$(jq -r '.name' composer.json)
  registry_url="https://packagist.org/packages/${package_name}#${version}"

  echo "✅ Package will be auto-published to Packagist when tag is pushed"

  return $exit_code
}

# Usage
publish_to_registry "nodejs_npm" "npm" "1.2.3" "NPM_TOKEN" false "public"
```

---

## Usage Example

```yaml
# From release workflow
<step n="9" goal="Publish to Registry">
  <action>Invoke task: publish-to-registry</action>
    - package_ecosystem: {ecosystem}
    - registry: {registry}
    - version: {version}
    - registry_token_env: "{REGISTRY_TOKEN_ENV}"
    - dry_run: false
    - access: "public"

  <action>Check publish_success output</action>
  <action if="publish_success is true">Display: "✅ Published to {registry}: {registry_url}"</action>
  <action if="publish_success is false">ERROR: "Failed to publish to {registry}"</action>
</step>
```

---

## Dry Run Mode

Use dry run to validate package before publishing:

```bash
publish_to_registry "nodejs_npm" "npm" "1.2.3" "NPM_TOKEN" true "public"
```

This will:
- Validate package structure
- Check authentication
- Simulate publish without actually uploading

---

## Registry Authentication

### Environment Variables

Each registry requires authentication:

| Registry | Environment Variable | Format |
|----------|---------------------|---------|
| npm | `NPM_TOKEN` | Auth token from npmjs.com |
| PyPI | `PYPI_TOKEN` | Token from pypi.org |
| crates.io | `CARGO_REGISTRY_TOKEN` | Token from crates.io |
| NuGet | `NUGET_API_KEY` | API key from nuget.org |
| RubyGems | `RUBYGEMS_API_KEY` | API key from rubygems.org |
| Maven Central | `OSSRH_USERNAME`, `OSSRH_PASSWORD` | OSSRH credentials |

### Secure Token Storage

Tokens should be stored securely:
- GitHub Secrets for CI/CD
- Environment variables for local testing
- `.env` files (gitignored) for development

---

## Error Handling

Common publish errors:

| Error | Cause | Solution |
|-------|-------|----------|
| Authentication failed | Invalid or expired token | Regenerate token |
| Version already exists | Version was already published | Bump version number |
| Package validation failed | Invalid package structure | Fix validation errors |
| Network timeout | Slow/unstable connection | Retry with exponential backoff |
| Rate limit exceeded | Too many publishes | Wait and retry |

---

## Post-Publish Verification

After successful publish, verify:

```bash
# npm
npm view <package-name>@<version>

# PyPI
pip install <package-name>==<version> --dry-run

# crates.io
cargo search <package-name> --limit 1

# NuGet
dotnet add package <package-name> --version <version> --dry-run

# RubyGems
gem list -r <package-name> --version <version>
```
