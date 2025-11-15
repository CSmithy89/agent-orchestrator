# Performance Profiling Pre-Flight Checklist

**Checklist Status Markers:** `[x]` Completed | `[ ]` Not completed | `[N/A]` Not applicable | `[!]` Requires attention

---

## 1. Profiling Setup

### Profiling Context
- [ ] Profiling target defined: {profiling_target}
- [ ] Environment selected: {environment} (dev/staging/production)
- [ ] Profiling duration configured: {profiling_duration}s
- [ ] Profiling type selected: {profiling_type} (cpu/memory/io/network/all)
- [ ] Load pattern selected: {load_pattern} (idle/normal/peak/synthetic)
- [ ] Optimization focus defined: {optimization_focus} (latency/throughput/memory/cost)

### Production Profiling Safety (if applicable)
- [ ] Production profiling approved by team lead
- [ ] Low-overhead profiler selected (py-spy, perf, async-profiler)
- [ ] Profiling duration limited to ≤120s
- [ ] Off-peak hours selected for profiling (if possible)
- [ ] Rollback plan ready in case of performance degradation

---

## 2. Tool Installation and Verification

### Application Stack Detection
- [ ] Application stack detected: {detected_stack}
- [ ] Profiling tool selected: {profiling_tool}
- [ ] Profiling tool installed and in PATH
- [ ] Profiling tool version verified: {tool_version}

### Tool-Specific Setup
- [ ] **Python:** py-spy or cProfile installed
- [ ] **Node.js:** clinic.js or --prof flag available
- [ ] **Go:** pprof HTTP server enabled (import _ "net/http/pprof")
- [ ] **Java:** async-profiler or VisualVM installed
- [ ] **.NET:** dotnet-trace installed
- [ ] **Ruby:** ruby-prof or stackprof installed
- [ ] **PHP:** XHProf or Blackfire installed
- [ ] **Frontend:** Chrome DevTools or Firefox Profiler accessible

### Permissions
- [ ] Profiling requires root/admin? {requires_elevated_permissions}
- [ ] Sufficient permissions to attach to process
- [ ] Sufficient disk space for profiling data (≥1GB recommended)

---

## 3. Baseline Metrics

### Retrieve Baseline (if baseline_comparison = true)
- [ ] Monitoring system accessible
- [ ] Baseline latency retrieved (p50, p95, p99)
- [ ] Baseline throughput retrieved (requests/sec)
- [ ] Baseline CPU usage retrieved (%)
- [ ] Baseline memory usage retrieved (MB)
- [ ] Baseline error rate retrieved (%)
- [ ] Baseline data covers representative time period (≥7 days)

---

## 4. Profiling Configuration

### CPU Profiling
- [ ] Sampling frequency configured: {profiling_frequency} Hz (default: 99 Hz)
- [ ] Call stack depth configured (unlimited recommended)
- [ ] User + kernel time profiling enabled
- [ ] Flamegraph generation enabled: {flamegraph_enabled}

### Memory Profiling
- [ ] Heap allocation tracking enabled
- [ ] Heap snapshot interval configured: 10s
- [ ] Object lifecycle tracking enabled
- [ ] Memory leak detection threshold set (>10% growth)

### I/O Profiling
- [ ] Disk I/O tracking enabled
- [ ] Network I/O tracking enabled
- [ ] I/O wait time measurement enabled
- [ ] Slow I/O threshold configured (>100ms)

### Network Profiling
- [ ] HTTP/HTTPS request capture enabled
- [ ] Request latency measurement enabled
- [ ] Slow API threshold configured (>500ms)
- [ ] Request size and bandwidth tracking enabled

### Database Profiling
- [ ] Query profiling enabled (if applicable)
- [ ] Query execution time capture enabled
- [ ] Connection pool usage tracking enabled
- [ ] Slow query threshold configured (>100ms)

---

## 5. Load Pattern

### Idle Load
- [ ] No load generation required
- [ ] Application at rest state confirmed

### Normal Load
- [ ] Using existing production traffic (passive profiling)
- [ ] Traffic pattern representative of typical usage

### Peak Load
- [ ] Peak traffic period identified: {peak_period}
- [ ] Profiling scheduled during peak hours

### Synthetic Load
- [ ] Load testing tool selected: {load_tool} (Artillery/Locust/k6/JMeter)
- [ ] Load testing tool installed
- [ ] Load generator configured:
  - [ ] Target URL: {profiling_target}
  - [ ] Virtual users: {virtual_users} (default: 50)
  - [ ] Ramp-up time: 10s
  - [ ] Duration: {profiling_duration}s
- [ ] Load generator tested (dry run)

---

## 6. Profiling Execution

### Start Profiling
- [ ] Profiling session started
- [ ] Start time recorded: {start_time}
- [ ] Profiling process ID captured: {profiling_pid}
- [ ] Load generator started (if synthetic load)

