import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  const result = clsx(inputs);
  if (!result || typeof result !== 'string') return "";
  return twMerge(result);
}
