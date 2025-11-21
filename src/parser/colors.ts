/**
 * Color utilities (background, text, border colors)
 */

import { TAILWIND_COLORS } from "../config/tailwind";
import type { StyleObject } from "../types";
import { flattenColors } from "../utils/flattenColors";

// Tailwind color palette (flattened from config)
export const COLORS: Record<string, string> = {
  ...flattenColors(TAILWIND_COLORS),
  // Add basic colors
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
};

/**
 * Apply opacity to hex color by appending alpha channel
 * @param hex - Hex color string (e.g., "#ff0000", "#f00", or "transparent")
 * @param opacity - Opacity value 0-100 (e.g., 50 for 50%)
 * @returns 8-digit hex with alpha (e.g., "#FF000080") or rgba for special colors
 */
function applyOpacity(hex: string, opacity: number): string {
  // Handle transparent specially
  if (hex === "transparent") {
    return "transparent";
  }

  // Remove # if present
  const cleanHex = hex.replace(/^#/, "");

  // Expand 3-digit hex to 6-digit: #abc -> #aabbcc
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split("")
          .map((char) => char + char)
          .join("")
      : cleanHex;

  // Convert opacity percentage (0-100) to hex (00-FF)
  const alpha = Math.round((opacity / 100) * 255);
  const alphaHex = alpha.toString(16).padStart(2, "0").toUpperCase();

  // Return 8-digit hex: #RRGGBBAA
  return `#${fullHex.toUpperCase()}${alphaHex}`;
}

/**
 * Parse arbitrary color value: [#ff0000], [#f00], [#FF0000AA]
 * Supports 3-digit, 6-digit, and 8-digit (with alpha) hex colors
 * Returns hex string if valid, null otherwise
 */
function parseArbitraryColor(value: string): string | null {
  // Match: [#rgb], [#rrggbb], or [#rrggbbaa]
  const hexMatch = value.match(/^\[#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\]$/);
  if (hexMatch) {
    const hex = hexMatch[1];
    // Expand 3-digit hex to 6-digit: #abc -> #aabbcc
    if (hex.length === 3) {
      const expanded = hex
        .split("")
        .map((char) => char + char)
        .join("");
      return `#${expanded}`;
    }
    return `#${hex}`;
  }

  // Warn about unsupported formats
  if (value.startsWith("[") && value.endsWith("]")) {
    /* v8 ignore next 5 */
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[react-native-tailwind] Unsupported arbitrary color value: ${value}. Only hex colors are supported (e.g., [#ff0000], [#f00], or [#ff0000aa]).`,
      );
    }
    return null;
  }

  return null;
}

/**
 * Parse color classes (background, text, border)
 * Supports opacity modifier: bg-blue-500/50, text-black/80, border-red-500/30
 */
export function parseColor(cls: string, customColors?: Record<string, string>): StyleObject | null {
  // Helper to get color with custom override (custom colors take precedence)
  const getColor = (key: string): string | undefined => {
    return customColors?.[key] ?? COLORS[key];
  };

  // Helper to parse color with optional opacity modifier
  const parseColorWithOpacity = (colorKey: string): string | null => {
    // Check for opacity modifier: blue-500/50
    const opacityMatch = colorKey.match(/^(.+)\/(\d+)$/);
    if (opacityMatch) {
      const baseColorKey = opacityMatch[1];
      const opacity = Number.parseInt(opacityMatch[2], 10);

      // Validate opacity range (0-100)
      if (opacity < 0 || opacity > 100) {
        /* v8 ignore next 5 */
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[react-native-tailwind] Invalid opacity value: ${opacity}. Opacity must be between 0 and 100.`,
          );
        }
        return null;
      }

      // Try arbitrary color first: bg-[#ff0000]/50
      const arbitraryColor = parseArbitraryColor(baseColorKey);
      if (arbitraryColor !== null) {
        return applyOpacity(arbitraryColor, opacity);
      }

      // Try preset/custom colors: bg-blue-500/50
      const color = getColor(baseColorKey);
      if (color) {
        return applyOpacity(color, opacity);
      }

      return null;
    }

    // No opacity modifier - try normal color parsing
    // Try arbitrary value first
    const arbitraryColor = parseArbitraryColor(colorKey);
    if (arbitraryColor !== null) {
      return arbitraryColor;
    }

    // Try preset/custom colors
    return getColor(colorKey) ?? null;
  };

  // Background color: bg-blue-500, bg-blue-500/50, bg-[#ff0000]/80
  // Only parse arbitrary values that look like colors (start with #)
  if (cls.startsWith("bg-")) {
    const colorKey = cls.substring(3);
    // Skip arbitrary values that don't look like colors (e.g., bg-[100%] is sizing)
    if (colorKey.startsWith("[") && !colorKey.startsWith("[#")) {
      return null;
    }
    const color = parseColorWithOpacity(colorKey);
    if (color) {
      return { backgroundColor: color };
    }
  }

  // Text color: text-blue-500, text-blue-500/50, text-[#ff0000]/80
  // Only parse arbitrary values that look like colors (start with #)
  if (cls.startsWith("text-")) {
    const colorKey = cls.substring(5);
    // Skip arbitrary values that don't look like colors (e.g., text-[13px] is font size)
    if (colorKey.startsWith("[") && !colorKey.startsWith("[#")) {
      return null;
    }
    const color = parseColorWithOpacity(colorKey);
    if (color) {
      return { color: color };
    }
  }

  // Border color: border-blue-500, border-blue-500/50, border-[#ff0000]/80
  if (cls.startsWith("border-") && !cls.match(/^border-[0-9]/)) {
    const colorKey = cls.substring(7);
    // Skip arbitrary values that don't look like colors (e.g., border-[3px] is width)
    if (colorKey.startsWith("[") && !colorKey.startsWith("[#")) {
      return null;
    }
    const color = parseColorWithOpacity(colorKey);
    if (color) {
      return { borderColor: color };
    }
  }

  return null;
}
