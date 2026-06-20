import { create } from 'zustand';
import api from '../utils/api';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user } = res.data;
      set({ user, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed. Please try again.';
      return { success: false, message };
    }
  },

  register: async (data) => {
    try {
      const res = await api.post('/auth/register', data);
      const { user } = res.data;
      set({ user, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed. Please try again.';
      return { success: false, message };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout failed on backend:', err);
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  fetchUser: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user || res.data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await api.put('/auth/profile', data);
      set({ user: res.data.user || res.data });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Update failed.';
      return { success: false, message };
    }
  },
}));

// Listen for 401s from the API interceptor
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
  });
}

export default useAuthStore;
