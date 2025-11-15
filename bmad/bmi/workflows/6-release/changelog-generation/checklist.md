# Changelog Generation Pre-Flight Checklist

**Checklist Status Markers:** `[x]` Completed | `[ ]` Not completed | `[N/A]` Not applicable | `[!]` Requires attention

---

## 1. Changelog Configuration

- [ ] Version specified: {version}
- [ ] Since tag/commit specified: {since_tag}
- [ ] Changelog format selected: {format} (keep-a-changelog/conventional-commits/github-releases/custom)
- [ ] Include PRs flag set: {include_prs}
- [ ] Include authors flag set: {include_authors}
- [ ] Include commit links flag set: {include_commit_links}
- [ ] Group by option selected: {group_by} (type/scope/author/date)
- [ ] Exclude types configured (if applicable): {exclude_types}
- [ ] Breaking changes section enabled: {breaking_changes_section}

---

## 2. Git History Verification

- [ ] Since tag exists in git history: {since_tag}
- [ ] git tag -l "{since_tag}" returns result
- [ ] Commit range calculated: {since_tag}..HEAD
- [ ] Commits found in range: {commit_count}
- [ ] Commit count > 0 (has changes to document)
- [ ] Date range identified: {date_from} → {date_to}

---

## 3. Commit Collection and Parsing

- [ ] All commits collected: {commit_count} commits
- [ ] git log command executed successfully
- [ ] Each commit parsed for conventional format
- [ ] Commit components extracted:
  - [ ] SHA
  - [ ] Type (feat, fix, docs, etc.)
  - [ ] Scope (optional)
  - [ ] Subject
  - [ ] Body (optional)
  - [ ] Author
  - [ ] Date
- [ ] Non-conventional commits handled gracefully
- [ ] Merge commits excluded (--no-merges)

---

## 4. Conventional Commit Categorization

- [ ] Commits categorized by type:
  - [ ] feat → Features: {feat_count}
  - [ ] fix → Bug Fixes: {fix_count}
  - [ ] docs → Documentation: {docs_count}
  - [ ] style → Styles: {style_count}
  - [ ] refactor → Code Refactoring: {refactor_count}
  - [ ] perf → Performance Improvements: {perf_count}
  - [ ] test → Tests: {test_count}
  - [ ] build → Builds: {build_count}
  - [ ] ci → CI/CD: {ci_count}
  - [ ] chore → Chores: {chore_count}
  - [ ] revert → Reverts: {revert_count}
- [ ] Excluded types filtered out (if exclude_types set)
- [ ] Uncategorized commits handled

---

## 5. Pull Request Integration (if enabled)

- [ ] Include PRs enabled: {include_prs}
- [ ] Git hosting platform detected: {platform}
- [ ] GitHub CLI (gh) available (if GitHub)
- [ ] GitLab CLI (glab) available (if GitLab)
- [ ] PRs fetched successfully
- [ ] PRs associated with commits
- [ ] PR metadata extracted:
  - [ ] PR number
  - [ ] PR title
  - [ ] PR author
  - [ ] PR labels
  - [ ] Merged date
- [ ] PR links generated

---

## 6. Breaking Changes Detection

- [ ] Breaking changes section enabled: {breaking_changes_section}
- [ ] Commit footers scanned for "BREAKING CHANGE:"
- [ ] Commit types scanned for exclamation mark (feat!, fix!)
- [ ] Breaking changes identified: {breaking_count}
- [ ] For each breaking change:
  - [ ] Type extracted
  - [ ] Scope extracted
  - [ ] Description extracted
  - [ ] Migration notes extracted (if provided)
- [ ] Breaking changes severity assessed

---

## 7. Grouping and Formatting

- [ ] Grouping strategy applied: {group_by}
- [ ] Commits grouped correctly
- [ ] Changelog format applied: {format}
- [ ] Section headers created
- [ ] Entries formatted consistently
- [ ] Bullet points formatted: {bullet_style}
- [ ] Commit links added (if include_commit_links=true)
- [ ] PR links added (if PRs available)
- [ ] Author credits added (if include_authors=true)
- [ ] Emoji support applied (if enabled)

---

## 8. Changelog Entry Generation

- [ ] Changelog entry compiled for version {version}
- [ ] Entry includes:
  - [ ] Version number: {version}
  - [ ] Release date: {date}
  - [ ] Sections with changes
  - [ ] Breaking changes section (if applicable)
  - [ ] Full changelog link (if GitHub Releases format)
- [ ] Changelog preview displayed
- [ ] User review completed
- [ ] Manual edits applied (if requested)

---

## 9. CHANGELOG.md File Update

- [ ] CHANGELOG.md file exists in repository root
- [ ] If not exists, create new CHANGELOG.md with header
- [ ] New entry prepended to CHANGELOG.md (after header)
- [ ] Proper formatting maintained
- [ ] Spacing and line breaks correct
- [ ] Previous entries preserved
- [ ] CHANGELOG.md saved successfully
- [ ] File update verified

---

## 10. Changelog Statistics

- [ ] Statistics calculated:
  - [ ] Total commits: {commit_count}
  - [ ] Features added: {feat_count}
  - [ ] Bugs fixed: {fix_count}
  - [ ] Breaking changes: {breaking_count}
  - [ ] Contributors: {contributor_count}
  - [ ] Lines added: {lines_added}
  - [ ] Lines removed: {lines_removed}
- [ ] Statistics displayed to user

---

## 11. Output Artifacts

- [ ] Changelog entry saved to output folder: {output_folder}/changelog-{version}-{date}.md
- [ ] CHANGELOG.md updated in repository root
- [ ] Commit summary generated
- [ ] Breaking changes list generated (if applicable)

---

## 12. Quality Checks

- [ ] All commit types handled
- [ ] No duplicate entries
- [ ] Consistent formatting throughout
- [ ] Links tested and working (spot check)
- [ ] Breaking changes clearly highlighted
- [ ] Readable and user-friendly

---

## 13. Next Steps

- [ ] CHANGELOG.md reviewed for accuracy
- [ ] Ready to commit changelog update
- [ ] Changelog integrated with release workflow (if applicable)

---

**Checklist Summary:**
- Total Items: ~70
- Completed: ___ / ___
- Changelog Status: [ ] ✅ Ready | [ ] ⚠️ Review | [ ] ❌ Blocked
