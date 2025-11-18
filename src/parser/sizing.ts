/**
 * Sizing utilities (width, height, min/max)
 */

import type { StyleObject } from '../types';

// Size scale (in pixels/percentages)
export const SIZE_SCALE: Record<string, number> = {
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

export const SIZE_PERCENTAGES: Record<string, string> = {
  full: '100%',
  '1/2': '50%',
  '1/3': '33.333333%',
  '2/3': '66.666667%',
  '1/4': '25%',
  '2/4': '50%',
  '3/4': '75%',
  '1/5': '20%',
  '2/5': '40%',
  '3/5': '60%',
  '4/5': '80%',
  '1/6': '16.666667%',
  '2/6': '33.333333%',
  '3/6': '50%',
  '4/6': '66.666667%',
  '5/6': '83.333333%',
};

/**
 * Parse sizing classes
 */
export function parseSizing(cls: string): StyleObject | null {
  // Width
  if (cls.startsWith('w-')) {
    const sizeKey = cls.substring(2);

    // Percentage widths: w-full, w-1/2, etc.
    const percentage = SIZE_PERCENTAGES[sizeKey];
    if (percentage) {
      return { width: percentage };
    }

    // Numeric widths: w-4, w-8, etc.
    const numericSize = SIZE_SCALE[sizeKey];
    if (numericSize !== undefined) {
      return { width: numericSize };
    }

    // Special values
    if (sizeKey === 'auto') {
      return { width: 'auto' };
    }
  }

  // Height
  if (cls.startsWith('h-')) {
    const sizeKey = cls.substring(2);

    // Percentage heights: h-full, h-1/2, etc.
    const percentage = SIZE_PERCENTAGES[sizeKey];
    if (percentage) {
      return { height: percentage };
    }

    // Numeric heights: h-4, h-8, etc.
    const numericSize = SIZE_SCALE[sizeKey];
    if (numericSize !== undefined) {
      return { height: numericSize };
    }

    // Special values
    if (sizeKey === 'auto') {
      return { height: 'auto' };
    }
  }

  // Min width
  if (cls.startsWith('min-w-')) {
    const sizeKey = cls.substring(6);

    const percentage = SIZE_PERCENTAGES[sizeKey];
    if (percentage) {
      return { minWidth: percentage };
    }

    const numericSize = SIZE_SCALE[sizeKey];
    if (numericSize !== undefined) {
      return { minWidth: numericSize };
    }
  }

  // Min height
  if (cls.startsWith('min-h-')) {
    const sizeKey = cls.substring(6);

    const percentage = SIZE_PERCENTAGES[sizeKey];
    if (percentage) {
      return { minHeight: percentage };
    }

    const numericSize = SIZE_SCALE[sizeKey];
    if (numericSize !== undefined) {
      return { minHeight: numericSize };
    }
  }

  // Max width
  if (cls.startsWith('max-w-')) {
    const sizeKey = cls.substring(6);

    const percentage = SIZE_PERCENTAGES[sizeKey];
    if (percentage) {
      return { maxWidth: percentage };
    }

    const numericSize = SIZE_SCALE[sizeKey];
    if (numericSize !== undefined) {
      return { maxWidth: numericSize };
    }
  }

  // Max height
  if (cls.startsWith('max-h-')) {
    const sizeKey = cls.substring(6);

    const percentage = SIZE_PERCENTAGES[sizeKey];
    if (percentage) {
      return { maxHeight: percentage };
    }

    const numericSize = SIZE_SCALE[sizeKey];
    if (numericSize !== undefined) {
      return { maxHeight: numericSize };
    }
  }

  return null;
}
