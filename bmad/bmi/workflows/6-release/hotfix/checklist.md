# Hotfix Pre-Flight and Post-Deployment Checklist

**Checklist Status Markers:** `[x]` Completed | `[ ]` Not completed | `[N/A]` Not applicable | `[!]` Requires attention

---

## 1. Hotfix Context
- [ ] Hotfix description clear: {hotfix_description}
- [ ] Base production version identified: {base_version}
- [ ] Hotfix version calculated: {hotfix_version}
- [ ] Incident ID linked (if applicable): {incident_id}
- [ ] Fast-track mode enabled: {fast_track}
- [ ] Auto-deploy enabled: {auto_deploy}

---

## 2. Hotfix Branch
- [ ] Base version tag exists: v{base_version}
- [ ] Hotfix branch created: {hotfix_branch}
- [ ] Branch created from production tag
- [ ] Checked out to hotfix branch

---

## 3. Emergency Fix Applied
- [ ] Code changes made to fix issue
- [ ] Changes are minimal and focused
- [ ] No scope creep (only critical fix)
- [ ] git status shows modified files

---

## 4. Tests
- [ ] Test suite run: {skip_tests ? "⚠️ SKIPPED" : "✅ Executed"}
- [ ] All tests passing (0 failures)
- [ ] Hotfix-specific tests added (if needed)
- [ ] Tests NEVER skipped in fast-track mode

---

## 5. Hotfix Commit
- [ ] All changes staged
- [ ] Hotfix commit created with description
- [ ] Commit message includes incident ID

---

## 6. Changelog
- [ ] Changelog generated for hotfix
- [ ] CHANGELOG.md updated with [HOTFIX] marker
- [ ] Changelog committed

---

## 7. Release
- [ ] Release workflow invoked
- [ ] Hotfix release created: v{hotfix_version}
- [ ] Git tag created and pushed
- [ ] Package published to registries (if applicable)

---

## 8. Deployment
- [ ] Deployment initiated: {auto_deploy ? "Auto" : "Manual"}
- [ ] Deployment strategy selected
- [ ] Smoke tests run post-deployment
- [ ] Rollback ready if deployment fails
- [ ] Deployment successful

---

## 9. Stakeholder Notification
- [ ] Team notified via Slack/email
- [ ] Status page updated (if public issue)
- [ ] Incident updated with resolution
- [ ] Customers notified (if customer-facing)

---

## 10. Merge to Main
- [ ] Hotfix merged to main/master
- [ ] Merge pushed to remote
- [ ] Hotfix branch deleted (optional)

---

## 11. Post-Hotfix Monitoring
- [ ] Enhanced monitoring enabled (1 hour)
- [ ] Error rates monitored
- [ ] Metrics dashboard checked
- [ ] Issue verified as resolved
- [ ] No new issues introduced

---

**Checklist Summary:**
- Total Items: ~40
- Completed: ___ / ___
- Hotfix Status: [ ] 🚨 In Progress | [ ] ✅ Deployed | [ ] ⚠️ Monitoring
