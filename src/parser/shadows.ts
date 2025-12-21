/**
 * Shadow and elevation utilities for React Native
 * iOS uses shadow* properties, Android uses elevation
 */

import type { StyleObject } from "../types";
import { COLORS, parseColorValue } from "../utils/colorUtils";

/**
 * Shadow scale definitions combining iOS and Android properties
 * Based on Tailwind CSS shadow scale, adapted for React Native
 *
 * Note: We include BOTH iOS shadow properties AND Android elevation in each style.
 * React Native will automatically use the appropriate properties for each platform:
 * - iOS uses shadowColor, shadowOffset, shadowOpacity, shadowRadius
 * - Android uses elevation
 */
const SHADOW_SCALE: Record<string, StyleObject> = {
  "shadow-sm": {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  shadow: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  "shadow-md": {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  "shadow-lg": {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  "shadow-xl": {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  "shadow-2xl": {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  "shadow-none": {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

/**
 * Parse shadow classes
 * Supports shadow size presets (shadow-sm, shadow-md, etc.) and
 * shadow colors (shadow-red-500, shadow-blue-800/50, shadow-[#ff0000]/80)
 *
 * @param cls - Class name to parse
 * @param customColors - Optional custom colors from tailwind.config
 * @returns Style object or null if not a shadow class
 */
export function parseShadow(cls: string, customColors?: Record<string, string>): StyleObject | null {
  // Check if it's a shadow size preset
  if (cls in SHADOW_SCALE) {
    return SHADOW_SCALE[cls];
  }

  // Check for shadow color: shadow-red-500, shadow-red-500/50, shadow-[#ff0000]/80
  if (cls.startsWith("shadow-")) {
    const colorPart = cls.substring(7); // Remove "shadow-"

    // Parse the color value using shared utility
    const shadowColor = parseColorValue(colorPart, customColors);
    if (shadowColor) {
      return { shadowColor };
    }
  }

  return null;
}

// Export shadow scale and colors for testing/advanced usage
export { SHADOW_SCALE, COLORS as SHADOW_COLORS };
