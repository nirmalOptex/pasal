import axios from 'axios';

// In production: set VITE_API_URL in environment or apps/web/.env.production
// Example: https://chhiyapasal-api.onrender.com OR https://chhiyapasal-api.onrender.com/api/v1
// In development: falls back to /api/v1 so the Vite proxy handles routing to localhost:4000
const rawApiUrl = import.meta.env.VITE_API_URL;
const baseURL = rawApiUrl
  ? (rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl.replace(/\/+$/, '')}/api/v1`)
  : '/api/v1';

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
