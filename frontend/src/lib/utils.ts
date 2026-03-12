import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Safe date formatting utility
export function formatDate(dateValue: string | Date | null | undefined, fallback: string = "N/A"): string {
  if (!dateValue) return fallback;
  
  try {
    const date = new Date(dateValue);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', dateValue);
      return fallback;
    }
    return date.toLocaleDateString();
  } catch (error) {
    console.warn('Error parsing date:', dateValue, error);
    return fallback;
  }
}

// Safe date difference calculation
export function getDaysDifference(dateValue: string | Date | null | undefined, fromDate: Date = new Date()): number {
  if (!dateValue) return 0;
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 0;
    
    const diffTime = date.getTime() - fromDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.warn('Error calculating date difference:', dateValue, error);
    return 0;
  }
}
