/**
 * API base URL for backend. Must be absolute (http/https).
 * Relative URLs resolve to Metro (exp://) and fail.
 */
const DEFAULT_API_URL = 'http://localhost:3000';

export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL;
  if (typeof raw === 'string' && raw.startsWith('http')) {
    return raw.replace(/\/$/, '');
  }
  return DEFAULT_API_URL;
}
