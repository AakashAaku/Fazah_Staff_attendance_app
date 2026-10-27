/**
 * Fazah Auto Garage - Network & Public IP Verification Service
 * Static Garage Public IP: 2.50.2.51
 * 
 * Punch In / Punch Out is strictly restricted to staff connected
 * to the garage premises broadband / Wi-Fi (IP: 2.50.2.51).
 */

import { buildApiUrl } from './api';

export const GARAGE_STATIC_IP = '2.50.2.51';

export interface IpCheckResult {
  ip: string;
  isGarage: boolean;
  source: 'ipify' | 'ipify64' | 'backend' | 'localhost' | 'failed';
}

/**
 * Detects the client's public IP address via reliable external and backend fallbacks.
 */
export async function detectPublicIp(): Promise<IpCheckResult> {
  // 1. Localhost / Local Development bypass for testing
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return {
        ip: '127.0.0.1 (Local Dev)',
        isGarage: true,
        source: 'localhost'
      };
    }
  }

  // 2. Primary: ipify IPv4 (global fast CDN, CORS-enabled, HTTPS)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const ip = (data.ip || '').trim();
      if (ip) {
        return {
          ip,
          isGarage: ip === GARAGE_STATIC_IP,
          source: 'ipify'
        };
      }
    }
  } catch (_) {}

  // 3. Secondary: api64.ipify.org fallback
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://api64.ipify.org?format=json', {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const ip = (data.ip || '').trim();
      if (ip) {
        return {
          ip,
          isGarage: ip === GARAGE_STATIC_IP,
          source: 'ipify64'
        };
      }
    }
  } catch (_) {}

  // 4. Tertiary: Live Render backend /api/kiosk/client-ip
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(buildApiUrl('/api/kiosk/client-ip'), {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const ip = (data.ip || '').trim();
      return {
        ip,
        isGarage: Boolean(data.isGarageIp ?? (ip === GARAGE_STATIC_IP)),
        source: 'backend'
      };
    }
  } catch (_) {}

  return {
    ip: 'Unknown',
    isGarage: false,
    source: 'failed'
  };
}
