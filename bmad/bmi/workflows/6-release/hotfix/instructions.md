# Hotfix - Emergency Hotfix Release Instructions

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/bmad/bmi/workflows/6-release/hotfix/workflow.yaml</critical>
<critical>Communicate all responses in {communication_language} and language MUST be tailored to {user_skill_level}</critical>
<critical>Generate all documents in {document_output_language}</critical>

<critical>HOTFIX SAFETY: Hotfixes go directly to production. ALWAYS run tests. NEVER skip quality checks for speed. A bad hotfix can make things worse.</critical>

<workflow>

<step n="1" goal="Initialize Hotfix Context">
  <action>Greet user: "I'm Rita, your Release Manager. I'll guide you through creating an emergency hotfix for: {hotfix_description}"</action>
  <action if="incident_id provided">Link to incident: "Related to incident {incident_id}"</action>
  <action>Gather hotfix context:</action>
    - Hotfix Description: {hotfix_description}
    - Base Version: {base_version} (current production version)
    - Fast Track: {fast_track}
    - Auto Deploy: {auto_deploy}
    - Incident ID: {incident_id} (if applicable)
  <action>Calculate hotfix version: {base_version} → {hotfix_version} (increment patch)</action>
  <action>Display hotfix summary with URGENT banner</action>
</step>

<step n="2" goal="Create Hotfix Branch">
  <action>Verify base version tag exists: git tag -l "v{base_version}"</action>
  <action if="base version not found">HALT: "Base version v{base_version} not found. Cannot create hotfix."</action>
  <action>Generate hotfix branch name: hotfix/{hotfix_version} OR {hotfix_branch}</action>
  <action>Create hotfix branch from production tag:</action>
    - git checkout -b {hotfix_branch} v{base_version}
  <action>Verify branch created and checked out</action>
</step>

<step n="3" goal="Apply Emergency Fix">
  <action>Guide user to apply fix:</action>
    - "Make the necessary code changes to fix: {hotfix_description}"
    - "Keep changes minimal and focused on the critical issue only"
    - "Avoid scope creep - this is an emergency fix, not a feature release"
  <action>Wait for user to complete changes</action>
  <action>Verify changes made: git status (should show modified files)</action>
  <action if="no changes">HALT: "No changes detected. Apply fix before continuing."</action>
</step>

<step n="4" goal="Run Test Suite">
  <action if="skip_tests is true AND fast_track is true">OVERRIDE: "Fast-track mode REQUIRES tests. Running tests despite skip_tests=true."</action>
  <action if="skip_tests is true AND fast_track is false">WARN: "Skipping tests is HIGHLY NOT RECOMMENDED for production hotfixes. Proceeding at your own risk."</action>
  <action>Run full test suite</action>
  <action if="tests fail">HALT: "Tests failing. Fix test failures before proceeding with hotfix."</action>
  <action if="tests pass">Display: "✅ All tests passing - hotfix safe to proceed"</action>
</step>

<step n="5" goal="Commit Hotfix Changes">
  <action>Stage all changes: git add .</action>
  <action>Create hotfix commit:</action>
  ```bash
  git commit -m "fix(hotfix): {hotfix_description}

  Emergency hotfix for production issue.
  Base version: {base_version}
  Hotfix version: {hotfix_version}
  Incident ID: {incident_id}
  "
  ```
  <action>Display commit summary</action>
</step>

<step n="6" goal="Generate Hotfix Changelog">
  <action>Invoke changelog-generation workflow with hotfix-specific format:</action>
    - version: {hotfix_version}
    - since_tag: v{base_version}
    - format: keep-a-changelog
  <action>Update CHANGELOG.md with hotfix entry:</action>
  ```markdown
  ## [{hotfix_version}] - {date} [HOTFIX]

  ### Fixed
  - {hotfix_description} (Emergency fix for production issue #{incident_id})
  ```
  <action>Commit changelog: git add CHANGELOG.md && git commit -m "docs: hotfix changelog for {hotfix_version}"</action>
</step>

<step n="7" goal="Create Hotfix Release">
  <action>Invoke release workflow with hotfix parameters:</action>
    - version_bump: explicit (use {hotfix_version})
    - release_branch: {hotfix_branch}
    - release_type: hotfix
    - pre_release: false
    - skip_tests: false (ALWAYS run tests for hotfixes)
    - skip_build: false
  <action>Wait for release workflow to complete</action>
  <action>Capture hotfix release tag: v{hotfix_version}</action>
</step>

<step n="8" goal="Deploy Hotfix to Production">
  <action if="auto_deploy is false">Skip deployment (manual deployment required)</action>
  <action if="auto_deploy is false">Skip to step 9</action>
  <action if="auto_deploy is true">Invoke deployment workflow with emergency mode:</action>
    - version: {hotfix_version}
    - environment: production
    - deployment_strategy: rolling (or canary for safer rollout)
    - skip_smoke_tests: false (ALWAYS run smoke tests)
    - rollback_on_failure: true (auto-rollback if deployment fails)
  <action>Monitor deployment with enhanced alerts</action>
  <action if="deployment fails">Invoke rollback workflow immediately</action>
  <action if="deployment succeeds">Display: "✅ Hotfix {hotfix_version} deployed to production"</action>
</step>

<step n="9" goal="Notify Stakeholders">
  <action>Send hotfix notification to all channels:</action>
  ```
  🚨 HOTFIX DEPLOYED: {hotfix_version}

  Issue: {hotfix_description}
  Base Version: {base_version}
  Hotfix Version: {hotfix_version}
  Incident ID: {incident_id}
  Deployment Status: {deployment_status}

  The critical production issue has been resolved.
  Monitor dashboards for any anomalies.
  ```
  <action>Update status page (if public-facing issue)</action>
  <action if="incident_id provided">Update incident with resolution: "Resolved via hotfix {hotfix_version}"</action>
</step>

<step n="10" goal="Merge Hotfix to Main Branch">
  <action>Merge hotfix branch back to main/master:</action>
    - git checkout main
    - git merge {hotfix_branch} --no-ff -m "Merge hotfix {hotfix_version} into main"
  <action>Push to remote: git push origin main</action>
  <action>Delete hotfix branch (optional): git branch -d {hotfix_branch}</action>
  <action>Display merge summary</action>
</step>

<step n="11" goal="Complete Hotfix and Monitor">
  <action>Display hotfix completion summary:</action>
  ```
  ✅ HOTFIX COMPLETE: {hotfix_version}

  Issue Fixed: {hotfix_description}
  Hotfix Version: {hotfix_version}
  Deployment: {deployment_status}
  Incident: {incident_id} (Resolved)

  Next Steps:
  - Monitor production for 1 hour
  - Check error rates and metrics
  - Verify issue is fully resolved
  - Update team on resolution
  ```
  <action>Set monitoring alert for next 1 hour (enhanced monitoring)</action>
  <action>Workflow complete ✅</action>
</step>

</workflow>
