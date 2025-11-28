/**
 * Sizing utilities (width, height, min/max)
 */

import { RUNTIME_DIMENSIONS_MARKER } from "../config/markers";
import type { StyleObject } from "../types";

// Size scale (in pixels/percentages)
export const SIZE_SCALE: Record<string, number> = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
};

export const SIZE_PERCENTAGES: Record<string, string> = {
  full: "100%",
  "1/2": "50%",
  "1/3": "33.333333%",
  "2/3": "66.666667%",
  "1/4": "25%",
  "2/4": "50%",
  "3/4": "75%",
  "1/5": "20%",
  "2/5": "40%",
  "3/5": "60%",
  "4/5": "80%",
  "1/6": "16.666667%",
  "2/6": "33.333333%",
  "3/6": "50%",
  "4/6": "66.666667%",
  "5/6": "83.333333%",
};

/**
 * Parse arbitrary size value: [123px], [50%], [10rem]
 * Returns number for px values, string for % values, null for unsupported units
 */
function parseArbitrarySize(value: string): number | string | null {
  // Match: [123px] or [123] (pixels)
  const pxMatch = value.match(/^\[(\d+)(?:px)?\]$/);
  if (pxMatch) {
    return parseInt(pxMatch[1], 10);
  }

  // Match: [50%] (percentage)
  const percentMatch = value.match(/^\[(\d+(?:\.\d+)?)%\]$/);
  if (percentMatch) {
    return `${percentMatch[1]}%`;
  }

  // Unsupported units (rem, em, vh, vw, etc.) - warn and reject
  if (value.startsWith("[") && value.endsWith("]")) {
    /* v8 ignore next 5 */
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[react-native-tailwind] Unsupported arbitrary size unit: ${value}. Only px and % are supported.`,
      );
    }
    return null;
  }

  return null;
}

/**
 * Parse sizing classes
 * @param cls - The class name to parse
 * @param customSpacing - Optional custom spacing values from tailwind.config (shared with spacing utilities)
 */
export function parseSizing(cls: string, customSpacing?: Record<string, number>): StyleObject | null {
  // Merge custom spacing with defaults (custom takes precedence)
  const sizeMap = customSpacing ? { ...SIZE_SCALE, ...customSpacing } : SIZE_SCALE;

  // Width
  if (cls.startsWith("w-")) {
    const sizeKey = cls.substring(2);

    // Screen width (requires runtime hook)
    if (sizeKey === "screen") {
      return { width: `${RUNTIME_DIMENSIONS_MARKER}width}}` } as StyleObject;
    }

    // Arbitrary values: w-[123px], w-[50%] (highest priority)
    const arbitrarySize = parseArbitrarySize(sizeKey);
    if (arbitrarySize !== null) {
      return { width: arbitrarySize };
    }

    // Percentage widths: w-full, w-1/2, etc.
    const percentage = SIZE_PERCENTAGES[sizeKey];
    if (percentage) {
      return { width: percentage };
    }

    // Numeric widths: w-4, w-8, etc. (includes custom spacing)
    const numericSize = sizeMap[sizeKey];
    if (numericSize !== undefined) {
      return { width: numericSize };
    }

    // Special values
    if (sizeKey === "auto") {
      return { width: "auto" };
    }
  }

  // Height
  if (cls.startsWith("h-")) {
    const sizeKey = cls.substring(2);

    // Screen height (requires runtime hook)
    if (sizeKey === "screen") {
      return { height: `${RUNTIME_DIMENSIONS_MARKER}height}}` } as StyleObject;
    }

    // Arbitrary values: h-[123px], h-[50%] (highest priority)
    const arbitrarySize = parseArbitrarySize(sizeKey);
    if (arbitrarySize !== null) {
      return { height: arbitrarySize };
    }

    // Percentage heights: h-full, h-1/2, etc.
    const percentage = SIZE_PERCENTAGES[sizeKey];
    if (percentage) {
      return { height: percentage };
    }

    // Numeric heights: h-4, h-8, etc. (includes custom spacing)
    const numericSize = sizeMap[sizeKey];
    if (numericSize !== undefined) {
      return { height: numericSize };
    }

    // Special values
    if (sizeKey === "auto") {
      return { height: "auto" };
    }
  }

  // Min width
  if (cls.startsWith("min-w-")) {
    const sizeKey = cls.substring(6);

    // Arbitrary values: min-w-[123px], min-w-[50%] (highest priority)
    const arbitrarySize = parseArbitrarySize(sizeKey);
    if (arbitrarySize !== null) {
      return { minWidth: arbitrarySize };
    }

    const percentage = SIZE_PERCENTAGES[sizeKey];
    if (percentage) {
      return { minWidth: percentage };
    }

    const numericSize = sizeMap[sizeKey];
    if (numericSize !== undefined) {
      return { minWidth: numericSize };
    }
  }

  // Min height
  if (cls.startsWith("min-h-")) {
    const sizeKey = cls.substring(6);

    // Arbitrary values: min-h-[123px], min-h-[50%] (highest priority)
    const arbitrarySize = parseArbitrarySize(sizeKey);
    if (arbitrarySize !== null) {
      return { minHeight: arbitrarySize };
    }

    const percentage = SIZE_PERCENTAGES[sizeKey];
    if (percentage) {
      return { minHeight: percentage };
    }

    const numericSize = sizeMap[sizeKey];
    if (numericSize !== undefined) {
      return { minHeight: numericSize };
    }
  }

  // Max width
  if (cls.startsWith("max-w-")) {
    const sizeKey = cls.substring(6);

    // Arbitrary values: max-w-[123px], max-w-[50%] (highest priority)
    const arbitrarySize = parseArbitrarySize(sizeKey);
    if (arbitrarySize !== null) {
      return { maxWidth: arbitrarySize };
    }

    const percentage = SIZE_PERCENTAGES[sizeKey];
    if (percentage) {
      return { maxWidth: percentage };
    }

    const numericSize = sizeMap[sizeKey];
    if (numericSize !== undefined) {
      return { maxWidth: numericSize };
    }
  }

  // Max height
  if (cls.startsWith("max-h-")) {
    const sizeKey = cls.substring(6);

    // Arbitrary values: max-h-[123px], max-h-[50%] (highest priority)
    const arbitrarySize = parseArbitrarySize(sizeKey);
    if (arbitrarySize !== null) {
      return { maxHeight: arbitrarySize };
    }

    const percentage = SIZE_PERCENTAGES[sizeKey];
    if (percentage) {
      return { maxHeight: percentage };
    }

    const numericSize = sizeMap[sizeKey];
    if (numericSize !== undefined) {
      return { maxHeight: numericSize };
    }
  }

  return null;
}
