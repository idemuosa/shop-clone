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
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?q=80&w=${width}&auto=format&fit=crop`;
  }
  if (url.includes('cloudinary.com')) {
      return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
  }
  return url;
}

export async function uploadToCloudinary(file: File | string): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

  if (!cloudName) {
    throw new Error("Cloudinary cloud name is not configured");
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to upload image to Cloudinary");
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
}
