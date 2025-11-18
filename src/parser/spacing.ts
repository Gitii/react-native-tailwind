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
 * Parse spacing classes (margin, padding, gap)
 * Examples: m-4, mx-2, mt-8, p-4, px-2, pt-8, gap-4
 */
export function parseSpacing(cls: string): StyleObject | null {
  // Margin
  if (cls.startsWith("m-") || cls.startsWith("m")) {
    return parseMargin(cls);
  }

  // Padding
  if (cls.startsWith("p-") || cls.startsWith("p")) {
    return parsePadding(cls);
  }

  // Gap
  if (cls.startsWith("gap-")) {
    return parseGap(cls);
  }

  return null;
}

/**
 * Parse margin classes
 */
function parseMargin(cls: string): StyleObject | null {
  // m-4 -> margin: 16
  const allMatch = cls.match(/^m-(\d+(?:\.\d+)?)$/);
  if (allMatch) {
    const value = SPACING_SCALE[allMatch[1]];
    if (value !== undefined) {
      return { margin: value };
    }
  }

  // mx-4 -> marginHorizontal: 16
  const xMatch = cls.match(/^mx-(\d+(?:\.\d+)?)$/);
  if (xMatch) {
    const value = SPACING_SCALE[xMatch[1]];
    if (value !== undefined) {
      return { marginHorizontal: value };
    }
  }

  // my-4 -> marginVertical: 16
  const yMatch = cls.match(/^my-(\d+(?:\.\d+)?)$/);
  if (yMatch) {
    const value = SPACING_SCALE[yMatch[1]];
    if (value !== undefined) {
      return { marginVertical: value };
    }
  }

  // mt-4 -> marginTop: 16
  const tMatch = cls.match(/^mt-(\d+(?:\.\d+)?)$/);
  if (tMatch) {
    const value = SPACING_SCALE[tMatch[1]];
    if (value !== undefined) {
      return { marginTop: value };
    }
  }

  // mr-4 -> marginRight: 16
  const rMatch = cls.match(/^mr-(\d+(?:\.\d+)?)$/);
  if (rMatch) {
    const value = SPACING_SCALE[rMatch[1]];
    if (value !== undefined) {
      return { marginRight: value };
    }
  }

  // mb-4 -> marginBottom: 16
  const bMatch = cls.match(/^mb-(\d+(?:\.\d+)?)$/);
  if (bMatch) {
    const value = SPACING_SCALE[bMatch[1]];
    if (value !== undefined) {
      return { marginBottom: value };
    }
  }

  // ml-4 -> marginLeft: 16
  const lMatch = cls.match(/^ml-(\d+(?:\.\d+)?)$/);
  if (lMatch) {
    const value = SPACING_SCALE[lMatch[1]];
    if (value !== undefined) {
      return { marginLeft: value };
    }
  }

  return null;
}

/**
 * Parse padding classes
 */
function parsePadding(cls: string): StyleObject | null {
  // p-4 -> padding: 16
  const allMatch = cls.match(/^p-(\d+(?:\.\d+)?)$/);
  if (allMatch) {
    const value = SPACING_SCALE[allMatch[1]];
    if (value !== undefined) {
      return { padding: value };
    }
  }

  // px-4 -> paddingHorizontal: 16
  const xMatch = cls.match(/^px-(\d+(?:\.\d+)?)$/);
  if (xMatch) {
    const value = SPACING_SCALE[xMatch[1]];
    if (value !== undefined) {
      return { paddingHorizontal: value };
    }
  }

  // py-4 -> paddingVertical: 16
  const yMatch = cls.match(/^py-(\d+(?:\.\d+)?)$/);
  if (yMatch) {
    const value = SPACING_SCALE[yMatch[1]];
    if (value !== undefined) {
      return { paddingVertical: value };
    }
  }

  // pt-4 -> paddingTop: 16
  const tMatch = cls.match(/^pt-(\d+(?:\.\d+)?)$/);
  if (tMatch) {
    const value = SPACING_SCALE[tMatch[1]];
    if (value !== undefined) {
      return { paddingTop: value };
    }
  }

  // pr-4 -> paddingRight: 16
  const rMatch = cls.match(/^pr-(\d+(?:\.\d+)?)$/);
  if (rMatch) {
    const value = SPACING_SCALE[rMatch[1]];
    if (value !== undefined) {
      return { paddingRight: value };
    }
  }

  // pb-4 -> paddingBottom: 16
  const bMatch = cls.match(/^pb-(\d+(?:\.\d+)?)$/);
  if (bMatch) {
    const value = SPACING_SCALE[bMatch[1]];
    if (value !== undefined) {
      return { paddingBottom: value };
    }
  }

  // pl-4 -> paddingLeft: 16
  const lMatch = cls.match(/^pl-(\d+(?:\.\d+)?)$/);
  if (lMatch) {
    const value = SPACING_SCALE[lMatch[1]];
    if (value !== undefined) {
      return { paddingLeft: value };
    }
  }

  return null;
}

/**
 * Parse gap classes
 */
function parseGap(cls: string): StyleObject | null {
  // gap-4 -> gap: 16
  const match = cls.match(/^gap-(\d+(?:\.\d+)?)$/);
  if (match) {
    const value = SPACING_SCALE[match[1]];
    if (value !== undefined) {
      return { gap: value };
    }
  }

  return null;
}
