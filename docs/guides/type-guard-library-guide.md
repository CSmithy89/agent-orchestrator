# Type Guard Library Guide

**Author:** Charlie (Developer)
**Date:** 2025-11-16
**Status:** Active
**Related Epic:** Epic 6 - Remote Access & Monitoring

## Overview

The Type Guard Library provides runtime type validation for all domain types in the Agent Orchestrator system using [Zod](https://zod.dev/). This library prevents runtime errors from malformed API responses, WebSocket events, and user inputs by validating data at runtime before using it.

## Table of Contents

1. [Why Runtime Type Validation?](#why-runtime-type-validation)
2. [Installation & Setup](#installation--setup)
3. [Core Concepts](#core-concepts)
4. [Usage Patterns](#usage-patterns)
5. [API Reference](#api-reference)
6. [Best Practices](#best-practices)
7. [Common Use Cases](#common-use-cases)
8. [Testing with Type Guards](#testing-with-type-guards)
9. [Performance Considerations](#performance-considerations)

## Why Runtime Type Validation?

TypeScript provides **compile-time** type safety, but doesn't protect against invalid data at **runtime**. Common sources of runtime type errors:

1. **API Responses**: Backend may return unexpected data shapes
2. **WebSocket Events**: Real-time events may be malformed
3. **User Input**: Form submissions, file uploads, etc.
4. **Third-party APIs**: External services may change their responses
5. **Database Queries**: Data may not match expected schema

### Problem Example

```typescript
// TypeScript thinks this is safe...
const response = await fetch('/api/projects/123');
const project: Project = await response.json(); // ⚠️ No runtime validation!

// But what if the API returned { error: "Not found" }?
console.log(project.id); // 💥 Runtime error: Cannot read property 'id' of undefined
```

### Solution with Type Guards

```typescript
import { parseProjectSafe } from '@/utils/type-guards';

const response = await fetch('/api/projects/123');
const data = await response.json();

const result = parseProjectSafe(data);
if (result.success) {
  console.log(result.data.id); // ✅ Safe: data is guaranteed to be a valid Project
} else {
  console.error('Invalid project data:', result.error);
}
```

## Installation & Setup

The type guard library is already integrated into both backend and frontend:

**Backend:**
```typescript
import {
  isProject,
  validateProject,
  parseProjectSafe,
  ProjectSchema
} from '@/utils/type-guards';
```

**Frontend (Dashboard):**
```typescript
import {
  isProject,
  validateProject,
  parseProjectSafe,
  ProjectSchema
} from '@/utils/type-guards';
```

## Core Concepts

### 1. Zod Schemas

Schemas define the expected structure and validation rules:

```typescript
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  status: ProjectStatusSchema,
  phase: ProjectPhaseSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
```

### 2. Type Guards (Boolean Checks)

Type guards return `true` if data matches the type, `false` otherwise:

```typescript
if (isProject(data)) {
  // TypeScript knows data is Project here
  console.log(data.id);
}
```

### 3. Validators (Throw on Error)

Validators parse data or throw a `ZodError`:

```typescript
try {
  const project = validateProject(data);
  console.log(project.id); // Safe to use
} catch (error) {
  console.error('Validation failed:', error);
}
```

### 4. Safe Parsers (Result Objects)

Safe parsers return a result object with `success` and `data` or `error`:

```typescript
const result = parseProjectSafe(data);

if (result.success) {
  console.log(result.data.id); // Safe to use
} else {
  console.error('Validation failed:', result.error);
}
```

## Usage Patterns

### Pattern 1: Type Guard (Boolean Check)

**When to use:** Checking if data matches a type before using it.

```typescript
import { isProject } from '@/utils/type-guards';

function processProject(data: unknown) {
  if (isProject(data)) {
    console.log(`Project: ${data.name} (${data.status})`);
  } else {
    console.error('Invalid project data');
  }
}
```

**Pros:**
- Simple boolean check
- Type narrowing works automatically
- No exceptions thrown

**Cons:**
- No detailed error information
- Can't distinguish between different validation failures

### Pattern 2: Validator (Throw on Error)

**When to use:** You expect data to be valid and want to fail fast if it's not.

```typescript
import { validateProject } from '@/utils/type-guards';

async function getProject(id: string): Promise<Project> {
  const response = await fetch(`/api/projects/${id}`);
  const data = await response.json();

  // Throws ZodError if invalid
  return validateProject(data);
}
```

**Pros:**
- Fail-fast approach
- Detailed error messages
- Clean async/await code

**Cons:**
- Throws exceptions (need try/catch)
- Can crash if not wrapped

### Pattern 3: Safe Parser (Result Object)

**When to use:** You want to handle validation failures gracefully without try/catch.

```typescript
import { parseProjectSafe } from '@/utils/type-guards';

async function getProjectSafely(id: string) {
  const response = await fetch(`/api/projects/${id}`);
  const data = await response.json();

  const result = parseProjectSafe(data);

  if (result.success) {
    return { success: true, project: result.data };
  } else {
    return { success: false, error: result.error };
  }
}
```

**Pros:**
- No try/catch needed
- Detailed error information
- Functional programming style

**Cons:**
- More verbose than validators
- Need to check `success` before using data

### Pattern 4: Validation Helper (Safe Wrapper)

**When to use:** You want detailed error messages but prefer exceptions over result objects.

```typescript
import { validateSafely } from '@/utils/type-guards';

try {
  const project = validateSafely(
    ProjectSchema,
    data,
    'Failed to load project'
  );
  console.log(project.id);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(error.message); // Custom error message
    console.error(error.zodError); // Original Zod error
  }
}
```

**Pros:**
- Custom error messages
- Detailed Zod errors available
- Throws `ValidationError` (not `ZodError`)

**Cons:**
- Still uses try/catch
- Extra layer of abstraction

## API Reference

### Available Type Guards

All domain types have corresponding type guards:

| Function | Type | Return |
|----------|------|--------|
| `isProject(value)` | Project | `boolean` |
| `isWorkflowStatus(value)` | WorkflowStatus | `boolean` |
| `isStoryStatus(value)` | StoryStatus | `boolean` |
| `isEscalationStatus(value)` | EscalationStatus | `boolean` |
| `isOrchestratorStatus(value)` | OrchestratorStatus | `boolean` |
| `isAPIError(value)` | APIError | `boolean` |
| `isWebSocketEvent(value)` | WebSocketEvent | `boolean` |
| `isSubscriptionMessage(value)` | SubscriptionMessage | `boolean` |
| `isErrorMessage(value)` | ErrorMessage | `boolean` |

### Available Validators

| Function | Type | Throws |
|----------|------|--------|
| `validateProject(value)` | Project | `ZodError` |
| `validateWorkflowStatus(value)` | WorkflowStatus | `ZodError` |
| `validateStoryStatus(value)` | StoryStatus | `ZodError` |
| `validateEscalationStatus(value)` | EscalationStatus | `ZodError` |
| `validateOrchestratorStatus(value)` | OrchestratorStatus | `ZodError` |
| `validateWebSocketEvent(value)` | WebSocketEvent | `ZodError` |
| `validateSubscriptionMessage(value)` | SubscriptionMessage | `ZodError` |
| `validateAPIError(value)` | APIError | `ZodError` |

### Available Safe Parsers

| Function | Type | Return |
|----------|------|--------|
| `parseProjectSafe(value)` | Project | `SafeParseResult<Project>` |
| `parseWorkflowStatusSafe(value)` | WorkflowStatus | `SafeParseResult<WorkflowStatus>` |
| `parseStoryStatusSafe(value)` | StoryStatus | `SafeParseResult<StoryStatus>` |
| `parseEscalationStatusSafe(value)` | EscalationStatus | `SafeParseResult<EscalationStatus>` |
| `parseOrchestratorStatusSafe(value)` | OrchestratorStatus | `SafeParseResult<OrchestratorStatus>` |
| `parseWebSocketEventSafe(value)` | WebSocketEvent | `SafeParseResult<WebSocketEvent>` |
| `parseSubscriptionMessageSafe(value)` | SubscriptionMessage | `SafeParseResult<SubscriptionMessage>` |
| `parseAPIErrorSafe(value)` | APIError | `SafeParseResult<APIError>` |

### Utility Functions

#### Array Validation

```typescript
import { validateArray, parseArraySafe, ProjectSchema } from '@/utils/type-guards';

// Validate array (throws on error)
const projects = validateArray(ProjectSchema, data);

// Safe parse array (returns result)
const result = parseArraySafe(ProjectSchema, data);
if (result.success) {
  console.log(`Loaded ${result.data.length} projects`);
}
```

#### Partial Validation (for PATCH requests)

```typescript
import { validatePartial, ProjectSchema } from '@/utils/type-guards';

const partialProject = validatePartial(ProjectSchema, {
  status: 'completed'
}); // Only validates provided fields
```

#### Type Assertion

```typescript
import { assertType, ProjectSchema } from '@/utils/type-guards';

function processProject(data: unknown) {
  assertType(ProjectSchema, data, 'Invalid project data');
  // data is now typed as Project
  console.log(data.id);
}
```

#### Error Formatting

```typescript
import { formatZodError } from '@/utils/type-guards';

const result = parseProjectSafe(data);
if (!result.success) {
  const errorMessage = formatZodError(result.error);
  console.error(errorMessage); // "id: Required, name: Expected string, got number"
}
```

## Best Practices

### 1. Validate at Boundaries

Validate data at **trust boundaries** (API responses, WebSocket events, user input):

```typescript
// ✅ Good: Validate at API boundary
async function fetchProjects() {
  const response = await fetch('/api/projects');
  const data = await response.json();
  return validateArray(ProjectSchema, data); // Validate once
}

// ❌ Bad: Validate internal data
function renderProject(project: Project) {
  if (isProject(project)) { // Unnecessary - already validated
    // ...
  }
}
```

### 2. Use Type Guards for Narrowing

Use type guards when working with union types or unknown data:

```typescript
function handleWebSocketMessage(message: unknown) {
  if (isWebSocketEvent(message)) {
    handleEvent(message);
  } else if (isErrorMessage(message)) {
    handleError(message);
  } else {
    console.warn('Unknown message type');
  }
}
```

### 3. Prefer Safe Parsers in Async Code

Avoid try/catch in async code by using safe parsers:

```typescript
// ✅ Good: No try/catch needed
async function loadProject(id: string) {
  const response = await fetch(`/api/projects/${id}`);
  const data = await response.json();

  const result = parseProjectSafe(data);
  if (result.success) {
    return result.data;
  } else {
    throw new Error(`Invalid project: ${formatZodError(result.error)}`);
  }
}

// ❌ Less ideal: Nested try/catch
async function loadProjectWithValidator(id: string) {
  try {
    const response = await fetch(`/api/projects/${id}`);
    const data = await response.json();

    try {
      return validateProject(data);
    } catch (validationError) {
      throw new Error('Validation failed');
    }
  } catch (networkError) {
    throw new Error('Network failed');
  }
}
```

### 4. Validate WebSocket Events with Type Discrimination

Use `validateTypedWebSocketEvent` for type-safe event handling:

```typescript
import { validateTypedWebSocketEvent, ProjectSchema } from '@/utils/type-guards';

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (isWebSocketEvent(message)) {
    switch (message.eventType) {
      case 'project.created': {
        const project = validateTypedWebSocketEvent(
          message,
          'project.created',
          ProjectSchema
        );
        handleProjectCreated(project);
        break;
      }
      // ...
    }
  }
};
```

### 5. Handle Validation Errors Gracefully

Don't crash on validation errors - show user-friendly messages:

```typescript
import { formatValidationErrorForDisplay } from '@/utils/type-guards';

const result = parseProjectSafe(formData);

if (!result.success) {
  const errors = formatValidationErrorForDisplay(result.error);
  errors.forEach(({ field, message }) => {
    showFieldError(field, message);
  });
  return;
}

saveProject(result.data);
```

### 6. Use Schemas Directly When Needed

Access schemas directly for advanced use cases:

```typescript
import { ProjectSchema } from '@/utils/type-guards';
import { z } from 'zod';

// Create extended schema
const ProjectWithMetaSchema = ProjectSchema.extend({
  metadata: z.record(z.unknown())
});

// Create subset schema
const ProjectSummarySchema = ProjectSchema.pick({
  id: true,
  name: true,
  status: true
});
```

## Common Use Cases

### Use Case 1: API Response Validation

```typescript
import { parseProjectSafe } from '@/utils/type-guards';

async function fetchProject(id: string) {
  try {
    const response = await fetch(`/api/projects/${id}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const result = parseProjectSafe(data);

    if (result.success) {
      return result.data;
    } else {
      throw new Error(`Invalid project data: ${formatZodError(result.error)}`);
    }
  } catch (error) {
    console.error('Failed to fetch project:', error);
    throw error;
  }
}
```

### Use Case 2: WebSocket Event Handling

```typescript
import { parseWebSocketEventSafe, isEventType } from '@/utils/type-guards';

function useWebSocketEvents(socket: WebSocket) {
  socket.onmessage = (event) => {
    const result = parseWebSocketEventSafe(JSON.parse(event.data));

    if (result.success) {
      handleEvent(result.data);
    } else {
      console.error('Invalid WebSocket event:', formatZodError(result.error));
    }
  };
}

function handleEvent(event: WebSocketEvent) {
  if (event.eventType === 'project.updated') {
    // Validate event data
    const project = parseProjectSafe(event.data);
    if (project.success) {
      updateProjectInCache(project.data);
    }
  }
}
```

### Use Case 3: Form Validation

```typescript
import { validateSafely, ProjectSchema } from '@/utils/type-guards';

function handleProjectForm(formData: FormData) {
  const data = {
    id: formData.get('id'),
    name: formData.get('name'),
    status: formData.get('status'),
    phase: formData.get('phase'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const project = validateSafely(
      ProjectSchema,
      data,
      'Invalid project form data'
    );

    saveProject(project);
  } catch (error) {
    if (error instanceof ValidationError) {
      showFormErrors(formatValidationErrorForDisplay(error.zodError!));
    }
  }
}
```

### Use Case 4: React Query Integration

```typescript
import { useQuery } from '@tanstack/react-query';
import { validateArray, ProjectSchema } from '@/utils/type-guards';

function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      const data = await response.json();

      // Validate response data
      return validateArray(ProjectSchema, data);
    }
  });
}
```

### Use Case 5: Mock Data Validation (Testing)

```typescript
import { validateProject } from '@/utils/type-guards';

describe('Project API', () => {
  it('should return valid project', async () => {
    const response = await fetchProject('123');

    // Ensure mock data matches schema
    expect(() => validateProject(response)).not.toThrow();
  });
});
```

## Testing with Type Guards

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import {
  isProject,
  validateProject,
  parseProjectSafe
} from '@/utils/type-guards';

describe('Type Guards', () => {
  const validProject = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Project',
    status: 'active',
    phase: 'planning',
    createdAt: '2025-11-16T00:00:00Z',
    updatedAt: '2025-11-16T00:00:00Z'
  };

  describe('isProject', () => {
    it('should return true for valid project', () => {
      expect(isProject(validProject)).toBe(true);
    });

    it('should return false for invalid project', () => {
      expect(isProject({ id: 'invalid' })).toBe(false);
      expect(isProject(null)).toBe(false);
      expect(isProject(undefined)).toBe(false);
    });
  });

  describe('validateProject', () => {
    it('should validate correct project', () => {
      expect(() => validateProject(validProject)).not.toThrow();
    });

    it('should throw on invalid project', () => {
      expect(() => validateProject({ id: 'invalid' })).toThrow();
    });
  });

  describe('parseProjectSafe', () => {
    it('should return success for valid project', () => {
      const result = parseProjectSafe(validProject);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validProject);
      }
    });

    it('should return error for invalid project', () => {
      const result = parseProjectSafe({ id: 'invalid' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect } from 'vitest';
import { validateArray, ProjectSchema } from '@/utils/type-guards';

describe('Project API', () => {
  it('should return valid projects', async () => {
    const response = await fetch('/api/projects');
    const data = await response.json();

    // Validate API response matches schema
    expect(() => validateArray(ProjectSchema, data)).not.toThrow();
  });
});
```

## Performance Considerations

### 1. Validation Cost

Zod validation has minimal overhead (~0.1ms per object):

```typescript
// Benchmark: Validating 1,000 projects
console.time('validation');
for (let i = 0; i < 1000; i++) {
  validateProject(projectData);
}
console.timeEnd('validation'); // ~100ms (0.1ms per object)
```

### 2. Avoid Over-Validation

Don't validate the same data multiple times:

```typescript
// ❌ Bad: Validating twice
const project = validateProject(data);
if (isProject(project)) { // Unnecessary
  // ...
}

// ✅ Good: Validate once
const project = validateProject(data);
// Use project directly
```

### 3. Cache Schemas

Schemas are created once and reused:

```typescript
// ✅ Good: Schema created once
export const ProjectSchema = z.object({ ... });

// ❌ Bad: Creating schema in function
function validateProject(data: unknown) {
  const schema = z.object({ ... }); // Created every time!
  return schema.parse(data);
}
```

### 4. Use Type Guards for Quick Checks

Type guards are faster than full validation:

```typescript
// Fast type check
if (isProject(data)) {
  // data is Project
}

// Slower but more detailed
const result = parseProjectSafe(data);
```

## Summary

**Key Takeaways:**

1. ✅ **Validate at boundaries**: API responses, WebSocket events, user input
2. ✅ **Use type guards** for narrowing union types
3. ✅ **Prefer safe parsers** in async code (avoid try/catch)
4. ✅ **Handle errors gracefully** with user-friendly messages
5. ✅ **Don't over-validate** - validate once at the boundary
6. ✅ **Test validation** in unit and integration tests

**Performance:**
- Minimal overhead (~0.1ms per object)
- Cache schemas (created once, reused)
- Avoid repeated validation

**Error Handling:**
- Type guards: Boolean checks (no errors)
- Validators: Throw `ZodError` (try/catch needed)
- Safe parsers: Return result object (no try/catch)
- Validation helpers: Throw `ValidationError` (custom messages)

## Related Documentation

- [Zod Documentation](https://zod.dev/)
- [ADR-002: OpenAPI Schema as Type Source](../adr/adr-002-openapi-schema-type-generation.md)
- [ADR-004: WebSocket for Real-Time Updates](../adr/adr-004-websocket-real-time-updates.md)
- Backend Implementation: `backend/src/utils/type-guards.ts`
- Frontend Implementation: `dashboard/src/utils/type-guards.ts`

---

**Last Updated:** 2025-11-16
**Version:** 1.0
**Maintainer:** Charlie (Developer)
