/**
 * Logger - Structured logging utility for the orchestrator
 * Provides consistent logging with context, levels, and sensitive data redaction
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseOrchestratorError } from '../types/errors.types.js';

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

/**
 * Log level priorities for filtering
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.FATAL]: 4
};

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: ErrorInfo;
  retryCount?: number;
}

/**
 * Context information for log entries
 */
export interface LogContext {
  projectId?: string;
  workflowName?: string;
  stepNumber?: number;
  stepName?: string;
  agentId?: string;
  correlationId?: string;
  [key: string]: any;
}

/**
 * Error information in logs
 */
export interface ErrorInfo {
  name: string;
  message: string;
  code?: string;
  stack?: string;
  cause?: ErrorInfo;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Minimum log level to output (default: INFO) */
  level?: LogLevel;

  /** Enable console output (default: true) */
  console?: boolean;

  /** Enable file output (default: true in production) */
  file?: boolean;

  /** Log directory path (default: 'logs') */
  logDir?: string;

  /** Enable pretty printing in console (default: true) */
  prettyPrint?: boolean;

  /** Enable log rotation (default: true) */
  rotation?: boolean;

  /** Days to keep logs (default: 7) */
  retentionDays?: number;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: Required<LoggerConfig> = {
  level: LogLevel.INFO,
  console: true,
  file: process.env.NODE_ENV === 'production',
  logDir: 'logs',
  prettyPrint: process.env.NODE_ENV !== 'production',
  rotation: true,
  retentionDays: 7
};

/**
 * Logger class
 * Provides structured logging with context and sensitive data redaction
 */
export class Logger {
  private config: Required<LoggerConfig>;
  private logFilePath?: string;
  private errorLogFilePath?: string;

  constructor(config?: LoggerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize logger (create log directory if needed)
   */
  async init(): Promise<void> {
    if (this.config.file) {
      try {
        // Create log directory
        await fs.mkdir(this.config.logDir, { recursive: true });

        // Set log file paths
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        this.logFilePath = path.join(this.config.logDir, `orchestrator-${date}.log`);
        this.errorLogFilePath = path.join(this.config.logDir, `error-${date}.log`);

        // Rotate old logs if enabled
        if (this.config.rotation) {
          await this.rotateOldLogs();
        }
      } catch (error) {
        console.error(`Failed to initialize logger: ${error}`);
        this.config.file = false; // Disable file logging on error
      }
    }
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const errorInfo = error ? this.serializeError(error) : undefined;
    this.log(LogLevel.ERROR, message, context, errorInfo);
  }

  /**
   * Log a fatal error message
   */
  fatal(message: string, error?: Error, context?: LogContext): void {
    const errorInfo = error ? this.serializeError(error) : undefined;
    this.log(LogLevel.FATAL, message, context, errorInfo);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: ErrorInfo
  ): void {
    // Check if this log level should be output
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.config.level]) {
      return;
    }

    // Create log entry
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ? this.redactSensitiveData(context) : undefined,
      error,
      retryCount: (error as any)?.retryCount
    };

    // Output to console if enabled
    if (this.config.console) {
      this.logToConsole(entry);
    }

    // Output to file if enabled
    if (this.config.file && this.logFilePath) {
      this.logToFile(entry).catch(err => {
        console.error(`Failed to write log to file: ${err}`);
      });
    }
  }

  /**
   * Log entry to console with pretty formatting
   */
  private logToConsole(entry: LogEntry): void {
    if (this.config.prettyPrint) {
      // Pretty print for development
      const timestamp = entry.timestamp.split('T')[1].split('.')[0]; // HH:MM:SS
      const levelStr = this.colorizeLevel(entry.level);
      const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';

      console.log(`[${timestamp}] ${levelStr} ${entry.message}${contextStr}`);

      if (entry.error) {
        console.error(`  Error: ${entry.error.name}: ${entry.error.message}`);
        if (entry.error.stack) {
          console.error(`  Stack: ${entry.error.stack.split('\n').slice(0, 3).join('\n  ')}`);
        }
      }
    } else {
      // JSON for production
      console.log(JSON.stringify(entry));
    }
  }

  /**
   * Colorize log level for console output
   */
  private colorizeLevel(level: LogLevel): string {
    const colors: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.FATAL]: '\x1b[35m'  // Magenta
    };
    const reset = '\x1b[0m';
    return `${colors[level]}${level.toUpperCase()}${reset}`;
  }

  /**
   * Log entry to file
   */
  private async logToFile(entry: LogEntry): Promise<void> {
    const logLine = JSON.stringify(entry) + '\n';

    try {
      // Write to main log file
      if (this.logFilePath) {
        await fs.appendFile(this.logFilePath, logLine);
      }

      // Also write errors to separate error log
      if (
        (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) &&
        this.errorLogFilePath
      ) {
        await fs.appendFile(this.errorLogFilePath, logLine);
      }
    } catch (error) {
      console.error(`Failed to write log to file: ${error}`);
    }
  }

  /**
   * Serialize error to ErrorInfo structure
   */
  private serializeError(error: Error): ErrorInfo {
    const errorInfo: ErrorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };

    // Add error code if available
    if (error instanceof BaseOrchestratorError) {
      errorInfo.code = error.code;
    }

    // Add cause if available
    if (error.cause && error.cause instanceof Error) {
      errorInfo.cause = this.serializeError(error.cause);
    }

    return errorInfo;
  }

  /**
   * Redact sensitive data from context
   * Prevents API keys, tokens, and credentials from being logged
   */
  private redactSensitiveData(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const redacted: any = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      const lowerKey = key.toLowerCase();

      // Check if this field contains sensitive data
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
        lowerKey === 'credentials' ||
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
   * Rotate old log files
   * Delete logs older than retention period
   */
  private async rotateOldLogs(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.logDir);
      const now = Date.now();
      const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        if (file.endsWith('.log')) {
          const filePath = path.join(this.config.logDir, file);
          const stats = await fs.stat(filePath);

          // Delete if older than retention period
          if (now - stats.mtimeMs > retentionMs) {
            await fs.unlink(filePath);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to rotate old logs: ${error}`);
    }
  }
}

/**
 * Global logger instance
 */
let globalLogger: Logger | undefined;

/**
 * Get or create global logger instance
 */
export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = new Logger();
    globalLogger.init().catch(err => {
      console.error(`Failed to initialize global logger: ${err}`);
    });
  }
  return globalLogger;
}

/**
 * Set custom global logger instance
 */
export function setLogger(logger: Logger): void {
  globalLogger = logger;
}

/**
 * Convenience functions using global logger
 */
export const logger = {
  debug: (message: string, context?: LogContext) => getLogger().debug(message, context),
  info: (message: string, context?: LogContext) => getLogger().info(message, context),
  warn: (message: string, context?: LogContext) => getLogger().warn(message, context),
  error: (message: string, error?: Error, context?: LogContext) =>
    getLogger().error(message, error, context),
  fatal: (message: string, error?: Error, context?: LogContext) =>
    getLogger().fatal(message, error, context)
};
