# Epic Technical Specification: Settings & Configuration Management

Date: 2025-11-18
Author: Mary (Business Analyst) & John (Product Manager)
Epic ID: 7
Status: Draft

---

## Overview

Epic 7 implements a comprehensive Settings & Configuration Management system, enabling users to configure agent LLM assignments, manage API keys securely, control budget thresholds, and customize project settings through an intuitive dashboard UI. This epic addresses the critical UX gap where configuration currently requires manual YAML editing and environment variable management.

The system provides a **user-friendly interface** for all configuration that exists in `.bmad/project-config.yaml` and `.env` files, with real-time validation, secure credential management, and immediate effect on orchestrator behavior. Settings changes are persisted to configuration files and automatically reloaded without requiring orchestrator restart.

This epic transforms configuration management from a developer-only CLI experience into an accessible dashboard feature, lowering the barrier for non-technical users to customize agent behavior, optimize costs, and manage credentials.

## Objectives and Scope

**In Scope:**
- Settings navigation entry in main sidebar
- Settings page with tabbed interface (General, Agents, API Keys, Budget)
- Agent Configuration UI for per-agent model/provider selection
- API Keys Management with secure masked inputs and connection testing
- Budget Configuration with visual threshold management
- Backend REST API for configuration read/write operations
- Configuration validation and real-time feedback
- Preset templates for quick agent configuration ("Premium", "Balanced", "Cost-Optimized")
- Documentation for settings usage

**Out of Scope:**
- User authentication/authorization system (assumes single-user for MVP)
- Configuration history/audit trail (post-MVP)
- Multi-environment configuration profiles (post-MVP)
- Advanced cost analytics dashboard (post-MVP)
- Batch agent configuration import/export (post-MVP)
- Real-time cost tracking integration (post-MVP)

## Business Value

**Problem Solved:**
Currently, users must:
1. Manually edit `.bmad/project-config.yaml` to change agent models
2. Edit `.env` files to update API keys
3. Understand YAML syntax and configuration schema
4. Restart orchestrator to apply changes
5. Manually validate configuration correctness

**Value Delivered:**
- **Accessibility**: Non-technical users can configure the orchestrator
- **Safety**: Real-time validation prevents configuration errors
- **Security**: API keys are masked and encrypted
- **Efficiency**: Changes apply immediately without restart
- **Discovery**: Users can explore available models and providers
- **Cost Control**: Visual budget management with threshold alerts

**Success Metrics:**
- 95% of configuration tasks completed via UI (vs YAML editing)
- Zero configuration-related orchestrator failures
- <5 seconds configuration change propagation time
- 100% API key masking in UI responses

## System Architecture Alignment

This epic extends the **Microkernel Architecture** with configuration management endpoints and UI components. Key architectural alignments:

**Core Kernel Extensions:**
- Extends `ProjectConfig` with hot-reload capability for configuration changes
- Adds `/api/config` REST endpoints for CRUD operations on project-config.yaml
- Leverages `LLMFactory` for model/provider validation
- Uses existing JWT authentication for API security

**Dashboard UI Extensions:**
- New route: `/settings` with tabbed interface
- Reuses shadcn/ui components (Forms, Selects, Inputs, Tabs, Cards)
- Follows existing dashboard patterns (cards, validation, toasts)

**Data Flow:**
- UI Form Changes → Validation → POST /api/config/{section} → Update YAML → Hot Reload → UI Confirmation
- API Keys → Encrypted Storage → Masked Retrieval → Connection Test → Success Feedback

**Security Architecture:**
- API keys encrypted at rest using environment-provided encryption key
- API responses return masked keys (e.g., `sk-ant-***abc`)
- Full keys only used for connection testing (server-side)
- Configuration changes require valid JWT token

## Detailed Design

### Services and Modules

