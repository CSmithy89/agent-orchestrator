import type { APIError } from './types';

/**
 * Custom error class for API errors
 */
export class APIErrorClass extends Error {
  constructor(
    public status: number,
    public error: APIError
  ) {
    super(error.message);
    this.name = 'APIError';
  }
}

/**
 * Base API client class with fetch wrapper and authentication
 */
export class BaseAPI {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }

  /**
   * Get the JWT token from localStorage
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Build headers with authentication and content type
   */
  private buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: APIError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          error: 'UnknownError',
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Handle 401 Unauthorized - clear token and redirect to login
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        // Redirect to login page if it exists
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      throw new APIErrorClass(response.status, errorData);
    }

    return response.json();
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.buildHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.buildHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.buildHeaders(),
    });

    return this.handleResponse<T>(response);
  }
}

// Create a singleton instance
export const baseApi = new BaseAPI();
