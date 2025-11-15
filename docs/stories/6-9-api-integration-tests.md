# Story 6.9: API Integration Tests

Status: ready-for-dev

## Story

As a quality-focused developer,
I want comprehensive API integration tests,
so that all endpoints are validated and regressions are prevented.

## Acceptance Criteria

1. Setup test framework (Vitest + Supertest)
2. Test all Project Management endpoints (Story 6.2):
   - GET /api/projects returns project list
   - POST /api/projects creates valid project
   - PATCH /api/projects/:id updates project
   - DELETE /api/projects/:id removes project
3. Test all Orchestrator Control endpoints (Story 6.3):
   - Start, pause, resume workflows
   - Status queries return correct data
4. Test all State Query endpoints (Story 6.3):
   - Workflow status, sprint status, stories list
   - Filtering and pagination work correctly
5. Test all Escalation endpoints (Story 6.3):
   - List escalations, get details, submit responses
6. Test WebSocket connections (Story 6.2):
   - Authentication works
   - Events emit correctly
   - Reconnection handles failures
7. Test error handling:
   - Invalid requests return proper errors
   - Authentication failures blocked
   - Rate limiting enforced
8. Test OpenAPI schema validation
9. Achieve >80% code coverage for API layer
10. Integration tests run in CI/CD pipeline

## Tasks / Subtasks

