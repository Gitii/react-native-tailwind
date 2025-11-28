import type { CustomTheme } from "./parser/index.js";
import { parseClassName } from "./parser/index.js";
import type { NativeStyle, TwStyle } from "./types/runtime.js";
import { flattenColors } from "./utils/flattenColors.js";
import { hasModifiers, splitModifierClasses } from "./utils/modifiers.js";

/**
 * Runtime configuration type matching Tailwind config structure
 */
export type RuntimeConfig = {
  theme?: {
    extend?: {
      colors?: Record<string, string | Record<string, string>>;
      fontFamily?: Record<string, string | string[]>;
      fontSize?: Record<string, string | number>;
      spacing?: Record<string, string | number>;
    };
  };
};

// Global custom theme configuration
const globalCustomTheme: CustomTheme = {
  colors: {},
  fontFamily: {},
  fontSize: {},
  spacing: {},
};

// Simple memoization cache
const styleCache = new Map<string, TwStyle>();

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
    globalCustomTheme.colors = flattenColors(config.theme?.extend.colors);
  } else {
    globalCustomTheme.colors = {};
  }

  // Extract custom fontFamily
  if (config.theme?.extend?.fontFamily) {
    const fontFamilyResult: Record<string, string> = {};
    for (const [key, value] of Object.entries(config.theme.extend.fontFamily)) {
      if (Array.isArray(value)) {
        // Take first font in the array (React Native doesn't support font stacks)
        fontFamilyResult[key] = value[0];
      } else {
        fontFamilyResult[key] = value;
      }
    }
    globalCustomTheme.fontFamily = fontFamilyResult;
  } else {
    globalCustomTheme.fontFamily = {};
  }

  // Extract custom fontSize
  if (config.theme?.extend?.fontSize) {
    const fontSizeResult: Record<string, number> = {};
    for (const [key, value] of Object.entries(config.theme.extend.fontSize)) {
      if (typeof value === "number") {
        fontSizeResult[key] = value;
      } else if (typeof value === "string") {
        // Parse string values like "18px" or "18" to number
        const parsed = parseFloat(value.replace(/px$/, ""));
        if (!isNaN(parsed)) {
          fontSizeResult[key] = parsed;
        }
      }
    }
    globalCustomTheme.fontSize = fontSizeResult;
  } else {
    globalCustomTheme.fontSize = {};
  }

  // Extract custom spacing
  if (config.theme?.extend?.spacing) {
    const spacingResult: Record<string, number> = {};
    for (const [key, value] of Object.entries(config.theme.extend.spacing)) {
      if (typeof value === "number") {
        spacingResult[key] = value;
      } else if (typeof value === "string") {
        // Parse string values: "18rem" -> 288, "16px" -> 16, "16" -> 16
        let parsed: number;
        if (value.endsWith("rem")) {
          // Convert rem to px (1rem = 16px)
          parsed = parseFloat(value.replace(/rem$/, "")) * 16;
        } else {
          // Parse px or unitless values
          parsed = parseFloat(value.replace(/px$/, ""));
        }
        if (!isNaN(parsed)) {
          spacingResult[key] = parsed;
        }
      }
    }
    globalCustomTheme.spacing = spacingResult;
  } else {
    globalCustomTheme.spacing = {};
  }

  // Clear cache when config changes
  styleCache.clear();
}

/**
 * Get currently configured custom theme
 */
export function getCustomTheme(): CustomTheme {
  return globalCustomTheme;
}

/**
 * Get currently configured custom colors (for backwards compatibility)
 * @deprecated Use getCustomTheme() instead
 */
export function getCustomColors(): Record<string, string> | undefined {
  return Object.keys(globalCustomTheme.colors ?? {}).length > 0 ? globalCustomTheme.colors : undefined;
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
    const styleObject = parseClassName(className, globalCustomTheme);

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
  const baseStyle = baseClassName ? parseClassName(baseClassName, globalCustomTheme) : {};

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
      result.activeStyle = parseClassName(activeClassName, globalCustomTheme);
    }
  }

  if (modifiers.has("focus")) {
    const focusClasses = modifiers.get("focus");
    if (focusClasses && focusClasses.length > 0) {
      const focusClassName = focusClasses.join(" ");
      // @ts-expect-error - StyleObject transform types are broader than React Native's strict types
      result.focusStyle = parseClassName(focusClassName, globalCustomTheme);
    }
  }

  if (modifiers.has("disabled")) {
    const disabledClasses = modifiers.get("disabled");
    if (disabledClasses && disabledClasses.length > 0) {
      const disabledClassName = disabledClasses.join(" ");
      // @ts-expect-error - StyleObject transform types are broader than React Native's strict types
      result.disabledStyle = parseClassName(disabledClassName, globalCustomTheme);
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
export function tw<T extends NativeStyle = NativeStyle>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): TwStyle<T> {
  // Combine template strings and values into a single className string
  const className = strings.reduce((acc, str, i) => {
    const value = values[i];
    // Handle falsy values (false, null, undefined) - don't add them
    // Note: 0 and empty string are preserved as they may be valid values
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const valueStr = value != null && value !== false ? String(value) : "";
    return acc + str + valueStr;
  }, "");

  // Trim and normalize whitespace
  const normalizedClassName = className.trim().replace(/\s+/g, " ");

  // Handle empty className
  if (!normalizedClassName) {
    return { style: {} as T };
  }

  return parseAndCache(normalizedClassName) as TwStyle<T>;
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
export function twStyle<T extends NativeStyle = NativeStyle>(className: string): TwStyle<T> | undefined {
  const normalizedClassName = className.trim().replace(/\s+/g, " ");

  if (!normalizedClassName) {
    return undefined;
  }

  return parseAndCache(normalizedClassName) as TwStyle<T>;
}
