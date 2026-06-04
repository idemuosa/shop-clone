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

// Direct access to Python/Django backend if needed
export const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000';
