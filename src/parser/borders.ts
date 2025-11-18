/**
 * Border utilities (border width, radius, style)
 */

import type { StyleObject } from "../types";

// Border width scale
export const BORDER_WIDTH_SCALE: Record<string, number> = {
  "": 1,
  "0": 0,
  "2": 2,
  "4": 4,
  "8": 8,
};

// Border radius scale
export const BORDER_RADIUS_SCALE: Record<string, number> = {
  none: 0,
  sm: 2,
  "": 4,
  md: 6,
  lg: 8,
  xl: 12,
  "2xl": 16,
  "3xl": 24,
  full: 9999,
};

/**
 * Property mapping for border width directions
 */
const BORDER_WIDTH_PROP_MAP: Record<string, string> = {
  t: "borderTopWidth",
  r: "borderRightWidth",
  b: "borderBottomWidth",
  l: "borderLeftWidth",
};

/**
 * Property mapping for border radius corners
 */
const BORDER_RADIUS_CORNER_MAP: Record<string, string> = {
  tl: "borderTopLeftRadius",
  tr: "borderTopRightRadius",
  bl: "borderBottomLeftRadius",
  br: "borderBottomRightRadius",
};

/**
 * Property mapping for border radius sides (returns array of properties)
 */
const BORDER_RADIUS_SIDE_MAP: Record<string, string[]> = {
  t: ["borderTopLeftRadius", "borderTopRightRadius"],
  r: ["borderTopRightRadius", "borderBottomRightRadius"],
  b: ["borderBottomLeftRadius", "borderBottomRightRadius"],
  l: ["borderTopLeftRadius", "borderBottomLeftRadius"],
};

/**
 * Parse arbitrary border width value: [8px], [4]
 * Returns number for px values, null for unsupported formats
 */
function parseArbitraryBorderWidth(value: string): number | null {
  // Match: [8px] or [8] (pixels only)
  const pxMatch = value.match(/^\[(\d+)(?:px)?\]$/);
  if (pxMatch) {
    return parseInt(pxMatch[1], 10);
  }

  // Warn about unsupported formats
  if (value.startsWith("[") && value.endsWith("]")) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[react-native-tailwind] Unsupported arbitrary border width value: ${value}. Only px values are supported (e.g., [8px] or [8]).`,
      );
    }
    return null;
  }

  return null;
}

/**
 * Parse arbitrary border radius value: [12px], [8]
 * Returns number for px values, null for unsupported formats
 */
function parseArbitraryBorderRadius(value: string): number | null {
  // Match: [12px] or [12] (pixels only)
  const pxMatch = value.match(/^\[(\d+)(?:px)?\]$/);
  if (pxMatch) {
    return parseInt(pxMatch[1], 10);
  }

  // Warn about unsupported formats
  if (value.startsWith("[") && value.endsWith("]")) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[react-native-tailwind] Unsupported arbitrary border radius value: ${value}. Only px values are supported (e.g., [12px] or [12]).`,
      );
    }
    return null;
  }

  return null;
}

/**
 * Parse border classes
 */
export function parseBorder(cls: string): StyleObject | null {
  // Border style (must come before parseBorderWidth)
  if (cls === "border-solid") return { borderStyle: "solid" };
  if (cls === "border-dotted") return { borderStyle: "dotted" };
  if (cls === "border-dashed") return { borderStyle: "dashed" };

  // Border width (border-0, border-t, border-[8px], etc.)
  if (cls.startsWith("border-")) {
    return parseBorderWidth(cls);
  }

  if (cls === "border") {
    return { borderWidth: 1 };
  }

  // Border radius (rounded, rounded-t, rounded-[12px], etc.)
  if (cls.startsWith("rounded")) {
    return parseBorderRadius(cls);
  }

  return null;
}

/**
 * Parse border width classes
 */
