/**
 * Integration tests for Epic and Story Generation
 *
 * Tests end-to-end epic formation and story decomposition with mocked LLM responses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SolutioningOrchestrator } from '../../../src/solutioning/solutioning-orchestrator.js';
import * as fs from 'fs/promises';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('../../../src/llm/LLMFactory.js');
vi.mock('../../../src/solutioning/bob-llm-config.js');
vi.mock('../../../src/solutioning/bob-agent-loader.js');

describe('Epic and Story Generation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should execute complete solutioning workflow with real fixtures', async () => {
    // Mock Bob persona loader
    const mockBobPersona = await import('../../../src/solutioning/bob-agent-loader.js');
    vi.spyOn(mockBobPersona, 'loadBobPersona').mockResolvedValue({
      role: 'Scrum Master',
      name: 'Bob',
      expertise: ['Epic Formation', 'Story Decomposition'],
      decisionApproach: 'BMAD patterns',
      storyPatterns: 'BMAD story patterns'
    } as any);


    // Mock PRD and architecture file reads
    const mockPRD = `# Product Requirements Document

## Functional Requirements

### User Authentication
- User registration with email verification
- Secure login with JWT tokens
- Password reset functionality

### Content Management
- Create, read, update, delete content
- Content versioning
- Content search and filtering

### Analytics Dashboard
- Real-time user metrics
- Content performance tracking
- Export reports`;

    const mockArchitecture = `# System Architecture

## System Overview
- Frontend: React + TypeScript
- Backend: Node.js + Express
- Database: PostgreSQL

## Components
- Authentication Service
- Content Service
- Analytics Service

## Technology Stack
- TypeScript for type safety
- REST API design
- JWT for authentication`;

    // Mock file system reads
    (fs.readFile as any).mockImplementation(async (path: any) => {
      if (path.includes('PRD')) return mockPRD;
      if (path.includes('architecture')) return mockArchitecture;
      throw new Error(`Unexpected file read: ${path}`);
    });

    // Mock LLM responses
    const mockEpicsResponse = {
      epics: [
        {
          id: 'epic-1',
          title: 'User Authentication & Security',
          goal: 'Enable secure user registration, login, and account management',
          value_proposition: 'Provides secure access control and personalized user experiences',
          stories: [],
          business_value: 'Foundation for all user-specific features, required for 90% of functionality',
          estimated_duration: '1-2 sprints'
        },
        {
          id: 'epic-2',
          title: 'Content Management System',
          goal: 'Enable users to create, manage, and organize content',
          value_proposition: 'Core value proposition for user engagement',
          stories: [],
          business_value: 'Primary user value, drives user retention',
          estimated_duration: '2-3 sprints'
        },
        {
          id: 'epic-3',
          title: 'Analytics & Reporting',
          goal: 'Provide insights into user behavior and content performance',
          value_proposition: 'Data-driven decision making and optimization',
          stories: [],
          business_value: 'Business intelligence for growth',
          estimated_duration: '1-2 sprints'
        }
      ],
      confidence: 0.92,
      reasoning: 'Clear functional requirements with well-defined epic boundaries'
    };

    const mockStoriesResponse = {
      stories: [
        {
          id: '1-1',
          epic: 'epic-1',
          title: 'User Registration Flow',
          description: 'As a new user, I want to register an account with email verification, So that I can securely access the platform',
          acceptance_criteria: [
            'User can submit registration form with email and password',
            'Email validation ensures proper format',
            'Password meets security requirements (8+ chars, special char, number)',
            'Verification email sent to user email address',
            'User can click verification link to activate account',
            'Account activated and user redirected to login',
            'Error handling for duplicate emails',
            'Unit tests cover registration flow with 80%+ coverage'
          ],
          dependencies: [],
          status: 'backlog',
          technical_notes: {
            affected_files: ['backend/src/auth/registration.ts', 'backend/src/auth/email-service.ts'],
            endpoints: ['/api/auth/register', '/api/auth/verify-email'],
            data_structures: ['User', 'VerificationToken'],
            test_requirements: 'Unit tests with mocked email service, integration tests with test database'
          },
          estimated_hours: 2,
          complexity: 'medium'
        },
        {
          id: '1-2',
          epic: 'epic-1',
          title: 'User Login with JWT',
          description: 'As a registered user, I want to login with my credentials, So that I can access my account',
          acceptance_criteria: [
            'User can submit login form with email and password',
            'Credentials validated against database',
            'JWT token generated on successful login',
            'Token includes user ID and expiration (7 days)',
            'Token returned to client and stored securely',
            'Invalid credentials return 401 error',
            'Account lockout after 5 failed attempts',
            'Unit tests cover login flow with 80%+ coverage'
          ],
          dependencies: ['1-1'],
          status: 'backlog',
          technical_notes: {
            affected_files: ['backend/src/auth/login.ts', 'backend/src/auth/jwt.ts'],
            endpoints: ['/api/auth/login'],
            data_structures: ['LoginRequest', 'AuthToken'],
            test_requirements: 'Unit tests with mocked JWT service'
          },
          estimated_hours: 1.5,
          complexity: 'low'
        },
        {
          id: '1-3',
          epic: 'epic-1',
          title: 'Password Reset Workflow',
          description: 'As a user who forgot password, I want to reset my password via email, So that I can recover account access',
          acceptance_criteria: [
            'User can request password reset with email',
            'Reset token generated and sent to email',
            'Token expires after 1 hour',
            'User clicks link and sees reset form',
            'New password validated (security requirements)',
            'Password updated and user notified',
            'Old tokens invalidated after password change',
            'Unit tests cover reset flow with 80%+ coverage'
          ],
          dependencies: ['1-1'],
          status: 'backlog',
          technical_notes: {
            affected_files: ['backend/src/auth/password-reset.ts'],
            endpoints: ['/api/auth/request-reset', '/api/auth/reset-password'],
            data_structures: ['PasswordResetToken'],
            test_requirements: 'Unit tests with mocked email service'
          },
          estimated_hours: 2,
          complexity: 'medium'
        }
      ],
      confidence: 0.90,
      reasoning: 'Well-scoped epic with clear story boundaries'
    };

    // Mock LLM client with dynamic epic ID matching
    let callCount = 0;
    const mockInvoke = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        // First call: return epics
        return JSON.stringify(mockEpicsResponse);
      }
      // Subsequent calls: return stories with matching epic ID
      const epicIndex = callCount - 1;
      const epicId = `epic-${epicIndex}`;
      const stories = mockStoriesResponse.stories.map(story => ({
        ...story,
        id: `${epicIndex}-${story.id.split('-')[1]}`,
        epic: epicId
      }));
      return JSON.stringify({ ...mockStoriesResponse, stories });
    });

    const mockClient = { invoke: mockInvoke };

    const mockLLMFactory = await import('../../../src/llm/LLMFactory.js');
    vi.mocked(mockLLMFactory.LLMFactory).mockReturnValue({
      createClient: vi.fn().mockResolvedValue(mockClient),
      registerProvider: vi.fn(),
      validateModel: vi.fn().mockReturnValue(true),
      getAvailableProviders: vi.fn().mockReturnValue(['anthropic']),
      getSupportedModels: vi.fn().mockReturnValue(['claude-haiku-3-5']),
      getLogger: vi.fn()
    } as any);

    const mockBobConfig = await import('../../../src/solutioning/bob-llm-config.js');
    vi.spyOn(mockBobConfig, 'loadBobLLMConfig').mockResolvedValue({
      model: 'claude-haiku-3-5',
      provider: 'anthropic'
    });

    // Execute solutioning
    const orchestrator = new SolutioningOrchestrator();
    const result = await orchestrator.executeSolutioning(
      '/test/PRD.md',
      '/test/architecture.md'
    );

    // Validate results
    expect(result.epics).toHaveLength(3);
    expect(result.stories.length).toBeGreaterThanOrEqual(9); // 3 stories per epic
    expect(result.metrics.totalEpics).toBe(3);
    expect(result.metrics.totalStories).toBeGreaterThanOrEqual(9);
    expect(result.metrics.avgStoriesPerEpic).toBeGreaterThanOrEqual(3);

    // Validate epic structure
    for (const epic of result.epics) {
      expect(epic.id).toMatch(/^epic-\d+$/);
      expect(epic.title).toBeTruthy();
      expect(epic.goal).toBeTruthy();
      expect(epic.value_proposition).toBeTruthy();
      expect(epic.business_value).toBeTruthy();
      expect(epic.estimated_duration).toBeTruthy();
    }

    // Validate story structure
    for (const story of result.stories) {
      expect(story.id).toMatch(/^\d+-\d+$/);
      expect(story.epic).toMatch(/^epic-\d+$/);
      expect(story.title).toBeTruthy();
      expect(story.description).toContain('As a');
      expect(story.description).toContain('I want');
      expect(story.description).toContain('So that');
      expect(story.acceptance_criteria.length).toBeGreaterThanOrEqual(8);
      expect(story.acceptance_criteria.length).toBeLessThanOrEqual(12);
      expect(story.estimated_hours).toBeGreaterThan(0);
      expect(story.estimated_hours).toBeLessThanOrEqual(8);
    }

    // Validate metrics
    expect(result.metrics.epicFormationConfidence).toBeGreaterThan(0.75);
    expect(result.metrics.avgStoryDecompositionConfidence).toBeGreaterThan(0.75);
    expect(result.metrics.executionTimeMs).toBeGreaterThan(0);
    expect(result.metrics.llmTokensUsed).toBeGreaterThan(0);
  });
});
