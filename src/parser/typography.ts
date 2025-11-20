/**
 * Typography utilities (font size, weight, line height, text align, letter spacing)
 */

import type { StyleObject } from "../types";

// Font sizes
export const FONT_SIZES: Record<string, number> = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
  "6xl": 60,
  "7xl": 72,
  "8xl": 96,
  "9xl": 128,
};

// Letter spacing scale
export const LETTER_SPACING_SCALE: Record<string, number> = {
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
  widest: 1.6,
};

// Font family utilities
const FONT_FAMILY_MAP: Record<string, StyleObject> = {
  "font-sans": { fontFamily: "System" },
  "font-serif": { fontFamily: "serif" },
  "font-mono": { fontFamily: "Courier" },
};

// Font weight utilities
const FONT_WEIGHT_MAP: Record<string, StyleObject> = {
  "font-thin": { fontWeight: "100" },
  "font-extralight": { fontWeight: "200" },
  "font-light": { fontWeight: "300" },
  "font-normal": { fontWeight: "400" },
  "font-medium": { fontWeight: "500" },
  "font-semibold": { fontWeight: "600" },
  "font-bold": { fontWeight: "700" },
  "font-extrabold": { fontWeight: "800" },
  "font-black": { fontWeight: "900" },
};

// Font style utilities
const FONT_STYLE_MAP: Record<string, StyleObject> = {
  italic: { fontStyle: "italic" },
  "not-italic": { fontStyle: "normal" },
};

// Text alignment utilities
const TEXT_ALIGN_MAP: Record<string, StyleObject> = {
  "text-left": { textAlign: "left" },
  "text-center": { textAlign: "center" },
  "text-right": { textAlign: "right" },
  "text-justify": { textAlign: "justify" },
};

// Text decoration utilities
const TEXT_DECORATION_MAP: Record<string, StyleObject> = {
  underline: { textDecorationLine: "underline" },
  "line-through": { textDecorationLine: "line-through" },
  "no-underline": { textDecorationLine: "none" },
};

// Text transform utilities
const TEXT_TRANSFORM_MAP: Record<string, StyleObject> = {
  uppercase: { textTransform: "uppercase" },
  lowercase: { textTransform: "lowercase" },
  capitalize: { textTransform: "capitalize" },
  "normal-case": { textTransform: "none" },
};

// Line height scale (numeric)
export const LINE_HEIGHT_SCALE: Record<string, number> = {
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
};

// Line height utilities (named)
const LINE_HEIGHT_MAP: Record<string, StyleObject> = {
  "leading-none": { lineHeight: 16 },
  "leading-tight": { lineHeight: 20 },
  "leading-snug": { lineHeight: 22 },
  "leading-normal": { lineHeight: 24 },
  "leading-relaxed": { lineHeight: 28 },
  "leading-loose": { lineHeight: 32 },
};

// Letter spacing utilities
const TRACKING_MAP: Record<string, StyleObject> = {
  "tracking-tighter": { letterSpacing: -0.8 },
  "tracking-tight": { letterSpacing: -0.4 },
  "tracking-normal": { letterSpacing: 0 },
  "tracking-wide": { letterSpacing: 0.4 },
  "tracking-wider": { letterSpacing: 0.8 },
  "tracking-widest": { letterSpacing: 1.6 },
};

/**
 * Parse arbitrary font size value: [18px], [20]
 * Returns number for px values, null for unsupported formats
 */
function parseArbitraryFontSize(value: string): number | null {
  // Match: [18px] or [18] (pixels only)
  const pxMatch = value.match(/^\[(\d+)(?:px)?\]$/);
  if (pxMatch) {
    return parseInt(pxMatch[1], 10);
  }

  // Warn about unsupported formats
  if (value.startsWith("[") && value.endsWith("]")) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[react-native-tailwind] Unsupported arbitrary font size value: ${value}. Only px values are supported (e.g., [18px] or [18]).`,
      );
    }
    return null;
  }

  return null;
}

/**
 * Parse arbitrary line height value: [24px], [28]
 * Returns number for px values, null for unsupported formats
 */
function parseArbitraryLineHeight(value: string): number | null {
  // Match: [24px] or [24] (pixels only)
  const pxMatch = value.match(/^\[(\d+)(?:px)?\]$/);
  if (pxMatch) {
    return parseInt(pxMatch[1], 10);
  }

  // Warn about unsupported formats
  if (value.startsWith("[") && value.endsWith("]")) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[react-native-tailwind] Unsupported arbitrary line height value: ${value}. Only px values are supported (e.g., [24px] or [24]).`,
      );
    }
    return null;
  }

  return null;
}

/**
 * Parse typography classes
 */
export function parseTypography(cls: string): StyleObject | null {
  // Font size: text-base, text-lg, text-[18px], etc.
  if (cls.startsWith("text-")) {
    const sizeKey = cls.substring(5);

    // Try arbitrary value first
    const arbitraryValue = parseArbitraryFontSize(sizeKey);
    if (arbitraryValue !== null) {
      return { fontSize: arbitraryValue };
    }

    // Try preset scale
    const fontSize = FONT_SIZES[sizeKey];
    if (fontSize !== undefined) {
      return { fontSize };
    }
  }

  // Line height: leading-normal, leading-6, leading-[24px], etc.
  if (cls.startsWith("leading-")) {
    const heightKey = cls.substring(8);

    // Try arbitrary value first
    const arbitraryValue = parseArbitraryLineHeight(heightKey);
    if (arbitraryValue !== null) {
      return { lineHeight: arbitraryValue };
    }

    // Try numeric scale (leading-3, leading-6, etc.)
    const lineHeight = LINE_HEIGHT_SCALE[heightKey];
    if (lineHeight !== undefined) {
      return { lineHeight };
    }
  }

  // Try each lookup table in order
  return (
    FONT_FAMILY_MAP[cls] ??
    FONT_WEIGHT_MAP[cls] ??
    FONT_STYLE_MAP[cls] ??
    TEXT_ALIGN_MAP[cls] ??
    TEXT_DECORATION_MAP[cls] ??
    TEXT_TRANSFORM_MAP[cls] ??
    LINE_HEIGHT_MAP[cls] ??
    TRACKING_MAP[cls] ??
    null
  );
}
