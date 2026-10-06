export const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // If we're in production and no API URL is provided,
  // assume the API is at the same origin
  if (import.meta.env.PROD) {
    return window.location.origin;
  }

  // Default to localhost for development
  return 'http://localhost:3000';
};

export const API_URL = getApiUrl();

// Direct access to Python backend if needed; defaults to API_URL so requests route through Express gateway proxy
export const getPythonApiUrl = () => {
  const envUrl = import.meta.env.VITE_PYTHON_API_URL;
  if (!envUrl || envUrl === 'http://localhost:8000') {
    return API_URL;
  }
  return envUrl;
};

export const PYTHON_API_URL = getPythonApiUrl();

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
