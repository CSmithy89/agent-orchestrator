# Release - Create and Publish Software Release Instructions

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/bmad/bmi/workflows/6-release/release/workflow.yaml</critical>
<critical>Communicate all responses in {communication_language} and language MUST be tailored to {user_skill_level}</critical>
<critical>Generate all documents in {document_output_language}</critical>

<critical>RELEASE MANAGEMENT: A release is a permanent, public artifact. Always run tests and builds before releasing. Never skip quality checks for production releases.</critical>

<workflow>

<step n="1" goal="Initialize Release Context">
  <action>Greet user: "I'm Rita, your Release Manager. I'll help you create and publish release {version_bump} from {release_branch}."</action>
  <action>Gather release context:</action>
    - Version Bump: {version_bump} (major/minor/patch or explicit version)
    - Release Branch: {release_branch}
    - Release Type: {release_type} (stable/beta/alpha/rc)
    - Pre-release: {pre_release} (true/false)
    - Draft Release: {draft_release} (true/false)
  <action>Display release summary:</action>
  ```
  📦 Release Configuration:
  - Version Bump: {version_bump}
  - Release Branch: {release_branch}
  - Release Type: {release_type}
  - Pre-release: {pre_release}
  - Registries: {publish_registries}
  ```
</step>

<step n="2" goal="Run Pre-Release Checks">
  <action>Verify working directory is clean:</action>
    - Run: git status
    - Check for uncommitted changes
  <action if="uncommitted changes exist">HALT: "Working directory has uncommitted changes. Commit or stash changes before releasing."</action>

  <action>Verify on correct release branch:</action>
    - Current branch: git branch --show-current
    - Expected: {release_branch}
  <action if="not on release_branch">HALT: "Not on release branch '{release_branch}'. Switch to correct branch before releasing."</action>

  <action>Fetch latest from remote:</action>
    - git fetch origin {release_branch}
  <action>Check if local branch is behind remote:</action>
    - Compare: git rev-list HEAD..origin/{release_branch} --count
  <action if="local behind remote">HALT: "Local branch is behind remote. Pull latest changes: git pull origin {release_branch}"</action>

  <action>Display pre-release checks summary:</action>
  ```
  ✅ Pre-Release Checks:
  - Working directory clean
  - On correct branch: {release_branch}
  - Up to date with remote
  ```
</step>

