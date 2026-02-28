/**
 * Plugin state and options types
 */

import type { NodePath, PluginPass } from "@babel/core";
import type * as BabelTypes from "@babel/types";
import { SPACING_SCALE } from "../../parser/spacing.js";
import { FONT_SIZES } from "../../parser/typography.js";
import type { SchemeModifierConfig } from "../../types/config.js";
import type { StyleObject } from "../../types/core.js";
import { COLORS } from "../../utils/colorUtils.js";
import type { CustomTheme } from "../config-loader.js";
import { extractCustomTheme } from "../config-loader.js";
import { DEFAULT_CLASS_ATTRIBUTES, buildAttributeMatchers } from "../utils/attributeMatchers.js";
import type { FullResolvedTheme } from "../utils/configRefResolver.js";

/** Default font family map (mirrors FONT_FAMILY_MAP keys in parser/typography.ts) */
const DEFAULT_FONT_FAMILY: Record<string, string> = {
  sans: "System",
  serif: "serif",
  mono: "Courier",
};

/**
 * Component class-to-prop mapping rule
 *
 * Defines how to transform className tokens into component props for third-party/custom components.
 *
 * @example
 * {
 *   importFrom: '@myui/icons',
 *   components: ['Icon'],
 *   mapping: {
 *     color: 'text-*',      // Match text-red-500, text-blue-200, etc.
 *     size: 'size-*'        // Match size-4, size-6, etc.
 *   }
 * }
 */
export type ComponentClassToPropRule = {
  /**
   * Module path to import the component from
   */
  importFrom: string;

  /**
   * Component names to apply mapping to, or ['*'] to match all components from this import
   */
  components: string[];

  /**
   * Mapping of target prop name to class pattern (with * wildcard for prefix matching)
   *
   * @example
   * { color: 'text-*', size: 'size-*' }
   */
  mapping: Record<string, string>;
};


/**
 * Plugin options
 */
export type PluginOptions = {
  /**
   * List of JSX attribute names to transform (in addition to or instead of 'className')
   * Supports exact matches and glob patterns:
   * - Exact: 'className', 'containerClassName'
   * - Glob: '*ClassName' (matches any attribute ending in 'ClassName')
   *
   * @default ['className', 'contentContainerClassName', 'columnWrapperClassName', 'ListHeaderComponentClassName', 'ListFooterComponentClassName']
   */
  attributes?: string[];

  /**
   * Custom identifier name for the generated StyleSheet constant
   *
   * @default '_twStyles'
   */
  stylesIdentifier?: string;

  /**
   * Configuration for the scheme: modifier that expands to both dark: and light: modifiers
   *
   * @example
   * {
   *   darkSuffix: '-dark',  // scheme:bg-primary -> dark:bg-primary-dark
   *   lightSuffix: '-light' // scheme:bg-primary -> light:bg-primary-light
   * }
   *
   * @default { darkSuffix: '-dark', lightSuffix: '-light' }
   */
  schemeModifier?: {
    darkSuffix?: string;
    lightSuffix?: string;
  };

  /**
   * Configuration for color scheme hook import (dark:/light: modifiers)
   *
   * Allows using custom color scheme hooks from theme providers instead of
   * React Native's built-in useColorScheme.
   *
   * @example
   * // Use custom hook from theme provider
   * {
   *   importFrom: '@/hooks/useColorScheme',
   *   importName: 'useColorScheme'
   * }
   *
   * @example
   * // Use React Navigation theme
   * {
   *   importFrom: '@react-navigation/native',
   *   importName: 'useTheme'  // You'd wrap this to return ColorSchemeName
   * }
   *
   * @default { importFrom: 'react-native', importName: 'useColorScheme' }
   */
  colorScheme?: {
    /**
     * Module to import the color scheme hook from
     * @default 'react-native'
     */
    importFrom?: string;

    /**
     * Name of the hook to import
     * @default 'useColorScheme'
     */
    importName?: string;
  };

  /**
   * Configuration for config provider hook import
   *
   * Allows using custom config provider functions to inject config refs
   * into generated styles at compile time.
   *
   * @example
   * // Use custom config provider
   * {
   *   importFrom: './my-provider',
   *   importName: 'provideConfig'
   * }
   *
   * @default undefined (feature disabled)
   */
  configProvider?: {
    /**
     * Module to import the config provider from
     */
    importFrom: string;

    /**
     * Name of the provider function to import
     * @default 'provideConfig'
     */
    importName?: string;
  };

  /**
   * Configuration for mapping className tokens to component props
   *
   * Allows transforming className attributes into component props for third-party/custom components
   * that don't use React Native's style prop.
   *
   * @example
   * [
   *   {
   *     importFrom: '@myui/icons',
   *     components: ['Icon'],
   *     mapping: { color: 'text-*', size: 'size-*' }
   *   }
   * ]
   *
   * @default undefined (feature disabled)
   */
  componentClassToPropMapping?: ComponentClassToPropRule[];
};

