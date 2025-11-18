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
 * Parse border classes
 */
export function parseBorder(cls: string): StyleObject | null {
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

  // Border style
  if (cls === "border-solid") return { borderStyle: "solid" };
  if (cls === "border-dotted") return { borderStyle: "dotted" };
  if (cls === "border-dashed") return { borderStyle: "dashed" };

  return null;
}

/**
 * Parse border width classes
 */
function parseBorderWidth(cls: string): StyleObject | null {
  // All borders with arbitrary values: border-[8px]
  const allArbMatch = cls.match(/^border-\[(\d+)(?:px)?\]$/);
  if (allArbMatch) {
    return { borderWidth: parseInt(allArbMatch[1], 10) };
  }

  // Directional borders with arbitrary values: border-t-[8px]
  const dirArbMatch = cls.match(/^border-([trbl])-\[(\d+)(?:px)?\]$/);
  if (dirArbMatch) {
    const dir = dirArbMatch[1];
    const value = parseInt(dirArbMatch[2], 10);
    const propMap: Record<string, string> = {
      t: "borderTopWidth",
      r: "borderRightWidth",
      b: "borderBottomWidth",
      l: "borderLeftWidth",
    };
    return { [propMap[dir]]: value };
  }

  // Preset directional borders: border-t-0, border-t-2, etc.
  const dirMatch = cls.match(/^border-([trbl])-?(\d*)$/);
  if (dirMatch) {
    const dir = dirMatch[1];
    const scaleKey = dirMatch[2] || ""; // empty string for border-t
    const value = BORDER_WIDTH_SCALE[scaleKey];

    if (typeof value === "number") {
      const propMap: Record<string, string> = {
        t: "borderTopWidth",
        r: "borderRightWidth",
        b: "borderBottomWidth",
        l: "borderLeftWidth",
      };
      return { [propMap[dir]]: value };
    }
  }

  // Preset all borders: border-0, border-2, etc.
  const allMatch = cls.match(/^border-(\d+)$/);
  if (allMatch) {
    const value = BORDER_WIDTH_SCALE[allMatch[1]];
    if (value !== undefined) {
      return { borderWidth: value };
    }
  }

  return null;
}

/**
 * Parse border radius classes
 */
function parseBorderRadius(cls: string): StyleObject | null {
  // All corners with arbitrary values: rounded-[12px]
  const allArbMatch = cls.match(/^rounded-\[(\d+)(?:px)?\]$/);
  if (allArbMatch) {
    return { borderRadius: parseInt(allArbMatch[1], 10) };
  }

  // Specific corners with arbitrary values: rounded-tl-[8px]
  const cornerArbMatch = cls.match(/^rounded-(tl|tr|bl|br)-\[(\d+)(?:px)?\]$/);
  if (cornerArbMatch) {
    const corner = cornerArbMatch[1];
    const value = parseInt(cornerArbMatch[2], 10);
    const propMap: Record<string, string> = {
      tl: "borderTopLeftRadius",
      tr: "borderTopRightRadius",
      bl: "borderBottomLeftRadius",
      br: "borderBottomRightRadius",
    };
    return { [propMap[corner]]: value };
  }

  // Sides with arbitrary values: rounded-t-[8px]
  const sideArbMatch = cls.match(/^rounded-([trbl])-\[(\d+)(?:px)?\]$/);
  if (sideArbMatch) {
    const side = sideArbMatch[1];
    const value = parseInt(sideArbMatch[2], 10);
    const propMap: Record<string, string[]> = {
      t: ["borderTopLeftRadius", "borderTopRightRadius"],
      r: ["borderTopRightRadius", "borderBottomRightRadius"],
      b: ["borderBottomLeftRadius", "borderBottomRightRadius"],
      l: ["borderTopLeftRadius", "borderBottomLeftRadius"],
    };
    const result: StyleObject = {};
    propMap[side].forEach((prop) => (result[prop] = value));
    return result;
  }

  // All corners with preset values: rounded, rounded-lg, etc.
  const allMatch = cls.match(/^rounded(-\w+)?$/);
  if (allMatch) {
    const scaleKey = allMatch[1] ? allMatch[1].substring(1) : ""; // remove leading dash
    const value = BORDER_RADIUS_SCALE[scaleKey];
    if (value !== undefined) {
      return { borderRadius: value };
    }
  }

  // Sides with preset values: rounded-t, rounded-t-lg, etc.
  const sideMatch = cls.match(/^rounded-([trbl])(?:-(\w+))?$/);
  if (sideMatch) {
    const side = sideMatch[1];
    const scaleKey = sideMatch[2] || ""; // empty string for rounded-t
    const value = BORDER_RADIUS_SCALE[scaleKey];

    if (value !== undefined) {
      const propMap: Record<string, string[]> = {
        t: ["borderTopLeftRadius", "borderTopRightRadius"],
        r: ["borderTopRightRadius", "borderBottomRightRadius"],
        b: ["borderBottomLeftRadius", "borderBottomRightRadius"],
        l: ["borderTopLeftRadius", "borderBottomLeftRadius"],
      };
      const result: StyleObject = {};
      propMap[side].forEach((prop) => (result[prop] = value));
      return result;
    }
  }

  // Specific corners with preset values: rounded-tl, rounded-tl-lg, etc.
  const cornerMatch = cls.match(/^rounded-(tl|tr|bl|br)(?:-(\w+))?$/);
  if (cornerMatch) {
    const corner = cornerMatch[1];
    const scaleKey = cornerMatch[2] || "";
    const value = BORDER_RADIUS_SCALE[scaleKey];

    if (value !== undefined) {
      const propMap: Record<string, string> = {
        tl: "borderTopLeftRadius",
        tr: "borderTopRightRadius",
        bl: "borderBottomLeftRadius",
        br: "borderBottomRightRadius",
      };
      return { [propMap[corner]]: value };
    }
  }

  return null;
}
