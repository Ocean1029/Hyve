/**
 * Image upload utility for mobile. Uses FormData and Bearer token.
 */
import { API_PATHS } from '@hyve/shared';

const apiUrl = (process.env.EXPO_PUBLIC_API_URL as string) || 'http://localhost:3000';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Uploads an image file to the backend. Requires session token.
 */
export async function uploadImage(
  uri: string,
  token: string
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: 'image.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const res = await fetch(`${apiUrl}${API_PATHS.UPLOAD}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    return {
      success: false,
      error: (data as { error?: string }).error ?? 'Upload failed',
    };
  }
  return {
    success: (data as { success?: boolean }).success ?? false,
    url: (data as { url?: string }).url,
    error: (data as { error?: string }).error,
  };
}
