# Performance Profiling - Application Performance Analysis Instructions

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/bmad/bmi/workflows/5-deployment/performance-profiling/workflow.yaml</critical>
<critical>Communicate all responses in {communication_language} and language MUST be tailored to {user_skill_level}</critical>
<critical>Generate all documents in {document_output_language}</critical>

<critical>PRODUCTION PROFILING: Profiling can impact performance. For production environments, use low-overhead profilers (py-spy, perf) and limit profiling duration to minimize impact.</critical>

<workflow>

<step n="1" goal="Initialize Performance Profiling Context">
  <action>Greet user: "I'm Phoenix, your Performance Engineer. I'll help you profile {profiling_target} to identify performance bottlenecks."</action>
  <action>Gather profiling context:</action>
    - Profiling Target: {profiling_target}
    - Environment: {environment}
    - Profiling Duration: {profiling_duration} (default: 60s)
    - Load Pattern: {load_pattern} (idle/normal/peak/synthetic)
    - Profiling Type: {profiling_type} (cpu/memory/io/network/all)
    - Optimization Focus: {optimization_focus} (latency/throughput/memory/cost)
  <action if="environment is production">WARN: "Production profiling detected. Will use low-overhead profiler and limit duration to {profiling_duration}s to minimize impact."</action>
  <action if="environment is production AND profiling_duration > 120">HALT: "Production profiling duration limited to 120s maximum. Please reduce profiling_duration."</action>
</step>

<step n="2" goal="Detect Application Stack and Profiling Tool">
  <action>Auto-detect application stack:</action>
    - Check package.json (Node.js)
    - Check requirements.txt/pyproject.toml (Python)
    - Check go.mod (Go)
    - Check pom.xml/build.gradle (Java)
    - Check *.csproj (.NET)
    - Check Gemfile (Ruby)
    - Check composer.json (PHP)
    - Check for browser/frontend target (Chrome DevTools)
  <action>Select profiling tool based on stack:</action>
  ```
  Node.js:     clinic.js, Node.js --prof, Chrome DevTools (V8)
  Python:      py-spy (low overhead), cProfile (deterministic)
  Go:          pprof (CPU, memory, goroutine)
  Java:        VisualVM, async-profiler, JFR
  .NET:        dotnet-trace, PerfView
  Ruby:        ruby-prof, stackprof
  PHP:         XHProf, Blackfire
  Frontend:    Chrome DevTools, Firefox Profiler
  ```
  <action>Display detected stack and selected profiling tool</action>
  <action>Verify profiling tool is installed (or provide installation instructions)</action>
</step>

<step n="3" goal="Retrieve Baseline Performance Metrics">
  <action if="baseline_comparison is true">Retrieve baseline metrics from monitoring system:</action>
    - Baseline latency (p50, p95, p99)
    - Baseline throughput (requests/sec)
    - Baseline CPU usage (%)
    - Baseline memory usage (MB)
    - Baseline error rate (%)
  <action>Display baseline summary:</action>
  ```
  📊 Baseline Performance (from monitoring):
  - Latency: p50={p50_baseline}ms, p95={p95_baseline}ms, p99={p99_baseline}ms
  - Throughput: {rps_baseline} req/s
  - CPU: {cpu_baseline}%
  - Memory: {memory_baseline}MB
  - Error Rate: {error_rate_baseline}%
  ```
  <action if="baseline_comparison is false">Skip baseline retrieval, perform standalone profiling</action>
</step>

<step n="4" goal="Configure Profiling Session">
  <action>Configure profiling parameters based on profiling_type:</action>

  <config type="cpu">
    - Sampling frequency: {profiling_frequency} Hz (default: 99 Hz)
    - Flamegraph generation: {flamegraph_enabled}
    - Call stack depth: unlimited
    - Profile user + kernel time
  </config>

  <config type="memory">
    - Track allocations: yes
    - Heap snapshot interval: 10s
    - Track object lifecycle
    - Detect memory leaks (growth >10%)
  </config>

  <config type="io">
    - Track disk I/O operations
    - Track network I/O operations
    - Measure I/O wait time
    - Identify slow I/O (>100ms)
  </config>

  <config type="network">
    - Capture HTTP/HTTPS requests
    - Measure request latency
    - Identify slow external APIs (>500ms)
    - Track request size and bandwidth
  </config>

  <config type="database">
    - Enable query profiling
    - Capture query execution time
    - Track connection pool usage
    - Identify slow queries (>100ms)
  </config>

  <action>Display profiling configuration</action>
</step>

<step n="5" goal="Apply Load Pattern (if specified)">
  <action if="load_pattern is idle">No load generation, profile application at rest</action>
  <action if="load_pattern is normal">Use existing production traffic (passive profiling)</action>
  <action if="load_pattern is peak">Wait for peak traffic period or simulate peak load</action>
  <action if="load_pattern is synthetic">Generate synthetic load using load testing tool:</action>
    - Artillery (Node.js load testing)
    - Locust (Python load testing)
    - k6 (Go-based load testing)
    - JMeter (Java load testing)
  <action if="synthetic load">Configure load generator:</action>
    - Target: {profiling_target}
    - Duration: {profiling_duration}s
    - Virtual users: {virtual_users} (default: 50)
    - Ramp-up time: 10s
  <action if="synthetic load">Start load generator in background</action>