/**
 * Plugin state - passed through all visitors
 */
export type PluginState = PluginPass & {
  styleRegistry: Map<string, StyleObject>;
  hasClassNames: boolean;
  hasStyleSheetImport: boolean;
  hasPlatformImport: boolean;
  needsPlatformImport: boolean;
  hasColorSchemeImport: boolean;
  needsColorSchemeImport: boolean;
  colorSchemeVariableName: string;
  colorSchemeImportSource: string; // Where to import the hook from (e.g., 'react-native')
  colorSchemeHookName: string; // Name of the hook to import (e.g., 'useColorScheme')
  colorSchemeLocalIdentifier?: string; // Local identifier if hook is already imported with an alias
  hasWindowDimensionsImport: boolean;
  needsWindowDimensionsImport: boolean;
  windowDimensionsVariableName: string;
  windowDimensionsLocalIdentifier?: string; // Local identifier if hook is already imported with an alias
  hasI18nManagerImport: boolean;
  needsI18nManagerImport: boolean;
  i18nManagerVariableName: string; // Variable name for the RTL state (e.g., '_twIsRTL')
  i18nManagerLocalIdentifier?: string; // Local identifier if I18nManager is already imported with an alias
  customTheme: CustomTheme;
  fullResolvedTheme: FullResolvedTheme;
  schemeModifierConfig: SchemeModifierConfig;
  supportedAttributes: Set<string>;
  attributePatterns: RegExp[];
  stylesIdentifier: string;
  // Track tw/twStyle imports from main package
  twImportNames: Set<string>; // e.g., ['tw', 'twStyle'] or ['tw as customTw']
  hasTwImport: boolean;
  // Track react-native import path for conditional StyleSheet/Platform injection
  reactNativeImportPath?: NodePath<BabelTypes.ImportDeclaration>;
  // Track function components that need colorScheme hook injection
  functionComponentsNeedingColorScheme: Set<NodePath<BabelTypes.Function>>;
  // Track function components that need windowDimensions hook injection
  functionComponentsNeedingWindowDimensions: Set<NodePath<BabelTypes.Function>>;
  // Config provider configuration
  configProviderEnabled: boolean;
  configProviderImportFrom: string;
  configProviderImportName: string;
  configRefRegistry: Map<string, Map<string, string[]>>;
  generatedConfigPath: string;
  // Class-to-prop mapping configuration
  classToPropRules: ComponentClassToPropRule[];
  classToPropImportMap: Map<string, Set<string>>; // importFrom -> Set of local component names
  needsConfigImport: boolean; // Whether __twConfig import is needed for config refs
};

// Default identifier for the generated StyleSheet constant
export const DEFAULT_STYLES_IDENTIFIER = "_twStyles";

/**
 * Create initial plugin state for a file
 *
 * @param options - Plugin options from babel config
 * @param filename - Current file being processed
 * @param colorSchemeImportSource - Where to import the color scheme hook from
 * @param colorSchemeHookName - Name of the color scheme hook to import
 * @param schemeModifierConfig - Configuration for scheme: modifier expansion
 * @param configProviderImportFrom - Module to import the config provider from
 * @param configProviderImportName - Name of the config provider function to import
 * @returns Initial plugin state
 */
