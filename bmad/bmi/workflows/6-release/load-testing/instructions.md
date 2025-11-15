# Load Testing - Application Load and Performance Testing Instructions

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/bmad/bmi/workflows/6-release/load-testing/workflow.yaml</critical>
<critical>Communicate all responses in {communication_language} and language MUST be tailored to {user_skill_level}</critical>
<critical>Generate all documents in {document_output_language}</critical>

<critical>LOAD TESTING SAFETY: Always test on staging/pre-production first. NEVER run load tests against production without explicit approval. Load tests can impact real users.</critical>

<workflow>

<step n="1" goal="Initialize Load Testing Context">
  <action>Greet user: "I'm Phoenix, your Performance Engineer. I'll execute {load_profile} load testing for {target_url}."</action>
  <action>Gather load testing context:</action>
    - Target URL: {target_url}
    - Load Profile: {load_profile} (baseline/peak/stress/spike/soak)
    - Virtual Users: {virtual_users}
    - Duration: {duration}s
    - Success Criteria: {success_criteria}
  <action if="target_url contains 'production'">WARN: "Production URL detected. Ensure you have approval for production load testing."</action>
</step>

<step n="2" goal="Detect and Install Load Testing Tool">
  <action>Auto-detect available load testing tools:</action>
    - Check: artillery --version
    - Check: k6 version
    - Check: locust --version
    - Check: jmeter --version
    - Check: gatling --version
  <action if="load_testing_tool specified">Use specified tool: {load_testing_tool}</action>
  <action if="no tool specified">Select first available tool (prefer k6 > artillery > locust)</action>
  <action if="no tools found">Provide installation instructions for k6 (recommended)</action>
  <action>Display selected tool: {selected_tool}</action>
</step>

<step n="3" goal="Configure Load Profile">
  <action>Configure load profile parameters based on {load_profile}:</action>

  <profile name="baseline">
    - Virtual Users: 50
    - Duration: 300s (5 min)
    - Ramp-up: 30s
    - Purpose: Normal load validation
  </profile>

  <profile name="peak">
    - Virtual Users: 200
    - Duration: 600s (10 min)
    - Ramp-up: 60s
    - Purpose: Peak capacity validation
  </profile>

  <profile name="stress">
    - Virtual Users: 400
    - Duration: 900s (15 min)
    - Ramp-up: 120s
    - Purpose: Find breaking point
  </profile>

  <profile name="spike">
    - Pattern: 0 → 500 users (instant) → hold 120s → 0
    - Duration: 300s
    - Purpose: Test burst capacity
  </profile>

  <profile name="soak">
    - Virtual Users: 100
    - Duration: 3600-14400s (1-4 hours)
    - Purpose: Long-term stability and memory leak detection
  </profile>

  <action>Display load profile configuration</action>
</step>

<step n="4" goal="Retrieve Baseline Metrics (if enabled)">
  <action if="baseline_comparison is false">Skip baseline retrieval</action>
  <action if="baseline_comparison is false">Skip to step 5</action>
  <action>Retrieve baseline metrics from monitoring system:</action>
    - Baseline p95 latency: {baseline_p95}ms
    - Baseline throughput: {baseline_rps} req/s
    - Baseline error rate: {baseline_error_rate}%
  <action>Display baseline summary for comparison</action>
</step>

<step n="5" goal="Generate Load Test Scenario">
  <action if="test_scenario provided">Use provided scenario file: {test_scenario}</action>
  <action if="test_scenario not provided">Generate basic scenario for {target_url}:</action>

  <scenario tool="k6">
    ```javascript
    import http from 'k6/http';
    import { check, sleep } from 'k6';

    export let options = {
      vus: {virtual_users},
      duration: '{duration}s',
      thresholds: {
        http_req_duration: ['p(95)<500'], // p95 < 500ms
        http_req_failed: ['rate<0.01'],   // error rate < 1%
      },
    };

    export default function () {
      let res = http.get('{target_url}');
      check(res, {
        'status is 200': (r) => r.status === 200,
      });
      sleep(1);
    }
    ```
  </scenario>

  <scenario tool="artillery">
    ```yaml
    config:
      target: '{target_url}'
      phases:
        - duration: {duration}
          arrivalRate: {virtual_users}
    scenarios:
      - name: "Load test"
        flow:
          - get:
              url: "/"
    ```
  </scenario>

  <action>Save scenario to temporary file</action>
  <action>Display scenario preview</action>
