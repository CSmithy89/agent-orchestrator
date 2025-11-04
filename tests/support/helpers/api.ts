import { APIRequestContext } from '@playwright/test';

/**
 * API Helper utilities for backend testing
 * 
 * Provides common patterns for API testing including:
 * - Authentication helpers
 * - Response validation
 * - Error handling
 */

export class ApiHelper {
  constructor(private request: APIRequestContext) {}

  /**
   * Make authenticated API request
   * @param endpoint - API endpoint path
   * @param options - Request options
   */
  async authenticatedRequest(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      data?: any;
      token?: string;
    } = {}
  ) {
    const { method = 'GET', data, token } = options;
    
    return this.request.fetch(endpoint, {
      method,
      data,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Validate API response structure
   * @param response - Response object
   * @param expectedStatus - Expected HTTP status code
   */
  async validateResponse(response: any, expectedStatus = 200) {
    const body = await response.json();
    
    return {
      ok: response.ok(),
      status: response.status(),
      body,
      isValid: response.status() === expectedStatus,
    };
  }
}