</step>

<step n="6" goal="Execute Profiling Session">
  <action>Start profiling session with selected tool:</action>

  <profiler tool="py-spy">
    ```bash
    # Python profiling with py-spy (low overhead)
    py-spy record --pid {pid} --duration {profiling_duration} --rate {profiling_frequency} --format flamegraph --output profile.svg
    ```
  </profiler>

  <profiler tool="nodejs_profiler">
    ```bash
    # Node.js profiling with clinic.js
    clinic doctor -- node app.js  # CPU and event loop
    clinic bubbleprof -- node app.js  # Async operations
    clinic flame -- node app.js  # Flamegraph
    ```
  </profiler>

  <profiler tool="pprof">
    ```bash
    # Go profiling with pprof
    curl http://localhost:6060/debug/pprof/profile?seconds={profiling_duration} -o cpu.prof
    curl http://localhost:6060/debug/pprof/heap -o mem.prof
    go tool pprof -http=:8080 cpu.prof  # View flamegraph
    ```
  </profiler>

  <profiler tool="visualvm">
    ```bash
    # Java profiling with async-profiler
    java -agentpath:/path/to/async-profiler/libasyncProfiler.so=start,event=cpu,file=profile.html -jar app.jar
    ```
  </profiler>

  <profiler tool="dotnet_trace">
    ```bash
    # .NET profiling with dotnet-trace
    dotnet-trace collect --process-id {pid} --duration {profiling_duration} --profile cpu-sampling
    ```
  </profiler>

  <profiler tool="chrome_devtools">
    1. Open Chrome DevTools (F12)
    2. Navigate to Performance tab
    3. Click "Record" button
    4. Perform actions on {profiling_target}
    5. Stop recording after {profiling_duration}s
    6. Analyze flame chart and call tree
  </profiler>

  <action>Monitor profiling overhead (should be <10% CPU impact)</action>
  <action if="profiling overhead > 10%">WARN: "High profiling overhead detected ({overhead}%). Consider reducing profiling_frequency."</action>
  <action>Wait for profiling duration: {profiling_duration}s</action>
  <action>Stop profiling session</action>
  <action>Collect profiling data files</action>
</step>

<step n="7" goal="Generate Flamegraph Visualization">
  <action if="flamegraph_enabled is true">Generate flamegraph from profiling data:</action>
    - CPU flamegraph (shows hot functions)
    - Memory flamegraph (shows allocation sites)
    - Differential flamegraph (compare to baseline if available)
  <action>Save flamegraph to: {output_folder}/flamegraph-{date}.svg</action>
  <action>Display flamegraph summary:</action>
  ```
  🔥 Flamegraph Generated:
  - Width represents total time spent in function
  - Height represents call stack depth
  - Hot functions (red/orange) are optimization candidates
  - Cold functions (blue/green) are efficient
  ```
  <action if="flamegraph_enabled is false">Skip flamegraph generation</action>
</step>

<step n="8" goal="Analyze Performance Metrics">
  <action>Extract performance metrics from profiling data:</action>

  <metrics category="latency">
    - p50 latency: {p50_profiled}ms
    - p95 latency: {p95_profiled}ms
    - p99 latency: {p99_profiled}ms
    - Max latency: {max_profiled}ms
  </metrics>

  <metrics category="throughput">
    - Requests per second: {rps_profiled}
    - Transactions per second: {tps_profiled}
  </metrics>

  <metrics category="resources">
    - CPU usage: {cpu_profiled}%
    - Memory usage: {memory_profiled}MB
    - Disk I/O: {disk_io_profiled} MB/s
    - Network I/O: {network_io_profiled} MB/s
  </metrics>

  <action if="baseline_comparison is true">Calculate delta from baseline:</action>
  ```
  📈 Performance Delta (vs baseline):
  - Latency p95: {p95_profiled}ms ({delta_p95}% vs baseline)
  - Throughput: {rps_profiled} req/s ({delta_rps}% vs baseline)
  - CPU: {cpu_profiled}% ({delta_cpu}% vs baseline)
  - Memory: {memory_profiled}MB ({delta_memory}% vs baseline)
  ```
  <action>Display performance metrics summary</action>
</step>

