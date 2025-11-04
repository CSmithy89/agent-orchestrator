#!/bin/bash
# Mirror CI pipeline execution locally for debugging
# Runs the same stages as CI in sequence

set -e

echo "🔍 Running CI pipeline locally..."
echo ""

# Stage 1: Lint
echo "━━━ Stage 1: Lint & Code Quality ━━━"
npm run lint || {
  echo "❌ Lint failed"
  exit 1
}
echo "✅ Lint passed"
echo ""

# Stage 2: Unit Tests
echo "━━━ Stage 2: Unit & Integration Tests ━━━"
npm run test --workspaces || {
  echo "❌ Unit tests failed"
  exit 1
}
echo "✅ Unit tests passed"
echo ""

# Stage 3: E2E Tests
echo "━━━ Stage 3: E2E Tests ━━━"
npm run test:e2e || {
  echo "❌ E2E tests failed"
  exit 1
}
echo "✅ E2E tests passed"
echo ""

# Stage 4: Burn-in (reduced iterations for local)
echo "━━━ Stage 4: Burn-in (3 iterations) ━━━"
BURN_IN_ITERATIONS=3 ./scripts/burn-in.sh || {
  echo "❌ Burn-in failed"
  exit 1
}
echo "✅ Burn-in passed"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Local CI pipeline passed!"
echo "✅ All stages completed successfully"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
