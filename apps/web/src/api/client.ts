import axios from 'axios';

// In production: set VITE_API_URL in apps/web/.env.production
// In development: falls back to /api/v1 so the Vite proxy handles routing to localhost:4000
const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const branchId = localStorage.getItem('branchId');
  if (branchId) {
    config.headers['x-branch-id'] = branchId;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // If unauthorized, clear tokens
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-logout'));
    }
    return Promise.reject(error);
  }
);
