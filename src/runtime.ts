import type { ImageStyle, TextStyle, ViewStyle } from "react-native";
import { parseClassName } from "./parser/index.js";
import { flattenColors } from "./utils/flattenColors.js";

/**
 * Union type for all React Native style types
 */
export type NativeStyle = ViewStyle | TextStyle | ImageStyle;

/**
 * Return type for tw/twStyle functions with separate style properties for modifiers
 */
export type TwStyle<T extends NativeStyle = NativeStyle> = {
  style: T;
  activeStyle?: T;
  focusStyle?: T;
  disabledStyle?: T;
};

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
const styleCache = new Map<string, TwStyle>();

// Supported state modifiers for Pressable components
const SUPPORTED_MODIFIERS = ["active", "focus", "disabled"] as const;

/**
 * Detect if a className contains any state modifiers (active:, focus:, disabled:)
 */
function hasModifiers(className: string): boolean {
  return SUPPORTED_MODIFIERS.some((modifier) => className.includes(`${modifier}:`));
}

/**
 * Split className into base classes and modifier-specific classes
 * Returns: { base: string, modifiers: Map<modifier, classes[]> }
 */
function splitModifierClasses(className: string): {
  base: string[];
  modifiers: Map<string, string[]>;
} {
  const classes = className.split(/\s+/).filter(Boolean);
  const base: string[] = [];
  const modifiers = new Map<string, string[]>();

  for (const cls of classes) {
    let matched = false;
    for (const modifier of SUPPORTED_MODIFIERS) {
      const prefix = `${modifier}:`;
      if (cls.startsWith(prefix)) {
        const cleanClass = cls.slice(prefix.length);
        if (!modifiers.has(modifier)) {
          modifiers.set(modifier, []);
        }
        const modifierClasses = modifiers.get(modifier);
        if (modifierClasses) {
          modifierClasses.push(cleanClass);
        }
        matched = true;
        break;
      }
    }
    if (!matched) {
      base.push(cls);
    }
  }

  return { base, modifiers };
}

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
 * Parse className string and return a TwStyle object with separate modifier properties
 * Internal helper that handles caching and StyleSheet.create wrapping
 */
function parseAndCache(className: string): TwStyle {
  // Check cache first
  const cached = styleCache.get(className);
  if (cached) {
    return cached;
  }

  // Check if className contains modifiers
  if (!hasModifiers(className)) {
    // No modifiers - simple case
    const styleObject = parseClassName(className, globalCustomColors);

    const result: TwStyle = {
      // @ts-expect-error - StyleObject transform types are broader than React Native's strict types
      style: styleObject,
    };

    // Cache the result
    styleCache.set(className, result);

    return result;
  }

  // Has modifiers - split and parse separately
  const { base, modifiers } = splitModifierClasses(className);

  // Parse base styles
  const baseClassName = base.join(" ");
  const baseStyle = baseClassName ? parseClassName(baseClassName, globalCustomColors) : {};

  // Build result object
  const result: TwStyle = {
    // @ts-expect-error - StyleObject transform types are broader than React Native's strict types
    style: baseStyle,
  };

  // Parse and add modifier styles
  if (modifiers.has("active")) {
    const activeClasses = modifiers.get("active");
    if (activeClasses && activeClasses.length > 0) {
      const activeClassName = activeClasses.join(" ");
      // @ts-expect-error - StyleObject transform types are broader than React Native's strict types
      result.activeStyle = parseClassName(activeClassName, globalCustomColors);
    }
  }

  if (modifiers.has("focus")) {
    const focusClasses = modifiers.get("focus");
    if (focusClasses && focusClasses.length > 0) {
      const focusClassName = focusClasses.join(" ");
      // @ts-expect-error - StyleObject transform types are broader than React Native's strict types
      result.focusStyle = parseClassName(focusClassName, globalCustomColors);
    }
  }

  if (modifiers.has("disabled")) {
    const disabledClasses = modifiers.get("disabled");
    if (disabledClasses && disabledClasses.length > 0) {
      const disabledClassName = disabledClasses.join(" ");
      // @ts-expect-error - StyleObject transform types are broader than React Native's strict types
      result.disabledStyle = parseClassName(disabledClassName, globalCustomColors);
    }
  }

  // Cache the result
  styleCache.set(className, result);

  return result;
}

/**
 * Runtime Tailwind CSS template tag for React Native
 *
 * Parses Tailwind class names at runtime and returns a TwStyle object with separate
 * properties for base styles and modifier styles (active, focus, disabled).
 * Results are memoized for performance.
 *
 * @param strings - Template string parts
 * @param values - Interpolated values
 * @returns TwStyle object with style, activeStyle, focusStyle, and disabledStyle properties
 *
 * @example
 * ```tsx
 * import { tw } from '@mgcrea/react-native-tailwind/runtime';
 *
 * // Simple usage - access .style property
 * <View style={tw`m-4 p-2 bg-blue-500`.style} />
 *
 * // With interpolations
 * <View style={tw`flex-1 ${isActive && 'bg-blue-500'} p-4`.style} />
 *
 * // With state modifiers - access activeStyle/focusStyle for animations
 * const styles = tw`bg-blue-500 active:bg-blue-700 focus:bg-blue-800`;
 * <Pressable style={(state) => [
 *   styles.style,
 *   state.pressed && styles.activeStyle,
 *   state.focused && styles.focusStyle
 * ]}>
 *   <Text>Press me</Text>
 * </Pressable>
 *
 * // Use with reanimated for animations with raw values
 * const styles = tw`bg-blue-500 active:bg-blue-700`;
 * const animatedStyles = useAnimatedStyle(() => ({
 *   ...styles.style,
 *   backgroundColor: interpolateColor(
 *     progress.value,
 *     [0, 1],
 *     [styles.style.backgroundColor, styles.activeStyle?.backgroundColor]
 *   )
 * }));
 * ```
 */
export function tw<T extends NativeStyle>(strings: TemplateStringsArray, ...values: unknown[]): TwStyle<T> {
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
    return { style: {} };
  }

  return parseAndCache(normalizedClassName);
}

/**
 * String version of tw for cases where template literals aren't needed
 *
 * Parses Tailwind class names at runtime and returns a TwStyle object with separate
 * properties for base styles and modifier styles (active, focus, disabled).
 *
 * @param className - Space-separated Tailwind class names
 * @returns TwStyle object with style, activeStyle, focusStyle, and disabledStyle properties
 *
 * @example
 * ```tsx
 * import { twStyle } from '@mgcrea/react-native-tailwind/runtime';
 *
 * // Simple usage - access .style property
 * <View style={twStyle('m-4 p-2 bg-blue-500').style} />
 *
 * // With state modifiers
 * const styles = twStyle('bg-blue-500 active:bg-blue-700 focus:bg-blue-800');
 * <Pressable style={(state) => [
 *   styles.style,
 *   state.pressed && styles.activeStyle,
 *   state.focused && styles.focusStyle
 * ]}>
 *   <Text>Press me</Text>
 * </Pressable>
 * ```
 */
export function twStyle(className: string): TwStyle | undefined {
  const normalizedClassName = className.trim().replace(/\s+/g, " ");

  if (!normalizedClassName) {
    return undefined;
  }

  return parseAndCache(normalizedClassName);
}
