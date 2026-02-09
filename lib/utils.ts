import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateShortId(length = 8) {
  // Simple alphanumeric random string
  return Math.random().toString(36).substring(2, 2 + length);
}
