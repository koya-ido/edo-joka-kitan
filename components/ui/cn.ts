import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind CSS クラスを安全に結合・マージする */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