| Service/Module | Responsibilities | Inputs | Outputs | Owner |
|----------------|------------------|--------|---------|-------|
| **ConfigurationAPI** | REST endpoints for config CRUD; Validate configuration schema; Encrypt/decrypt API keys; Trigger hot-reload | Config updates, API keys | Updated config, validation errors | Story 7.1 |
| **ConfigValidator** | Validate model/provider combinations; Check API key formats; Validate budget thresholds; Ensure required fields | Config object | Validation result, error messages | Story 7.1 |
| **APIKeyManager** | Encrypt keys with AES-256; Store encrypted keys; Mask keys for display; Test provider connections | API keys, provider type | Encrypted keys, connection status | Story 7.2 |
| **SettingsPageUI** | Render tabbed settings interface; Handle form state; Show validation feedback; Display success/error toasts | User interactions | Form submissions, UI state | Story 7.3 |
| **AgentConfigForm** | Per-agent model selection; Provider dropdowns; Reasoning text fields; Preset templates; Cost preview | Agent list, available models | Agent configuration object | Story 7.4 |
| **APIKeysForm** | Masked input fields; Test connection buttons; Save/update keys; Show connection status | Provider credentials | API key updates, test results | Story 7.5 |
| **BudgetConfigForm** | Budget limit inputs (daily/weekly/monthly); Threshold sliders with visual indicators; Alert configuration; Fallback model selection | Budget settings | Budget configuration object | Story 7.6 |
| **NavigationIntegration** | Add Settings link to sidebar; Settings icon and routing; Active state highlighting | Navigation state | Updated nav component | Story 7.7 |

### Data Models and Contracts

**Backend API Types** (`src/api/types/config.types.ts`):

```typescript
interface ConfigurationUpdateRequest {
  section: 'project' | 'agent_assignments' | 'api_keys' | 'cost_management';
  data: Record<string, any>;
}

interface ConfigurationResponse {
  success: boolean;
  config: ProjectConfigSchema;
  errors?: ValidationError[];
}

interface AgentConfigUpdate {
  agentName: string;
  model: string;
  provider: LLMProvider;
  reasoning: string;
  api_key?: string; // Optional override
  base_url?: string; // For API wrappers like z.ai
}

interface APIKeyUpdate {
  provider: LLMProvider;
  api_key: string;
}

interface APIKeyTestResult {
  provider: LLMProvider;
  success: boolean;
  message: string;
  latency?: number; // Connection test latency in ms
}

interface BudgetConfig {
  max_monthly_budget: number;
  budget: {
    daily?: number;
    weekly?: number;
    monthly: number;
    alerts: BudgetAlertConfig[];
  };
  fallback_model: string;
}

interface ValidationError {
  field: string;
  message: string;
  expected?: string;
}
```

**Frontend State Types** (`dashboard/src/types/settings.types.ts`):

```typescript
interface SettingsFormState {
  activeTab: 'general' | 'agents' | 'api-keys' | 'budget';
  isDirty: boolean; // Unsaved changes warning
  isSaving: boolean;
  validationErrors: Map<string, string>;
}

interface AgentConfigFormState {
  agents: Record<string, AgentLLMConfig>;
  selectedPreset?: 'premium' | 'balanced' | 'cost-optimized';
  costPreview: {
    estimated_monthly_cost: number;
    cost_by_agent: Record<string, number>;
  };
}

interface APIKeysFormState {
  keys: Record<LLMProvider, string>; // Masked on load
  testResults: Map<LLMProvider, APIKeyTestResult>;
  isTesting: Map<LLMProvider, boolean>;
}
```

### API Endpoints

**Configuration Management**:

```typescript
// Get current configuration
GET /api/config
Response: ProjectConfigSchema

// Update project metadata
PUT /api/config/project
Body: ProjectMetadata
Response: ConfigurationResponse

// Update agent assignments (bulk or single)
PUT /api/config/agent-assignments
Body: Record<string, AgentLLMConfig>
Response: ConfigurationResponse

// Update single agent configuration
PUT /api/config/agent-assignments/:agentName
Body: AgentConfigUpdate
Response: ConfigurationResponse

// Update API keys (encrypted storage)
PUT /api/config/api-keys
Body: APIKeyUpdate[]
Response: ConfigurationResponse

// Test API key connection
POST /api/config/api-keys/test
Body: { provider: LLMProvider, api_key: string }
Response: APIKeyTestResult

// Update budget configuration
PUT /api/config/cost-management
Body: BudgetConfig
Response: ConfigurationResponse

// Validate configuration without saving
POST /api/config/validate
Body: Partial<ProjectConfigSchema>
Response: { valid: boolean, errors: ValidationError[] }

// Get available models by provider
GET /api/config/models/:provider
Response: { models: string[], descriptions: Record<string, string> }
```

