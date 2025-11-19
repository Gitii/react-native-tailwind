/**
 * @mgcrea/react-native-tailwind
 * Compile-time Tailwind CSS for React Native
 */

// Compile-time tw/twStyle functions (transformed by Babel plugin)
export { tw, twStyle } from "./stubs/tw.js";
export type { NativeStyle, TwStyle } from "./stubs/tw.js";

// Main parser functions
export { parseClass, parseClassName } from "./parser";
export { flattenColors } from "./utils/flattenColors";
export { generateStyleKey } from "./utils/styleKey";

// Re-export types
export type { RNStyle, StyleObject } from "./types";

// Re-export individual parsers for advanced usage
export {
  parseAspectRatio,
  parseBorder,
  parseColor,
  parseLayout,
  parseShadow,
  parseSizing,
  parseSpacing,
  parseTypography,
} from "./parser";

// Re-export constants for customization
export { ASPECT_RATIO_PRESETS } from "./parser/aspectRatio";
export { COLORS } from "./parser/colors";
export { INSET_SCALE, Z_INDEX_SCALE } from "./parser/layout";
export { SHADOW_SCALE } from "./parser/shadows";
export { SIZE_PERCENTAGES, SIZE_SCALE } from "./parser/sizing";
export { SPACING_SCALE } from "./parser/spacing";
export { FONT_SIZES, LETTER_SPACING_SCALE } from "./parser/typography";

// Re-export enhanced components with modifier support
export { Pressable } from "./components/Pressable";
export type { PressableProps } from "./components/Pressable";
export { TextInput } from "./components/TextInput";
export type { TextInputProps } from "./components/TextInput";
