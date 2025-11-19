import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from "react-native";
import { parseClassName } from "./parser/index.js";
import { flattenColors } from "./utils/flattenColors.js";

/**
 * Runtime configuration type matching Tailwind config structure
 */
export type RuntimeConfig = {
  theme?: {
    extend?: {
      colors?: Record<string, string | Record<string, string>>;
      // Future extensions can be added here:
      // spacing?: Record<string, number | string>;
      // fontFamily?: Record<string, string[]>;
    };
  };
};

// Global custom colors configuration
let globalCustomColors: Record<string, string> | undefined;

// Simple memoization cache
const styleCache = new Map<string, ViewStyle | TextStyle | ImageStyle>();

/**
 * Configure runtime Tailwind settings
 * Matches the structure of tailwind.config.mjs for consistency
 *
 * @param config - Runtime configuration object
 *
 * @example
 * ```typescript
 * import { setConfig } from '@mgcrea/react-native-tailwind/runtime';
 *
 * setConfig({
 *   theme: {
 *     extend: {
 *       colors: {
 *         primary: '#007AFF',
 *         secondary: '#5856D6',
 *         brand: {
 *           light: '#FF6B6B',
 *           dark: '#CC0000'
 *         }
 *       }
 *     }
 *   }
 * });
 * ```
 */
export function setConfig(config: RuntimeConfig): void {
  // Extract and flatten custom colors
  if (config.theme?.extend?.colors) {
    globalCustomColors = flattenColors(config.theme.extend.colors);
  } else {
    globalCustomColors = undefined;
  }

  // Clear cache when config changes
  styleCache.clear();
}

/**
 * Get currently configured custom colors
 */
export function getCustomColors(): Record<string, string> | undefined {
  return globalCustomColors;
}

/**
 * Clear the memoization cache
 * Useful for testing or when you want to force re-parsing
 */
export function clearCache(): void {
  styleCache.clear();
}

/**
 * Get cache statistics (for debugging/monitoring)
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: styleCache.size,
    keys: Array.from(styleCache.keys()),
  };
}

/**
 * Parse className string and return a StyleSheet reference
 * Internal helper that handles caching and StyleSheet.create wrapping
 */
function parseAndCache(className: string) {
  // Check cache first
  if (styleCache.has(className)) {
    return styleCache.get(className);
  }

  // Parse the className
  const styleObject = parseClassName(className, globalCustomColors);

  // Wrap in StyleSheet.create for React Native optimization
  // Type cast needed because StyleObject has broader transform types than React Native's strict types
  // @ts-expect-error - StyleObject transform types are broader than React Native's ViewStyle
  const styleSheet = StyleSheet.create({ style: styleObject });
  const styleRef = styleSheet.style;

  // Cache the result
  styleCache.set(className, styleRef);

  return styleRef;
}

/**
 * Runtime Tailwind CSS template tag for React Native
 *
 * Parses Tailwind class names at runtime and returns a StyleSheet reference.
 * Results are memoized for performance.
 *
 * @param strings - Template string parts
 * @param values - Interpolated values
 * @returns StyleSheet reference that can be used in style prop
 *
 * @example
 * ```tsx
 * import { tw } from '@mgcrea/react-native-tailwind/runtime';
 *
 * // Static classes
 * <View style={tw`m-4 p-2 bg-blue-500`} />
 *
 * // With interpolations
 * <View style={tw`flex-1 ${isActive && 'bg-blue-500'} p-4`} />
 *
 * // Conditional classes
 * <View style={tw`p-4 ${isLarge ? 'text-xl' : 'text-sm'}`} />
 * ```
 */
export function tw(strings: TemplateStringsArray, ...values: unknown[]) {
  // Combine template strings and values into a single className string
  const className = strings.reduce((acc, str, i) => {
    const value = values[i];
    // Handle falsy values (false, null, undefined) - don't add them
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const valueStr = value ? String(value) : "";
    return acc + str + valueStr;
  }, "");

  // Trim and normalize whitespace
  const normalizedClassName = className.trim().replace(/\s+/g, " ");

  // Handle empty className
  if (!normalizedClassName) {
    return undefined;
  }

  return parseAndCache(normalizedClassName);
}

/**
 * String version of tw for cases where template literals aren't needed
 *
 * @param className - Space-separated Tailwind class names
 * @returns StyleSheet reference that can be used in style prop
 *
 * @example
 * ```tsx
 * import { twStyle } from '@mgcrea/react-native-tailwind/runtime';
 *
 * <View style={twStyle('m-4 p-2 bg-blue-500')} />
 * ```
 */
export function twStyle(className: string) {
  const normalizedClassName = className.trim().replace(/\s+/g, " ");

  if (!normalizedClassName) {
    return undefined;
  }

  return parseAndCache(normalizedClassName);
}
