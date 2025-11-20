/**
 * Placeholder text color utilities (placeholder:text-{color})
 *
 * React Native only supports styling the COLOR of placeholder text via placeholderTextColor prop.
 * Other text styling properties (font-size, font-weight, etc.) are not supported.
 */

import { parseColor } from "./colors.js";

/**
 * Parse placeholder modifier classes to extract color
 *
 * Only text-{color} classes are supported inside placeholder: modifier.
 * Other utilities (font-*, text-lg, etc.) will log warnings.
 *
 * @param cls - Class name inside placeholder: modifier (e.g., "text-red-500")
 * @param customColors - Optional custom color palette from tailwind.config
 * @returns Color string (hex with optional alpha) or null if invalid
 *
 * @example
 * parsePlaceholderClass("text-red-500") // "#ef4444"
 * parsePlaceholderClass("text-red-500/50", {}) // "#ef444480"
 * parsePlaceholderClass("text-brand-primary", { "brand-primary": "#123456" }) // "#123456"
 * parsePlaceholderClass("font-bold") // null (+ warning)
 */
export function parsePlaceholderClass(cls: string, customColors?: Record<string, string>): string | null {
  // Check if it's a text color class
  if (!cls.startsWith("text-")) {
    // Warn about unsupported utilities
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[react-native-tailwind] Only text color utilities are supported in placeholder: modifier. ` +
          `Class "${cls}" will be ignored. React Native only supports placeholderTextColor prop.`,
      );
    }
    return null;
  }

  // Parse as color using existing color parser
  // This handles text-red-500, text-red-500/50, text-[#ff0000], etc.
  const styleObject = parseColor(cls, customColors);

  if (!styleObject || !styleObject.color) {
    return null;
  }

  // Return the color value
  return styleObject.color as string;
}

/**
 * Parse multiple placeholder classes and return the last valid color
 * (Later classes override earlier ones, matching CSS cascade behavior)
 *
 * @param classes - Space-separated class names
 * @param customColors - Optional custom color palette
 * @returns Color string or null
 *
 * @example
 * parsePlaceholderClasses("text-red-500 text-blue-500") // "#3b82f6" (blue wins)
 * parsePlaceholderClasses("text-red-500 font-bold") // "#ef4444" (ignores font-bold)
 */
export function parsePlaceholderClasses(
  classes: string,
  customColors?: Record<string, string>,
): string | null {
  const classList = classes.trim().split(/\s+/).filter(Boolean);
  let finalColor: string | null = null;

  for (const cls of classList) {
    const color = parsePlaceholderClass(cls, customColors);
    if (color) {
      finalColor = color; // Later colors override earlier ones
    }
  }

  return finalColor;
}
