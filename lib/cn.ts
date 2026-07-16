import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// The shadcn/ui class-name helper: `clsx` for conditional classes, `tailwind-merge` to
// resolve conflicts (a later `px-4` beats an earlier `px-2`). Framework-free, lives in lib/.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
