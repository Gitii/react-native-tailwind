/**
 * @mgcrea/react-native-tailwind
 * Compile-time Tailwind CSS for React Native
 */

// Main parser functions
export { parseClass, parseClassName } from "./parser";
export { generateStyleKey } from "./utils/styleKey";

// Re-export types
export type { RNStyle, StyleObject } from "./types";

// Re-export individual parsers for advanced usage
export { parseBorder, parseColor, parseLayout, parseSizing, parseSpacing, parseTypography } from "./parser";

// Re-export constants for customization
export { COLORS } from "./parser/colors";
export { SIZE_PERCENTAGES, SIZE_SCALE } from "./parser/sizing";
export { SPACING_SCALE } from "./parser/spacing";
export { FONT_SIZES } from "./parser/typography";
