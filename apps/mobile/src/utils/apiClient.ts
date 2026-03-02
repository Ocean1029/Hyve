/**
 * Mobile API client with 401 handling. Wraps createApiClient from @hyve/shared
 * and invokes onUnauthorized when a request returns 401, then rethrows.
 * Use this so expired sessions trigger logout and redirect to login.
 */
import { createApiClient, ApiError } from '@hyve/shared';

export type ApiClient = ReturnType<typeof createApiClient>;

/**
 * Creates an API client that calls onUnauthorized when any request returns 401.
 * AuthContext should pass logout as onUnauthorized to clear session and redirect.
 */
export function createMobileApiClient(
  baseUrl: string,
  getToken: () => Promise<string | null>,
  onUnauthorized: () => void | Promise<void>
): ApiClient {
  const client = createApiClient(baseUrl, getToken);

  async function wrapRequest<T>(
    fn: () => Promise<T>
  ): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        await onUnauthorized();
      }
      throw e;
    }
  }

  return {
    get: (path, options) =>
      wrapRequest(() => client.get(path, options)),
    post: (path, body, options) =>
      wrapRequest(() => client.post(path, body, options)),
    put: (path, body, options) =>
      wrapRequest(() => client.put(path, body, options)),
    patch: (path, body, options) =>
      wrapRequest(() => client.patch(path, body, options)),
    delete: (path, options) =>
      wrapRequest(() => client.delete(path, options)),
  };
}
