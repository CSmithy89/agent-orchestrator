# Changelog Generation - Automated Changelog Generation Instructions

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/bmad/bmi/workflows/6-release/changelog-generation/workflow.yaml</critical>
<critical>Communicate all responses in {communication_language} and language MUST be tailored to {user_skill_level}</critical>
<critical>Generate all documents in {document_output_language}</critical>

<critical>CHANGELOG BEST PRACTICES: Changelogs are for humans, not machines. Write clear, concise descriptions that help users understand what changed and why it matters.</critical>

<workflow>

<step n="1" goal="Initialize Changelog Generation Context">
  <action>Greet user: "I'm Rita, your Release Manager. I'll generate a changelog for version {version} from {since_tag}."</action>
  <action>Gather changelog context:</action>
    - Version: {version}
    - Since Tag: {since_tag}
    - Format: {format} (keep-a-changelog/conventional-commits/github-releases/custom)
    - Include PRs: {include_prs}
    - Include Authors: {include_authors}
    - Group By: {group_by} (type/scope/author/date)
  <action>Display changelog configuration</action>
</step>

<step n="2" goal="Verify Git History and Tags">
  <action>Verify since_tag exists:</action>
    - git tag -l "{since_tag}" OR git rev-parse --verify {since_tag}
  <action if="since_tag not found">HALT: "Tag or commit '{since_tag}' not found in git history."</action>

  <action>Get commit range:</action>
    - From: {since_tag}
    - To: HEAD
    - Command: git log {since_tag}..HEAD --oneline --no-merges
  <action>Count commits in range: {commit_count}</action>
  <action if="commit_count is 0">HALT: "No commits found between {since_tag} and HEAD. Nothing to generate."</action>

  <action>Display commit range summary:</action>
  ```
  📊 Changelog Scope:
  - From: {since_tag}
  - To: HEAD
  - Commits: {commit_count}
  - Date Range: {date_from} → {date_to}
  ```
</step>

<step n="3" goal="Collect Commits and Parse Conventional Format">
  <action>Collect all commits with full messages:</action>
    - git log {since_tag}..HEAD --pretty=format:"%H|%s|%b|%an|%ae|%ad" --date=short --no-merges
  <action>Parse each commit for conventional commit format:</action>
  ```
  Format: type(scope): subject

  Examples:
  - feat(api): add user authentication
  - fix(ui): correct button alignment
  - docs: update README with installation steps
  - feat!: breaking API change
  ```
  <action>For each commit, extract:</action>
    - Commit SHA: {sha}
    - Type: {type} (feat, fix, docs, etc.)
    - Scope: {scope} (optional, e.g., api, ui, db)
    - Subject: {subject}
    - Body: {body} (optional, multi-line)
    - Breaking Change: {breaking} (detect from footer or ! in type)
    - Author: {author_name} ({author_email})
    - Date: {commit_date}

  <action>Categorize commits by type:</action>
    - feat → Features
    - fix → Bug Fixes
    - docs → Documentation
    - style → Styles
    - refactor → Code Refactoring
    - perf → Performance Improvements
    - test → Tests
    - build → Builds
    - ci → CI/CD
    - chore → Chores
    - revert → Reverts

  <action if="exclude_types specified">Filter out excluded commit types: {exclude_types}</action>
  <action>Display commit categorization summary</action>
</step>

<step n="4" goal="Fetch Pull Request Information (if enabled)">
  <action if="include_prs is false">Skip PR fetching (not enabled)</action>
  <action if="include_prs is false">Skip to step 5</action>

  <action>Detect git hosting platform:</action>
    - Check remote URL: git remote get-url origin
    - Identify: github.com, gitlab.com, etc.

  <action if="GitHub detected">Fetch PR information using gh CLI:</action>
    - For each commit SHA, find associated PR:
    - gh pr list --search "{sha}" --json number,title,author,labels,mergedAt --state merged
    - Capture PR metadata: {pr_number}, {pr_title}, {pr_author}, {pr_labels}
  </action>

  <action if="GitLab detected">Fetch MR information using glab CLI:</action>
    - glab mr list --merged --source-branch "*" --json iid,title,author,labels,mergedAt
    - Match commits to MRs
  </action>

  <action>Associate PRs with commits:</action>
    - Commit {sha} → PR #{pr_number}: {pr_title}
  <action>Display PR association summary (if available)</action>
</step>

<step n="5" goal="Detect Breaking Changes">
  <action if="breaking_changes_section is false">Skip breaking changes detection</action>
  <action if="breaking_changes_section is false">Skip to step 6</action>

  <action>Scan commit messages and footers for breaking change indicators:</action>
    - Footer keyword: "BREAKING CHANGE:" or "BREAKING-CHANGE:"
    - Exclamation mark in type: "feat!:" or "fix!:"
  <action>For each breaking change, extract:</action>
    - Type: {type}
    - Scope: {scope}
    - Description: {breaking_description}
    - Migration Guide: {migration_notes} (if provided in commit body)

  <action if="breaking changes found">Display breaking changes summary:</action>
  ```
  ⚠️ BREAKING CHANGES DETECTED ({breaking_count}):
  - {breaking_change_1}
  - {breaking_change_2}
  ```
  <action if="no breaking changes">Display: "✅ No breaking changes detected"</action>
</step>

