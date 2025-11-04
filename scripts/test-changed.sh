#!/bin/bash
# Selective testing: Run only tests for changed files
# Useful for faster feedback on focused PRs

set -e

echo "🔍 Detecting changed files..."

# Get changed files compared to main branch
CHANGED_FILES=$(git diff --name-only origin/main...HEAD 2>/dev/null || git diff --name-only HEAD~1)

if [ -z "$CHANGED_FILES" ]; then
  echo "⚠️  No changed files detected"
  echo "Running full test suite..."
  npm run test:e2e
  exit 0
fi

echo "Changed files:"
echo "$CHANGED_FILES"
echo ""

# Check if backend files changed
if echo "$CHANGED_FILES" | grep -q "^backend/"; then
  echo "📦 Backend changes detected - running backend tests..."
  npm run test --workspace=backend
fi

# Check if dashboard files changed
if echo "$CHANGED_FILES" | grep -q "^dashboard/"; then
  echo "🎨 Dashboard changes detected - running dashboard tests..."
  npm run test --workspace=dashboard
fi

# Check if E2E tests changed or if critical paths modified
if echo "$CHANGED_FILES" | grep -qE "(tests/e2e/|backend/src/api/|dashboard/src/)"; then
  echo "🎭 E2E-affecting changes detected - running E2E tests..."
  npm run test:e2e
fi

# If only documentation or config changed, skip tests
if echo "$CHANGED_FILES" | grep -qvE "\.(ts|tsx|js|jsx)$"; then
  echo "📝 Only non-code files changed - tests may be skipped"
  echo "Run full suite with: npm run test:e2e"
fi

echo ""
echo "✅ Selective testing complete"
