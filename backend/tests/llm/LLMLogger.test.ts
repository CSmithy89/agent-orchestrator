/**
 * LLMLogger Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LLMLogger } from '../../src/llm/utils/LLMLogger.js';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('LLMLogger', () => {
  let logger: LLMLogger;
  const testLogDir = 'test-logs';
  const testLogFile = path.join(testLogDir, 'llm-requests.log');

  beforeEach(async () => {
    logger = new LLMLogger(testLogDir);
    await logger.init();
  });

  afterEach(async () => {
    // Clean up test log directory
    try {
      await fs.rm(testLogDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Initialization', () => {
    it('should create log directory', async () => {
      const stats = await fs.stat(testLogDir);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('Correlation ID Generation', () => {
    it('should generate unique correlation IDs', () => {
      const id1 = logger.generateCorrelationId();
      const id2 = logger.generateCorrelationId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('Request Log Creation', () => {
    it('should create request log entry', () => {
      const correlationId = 'test-123';
      const log = logger.createRequestLog(
        correlationId,
        'anthropic',
        'claude-sonnet-4-5',
        'Test prompt',
        { temperature: 0.7, max_tokens: 1000 }
      );

      expect(log.correlation_id).toBe(correlationId);
      expect(log.provider).toBe('anthropic');
      expect(log.model).toBe('claude-sonnet-4-5');
      expect(log.prompt).toBe('Test prompt');
      expect(log.timestamp).toBeDefined();
      expect(log.options).toEqual({ temperature: 0.7, max_tokens: 1000 });
    });

    it('should redact API keys in options', () => {
      const log = logger.createRequestLog(
        'test-123',
        'anthropic',
        'claude-sonnet-4-5',
        'Test prompt',
        { api_key: 'secret-key-12345' } as any
      );

      expect(log.options).toEqual({ api_key: '***REDACTED***' });
    });

    it('should redact tokens in options', () => {
      const log = logger.createRequestLog(
        'test-123',
        'anthropic',
        'claude-sonnet-4-5',
        'Test prompt',
        { access_token: 'bearer-token-xyz' } as any
      );

      expect(log.options).toEqual({ access_token: '***REDACTED***' });
    });

    it('should redact auth headers in options', () => {
      const log = logger.createRequestLog(
        'test-123',
        'openai',
        'gpt-4',
        'Test prompt',
        { authorization: 'Bearer sk-123456' } as any
      );

      expect(log.options).toEqual({ authorization: '***REDACTED***' });
    });
  });

  describe('Response Log Creation', () => {
    it('should create response log entry', () => {
      const correlationId = 'test-123';
      const log = logger.createResponseLog(
        correlationId,
        'Test response',
        1500,
        0.0025,
        { input_tokens: 100, output_tokens: 150, total_tokens: 250 }
      );

      expect(log.correlation_id).toBe(correlationId);
      expect(log.response).toBe('Test response');
      expect(log.latency_ms).toBe(1500);
      expect(log.estimated_cost).toBe(0.0025);
      expect(log.token_usage).toEqual({
        input_tokens: 100,
        output_tokens: 150,
        total_tokens: 250
      });
      expect(log.timestamp).toBeDefined();
      expect(log.error).toBeUndefined();
    });

    it('should include error message when provided', () => {
      const log = logger.createResponseLog(
        'test-123',
        '',
        1000,
        0,
        undefined,
        'API call failed'
      );

      expect(log.error).toBe('API call failed');
    });
  });

  describe('Prompt Truncation', () => {
    it('should truncate long prompts to 500 chars', () => {
      const longPrompt = 'a'.repeat(600);
      const log = logger.createRequestLog(
        'test-123',
        'anthropic',
        'claude-sonnet-4-5',
        longPrompt
      );

      expect(log.prompt.length).toBeLessThanOrEqual(520); // 500 + "... (truncated)"
      expect(log.prompt).toContain('... (truncated)');
    });

    it('should not truncate prompts under 500 chars', () => {
      const shortPrompt = 'a'.repeat(300);
      const log = logger.createRequestLog(
        'test-123',
        'anthropic',
        'claude-sonnet-4-5',
        shortPrompt
      );

      expect(log.prompt).toBe(shortPrompt);
      expect(log.prompt).not.toContain('truncated');
    });
  });

  describe('Response Truncation', () => {
    it('should truncate long responses to 500 chars', () => {
      const longResponse = 'b'.repeat(600);
      const log = logger.createResponseLog(
        'test-123',
        longResponse,
        1000,
        0.001
      );

      expect(log.response.length).toBeLessThanOrEqual(520);
      expect(log.response).toContain('... (truncated)');
    });
  });

  describe('Log Writing', () => {
    it('should write request log to file', async () => {
      const requestLog = logger.createRequestLog(
        'test-123',
        'anthropic',
        'claude-sonnet-4-5',
        'Test prompt'
      );

      await logger.logRequest(requestLog);

      // Verify log file exists and contains data
      const logContent = await fs.readFile(testLogFile, 'utf-8');
      expect(logContent).toContain('test-123');
      expect(logContent).toContain('anthropic');
      expect(logContent).toContain('claude-sonnet-4-5');
      expect(logContent).toContain('Test prompt');
    });

    it('should write response log to file', async () => {
      const responseLog = logger.createResponseLog(
        'test-123',
        'Test response',
        1500,
        0.0025
      );

      await logger.logResponse(responseLog);

      const logContent = await fs.readFile(testLogFile, 'utf-8');
      expect(logContent).toContain('test-123');
      expect(logContent).toContain('Test response');
      expect(logContent).toContain('1500');
      expect(logContent).toContain('0.0025');
    });

    it('should write multiple logs to file', async () => {
      const requestLog = logger.createRequestLog(
        'test-123',
        'anthropic',
        'claude-sonnet-4-5',
        'Test prompt'
      );
      const responseLog = logger.createResponseLog(
        'test-123',
        'Test response',
        1500,
        0.0025
      );

      await logger.logRequest(requestLog);
      await logger.logResponse(responseLog);

      const logContent = await fs.readFile(testLogFile, 'utf-8');
      const lines = logContent.trim().split('\n');

      expect(lines.length).toBe(2);
      expect(lines[0]).toContain('"type":"request"');
      expect(lines[1]).toContain('"type":"response"');
    });

    it('should write logs in JSON format', async () => {
      const requestLog = logger.createRequestLog(
        'test-123',
        'anthropic',
        'claude-sonnet-4-5',
        'Test prompt'
      );

      await logger.logRequest(requestLog);

      const logContent = await fs.readFile(testLogFile, 'utf-8');
      const logEntry = JSON.parse(logContent.trim());

      expect(logEntry.type).toBe('request');
      expect(logEntry.correlation_id).toBe('test-123');
      expect(logEntry.provider).toBe('anthropic');
    });
  });

  describe('Sensitive Data Redaction', () => {
    it('should redact nested API keys', () => {
      const log = logger.createRequestLog(
        'test-123',
        'anthropic',
        'claude-sonnet-4-5',
        'Test prompt',
        {
          headers: {
            api_key: 'secret-key',
            'x-api-key': 'another-secret'
          }
        } as any
      );

      expect(log.options).toEqual({
        headers: {
          api_key: '***REDACTED***',
          'x-api-key': '***REDACTED***'
        }
      });
    });

    it('should redact passwords in nested objects', () => {
      const log = logger.createRequestLog(
        'test-123',
        'anthropic',
        'claude-sonnet-4-5',
        'Test prompt',
        {
          auth: {
            username: 'user',
            password: 'secret123'
          }
        } as any
      );

      expect(log.options).toEqual({
        auth: {
          username: 'user',
          password: '***REDACTED***'
        }
      });
    });

    it('should preserve non-sensitive data', () => {
      const log = logger.createRequestLog(
        'test-123',
        'anthropic',
        'claude-sonnet-4-5',
        'Test prompt',
        {
          temperature: 0.7,
          max_tokens: 1000,
          stop_sequences: ['END']
        }
      );

      expect(log.options).toEqual({
        temperature: 0.7,
        max_tokens: 1000,
        stop_sequences: ['END']
      });
    });
  });
});
