/**
 * LLMLogger - Structured logging for LLM requests and responses
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { LLMRequestLog, LLMResponseLog, InvokeOptions, StreamOptions } from '../../types/llm.types.js';

/**
 * LLMLogger - Logs all LLM requests/responses with sensitive data redaction
 */
export class LLMLogger {
  private logDir: string;
  private logFile: string;

  constructor(logDir: string = 'logs') {
    this.logDir = logDir;
    this.logFile = path.join(logDir, 'llm-requests.log');
  }

  /**
   * Initialize logger (create log directory if needed)
   */
  async init(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error(`Failed to create log directory: ${error}`);
    }
  }

  /**
   * Log an LLM request
   * @param request Request log entry
   */
  async logRequest(request: LLMRequestLog): Promise<void> {
    const logEntry = {
      type: 'request',
      ...request
    };

    await this.writeLog(logEntry);
  }

  /**
   * Log an LLM response
   * @param response Response log entry
   */
  async logResponse(response: LLMResponseLog): Promise<void> {
    const logEntry = {
      type: 'response',
      ...response
    };

    await this.writeLog(logEntry);
  }

  /**
   * Create a request log entry
   */
  createRequestLog(
    correlationId: string,
    provider: string,
    model: string,
    prompt: string,
    options?: InvokeOptions | StreamOptions
  ): LLMRequestLog {
    // Redact sensitive data from options
    const sanitizedOptions = options ? this.redactSensitiveData(options) : undefined;

    return {
      correlation_id: correlationId,
      timestamp: new Date().toISOString(),
      provider,
      model,
      prompt: this.truncate(prompt, 500),
      options: sanitizedOptions
    };
  }

  /**
   * Create a response log entry
   */
  createResponseLog(
    correlationId: string,
    response: string,
    latencyMs: number,
    estimatedCost: number,
    tokenUsage?: { input_tokens: number; output_tokens: number; total_tokens: number },
    error?: string
  ): LLMResponseLog {
    return {
      correlation_id: correlationId,
      timestamp: new Date().toISOString(),
      response: this.truncate(response, 500),
      token_usage: tokenUsage,
      estimated_cost: estimatedCost,
      latency_ms: latencyMs,
      error
    };
  }

  /**
   * Generate a unique correlation ID
   */
  generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Truncate string to max length
   */
  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '... (truncated)';
  }

  /**
   * Redact sensitive data (API keys, tokens) from objects
   * CRITICAL: This prevents API keys from being logged
   */
  private redactSensitiveData(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const redacted: any = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      const lowerKey = key.toLowerCase();

      // Redact fields that might contain sensitive data
      // Be specific to avoid false positives like "max_tokens"
      const isSensitive =
        lowerKey === 'api_key' ||
        lowerKey === 'apikey' ||
        lowerKey === 'access_token' ||
        lowerKey === 'accesstoken' ||
        lowerKey === 'refresh_token' ||
        lowerKey === 'oauth_token' ||
        lowerKey === 'bearer_token' ||
        lowerKey === 'secret' ||
        lowerKey === 'password' ||
        lowerKey === 'authorization' ||
        lowerKey.startsWith('x-api-') ||
        (lowerKey.endsWith('_key') && !lowerKey.includes('max')) ||
        (lowerKey.endsWith('_token') && !lowerKey.includes('max'));

      if (isSensitive) {
        redacted[key] = '***REDACTED***';
      } else if (typeof obj[key] === 'object') {
        redacted[key] = this.redactSensitiveData(obj[key]);
      } else {
        redacted[key] = obj[key];
      }
    }

    return redacted;
  }

  /**
   * Write log entry to file
   */
  private async writeLog(entry: any): Promise<void> {
    try {
      const logLine = JSON.stringify(entry) + '\n';
      await fs.appendFile(this.logFile, logLine);
    } catch (error) {
      console.error(`Failed to write to log file: ${error}`);
    }
  }
}
