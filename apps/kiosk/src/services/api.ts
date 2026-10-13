/**
 * Fazah Auto Garage - Centralized API Service
 * Handles dynamic API routing (Localhost, Netlify Proxy, Custom Cloud Backend)
 */

const STORAGE_KEY = 'fazah_custom_api_url';

export function getCustomApiUrl(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setCustomApiUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = url.trim().replace(/\/+$/, ''); // remove trailing slash
  if (trimmed) {
    localStorage.setItem(STORAGE_KEY, trimmed);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getApiBaseUrl(): string {
  // 1. Manually specified custom backend URL in UI
  const custom = getCustomApiUrl();
  if (custom) return custom;

  // 2. Vite Environment Variable (e.g. VITE_API_URL set in Netlify Environment)
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return (envUrl as string).trim().replace(/\/+$/, '');
  }

  // 3. Fallback to relative '' (works with Netlify _redirects or Vite local proxy)
  return '';
}

export function buildApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (base) {
    // If base doesn't end with /api and cleanPath starts with /api
    if (base.endsWith('/api') && cleanPath.startsWith('/api/')) {
      return `${base}${cleanPath.substring(4)}`;
    }
    return `${base}${cleanPath}`;
  }

  return cleanPath;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = buildApiUrl(endpoint);
  return fetch(url, options);
}

export interface HealthCheckResult {
  connected: boolean;
  latencyMs: number;
  message?: string;
  url: string;
}

export async function checkApiHealth(): Promise<HealthCheckResult> {
  const start = Date.now();
  const endpoint = buildApiUrl('/api/health');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    
    // First try /api/health
    let res = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeout);

    // If /api/health is 404, fallback test /api/kiosk/employees
    if (!res.ok && res.status === 404) {
      const fallbackUrl = buildApiUrl('/api/kiosk/employees');
      res = await fetch(fallbackUrl);
    }

    const latencyMs = Date.now() - start;
    if (res.ok) {
      return { connected: true, latencyMs, url: endpoint };
    }
    return { connected: false, latencyMs, message: `HTTP ${res.status}`, url: endpoint };
  } catch (err: any) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      message: err.name === 'AbortError' ? 'Connection timed out' : (err.message || 'Network error'),
      url: endpoint,
    };
  }
}