</step>

<step n="6" goal="Execute Load Test">
  <action>Start load test with real-time monitoring:</action>

  <tool name="k6">
    - k6 run --vus {virtual_users} --duration {duration}s script.js
  </tool>

  <tool name="artillery">
    - artillery run scenario.yml
  </tool>

  <tool name="locust">
    - locust -f locustfile.py --headless -u {virtual_users} -r {ramp_up_rate} -t {duration}s --host {target_url}
  </tool>

  <action>Monitor test progress:</action>
    - Current VUs: {current_vus}
    - Requests completed: {requests_completed}
    - Current RPS: {current_rps}
    - Current p95: {current_p95}ms
    - Errors: {error_count}
  <action>Wait for test completion: {duration}s</action>
</step>

<step n="7" goal="Collect and Analyze Metrics">
  <action>Collect performance metrics:</action>
    - p50 latency: {p50}ms
    - p95 latency: {p95}ms
    - p99 latency: {p99}ms
    - Max latency: {max}ms
    - Throughput: {rps} req/s
    - Error rate: {error_rate}%
    - Total requests: {total_requests}
  <action if="baseline_comparison enabled">Calculate delta from baseline:</action>
    - p95 delta: {p95_delta}% (vs baseline {baseline_p95}ms)
    - RPS delta: {rps_delta}% (vs baseline {baseline_rps} req/s)
    - Error rate delta: {error_delta}% (vs baseline {baseline_error_rate}%)
  <action>Display metrics summary</action>
</step>

<step n="8" goal="Validate Success Criteria">
  <action if="success_criteria not specified">Use default SLA thresholds</action>
  <action>Validate each success criterion:</action>
    - p95 latency < 500ms: {p95 < 500 ? "✅ PASS" : "❌ FAIL"}
    - p99 latency < 1000ms: {p99 < 1000 ? "✅ PASS" : "❌ FAIL"}
    - Error rate < 1%: {error_rate < 1 ? "✅ PASS" : "❌ FAIL"}
    - Throughput > 100 req/s: {rps > 100 ? "✅ PASS" : "❌ FAIL"}
  <action if="any criteria fail">WARN: "Load test failed to meet success criteria. Review bottlenecks."</action>
  <action if="all criteria pass">Display: "✅ All success criteria met"</action>
</step>

<step n="9" goal="Identify Bottlenecks (if criteria failed)">
  <action if="all success criteria met">Skip bottleneck analysis</action>
  <action if="all success criteria met">Skip to step 10</action>
  <action>Analyze performance bottlenecks:</action>
    - High latency → Database queries, external API calls, CPU/memory limits
    - High error rate → Resource exhaustion, timeouts, rate limiting
    - Low throughput → Connection limits, database connection pool, slow queries
  <action>Generate bottleneck recommendations</action>
  <action>Suggest: Invoke performance-profiling workflow for deeper analysis</action>
</step>

<step n="10" goal="Generate Load Test Report">
  <action>Create comprehensive load test report:</action>
  ```markdown
  # Load Test Report: {load_profile}

  **Date:** {date}
  **Target:** {target_url}
  **Tool:** {selected_tool}
  **Duration:** {duration}s
  **Virtual Users:** {virtual_users}

  ## Performance Metrics

  ### Latency
  - p50: {p50}ms
  - p95: {p95}ms (baseline: {baseline_p95}ms, delta: {p95_delta}%)
  - p99: {p99}ms
  - Max: {max}ms

  ### Throughput
  - Requests/sec: {rps} (baseline: {baseline_rps}, delta: {rps_delta}%)
  - Total Requests: {total_requests}

  ### Errors
  - Error Rate: {error_rate}% (baseline: {baseline_error_rate}%, delta: {error_delta}%)
  - Total Errors: {total_errors}

  ## Success Criteria

  | Criterion | Threshold | Actual | Status |
  |-----------|-----------|--------|--------|
  | p95 latency | < 500ms | {p95}ms | {p95_status} |
  | Error rate | < 1% | {error_rate}% | {error_status} |
  | Throughput | > 100 req/s | {rps} req/s | {rps_status} |

  **Overall:** {overall_status}

  ## Bottlenecks Identified

  {bottleneck_list (if any)}

  ## Recommendations

  {recommendations}
  ```
  <action>Save report to: {output_folder}/load-test-{date}.md</action>
  <action>Display report summary</action>
  <action>Workflow complete ✅</action>
</step>

</workflow>
