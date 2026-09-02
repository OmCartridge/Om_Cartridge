// Central API base URL configuration
export const API_BASE = import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost')
  ? import.meta.env.VITE_API_URL
  : '/api';

export const SERVER_BASE = API_BASE.replace(/\/api$/, '');

/**
 * Build a direct server URL (for PDF download, static files, etc.)
 */
export const serverUrl = (path) => `${SERVER_BASE}${path}`;
