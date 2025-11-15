#!/bin/bash
# File: scripts/burn-in.sh
# Purpose: Run E2E tests multiple times to detect flaky tests

set -e

ITERATIONS=10
FAILURES=0

echo "🔥 Starting burn-in loop (${ITERATIONS} iterations)..."

for i in $(seq 1 $ITERATIONS); do
  echo "🔄 Iteration $i/$ITERATIONS"

  if ! npm run test:e2e -- --project=chromium; then
    FAILURES=$((FAILURES + 1))
    echo "❌ Iteration $i FAILED"
  else
    echo "✅ Iteration $i PASSED"
  fi
done

echo "📊 Burn-in Results: $((ITERATIONS - FAILURES))/$ITERATIONS passed"

if [ $FAILURES -gt 0 ]; then
  echo "❌ Flaky tests detected! $FAILURES failures in $ITERATIONS runs"
  exit 1
fi

echo "✅ All burn-in iterations passed - no flaky tests detected"
