/**
 * Spacing utilities (margin, padding, gap)
 */

import type { StyleObject } from "../types";

// Tailwind spacing scale (in pixels, converted to React Native units)
export const SPACING_SCALE: Record<string, number> = {
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

/**
 * Parse arbitrary spacing value: [16px], [20]
 * Returns number for px values, null for unsupported formats
 */
function parseArbitrarySpacing(value: string): number | null {
  // Match: [16px] or [16] (pixels only)
  const pxMatch = value.match(/^\[(\d+)(?:px)?\]$/);
  if (pxMatch) {
    return parseInt(pxMatch[1], 10);
  }

  // Warn about unsupported formats
  if (value.startsWith("[") && value.endsWith("]")) {
    /* v8 ignore next 5 */
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[react-native-tailwind] Unsupported arbitrary spacing value: ${value}. Only px values are supported (e.g., [16px] or [16]).`,
      );
    }
    return null;
  }

  return null;
}

/**
 * Parse spacing classes (margin, padding, gap)
 * Examples: m-4, mx-2, mt-8, p-4, px-2, pt-8, gap-4, m-[16px]
 */
export function parseSpacing(cls: string): StyleObject | null {
  // Margin: m-4, mx-2, mt-8, m-[16px], etc.
  const marginMatch = cls.match(/^m([xytrbls]?)-(.+)$/);
  if (marginMatch) {
    const [, dir, valueStr] = marginMatch;

    // Try arbitrary value first
    const arbitraryValue = parseArbitrarySpacing(valueStr);
    if (arbitraryValue !== null) {
      return getMarginStyle(dir, arbitraryValue);
    }

    // Try preset scale
    const scaleValue = SPACING_SCALE[valueStr];
    if (scaleValue !== undefined) {
      return getMarginStyle(dir, scaleValue);
    }
  }

  // Padding: p-4, px-2, pt-8, p-[16px], etc.
  const paddingMatch = cls.match(/^p([xytrbls]?)-(.+)$/);
  if (paddingMatch) {
    const [, dir, valueStr] = paddingMatch;

    // Try arbitrary value first
    const arbitraryValue = parseArbitrarySpacing(valueStr);
    if (arbitraryValue !== null) {
      return getPaddingStyle(dir, arbitraryValue);
    }

    // Try preset scale
    const scaleValue = SPACING_SCALE[valueStr];
    if (scaleValue !== undefined) {
      return getPaddingStyle(dir, scaleValue);
    }
  }

  // Gap: gap-4, gap-[16px]
  const gapMatch = cls.match(/^gap-(.+)$/);
  if (gapMatch) {
    const valueStr = gapMatch[1];

    // Try arbitrary value first
    const arbitraryValue = parseArbitrarySpacing(valueStr);
    if (arbitraryValue !== null) {
      return { gap: arbitraryValue };
    }

    // Try preset scale
    const scaleValue = SPACING_SCALE[valueStr];
    if (scaleValue !== undefined) {
      return { gap: scaleValue };
    }
  }

  return null;
}

/**
 * Get margin style object based on direction
 */
function getMarginStyle(dir: string, value: number): StyleObject {
  switch (dir) {
    case "":
      return { margin: value };
    case "x":
      return { marginHorizontal: value };
    case "y":
      return { marginVertical: value };
    case "t":
      return { marginTop: value };
    case "r":
      return { marginRight: value };
    case "b":
      return { marginBottom: value };
    case "l":
      return { marginLeft: value };
    default:
      return {};
  }
}

/**
 * Get padding style object based on direction
 */
function getPaddingStyle(dir: string, value: number): StyleObject {
  switch (dir) {
    case "":
      return { padding: value };
    case "x":
      return { paddingHorizontal: value };
    case "y":
      return { paddingVertical: value };
    case "t":
      return { paddingTop: value };
    case "r":
      return { paddingRight: value };
    case "b":
      return { paddingBottom: value };
    case "l":
      return { paddingLeft: value };
    default:
      return {};
  }
}
