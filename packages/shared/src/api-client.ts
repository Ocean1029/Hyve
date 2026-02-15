/**
 * Shared API client for Hyve web and mobile apps.
 * Supports both relative URLs (web) and absolute URLs (mobile).
 * Automatically attaches Bearer token when getToken is provided.
 */

export interface ApiClientOptions {
  baseUrl: string;
  getToken?: () => Promise<string | null>;
}

export interface ApiRequestOptions {
  signal?: AbortSignal;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Creates an API client with optional Bearer token support.
 * @param baseUrl - Base URL (empty string for web relative paths, or full URL for mobile)
 * @param getToken - Optional async function that returns the session token for Authorization header
 */
export function createApiClient(
  baseUrl: string,
  getToken?: () => Promise<string | null>
) {
  const base = baseUrl.replace(/\/$/, '');

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    const url = base ? `${base}${path}` : path;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (getToken) {
      const token = await getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const init: RequestInit = {
      method,
      headers,
      signal: options?.signal,
    };

    if (body !== undefined && body !== null && method !== 'GET') {
      init.body = JSON.stringify(body);
    }

    const res = await fetch(url, init);

    if (res.status === 401) {
      throw new ApiError('Unauthorized', 401);
    }

    if (!res.ok) {
      let errBody: unknown;
      try {
        errBody = await res.json();
      } catch {
        errBody = await res.text();
      }
      throw new ApiError(
        (errBody as { error?: string })?.error ?? res.statusText,
        res.status,
        errBody
      );
    }

    const text = await res.text();
    if (!text) {
      return undefined as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ApiError('Invalid JSON response', res.status, text);
    }
  }

  return {
    get: <T>(path: string, options?: ApiRequestOptions) =>
      request<T>('GET', path, undefined, options),

    post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
      request<T>('POST', path, body, options),

    put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
      request<T>('PUT', path, body, options),

    patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
      request<T>('PATCH', path, body, options),

    delete: <T>(path: string, options?: ApiRequestOptions) =>
      request<T>('DELETE', path, undefined, options),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
