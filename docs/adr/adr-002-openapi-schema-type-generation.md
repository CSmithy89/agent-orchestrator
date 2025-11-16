# ADR-002: OpenAPI Schema as Single Source of Truth for Type Generation

**Status:** Accepted
**Date:** 2025-11-14
**Deciders:** Alice (Architect), Charlie (Developer)
**Technical Story:** Epic 6 - Story 6-1 (API Infrastructure & Type System)

## Context and Problem Statement

The Agent Orchestrator has both backend API (TypeScript) and frontend dashboard (TypeScript/React). We need to ensure type safety across the API boundary to prevent runtime errors caused by API/UI type mismatches. The challenge is maintaining synchronized types between backend and frontend as the API evolves.

## Decision Drivers

* Eliminate API/UI type drift
* Single source of truth for API contracts
* Compile-time validation of API usage
* Reduce manual type maintenance
* IDE autocomplete for all API endpoints
* Support for runtime validation

## Considered Options

* **Option 1:** OpenAPI schema with generated TypeScript types
* **Option 2:** Manually maintained types in shared package
* **Option 3:** GraphQL schema with code generation
* **Option 4:** tRPC (TypeScript RPC)

## Decision Outcome

**Chosen option:** "OpenAPI schema with generated TypeScript types", because it provides a language-agnostic contract (OpenAPI), enables automatic Swagger documentation, supports runtime validation via JSON Schema, and generates TypeScript types for both backend and frontend from a single source.

### Positive Consequences

* Zero API/UI type drift - impossible to have mismatches
* Compile-time errors when API changes break frontend
* IDE autocomplete for all API endpoints and response types
* Swagger UI auto-generated from the same schema
* Runtime validation ensures requests match types
* Refactoring confidence - type errors surface immediately
* API clients can generate types in any language (not just TypeScript)

### Negative Consequences

* Build step required for type generation
* OpenAPI schema requires careful maintenance
* Learning curve for OpenAPI specification
* Type generation adds slight complexity to build process

## Pros and Cons of the Options

### Option 1: OpenAPI Schema with Type Generation

Define API contract in OpenAPI/Swagger format, generate TypeScript types for both backend and frontend.

**Pros:**
* Single source of truth (OpenAPI schema)
* Language-agnostic specification
* Auto-generated Swagger documentation
* Runtime validation via JSON Schema
* Type generation for multiple languages
* Industry standard specification
* Tool ecosystem (validators, mocks, code gen)

**Cons:**
* Requires build step for type generation
* OpenAPI spec has learning curve
* Need to maintain schema carefully

### Option 2: Manually Maintained Shared Types

Create a shared TypeScript package with API types, manually sync backend and frontend.

**Pros:**
* Simple setup (no code generation)
* Direct TypeScript (no intermediate format)
* Easy to understand

**Cons:**
* **High risk of type drift** (manual sync)
* No runtime validation
* No auto-generated API documentation
* Refactoring requires updating types in 3 places (backend, frontend, shared)
* Error-prone manual process
* No compile-time guarantee of correctness

### Option 3: GraphQL with Code Generation

Use GraphQL schema as source of truth, generate types from GraphQL schema.

**Pros:**
* Type-safe API layer
* Excellent developer experience
* Strong ecosystem (Apollo, Relay, etc.)
* Single query language
* Auto-generated documentation

**Cons:**
* GraphQL is overkill for our REST API needs
* Requires GraphQL server setup
* Different mental model (query language vs REST)
* More complex than our requirements
* Larger learning curve for team
* WebSocket integration more complex

### Option 4: tRPC (TypeScript RPC)

Use tRPC for end-to-end type safety with no code generation.

**Pros:**
* Zero-cost type safety
* No code generation needed
* Excellent TypeScript DX
* Automatic type inference

**Cons:**
* TypeScript-only (no language agnostic spec)
* Couples frontend and backend more tightly
* No standard API documentation format
* Less suitable for public APIs
* Requires shared monorepo structure
* No OpenAPI spec for external consumers

## Links

* [OpenAPI Specification](https://swagger.io/specification/)
* [Fastify Swagger Plugin](https://github.com/fastify/fastify-swagger)
* [openapi-typescript](https://github.com/drwpow/openapi-typescript)
* [Epic 6 Retrospective](../epics/epic-6-retrospective.md#technical-decisions-captured)
* Implementation: `backend/src/api/schemas/`, `dashboard/src/api/generated/`

## Implementation Notes

### Type Generation Workflow
1. Define API types in `backend/src/api/schemas/` using Zod
2. Fastify validates requests/responses against schemas at runtime
3. OpenAPI spec auto-generated from Zod schemas via fastify-swagger
4. TypeScript types generated from OpenAPI spec using `openapi-typescript`
5. Frontend imports types from generated file: `import type { Project } from '@/api/generated'`

### Build Integration
```json
// package.json scripts
{
  "generate:types": "openapi-typescript http://localhost:3000/api/docs/json -o src/api/generated.ts",
  "postbuild": "npm run generate:types"
}
```

### Results from Epic 6
- **Zero type mismatches** across entire epic (10 stories)
- **Caught 7 breaking changes** at compile-time during development
- **IDE autocomplete** working for all 17 API endpoints
- **Refactoring time reduced** by ~30% (type errors guide changes)

### Key Learning
From Epic 6 retrospective: "The type generation from OpenAPI was brilliant. We should do this for all future APIs. The single source of truth eliminated so many bugs." - Alice (Architect)

## Review and Update History

| Date | Reviewer | Change |
|------|----------|--------|
| 2025-11-14 | Alice, Charlie | Initial decision (Story 6-1) |
| 2025-11-16 | Bob | Documented in ADR with Epic 6 results |