- [ ] Task 1: Setup test framework and infrastructure (AC: #1)
  - [ ] 1.1: Install Vitest + Supertest dependencies for API testing
  - [ ] 1.2: Configure Vitest for API integration tests (separate config from unit tests)
  - [ ] 1.3: Create test utilities (mock JWT tokens, test database, test server setup)
  - [ ] 1.4: Setup test fixtures for common API payloads

- [ ] Task 2: Test Project Management endpoints (AC: #2)
  - [ ] 2.1: Test GET /api/projects (list with filtering and pagination)
  - [ ] 2.2: Test POST /api/projects (create with valid/invalid data)
  - [ ] 2.3: Test GET /api/projects/:id (retrieve single project)
  - [ ] 2.4: Test PATCH /api/projects/:id (update project fields)
  - [ ] 2.5: Test DELETE /api/projects/:id (remove project)

- [ ] Task 3: Test Orchestrator Control endpoints (AC: #3)
  - [ ] 3.1: Test POST /api/orchestrators/:projectId/start (workflow start)
  - [ ] 3.2: Test POST /api/orchestrators/:projectId/pause (workflow pause)
  - [ ] 3.3: Test POST /api/orchestrators/:projectId/resume (workflow resume)
  - [ ] 3.4: Test GET /api/orchestrators/:projectId/status (status queries)

- [ ] Task 4: Test State Query endpoints (AC: #4)
  - [ ] 4.1: Test GET /api/projects/:id/workflow-status (workflow state)
  - [ ] 4.2: Test GET /api/projects/:id/sprint-status (sprint state)
  - [ ] 4.3: Test GET /api/projects/:id/stories (list stories with filters)
  - [ ] 4.4: Test GET /api/projects/:id/stories/:storyId (single story)
  - [ ] 4.5: Test GET /api/projects/:id/dependency-graph (dependency graph)
  - [ ] 4.6: Test filtering and pagination for all list endpoints

- [ ] Task 5: Test Escalation endpoints (AC: #5)
  - [ ] 5.1: Test GET /api/escalations (list all escalations)
  - [ ] 5.2: Test GET /api/escalations/:id (get escalation details)
  - [ ] 5.3: Test POST /api/escalations/:id/respond (submit response)
  - [ ] 5.4: Test escalation status transitions (pending → resolved)

- [ ] Task 6: Test WebSocket connections (AC: #6)
  - [ ] 6.1: Test WebSocket authentication (JWT token validation)
  - [ ] 6.2: Test project subscription (join/leave rooms)
  - [ ] 6.3: Test event emissions (story.status.changed, workflow.step, etc.)
  - [ ] 6.4: Test reconnection logic (disconnect/reconnect handling)
  - [ ] 6.5: Test multiple concurrent client connections

- [ ] Task 7: Test error handling and security (AC: #7)
  - [ ] 7.1: Test invalid request payloads (400 errors)
  - [ ] 7.2: Test authentication failures (401 errors)
  - [ ] 7.3: Test authorization failures (403 errors)
  - [ ] 7.4: Test resource not found (404 errors)
  - [ ] 7.5: Test rate limiting enforcement (429 errors)
  - [ ] 7.6: Test validation error responses

- [ ] Task 8: Test OpenAPI schema validation (AC: #8)
  - [ ] 8.1: Validate all endpoint responses against OpenAPI schema
  - [ ] 8.2: Test schema validation for request payloads
  - [ ] 8.3: Ensure all documented endpoints are tested

- [ ] Task 9: Achieve code coverage target (AC: #9)
  - [ ] 9.1: Run coverage report for API layer
  - [ ] 9.2: Identify untested paths and add tests
  - [ ] 9.3: Achieve >80% code coverage for API routes

- [ ] Task 10: CI/CD pipeline integration (AC: #10)
  - [ ] 10.1: Add integration test script to package.json
  - [ ] 10.2: Configure CI pipeline to run API integration tests
  - [ ] 10.3: Setup test database/fixtures for CI environment
  - [ ] 10.4: Verify tests pass in CI environment

## Dev Notes

### Learnings from Previous Story

**From Story 6-8-dependency-graph-visualization-component (Status: done)**

- **React Testing Infrastructure Available:**
  - Vitest 1.6.1 + React Testing Library configured ✅
  - Test utilities at `dashboard/src/test-utils/` ✅
  - 218/229 tests passing in Story 6-8 (95.2% coverage) ✅
  - Co-located test files pattern (*.test.tsx) ✅

- **API Client Layer Available:**
  - BaseAPI class at `dashboard/src/api/client.ts` ✅
  - Automatic JWT token injection ✅
  - Error handling with APIError class ✅
  - TypeScript types at `dashboard/src/api/types.ts` ✅

- **WebSocket Integration Available:**
  - useWebSocket hook at `dashboard/src/hooks/useWebSocket.ts` ✅
  - Exponential backoff reconnection ✅
  - Event subscription system ✅
  - Connection status tracking ✅

- **API Endpoints Implemented:**
  - Project Management API (Story 6.2): GET/POST/PATCH/DELETE /api/projects ✅
  - Orchestrator Control API (Story 6.3): start, pause, resume ✅
  - State Query API (Story 6.3): workflow-status, sprint-status, stories ✅
  - Escalation API (Story 6.3): list, get, respond ✅
  - Dependency Graph API: GET /api/projects/:id/dependency-graph ✅
  - WebSocket events: story.status.changed, workflow.step, etc. ✅

- **Testing Patterns Established:**
  - Vitest matchers and custom assertions ✅
  - Mock data fixtures in test files ✅
  - Component test isolation ✅
  - Comprehensive test coverage targets (>70%) ✅

- **Code Quality Practices:**
  - TypeScript strict mode enabled ✅
  - Clear naming conventions ✅
  - Proper error handling throughout ✅
  - Co-located test files (*.test.ts) ✅

- **Technical Debt from Previous Stories:**
  - API layer has no integration tests yet (this story addresses this)
  - WebSocket testing needs comprehensive coverage
  - Error handling needs validation across all endpoints

[Source: docs/stories/6-8-dependency-graph-visualization-component.md]

### Architecture Patterns and Constraints

**From Epic 6 - Remote Access & Monitoring:**
- REST API + WebSocket architecture for real-time updates ✅
- JWT-based authentication (token in localStorage) ✅
- Fastify server for REST API ✅
- WebSocket server for real-time events ✅
- TypeScript with strict type checking ✅

**API Testing Strategy (from Testing Strategy):**
- **Framework:** Vitest (unit + integration) + Supertest (HTTP testing)
- **Coverage Target:** >80% code coverage for API layer
- **Test Pyramid:** 60% unit, 30% integration, 10% E2E
- **Mocking Strategy:**
  - Mock LLM API calls (avoid real API costs)
  - Use in-memory or test database for data
  - Mock external services
- **Test Organization:** Co-locate tests with source files (*.test.ts)

**Integration Test Patterns:**
- Test real HTTP requests/responses (not mocked routes)
- Use Supertest to make actual API calls to test server
- Verify request validation, error handling, response formats
- Test authentication/authorization flows
- Test WebSocket connections and events

**Authentication & Security:**
- All API calls require JWT Bearer token
- Test both authenticated and unauthenticated requests
- Verify 401/403 error responses for unauthorized access
- Test rate limiting enforcement

**Error Handling Standards:**
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource doesn't exist)
- 429: Too Many Requests (rate limiting)
- 500: Internal Server Error (unexpected errors)

### Project Structure Notes

**Alignment with unified project structure:**
- API Server: `src/api/` directory (Fastify routes)
- Integration Tests: `src/api/__tests__/` or co-located `*.test.ts` files
- Test Utilities: `tests/utils/` for shared test helpers
- Fixtures: `tests/fixtures/` for test data

**New Files to Create:**
- `src/api/__tests__/projects.test.ts` - Project Management API tests
- `src/api/__tests__/orchestrators.test.ts` - Orchestrator Control API tests
- `src/api/__tests__/state-query.test.ts` - State Query API tests
- `src/api/__tests__/escalations.test.ts` - Escalation API tests
- `src/api/__tests__/websocket.test.ts` - WebSocket connection tests
- `tests/utils/api-test-helpers.ts` - Test utilities (mock JWT, test server)
- `tests/fixtures/api-fixtures.ts` - Test data fixtures

### Testing Standards

- **Framework:** Vitest + Supertest (for HTTP testing)
- **Coverage:** Minimum 80% coverage for API layer
- **Test Organization:** Co-locate tests with source files (*.test.ts)
- **Mocking:** Mock LLM APIs, use test database, mock external services
- **Test Patterns:**
  - Setup test server with Fastify app
  - Use Supertest for HTTP requests
  - Verify response status, headers, body
  - Test authentication with mock JWT tokens
  - Test error handling for all edge cases

### Performance Considerations

- **Test Speed:** Integration tests should run quickly (< 30s total)
- **Database:** Use in-memory database or test database with fixtures
- **Isolation:** Each test should be isolated (no shared state)
- **Parallel Execution:** Tests should run in parallel when possible
- **Cleanup:** Teardown test data after each test

### Security Considerations

- **Authentication:** All tests use mock JWT tokens (not real credentials)
- **Authorization:** Test both authorized and unauthorized access
- **Input Validation:** Test with invalid/malicious payloads
- **Rate Limiting:** Verify rate limiting works correctly
- **Error Messages:** Ensure error messages don't leak sensitive data

### References

- [Source: docs/epics.md#Epic-6-Story-6.9-API-Integration-Tests]
- [Source: docs/architecture.md#API-Specifications]
- [Source: docs/architecture.md#Testing-Strategy]
- [Prerequisites: Stories 6.1, 6.2, 6.3 complete]

## Dependencies

- **Requires:**
  - Story 6.1 (API Infrastructure & Type System) - ✅ Complete
  - Story 6.2 (Core API Endpoints & WebSocket) - ✅ Complete
  - Story 6.3 (Extended API Endpoints) - ✅ Complete

- **Blocks:**
  - Story 6.10 (Dashboard E2E Tests) - API tests must pass first

## Estimated Time

- **Estimated:** 4-5 hours
- **Actual:** TBD

## Notes

- Focus on comprehensive coverage of all API endpoints
- Test both success and failure cases for each endpoint
- Verify authentication and authorization flows
- Ensure WebSocket events are tested thoroughly
- Use Supertest for real HTTP testing (not mocked routes)
- Maintain test isolation (no shared state between tests)
- All tests should be fast and run in parallel
- CI/CD integration is critical for continuous validation

## Change Log

- **2025-11-15:** Story drafted by create-story workflow

## Dev Agent Record

### Context Reference

- docs/stories/6-9-api-integration-tests.context.xml

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
