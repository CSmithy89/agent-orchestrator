# Release Pre-Flight and Post-Release Checklist

**Checklist Status Markers:** `[x]` Completed | `[ ]` Not completed | `[N/A]` Not applicable | `[!]` Requires attention

---

## 1. Release Configuration

- [ ] Version bump type selected: {version_bump} (major/minor/patch/explicit)
- [ ] Release branch identified: {release_branch}
- [ ] Release type selected: {release_type} (stable/beta/alpha/rc)
- [ ] Pre-release flag set: {pre_release} (true/false)
- [ ] Draft release flag set: {draft_release} (true/false)
- [ ] Target registries identified: {publish_registries}
- [ ] Release assets prepared (if applicable): {release_assets}

---

## 2. Pre-Release Checks

### Working Directory
- [ ] Working directory is clean (no uncommitted changes)
- [ ] git status shows "nothing to commit, working tree clean"
- [ ] No untracked files that should be committed

### Branch Verification
- [ ] Currently on release branch: {release_branch}
- [ ] Release branch is up to date with remote
- [ ] No divergence between local and remote branches
- [ ] All feature branches merged into release branch

### Remote Sync
- [ ] Latest changes fetched from remote: git fetch origin
- [ ] Local branch not behind remote
- [ ] Local branch not ahead of remote (all changes pushed)

---

## 3. Package Ecosystem Detection

- [ ] Package ecosystem detected: {detected_ecosystem}
- [ ] Version file identified: {version_file}
- [ ] Current version read successfully: {current_version}
- [ ] Versioning tool available (npm, poetry, cargo, etc.)

---

## 4. Version Calculation

- [ ] New version calculated: {new_version}
- [ ] Version follows semantic versioning (MAJOR.MINOR.PATCH)
- [ ] Version bump type correct (major/minor/patch)
- [ ] Pre-release suffix correct (if pre-release): {pre_release_suffix}
- [ ] Version tag does not already exist: {tag_prefix}{new_version}
- [ ] Version is greater than current version

---

## 5. Test Suite Execution

- [ ] Test command detected: {test_command}
- [ ] Test suite run: {skip_tests ? "SKIPPED (NOT RECOMMENDED)" : "Executed"}
- [ ] All tests passing (0 failures)
- [ ] Test coverage acceptable (if coverage tracking enabled)
- [ ] Integration tests passing
- [ ] End-to-end tests passing (if applicable)

---

## 6. Build Verification

- [ ] Build command detected: {build_command}
- [ ] Build run: {skip_build ? "SKIPPED (NOT RECOMMENDED)" : "Executed"}
- [ ] Build successful (exit code 0)
- [ ] Build artifacts generated: {artifact_list}
- [ ] Build artifacts size reasonable (no bloat)
- [ ] No build warnings (or warnings acknowledged)

---

## 7. Changelog Generation

- [ ] Changelog format selected: {changelog_format}
- [ ] Commits since last release collected
- [ ] Conventional commits parsed (feat:, fix:, docs:, etc.)
- [ ] Changelog entry generated for {new_version}
- [ ] CHANGELOG.md updated with new entry
- [ ] Changelog includes:
  - [ ] Added features
  - [ ] Fixed bugs
  - [ ] Changed functionality
  - [ ] Deprecated features (if any)
  - [ ] Removed features (if any)
  - [ ] Security fixes (if any)
- [ ] Changelog reviewed for accuracy
- [ ] Changelog formatted correctly

---

## 8. Version File Updates

- [ ] Version updated in primary version file: {version_file}
- [ ] Version verified after update (re-read from file)
- [ ] Lock files updated (package-lock.json, poetry.lock, Cargo.lock, etc.)
- [ ] All version references updated across project
- [ ] Documentation version references updated (if applicable)

---

## 9. Release Commit

- [ ] Version files staged: git add {version_files}
- [ ] CHANGELOG.md staged: git add CHANGELOG.md
- [ ] Release commit created with conventional commit format
- [ ] Commit message includes version and release notes
- [ ] Release commit SHA captured: {release_commit_sha}
- [ ] Commit verified: git log --oneline -1

---

## 10. Git Tag Creation

- [ ] Annotated git tag created: {tag_prefix}{new_version}
- [ ] Tag message includes release notes
- [ ] Tag verified: git tag -l "{tag_prefix}{new_version}"
- [ ] Tag shows in git log: git log --oneline --decorate

---

## 11. Registry Publishing