### UI Components Structure

```
dashboard/src/pages/SettingsPage.tsx
├── SettingsTabs (shadcn Tabs)
│   ├── GeneralTab
│   │   ├── Project Name Input
│   │   ├── Description Textarea
│   │   └── Repository Input
│   │
│   ├── AgentConfigTab ⭐ NEW
│   │   ├── PresetSelector (Premium/Balanced/Cost-Optimized)
│   │   ├── AgentConfigList
│   │   │   └── AgentConfigCard (per agent)
│   │   │       ├── Agent Name & Icon
│   │   │       ├── Model Select Dropdown
│   │   │       ├── Provider Select
│   │   │       ├── Reasoning Textarea
│   │   │       └── Cost Preview Badge
│   │   └── CostSummaryCard
│   │       ├── Total Estimated Monthly Cost
│   │       └── Cost Breakdown by Agent
│   │
│   ├── APIKeysTab ⭐ NEW
│   │   ├── APIKeyInput (per provider)
│   │   │   ├── Provider Icon & Name
│   │   │   ├── Masked Input Field
│   │   │   ├── Test Connection Button
│   │   │   └── Connection Status Indicator
│   │   └── SecurityNotice Card
│   │
│   └── BudgetTab ⭐ NEW
│       ├── BudgetLimitsCard
│       │   ├── Daily Limit Input
│       │   ├── Weekly Limit Input
│       │   └── Monthly Limit Input
│       ├── AlertThresholdsCard
│       │   └── ThresholdSlider (75%, 90%, 100%)
│       │       ├── Threshold Percentage
│       │       ├── Action Select (warn/downgrade/block)
│       │       └── Visual Indicator
│       └── FallbackModelSelect
└── SaveChangesBar (fixed bottom)
    ├── Unsaved Changes Warning (if dirty)
    ├── Cancel Button
    └── Save Changes Button
```

### shadcn Components Used

The implementation will leverage existing shadcn/ui components:

- `Tabs` - Tab navigation for settings sections
- `Card` / `CardHeader` / `CardContent` - Content containers
- `Form` / `FormField` / `FormLabel` / `FormMessage` - Form handling with validation
- `Input` - Text inputs for keys, budgets
- `Select` / `SelectTrigger` / `SelectContent` - Dropdowns for models/providers
- `Textarea` - Multi-line inputs for descriptions/reasoning
- `Button` - Actions (Save, Test Connection, Cancel)
- `Badge` - Status indicators, cost preview
- `Slider` - Budget threshold configuration
- `Toast` - Success/error notifications
- `Alert` - Security notices, warnings
- `Skeleton` - Loading states

### Configuration Presets

**Preset Templates** for quick agent configuration:

```typescript
const PRESETS = {
  premium: {
    name: 'Premium Quality',
    description: 'All agents use top-tier models for maximum quality',
    config: {
      mary: { model: 'claude-sonnet-4-5', provider: 'anthropic' },
      john: { model: 'claude-sonnet-4-5', provider: 'anthropic' },
      winston: { model: 'claude-sonnet-4-5', provider: 'anthropic' },
      murat: { model: 'claude-sonnet-4-5', provider: 'anthropic' },
      amelia: { model: 'claude-sonnet-4-5', provider: 'anthropic' },
      bob: { model: 'claude-sonnet-4-5', provider: 'anthropic' },
      alex: { model: 'claude-sonnet-4-5', provider: 'anthropic' },
    },
    estimated_cost: 800, // USD/month
  },

  balanced: {
    name: 'Balanced',
    description: 'Mix of premium and cost-effective models',
    config: {
      mary: { model: 'claude-sonnet-4-5', provider: 'anthropic' },
      john: { model: 'claude-sonnet-4-5', provider: 'anthropic' },
      winston: { model: 'claude-sonnet-4-5', provider: 'anthropic' },
      murat: { model: 'claude-haiku-3-5', provider: 'anthropic' },
      amelia: { model: 'gpt-4o', provider: 'openai' },
      bob: { model: 'glm-4-plus', provider: 'zhipu' },
      alex: { model: 'claude-sonnet-4-5', provider: 'anthropic' },
    },
    estimated_cost: 450, // USD/month
  },

  cost_optimized: {
    name: 'Cost Optimized',
    description: 'Efficient models for budget-conscious development',
    config: {
      mary: { model: 'claude-haiku-3-5', provider: 'anthropic' },
      john: { model: 'claude-haiku-3-5', provider: 'anthropic' },
      winston: { model: 'gpt-4o-mini', provider: 'openai' },
      murat: { model: 'claude-haiku-3-5', provider: 'anthropic' },
      amelia: { model: 'gpt-4o-mini', provider: 'openai' },
      bob: { model: 'glm-4-flash', provider: 'zhipu' },
      alex: { model: 'claude-haiku-3-5', provider: 'anthropic' },
    },
    estimated_cost: 200, // USD/month
  },
};
```

