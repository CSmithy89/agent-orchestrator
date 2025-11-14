import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseAPI, APIErrorClass } from './client';

describe('BaseAPI', () => {
  let api: BaseAPI;

  beforeEach(() => {
    api = new BaseAPI('http://localhost:3000');
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should make a GET request and return data', async () => {
      const mockData = { success: true, data: { id: '1', name: 'Test' } };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.get('/test');

      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/test', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should include auth token in headers if available', async () => {
      localStorage.setItem('auth_token', 'test-token');
      const mockData = { success: true, data: {} };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      await api.get('/test');

      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
      });
    });

    it('should throw APIErrorClass on error response', async () => {
      const mockError = { error: 'NotFound', message: 'Resource not found' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => mockError,
      });

      await expect(api.get('/test')).rejects.toThrow(APIErrorClass);
    });
  });

  describe('post', () => {
    it('should make a POST request with data', async () => {
      const mockData = { success: true, data: { id: '1' } };
      const postData = { name: 'Test' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.post('/test', postData);

      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
    });
  });

  describe('patch', () => {
    it('should make a PATCH request with data', async () => {
      const mockData = { success: true, data: { id: '1' } };
      const patchData = { name: 'Updated' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.patch('/test/1', patchData);

      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/test/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchData),
      });
    });
  });

  describe('delete', () => {
    it('should make a DELETE request', async () => {
      const mockData = { success: true, data: null };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.delete('/test/1');

      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/test/1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('error handling', () => {
    it('should handle 401 and clear token', async () => {
      localStorage.setItem('auth_token', 'test-token');
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized', message: 'Invalid token' }),
      });

      // Mock window.location
      delete (window as any).location;
      window.location = { href: '/', pathname: '/dashboard' } as any;

      await expect(api.get('/test')).rejects.toThrow(APIErrorClass);
      expect(localStorage.getItem('auth_token')).toBeNull();
    });

    it('should create generic error if JSON parsing fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(api.get('/test')).rejects.toThrow('HTTP 500: Internal Server Error');
    });
  });
});