<step n="3" goal="Detect Package Ecosystem and Calculate Version">
  <action>Auto-detect package ecosystem:</action>
    - Check for package.json (Node.js/npm)
    - Check for pyproject.toml or setup.py (Python/PyPI)
    - Check for Cargo.toml (Rust/crates.io)
    - Check for *.csproj (C#/.NET/NuGet)
    - Check for *.gemspec (Ruby/RubyGems)
    - Check for go.mod (Go modules)
    - Check for pom.xml (Java/Maven)
    - Check for composer.json (PHP/Packagist)
  <action>Display detected ecosystem: {detected_ecosystem}</action>

  <action>Read current version from version file:</action>
    - Node.js: jq -r .version package.json
    - Python: poetry version -s OR grep version pyproject.toml
    - Rust: grep version Cargo.toml
    - .NET: grep Version *.csproj
    - Ruby: grep VERSION *.gemspec
    - Go: git describe --tags --abbrev=0
    - Java: mvn help:evaluate -Dexpression=project.version -q -DforceStdout
    - PHP: jq -r .version composer.json
  <action>Display current version: {current_version}</action>

  <action>Calculate new version based on {version_bump}:</action>
  ```
  major:     1.2.3 → 2.0.0
  minor:     1.2.3 → 1.3.0
  patch:     1.2.3 → 1.2.4
  premajor:  1.2.3 → 2.0.0-beta.0
  preminor:  1.2.3 → 1.3.0-beta.0
  prepatch:  1.2.3 → 1.2.4-beta.0
  prerelease: 1.2.3-beta.0 → 1.2.3-beta.1
  explicit:  Use provided version
  ```
  <action>Display new version: {new_version}</action>
  <action>Check if version tag already exists:</action>
    - git tag -l "{tag_prefix}{new_version}"
  <action if="tag exists">HALT: "Version tag {tag_prefix}{new_version} already exists. Choose a different version."</action>
</step>

<step n="4" goal="Run Test Suite">
  <action if="skip_tests is true">WARN: "Skipping tests (NOT RECOMMENDED for production releases)"</action>
  <action if="skip_tests is true">Skip to step 5</action>

  <action>Detect test command:</action>
    - Node.js: npm test
    - Python: poetry run pytest OR python -m pytest
    - Rust: cargo test
    - .NET: dotnet test
    - Ruby: bundle exec rspec OR rake test
    - Go: go test ./...
    - Java: mvn test
    - PHP: composer test OR phpunit
  <action>Run test suite with output streaming</action>
  <action if="tests fail">HALT: "Tests failing. Fix failing tests before releasing."</action>
  <action if="tests pass">Display: "✅ All tests passing ({test_count} tests)"</action>
</step>

<step n="5" goal="Build Release Artifacts">
  <action if="skip_build is true">WARN: "Skipping build (NOT RECOMMENDED for production releases)"</action>
  <action if="skip_build is true">Skip to step 6</action>

  <action>Detect build command:</action>
    - Node.js: npm run build OR tsc (if TypeScript)
    - Python: poetry build (creates wheel + sdist)
    - Rust: cargo build --release
    - .NET: dotnet build --configuration Release
    - Ruby: gem build *.gemspec
    - Go: go build -o bin/
    - Java: mvn package
    - PHP: composer install --no-dev --optimize-autoloader
  <action>Run build with output streaming</action>
  <action if="build fails">HALT: "Build failed. Fix build errors before releasing."</action>
  <action if="build succeeds">Capture build artifacts and display summary</action>
  ```
  ✅ Build Successful:
  - Artifacts: {artifact_list}
  - Build time: {build_duration}
  ```
</step>

<step n="6" goal="Generate Changelog">
  <action>Check if changelog_generation workflow is available</action>
  <action if="changelog workflow available">Invoke changelog-generation workflow:</action>
    - Input: version = {new_version}
    - Input: format = {changelog_format}
    - Input: since_tag = {current_version}
  <action if="changelog workflow not available">Generate changelog manually:</action>
    - Collect commits since last tag: git log {current_version}..HEAD --oneline
    - Parse conventional commits (feat:, fix:, docs:, etc.)
    - Group by type: Features, Bug Fixes, Documentation, etc.
  <action>Update CHANGELOG.md with new version entry:</action>
  ```markdown
  ## [{new_version}] - {date}

  ### Added
  - {feature_1}
  - {feature_2}

  ### Fixed
  - {bugfix_1}
  - {bugfix_2}

  ### Changed
  - {change_1}

  ### Deprecated
  - {deprecated_1}

  ### Removed
  - {removed_1}

  ### Security
  - {security_1}
  ```
  <action>Display changelog preview</action>
  <action>Save CHANGELOG.md</action>
</step>

<step n="7" goal="Update Version Files">
  <action>Update version in version file(s):</action>

  <ecosystem type="nodejs">
    - npm version {new_version} --no-git-tag-version
    - Updates package.json and package-lock.json
  </ecosystem>

  <ecosystem type="python">
    - poetry version {new_version} (updates pyproject.toml)
    - OR sed -i "s/version = .*/version = \"{new_version}\"/" pyproject.toml
  </ecosystem>

  <ecosystem type="rust">
    - cargo set-version {new_version} (via cargo-edit)
    - OR sed -i "s/^version = .*/version = \"{new_version}\"/" Cargo.toml
  </ecosystem>

  <ecosystem type="dotnet">
    - sed -i "s/<Version>.*<\/Version>/<Version>{new_version}<\/Version>/" *.csproj
  </ecosystem>

  <ecosystem type="ruby">
    - sed -i "s/VERSION = .*/VERSION = \"{new_version}\"/" lib/*/version.rb
  </ecosystem>

  <ecosystem type="go">
    - Update version.go (if exists)
    - OR rely on git tags only
  </ecosystem>

  <ecosystem type="java">
    - mvn versions:set -DnewVersion={new_version}
  </ecosystem>

  <ecosystem type="php">
    - composer config version {new_version}
  </ecosystem>

  <action>Verify version update:</action>
    - Re-read version from file
    - Confirm matches {new_version}
  <action>Display updated files</action>
</step>

<step n="8" goal="Commit Version Bump and Changelog">
  <action>Stage version files and CHANGELOG.md:</action>
    - git add {version_files} CHANGELOG.md
  <action>Create release commit with conventional commit format:</action>
  ```bash
  git commit -m "chore(release): bump version to {new_version}

  - Update version to {new_version}
  - Update CHANGELOG.md with release notes
  - Release type: {release_type}
  "
  ```
  <action>Capture release commit SHA: {release_commit_sha}</action>
  <action>Display commit summary</action>
</step>

<step n="9" goal="Create Git Tag">
  <action>Create annotated git tag with release notes:</action>
  ```bash
  git tag -a {tag_prefix}{new_version} -m "Release {new_version}

  {changelog_entry}
  "
  ```
  <action>Verify tag created: git tag -l "{tag_prefix}{new_version}"</action>
  <action>Display tag info: git show {tag_prefix}{new_version}</action>
</step>

<step n="10" goal="Publish to Package Registries">
  <action if="publish_registries is empty">Skip registry publishing (no registries specified)</action>
  <action if="publish_registries is empty">Skip to step 11</action>

  <action>For each registry in {publish_registries}, publish package:</action>

  <registry name="npm">
    - Verify npm credentials: npm whoami
    - Publish: npm publish {pre_release ? "--tag beta" : ""}
    - Capture registry URL: https://www.npmjs.com/package/{package_name}/v/{new_version}
  </registry>

  <registry name="pypi">
    - Verify credentials: poetry config pypi-token.pypi OR ~/.pypirc
    - Publish: poetry publish OR twine upload dist/*
    - Capture registry URL: https://pypi.org/project/{package_name}/{new_version}/
  </registry>

  <registry name="crates">
    - Verify credentials: cargo login (token in ~/.cargo/credentials)
    - Publish: cargo publish
    - Capture registry URL: https://crates.io/crates/{package_name}/{new_version}
  </registry>

  <registry name="nuget">
    - Verify credentials: dotnet nuget list source
    - Publish: dotnet nuget push *.nupkg --source https://api.nuget.org/v3/index.json
    - Capture registry URL: https://www.nuget.org/packages/{package_name}/{new_version}
  </registry>

  <registry name="rubygems">
    - Verify credentials: gem signin
    - Build: gem build *.gemspec
    - Publish: gem push {package_name}-{new_version}.gem
    - Capture registry URL: https://rubygems.org/gems/{package_name}/versions/{new_version}
  </registry>

  <registry name="maven">
    - Verify credentials: ~/.m2/settings.xml
    - Publish: mvn deploy
    - Capture registry URL: https://search.maven.org/artifact/{group_id}/{artifact_id}/{new_version}/jar
  </registry>

  <registry name="docker">
    - Build container: docker build -t {image_name}:{new_version} .
    - Tag as latest (if stable): docker tag {image_name}:{new_version} {image_name}:latest
    - Push: docker push {image_name}:{new_version}
    - Push latest: docker push {image_name}:latest (if stable)
    - Capture registry URL: https://hub.docker.com/r/{image_name}/tags
  </registry>

  <action>Display published registry URLs</action>
</step>

<step n="11" goal="Create GitHub/GitLab Release">
  <action>Detect git hosting platform:</action>
    - Check remote URL: git remote get-url origin
    - Identify: github.com, gitlab.com, bitbucket.org, etc.

  <action if="GitHub detected">Create GitHub release:</action>
    - gh release create {tag_prefix}{new_version} \
        --title "Release {new_version}" \
        --notes "{changelog_entry}" \
        {pre_release ? "--prerelease" : ""} \
        {draft_release ? "--draft" : ""} \
        {release_assets}
    - Capture release URL: https://github.com/{owner}/{repo}/releases/tag/{tag_prefix}{new_version}
  </action>

  <action if="GitLab detected">Create GitLab release:</action>
    - Use GitLab API or glab CLI
    - glab release create {tag_prefix}{new_version} --notes "{changelog_entry}"
    - Capture release URL: https://gitlab.com/{owner}/{repo}/-/releases/{tag_prefix}{new_version}
  </action>

  <action if="platform not detected">Create lightweight release (git tag only)</action>
  <action>Display release URL</action>
</step>

<step n="12" goal="Push Commits and Tags to Remote">
  <action>Push release commit to remote:</action>
    - git push origin {release_branch}
  <action>Push tag to remote:</action>
    - git push origin {tag_prefix}{new_version}
  <action>Verify remote tag exists:</action>
    - git ls-remote --tags origin | grep {new_version}
  <action>Display push summary:</action>
  ```
  ✅ RELEASE COMPLETE: {new_version}

  📦 Package: {package_name} v{new_version}
  🏷️  Tag: {tag_prefix}{new_version}
  📝 Changelog: Updated CHANGELOG.md
  🌐 Release URL: {release_url}

  Published to:
  {registry_urls_list}

  🎉 Release {new_version} is now live!
  ```
  <action>Generate release report and save to {output_folder}/release-{new_version}-{date}.md</action>
  <action>Workflow complete ✅</action>
</step>

</workflow>