function parseBorderWidth(cls: string): StyleObject | null {
  // Directional borders: border-t, border-t-2, border-t-[8px]
  const dirMatch = cls.match(/^border-([trbl])(?:-(.+))?$/);
  if (dirMatch) {
    const dir = dirMatch[1];
    const valueStr = dirMatch[2] || ""; // empty string for border-t

    // Try arbitrary value first (if it starts with [)
    if (valueStr.startsWith("[")) {
      const arbitraryValue = parseArbitraryBorderWidth(valueStr);
      if (arbitraryValue !== null) {
        return { [BORDER_WIDTH_PROP_MAP[dir]]: arbitraryValue };
      }
      return null;
    }

    // Try preset scale
    const scaleValue = BORDER_WIDTH_SCALE[valueStr];
    if (scaleValue !== undefined) {
      return { [BORDER_WIDTH_PROP_MAP[dir]]: scaleValue };
    }

    return null;
  }

  // All borders with preset values: border-0, border-2, border-4, border-8
  const allMatch = cls.match(/^border-(\d+)$/);
  if (allMatch) {
    const value = BORDER_WIDTH_SCALE[allMatch[1]];
    if (value !== undefined) {
      return { borderWidth: value };
    }
  }

  // All borders with arbitrary values: border-[8px]
  const allArbMatch = cls.match(/^border-(\[.+\])$/);
  if (allArbMatch) {
    const arbitraryValue = parseArbitraryBorderWidth(allArbMatch[1]);
    if (arbitraryValue !== null) {
      return { borderWidth: arbitraryValue };
    }
  }

  return null;
}

/**
 * Parse border radius classes
 */
function parseBorderRadius(cls: string): StyleObject | null {
  // Remove "rounded" prefix for easier parsing
  const withoutPrefix = cls.substring(7); // "rounded".length = 7

  // Handle "rounded" by itself
  if (withoutPrefix === "") {
    return { borderRadius: BORDER_RADIUS_SCALE[""] };
  }

  // Must start with "-" after "rounded"
  if (!withoutPrefix.startsWith("-")) {
    return null;
  }

  const rest = withoutPrefix.substring(1); // Remove leading "-"

  // Handle "rounded-" (just dash, no content)
  if (rest === "") {
    return null;
  }

  // Specific corners: rounded-tl, rounded-tl-lg, rounded-tl-[8px]
  const cornerMatch = rest.match(/^(tl|tr|bl|br)(?:-(.+))?$/);
  if (cornerMatch) {
    const corner = cornerMatch[1];
    const valueStr = cornerMatch[2] || ""; // empty string for rounded-tl

    // Try arbitrary value first
    if (valueStr.startsWith("[")) {
      const arbitraryValue = parseArbitraryBorderRadius(valueStr);
      if (arbitraryValue !== null) {
        return { [BORDER_RADIUS_CORNER_MAP[corner]]: arbitraryValue };
      }
      return null;
    }

    // Try preset scale
    const scaleValue = BORDER_RADIUS_SCALE[valueStr];
    if (scaleValue !== undefined) {
      return { [BORDER_RADIUS_CORNER_MAP[corner]]: scaleValue };
    }

    return null;
  }

  // Sides: rounded-t, rounded-t-lg, rounded-t-[8px]
  const sideMatch = rest.match(/^([trbl])(?:-(.+))?$/);
  if (sideMatch) {
    const side = sideMatch[1];
    const valueStr = sideMatch[2] || ""; // empty string for rounded-t

    let value: number | undefined;

    // Try arbitrary value first
    if (valueStr.startsWith("[")) {
      const arbitraryValue = parseArbitraryBorderRadius(valueStr);
      if (arbitraryValue !== null) {
        value = arbitraryValue;
      } else {
        return null;
      }
    } else {
      // Try preset scale
      value = BORDER_RADIUS_SCALE[valueStr];
    }

    if (value !== undefined) {
      const result: StyleObject = {};
      BORDER_RADIUS_SIDE_MAP[side].forEach((prop) => (result[prop] = value));
      return result;
    }

    return null;
  }

  // All corners with preset values: rounded-lg, rounded-xl, etc.
  // Or arbitrary values: rounded-[12px]
  if (rest.startsWith("[")) {
    const arbitraryValue = parseArbitraryBorderRadius(rest);
    if (arbitraryValue !== null) {
      return { borderRadius: arbitraryValue };
    }
    return null;
  }

  // Preset scale
  const scaleValue = BORDER_RADIUS_SCALE[rest];
  if (scaleValue !== undefined) {
    return { borderRadius: scaleValue };
  }

  return null;
}
