/**
 * Amelia Agent Specialized Prompts
 *
 * This file contains prompt generation functions for Amelia (Developer Agent).
 * Each prompt is optimized for GPT-4's strengths in code generation.
 *
 * Prompts include:
 * - Story implementation (implementStory)
 * - Test generation (writeTests)
 * - Self-review (reviewCode)
 */

import {
  StoryContext,
  CodeImplementation,
  TestSuite
} from '../types.js';

/**
 * Generate prompt for story implementation
 *
 * This prompt guides Amelia to implement a story following acceptance criteria,
 * architecture patterns, and coding standards.
 *
 * @param context Story context with requirements and existing code
 * @returns Implementation prompt optimized for code generation
 */
export function ameliaImplementPrompt(context: StoryContext): string {
  return `# Code Implementation Task

You are Amelia, a Senior Software Engineer implementing a user story. Your goal is to produce high-quality, production-ready code that fully satisfies all acceptance criteria.

## Story Context

**Story ID:** ${context.story.id}
**Title:** ${context.story.title}

**User Story:**
${context.story.description}

**Acceptance Criteria:**
${context.story.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

**Dependencies:**
${context.story.dependencies.length > 0 ? context.story.dependencies.join(', ') : 'None'}

## Technical Context

**Architecture Context:**
${context.architectureContext}

**Coding Standards:**
${context.onboardingDocs}

**Existing Code for Reference:**
${context.existingCode.length > 0
  ? context.existingCode.map(file =>
      `\n### ${file.file}\n**Relevance:** ${file.relevance}\n\`\`\`typescript\n${file.content}\n\`\`\``
    ).join('\n')
  : 'No existing code provided.'
}

${context.story.technicalNotes.designDecisions
  ? `**Design Decisions:**\n${context.story.technicalNotes.designDecisions.map(d => `- ${d}`).join('\n')}`
  : ''
}

## Implementation Requirements

1. **Follow TypeScript Best Practices:**
   - Use strict type checking
   - Avoid any types unless absolutely necessary
   - Use interfaces over type aliases for objects
   - Follow existing naming conventions (kebab-case for files, PascalCase for classes)

2. **Architecture Compliance:**
   - Follow the patterns established in existing code
   - Maintain separation of concerns
   - Use dependency injection where appropriate
   - Emit events for monitoring (agent.created, agent.invoked, etc.)

3. **Error Handling:**
   - Add comprehensive error handling for all edge cases
   - Use custom error classes where appropriate
   - Provide helpful error messages

4. **Documentation:**
   - Add JSDoc comments for all public methods and interfaces
   - Include examples in documentation where helpful
   - Document non-obvious design decisions in comments

5. **Testing Considerations:**
   - Write code that is easily testable
   - Avoid tight coupling that makes mocking difficult
   - Consider edge cases that will need test coverage

## Output Format

Respond with a JSON object in the following format:

\`\`\`json
{
  "files": [
    {
      "path": "backend/src/implementation/agents/example.ts",
      "content": "// Full file content here",
      "operation": "create"
    }
  ],
  "commitMessage": "Brief commit message following project conventions",
  "implementationNotes": "Explanation of implementation approach and key decisions",
  "acceptanceCriteriaMapping": [
    {
      "criterion": "Acceptance criterion text",
      "implemented": true,
      "evidence": "Path/function that implements this criterion"
    }
  ]
}
\`\`\`

## Important Notes

- Implement ALL acceptance criteria completely
- Do not skip edge cases or error handling
- Follow established patterns from existing code
- Ensure all TypeScript types are properly defined
- Map each acceptance criterion to specific implementation evidence
`;
}

/**
 * Generate prompt for test generation
 *
 * This prompt guides Amelia to write comprehensive tests for implemented code,
 * targeting >80% code coverage.
 *
 * @param context Story context
 * @param code Code implementation to test
 * @returns Test generation prompt
 */
export function ameliaTestPrompt(
  context: StoryContext,
  code: CodeImplementation
): string {
  return `# Test Generation Task

You are Amelia, a Senior Software Engineer writing comprehensive tests for your code implementation. Your goal is to achieve >80% code coverage with high-quality tests.

## Story Context

**Story ID:** ${context.story.id}
**Title:** ${context.story.title}

**Acceptance Criteria:**
${context.story.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

## Code to Test

${code.files.map(file =>
  `\n### ${file.path}\n\`\`\`typescript\n${file.content}\n\`\`\``
).join('\n')}

## Testing Requirements

1. **Test Framework:** Use Vitest (already configured in project)

2. **Coverage Target:** >80% code coverage
   - Lines
   - Functions
   - Branches
   - Statements

3. **Test Types:**
   - **Unit Tests:** Test individual functions and methods in isolation
   - **Integration Tests:** Test component interactions where relevant
   - **Edge Cases:** Test boundary conditions, null/undefined, empty arrays, etc.
   - **Error Cases:** Test error handling and validation logic

