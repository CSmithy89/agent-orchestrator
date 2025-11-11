/**
 * Test Fixtures
 *
 * Provides common test data, configurations, and sample content
 * for use across test suites.
 */

import type { LLMConfig } from '../../src/types/llm.types.js';

// ==========================================
// LLM Configurations
// ==========================================

/**
 * Standard Claude Code LLM configuration for testing
 * Note: temperature and max_tokens should be passed via InvokeOptions/StreamOptions
 */
export const sampleLLMConfig: LLMConfig = {
  provider: 'claude-code',
  model: 'claude-sonnet-4-5'
};

/**
 * High-creativity LLM configuration
 */
export const creativeLLMConfig: LLMConfig = {
  provider: 'claude-code',
  model: 'claude-sonnet-4-5'
};

/**
 * Deterministic LLM configuration (for testing)
 */
export const deterministicLLMConfig: LLMConfig = {
  provider: 'claude-code',
  model: 'claude-sonnet-4-5'
};

/**
 * Anthropic provider configuration (fallback)
 */
export const anthropicLLMConfig: LLMConfig = {
  provider: 'anthropic',
  model: 'claude-sonnet-4-5'
};

// ==========================================
// User Prompts
// ==========================================

/**
 * Simple user prompt for basic testing
 */
export const sampleUserPrompt = 'Build a user authentication system with email/password and OAuth support';

/**
 * Complex user prompt for comprehensive testing
 */
export const complexUserPrompt = `
Build a comprehensive e-commerce platform with the following features:

1. User Management:
   - Email/password authentication
   - OAuth (Google, GitHub)
   - User profiles with preferences
   - Role-based access control (admin, seller, buyer)

2. Product Catalog:
   - Product listings with images
   - Categories and tags
   - Search and filtering
   - Inventory management

3. Shopping Cart & Checkout:
   - Add to cart functionality
   - Checkout flow with address
   - Multiple payment methods (Stripe, PayPal)
   - Order confirmation emails

4. Admin Dashboard:
   - Sales analytics
   - Product management
   - User management
   - Order fulfillment

Technical Requirements:
- React frontend with TypeScript
- Node.js/Express backend
- PostgreSQL database
- RESTful API design
- Real-time updates with WebSockets
`.trim();

/**
 * Vague user prompt (requires clarification)
 */
export const vagueUserPrompt = 'Make a website';

/**
 * Technical user prompt (already detailed)
 */
export const technicalUserPrompt = `
Implement a distributed task queue system with:
- Redis for message broker
- Bull queue for job processing
- Rate limiting and retry logic
- Dead letter queue for failed jobs
- Monitoring dashboard with metrics
`.trim();

// ==========================================
// PRD Content
// ==========================================

/**
 * Sample PRD content for workflow testing
 */
export const samplePRDContent = `# Product Requirements Document

## Project Overview

**Project Name**: User Authentication System
**Date**: 2025-11-10
**Version**: 1.0
**Status**: Draft

## Executive Summary

Build a secure user authentication system supporting multiple authentication methods including email/password and OAuth providers (Google, GitHub).

## Business Requirements

### BR1: User Registration
Users must be able to register with email and password.

**Acceptance Criteria**:
- Email validation
- Password strength requirements (min 8 chars, uppercase, lowercase, number)
- Email confirmation required
- Duplicate email prevention

### BR2: OAuth Authentication
Users must be able to sign in with OAuth providers.

**Acceptance Criteria**:
- Support Google OAuth
- Support GitHub OAuth
- Link OAuth accounts to existing email accounts
- Handle OAuth errors gracefully

### BR3: Session Management
System must maintain secure user sessions.

**Acceptance Criteria**:
- JWT token-based authentication
- Token refresh mechanism
- Session expiration (24 hours)
- Logout functionality

## Technical Requirements

### TR1: Backend API
- REST API with Express.js
- PostgreSQL database
- JWT authentication
- OAuth integration

### TR2: Frontend
- React with TypeScript
- Login/Register forms
- OAuth buttons
- Session management

### TR3: Security
- Password hashing (bcrypt)
- HTTPS only
- Rate limiting on auth endpoints
- CSRF protection

## Success Criteria

- 99.9% authentication success rate
- < 200ms authentication response time
- Zero security vulnerabilities
- Support 1000 concurrent users

## Timeline

- Week 1-2: Backend API development
- Week 3: OAuth integration
- Week 4: Frontend development
- Week 5: Testing and deployment

## Risks & Mitigation

**Risk**: OAuth provider downtime
**Mitigation**: Fallback to email/password authentication

**Risk**: Password breach
**Mitigation**: Implement 2FA in future phase

## Out of Scope

- Two-factor authentication (Phase 2)
- Social login beyond Google/GitHub
- Enterprise SSO integration
`.trim();

/**
 * Sample PRD with quality issues (for validation testing)
 */
export const invalidPRDContent = `# PRD

## Overview
Build something.

## Requirements
- Feature 1
- Feature 2

## Timeline
Soon.
`.trim();

