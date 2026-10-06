export const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }

  return '';
};

export const API_URL = getApiUrl();

// Direct access to Python backend if needed, defaulting to API_URL so requests route through Express proxy if Python URL not specified
export const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || API_URL;

/**
 * Safely parses API responses, handling both valid JSON and non-JSON text/HTML error responses.
 */
export async function handleApiResponse<T = any>(response: Response): Promise<T> {
  const text = await response.text();
  let data: any = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMessage =
      data?.message ||
      data?.error ||
      (typeof data === 'string' ? data : null) ||
      (text && !text.trim().startsWith('<') ? text.trim() : null) ||
      `Server error (${response.status})`;
    throw new Error(errorMessage);
  }

  if (data !== null) {
    return data as T;
  }

  return { success: response.ok } as unknown as T;
}
