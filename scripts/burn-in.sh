#!/bin/bash
# Burn-in loop for flaky test detection
# Runs E2E tests multiple times to catch non-deterministic failures

set -e

ITERATIONS=${BURN_IN_ITERATIONS:-10}

echo "🔥 Starting burn-in loop for flaky test detection..."
echo "Iterations: $ITERATIONS"
echo ""

for i in $(seq 1 $ITERATIONS); do
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔥 Burn-in iteration $i/$ITERATIONS"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if ! npm run test:e2e; then
    echo ""
    echo "❌ FLAKY TEST DETECTED on iteration $i/$ITERATIONS"
    echo "Tests must pass consistently to merge."
    exit 1
  fi
  
  echo "✅ Iteration $i/$ITERATIONS passed"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 All $ITERATIONS burn-in iterations passed!"
echo "✅ No flaky tests detected"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
