import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a raw string as a comma-separated number, preserving decimals */
export function formatAmountInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (parts.length > 2) return parts[0] + "." + parts[1];
  return parts.join(".");
}

/** Strip commas and parse to number */
export function parseAmountInput(value: string): number {
  return parseFloat(String(value).replace(/,/g, "")) || 0;
}
