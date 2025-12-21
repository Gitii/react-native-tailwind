/**
 * Shadow and elevation utilities for React Native
 * iOS uses shadow* properties, Android uses elevation
 */

import { TAILWIND_COLORS } from "../config/tailwind";
import type { StyleObject } from "../types";
import { flattenColors } from "../utils/flattenColors";

// Default colors (same as colors.ts)
const COLORS: Record<string, string> = {
  ...flattenColors(TAILWIND_COLORS),
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
};

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

    // Parse the color value
    const shadowColor = parseShadowColorValue(colorPart, customColors);
    if (shadowColor) {
      return { shadowColor };
    }
  }

  return null;
}

/**
 * Apply opacity to hex color by appending alpha channel
 * @param hex - Hex color string (e.g., "#ff0000", "#f00", or "transparent")
 * @param opacity - Opacity value 0-100 (e.g., 50 for 50%)
 * @returns 8-digit hex with alpha (e.g., "#FF000080") or transparent
 */
function applyOpacity(hex: string, opacity: number): string {
  if (hex === "transparent") {
    return "transparent";
  }

  const cleanHex = hex.replace(/^#/, "");
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split("")
          .map((char) => char + char)
          .join("")
      : cleanHex;

  const alpha = Math.round((opacity / 100) * 255);
  const alphaHex = alpha.toString(16).padStart(2, "0").toUpperCase();

  return `#${fullHex.toUpperCase()}${alphaHex}`;
}

/**
 * Parse arbitrary color value: [#ff0000], [#f00], [#FF0000AA]
 */
function parseArbitraryColor(value: string): string | null {
  const hexMatch = value.match(/^\[#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\]$/);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3) {
      const expanded = hex
        .split("")
        .map((char) => char + char)
        .join("");
      return `#${expanded.toUpperCase()}`;
    }
    return `#${hex.toUpperCase()}`;
  }
  return null;
}

/**
 * Parse shadow color value with optional opacity
 * @param colorKey - Color key like "red-500", "red-500/50", "[#ff0000]", "[#ff0000]/80"
 * @param customColors - Optional custom colors from tailwind.config
 * @returns Hex color string or null if invalid
 */
function parseShadowColorValue(colorKey: string, customColors?: Record<string, string>): string | null {
  const getColor = (key: string): string | undefined => {
    return customColors?.[key] ?? COLORS[key];
  };

  // Check for opacity modifier: red-500/50, [#ff0000]/80
  const opacityMatch = colorKey.match(/^(.+)\/(\d+)$/);
  if (opacityMatch) {
    const baseColorKey = opacityMatch[1];
    const opacity = Number.parseInt(opacityMatch[2], 10);

    // Validate opacity range (0-100)
    if (opacity < 0 || opacity > 100) {
      return null;
    }

    // Try arbitrary color first: [#ff0000]/50
    const arbitraryColor = parseArbitraryColor(baseColorKey);
    if (arbitraryColor !== null) {
      return applyOpacity(arbitraryColor, opacity);
    }

    // Try preset/custom colors: red-500/50
    const color = getColor(baseColorKey);
    if (color) {
      return applyOpacity(color, opacity);
    }

    return null;
  }

  // No opacity modifier
  // Try arbitrary value first: [#ff0000]
  const arbitraryColor = parseArbitraryColor(colorKey);
  if (arbitraryColor !== null) {
    return arbitraryColor;
  }

  // Try preset/custom colors: red-500
  return getColor(colorKey) ?? null;
}

// Export shadow scale and colors for testing/advanced usage
export { SHADOW_SCALE, COLORS as SHADOW_COLORS };
