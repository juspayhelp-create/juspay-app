/**
 * Client-side Device Fingerprinting Utility
 * Computes deterministic device signals and maintains persistent tokens for multi-account detection.
 */
import { DeviceFingerprintData, DeviceFingerprintComponents } from '../types';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).toUpperCase();
}

function getCanvasHash(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'canvas-disabled';

    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial', sans-serif";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Juspay Security Shield 2026', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Fingerprint Hash Alpha', 4, 17);

    const dataUrl = canvas.toDataURL();
    return simpleHash(dataUrl);
  } catch {
    return 'canvas-restricted';
  }
}

function getPersistentDeviceToken(): string {
  try {
    const STORAGE_KEY = 'juspay_sec_device_token_v1';
    let token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
      // Generate a persistent UUID-like token
      const randomPart = Math.random().toString(36).substring(2, 10);
      const timePart = Date.now().toString(36);
      token = `DVT-${timePart}-${randomPart}`.toUpperCase();
      localStorage.setItem(STORAGE_KEY, token);
    }
    return token;
  } catch {
    return 'DVT-LOCAL-FALLBACK';
  }
}

export async function getDeviceFingerprint(): Promise<DeviceFingerprintData> {
  const components: DeviceFingerprintComponents = {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown Agent',
    platform: typeof navigator !== 'undefined' ? (navigator.platform || 'Unknown Platform') : 'Platform',
    screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '1920x1080',
    colorDepth: typeof window !== 'undefined' ? window.screen.colorDepth : 24,
    timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Kolkata',
    language: typeof navigator !== 'undefined' ? (navigator.language || 'en-US') : 'en-US',
    hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 4,
    touchSupport: typeof navigator !== 'undefined' ? ('ontouchstart' in window || navigator.maxTouchPoints > 0) : false,
    canvasHash: getCanvasHash(),
  };

  const persistentToken = getPersistentDeviceToken();

  // Deterministic Fingerprint Key calculation
  const compositeString = [
    components.platform,
    components.screenResolution,
    components.colorDepth,
    components.timezone,
    components.language,
    components.canvasHash,
    persistentToken
  ].join('||');

  const visitorId = `FP-${simpleHash(compositeString)}-${simpleHash(persistentToken)}`.toUpperCase();

  return {
    visitorId,
    components,
    persistentToken,
    createdAt: new Date().toISOString()
  };
}

export function parseDeviceLabel(components: DeviceFingerprintComponents): string {
  const ua = components.userAgent;
  let browser = 'Browser';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';

  let os = 'Device';
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
  else if (ua.includes('Windows NT')) os = 'Windows PC';
  else if (ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android Phone';
  else if (ua.includes('iPhone')) os = 'iPhone';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${os} · ${browser} (${components.screenResolution})`;
}
