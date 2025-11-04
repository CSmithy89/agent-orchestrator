# Technology Stack

## Primary Languages

- **TypeScript 5+** - Main development language (type-safe, modern)
- **Node.js 20 LTS** - Runtime environment
- **React 18+** - Frontend framework (PWA dashboard)

## Backend Stack

### Core Framework
- **Fastify 4+** - Web framework (faster than Express, TypeScript-friendly)
- **ws** - WebSocket library for real-time updates
- **simple-git** - Git operations (worktree management)
- **@octokit/rest** - GitHub API integration

### LLM Integration
- **@anthropic-ai/sdk** - Claude models (Mary, Winston, Murat, Bob)
- **openai** - GPT/Codex models (Amelia - superior code generation)
- **Custom adapters** - Support for multiple LLM providers

### Data & Parsing
- **js-yaml** - YAML parser (workflow configs)
- **marked** - Markdown parser (documentation processing)
- **fast-xml-parser** - XML parser (BMAD task files)
- **zod** - TypeScript-first schema validation

### Utilities
- **pino** - Fast structured logging (JSON output)
- **undici** - HTTP client (Node.js recommended)

## Frontend Stack

### UI Framework
- **Vite 5+** - Build tool (fast dev server, optimized builds)
- **Tailwind CSS 3+** - Utility-first CSS framework
- **shadcn/ui + Radix UI** - Accessible component library
- **Recharts** - Data visualization (charts, graphs)
- **Lucide React** - Icon library (clean, consistent)

### State Management
- **Zustand** - Client state management (simple, no boilerplate)
- **TanStack Query** - Server state management (cache, refetch)
- **React Router 6+** - Routing (type-safe, data loading)
- **React Hook Form** - Form handling (performant, validation)

## Testing Stack

- **Vitest** - Unit testing (fast, TypeScript-friendly)
- **Playwright** - E2E testing (browser automation)
- **MSW** - API mocking (Mock Service Worker)

## DevOps & Deployment

- **Docker** - Containerization
- **Docker Compose** - Local development environment
- **GitHub Actions** - CI/CD pipeline
- **PM2** - Process manager (production deployment)
- **NGINX** - Reverse proxy, static file serving

## Storage & Persistence

- **File System** - Primary storage (YAML/Markdown files)
- **Git** - State versioning and history
- **SQLite** (optional future) - Learning patterns, escalation history

## Development Tools

- **tsx** - TypeScript execution for Node.js
- **autoprefixer + postcss** - CSS processing
- **date-fns** - Date/time utilities (lightweight, tree-shakeable)

## External Services

- **Anthropic API** - Claude models (pricing: ~$3-15/M tokens)
- **OpenAI API** - GPT-4 models (pricing: ~$10-30/M tokens)
- **GitHub** - Repository hosting, PR automation, CI/CD
- **Secrets Management** - Environment variables (.env) → Future: HashiCorp Vault

## Architecture Patterns

- **Microkernel + Event-Driven** - Core engine + plugin workflows
- **File-based state** - All state in files (git-friendly, human-readable)
- **Agent pool per project** - No resource contention between projects
- **Fresh agent per stage** - Clean context, no bloat
