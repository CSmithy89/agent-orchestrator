/**
 * Comprehensive LLM Mock Responses for E2E Tests
 * Provides complete workflow responses for deterministic E2E testing
 */

import type {
  CodeImplementation,
  TestSuite,
  SelfReviewReport,
  IndependentReviewReport,
  StoryContext,
} from '@/implementation/types';

/**
 * Simple Feature Story - Complete Workflow Mocks
 */

export const simpleStoryContext: Partial<StoryContext> = {
  storyId: '1-1-user-input-validation',
  title: 'User Input Validation',
  acceptanceCriteria: [
    'Email format validated using regex',
    'Password minimum 8 characters with complexity requirements',
  ],
  tasks: [
    'Implement email validation function',
    'Implement password strength validation',
  ],
  tokenCount: 12500,
};

export const simpleStoryImplementation: CodeImplementation = {
  files: [
    {
      path: 'src/validation/email.ts',
      content: `/**
 * Email validation utility
 */

const EMAIL_REGEX = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return { valid: false, message: 'Email is required' };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, message: 'Invalid email format' };
  }

  return { valid: true };
}
`,
      operation: 'create' as const,
    },
    {
      path: 'src/validation/password.ts',
      content: `/**
 * Password strength validation utility
 */

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export function validatePassword(password: string): ValidationResult {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain an uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain a lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain a number' };
  }

  return { valid: true };
}
`,
      operation: 'create' as const,
    },
  ],
  commitMessage: 'Implement email and password validation utilities',
  implementationNotes: 'Created validation functions with comprehensive error messages',
  acceptanceCriteriaMapping: [
    {
      criteriaId: 'AC1',
      implementedBy: ['src/validation/email.ts'],
      notes: 'Email validation using standard regex pattern',
    },
    {
      criteriaId: 'AC2',
      implementedBy: ['src/validation/password.ts'],
      notes: 'Password validation with length and complexity checks',
    },
  ],
};

export const simpleStoryTests: TestSuite = {
  files: [
    {
      path: 'tests/unit/validation/email.test.ts',
      content: `import { describe, it, expect } from 'vitest';
import { validateEmail } from '@/validation/email';

describe('validateEmail', () => {
  it('should validate correct email format', () => {
    expect(validateEmail('user@example.com')).toEqual({ valid: true });
    expect(validateEmail('test.user@company.co.uk')).toEqual({ valid: true });
  });

  it('should reject empty email', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Email is required');
  });

  it('should reject invalid email format', () => {
    const result = validateEmail('invalid-email');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Invalid email format');
  });

  it('should reject email without domain', () => {
    const result = validateEmail('user@');
    expect(result.valid).toBe(false);
  });
});
`,
    },
    {
      path: 'tests/unit/validation/password.test.ts',
      content: `import { describe, it, expect } from 'vitest';
import { validatePassword } from '@/validation/password';

describe('validatePassword', () => {
  it('should validate strong password', () => {
    expect(validatePassword('Test1234')).toEqual({ valid: true });
    expect(validatePassword('SecurePass99')).toEqual({ valid: true });
  });

  it('should reject short password', () => {
    const result = validatePassword('Test1');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password must be at least 8 characters');
  });

  it('should reject password without uppercase', () => {
    const result = validatePassword('test1234');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password must contain an uppercase letter');
  });

  it('should reject password without lowercase', () => {
    const result = validatePassword('TEST1234');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password must contain a lowercase letter');
  });

  it('should reject password without number', () => {
    const result = validatePassword('TestTest');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password must contain a number');
  });
});
`,
    },
  ],
  framework: 'vitest',
  testCount: 9,
  coverage: {
    lines: { total: 30, covered: 28, percentage: 93.33 },
    functions: { total: 2, covered: 2, percentage: 100 },
    branches: { total: 10, covered: 10, percentage: 100 },
    statements: { total: 30, covered: 28, percentage: 93.33 },
  },
  results: {
    passed: 9,
    failed: 0,
    skipped: 0,
    total: 9,
    duration: 245,
  },
};

export const simpleStorySelfReview: SelfReviewReport = {
  confidence: 0.95,
  checklistResults: {
    acceptanceCriteriaMet: true,
    testCoverageAdequate: true,
    codingStandardsFollowed: true,
    documentationComplete: true,
    errorHandlingPresent: true,
  },
  potentialIssues: [],
  improvementSuggestions: [
    'Consider adding internationalization for error messages',
  ],
  overallAssessment: 'High-quality implementation with comprehensive validation and testing',
};

