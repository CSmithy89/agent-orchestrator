# Story 6.2: Core API Endpoints & WebSocket

**Epic:** 6 - Remote Access & Monitoring
**Status:** ready-for-dev
**Assigned to:** Dev Agent
**Story Points:** 8
**Context Reference:** docs/stories/6-2-core-api-endpoints-websocket.context.xml

## User Story

As a dashboard developer,
I want project management API endpoints and WebSocket support,
So that the UI can manage projects and receive real-time updates.

## Context

This story builds on Story 6.1's API infrastructure to add complete project management CRUD operations and real-time WebSocket communication. It enables the React dashboard to manage projects and receive live updates on project status, story progress, escalations, and workflow events.

## Acceptance Criteria

### Project Management Endpoints (AC 1-9)

1. ✅ GET /api/projects - List all projects
2. ✅ POST /api/projects - Create new project
3. ✅ GET /api/projects/:id - Get project details
4. ✅ PATCH /api/projects/:id - Update project
5. ✅ DELETE /api/projects/:id - Delete project
6. ✅ Return: project metadata, current phase, status, last update
7. ✅ Validate project config on creation
8. ✅ Handle project not found errors
9. ✅ Support pagination for project lists

### WebSocket Real-Time Updates (AC 10-16)

10. ✅ Implement WebSocket server (ws library)
11. ✅ WS endpoint: /ws/status-updates
12. ✅ Authenticate WebSocket connections
13. ✅ Emit events: project.phase.changed, story.status.changed, escalation.created, agent.started/completed, pr.created/merged, workflow.error
14. ✅ Support per-project subscriptions
15. ✅ Reconnection handling
16. ✅ Event payload includes: projectId, eventType, data, timestamp

## Technical Implementation

### Architecture

- **Project Management:** REST API endpoints using Fastify routes
- **Real-Time Updates:** WebSocket server using `ws` library
- **State Management:** Integration with StateManager from Epic 1
- **Authentication:** JWT tokens for both HTTP and WebSocket
- **Event Bus:** Publish/subscribe pattern for real-time events

### File Structure

```
backend/src/api/
├── routes/
│   ├── projects.ts        # Project CRUD endpoints
│   └── websocket.ts       # WebSocket handler
├── services/
│   ├── project.service.ts # Project business logic
│   └── event.service.ts   # Event publishing
├── middleware/
│   └── ws-auth.ts         # WebSocket authentication
└── types/
    └── events.types.ts    # Event type definitions

backend/tests/api/
├── projects.test.ts       # Project endpoint tests
└── websocket.test.ts      # WebSocket tests
```

### Dependencies

**Production:**
- `ws` ^8.14.0 - WebSocket server

**Development:**
- `ws` types for TypeScript

### API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/projects | List all projects with pagination | JWT |
| POST | /api/projects | Create new project | JWT |
| GET | /api/projects/:id | Get project details | JWT |
| PATCH | /api/projects/:id | Update project | JWT |
| DELETE | /api/projects/:id | Delete project | JWT |
| WS | /ws/status-updates | Real-time event stream | JWT |

### WebSocket Events

**Event Types:**
- `project.created` - New project created
- `project.updated` - Project metadata updated
- `project.phase.changed` - Project moved to new phase
- `story.status.changed` - Story status updated
- `escalation.created` - New escalation requires attention
- `agent.started` - Agent began task
- `agent.completed` - Agent finished task
- `pr.created` - Pull request created
- `pr.merged` - Pull request merged
- `workflow.error` - Workflow error occurred

**Event Payload Format:**
```typescript
{
  projectId: string;
  eventType: string;
  data: unknown;
  timestamp: string;
}
```

### Testing Strategy

- **Framework:** Vitest + Supertest for HTTP, ws for WebSocket testing
- **Coverage Target:** >80%
- **Test Types:**
  - Unit tests for services
  - Integration tests for API endpoints
  - WebSocket connection and event tests
- **Mocking:** Mock StateManager and file system operations

## Implementation Status

**Status:** 🔄 In Progress

## Dependencies

- **Requires:** Story 6.1 (API Infrastructure & Type System) - ✅ Complete
- **Blocks:** Stories 6.3-6.10

## Estimated Time

- **Estimated:** 4-5 hours
- **Actual:** TBD

## Notes

- WebSocket authentication must validate JWT tokens on connection
- Events should be throttled to prevent overwhelming clients
- Consider implementing event replay for reconnections
- Project pagination default: 20 items per page
- WebSocket heartbeat/ping-pong for connection health

## Next Steps

1. Implement project service layer with StateManager integration
2. Create project CRUD route handlers
3. Implement WebSocket server with authentication
4. Create event publishing service
5. Write comprehensive tests
