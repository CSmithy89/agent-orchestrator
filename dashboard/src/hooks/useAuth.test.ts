import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with no user', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should login with token and user', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.login('test-token', { id: '1', username: 'testuser' });
    });

    expect(result.current.token).toBe('test-token');
    expect(result.current.user).toEqual({ id: '1', username: 'testuser' });
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('auth_token')).toBe('test-token');
  });

  it('should logout and clear token', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.login('test-token', { id: '1', username: 'testuser' });
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('should set token', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setToken('new-token');
    });

    expect(result.current.token).toBe('new-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('auth_token')).toBe('new-token');
  });
});