## User Stories

### Story 7.1: Backend Configuration API

**As a** dashboard user
**I want** a REST API for configuration management
**So that** I can read and update settings programmatically with validation

**Acceptance Criteria:**
- [ ] GET /api/config returns current ProjectConfigSchema
- [ ] PUT /api/config/project updates project metadata with validation
- [ ] PUT /api/config/agent-assignments updates agent configs (bulk or single)
- [ ] PUT /api/config/api-keys securely stores encrypted API keys
- [ ] PUT /api/config/cost-management updates budget configuration
- [ ] POST /api/config/validate validates config without saving
- [ ] POST /api/config/api-keys/test tests provider connection
- [ ] All endpoints require JWT authentication
- [ ] Configuration changes trigger hot-reload without restart
- [ ] Validation errors return descriptive messages with field names
- [ ] API returns 400 for validation errors, 500 for system errors
- [ ] Unit tests cover all endpoints and error cases
- [ ] Integration tests verify config file persistence

**Estimated:** 3-5 days

---

### Story 7.2: API Keys Secure Management

**As a** orchestrator administrator
**I want** to securely store and manage API keys
**So that** credentials are encrypted and never exposed in logs or UI

**Acceptance Criteria:**
- [ ] API keys encrypted with AES-256 before storage
- [ ] Encryption key read from ENCRYPTION_KEY environment variable
- [ ] GET endpoints return masked keys (e.g., `sk-ant-***abc`, showing first 7 and last 3 chars)
- [ ] Full keys never returned in API responses (except connection test)
- [ ] Connection test validates key against provider API
- [ ] Test returns success/failure with latency measurement
- [ ] Keys stored in `.env` file or secure key vault
- [ ] Unit tests verify encryption/decryption round-trip
- [ ] Integration tests verify masked key display
- [ ] Security tests ensure no key leakage in logs

**Estimated:** 2-3 days

---

### Story 7.3: Settings Page Foundation

**As a** dashboard user
**I want** a settings page with tabbed navigation
**So that** I can access different configuration sections easily

**Acceptance Criteria:**
- [ ] Settings route registered at `/settings`
- [ ] Settings link added to sidebar navigation with gear icon
- [ ] Active state highlighting when on settings page
- [ ] Tabbed interface with 4 tabs: General, Agents, API Keys, Budget
- [ ] Tab state persisted in URL query parameter (e.g., `?tab=agents`)
- [ ] Responsive layout for mobile and desktop
- [ ] Loading states while fetching configuration
- [ ] Error states if configuration fails to load
- [ ] Unsaved changes warning when leaving page
- [ ] Unit tests for Settings page component
- [ ] E2E test for navigation to settings

**Estimated:** 2-3 days

---

### Story 7.4: Agent Configuration Form

**As a** orchestrator administrator
**I want** to configure which LLM each agent uses
**So that** I can optimize for cost and quality per agent role