### Monitor Profiling
- [ ] Profiling overhead monitored (<10% CPU impact)
- [ ] Application performance monitored (no degradation >10%)
- [ ] Profiling duration countdown: {remaining_time}s
- [ ] No errors during profiling session

### Stop Profiling
- [ ] Profiling session stopped at {stop_time}
- [ ] Profiling data collected successfully
- [ ] Load generator stopped (if applicable)
- [ ] Profiling files saved to: {output_folder}

---

## 7. Flamegraph Generation

- [ ] Flamegraph generation enabled: {flamegraph_enabled}
- [ ] CPU flamegraph generated: flamegraph-cpu-{date}.svg
- [ ] Memory flamegraph generated (if memory profiling): flamegraph-memory-{date}.svg
- [ ] Differential flamegraph generated (if baseline available): flamegraph-diff-{date}.svg
- [ ] Flamegraph readable and displays correctly

---

## 8. Performance Metrics Analysis

### Latency Metrics
- [ ] p50 latency extracted: {p50_profiled}ms
- [ ] p95 latency extracted: {p95_profiled}ms
- [ ] p99 latency extracted: {p99_profiled}ms
- [ ] Max latency extracted: {max_profiled}ms

### Throughput Metrics
- [ ] Requests/sec calculated: {rps_profiled}
- [ ] Transactions/sec calculated: {tps_profiled} (if applicable)

### Resource Metrics
- [ ] CPU usage measured: {cpu_profiled}%
- [ ] Memory usage measured: {memory_profiled}MB
- [ ] Disk I/O measured: {disk_io_profiled} MB/s (if I/O profiling)
- [ ] Network I/O measured: {network_io_profiled} MB/s (if network profiling)

### Baseline Comparison (if enabled)
- [ ] Delta calculated for latency: {delta_p95}%
- [ ] Delta calculated for throughput: {delta_rps}%
- [ ] Delta calculated for CPU: {delta_cpu}%
- [ ] Delta calculated for memory: {delta_memory}%

---

## 9. Bottleneck Detection

### Hot Functions
- [ ] Functions consuming >5% CPU identified
- [ ] Top 10 hot functions ranked by CPU time
- [ ] Call stacks for hot functions analyzed

### Slow Queries
- [ ] Database queries >100ms identified
- [ ] Slow queries ranked by total time (execution time × frequency)
- [ ] Query patterns analyzed (N+1, missing indexes, etc.)

### Slow API Calls
- [ ] External API calls >500ms identified
- [ ] Slow APIs ranked by total time
- [ ] API failure rates analyzed

### Memory Leaks
- [ ] Memory growth analyzed (expected: <10% over profiling duration)
- [ ] Memory leaks detected (growth >10%)? {memory_leak_detected}
- [ ] Unreleased references identified (if leak detected)

### Lock Contention
- [ ] Locks with >10% wait time identified
- [ ] Lock contention ranked by total wait time
- [ ] Deadlock potential analyzed

### GC Pressure
- [ ] Garbage collection time measured (expected: <5% of CPU)
- [ ] GC frequency analyzed
- [ ] GC pause time analyzed

### Bottleneck Summary
- [ ] Top 10 bottlenecks identified and ranked by severity
- [ ] Bottleneck severity = impact × frequency

---

## 10. Optimization Recommendations

### Recommendation Generation
- [ ] Optimization recommendations generated for each bottleneck
- [ ] Recommendations categorized:
  - [ ] Algorithmic optimizations
  - [ ] Caching strategies
  - [ ] Database optimizations
  - [ ] Concurrency improvements
  - [ ] Resource scaling
  - [ ] Code refactoring

### Recommendation Prioritization
- [ ] Recommendations prioritized by expected impact
- [ ] Recommendations prioritized by implementation effort
- [ ] Priority 1 (High Impact, Low Effort) recommendations identified: {p1_count}
- [ ] Priority 2 (High Impact, Medium Effort) recommendations identified: {p2_count}
- [ ] Priority 3 (Medium Impact, Low Effort) recommendations identified: {p3_count}

---

## 11. Report Generation

### Performance Profile Report
- [ ] Performance profile report created
- [ ] Report includes:
  - [ ] Performance metrics (latency, throughput, resources)
  - [ ] Baseline comparison (if enabled)
  - [ ] Detected bottlenecks with severity ranking
  - [ ] Prioritized optimization recommendations
  - [ ] Flamegraph visualization
  - [ ] Raw profiling data reference
- [ ] Report saved to: {output_folder}/performance-profile-{date}.md

### Artifacts Saved
- [ ] Performance profile report: performance-profile-{date}.md
- [ ] Flamegraph(s): flamegraph-{date}.svg
- [ ] Raw profiling data: profile-{date}.{ext}
- [ ] Bottleneck report: bottlenecks-{date}.md
- [ ] Optimization recommendations: optimizations-{date}.md

---

**Checklist Summary:**
- Total Items: ~110
- Completed: ___ / ___
- Status: [ ] ✅ Ready | [ ] ⚠️ Review | [ ] ❌ Blocked
