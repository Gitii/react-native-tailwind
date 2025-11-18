/**
 * Shadow and elevation utilities for React Native
 * iOS uses shadow* properties, Android uses elevation
 */

import { Platform } from "react-native";
import type { StyleObject } from "../types";

/**
 * Shadow scale definitions (raw values, not platform-specific)
 * Based on Tailwind CSS shadow scale, adapted for React Native
 */
const SHADOW_DEFINITIONS = {
  "shadow-sm": {
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
    },
    android: {
      elevation: 1,
    },
  },
  shadow: {
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
  },
  "shadow-md": {
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
  },
  "shadow-lg": {
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
  },
  "shadow-xl": {
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    android: {
      elevation: 12,
    },
  },
  "shadow-2xl": {
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
    },
    android: {
      elevation: 16,
    },
  },
  "shadow-none": {
    ios: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    },
    android: {
      elevation: 0,
    },
  },
} as const;

/**
 * Helper function to build the shadow scale using Platform.select()
 * This allows tests to rebuild the scale after changing the platform mock
 */
function buildShadowScale(): Record<string, StyleObject> {
  const scale: Record<string, StyleObject> = {};
  for (const [key, value] of Object.entries(SHADOW_DEFINITIONS)) {
    scale[key] = Platform.select<StyleObject>(value as never);
  }
  return scale;
}

/**
 * Computed shadow scale using Platform.select()
 * This is evaluated at module load time for production use
 */
let SHADOW_SCALE = buildShadowScale();

/**
 * Rebuild the shadow scale (useful for testing with platform mocks)
 */
export function rebuildShadowScale() {
  SHADOW_SCALE = buildShadowScale();
}

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

// Export shadow scale and builder for testing/advanced usage
export { buildShadowScale, SHADOW_SCALE };