### npm (if applicable)
- [ ] npm credentials verified: npm whoami
- [ ] npm publish command executed
- [ ] Package published to npm registry
- [ ] Registry URL captured: https://www.npmjs.com/package/{package_name}/v/{new_version}
- [ ] Package accessible on npm registry (verified via browser)

### PyPI (if applicable)
- [ ] PyPI credentials configured (~/.pypirc or token)
- [ ] Package built: dist/*.whl and dist/*.tar.gz
- [ ] twine upload or poetry publish executed
- [ ] Package published to PyPI
- [ ] Registry URL captured: https://pypi.org/project/{package_name}/{new_version}/
- [ ] Package installable via pip

### crates.io (if applicable)
- [ ] Cargo credentials verified (~/.cargo/credentials)
- [ ] cargo publish executed
- [ ] Crate published to crates.io
- [ ] Registry URL captured: https://crates.io/crates/{package_name}/{new_version}
- [ ] Crate accessible via cargo search

### NuGet (if applicable)
- [ ] NuGet credentials configured
- [ ] Package built: *.nupkg
- [ ] dotnet nuget push executed
- [ ] Package published to NuGet
- [ ] Registry URL captured: https://www.nuget.org/packages/{package_name}/{new_version}

### RubyGems (if applicable)
- [ ] RubyGems credentials verified: gem signin
- [ ] Gem built: gem build *.gemspec
- [ ] gem push executed
- [ ] Gem published to RubyGems
- [ ] Registry URL captured: https://rubygems.org/gems/{package_name}/versions/{new_version}

### Maven Central (if applicable)
- [ ] Maven credentials configured (~/.m2/settings.xml)
- [ ] mvn deploy executed
- [ ] Artifact published to Maven Central
- [ ] Registry URL captured

### Docker Hub (if applicable)
- [ ] Docker credentials verified: docker login
- [ ] Container image built: docker build -t {image_name}:{new_version}
- [ ] Image tagged as latest (if stable release)
- [ ] docker push {image_name}:{new_version} executed
- [ ] docker push {image_name}:latest executed (if stable)
- [ ] Registry URL captured: https://hub.docker.com/r/{image_name}/tags

---

## 12. GitHub/GitLab Release Creation

### GitHub Release (if applicable)
- [ ] GitHub CLI (gh) installed and authenticated
- [ ] gh release create executed
- [ ] Release created on GitHub
- [ ] Release URL captured: {github_release_url}
- [ ] Release notes populated
- [ ] Pre-release flag set correctly (if pre-release)
- [ ] Draft flag set correctly (if draft)
- [ ] Release assets attached (if applicable)

### GitLab Release (if applicable)
- [ ] GitLab CLI (glab) installed and authenticated
- [ ] glab release create executed
- [ ] Release created on GitLab
- [ ] Release URL captured: {gitlab_release_url}
- [ ] Release notes populated

---

## 13. Remote Push

- [ ] Release commit pushed to remote: git push origin {release_branch}
- [ ] Push successful (exit code 0)
- [ ] Git tag pushed to remote: git push origin {tag_prefix}{new_version}
- [ ] Tag push successful
- [ ] Remote tag verified: git ls-remote --tags origin | grep {new_version}

---

## 14. Post-Release Verification

- [ ] Package installable from registry
  - [ ] npm install {package_name}@{new_version} (if npm)
  - [ ] pip install {package_name}=={new_version} (if PyPI)
  - [ ] cargo add {package_name}@{new_version} (if crates.io)
  - [ ] dotnet add package {package_name} --version {new_version} (if NuGet)
- [ ] GitHub/GitLab release visible on release page
- [ ] Release notes display correctly
- [ ] Release assets downloadable (if applicable)
- [ ] Tag visible in git hosting platform UI
- [ ] CHANGELOG.md updated in repository

---

## 15. Communication and Documentation

- [ ] Release announced to team (Slack, email, etc.)
- [ ] Release notes shared with stakeholders
- [ ] Documentation updated to reflect new version
- [ ] Migration guide provided (if breaking changes)
- [ ] Blog post/announcement drafted (if major release)
- [ ] Social media announcement (if applicable)

---

## 16. Post-Release Monitoring

- [ ] Monitor error rates in production (first 24 hours)
- [ ] Monitor package download metrics
- [ ] Check for user-reported issues
- [ ] Review automated alerts for anomalies
- [ ] Prepare hotfix process if critical issues detected

---

**Checklist Summary:**
- Total Items: ~95
- Completed: ___ / ___
- Release Status: [ ] ✅ Complete | [ ] ⚠️ Review | [ ] ❌ Blocked