<step n="9" goal="Detect Performance Bottlenecks">
  <action>Analyze profiling data for bottlenecks:</action>

  <bottleneck type="hot_functions">
    - Identify functions consuming >5% CPU time
    - Rank by total CPU time (self + children)
    - Example: `processData()` - 35% CPU time
  </bottleneck>

  <bottleneck type="slow_queries">
    - Identify database queries >100ms
    - Rank by total time (execution time × frequency)
    - Example: `SELECT * FROM users WHERE ...` - 250ms, 1000x/min
  </bottleneck>

  <bottleneck type="slow_api_calls">
    - Identify external API calls >500ms
    - Rank by total time
    - Example: `fetch('https://external-api.com')` - 1200ms, 50x/min
  </bottleneck>

  <bottleneck type="memory_leaks">
    - Identify memory growth >10% over profiling duration
    - Detect unreleased references
    - Example: Memory grew from 200MB → 250MB (+25%)
  </bottleneck>

  <bottleneck type="lock_contention">
    - Identify locks with >10% wait time
    - Rank by total wait time
    - Example: `mutex.Lock()` - 15% wait time
  </bottleneck>

  <bottleneck type="gc_pressure">
    - Identify garbage collection time >5% of CPU
    - Analyze GC frequency and pause time
    - Example: GC pause time: 8% of total CPU
  </bottleneck>

  <action>Rank bottlenecks by severity (impact × frequency)</action>
  <action>Display top 10 bottlenecks</action>
</step>

<step n="10" goal="Generate Optimization Recommendations">
  <action>For each detected bottleneck, generate optimization recommendation:</action>

  <recommendation type="algorithmic">
    - Bottleneck: {bottleneck_description}
    - Current complexity: O(n²)
    - Recommended: Optimize algorithm to O(n log n) using binary search
    - Expected impact: 80% reduction in CPU time
  </recommendation>

  <recommendation type="caching">
    - Bottleneck: Repeated computation of {function_name}
    - Recommended: Add Redis cache with 5-minute TTL
    - Expected impact: 90% reduction in computation time
  </recommendation>

  <recommendation type="database">
    - Bottleneck: Slow query on {table_name}
    - Recommended: Add index on {column_name}
    - Expected impact: 95% reduction in query time (250ms → 12ms)
  </recommendation>

  <recommendation type="concurrency">
    - Bottleneck: Sequential API calls to {api_endpoint}
    - Recommended: Parallelize using Promise.all() or async/await
    - Expected impact: 70% reduction in total latency
  </recommendation>

  <recommendation type="resource_scaling">
    - Bottleneck: CPU saturation at {cpu_usage}%
    - Recommended: Scale horizontally (add 2 more instances)
    - Expected impact: 50% reduction in latency
  </recommendation>

  <action>Prioritize recommendations by expected impact and implementation effort:</action>
  ```
  Priority 1 (High Impact, Low Effort):
  - {recommendation_1}

  Priority 2 (High Impact, Medium Effort):
  - {recommendation_2}

  Priority 3 (Medium Impact, Low Effort):
  - {recommendation_3}
  ```
  <action>Display prioritized recommendations</action>
</step>

<step n="11" goal="Generate Performance Profile Report">
  <action>Create performance profile document:</action>
  ```markdown
  # Performance Profile Report: {profiling_target}

  **Date:** {date}
  **Environment:** {environment}
  **Profiling Duration:** {profiling_duration}s
  **Profiling Type:** {profiling_type}
  **Load Pattern:** {load_pattern}

  ## Performance Metrics

  ### Latency
  - p50: {p50_profiled}ms (baseline: {p50_baseline}ms, delta: {delta_p50}%)
  - p95: {p95_profiled}ms (baseline: {p95_baseline}ms, delta: {delta_p95}%)
  - p99: {p99_profiled}ms (baseline: {p99_baseline}ms, delta: {delta_p99}%)

  ### Throughput
  - Requests/sec: {rps_profiled} (baseline: {rps_baseline}, delta: {delta_rps}%)

  ### Resource Usage
  - CPU: {cpu_profiled}% (baseline: {cpu_baseline}%, delta: {delta_cpu}%)
  - Memory: {memory_profiled}MB (baseline: {memory_baseline}MB, delta: {delta_memory}%)

  ## Detected Bottlenecks

  ### 1. {bottleneck_1_name} (Severity: High)
  - Impact: {bottleneck_1_impact}
  - Frequency: {bottleneck_1_frequency}
  - Details: {bottleneck_1_details}

  ### 2. {bottleneck_2_name} (Severity: Medium)
  - Impact: {bottleneck_2_impact}
  - Frequency: {bottleneck_2_frequency}
  - Details: {bottleneck_2_details}

  ## Optimization Recommendations

  ### Priority 1: {recommendation_1_name}
  - Type: {recommendation_1_type}
  - Expected Impact: {recommendation_1_impact}
  - Implementation Effort: {recommendation_1_effort}
  - Details: {recommendation_1_details}

  ### Priority 2: {recommendation_2_name}
  - Type: {recommendation_2_type}
  - Expected Impact: {recommendation_2_impact}
  - Implementation Effort: {recommendation_2_effort}
  - Details: {recommendation_2_details}

  ## Flamegraph
  [See attached: flamegraph-{date}.svg]

  ## Raw Profiling Data
  [See attached: profile-{date}.{ext}]
  ```
  <action>Save performance profile to {output_folder}/performance-profile-{date}.md</action>
  <action>Workflow complete ✅</action>
</step>

</workflow>
