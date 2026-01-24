/**
 * Outline utilities (outline width, style, offset)
 */

import type { StyleObject } from "../types";
import { BORDER_WIDTH_SCALE } from "./borders";

/**
 * Parse arbitrary outline width/offset value: [8px], [4]
 * Returns number for px values, null for unsupported formats
 */
function parseArbitraryOutlineValue(value: string): number | null {
  // Match: [8px] or [8] (pixels only)
  const pxMatch = value.match(/^\[(\d+)(?:px)?\]$/);
  if (pxMatch) {
    return parseInt(pxMatch[1], 10);
  }

  // Warn about unsupported formats
  if (value.startsWith("[") && value.endsWith("]")) {
    /* v8 ignore next 5 */
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[react-native-tailwind] Unsupported arbitrary outline value: ${value}. Only px values are supported (e.g., [8px] or [8]).`,
      );
    }
    return null;
  }

  return null;
}

/**
 * Parse outline classes
 * @param cls - The class name to parse
 * @param customColors - Optional custom colors (passed to parseColor for pattern detection)
 */
export function parseOutline(cls: string, customColors?: Record<string, string>): StyleObject | null {
  // Shorthand: outline (width: 1, style: solid)
  if (cls === "outline") {
    return { outlineWidth: 1, outlineStyle: "solid" };
  }

  // Outline none
  if (cls === "outline-none") {
    return { outlineWidth: 0 };
  }

  // Outline style
  if (cls === "outline-solid") return { outlineStyle: "solid" };
  if (cls === "outline-dotted") return { outlineStyle: "dotted" };
  if (cls === "outline-dashed") return { outlineStyle: "dashed" };

  // Outline offset: outline-offset-2, outline-offset-[3px]
  if (cls.startsWith("outline-offset-")) {
    const valueStr = cls.substring(15); // "outline-offset-".length = 15

    // Try arbitrary value first
    if (valueStr.startsWith("[")) {
      const arbitraryValue = parseArbitraryOutlineValue(valueStr);
      if (arbitraryValue !== null) {
        return { outlineOffset: arbitraryValue };
      }
      return null;
    }

    // Try preset scale (reuse border width scale for consistency with default Tailwind)
    const scaleValue = BORDER_WIDTH_SCALE[valueStr];
    if (scaleValue !== undefined) {
      return { outlineOffset: scaleValue };
    }

    return null;
  }

  // Outline width: outline-0, outline-2, outline-[5px]
  // Must handle potential collision with outline-red-500 (colors)
  // Logic: if it matches width pattern, return width. If it looks like color, return null (let parseColor handle it)

  const widthMatch = cls.match(/^outline-(\d+)$/);
  if (widthMatch) {
    const value = BORDER_WIDTH_SCALE[widthMatch[1]];
    if (value !== undefined) {
      return { outlineWidth: value };
    }
  }

  const arbMatch = cls.match(/^outline-(\[.+\])$/);
  if (arbMatch) {
    // Check if it's a color first? No, colors usually look like [#...] or [rgb(...)]
    // parseArbitraryOutlineValue only accepts [123] or [123px]
    // If it fails, it might be a color, so we return null
    const arbitraryValue = parseArbitraryOutlineValue(arbMatch[1]);
    if (arbitraryValue !== null) {
      return { outlineWidth: arbitraryValue };
    }
    return null;
  }

  // If it's outline-{color}, we return null here so parseColor (called later in index.ts)
  return null;
}