// ==========================================
// Requirements Data
// ==========================================

/**
 * Sample requirements analysis output
 */
export const sampleRequirements = {
  functionalRequirements: [
    {
      id: 'FR1',
      title: 'User Registration',
      description: 'Users can register with email and password',
      priority: 'high',
      acceptanceCriteria: [
        'Email validation',
        'Password strength requirements',
        'Email confirmation'
      ]
    },
    {
      id: 'FR2',
      title: 'OAuth Authentication',
      description: 'Users can sign in with Google or GitHub',
      priority: 'high',
      acceptanceCriteria: [
        'Google OAuth integration',
        'GitHub OAuth integration',
        'Account linking'
      ]
    }
  ],
  nonFunctionalRequirements: [
    {
      id: 'NFR1',
      title: 'Performance',
      description: 'Authentication response time < 200ms',
      priority: 'medium'
    },
    {
      id: 'NFR2',
      title: 'Security',
      description: 'All authentication data encrypted',
      priority: 'high'
    }
  ],
  constraints: [
    'Must use PostgreSQL database',
    'Must support 1000 concurrent users',
    'Must comply with GDPR'
  ],
  assumptions: [
    'Users have email addresses',
    'Users have Google or GitHub accounts',
    'HTTPS available in production'
  ]
};

// ==========================================
// Workflow Data
// ==========================================

/**
 * Sample workflow YAML content
 */
export const sampleWorkflowYAML = `
name: prd-generation
version: 1.0

agents:
  - mary  # Business Analyst
  - john  # Product Manager

steps:
  - name: analyze-requirements
    agent: mary
    input: user_prompt
    output: requirements

  - name: generate-prd
    agent: john
    input: requirements
    output: prd

  - name: validate-quality
    agent: john
    input: prd
    output: validation_result

quality_gates:
  - name: completeness
    threshold: 0.9
  - name: clarity
    threshold: 0.85
`.trim();

/**
 * Sample workflow state
 */
export const sampleWorkflowState = {
  workflowId: 'prd-gen-001',
  status: 'in-progress',
  currentStep: 'generate-prd',
  startedAt: '2025-11-10T10:00:00Z',
  steps: {
    'analyze-requirements': {
      status: 'completed',
      output: sampleRequirements,
      completedAt: '2025-11-10T10:15:00Z'
    },
    'generate-prd': {
      status: 'in-progress',
      startedAt: '2025-11-10T10:15:00Z'
    }
  }
};

// ==========================================
// Decision Engine Data
// ==========================================

/**
 * Sample decision context
 */
export const sampleDecisionContext = {
  task: 'Should we proceed with PRD generation?',
  confidence: 0.85,
  data: {
    requirementsComplete: true,
    userApprovalNeeded: false,
    qualityScore: 0.92
  }
};

/**
 * Sample decision result
 */
export const sampleDecisionResult = {
  decision: 'proceed',
  confidence: 0.95,
  reasoning: 'Requirements are complete and quality score exceeds threshold',
  alternatives: [
    { decision: 'clarify', confidence: 0.05, reason: 'Some requirements could be more specific' }
  ]
};

// ==========================================
// Escalation Data
// ==========================================

/**
 * Sample escalation item
 */
export const sampleEscalation = {
  id: 'esc-001',
  message: 'User requirements are ambiguous and need clarification',
  context: {
    userPrompt: vagueUserPrompt,
    reason: 'Low confidence in requirements analysis (0.45)',
    suggestions: [
      'Ask about target audience',
      'Clarify website purpose',
      'Specify technical requirements'
    ]
  },
  timestamp: '2025-11-10T10:30:00Z',
  status: 'pending'
};

// ==========================================
// File System Paths (for testing)
// ==========================================

/**
 * Sample file paths for testing
 */
export const sampleFilePaths = {
  prdOutput: './output/prd-user-auth-2025-11-10.md',
  requirements: './output/requirements-user-auth.json',
  workflowState: './state/workflow-prd-gen-001.json',
  escalations: './escalations/2025-11-10'
};

// ==========================================
// Error Messages
// ==========================================

/**
 * Common error messages for testing
 */
export const errorMessages = {
  authenticationFailed: 'Anthropic authentication failed: 401',
  apiKeyMissing: 'No API keys available for testing. Set CLAUDE_CODE_OAUTH_TOKEN or ANTHROPIC_API_KEY.',
  rateLimitExceeded: 'Rate limit exceeded: 429',
  invalidConfig: 'Invalid LLM configuration: provider must be specified',
  workflowNotFound: 'Workflow not found',
  agentNotAvailable: 'Agent not available in pool'
};

// ==========================================
// Git Test Data
// ==========================================

/**
 * Sample Git commit message
 */
export const sampleCommitMessage = `feat: Add user authentication system

Implements email/password and OAuth authentication.

Refs: #123`;

/**
 * Sample Git user configuration
 */
export const sampleGitUser = {
  name: 'Test User',
  email: 'test@example.com'
};
