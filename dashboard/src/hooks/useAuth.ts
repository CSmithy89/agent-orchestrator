import { useAuthStore } from '@/store/authStore';

/**
 * Hook to access authentication state and actions
 */
export function useAuth() {
  const { token, user, isAuthenticated, login, logout, setToken } = useAuthStore();

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
    setToken,
  };
}