export const simpleStoryAlexReview: IndependentReviewReport = {
  confidence: 0.92,
  security: {
    vulnerabilities: [],
    securityScore: 98,
    recommendations: ['Validation functions are secure with no vulnerabilities'],
    criticalIssues: [],
  },
  quality: {
    codeSmells: [],
    complexity: {
      cyclomaticComplexity: 3,
      cognitiveComplexity: 2,
      assessment: 'Low complexity, very maintainable',
    },
    maintainability: {
      score: 95,
      issues: [],
    },
    bestPractices: {
      followed: ['TypeScript types', 'Clear error messages', 'Pure functions'],
      violated: [],
    },
  },
  testValidation: {
    coverageAdequate: true,
    testQuality: {
      score: 93,
      strengths: ['Comprehensive test cases', 'Good edge case coverage'],
      weaknesses: [],
    },
    missingTests: [],
    recommendations: [],
  },
  criticalIssues: [],
  blockers: [],
  recommendations: ['Excellent implementation, ready for merge'],
  overallDecision: 'approve' as const,
  reasoning: 'Clean, well-tested validation utilities with no issues identified',
};

/**
 * Complex Story - Complete Workflow Mocks (Multiple Files, Migration)
 */

export const complexStoryImplementation: CodeImplementation = {
  files: [
    {
      path: 'db/migrations/001_create_users_table.sql',
      content: `-- Migration: Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
`,
      operation: 'create' as const,
    },
    {
      path: 'src/models/User.ts',
      content: `export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface UserCreate {
  email: string;
  password: string;
  name: string;
}

export interface UserUpdate {
  email?: string;
  name?: string;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
`,
      operation: 'create' as const,
    },
    {
      path: 'src/repositories/UserRepository.ts',
      content: `import type { User, UserCreate, UserUpdate } from '@/models/User';
import { db } from '@/database';

export class UserRepository {
  async create(data: UserCreate): Promise<User> {
    const result = await db.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *',
      [data.email, data.password, data.name]
    );
    return result.rows[0];
  }

  async findById(id: number): Promise<User | null> {
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  async update(id: number, data: UserUpdate): Promise<User | null> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (data.email) {
      fields.push(\`email = $\${paramIndex++}\`);
      values.push(data.email);
    }
    if (data.name) {
      fields.push(\`name = $\${paramIndex++}\`);
      values.push(data.name);
    }
    fields.push(\`updated_at = CURRENT_TIMESTAMP\`);
    values.push(id);

    if (fields.length === 1) return this.findById(id);

    const query = \`UPDATE users SET \${fields.join(', ')} WHERE id = $\${paramIndex} AND deleted_at IS NULL RETURNING *\`;
    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.query(
      'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }
}
`,
      operation: 'create' as const,
    },
    {
      path: 'src/controllers/UserController.ts',
      content: `import { Request, Response } from 'express';
import { UserRepository } from '@/repositories/UserRepository';
import { toResponse } from '@/models/User';

export class UserController {
  constructor(private userRepo: UserRepository) {}

  async createUser(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const user = await this.userRepo.create({ email, password, name });
      return res.status(201).json(toResponse(user));
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create user' });
    }
  }

  async getUser(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const user = await this.userRepo.findById(id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json(toResponse(user));
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve user' });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { email, name } = req.body;

      const user = await this.userRepo.update(id, { email, name });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json(toResponse(user));
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update user' });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const deleted = await this.userRepo.delete(id);

      if (!deleted) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete user' });
    }
  }
}
`,
      operation: 'create' as const,
    },
    {
      path: 'src/routes/users.ts',
      content: `import { Router } from 'express';
import { UserController } from '@/controllers/UserController';
import { UserRepository } from '@/repositories/UserRepository';

const router = Router();
const userRepo = new UserRepository();
const userController = new UserController(userRepo);

router.post('/api/users', (req, res) => userController.createUser(req, res));
router.get('/api/users/:id', (req, res) => userController.getUser(req, res));
router.put('/api/users/:id', (req, res) => userController.updateUser(req, res));
router.delete('/api/users/:id', (req, res) => userController.deleteUser(req, res));

export default router;
`,
      operation: 'create' as const,
    },
  ],
  commitMessage: 'Implement complete User Management API with CRUD operations and database migration',
  implementationNotes: 'Implemented RESTful API with repository pattern, parameterized queries, and soft delete support',
  acceptanceCriteriaMapping: [
    { criteriaId: 'AC1', implementedBy: ['src/controllers/UserController.ts', 'db/migrations/001_create_users_table.sql'], notes: 'POST /api/users endpoint with validation and database migration' },
    { criteriaId: 'AC2', implementedBy: ['src/controllers/UserController.ts'], notes: 'GET /api/users/:id endpoint with 404 handling' },
    { criteriaId: 'AC3', implementedBy: ['src/controllers/UserController.ts', 'src/repositories/UserRepository.ts'], notes: 'PUT /api/users/:id with partial updates' },
    { criteriaId: 'AC4', implementedBy: ['src/repositories/UserRepository.ts'], notes: 'Soft delete with deleted_at timestamp' },
  ],
};

