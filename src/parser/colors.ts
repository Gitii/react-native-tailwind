/**
 * Color utilities (background, text, border colors)
 */

import type { StyleObject } from "../types";

// Tailwind color palette
export const COLORS: Record<string, string> = {
  // Gray
  "gray-50": "#F9FAFB",
  "gray-100": "#F3F4F6",
  "gray-200": "#E5E7EB",
  "gray-300": "#D1D5DB",
  "gray-400": "#9CA3AF",
  "gray-500": "#6B7280",
  "gray-600": "#4B5563",
  "gray-700": "#374151",
  "gray-800": "#1F2937",
  "gray-900": "#111827",

  // Red
  "red-50": "#FEF2F2",
  "red-100": "#FEE2E2",
  "red-200": "#FECACA",
  "red-300": "#FCA5A5",
  "red-400": "#F87171",
  "red-500": "#EF4444",
  "red-600": "#DC2626",
  "red-700": "#B91C1C",
  "red-800": "#991B1B",
  "red-900": "#7F1D1D",

  // Blue
  "blue-50": "#EFF6FF",
  "blue-100": "#DBEAFE",
  "blue-200": "#BFDBFE",
  "blue-300": "#93C5FD",
  "blue-400": "#60A5FA",
  "blue-500": "#3B82F6",
  "blue-600": "#2563EB",
  "blue-700": "#1D4ED8",
  "blue-800": "#1E40AF",
  "blue-900": "#1E3A8A",

  // Green
  "green-50": "#F0FDF4",
  "green-100": "#DCFCE7",
  "green-200": "#BBF7D0",
  "green-300": "#86EFAC",
  "green-400": "#4ADE80",
  "green-500": "#22C55E",
  "green-600": "#16A34A",
  "green-700": "#15803D",
  "green-800": "#166534",
  "green-900": "#14532D",

  // Yellow
  "yellow-50": "#FEFCE8",
  "yellow-100": "#FEF9C3",
  "yellow-200": "#FEF08A",
  "yellow-300": "#FDE047",
  "yellow-400": "#FACC15",
  "yellow-500": "#EAB308",
  "yellow-600": "#CA8A04",
  "yellow-700": "#A16207",
  "yellow-800": "#854D0E",
  "yellow-900": "#713F12",

  // Purple
  "purple-50": "#FAF5FF",
  "purple-100": "#F3E8FF",
  "purple-200": "#E9D5FF",
  "purple-300": "#D8B4FE",
  "purple-400": "#C084FC",
  "purple-500": "#A855F7",
  "purple-600": "#9333EA",
  "purple-700": "#7E22CE",
  "purple-800": "#6B21A8",
  "purple-900": "#581C87",

  // Pink
  "pink-50": "#FDF2F8",
  "pink-100": "#FCE7F3",
  "pink-200": "#FBCFE8",
  "pink-300": "#F9A8D4",
  "pink-400": "#F472B6",
  "pink-500": "#EC4899",
  "pink-600": "#DB2777",
  "pink-700": "#BE185D",
  "pink-800": "#9D174D",
  "pink-900": "#831843",

  // Orange
  "orange-50": "#FFF7ED",
  "orange-100": "#FFEDD5",
  "orange-200": "#FED7AA",
  "orange-300": "#FDBA74",
  "orange-400": "#FB923C",
  "orange-500": "#F97316",
  "orange-600": "#EA580C",
  "orange-700": "#C2410C",
  "orange-800": "#9A3412",
  "orange-900": "#7C2D12",

  // Indigo
  "indigo-50": "#EEF2FF",
  "indigo-100": "#E0E7FF",
  "indigo-200": "#C7D2FE",
  "indigo-300": "#A5B4FC",
  "indigo-400": "#818CF8",
  "indigo-500": "#6366F1",
  "indigo-600": "#4F46E5",
  "indigo-700": "#4338CA",
  "indigo-800": "#3730A3",
  "indigo-900": "#312E81",

  // Basic colors
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
};

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
 */
export function parseColor(cls: string, customColors?: Record<string, string>): StyleObject | null {
  // Helper to get color with custom override (custom colors take precedence)
  const getColor = (key: string): string | undefined => {
    return customColors?.[key] ?? COLORS[key];
  };

  // Background color: bg-blue-500, bg-[#ff0000]
  if (cls.startsWith("bg-")) {
    const colorKey = cls.substring(3);

    // Try arbitrary value first
    const arbitraryColor = parseArbitraryColor(colorKey);
    if (arbitraryColor !== null) {
      return { backgroundColor: arbitraryColor };
    }

    // Try preset/custom colors
    const color = getColor(colorKey);
    if (color) {
      return { backgroundColor: color };
    }
  }

  // Text color: text-blue-500, text-[#ff0000]
  if (cls.startsWith("text-")) {
    const colorKey = cls.substring(5);

    // Try arbitrary value first
    const arbitraryColor = parseArbitraryColor(colorKey);
    if (arbitraryColor !== null) {
      return { color: arbitraryColor };
    }

    // Try preset/custom colors
    const color = getColor(colorKey);
    if (color) {
      return { color: color };
    }
  }

  // Border color: border-blue-500, border-[#ff0000]
  if (cls.startsWith("border-") && !cls.match(/^border-[0-9]/)) {
    const colorKey = cls.substring(7);

    // Try arbitrary value first
    const arbitraryColor = parseArbitraryColor(colorKey);
    if (arbitraryColor !== null) {
      return { borderColor: arbitraryColor };
    }

    // Try preset/custom colors
    const color = getColor(colorKey);
    if (color) {
      return { borderColor: color };
    }
  }

  return null;
}
