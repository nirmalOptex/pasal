import axios from 'axios';

// In production: set VITE_API_URL in environment or apps/web/.env.production
// Example: https://chhiyapasal-api.onrender.com OR https://chhiyapasal-api.onrender.com/api/v1
// In development: falls back to /api/v1 so the Vite proxy handles routing to localhost:4000
const rawApiUrl = import.meta.env.VITE_API_URL;
const baseURL = rawApiUrl
  ? (rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl.replace(/\/+$/, '')}/api/v1`)
  : '/api/v1';

export const api = axios.create({ baseURL });

export function getTenantSlug(): string | null {
  if (typeof window === 'undefined') return null;

  const hostname = window.location.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname === '127.0.0.1') return null;

  const configuredBaseDomain = (import.meta.env.VITE_TENANT_BASE_DOMAIN || '').toLowerCase().replace(/^\./, '');
  if (configuredBaseDomain && hostname.endsWith(`.${configuredBaseDomain}`)) {
    return hostname.slice(0, -(configuredBaseDomain.length + 1));
  }

  if (hostname.endsWith('.localhost')) {
    return hostname.slice(0, -'.localhost'.length);
  }

  if (hostname.endsWith('.vercel.app')) {
    // The base Vercel deployment hostname is not a tenant subdomain.
    // Tenant subdomains require a custom wildcard domain.
    return null;
  }

  return null;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const branchId = localStorage.getItem('branchId');
  if (branchId) {
    config.headers['x-branch-id'] = branchId;
  }
  const tenantSlug = getTenantSlug();
  if (tenantSlug) {
    config.headers['x-tenant-slug'] = tenantSlug;
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
