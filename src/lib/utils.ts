import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  const result = clsx(inputs);
  if (!result || typeof result !== 'string') return "";
  return twMerge(result);
}

export function getOptimizedImageUrl(url: string, width: number = 800) {
  if (!url) return '';
  if (url.includes('unsplash.com')) {
    // Unsplash allows resizing via query params. Removing existing params first.
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?q=80&w=${width}&auto=format&fit=crop`;
  }
  return url;
}
