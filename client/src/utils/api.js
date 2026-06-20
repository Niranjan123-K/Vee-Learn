import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        // Dispatch an event so authStore can clear its state
        window.dispatchEvent(new Event('auth:unauthorized'));
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