export function createInitialState(
  options: PluginOptions | undefined,
  filename: string,
  colorSchemeImportSource: string,
  colorSchemeHookName: string,
  schemeModifierConfig: SchemeModifierConfig,
  configProviderImportFrom = "",
  configProviderImportName = "provideConfig",
): Partial<PluginState> {
  // Build attribute matchers from options
  const attributes = options?.attributes ?? [...DEFAULT_CLASS_ATTRIBUTES];
  const { exactMatches, patterns } = buildAttributeMatchers(attributes);
  const stylesIdentifier = options?.stylesIdentifier ?? DEFAULT_STYLES_IDENTIFIER;

  // Load custom theme from tailwind.config.*
  const customTheme = extractCustomTheme(filename);

  // Build fully resolved theme by merging built-in constants with custom theme
  const fullResolvedTheme: FullResolvedTheme = {
    colors: { ...COLORS, ...customTheme.colors },
    spacing: { ...SPACING_SCALE, ...customTheme.spacing },
    fontSize: { ...FONT_SIZES, ...customTheme.fontSize },
    fontFamily: { ...DEFAULT_FONT_FAMILY, ...customTheme.fontFamily },
  };

  // Validate and normalize class-to-prop mapping rules
  const classToPropRules: ComponentClassToPropRule[] = [];
  const classToPropImportMap = new Map<string, Set<string>>();
  let needsConfigImport = false;

  if (options?.componentClassToPropMapping) {
    for (const rule of options.componentClassToPropMapping) {
      // Validate mapping object is not empty
      if (Object.keys(rule.mapping).length === 0) {
        console.warn(
          `[react-native-tailwind] Class-to-prop mapping rule for '${rule.importFrom}' has empty mapping object. Rule will be ignored.`
        );
        continue;
      }

      // Validate each pattern contains * wildcard
      let hasInvalidPattern = false;
      for (const [prop, pattern] of Object.entries(rule.mapping)) {
        if (!pattern.includes('*')) {
          console.warn(
            `[react-native-tailwind] Class-to-prop mapping pattern '${pattern}' for prop '${prop}' in rule from '${rule.importFrom}' does not contain '*' wildcard. Pattern will be ignored.`
          );
          hasInvalidPattern = true;
        }
      }

      if (hasInvalidPattern) {
        // Still add the rule but with invalid patterns filtered out
        const validMapping = Object.fromEntries(
          Object.entries(rule.mapping).filter(([, pattern]) => pattern.includes('*'))
        );
        if (Object.keys(validMapping).length === 0) {
          continue; // Skip rule if no valid patterns remain
        }
        classToPropRules.push({ ...rule, mapping: validMapping });
      } else {
        classToPropRules.push(rule);
      }

      // Track import source -> component names mapping
      if (!classToPropImportMap.has(rule.importFrom)) {
        classToPropImportMap.set(rule.importFrom, new Set());
      }
      const componentSet = classToPropImportMap.get(rule.importFrom)!;
      for (const component of rule.components) {
        componentSet.add(component);
      }

      // Check if any rule uses configProvider (would need __twConfig import)
      if (configProviderImportFrom) {
        needsConfigImport = true;
      }
    }
  }

  return {
    styleRegistry: new Map(),
    hasClassNames: false,
    hasStyleSheetImport: false,
    hasPlatformImport: false,
    needsPlatformImport: false,
    hasColorSchemeImport: false,
    needsColorSchemeImport: false,
    colorSchemeVariableName: "_twColorScheme",
    colorSchemeImportSource,
    colorSchemeHookName,
    colorSchemeLocalIdentifier: undefined,
    hasWindowDimensionsImport: false,
    needsWindowDimensionsImport: false,
    windowDimensionsVariableName: "_twDimensions",
    windowDimensionsLocalIdentifier: undefined,
    hasI18nManagerImport: false,
    needsI18nManagerImport: false,
    i18nManagerVariableName: "_twIsRTL",
    i18nManagerLocalIdentifier: undefined,
    customTheme,
    fullResolvedTheme,
    schemeModifierConfig,
    supportedAttributes: exactMatches,
    attributePatterns: patterns,
    stylesIdentifier,
    twImportNames: new Set(),
    hasTwImport: false,
    reactNativeImportPath: undefined,
    functionComponentsNeedingColorScheme: new Set(),
    functionComponentsNeedingWindowDimensions: new Set(),
    configProviderEnabled: !!configProviderImportFrom,
    configProviderImportFrom,
    configProviderImportName,
    configRefRegistry: new Map(),
    generatedConfigPath: "",
    classToPropRules,
    classToPropImportMap,
    needsConfigImport,
  };
}
