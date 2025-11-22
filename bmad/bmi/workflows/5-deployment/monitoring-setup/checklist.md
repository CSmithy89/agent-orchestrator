# Monitoring Setup Pre-Flight Checklist

**Checklist Status Markers:** `[x]` Completed | `[ ]` Not completed | `[N/A]` Not applicable | `[!]` Requires attention

---

## 1. Monitoring Platform
- [ ] Monitoring platform selected: CloudWatch / Stackdriver / Azure Monitor / Datadog / New Relic / Prometheus / Elastic / Other
- [ ] Platform account created and active
- [ ] API keys / credentials configured
- [ ] Platform agent installed (if required)

## 2. Metrics Collection
- [ ] Application exposes metrics endpoint (if using Prometheus)
- [ ] Metrics collection interval configured: {metrics_collection_interval}s
- [ ] Standard metrics configured (request rate, error rate, latency)
- [ ] Infrastructure metrics configured (CPU, memory, disk, network)
- [ ] Custom business metrics identified and configured

## 3. Log Aggregation
- [ ] Log shipping configured (CloudWatch Logs, Filebeat, Fluentd, etc.)
- [ ] Log retention policy set: {log_retention_days} days
- [ ] Log levels configured per environment (DEBUG for dev, INFO for prod)
- [ ] Structured logging enabled (JSON format)
- [ ] Log search/query tested

## 4. Dashboards
- [ ] Application performance dashboard created
- [ ] Infrastructure health dashboard created
- [ ] Error tracking dashboard created
- [ ] Custom dashboards for business metrics (if applicable)
- [ ] Dashboard access granted to team

## 5. Alerting
- [ ] Critical alerts configured:
  - [ ] High error rate alert (>5% for 5 min)
  - [ ] Service down alert (health check failing)
  - [ ] High latency alert (p95 > 1000ms)
- [ ] Infrastructure alerts configured:
  - [ ] High CPU alert (>80% for 10 min)
  - [ ] High memory alert (>85% for 10 min)
  - [ ] Low disk space alert (>90%)
- [ ] Alert notification channels configured (Slack, Email, PagerDuty)
- [ ] Alert delivery tested (test notification sent)

## 6. APM and Tracing
- [ ] APM agent installed and configured (if applicable)
- [ ] Transaction tracing enabled
- [ ] Distributed tracing configured (if microservices)
- [ ] Trace sampling rate configured
- [ ] Slow query detection enabled

## 7. Validation
- [ ] Metrics collection verified (recent datapoints visible)
- [ ] Logs shipping verified (recent log entries visible)
- [ ] Dashboards display data correctly
- [ ] Alert delivery tested successfully
- [ ] APM traces visible (if enabled)

## 8. Documentation
- [ ] Dashboard URLs documented
- [ ] Alert rules documented
- [ ] Runbook for common alerts created
- [ ] Team access instructions documented

**Checklist Summary:**
- Total Items: ~40
- Completed: ___ / ___
- Status: [ ] ✅ Ready | [ ] ⚠️ Review | [ ] ❌ Blocked
