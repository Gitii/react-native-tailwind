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

  // Font weight
  if (cls === "font-thin") {
    return { fontWeight: "100" };
  }

  if (cls === "font-extralight") {
    return { fontWeight: "200" };
  }

  if (cls === "font-light") {
    return { fontWeight: "300" };
  }

  if (cls === "font-normal") {
    return { fontWeight: "400" };
  }

  if (cls === "font-medium") {
    return { fontWeight: "500" };
  }

  if (cls === "font-semibold") {
    return { fontWeight: "600" };
  }

  if (cls === "font-bold") {
    return { fontWeight: "700" };
  }

  if (cls === "font-extrabold") {
    return { fontWeight: "800" };
  }

  if (cls === "font-black") {
    return { fontWeight: "900" };
  }

  // Font style
  if (cls === "italic") {
    return { fontStyle: "italic" };
  }

  if (cls === "not-italic") {
    return { fontStyle: "normal" };
  }

  // Text align
  if (cls === "text-left") {
    return { textAlign: "left" };
  }

  if (cls === "text-center") {
    return { textAlign: "center" };
  }

  if (cls === "text-right") {
    return { textAlign: "right" };
  }

  if (cls === "text-justify") {
    return { textAlign: "justify" };
  }

  // Text decoration
  if (cls === "underline") {
    return { textDecorationLine: "underline" };
  }

  if (cls === "line-through") {
    return { textDecorationLine: "line-through" };
  }

  if (cls === "no-underline") {
    return { textDecorationLine: "none" };
  }

  // Text transform
  if (cls === "uppercase") {
    return { textTransform: "uppercase" };
  }

  if (cls === "lowercase") {
    return { textTransform: "lowercase" };
  }

  if (cls === "capitalize") {
    return { textTransform: "capitalize" };
  }

  if (cls === "normal-case") {
    return { textTransform: "none" };
  }

  // Line height
  if (cls === "leading-none") {
    return { lineHeight: 16 };
  }

  if (cls === "leading-tight") {
    return { lineHeight: 20 };
  }

  if (cls === "leading-snug") {
    return { lineHeight: 22 };
  }

  if (cls === "leading-normal") {
    return { lineHeight: 24 };
  }

  if (cls === "leading-relaxed") {
    return { lineHeight: 28 };
  }

  if (cls === "leading-loose") {
    return { lineHeight: 32 };
  }

  return null;
}
