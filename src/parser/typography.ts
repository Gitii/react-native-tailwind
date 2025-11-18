/**
 * Typography utilities (font size, weight, line height, text align)
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

// Line height utilities
const LINE_HEIGHT_MAP: Record<string, StyleObject> = {
  "leading-none": { lineHeight: 16 },
  "leading-tight": { lineHeight: 20 },
  "leading-snug": { lineHeight: 22 },
  "leading-normal": { lineHeight: 24 },
  "leading-relaxed": { lineHeight: 28 },
  "leading-loose": { lineHeight: 32 },
};

/**
 * Parse typography classes
 */
export function parseTypography(cls: string): StyleObject | null {
  // Font size: text-base, text-lg, etc.
  if (cls.startsWith("text-")) {
    const sizeKey = cls.substring(5);
    const fontSize = FONT_SIZES[sizeKey];
    if (fontSize !== undefined) {
      return { fontSize };
    }
  }

  // Try each lookup table in order
  return (
    FONT_WEIGHT_MAP[cls] ??
    FONT_STYLE_MAP[cls] ??
    TEXT_ALIGN_MAP[cls] ??
    TEXT_DECORATION_MAP[cls] ??
    TEXT_TRANSFORM_MAP[cls] ??
    LINE_HEIGHT_MAP[cls] ??
    null
  );
}