**Acceptance Criteria:**
- [ ] Agent list displays all 7 agents (mary, john, winston, murat, amelia, bob, alex)
- [ ] Each agent card shows: name, icon, current model, provider, reasoning
- [ ] Model dropdown populated with provider-specific models
- [ ] Provider dropdown shows: Anthropic, OpenAI, Zhipu, Google
- [ ] Changing provider updates available models
- [ ] Reasoning text field for documenting assignment choice
- [ ] Real-time validation for model/provider compatibility
- [ ] Cost preview badge shows estimated cost per agent
- [ ] Total monthly cost summary displayed
- [ ] Preset selector for Premium/Balanced/Cost-Optimized
- [ ] Applying preset updates all agent configs
- [ ] Save button persists changes to config file
- [ ] Success toast on successful save
- [ ] Error toast with validation messages on failure
- [ ] Unit tests for AgentConfigForm component
- [ ] Integration test for preset application
- [ ] E2E test for full agent config update flow

**Estimated:** 3-4 days

---

### Story 7.5: API Keys Management UI

**As a** orchestrator administrator
**I want** to manage API keys through the dashboard
**So that** I don't need to manually edit .env files

**Acceptance Criteria:**
- [ ] Input fields for 4 providers: Anthropic, OpenAI, Zhipu, Google
- [ ] Each field shows provider icon and name
- [ ] Keys displayed as masked (`sk-ant-***abc`)
- [ ] "Show" toggle to reveal full key temporarily
- [ ] "Test Connection" button per provider
- [ ] Connection test shows loading state while testing
- [ ] Success indicator (green checkmark) on successful test
- [ ] Error message displayed on failed test
- [ ] Test latency displayed on success (e.g., "Connected in 342ms")
- [ ] Save button stores encrypted keys
- [ ] Security notice card explaining key encryption
- [ ] Validation prevents saving invalid key formats
- [ ] Success toast on save
- [ ] Unit tests for APIKeysForm component
- [ ] Integration test for connection testing
- [ ] E2E test for complete key update flow

**Estimated:** 2-3 days

---

### Story 7.6: Budget Configuration UI

**As a** orchestrator administrator
**I want** to configure budget limits and alerts
**So that** I can control costs and get notified at thresholds

**Acceptance Criteria:**
- [ ] Input fields for daily, weekly, monthly budget limits (USD)
- [ ] Alert threshold sliders for 75%, 90%, 100% of budget
- [ ] Each threshold shows action dropdown: warn, downgrade, block
- [ ] Visual indicators (color-coded) for threshold levels
- [ ] Fallback model select dropdown
- [ ] Current budget usage displayed (if tracking implemented)
- [ ] Estimated monthly cost based on agent config
- [ ] Warning if agent config exceeds budget
- [ ] Save button persists budget configuration
- [ ] Real-time validation (e.g., daily ≤ weekly ≤ monthly)
- [ ] Success toast on save
- [ ] Unit tests for BudgetConfigForm component
- [ ] Integration test for budget validation
- [ ] E2E test for budget configuration flow

**Estimated:** 2-3 days

---

### Story 7.7: Navigation Integration & Polish

**As a** dashboard user
**I want** to easily access Settings from any page
**So that** I can quickly adjust configuration

**Acceptance Criteria:**
- [ ] Settings link added to main sidebar navigation
- [ ] Gear icon used for Settings menu item
- [ ] Link positioned below other nav items (Dashboard, Projects, Escalations, Stories)
- [ ] Active state highlighting when on `/settings` route
- [ ] Settings accessible via keyboard shortcut (Cmd/Ctrl + ,)
- [ ] Breadcrumb navigation on Settings page
- [ ] Help text/tooltips for complex settings
- [ ] Keyboard navigation support (Tab, Enter)
- [ ] Accessibility: ARIA labels, screen reader support
- [ ] Mobile-friendly settings layout
- [ ] Unit tests for navigation component changes
- [ ] E2E test for keyboard navigation
- [ ] Documentation: Settings user guide

**Estimated:** 1-2 days

---

## Dependencies and Integration Points

**Depends On:**
- Epic 6: Dashboard UI foundation (shadcn components, routing)
- Epic 1: ProjectConfig system and configuration schema
- Existing: `.bmad/project-config.yaml` structure
- Existing: JWT authentication system

