/**
 * PRDValidator Tests
 * Story 2.7: PRD Quality Validation
 *
 * ATDD Approach: These tests are written BEFORE implementation
 * Expected: All tests should FAIL initially (Red phase)
 * After implementation: All tests should PASS (Green phase)
 *
 * Test Coverage Target: >90%
 * Run: npm run test -- PRDValidator.test.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PRDValidator } from '../../../src/core/workflows/prd-validator.js';

// Mock dependencies
const mockStateManager = {
  readFile: vi.fn(),
  writeFile: vi.fn(),
  appendToFile: vi.fn(),
};

// Test fixtures
const VALID_PRD_CONTENT = `# Product Requirements Document

## Executive Summary
This is a comprehensive PRD for our agent orchestrator system with clear vision and positioning.

## Success Criteria
- PRD generated in <30 minutes (measurable)
- Completeness score >85% (measurable)
- <3 escalations per workflow (measurable)

## MVP Scope
### Core Features
- User authentication with JWT tokens
- Agent pool management
- Workflow execution engine

### Out of Scope
- Advanced analytics
- Multi-tenancy support

## Functional Requirements

### FR-001: User Authentication
**Statement**: System shall authenticate users via JWT tokens with 24-hour expiry.
**Acceptance Criteria**:
- User receives valid JWT on successful login
- Token expires after 24 hours
- Invalid tokens are rejected with 401 error

### FR-002: Agent Pool Management
**Statement**: System shall spawn agents with configurable LLM providers.
**Acceptance Criteria**:
- Agents can be spawned with OpenAI, Anthropic, or local LLMs
- Agent pool maintains max capacity limit
- Failed agent spawns are retried with exponential backoff

### FR-003: Workflow Execution
**Statement**: System shall execute workflows defined in YAML format.
**Acceptance Criteria**:
- YAML workflows are parsed and validated
- Steps are executed in sequence or parallel as configured
- Workflow state is persisted to disk

## Success Metrics
- User adoption: 100 active users in first month
- Performance: <2s response time for 95th percentile
- Quality: >85% completeness score on all PRDs generated
`;

const PRD_WITH_MISSING_SECTIONS = `# Product Requirements Document

## Executive Summary
Brief overview of the product.

## Functional Requirements

### FR-001: Authentication
**Statement**: System shall handle authentication.
**Acceptance Criteria**:
- Users can log in

## Success Metrics
- Some metric here
`;

const PRD_WITH_VAGUE_REQUIREMENTS = `# Product Requirements Document

## Executive Summary
Overview of the product with clear vision.

## Success Criteria
- System should perform well (subjective)
- Users should be happy (subjective)

## MVP Scope
- Handle user authentication
- Manage data processing
- Support file uploads
- Deal with errors

## Functional Requirements

### FR-001: Authentication
**Statement**: System shall handle authentication.
**Acceptance Criteria**:
- Auth works

### FR-002: Data Management
**Statement**: System shall manage user data.
**Acceptance Criteria**:
- Data is handled properly

### FR-003: Error Handling
**Statement**: System shall deal with errors.
**Acceptance Criteria**:
- Errors are managed

## Success Metrics
- Performance improves
- Quality increases
`;

const PRD_WITH_CONTRADICTIONS = `# Product Requirements Document

## Executive Summary
System will be a lightweight microservice architecture.

## Success Criteria
- System deployed as monolithic application (contradicts "microservice")
- Response time <100ms for all requests
- Database queries complete in <1s (contradicts <100ms total response)

## MVP Scope
- Stateless REST API with no session persistence
- User session management with server-side state (contradicts "stateless")

## Functional Requirements

### FR-001: Authentication
**Statement**: System shall use JWT tokens for stateless authentication.
**Acceptance Criteria**:
- Server maintains session state in database (contradicts "stateless")

### FR-002: Data Storage
**Statement**: System shall use NoSQL database for flexibility.
**Acceptance Criteria**:
- All data stored in PostgreSQL relational database (contradicts "NoSQL")

## Success Metrics
- Zero downtime during deployments
- Scheduled maintenance windows every week (contradicts "zero downtime")
`;

const PRD_WITH_GAPS = `# Product Requirements Document

## Executive Summary
Overview provided.

## Success Criteria
- Criterion 1
- Criterion 2

## MVP Scope
- Feature A
- Feature B

## Functional Requirements

### FR-001: User Login
**Statement**: System shall authenticate users.
**Acceptance Criteria**:
- Users can log in
(Missing: How are passwords stored? What encryption? Session management? Token expiry? Error handling?)

### FR-002: Data Processing
**Statement**: System shall process uploaded files.
**Acceptance Criteria**:
- Files are processed
(Missing: File size limits? Supported formats? Processing time? Error handling? Storage location?)

## Success Metrics
- Metric 1
`;

describe('PRDValidator', () => {
  let validator: PRDValidator;

  beforeEach(() => {
    vi.clearAllMocks();
    validator = new PRDValidator(mockStateManager as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ====================
  // AC #1: Implement PRDValidator class with quality checks
  // ====================
  describe('AC #1: PRDValidator Class Structure', () => {
    it('should instantiate with StateManager dependency', () => {
      expect(validator).toBeDefined();
      expect(validator).toBeInstanceOf(PRDValidator);
    });

    it('should have validate() method', () => {
      expect(validator.validate).toBeDefined();
      expect(typeof validator.validate).toBe('function');
    });

    it('should throw error if instantiated without StateManager', () => {
      expect(() => new PRDValidator(null as any)).toThrow();
    });

    it('should validate() return PRDValidationResult interface', async () => {
      mockStateManager.readFile.mockResolvedValue(VALID_PRD_CONTENT);

      const result = await validator.validate('docs/PRD.md');

      expect(result).toHaveProperty('completenessScore');
      expect(result).toHaveProperty('sectionsPresent');
      expect(result).toHaveProperty('sectionsMissing');
      expect(result).toHaveProperty('requirementsCount');
      expect(result).toHaveProperty('clarityIssues');
      expect(result).toHaveProperty('contradictions');
      expect(result).toHaveProperty('gaps');
      expect(result).toHaveProperty('passesQualityGate');
    });
  });

  // ====================
  // AC #2: Verify all required sections present
  // ====================
  describe('AC #2: Section Presence Validation', () => {
    it('should detect all required sections in valid PRD', async () => {
      mockStateManager.readFile.mockResolvedValue(VALID_PRD_CONTENT);

      const result = await validator.validate('docs/PRD.md');

      expect(result.sectionsPresent).toContain('Executive Summary');
      expect(result.sectionsPresent).toContain('Success Criteria');
      expect(result.sectionsPresent).toContain('MVP Scope');
      expect(result.sectionsPresent).toContain('Functional Requirements');
      expect(result.sectionsPresent).toContain('Success Metrics');
      expect(result.sectionsMissing).toHaveLength(0);
    });

    it('should detect missing sections in incomplete PRD', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_MISSING_SECTIONS);

      const result = await validator.validate('docs/PRD.md');

      expect(result.sectionsMissing).toContain('MVP Scope');
      expect(result.sectionsMissing).toContain('Success Criteria');
      expect(result.sectionsPresent).toContain('Executive Summary');
      expect(result.sectionsPresent).toContain('Functional Requirements');
    });

    it('should handle PRD with no sections at all', async () => {
      mockStateManager.readFile.mockResolvedValue('This is just plain text with no markdown headers.');

      const result = await validator.validate('docs/PRD.md');

      expect(result.sectionsPresent).toHaveLength(0);
      expect(result.sectionsMissing.length).toBeGreaterThan(0);
    });

    it('should recognize section headers at different levels (##, ###)', async () => {
      const content = `
## Executive Summary
Text here

### Success Criteria
More text

## MVP Scope
Content
      `;
      mockStateManager.readFile.mockResolvedValue(content);

      const result = await validator.validate('docs/PRD.md');

      expect(result.sectionsPresent).toContain('Executive Summary');
      expect(result.sectionsPresent).toContain('Success Criteria');
      expect(result.sectionsPresent).toContain('MVP Scope');
    });

    it('should be case-insensitive for section matching', async () => {
      const content = `
## executive summary
Text

## SUCCESS CRITERIA
Text

## mvp scope
Text
      `;
      mockStateManager.readFile.mockResolvedValue(content);

      const result = await validator.validate('docs/PRD.md');

      expect(result.sectionsPresent).toContain('Executive Summary');
      expect(result.sectionsPresent).toContain('Success Criteria');
      expect(result.sectionsPresent).toContain('MVP Scope');
    });
  });

  // ====================
  // AC #3: Check requirements clarity (no vague "handle X" requirements)
  // ====================
  describe('AC #3: Requirements Clarity Validation', () => {
    it('should pass PRD with specific, clear requirements', async () => {
      mockStateManager.readFile.mockResolvedValue(VALID_PRD_CONTENT);

      const result = await validator.validate('docs/PRD.md');

      const highSeverityIssues = result.clarityIssues.filter(issue => issue.severity === 'high');
      expect(highSeverityIssues).toHaveLength(0);
    });

    it('should detect vague "handle X" pattern', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_VAGUE_REQUIREMENTS);

      const result = await validator.validate('docs/PRD.md');

      const vagueIssues = result.clarityIssues.filter(
        issue => issue.issue.toLowerCase().includes('handle authentication')
      );
      expect(vagueIssues.length).toBeGreaterThan(0);
    });

    it('should detect vague "manage X" pattern', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_VAGUE_REQUIREMENTS);

      const result = await validator.validate('docs/PRD.md');

      const vagueIssues = result.clarityIssues.filter(
        issue => issue.issue.toLowerCase().includes('manage') || issue.issue.toLowerCase().includes('managed')
      );
      expect(vagueIssues.length).toBeGreaterThan(0);
    });

    it('should detect vague "support X" pattern', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_VAGUE_REQUIREMENTS);

      const result = await validator.validate('docs/PRD.md');

      const vagueIssues = result.clarityIssues.filter(
        issue => issue.issue.toLowerCase().includes('support')
      );
      expect(vagueIssues.length).toBeGreaterThan(0);
    });

    it('should detect vague "deal with X" pattern', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_VAGUE_REQUIREMENTS);

      const result = await validator.validate('docs/PRD.md');

      const vagueIssues = result.clarityIssues.filter(
        issue => issue.issue.toLowerCase().includes('deal with')
      );
      expect(vagueIssues.length).toBeGreaterThan(0);
    });

    it('should assign appropriate severity levels to clarity issues', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_VAGUE_REQUIREMENTS);

      const result = await validator.validate('docs/PRD.md');

      const hasHighSeverity = result.clarityIssues.some(issue => issue.severity === 'high');
      const hasMediumSeverity = result.clarityIssues.some(issue => issue.severity === 'medium');

      expect(hasHighSeverity || hasMediumSeverity).toBe(true);
    });

    it('should include section information in clarity issues', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_VAGUE_REQUIREMENTS);

      const result = await validator.validate('docs/PRD.md');

      result.clarityIssues.forEach(issue => {
        expect(issue.section).toBeDefined();
        expect(issue.section.length).toBeGreaterThan(0);
      });
    });
  });

  // ====================
  // AC #4: Validate success criteria are measurable
  // ====================
  describe('AC #4: Success Criteria Measurability', () => {
    it('should pass PRD with measurable success criteria', async () => {
      mockStateManager.readFile.mockResolvedValue(VALID_PRD_CONTENT);

      const result = await validator.validate('docs/PRD.md');

      const successCriteriaIssues = result.clarityIssues.filter(
        issue => issue.section.toLowerCase().includes('success criteria')
      );
      expect(successCriteriaIssues).toHaveLength(0);
    });

    it('should detect subjective success criteria', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_VAGUE_REQUIREMENTS);

      const result = await validator.validate('docs/PRD.md');

      const subjectiveIssues = result.clarityIssues.filter(
        issue => issue.section.toLowerCase().includes('success criteria')
      );
      expect(subjectiveIssues.length).toBeGreaterThan(0);
    });

    it('should detect subjective patterns: "should be", "should perform"', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_VAGUE_REQUIREMENTS);

      const result = await validator.validate('docs/PRD.md');

      const hasSubjectivePattern = result.clarityIssues.some(
        issue => issue.issue.toLowerCase().includes('should') && issue.section.toLowerCase().includes('success criteria')
      );
      expect(hasSubjectivePattern).toBe(true);
    });

    it('should recognize measurable criteria with numbers and percentages', async () => {
      const content = `
## Success Criteria
- Response time <2 seconds
- 95% uptime SLA
- >85% completeness score
- 100 active users
      `;
      mockStateManager.readFile.mockResolvedValue(content);

      const result = await validator.validate('docs/PRD.md');

      const successCriteriaIssues = result.clarityIssues.filter(
        issue => issue.section.toLowerCase().includes('success criteria')
      );
      expect(successCriteriaIssues).toHaveLength(0);
    });
  });

  // ====================
  // AC #5: Ensure acceptance criteria for key features
  // ====================
  describe('AC #5: Feature Acceptance Criteria Validation', () => {
    it('should pass PRD with acceptance criteria for all requirements', async () => {
      mockStateManager.readFile.mockResolvedValue(VALID_PRD_CONTENT);

      const result = await validator.validate('docs/PRD.md');

      const acIssues = result.clarityIssues.filter(
        issue => issue.issue.toLowerCase().includes('acceptance criteria')
      );
      expect(acIssues).toHaveLength(0);
    });

    it('should detect requirements missing acceptance criteria', async () => {
      const content = `
## Functional Requirements

### FR-001: Authentication
**Statement**: System shall authenticate users.
(No acceptance criteria section)

### FR-002: Data Processing
**Statement**: System shall process data.
**Acceptance Criteria**:
- Data is processed correctly
      `;
      mockStateManager.readFile.mockResolvedValue(content);

      const result = await validator.validate('docs/PRD.md');

      const acIssues = result.clarityIssues.filter(
        issue => issue.issue.toLowerCase().includes('acceptance criteria')
      );
      expect(acIssues.length).toBeGreaterThan(0);
    });

    it('should detect vague acceptance criteria', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_VAGUE_REQUIREMENTS);

      const result = await validator.validate('docs/PRD.md');

      const vagueAC = result.clarityIssues.filter(
        issue => issue.issue.toLowerCase().includes('auth works') ||
                 issue.issue.toLowerCase().includes('handled properly')
      );
      expect(vagueAC.length).toBeGreaterThan(0);
    });

    it('should recognize testable acceptance criteria keywords', async () => {
      const content = `
## Functional Requirements

### FR-001: Authentication
**Statement**: System shall authenticate users.
**Acceptance Criteria**:
- Given valid credentials, when user logs in, then JWT token is returned
- When token expires, then 401 error is returned
- User receives confirmation email after successful registration
      `;
      mockStateManager.readFile.mockResolvedValue(content);

      const result = await validator.validate('docs/PRD.md');

      const acIssues = result.clarityIssues.filter(
        issue => issue.section.includes('FR-001') && issue.issue.toLowerCase().includes('acceptance criteria')
      );
      expect(acIssues).toHaveLength(0);
    });
  });

  // ====================
  // AC #6: Check for contradictions or gaps
  // ====================
  describe('AC #6: Contradiction and Gap Detection', () => {
    it('should pass PRD with no contradictions', async () => {
      mockStateManager.readFile.mockResolvedValue(VALID_PRD_CONTENT);

      const result = await validator.validate('docs/PRD.md');

      expect(result.contradictions).toHaveLength(0);
    });

    it('should detect architectural contradictions', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_CONTRADICTIONS);

      const result = await validator.validate('docs/PRD.md');

      const archContradictions = result.contradictions.filter(
        c => c.toLowerCase().includes('microservice') || c.toLowerCase().includes('monolithic')
      );
      expect(archContradictions.length).toBeGreaterThan(0);
    });

    it('should detect stateful vs stateless contradictions', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_CONTRADICTIONS);

      const result = await validator.validate('docs/PRD.md');

      const stateContradictions = result.contradictions.filter(
        c => c.toLowerCase().includes('stateless') || c.toLowerCase().includes('session')
      );
      expect(stateContradictions.length).toBeGreaterThan(0);
    });

    it('should detect database technology contradictions', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_CONTRADICTIONS);

      const result = await validator.validate('docs/PRD.md');

      const dbContradictions = result.contradictions.filter(
        c => c.toLowerCase().includes('nosql') || c.toLowerCase().includes('postgresql')
      );
      expect(dbContradictions.length).toBeGreaterThan(0);
    });

    it('should detect gaps in requirements', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_GAPS);

      const result = await validator.validate('docs/PRD.md');

      expect(result.gaps.length).toBeGreaterThan(0);
    });

    it('should identify missing error handling in gaps', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_GAPS);

      const result = await validator.validate('docs/PRD.md');

      const errorHandlingGaps = result.gaps.filter(
        gap => gap.toLowerCase().includes('error') || gap.toLowerCase().includes('exception')
      );
      expect(errorHandlingGaps.length).toBeGreaterThan(0);
    });

    it('should identify missing security considerations in gaps', async () => {
      const content = `
## Functional Requirements

### FR-001: User Authentication
**Statement**: System shall authenticate users.
**Acceptance Criteria**:
- Users can log in
(Missing: Password encryption, token security, brute force protection)
      `;
      mockStateManager.readFile.mockResolvedValue(content);

      const result = await validator.validate('docs/PRD.md');

      const securityGaps = result.gaps.filter(
        gap => gap.toLowerCase().includes('security') ||
               gap.toLowerCase().includes('encryption') ||
               gap.toLowerCase().includes('protection')
      );
      expect(securityGaps.length).toBeGreaterThan(0);
    });
  });

  // ====================
  // AC #7: Generate completeness score (target >85%)
  // ====================
  describe('AC #7: Completeness Score Calculation', () => {
    it('should score valid PRD at or near 100', async () => {
      mockStateManager.readFile.mockResolvedValue(VALID_PRD_CONTENT);

      const result = await validator.validate('docs/PRD.md');

      expect(result.completenessScore).toBeGreaterThanOrEqual(90);
      expect(result.completenessScore).toBeLessThanOrEqual(100);
    });

    it('should deduct 15 points per missing section', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_MISSING_SECTIONS);

      const result = await validator.validate('docs/PRD.md');

      // Missing MVP Scope and Success Criteria = -30 points
      expect(result.completenessScore).toBeLessThanOrEqual(70);
    });

    it('should deduct 5 points per vague requirement', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_VAGUE_REQUIREMENTS);

      const result = await validator.validate('docs/PRD.md');

      // Multiple vague requirements should lower score
      expect(result.completenessScore).toBeLessThan(85);
    });

    it('should deduct 3 points per gap', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_GAPS);

      const result = await validator.validate('docs/PRD.md');

      // Gaps should lower score
      expect(result.completenessScore).toBeLessThan(100);
    });

    it('should deduct 5 points per contradiction', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_CONTRADICTIONS);

      const result = await validator.validate('docs/PRD.md');

      // Contradictions should significantly lower score
      expect(result.completenessScore).toBeLessThan(70);
    });

    it('should not allow score to go below 0', async () => {
      const terriblePRD = `
# PRD
Some text with no sections, no requirements, and lots of contradictions.
      `;
      mockStateManager.readFile.mockResolvedValue(terriblePRD);

      const result = await validator.validate('docs/PRD.md');

      expect(result.completenessScore).toBeGreaterThanOrEqual(0);
    });

    it('should count functional requirements correctly', async () => {
      mockStateManager.readFile.mockResolvedValue(VALID_PRD_CONTENT);

      const result = await validator.validate('docs/PRD.md');

      expect(result.requirementsCount).toBeGreaterThan(0);
    });
  });

  // ====================
  // AC #8: If score <85%, identify gaps and regenerate missing content
  // ====================
  describe('AC #8: Quality Gate and Gap Identification', () => {
    it('should set passesQualityGate to true for score >=85 with no high-severity issues', async () => {
      mockStateManager.readFile.mockResolvedValue(VALID_PRD_CONTENT);

      const result = await validator.validate('docs/PRD.md');

      expect(result.completenessScore).toBeGreaterThanOrEqual(85);
      const highSeverityIssues = result.clarityIssues.filter(issue => issue.severity === 'high');
      expect(highSeverityIssues).toHaveLength(0);
      expect(result.passesQualityGate).toBe(true);
    });

    it('should set passesQualityGate to false for score <85', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_VAGUE_REQUIREMENTS);

      const result = await validator.validate('docs/PRD.md');

      if (result.completenessScore < 85) {
        expect(result.passesQualityGate).toBe(false);
      }
    });

    it('should set passesQualityGate to false if high-severity clarity issues exist', async () => {
      const content = `
## Executive Summary
Text

## Success Criteria
- Should be good (subjective - high severity)

## MVP Scope
- Handle everything (vague - high severity)

## Functional Requirements

### FR-001: Feature
**Statement**: System shall handle the feature.
**Acceptance Criteria**:
- It works

## Success Metrics
- Metrics
      `;
      mockStateManager.readFile.mockResolvedValue(content);

      const result = await validator.validate('docs/PRD.md');

      const highSeverityIssues = result.clarityIssues.filter(issue => issue.severity === 'high');
      if (highSeverityIssues.length > 0) {
        expect(result.passesQualityGate).toBe(false);
      }
    });

    it('should identify specific gaps for regeneration when score <85', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_GAPS);

      const result = await validator.validate('docs/PRD.md');

      if (result.completenessScore < 85) {
        expect(result.gaps.length).toBeGreaterThan(0);
        expect(result.sectionsMissing.length + result.gaps.length).toBeGreaterThan(0);
      }
    });

    it('should provide actionable feedback for missing sections', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_MISSING_SECTIONS);

      const result = await validator.validate('docs/PRD.md');

      expect(result.sectionsMissing.length).toBeGreaterThan(0);
      result.sectionsMissing.forEach(section => {
        expect(section).toBeDefined();
        expect(section.length).toBeGreaterThan(0);
      });
    });
  });

  // ====================
  // AC #9: Log validation results for improvement
  // ====================
  describe('AC #9: Validation Logging', () => {
    it('should log validation results to console', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockStateManager.readFile.mockResolvedValue(VALID_PRD_CONTENT);

      await validator.validate('docs/PRD.md');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('PRD Validation')
      );
      consoleSpy.mockRestore();
    });

    it('should log completeness score', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockStateManager.readFile.mockResolvedValue(VALID_PRD_CONTENT);

      await validator.validate('docs/PRD.md');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/score|completeness/i)
      );
      consoleSpy.mockRestore();
    });

    it('should log gaps when found', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_GAPS);

      await validator.validate('docs/PRD.md');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/gap|missing/i)
      );
      consoleSpy.mockRestore();
    });

    it('should log contradictions when found', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_CONTRADICTIONS);

      await validator.validate('docs/PRD.md');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/contradiction/i)
      );
      consoleSpy.mockRestore();
    });

    it('should log quality gate status', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockStateManager.readFile.mockResolvedValue(VALID_PRD_CONTENT);

      await validator.validate('docs/PRD.md');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/quality gate|passes|fails/i)
      );
      consoleSpy.mockRestore();
    });
  });

  // ====================
  // Error Handling & Edge Cases
  // ====================
  describe('Error Handling', () => {
    it('should throw error if file does not exist', async () => {
      mockStateManager.readFile.mockRejectedValue(new Error('File not found'));

      await expect(validator.validate('nonexistent.md')).rejects.toThrow('File not found');
    });

    it('should handle empty PRD file', async () => {
      mockStateManager.readFile.mockResolvedValue('');

      const result = await validator.validate('docs/PRD.md');

      expect(result.completenessScore).toBe(0);
      expect(result.passesQualityGate).toBe(false);
    });

    it('should handle PRD with only whitespace', async () => {
      mockStateManager.readFile.mockResolvedValue('   \n\n   \t   \n   ');

      const result = await validator.validate('docs/PRD.md');

      expect(result.completenessScore).toBeLessThan(50);
      expect(result.passesQualityGate).toBe(false);
    });

    it('should handle malformed markdown', async () => {
      const malformed = `
# Incomplete header
## Another header
### FR-001 Missing colon in requirement
      `;
      mockStateManager.readFile.mockResolvedValue(malformed);

      const result = await validator.validate('docs/PRD.md');

      expect(result).toBeDefined();
      expect(result.completenessScore).toBeDefined();
    });

    it('should handle very large PRD files efficiently', async () => {
      const largeContent = VALID_PRD_CONTENT.repeat(100);
      mockStateManager.readFile.mockResolvedValue(largeContent);

      const startTime = Date.now();
      const result = await validator.validate('docs/PRD.md');
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete in <5 seconds
    });

    it('should handle StateManager read errors gracefully', async () => {
      mockStateManager.readFile.mockRejectedValue(new Error('Disk I/O error'));

      await expect(validator.validate('docs/PRD.md')).rejects.toThrow();
    });

    it('should validate file path is provided', async () => {
      await expect(validator.validate('')).rejects.toThrow();
    });

    it('should validate file path is string', async () => {
      await expect(validator.validate(null as any)).rejects.toThrow();
      await expect(validator.validate(undefined as any)).rejects.toThrow();
    });
  });

  // ====================
  // Integration Scenarios
  // ====================
  describe('Integration Scenarios', () => {
    it('should validate real PRD.md from docs/ directory', async () => {
      // This test assumes docs/PRD.md exists and was generated by Story 2.6
      const realPRD = VALID_PRD_CONTENT;
      mockStateManager.readFile.mockResolvedValue(realPRD);

      const result = await validator.validate('docs/PRD.md');

      expect(result).toBeDefined();
      expect(result.completenessScore).toBeGreaterThan(0);
    });

    it('should provide feedback suitable for PRDWorkflowExecutor', async () => {
      mockStateManager.readFile.mockResolvedValue(PRD_WITH_GAPS);

      const result = await validator.validate('docs/PRD.md');

      // PRDWorkflowExecutor needs clear signals
      expect(result.passesQualityGate).toBeDefined();
      expect(typeof result.passesQualityGate).toBe('boolean');

      if (!result.passesQualityGate) {
        // Must provide actionable feedback for regeneration
        const hasActionableFeedback =
          result.sectionsMissing.length > 0 ||
          result.gaps.length > 0 ||
          result.clarityIssues.length > 0;
        expect(hasActionableFeedback).toBe(true);
      }
    });
  });
});