<step n="6" goal="Group and Format Changelog Entries">
  <action>Group commits based on {group_by}:</action>

  <grouping type="by_type">
    ```markdown
    ### Added (feat)
    - Feature 1
    - Feature 2

    ### Fixed (fix)
    - Bug fix 1
    - Bug fix 2

    ### Changed (refactor)
    - Refactor 1
    ```
  </grouping>

  <grouping type="by_scope">
    ```markdown
    ### API
    - feat: add authentication
    - fix: correct validation

    ### UI
    - feat: new dashboard
    - fix: button alignment
    ```
  </grouping>

  <grouping type="by_author">
    ```markdown
    ### @author1
    - feat: feature A
    - fix: bug B

    ### @author2
    - docs: update README
    ```
  </grouping>

  <grouping type="by_date">
    ```markdown
    ### 2025-11-15
    - feat: feature A
    - fix: bug B

    ### 2025-11-14
    - docs: update README
    ```
  </grouping>

  <action>Format each changelog entry based on {format}:</action>

  <format type="keep-a-changelog">
    ```markdown
    ## [{version}] - {date}

    ### Added
    - New feature X (#123)
    - New feature Y (#124)

    ### Fixed
    - Bug fix A (#125)
    - Bug fix B (#126)

    ### Changed
    - Refactor C (#127)

    ### Deprecated
    - Deprecated feature D

    ### Removed
    - Removed feature E

    ### Security
    - Security fix F (#128)
    ```
  </format>

  <format type="conventional-commits">
    ```markdown
    ## {version} ({date})

    ### Features
    - **api**: add user authentication (abc1234)
    - **ui**: new dashboard layout (def5678)

    ### Bug Fixes
    - **api**: correct validation logic (ghi9012)
    - **ui**: fix button alignment (jkl3456)

    ### Documentation
    - update README with installation steps (mno7890)

    ### BREAKING CHANGES
    - **api**: change authentication flow - requires client update
    ```
  </format>

  <format type="github-releases">
    ```markdown
    ## What's Changed

    ### 🚀 New Features
    - Add user authentication by @author1 in #123
    - New dashboard layout by @author2 in #124

    ### 🐛 Bug Fixes
    - Correct validation logic by @author1 in #125
    - Fix button alignment by @author3 in #126

    ### 📝 Documentation
    - Update README by @author2 in #127

    **Full Changelog**: https://github.com/{owner}/{repo}/compare/{since_tag}...{version}
    ```
  </format>

  <action if="include_commit_links is true">Add commit links:</action>
    - GitHub: https://github.com/{owner}/{repo}/commit/{sha}
    - GitLab: https://gitlab.com/{owner}/{repo}/-/commit/{sha}
  <action if="include_authors is true">Add author credits: "by @{author}"</action>
</step>

<step n="7" goal="Generate Changelog Entry">
  <action>Compile final changelog entry for version {version}:</action>
  ```markdown
  ## [{version}] - {date}

  {sections_with_changes}

  {breaking_changes_section (if applicable)}
  ```
  <action>Display changelog preview:</action>
  ```
  📝 Generated Changelog Preview:

  {changelog_entry}
  ```
  <action>Ask for user review: "Review changelog above. Would you like to edit before saving? [y/N]"</action>
  <action if="user wants to edit">Allow manual editing of changelog entry</action>
</step>

<step n="8" goal="Update CHANGELOG.md File">
  <action>Check if CHANGELOG.md exists in repository root</action>
  <action if="CHANGELOG.md not found">Create new CHANGELOG.md with header:</action>
  ```markdown
  # Changelog

  All notable changes to this project will be documented in this file.

  The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
  and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

  {changelog_entry}
  ```

  <action if="CHANGELOG.md exists">Prepend new entry to existing CHANGELOG.md:</action>
    - Read existing CHANGELOG.md
    - Insert new changelog entry after header (before previous entries)
    - Maintain proper formatting and spacing
  <action>Save updated CHANGELOG.md</action>
  <action>Display file update summary:</action>
  ```
  ✅ CHANGELOG.md Updated:
  - New entry for {version} added
  - Total versions in changelog: {total_versions}
  ```
</step>

<step n="9" goal="Generate Commit Summary and Statistics">
  <action>Calculate changelog statistics:</action>
    - Total commits: {commit_count}
    - Features added: {feat_count}
    - Bugs fixed: {fix_count}
    - Breaking changes: {breaking_count}
    - Contributors: {contributor_count}
    - Lines added: {lines_added}
    - Lines removed: {lines_removed}
  <action>Display changelog statistics:</action>
  ```
  📊 Changelog Statistics for {version}:
  - Commits: {commit_count}
  - Features: {feat_count}
  - Bug Fixes: {fix_count}
  - Breaking Changes: {breaking_count}
  - Contributors: {contributor_count}
  - Lines Changed: +{lines_added} -{lines_removed}
  ```
</step>

<step n="10" goal="Complete Changelog Generation">
  <action>Save changelog entry to output file: {output_folder}/changelog-{version}-{date}.md</action>
  <action>Display completion summary:</action>
  ```
  ✅ CHANGELOG GENERATION COMPLETE

  Version: {version}
  Format: {format}
  Commits Included: {commit_count}
  Breaking Changes: {breaking_count}

  Files Updated:
  - CHANGELOG.md (root directory)
  - changelog-{version}-{date}.md (output folder)

  Next Steps:
  - Review CHANGELOG.md
  - Commit changelog update: git add CHANGELOG.md && git commit -m "docs: update changelog for {version}"
  - Continue with release process
  ```
  <action>Workflow complete ✅</action>
</step>

</workflow>
