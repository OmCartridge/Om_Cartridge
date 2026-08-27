// Central API base URL configuration
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
export const SERVER_BASE = API_BASE.replace('/api', '');

/**
 * Build a direct server URL (for PDF download, etc.)
 */
export const serverUrl = (path) => `${SERVER_BASE}${path}`;
