// ============================================================================
// Centralized API Base and WebSocket configuration
// Automatically detects Local vs Cloud (Vercel/Render) environments
// ============================================================================

const DEFAULT_PROD_API = 'https://claim-assist-2mvb.onrender.com/api';
const DEFAULT_DEV_API = 'http://127.0.0.1:8000/api';

const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '0.0.0.0' ||
  window.location.hostname === ''
);

// If VITE_API_BASE_URL is explicitly set, use it. Otherwise, auto-route based on hostname.
const envApiUrl = import.meta.env.VITE_API_BASE_URL;
const rawApiUrl = (envApiUrl && envApiUrl.trim() !== '' 
  ? envApiUrl 
  : (isLocalhost ? DEFAULT_DEV_API : DEFAULT_PROD_API)
).trim().replace(/\/+$/, '');

// Auto-derive WebSocket URL from API URL if VITE_WS_URL is not explicitly configured
function deriveWsUrl(apiUrl) {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL.trim();
  }
  // Replace http/https with ws/wss and replace /api with /ws/live
  const wsProtocol = apiUrl.startsWith('https://') ? 'wss://' : 'ws://';
  const cleanHost = apiUrl.replace(/^https?:\/\//, '').replace(/\/api$/, '');
  return `${wsProtocol}${cleanHost}/ws/live`;
}

export const API_BASE_URL = rawApiUrl;
export const WS_URL = deriveWsUrl(rawApiUrl);