**Integrates With:**
- `backend/src/config/ProjectConfig.ts` - Configuration loader with hot-reload
- `backend/src/llm/LLMFactory.ts` - Model/provider validation
- `dashboard/src/components/ui/*` - shadcn component library
- `dashboard/src/api/client.ts` - API client for config endpoints

**Enables Future Work:**
- Configuration history/audit trail (Epic 8+)
- Multi-user configuration permissions (Epic 8+)
- Real-time cost tracking dashboard (Epic 8+)
- Advanced preset management (Epic 8+)

## Testing Strategy

**Unit Tests:**
- Configuration API endpoint logic
- Validation functions for all config sections
- API key encryption/decryption
- React component rendering and state management
- Preset application logic
- Form validation logic

**Integration Tests:**
- Full configuration update flow (API → File → Reload)
- API key connection testing with mock providers
- Configuration hot-reload verification
- Multi-tab navigation state
- Unsaved changes warning

**E2E Tests:**
- Complete user journey: Navigate to Settings → Update agents → Save → Verify
- API key test connection flow
- Budget configuration with validation
- Preset application and save
- Error handling for invalid configurations

**Security Tests:**
- API key masking in all responses
- Encryption key handling
- No sensitive data in client-side logs
- JWT token validation on config endpoints

## Success Criteria

**Functional:**
- ✅ Users can configure all settings via UI (no YAML editing required)
- ✅ Configuration changes apply immediately without restart
- ✅ API keys are securely encrypted and masked
- ✅ Real-time validation prevents invalid configurations
- ✅ Preset templates enable quick configuration

**Non-Functional:**
- ✅ <500ms API response time for config reads
- ✅ <2s for configuration save and reload
- ✅ 100% API key masking in UI
- ✅ Mobile-responsive settings interface
- ✅ Accessible (WCAG 2.1 AA compliance)

**User Experience:**
- ✅ Intuitive tab-based navigation
- ✅ Clear validation error messages
- ✅ Visual cost preview for agent configs
- ✅ Successful connection test feedback
- ✅ Unsaved changes protection

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Configuration hot-reload breaks running workflows | High | Medium | Implement config versioning; workflows use config snapshot |
| API key encryption key loss | Critical | Low | Document key backup procedure; support key rotation |
| Invalid config crashes orchestrator | High | Low | Comprehensive validation before save; rollback on error |
| Performance degradation on config save | Medium | Low | Optimize config file writes; debounce rapid saves |
| Security: API keys exposed in browser devtools | High | Medium | Never send full keys to frontend; use masked values |

## Documentation

**User Documentation:**
- Settings User Guide (how to configure agents, keys, budget)
- Configuration Best Practices
- Troubleshooting Guide (connection test failures, validation errors)

**Developer Documentation:**
- Configuration API Reference
- API Key Encryption Implementation
- Hot-Reload Architecture
- Adding New Configuration Sections

**Security Documentation:**
- API Key Security Model
- Encryption Key Management
- Secure Configuration Guidelines

---

## Appendix

### Configuration Schema Reference

See `backend/src/types/ProjectConfig.ts` for complete schema definition.

### Model Pricing Reference

Estimated pricing for cost preview calculations (as of 2025-11):

**Anthropic:**
- claude-sonnet-4-5: $3/$15 per 1M tokens (input/output)
- claude-haiku-3-5: $0.25/$1.25 per 1M tokens

**OpenAI:**
- gpt-4o: $2.50/$10 per 1M tokens
- gpt-4o-mini: $0.15/$0.60 per 1M tokens

**Zhipu:**
- glm-4-plus: $0.50/$0.50 per 1M tokens
- glm-4-flash: $0.10/$0.10 per 1M tokens

**Google:**
- gemini-2.0-flash: $0.075/$0.30 per 1M tokens

### shadcn Component Installation

Required shadcn components (if not already installed):

```bash
npx shadcn@latest add tabs card form input select textarea button badge slider alert toast skeleton
```

---

**Epic Status:** Draft - Ready for Review
**Total Estimated Effort:** 12-17 days
**Priority:** High - Critical UX gap
**Target Milestone:** v1.1.0