export const complexStoryTests: TestSuite = {
  files: [
    {
      path: 'tests/unit/repositories/UserRepository.test.ts',
      content: `import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRepository } from '@/repositories/UserRepository';

// Mock database
vi.mock('@/database', () => ({
  db: { query: vi.fn() }
}));

describe('UserRepository', () => {
  let repo: UserRepository;

  beforeEach(() => {
    repo = new UserRepository();
    vi.clearAllMocks();
  });

  it('should create user', async () => {
    // Test implementation...
  });

  it('should find user by ID', async () => {
    // Test implementation...
  });

  it('should return null for non-existent user', async () => {
    // Test implementation...
  });

  it('should update user', async () => {
    // Test implementation...
  });

  it('should soft delete user', async () => {
    // Test implementation...
  });
});
`,
    },
    {
      path: 'tests/integration/api/users.test.ts',
      content: `import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '@/app';

describe('User API Endpoints', () => {
  it('POST /api/users should create user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', password: 'pass123', name: 'Test' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe('test@example.com');
  });

  it('GET /api/users/:id should return user', async () => {
    // Test implementation...
  });

  it('GET /api/users/:id should return 404 for non-existent user', async () => {
    // Test implementation...
  });

  it('PUT /api/users/:id should update user', async () => {
    // Test implementation...
  });

  it('DELETE /api/users/:id should soft delete user', async () => {
    // Test implementation...
  });
});
`,
    },
  ],
  framework: 'vitest',
  testCount: 15,
  coverage: {
    lines: { total: 120, covered: 105, percentage: 87.5 },
    functions: { total: 8, covered: 8, percentage: 100 },
    branches: { total: 24, covered: 22, percentage: 91.67 },
    statements: { total: 120, covered: 105, percentage: 87.5 },
  },
  results: {
    passed: 15,
    failed: 0,
    skipped: 0,
    total: 15,
    duration: 850,
  },
};

export const complexStorySelfReview: SelfReviewReport = {
  confidence: 0.89,
  checklistResults: {
    acceptanceCriteriaMet: true,
    testCoverageAdequate: true,
    codingStandardsFollowed: true,
    documentationComplete: true,
    errorHandlingPresent: true,
  },
  potentialIssues: [
    'Consider adding email uniqueness validation in controller',
  ],
  improvementSuggestions: [
    'Add request body validation middleware',
    'Consider password hashing before storage',
  ],
  overallAssessment: 'Solid implementation with good separation of concerns and test coverage',
};

