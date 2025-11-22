# Load Testing Pre-Flight Checklist

**Checklist Status Markers:** `[x]` Completed | `[ ]` Not completed | `[N/A]` Not applicable | `[!]` Requires attention

---

## 1. Load Testing Configuration
- [ ] Target URL specified: {target_url}
- [ ] Load profile selected: {load_profile}
- [ ] Virtual users configured: {virtual_users}
- [ ] Test duration configured: {duration}s
- [ ] Ramp-up time configured: {ramp_up_time}s
- [ ] Success criteria defined: {success_criteria}
- [ ] Production URL approval obtained (if applicable)

---

## 2. Tool Installation
- [ ] Load testing tool selected: {load_testing_tool}
- [ ] Tool installed and in PATH
- [ ] Tool version verified
- [ ] Test scenario file prepared (if custom)

---

## 3. Baseline Metrics
- [ ] Baseline comparison enabled: {baseline_comparison}
- [ ] Baseline p95 latency retrieved: {baseline_p95}ms
- [ ] Baseline throughput retrieved: {baseline_rps} req/s
- [ ] Baseline error rate retrieved: {baseline_error_rate}%

---

## 4. Test Scenario
- [ ] Scenario file created or provided
- [ ] Target URL verified in scenario
- [ ] Load parameters configured (VUs, duration, ramp-up)
- [ ] Thresholds configured (if applicable)
- [ ] Scenario preview reviewed

---

## 5. Test Execution
- [ ] Load test started
- [ ] Real-time monitoring active
- [ ] Test duration: {duration}s
- [ ] Test completed successfully
- [ ] No test errors or crashes

---

## 6. Metrics Collection
- [ ] p50 latency collected: {p50}ms
- [ ] p95 latency collected: {p95}ms
- [ ] p99 latency collected: {p99}ms
- [ ] Max latency collected: {max}ms
- [ ] Throughput collected: {rps} req/s
- [ ] Error rate collected: {error_rate}%
- [ ] Total requests collected: {total_requests}

---

## 7. Baseline Comparison (if enabled)
- [ ] p95 delta calculated: {p95_delta}%
- [ ] RPS delta calculated: {rps_delta}%
- [ ] Error rate delta calculated: {error_delta}%

---

## 8. Success Criteria Validation
- [ ] p95 latency < 500ms: {p95_status}
- [ ] p99 latency < 1000ms: {p99_status}
- [ ] Error rate < 1%: {error_status}
- [ ] Throughput > 100 req/s: {rps_status}
- [ ] Overall status: {overall_status}

---

## 9. Bottleneck Analysis (if failed)
- [ ] Bottlenecks identified
- [ ] Recommendations generated
- [ ] Performance profiling suggested (if needed)

---

## 10. Report Generation
- [ ] Load test report created
- [ ] Metrics included
- [ ] Success criteria status included
- [ ] Bottlenecks documented (if any)
- [ ] Recommendations included
- [ ] Report saved to output folder

---

**Checklist Summary:**
- Total Items: ~40
- Completed: ___ / ___
- Load Test Status: [ ] ✅ Pass | [ ] ⚠️ Review | [ ] ❌ Fail
