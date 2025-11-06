/**
 * Health check endpoint for monitoring orchestrator status
 * Provides system health, component status, and basic diagnostics
 */

import * as os from 'os';

import { logger } from '../utils/logger.js';

/**
 * Overall health status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Component health status
 */
export type ComponentStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  projects?: {
    active: number;
    errored: number;
  };
  checks: {
    llm_api: ComponentStatus;
    git: ComponentStatus;
    disk_space: ComponentStatus;
    memory: ComponentStatus;
  };
  details?: {
    memory: {
      usage: number;
      limit: number;
      percentage: number;
    };
    disk: {
      available: number;
      total: number;
      percentage: number;
    };
  };
}

/**
 * Health check cache
 */
interface HealthCheckCache {
  response: HealthCheckResponse;
  timestamp: number;
}

/**
 * Cache duration in milliseconds (60 seconds)
 */
const CACHE_DURATION = 60 * 1000;

/**
 * Health check cache
 */
let healthCheckCache: HealthCheckCache | undefined;

/**
 * Perform health check
 * @param skipCache Skip cached result and perform fresh check
 * @returns Health check response
 */
export async function performHealthCheck(skipCache: boolean = false): Promise<HealthCheckResponse> {
  // Return cached result if available and fresh
  if (!skipCache && healthCheckCache) {
    const age = Date.now() - healthCheckCache.timestamp;
    if (age < CACHE_DURATION) {
      return healthCheckCache.response;
    }
  }

  // Perform health checks
  const checks = {
    llm_api: await checkLLMAPI(),
    git: await checkGit(),
    disk_space: await checkDiskSpace(),
    memory: await checkMemory()
  };

  // Get system details
  const memoryDetails = await getMemoryDetails();
  const diskDetails = await getDiskDetails();

  // Determine overall status
  const status = determineOverallStatus(checks);

  const response: HealthCheckResponse = {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
    details: {
      memory: memoryDetails,
      disk: diskDetails
    }
  };

  // Cache result
  healthCheckCache = {
    response,
    timestamp: Date.now()
  };

  return response;
}

/**
 * Check LLM API connectivity
 * Note: This is a basic check - actual API calls would require credentials
 */
async function checkLLMAPI(): Promise<ComponentStatus> {
  try {
    // Check if API keys are configured
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

    if (!hasAnthropicKey && !hasOpenAIKey) {
      logger.warn('No LLM API keys configured');
      return 'unhealthy';
    }

    // Could perform actual API ping here
    // For now, just check if keys are present
    return 'healthy';
  } catch (error) {
    logger.error('LLM API health check failed', error as Error);
    return 'unhealthy';
  }
}

/**
 * Check git availability
 */
async function checkGit(): Promise<ComponentStatus> {
  try {
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);

    // Run git --version to check if git is available
    await execFileAsync('git', ['--version']);
    return 'healthy';
  } catch (error) {
    logger.error('Git health check failed', error as Error);
    return 'unhealthy';
  }
}

/**
 * Check disk space
 */
async function checkDiskSpace(): Promise<ComponentStatus> {
  try {
    const diskDetails = await getDiskDetails();

    // Unhealthy if less than 1GB available
    if (diskDetails.available < 1024 * 1024 * 1024) {
      return 'unhealthy';
    }

    // Degraded if less than 5GB available or >90% used
    if (diskDetails.available < 5 * 1024 * 1024 * 1024 || diskDetails.percentage > 90) {
      return 'degraded';
    }

    return 'healthy';
  } catch (error) {
    logger.error('Disk space health check failed', error as Error);
    return 'unhealthy';
  }
}

/**
 * Check memory usage
 */
async function checkMemory(): Promise<ComponentStatus> {
  try {
    const memoryDetails = await getMemoryDetails();

    // Unhealthy if >95% memory used
    if (memoryDetails.percentage > 95) {
      return 'unhealthy';
    }

    // Degraded if >90% memory used
    if (memoryDetails.percentage > 90) {
      return 'degraded';
    }

    return 'healthy';
  } catch (error) {
    logger.error('Memory health check failed', error as Error);
    return 'unhealthy';
  }
}

/**
 * Get memory usage details
 */
async function getMemoryDetails(): Promise<{
  usage: number;
  limit: number;
  percentage: number;
}> {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const percentage = (usedMemory / totalMemory) * 100;

  return {
    usage: usedMemory,
    limit: totalMemory,
    percentage: Math.round(percentage * 100) / 100
  };
}

/**
 * Get disk space details
 * Note: This is a simplified implementation
 * For production, consider using a library like 'check-disk-space'
 */
async function getDiskDetails(): Promise<{
  available: number;
  total: number;
  percentage: number;
}> {
  try {
    // Try to get disk space using df command (Unix/Linux/macOS)
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);

    const { stdout } = await execFileAsync('df', ['-k', '.']);
    const lines = stdout.trim().split('\n');

    if (lines.length >= 2) {
      const parts = lines[1]?.split(/\s+/) ?? [];
      const total = parseInt(parts[1] ?? '0') * 1024; // Convert KB to bytes
      const used = parseInt(parts[2] ?? '0') * 1024;
      const available = parseInt(parts[3] ?? '0') * 1024;

      if (isNaN(total) || isNaN(used) || isNaN(available)) {
        throw new Error('Failed to parse df output');
      }

      const percentage = total > 0 ? (used / total) * 100 : 0;

      return {
        available,
        total,
        percentage: Math.round(percentage * 100) / 100
      };
    }
  } catch (error) {
    logger.warn('Could not get disk space details', { error });
  }

  // Fallback: return dummy values
  return {
    available: 0,
    total: 0,
    percentage: 0
  };
}

/**
 * Determine overall health status from component checks
 */
function determineOverallStatus(checks: Record<string, ComponentStatus>): HealthStatus {
  const values = Object.values(checks);

  // If any component is unhealthy, overall is unhealthy
  if (values.some(v => v === 'unhealthy')) {
    return 'unhealthy';
  }

  // If any component is degraded, overall is degraded
  if (values.some(v => v === 'degraded')) {
    return 'degraded';
  }

  // All components healthy
  return 'healthy';
}

/**
 * Get HTTP status code for health status
 */
export function getStatusCode(status: HealthStatus): number {
  switch (status) {
    case 'healthy':
      return 200;
    case 'degraded':
      return 200; // Still operational
    case 'unhealthy':
      return 503; // Service unavailable
    default:
      return 500;
  }
}

/**
 * Express/Fastify compatible health check handler
 * This is a generic handler that can be adapted to any HTTP framework
 */
export async function healthCheckHandler(): Promise<{
  statusCode: number;
  body: HealthCheckResponse;
}> {
  const response = await performHealthCheck();
  const statusCode = getStatusCode(response.status);

  return {
    statusCode,
    body: response
  };
}

/**
 * Clear health check cache (useful for testing)
 */
export function clearHealthCheckCache(): void {
  healthCheckCache = undefined;
}