export const complexStoryAlexReview: IndependentReviewReport = {
  confidence: 0.88,
  security: {
    vulnerabilities: [],
    securityScore: 92,
    recommendations: [
      'Password should be hashed before storage (bcrypt recommended)',
      'Consider rate limiting for API endpoints',
    ],
    criticalIssues: [],
  },
  quality: {
    codeSmells: ['Password stored in plain text (medium severity)'],
    complexity: {
      cyclomaticComplexity: 5,
      cognitiveComplexity: 4,
      assessment: 'Moderate complexity, maintainable with clear structure',
    },
    maintainability: {
      score: 85,
      issues: ['Password hashing should be added'],
    },
    bestPractices: {
      followed: ['Repository pattern', 'Parameterized queries', 'Soft delete', 'Error handling'],
      violated: ['Plain text password storage'],
    },
  },
  testValidation: {
    coverageAdequate: true,
    testQuality: {
      score: 87,
      strengths: ['Good coverage', 'Integration tests included'],
      weaknesses: ['Some edge cases could be tested more thoroughly'],
    },
    missingTests: [],
    recommendations: ['Add tests for email uniqueness constraint violation'],
  },
  criticalIssues: [],
  blockers: [],
  recommendations: [
    'Add password hashing in future iteration',
    'Consider adding input validation middleware',
  ],
  overallDecision: 'approve' as const,
  reasoning: 'Good implementation with repository pattern and comprehensive testing. Password hashing recommended for future but not blocking.',
};

/**
 * Escalation Scenario - Low Confidence Review
 */

export const escalationStoryImplementation: CodeImplementation = {
  files: [
    {
      path: 'src/services/RecommendationEngine.ts',
      content: `/**
 * Product recommendation engine
 * NOTE: Algorithm details are tentative and may need refinement
 */

export class RecommendationEngine {
  async getRecommendations(userId: string): Promise<string[]> {
    // PLACEHOLDER: Algorithm implementation uncertain
    // Using simple approach but may not meet business expectations
    const userHistory = await this.getUserHistory(userId);
    const recommendations = this.scoreProducts(userHistory);
    return recommendations.slice(0, 10);
  }

  private async getUserHistory(userId: string): Promise<any[]> {
    // Implementation unclear - data structure not well defined
    return [];
  }

  private scoreProducts(history: any[]): string[] {
    // UNCERTAIN: Scoring algorithm not well-specified in requirements
    // Using basic frequency approach, may need sophistication
    return [];
  }
}
`,
      operation: 'create' as const,
    },
  ],
  commitMessage: 'Implement basic recommendation engine (needs review)',
  implementationNotes: 'Implemented basic structure but algorithm details need clarification',
  acceptanceCriteriaMapping: [],
};

export const escalationSelfReview: SelfReviewReport = {
  confidence: 0.72, // Below 0.85 threshold
  checklistResults: {
    acceptanceCriteriaMet: false,
    testCoverageAdequate: false,
    codingStandardsFollowed: true,
    documentationComplete: false,
    errorHandlingPresent: false,
  },
  potentialIssues: [
    'Algorithm approach uncertain due to vague requirements',
    'Scoring mechanism not well-defined',
    'Performance targets unclear',
  ],
  improvementSuggestions: [
    'Need product owner input on scoring algorithm',
    'Clarify performance requirements',
    'Define quality metrics for recommendations',
  ],
  overallAssessment: 'Implementation uncertain - requirements need clarification before proceeding',
};

export const escalationAlexReview: IndependentReviewReport = {
  confidence: 0.70, // Below 0.85 threshold
  security: {
    vulnerabilities: [],
    securityScore: 85,
    recommendations: [],
    criticalIssues: [],
  },
  quality: {
    codeSmells: ['Placeholder implementations', 'Incomplete logic'],
    complexity: {
      cyclomaticComplexity: 2,
      cognitiveComplexity: 1,
      assessment: 'Low complexity but incomplete implementation',
    },
    maintainability: {
      score: 60,
      issues: ['Algorithm not fully implemented', 'Unclear business logic'],
    },
    bestPractices: {
      followed: ['TypeScript types'],
      violated: ['Incomplete implementation', 'Missing error handling'],
    },
  },
  testValidation: {
    coverageAdequate: false,
    testQuality: {
      score: 50,
      strengths: [],
      weaknesses: ['Insufficient tests for algorithm validation'],
    },
    missingTests: ['Algorithm correctness tests', 'Performance tests'],
    recommendations: ['Need comprehensive test suite once algorithm is clarified'],
  },
  criticalIssues: ['Requirements too vague for confident implementation'],
  blockers: ['Algorithm specification unclear - requires human input'],
  recommendations: [
    'ESCALATE: Product owner needs to clarify algorithm requirements',
    'Define success metrics for recommendation quality',
    'Provide example expected outputs for validation',
  ],
  overallDecision: 'uncertain' as const,
  reasoning: 'Requirements are too ambiguous for autonomous implementation. Human review and clarification needed before proceeding.',
};
