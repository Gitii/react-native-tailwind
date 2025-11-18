/**
 * Shadow and elevation utilities for React Native
 * iOS uses shadow* properties, Android uses elevation
 */

import type { StyleObject } from "../types";

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
 * @param cls - Class name to parse
 * @returns Style object or null if not a shadow class
 */
export function parseShadow(cls: string): StyleObject | null {
  // Check if it's a shadow class
  if (cls in SHADOW_SCALE) {
    return SHADOW_SCALE[cls];
  }

  return null;
}

// Export shadow scale for testing/advanced usage
export { SHADOW_SCALE };