4. **Test Organization:**
   - Use \`describe\` blocks to group related tests
   - Use clear, descriptive test names (e.g., "should create agent with valid config")
   - Follow AAA pattern: Arrange, Act, Assert
   - Mock external dependencies (LLM clients, file system, etc.)

5. **Mocking Strategy:**
   - Mock LLM API calls for deterministic tests
   - Mock file system operations
   - Use realistic mock data that resembles production data
   - Ensure mocks are properly typed

6. **Test Quality:**
   - Each test should test ONE thing
   - Tests should be independent and not rely on execution order
   - Use meaningful assertions (not just \`expect(result).toBeTruthy()\`)
   - Include negative test cases

## Test File Naming

- Unit tests: Place in \`backend/tests/unit/\` matching src structure
  - Example: \`backend/src/implementation/agents/amelia.ts\`
  - Test: \`backend/tests/unit/implementation/agents/amelia.test.ts\`

- Integration tests: Place in \`backend/tests/integration/\`
  - Example: \`backend/tests/integration/implementation/agent-pool.test.ts\`

## Output Format

Respond with a JSON object in the following format:

\`\`\`json
{
  "files": [
    {
      "path": "backend/tests/unit/implementation/agents/example.test.ts",
      "content": "// Full test file content here"
    }
  ],
  "framework": "vitest",
  "testCount": 25,
  "coverage": {
    "lines": 85,
    "functions": 90,
    "branches": 80,
    "statements": 85,
    "uncoveredLines": ["path/file.ts:42", "path/file.ts:67"]
  },
  "results": {
    "passed": 25,
    "failed": 0,
    "skipped": 0,
    "duration": 1234,
    "failures": []
  }
}
\`\`\`

## Example Test Structure

\`\`\`typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AmeliaAgent } from '../../../src/implementation/agents/amelia.js';

describe('AmeliaAgent', () => {
  describe('constructor', () => {
    it('should create agent with valid configuration', () => {
      // Test implementation
    });

    it('should throw error with invalid configuration', () => {
      // Test implementation
    });
  });

  describe('implementStory', () => {
    it('should implement story with all acceptance criteria met', async () => {
      // Test implementation
    });

    it('should handle edge case: empty story context', async () => {
      // Test implementation
    });
  });
});
\`\`\`

## Important Notes

- Achieve >80% coverage for ALL new code
- Mock all external dependencies (LLM, filesystem, network)
- Test both happy paths and error conditions
- Use realistic test data
- Ensure tests are fast (<100ms per test when possible)
`;
}

/**
 * Generate prompt for self-review
 *
 * This prompt guides Amelia to perform a critical self-review of implemented code
 * before handing off to Alex for independent review.
 *
 * @param context Story context
 * @param code Code implementation
 * @param tests Test suite
 * @returns Self-review prompt
 */
export function ameliaSelfReviewPrompt(
  context: StoryContext,
  code: CodeImplementation,
  tests: TestSuite
): string {
  return `# Self-Review Task

You are Amelia, a Senior Software Engineer performing a critical self-review of your implementation. Be thorough and honest about potential issues.

## Story Context

**Story ID:** ${context.story.id}
**Title:** ${context.story.title}

**Acceptance Criteria:**
${context.story.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

## Implementation to Review

${code.files.map(file =>
  `\n### ${file.path}\n\`\`\`typescript\n${file.content}\n\`\`\``
).join('\n')}

## Tests Written

**Test Count:** ${tests.testCount}
**Coverage:**
- Lines: ${tests.coverage.lines}%
- Functions: ${tests.coverage.functions}%
- Branches: ${tests.coverage.branches}%
- Statements: ${tests.coverage.statements}%

**Test Results:**
- Passed: ${tests.results.passed}
- Failed: ${tests.results.failed}
- Skipped: ${tests.results.skipped}

## Review Checklist

Evaluate each item and mark as passed (true) or failed (false):

1. **Acceptance Criteria:** All acceptance criteria fully implemented
2. **Code Quality:** Code follows established patterns and conventions
3. **Type Safety:** All TypeScript types properly defined, no use of \`any\`
4. **Error Handling:** Comprehensive error handling for edge cases
5. **Documentation:** JSDoc comments for all public APIs
6. **Testing:** Test coverage >80%, tests passing, edge cases covered
7. **Architecture:** Follows architecture patterns from context
8. **Performance:** No obvious performance bottlenecks
9. **Security:** No security vulnerabilities (injection, XSS, etc.)
10. **Maintainability:** Code is readable and maintainable

## Code Smell Detection

Look for common code smells:
- **Long Functions:** Functions >50 lines
- **Duplication:** Copy-pasted code blocks
- **Poor Naming:** Unclear variable/function names
- **High Complexity:** Deeply nested conditionals
- **Tight Coupling:** Hard to test due to dependencies

## Output Format

Respond with a JSON object in the following format:

\`\`\`json
{
  "checklist": [
    {
      "item": "Acceptance Criteria",
      "passed": true,
      "notes": "All 10 acceptance criteria implemented"
    }
  ],
  "codeSmells": [
    {
      "type": "long-function",
      "location": "path/file.ts:42",
      "severity": "medium",
      "recommendation": "Consider extracting helper functions"
    }
  ],
  "acceptanceCriteriaCheck": [
    {
      "criterion": "AC1: Create Amelia agent",
      "met": true,
      "evidence": "backend/src/implementation/agents/amelia.ts:15-120"
    }
  ],
  "confidence": 0.85,
  "criticalIssues": [
    "Test coverage below 80% for module X"
  ]
}
\`\`\`

## Important Notes

- Be critical and thorough
- Don't overlook issues just because you wrote the code
- A high confidence score (>0.9) means you're very confident the implementation is production-ready
- Critical issues are blockers that MUST be fixed before merge
- This review will be followed by independent review from Alex (Code Reviewer)
`;
}
