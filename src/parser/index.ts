/**
 * Tailwind class parser for React Native
 * Converts Tailwind-like class names to React Native style objects
 */

import type { StyleObject } from "../types";
import { parseBorder } from "./borders";
import { parseColor } from "./colors";
import { parseLayout } from "./layout";
import { parseSizing } from "./sizing";
import { parseSpacing } from "./spacing";
import { parseTypography } from "./typography";

/**
 * Parse a className string and return a React Native style object
 * @param className - Space-separated class names
 * @param customColors - Optional custom colors from tailwind.config
 * @returns React Native style object
 */
export function parseClassName(className: string, customColors?: Record<string, string>): StyleObject {
  const classes = className.split(/\s+/).filter(Boolean);
  const style: StyleObject = {};

  for (const cls of classes) {
    const parsedStyle = parseClass(cls, customColors);
    Object.assign(style, parsedStyle);
  }

  return style;
}

/**
 * Parse a single class name
 * @param cls - Single class name
 * @param customColors - Optional custom colors from tailwind.config
 * @returns React Native style object
 */
export function parseClass(cls: string, customColors?: Record<string, string>): StyleObject {
  // Try each parser in order
  // parseColor gets custom colors, others don't need it
  const parsers: Array<(cls: string) => StyleObject | null> = [
    parseSpacing,
    (cls: string) => parseColor(cls, customColors),
    parseLayout,
    parseTypography,
    parseBorder,
    parseSizing,
  ];

  for (const parser of parsers) {
    const result = parser(cls);
    if (result !== null) {
      return result;
    }
  }

  // Warn about unknown class in development
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[react-native-tailwind] Unknown class: "${cls}"`);
  }

  return {};
}

// Re-export parsers for testing/advanced usage
export { parseBorder } from "./borders";
export { parseColor } from "./colors";
export { parseLayout } from "./layout";
export { parseSizing } from "./sizing";
export { parseSpacing } from "./spacing";
export { parseTypography } from "./typography";
