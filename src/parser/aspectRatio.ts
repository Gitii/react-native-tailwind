/**
 * Aspect ratio utilities for React Native
 * Uses aspectRatio style property (React Native 0.71+)
 */

import type { StyleObject } from "../types";

/**
 * Preset aspect ratios
 */
const ASPECT_RATIO_PRESETS: Record<string, number | undefined> = {
  "aspect-auto": undefined, // Remove aspect ratio
  "aspect-square": 1, // 1:1
  "aspect-video": 16 / 9, // 16:9
};

/**
 * Parse arbitrary aspect ratio value: aspect-[4/3]
 * @param value - Arbitrary value string (e.g., "[4/3]", "[16/9]")
 * @returns Aspect ratio number or null
 */
function parseArbitraryAspectRatio(value: string): number | null {
  const match = value.match(/^\[(\d+)\/(\d+)\]$/);
  if (match) {
    const numerator = Number.parseInt(match[1], 10);
    const denominator = Number.parseInt(match[2], 10);

    if (denominator === 0) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[react-native-tailwind] Invalid aspect ratio: ${value}. Denominator cannot be zero.`);
      }
      return null;
    }

    return numerator / denominator;
  }

  return null;
}

/**
 * Parse aspect ratio classes
 * @param cls - Class name to parse
 * @returns Style object or null if not an aspect ratio class
 */
export function parseAspectRatio(cls: string): StyleObject | null {
  if (!cls.startsWith("aspect-")) {
    return null;
  }

  // Check for preset values
  if (cls in ASPECT_RATIO_PRESETS) {
    const aspectRatio = ASPECT_RATIO_PRESETS[cls];
    // aspect-auto removes the aspect ratio constraint by returning empty object
    // (this effectively unsets the aspectRatio property)
    if (aspectRatio === undefined) {
      return {};
    }
    return { aspectRatio };
  }

  // Check for arbitrary values: aspect-[4/3]
  const arbitraryValue = cls.substring(7); // Remove "aspect-"
  const aspectRatio = parseArbitraryAspectRatio(arbitraryValue);
  if (aspectRatio !== null) {
    return { aspectRatio };
  }

  return null;
}

// Export presets for testing/advanced usage
export { ASPECT_RATIO_PRESETS };
