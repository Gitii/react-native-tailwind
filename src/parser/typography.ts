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
// Note: text-start and text-end are handled via automatic expansion to directional modifiers
// in splitModifierClasses() for true RTL support:
//   text-start -> ltr:text-left rtl:text-right
//   text-end -> ltr:text-right rtl:text-left
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
 * Parse arbitrary font size value: [18px], [20], [13.5px], [.5]
 * Returns number for px values (including decimals), null for unsupported formats
 */
function parseArbitraryFontSize(value: string): number | null {
  // Match: [18px], [18], [13.5px], [13.5], [.5] (pixels, including decimals)
  const pxMatch = value.match(/^\[(-?\d+(?:\.\d+)?|-?\.\d+)(?:px)?\]$/);
  if (pxMatch) {
    return parseFloat(pxMatch[1]);
  }

  // Warn about unsupported formats
  if (value.startsWith("[") && value.endsWith("]")) {
    /* v8 ignore next 5 */
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[react-native-tailwind] Unsupported arbitrary font size value: ${value}. Only px values are supported (e.g., [18px], [13.5px], [.5]).`,
      );
    }
    return null;
  }

  return null;
}

/**
 * Parse arbitrary line height value: [24px], [28], [21.5px], [.5]
 * Returns number for px values (including decimals), null for unsupported formats
 */
function parseArbitraryLineHeight(value: string): number | null {
  // Match: [24px], [24], [21.5px], [21.5], [.5] (pixels, including decimals)
  const pxMatch = value.match(/^\[(-?\d+(?:\.\d+)?|-?\.\d+)(?:px)?\]$/);
  if (pxMatch) {
    return parseFloat(pxMatch[1]);
  }

  // Warn about unsupported formats
  if (value.startsWith("[") && value.endsWith("]")) {
    /* v8 ignore next 5 */
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[react-native-tailwind] Unsupported arbitrary line height value: ${value}. Only px values are supported (e.g., [24px], [21.5px], [.5]).`,
      );
    }
    return null;
  }

  return null;
}

/**
 * Parse arbitrary letter spacing value: [0.5px], [0.3], [.5], [-0.4]
 * Returns number for px values (including decimals), null for unsupported formats
 */
function parseArbitraryLetterSpacing(value: string): number | null {
  // Match: [0.5px], [0.3], [.5], [-0.4px] (pixels, including decimals and negatives)
  const pxMatch = value.match(/^\[(-?\d+(?:\.\d+)?|-?\.\d+)(?:px)?\]$/);
  if (pxMatch) {
    return parseFloat(pxMatch[1]);
  }

  // Warn about unsupported formats
  if (value.startsWith("[") && value.endsWith("]")) {
    /* v8 ignore next 5 */
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[react-native-tailwind] Unsupported arbitrary letter spacing value: ${value}. Only px values are supported (e.g., [0.5px], [0.3], [.5], [-0.4]).`,
      );
    }
    return null;
  }

  return null;
}

/**
 * Parse typography classes
 * @param cls - Class name to parse
 * @param customFontFamily - Optional custom fontFamily from tailwind.config
 * @param customFontSize - Optional custom fontSize from tailwind.config
 */
export function parseTypography(
  cls: string,
  customFontFamily?: Record<string, string>,
  customFontSize?: Record<string, number>,
): StyleObject | null {
  // Merge custom fontFamily with defaults (custom takes precedence)
  const fontFamilyMap = customFontFamily
    ? {
        ...FONT_FAMILY_MAP,
        ...Object.fromEntries(
          Object.entries(customFontFamily).map(([key, value]) => [`font-${key}`, { fontFamily: value }]),
        ),
      }
    : FONT_FAMILY_MAP;

  // Font size: text-base, text-lg, text-[18px], etc.
  if (cls.startsWith("text-")) {
    const sizeKey = cls.substring(5);

    // Try arbitrary value first (highest priority)
    const arbitraryValue = parseArbitraryFontSize(sizeKey);
    if (arbitraryValue !== null) {
      return { fontSize: arbitraryValue };
    }

    // Try custom fontSize from config
    if (customFontSize?.[sizeKey] !== undefined) {
      return { fontSize: customFontSize[sizeKey] };
    }

    // Try preset scale (fallback)
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

  // Letter spacing: tracking-wide, tracking-[0.5px], tracking-[.3], etc.
  if (cls.startsWith("tracking-")) {
    const trackingKey = cls.substring(9);

    // Try arbitrary value first
    const arbitraryValue = parseArbitraryLetterSpacing(trackingKey);
    if (arbitraryValue !== null) {
      return { letterSpacing: arbitraryValue };
    }
  }

  // Try each lookup table in order
  return (
    fontFamilyMap[cls] ??
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
