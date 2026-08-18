// ============================================================================
// Centralized API Base and WebSocket configuration
// Supports local development and production cloud deployment (Render/Railway/Vercel)
// ============================================================================

const rawApiUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').trim().replace(/\/+$/, '');

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
