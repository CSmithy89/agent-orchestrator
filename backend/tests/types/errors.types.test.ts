/**
 * Unit tests for error types
 */

import { describe, it, expect } from 'vitest';
import {
  BaseOrchestratorError,
  RecoverableError,
  RetryableError,
  FatalError,
  LLMAPIError,
  GitOperationError,
  WorkflowParseError,
  WorkflowExecutionError,
  StateCorruptionError,
  ResourceExhaustedError,
  AgentExecutionError,
  ProjectExecutionError,
  isRetryableError,
  isFatalError,
  getErrorCode,
  getErrorContext
} from '../../src/types/errors.types.js';

describe('Error Types', () => {
  describe('BaseOrchestratorError', () => {
    it('should create error with message and code', () => {
      const error = new BaseOrchestratorError(
        'Test error',
        'TEST_CODE'
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.retryCount).toBe(0);
    });

    it('should include context', () => {
      const context = { projectId: 'proj-123', userId: 'user-456' };
      const error = new BaseOrchestratorError(
        'Test error',
        'TEST_CODE',
        context
      );

      expect(error.context).toEqual(context);
    });

    it('should include retry count', () => {
      const error = new BaseOrchestratorError(
        'Test error',
        'TEST_CODE',
        {},
        3
      );

      expect(error.retryCount).toBe(3);
    });

    it('should include cause error', () => {
      const cause = new Error('Original error');
      const error = new BaseOrchestratorError(
        'Wrapped error',
        'WRAPPED',
        {},
        0,
        cause
      );

      expect(error.cause).toBe(cause);
    });

    it('should convert to JSON', () => {
      const error = new BaseOrchestratorError(
        'Test error',
        'TEST_CODE',
        { key: 'value' },
        2
      );

      const json = error.toJSON();

      expect(json).toMatchObject({
        name: 'BaseOrchestratorError',
        code: 'TEST_CODE',
        message: 'Test error',
        context: { key: 'value' },
        retryCount: 2
      });
      expect(json.timestamp).toBeDefined();
      expect(json.stack).toBeDefined();
    });

    it('should include cause in JSON', () => {
      const cause = new Error('Original error');
      const error = new BaseOrchestratorError(
        'Wrapped error',
        'WRAPPED',
        {},
        0,
        cause
      );

      const json = error.toJSON();

      expect(json.cause).toMatchObject({
        name: 'Error',
        message: 'Original error'
      });
    });
  });

  describe('RecoverableError', () => {
    it('should extend BaseOrchestratorError', () => {
      const error = new RecoverableError(
        'Recoverable error',
        'RECOVERABLE'
      );

      expect(error).toBeInstanceOf(BaseOrchestratorError);
      expect(error).toBeInstanceOf(RecoverableError);
    });
  });

  describe('RetryableError', () => {
    it('should extend BaseOrchestratorError', () => {
      const error = new RetryableError(
        'Retryable error',
        'RETRYABLE'
      );

      expect(error).toBeInstanceOf(BaseOrchestratorError);
      expect(error).toBeInstanceOf(RetryableError);
    });
  });

  describe('FatalError', () => {
    it('should extend BaseOrchestratorError', () => {
      const error = new FatalError(
        'Fatal error',
        'FATAL'
      );

      expect(error).toBeInstanceOf(BaseOrchestratorError);
      expect(error).toBeInstanceOf(FatalError);
    });
  });

  describe('LLMAPIError', () => {
    it('should include provider and model', () => {
      const error = new LLMAPIError(
        'API error',
        'API_ERROR',
        'anthropic',
        'claude-3',
        429
      );

      expect(error).toBeInstanceOf(RetryableError);
      expect(error.provider).toBe('anthropic');
      expect(error.model).toBe('claude-3');
      expect(error.statusCode).toBe(429);
    });

    it('should include status code in context', () => {
      const error = new LLMAPIError(
        'Rate limit',
        'RATE_LIMIT',
        'openai',
        'gpt-4',
        429
      );

      expect(error.context).toMatchObject({
        provider: 'openai',
        model: 'gpt-4',
        statusCode: 429
      });
    });
  });

  describe('GitOperationError', () => {
    it('should include command and exit code', () => {
      const error = new GitOperationError(
        'Git error',
        'GIT_ERROR',
        'git push origin main',
        128,
        'Permission denied'
      );

      expect(error).toBeInstanceOf(FatalError);
      expect(error.command).toBe('git push origin main');
      expect(error.exitCode).toBe(128);
      expect(error.stderr).toBe('Permission denied');
    });
  });

  describe('WorkflowParseError', () => {
    it('should include file path and line number', () => {
      const error = new WorkflowParseError(
        'Parse error',
        'PARSE_ERROR',
        '/path/to/workflow.yaml',
        42,
        'name'
      );

      expect(error).toBeInstanceOf(FatalError);
      expect(error.filePath).toBe('/path/to/workflow.yaml');
      expect(error.lineNumber).toBe(42);
      expect(error.field).toBe('name');
    });

    it('should format detailed error message', () => {
      const error = new WorkflowParseError(
        'Missing required field',
        'MISSING_FIELD',
        '/path/to/workflow.yaml',
        10,
        'instructions'
      );

      const formatted = error.formatDetailedMessage();

      expect(formatted).toContain('WorkflowParseError');
      expect(formatted).toContain('Missing required field');
      expect(formatted).toContain('/path/to/workflow.yaml');
      expect(formatted).toContain('Line: 10');
      expect(formatted).toContain('Field: instructions');
      expect(formatted).toContain('Resolution:');
    });
  });

  describe('WorkflowExecutionError', () => {
    it('should include workflow name and step info', () => {
      const error = new WorkflowExecutionError(
        'Execution failed',
        'EXECUTION_ERROR',
        'prd-workflow',
        3,
        'Generate PRD'
      );

      expect(error).toBeInstanceOf(RetryableError);
      expect(error.workflowName).toBe('prd-workflow');
      expect(error.stepNumber).toBe(3);
      expect(error.stepName).toBe('Generate PRD');
    });
  });

  describe('StateCorruptionError', () => {
    it('should include state file path and corruption type', () => {
      const error = new StateCorruptionError(
        'State corrupted',
        'STATE_CORRUPTED',
        '/path/to/state.json',
        'syntax'
      );

      expect(error).toBeInstanceOf(FatalError);
      expect(error.stateFilePath).toBe('/path/to/state.json');
      expect(error.corruptionType).toBe('syntax');
    });
  });

  describe('ResourceExhaustedError', () => {
    it('should include resource type and usage', () => {
      const error = new ResourceExhaustedError(
        'Memory exhausted',
        'MEMORY_EXHAUSTED',
        'memory',
        1024,
        900
      );

      expect(error).toBeInstanceOf(RetryableError);
      expect(error.resourceType).toBe('memory');
      expect(error.currentUsage).toBe(1024);
      expect(error.limit).toBe(900);
    });
  });

  describe('AgentExecutionError', () => {
    it('should include agent ID and project ID', () => {
      const error = new AgentExecutionError(
        'Agent failed',
        'AGENT_ERROR',
        'agent-123',
        'proj-456'
      );

      expect(error).toBeInstanceOf(RetryableError);
      expect(error.agentId).toBe('agent-123');
      expect(error.projectId).toBe('proj-456');
    });
  });

  describe('ProjectExecutionError', () => {
    it('should include project ID', () => {
      const error = new ProjectExecutionError(
        'Project failed',
        'PROJECT_ERROR',
        'proj-123'
      );

      expect(error).toBeInstanceOf(RetryableError);
      expect(error.projectId).toBe('proj-123');
    });
  });

  describe('Utility functions', () => {
    describe('isRetryableError', () => {
      it('should return true for retryable errors', () => {
        const retryable = new RetryableError('Retryable', 'TEST');
        const recoverable = new RecoverableError('Recoverable', 'TEST');

        expect(isRetryableError(retryable)).toBe(true);
        expect(isRetryableError(recoverable)).toBe(true);
      });

      it('should return false for fatal errors', () => {
        const fatal = new FatalError('Fatal', 'TEST');
        expect(isRetryableError(fatal)).toBe(false);
      });

      it('should return false for generic errors', () => {
        const generic = new Error('Generic error');
        expect(isRetryableError(generic)).toBe(false);
      });
    });

    describe('isFatalError', () => {
      it('should return true for fatal errors', () => {
        const fatal = new FatalError('Fatal', 'TEST');
        expect(isFatalError(fatal)).toBe(true);
      });

      it('should return false for retryable errors', () => {
        const retryable = new RetryableError('Retryable', 'TEST');
        expect(isFatalError(retryable)).toBe(false);
      });
    });

    describe('getErrorCode', () => {
      it('should return error code for orchestrator errors', () => {
        const error = new BaseOrchestratorError('Test', 'TEST_CODE');
        expect(getErrorCode(error)).toBe('TEST_CODE');
      });

      it('should return UNKNOWN_ERROR for generic errors', () => {
        const error = new Error('Generic');
        expect(getErrorCode(error)).toBe('UNKNOWN_ERROR');
      });
    });

    describe('getErrorContext', () => {
      it('should return context for orchestrator errors', () => {
        const context = { key: 'value' };
        const error = new BaseOrchestratorError('Test', 'CODE', context);
        expect(getErrorContext(error)).toEqual(context);
      });

      it('should return empty object for generic errors', () => {
        const error = new Error('Generic');
        expect(getErrorContext(error)).toEqual({});
      });
    });
  });
});
