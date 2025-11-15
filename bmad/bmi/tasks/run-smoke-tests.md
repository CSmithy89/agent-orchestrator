# Task: Run Smoke Tests

**Purpose:** Execute basic smoke tests to verify deployment succeeded

**Used By:** deploy, rollback, hotfix workflows

**Inputs:**
- `target_url` - URL of deployed application
- `test_categories` - Categories of tests to run (health, api, ui, database, auth, integration)
- `timeout` - Maximum time to wait for tests (default: 300s / 5 min)

**Outputs:**
- `tests_passed` - Boolean indicating if all tests passed
- `test_results` - Detailed test results per category
- `failed_tests` - List of failed tests (if any)

---

## Smoke Test Categories

### 1. Health Check Test
```bash
# Test: Application is running and responding
curl --fail --max-time 10 ${target_url}/health || ${target_url}/

Expected: HTTP 200 status
```

### 2. API Tests (if API endpoints available)
```bash
# Test: Core API endpoints responding
curl --fail ${target_url}/api/status
curl --fail ${target_url}/api/version

Expected: HTTP 200 status, valid JSON response
```

### 3. UI Tests (if web application)
```bash
# Test: Homepage loads
curl --fail ${target_url}/

# Test: Critical pages load
curl --fail ${target_url}/login
curl --fail ${target_url}/dashboard

Expected: HTTP 200 status, no 500 errors
```

### 4. Database Connectivity Test
```bash
# Test: Database connection (via health endpoint)
curl --fail ${target_url}/health/db

Expected: HTTP 200, database status: "connected"
```

### 5. Authentication Test
```bash
# Test: Auth endpoints responding (not necessarily authenticated)
curl --fail ${target_url}/api/auth/status

Expected: HTTP 200 or 401 (not 500)
```

### 6. Integration Test
```bash
# Test: External service integrations
curl --fail ${target_url}/health/integrations

Expected: All integrations: "healthy" or "degraded" (not "failed")
```

---

## Test Execution

### Sequential Execution

```bash
#!/bin/bash

TARGET_URL="$1"
FAILED_TESTS=()

# 1. Health Check
echo "Running health check..."
if ! curl --fail --silent --max-time 10 "${TARGET_URL}/health" > /dev/null 2>&1; then
  if ! curl --fail --silent --max-time 10 "${TARGET_URL}/" > /dev/null 2>&1; then
    FAILED_TESTS+=("health_check")
    echo "❌ Health check FAILED"
  fi
else
  echo "✅ Health check PASSED"
fi

# 2. API Tests
echo "Running API tests..."
if curl --fail --silent --max-time 10 "${TARGET_URL}/api/status" > /dev/null 2>&1; then
  echo "✅ API tests PASSED"
else
  FAILED_TESTS+=("api_tests")
  echo "❌ API tests FAILED"
fi

# 3. UI Tests
echo "Running UI tests..."
if curl --fail --silent --max-time 10 "${TARGET_URL}/" > /dev/null 2>&1; then
  echo "✅ UI tests PASSED"
else
  FAILED_TESTS+=("ui_tests")
  echo "❌ UI tests FAILED"
fi

# 4. Database Tests
echo "Running database connectivity test..."
if curl --fail --silent --max-time 10 "${TARGET_URL}/health/db" > /dev/null 2>&1; then
  echo "✅ Database test PASSED"
else
  FAILED_TESTS+=("database_test")
  echo "❌ Database test FAILED"
fi

# Summary
if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
  echo "✅ All smoke tests PASSED"
  exit 0
else
  echo "❌ Some smoke tests FAILED: ${FAILED_TESTS[*]}"
  exit 1
fi
```

---

## Usage Example

```yaml
# From deploy workflow
<step n="7" goal="Run Smoke Tests">
  <action>Invoke task: run-smoke-tests</action>
    - target_url: {deployment_url}
    - test_categories: ["health", "api", "database"]
    - timeout: 300

  <action if="tests_passed">Display: "✅ Smoke tests passed"</action>
  <action if="tests_failed">
    - Display failed tests: {failed_tests}
    - WARN: "Smoke tests failed. Consider rollback."
    - if rollback_on_failure: Invoke rollback workflow
  </action>
</step>
```

---

## Test Results Format

```yaml
test_results:
  health_check:
    status: "passed"
    response_time: "45ms"
    http_status: 200
  api_tests:
    status: "passed"
    response_time: "120ms"
    http_status: 200
  ui_tests:
    status: "passed"
    response_time: "230ms"
    http_status: 200
  database_test:
    status: "passed"
    response_time: "15ms"
    connection: "healthy"
  auth_test:
    status: "passed"
    response_time: "95ms"
    http_status: 401  # Expected for unauthenticated request
  integration_test:
    status: "failed"
    response_time: "timeout"
    error: "Third-party service unavailable"

tests_passed: false
failed_tests: ["integration_test"]
```

---

## Retry Logic

```bash
# Retry failed tests up to 3 times with exponential backoff
retry_test() {
  local test_name=$1
  local test_command=$2
  local max_retries=3
  local retry_count=0

  while [ $retry_count -lt $max_retries ]; do
    if eval "$test_command"; then
      echo "✅ $test_name PASSED"
      return 0
    fi

    retry_count=$((retry_count + 1))
    if [ $retry_count -lt $max_retries ]; then
      local wait_time=$((2 ** retry_count))
      echo "⏳ $test_name FAILED, retrying in ${wait_time}s..."
      sleep $wait_time
    fi
  done

  echo "❌ $test_name FAILED after $max_retries attempts"
  return 1
}

# Usage
retry_test "Health Check" "curl --fail --silent ${TARGET_URL}/health"
```
