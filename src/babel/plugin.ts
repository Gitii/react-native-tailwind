/**
 * Babel plugin for react-native-tailwind
 * Transforms className props to style props at compile time
 */

import type { NodePath, PluginObj, PluginPass } from "@babel/core";
import * as BabelTypes from "@babel/types";
import type { ParsedModifier, StateModifierType } from "../parser/index.js";
import {
  isPlatformModifier,
  isStateModifier,
  parseClassName,
  parsePlaceholderClasses,
  splitModifierClasses,
} from "../parser/index.js";
import type { StyleObject } from "../types/core.js";
import { generateStyleKey } from "../utils/styleKey.js";
import { extractCustomColors } from "./config-loader.js";

// Import utility functions
import {
  DEFAULT_CLASS_ATTRIBUTES,
  buildAttributeMatchers,
  getTargetStyleProp,
  isAttributeSupported,
} from "./utils/attributeMatchers.js";
import { getComponentModifierSupport, getStatePropertyForModifier } from "./utils/componentSupport.js";
import { processDynamicExpression } from "./utils/dynamicProcessing.js";
import { createStyleFunction, processStaticClassNameWithModifiers } from "./utils/modifierProcessing.js";
import { processPlatformModifiers } from "./utils/platformModifierProcessing.js";
import { addPlatformImport, addStyleSheetImport, injectStylesAtTop } from "./utils/styleInjection.js";
import {
  addOrMergePlaceholderTextColorProp,
  findStyleAttribute,
  mergeDynamicStyleAttribute,
  mergeStyleAttribute,
  mergeStyleFunctionAttribute,
  replaceDynamicWithStyleAttribute,
  replaceWithStyleAttribute,
  replaceWithStyleFunctionAttribute,
} from "./utils/styleTransforms.js";
import { processTwCall, removeTwImports } from "./utils/twProcessing.js";

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
};

type PluginState = PluginPass & {
  styleRegistry: Map<string, StyleObject>;
  hasClassNames: boolean;
  hasStyleSheetImport: boolean;
  hasPlatformImport: boolean;
  needsPlatformImport: boolean;
  customColors: Record<string, string>;
  supportedAttributes: Set<string>;
  attributePatterns: RegExp[];
  stylesIdentifier: string;
  // Track tw/twStyle imports from main package
  twImportNames: Set<string>; // e.g., ['tw', 'twStyle'] or ['tw as customTw']
  hasTwImport: boolean;
  // Track react-native import path for conditional StyleSheet/Platform injection
  reactNativeImportPath?: NodePath<BabelTypes.ImportDeclaration>;
};

// Default identifier for the generated StyleSheet constant
const DEFAULT_STYLES_IDENTIFIER = "_twStyles";

export default function reactNativeTailwindBabelPlugin(
  { types: t }: { types: typeof BabelTypes },
  options?: PluginOptions,
): PluginObj<PluginState> {
  // Build attribute matchers from options
  const attributes = options?.attributes ?? [...DEFAULT_CLASS_ATTRIBUTES];
  const { exactMatches, patterns } = buildAttributeMatchers(attributes);
  const stylesIdentifier = options?.stylesIdentifier ?? DEFAULT_STYLES_IDENTIFIER;

  return {
    name: "react-native-tailwind",

    visitor: {
      Program: {
        enter(_path: NodePath, state: PluginState) {
          // Initialize state for this file
          state.styleRegistry = new Map();
          state.hasClassNames = false;
          state.hasStyleSheetImport = false;
          state.hasPlatformImport = false;
          state.needsPlatformImport = false;
          state.supportedAttributes = exactMatches;
          state.attributePatterns = patterns;
          state.stylesIdentifier = stylesIdentifier;
          state.twImportNames = new Set();
          state.hasTwImport = false;

          // Load custom colors from tailwind.config.*
          state.customColors = extractCustomColors(state.file.opts.filename ?? "");
        },

        exit(path, state) {
          // Remove tw/twStyle imports if they were used (and transformed)
          if (state.hasTwImport) {
            removeTwImports(path, t);
          }

          // If no classNames were found, skip StyleSheet generation
          if (!state.hasClassNames || state.styleRegistry.size === 0) {
            return;
          }

          // Add StyleSheet import if not already present
          if (!state.hasStyleSheetImport) {
            addStyleSheetImport(path, t);
          }

          // Add Platform import if platform modifiers were used and not already present
          if (state.needsPlatformImport && !state.hasPlatformImport) {
            addPlatformImport(path, t);
          }

          // Generate and inject StyleSheet.create at the beginning of the file (after imports)
          // This ensures _twStyles is defined before any code that references it
          injectStylesAtTop(path, state.styleRegistry, state.stylesIdentifier, t);
        },
      },

      // Check if StyleSheet/Platform are already imported and track tw/twStyle imports
      ImportDeclaration(path, state) {
        const node = path.node;

        // Track react-native StyleSheet and Platform imports
        if (node.source.value === "react-native") {
          const specifiers = node.specifiers;

          const hasStyleSheet = specifiers.some((spec) => {
            if (t.isImportSpecifier(spec) && t.isIdentifier(spec.imported)) {
              return spec.imported.name === "StyleSheet";
            }
            return false;
          });

          const hasPlatform = specifiers.some((spec) => {
            if (t.isImportSpecifier(spec) && t.isIdentifier(spec.imported)) {
              return spec.imported.name === "Platform";
            }
            return false;
          });

          // Only track if imports exist - don't mutate yet
          // Actual import injection happens in Program.exit only if needed
          if (hasStyleSheet) {
            state.hasStyleSheetImport = true;
          }

          if (hasPlatform) {
            state.hasPlatformImport = true;
          }

          // Store reference to the react-native import for later modification if needed
          state.reactNativeImportPath = path;
        }

        // Track tw/twStyle imports from main package (for compile-time transformation)
        if (node.source.value === "@mgcrea/react-native-tailwind") {
          const specifiers = node.specifiers;
          specifiers.forEach((spec) => {
            if (t.isImportSpecifier(spec) && t.isIdentifier(spec.imported)) {
              const importedName = spec.imported.name;
              if (importedName === "tw" || importedName === "twStyle") {
                // Track the local name (could be renamed: import { tw as customTw })
                const localName = spec.local.name;
                state.twImportNames.add(localName);
                state.hasTwImport = true;
              }
            }
          });
        }
      },

      // Handle tw`...` tagged template expressions
      TaggedTemplateExpression(path, state) {
        const node = path.node;

        // Check if the tag is a tracked tw import
        if (!t.isIdentifier(node.tag)) {
          return;
        }

        const tagName = node.tag.name;
        if (!state.twImportNames.has(tagName)) {
          return;
        }

        // Extract static className from template literal
        const quasi = node.quasi;
        if (!t.isTemplateLiteral(quasi)) {
          return;
        }

        // Only support static strings (no interpolations)
        if (quasi.expressions.length > 0) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              `[react-native-tailwind] Dynamic tw\`...\` with interpolations is not supported at ${state.file.opts.filename ?? "unknown"}. ` +
                `Use style prop for dynamic values.`,
            );
          }
          return;
        }

        // Get the static className string
        const className = quasi.quasis[0]?.value.cooked?.trim() ?? "";
        if (!className) {
          // Replace with empty object
          path.replaceWith(
            t.objectExpression([t.objectProperty(t.identifier("style"), t.objectExpression([]))]),
          );
          return;
        }

        state.hasClassNames = true;

        // Process the className with modifiers
        processTwCall(className, path, state, parseClassName, generateStyleKey, splitModifierClasses, t);
      },

      // Handle twStyle('...') call expressions
      CallExpression(path, state) {
        const node = path.node;

        // Check if the callee is a tracked twStyle import
        if (!t.isIdentifier(node.callee)) {
          return;
        }

        const calleeName = node.callee.name;
        if (!state.twImportNames.has(calleeName)) {
          return;
        }

        // Must have exactly one argument
        if (node.arguments.length !== 1) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              `[react-native-tailwind] twStyle() expects exactly one argument at ${state.file.opts.filename ?? "unknown"}`,
            );
          }
          return;
        }

        const arg = node.arguments[0];

        // Only support static string literals
        if (!t.isStringLiteral(arg)) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              `[react-native-tailwind] twStyle() only supports static string literals at ${state.file.opts.filename ?? "unknown"}. ` +
                `Use style prop for dynamic values.`,
            );
          }
          return;
        }

        const className = arg.value.trim();
        if (!className) {
          // Replace with undefined
          path.replaceWith(t.identifier("undefined"));
          return;
        }

        state.hasClassNames = true;

        // Process the className with modifiers
        processTwCall(className, path, state, parseClassName, generateStyleKey, splitModifierClasses, t);
      },

      JSXAttribute(path, state) {
        const node = path.node;

        // Ensure we have a JSXIdentifier name (not JSXNamespacedName)
        if (!t.isJSXIdentifier(node.name)) {
          return;
        }

        const attributeName = node.name.name;

        // Only process configured className-like attributes
        if (!isAttributeSupported(attributeName, state.supportedAttributes, state.attributePatterns)) {
          return;
        }

        const value = node.value;

        // Determine target style prop based on attribute name
        const targetStyleProp = getTargetStyleProp(attributeName);

        // Handle static string literals
        if (t.isStringLiteral(value)) {
          const className = value.value.trim();

          // Skip empty classNames
          if (!className) {
            path.remove();
            return;
          }

          state.hasClassNames = true;

          // Check if className contains modifiers (active:, hover:, focus:, placeholder:, ios:, android:, web:)
          const { baseClasses, modifierClasses } = splitModifierClasses(className);

          // Separate modifiers by type
          const placeholderModifiers = modifierClasses.filter((m) => m.modifier === "placeholder");
          const platformModifiers = modifierClasses.filter((m) => isPlatformModifier(m.modifier));
          const stateModifiers = modifierClasses.filter(
            (m) => isStateModifier(m.modifier) && m.modifier !== "placeholder",
          );

          // Handle placeholder modifiers first (they generate placeholderTextColor prop, not style)
          if (placeholderModifiers.length > 0) {
            // Check if this is a TextInput component (placeholder only works on TextInput)
            const jsxOpeningElement = path.parent as BabelTypes.JSXOpeningElement;
            const componentSupport = getComponentModifierSupport(jsxOpeningElement, t);

            if (componentSupport?.supportedModifiers.includes("placeholder")) {
              const placeholderClasses = placeholderModifiers.map((m) => m.baseClass).join(" ");
              const placeholderColor = parsePlaceholderClasses(placeholderClasses, state.customColors);

              if (placeholderColor) {
                // Add or merge placeholderTextColor prop
                addOrMergePlaceholderTextColorProp(jsxOpeningElement, placeholderColor, t);
              }
            } else {
              // Warn if placeholder modifier used on non-TextInput element
              if (process.env.NODE_ENV !== "production") {
                console.warn(
                  `[react-native-tailwind] placeholder: modifier can only be used on TextInput component at ${state.file.opts.filename ?? "unknown"}`,
                );
              }
            }
          }

          // Handle combination of modifiers
          const hasPlatformModifiers = platformModifiers.length > 0;
          const hasStateModifiers = stateModifiers.length > 0;
          const hasBaseClasses = baseClasses.length > 0;

          // If we have both state and platform modifiers, or platform modifiers with complex state,
          // we need to combine them in an array expression wrapped in an arrow function
          if (hasStateModifiers && hasPlatformModifiers) {
            // Get the JSX opening element for component support checking
            const jsxOpeningElement = path.parent;
            const componentSupport = getComponentModifierSupport(jsxOpeningElement, t);

            if (componentSupport) {
              // Build style array: [baseStyle, Platform.select(...), stateConditionals]
              const styleArrayElements: BabelTypes.Expression[] = [];

              // Add base classes
              if (hasBaseClasses) {
                const baseClassName = baseClasses.join(" ");
                const baseStyleObject = parseClassName(baseClassName, state.customColors);
                const baseStyleKey = generateStyleKey(baseClassName);
                state.styleRegistry.set(baseStyleKey, baseStyleObject);
                styleArrayElements.push(
                  t.memberExpression(t.identifier(state.stylesIdentifier), t.identifier(baseStyleKey)),
                );
              }

              // Add platform modifiers as Platform.select()
              const platformSelectExpression = processPlatformModifiers(
                platformModifiers,
                state,
                parseClassName,
                generateStyleKey,
                t,
              );
              styleArrayElements.push(platformSelectExpression);

              // Add state modifiers as conditionals
              // Group by modifier type
              const modifiersByType = new Map<StateModifierType, ParsedModifier[]>();
              for (const mod of stateModifiers) {
                const modType = mod.modifier as StateModifierType;
                if (!modifiersByType.has(modType)) {
                  modifiersByType.set(modType, []);
                }
                modifiersByType.get(modType)?.push(mod);
              }

              // Build conditionals for each state modifier type
              for (const [modifierType, modifiers] of modifiersByType) {
                if (!componentSupport.supportedModifiers.includes(modifierType)) {
                  continue; // Skip unsupported modifiers
                }

                const modifierClassNames = modifiers.map((m) => m.baseClass).join(" ");
                const modifierStyleObject = parseClassName(modifierClassNames, state.customColors);
                const modifierStyleKey = generateStyleKey(`${modifierType}_${modifierClassNames}`);
                state.styleRegistry.set(modifierStyleKey, modifierStyleObject);

                const stateProperty = getStatePropertyForModifier(modifierType);
                const conditionalExpression = t.logicalExpression(
                  "&&",
                  t.identifier(stateProperty),
                  t.memberExpression(t.identifier(state.stylesIdentifier), t.identifier(modifierStyleKey)),
                );

                styleArrayElements.push(conditionalExpression);
              }

              // Wrap in arrow function for state support
              const usedModifiers = Array.from(new Set(stateModifiers.map((m) => m.modifier))).filter((mod) =>
                componentSupport.supportedModifiers.includes(mod),
              );
              const styleArrayExpression = t.arrayExpression(styleArrayElements);
              const styleFunctionExpression = createStyleFunction(styleArrayExpression, usedModifiers, t);

              const styleAttribute = findStyleAttribute(path, targetStyleProp, t);
              if (styleAttribute) {
                mergeStyleFunctionAttribute(path, styleAttribute, styleFunctionExpression, t);
              } else {
                replaceWithStyleFunctionAttribute(path, styleFunctionExpression, targetStyleProp, t);
              }
              return;
            } else {
              // Component doesn't support state modifiers, but we can still use platform modifiers
              // Fall through to platform-only handling
            }
          }

          // Handle platform-only modifiers (no state modifiers)
          if (hasPlatformModifiers && !hasStateModifiers) {
            // Build style array/expression: [baseStyle, Platform.select(...)]
            const styleExpressions: BabelTypes.Expression[] = [];

            // Add base classes
            if (hasBaseClasses) {
              const baseClassName = baseClasses.join(" ");
              const baseStyleObject = parseClassName(baseClassName, state.customColors);
              const baseStyleKey = generateStyleKey(baseClassName);
              state.styleRegistry.set(baseStyleKey, baseStyleObject);
              styleExpressions.push(
                t.memberExpression(t.identifier(state.stylesIdentifier), t.identifier(baseStyleKey)),
              );
            }

            // Add platform modifiers as Platform.select()
            const platformSelectExpression = processPlatformModifiers(
              platformModifiers,
              state,
              parseClassName,
              generateStyleKey,
              t,
            );
            styleExpressions.push(platformSelectExpression);

            // Generate style attribute
            const styleExpression =
              styleExpressions.length === 1 ? styleExpressions[0] : t.arrayExpression(styleExpressions);

            const styleAttribute = findStyleAttribute(path, targetStyleProp, t);
            if (styleAttribute) {
              // Merge with existing style attribute
              const existingStyle = styleAttribute.value;
              if (
                t.isJSXExpressionContainer(existingStyle) &&
                !t.isJSXEmptyExpression(existingStyle.expression)
              ) {
                const existing = existingStyle.expression;
                // Merge as array: [ourStyles, existingStyles]
                const mergedArray = t.isArrayExpression(existing)
                  ? t.arrayExpression([styleExpression, ...existing.elements])
                  : t.arrayExpression([styleExpression, existing]);
                styleAttribute.value = t.jsxExpressionContainer(mergedArray);
              } else {
                styleAttribute.value = t.jsxExpressionContainer(styleExpression);
              }
              path.remove();
            } else {
              // Replace className with style prop containing our expression
              path.node.name = t.jsxIdentifier(targetStyleProp);
              path.node.value = t.jsxExpressionContainer(styleExpression);
            }
            return;
          }

          // If there are state modifiers (and no platform modifiers), check if this component supports them
          if (hasStateModifiers) {
            // Get the JSX opening element (the direct parent of the attribute)
            const jsxOpeningElement = path.parent;
            const componentSupport = getComponentModifierSupport(jsxOpeningElement, t);

            if (componentSupport) {
              // Get modifier types used in className
              const usedModifiers = Array.from(new Set(stateModifiers.map((m) => m.modifier)));

              // Check if all modifiers are supported by this component
              const unsupportedModifiers = usedModifiers.filter(
                (mod) => !componentSupport.supportedModifiers.includes(mod),
              );

              if (unsupportedModifiers.length > 0) {
                // Warn about unsupported modifiers
                if (process.env.NODE_ENV !== "production") {
                  console.warn(
                    `[react-native-tailwind] Modifiers (${unsupportedModifiers.map((m) => `${m}:`).join(", ")}) are not supported on ${componentSupport.component} component at ${state.file.opts.filename ?? "unknown"}. ` +
                      `Supported modifiers: ${componentSupport.supportedModifiers.join(", ")}`,
                  );
                }
                // Filter out unsupported modifiers
                const supportedModifierClasses = stateModifiers.filter((m) =>
                  componentSupport.supportedModifiers.includes(m.modifier),
                );

                // If no supported modifiers remain, fall through to normal processing
                if (supportedModifierClasses.length === 0) {
                  // Continue to normal processing
                } else {
                  // Process only supported modifiers
                  const filteredClassName =
                    baseClasses.join(" ") +
                    " " +
                    supportedModifierClasses.map((m) => `${m.modifier}:${m.baseClass}`).join(" ");
                  const styleExpression = processStaticClassNameWithModifiers(
                    filteredClassName.trim(),
                    state,
                    parseClassName,
                    generateStyleKey,
                    splitModifierClasses,
                    t,
                  );
                  const modifierTypes = Array.from(new Set(supportedModifierClasses.map((m) => m.modifier)));
                  const styleFunctionExpression = createStyleFunction(styleExpression, modifierTypes, t);

                  const styleAttribute = findStyleAttribute(path, targetStyleProp, t);

                  if (styleAttribute) {
                    mergeStyleFunctionAttribute(path, styleAttribute, styleFunctionExpression, t);
                  } else {
                    replaceWithStyleFunctionAttribute(path, styleFunctionExpression, targetStyleProp, t);
                  }
                  return;
                }
              } else {
                // All modifiers are supported - process normally
                const styleExpression = processStaticClassNameWithModifiers(
                  className,
                  state,
                  parseClassName,
                  generateStyleKey,
                  splitModifierClasses,
                  t,
                );
                const modifierTypes = usedModifiers;
                const styleFunctionExpression = createStyleFunction(styleExpression, modifierTypes, t);

                const styleAttribute = findStyleAttribute(path, targetStyleProp, t);

                if (styleAttribute) {
                  mergeStyleFunctionAttribute(path, styleAttribute, styleFunctionExpression, t);
                } else {
                  replaceWithStyleFunctionAttribute(path, styleFunctionExpression, targetStyleProp, t);
                }
                return;
              }
            } else {
              // Component doesn't support any modifiers
              if (process.env.NODE_ENV !== "production") {
                const usedModifiers = Array.from(new Set(stateModifiers.map((m) => m.modifier)));
                console.warn(
                  `[react-native-tailwind] Modifiers (${usedModifiers.map((m) => `${m}:`).join(", ")}) can only be used on compatible components (Pressable, TextInput). Found on unsupported element at ${state.file.opts.filename ?? "unknown"}`,
                );
              }
              // Fall through to normal processing (ignore modifiers)
            }
          }

          // Normal processing without modifiers
          // Use baseClasses only (placeholder modifiers already handled separately)
          const classNameForStyle = baseClasses.join(" ");
          if (!classNameForStyle) {
            // No base classes, only had placeholder modifiers - just remove className
            path.remove();
            return;
          }

          const styleObject = parseClassName(classNameForStyle, state.customColors);
          const styleKey = generateStyleKey(classNameForStyle);
          state.styleRegistry.set(styleKey, styleObject);

          // Check if there's already a style prop on this element
          const styleAttribute = findStyleAttribute(path, targetStyleProp, t);

          if (styleAttribute) {
            // Merge with existing style prop
            mergeStyleAttribute(path, styleAttribute, styleKey, state.stylesIdentifier, t);
          } else {
            // Replace className with style prop
            replaceWithStyleAttribute(path, styleKey, targetStyleProp, state.stylesIdentifier, t);
          }
          return;
        }

        // Handle dynamic expressions (JSXExpressionContainer)
        if (t.isJSXExpressionContainer(value)) {
          const expression = value.expression;

          // Skip JSXEmptyExpression
          if (t.isJSXEmptyExpression(expression)) {
            return;
          }

          try {
            // Process dynamic expression
            const result = processDynamicExpression(expression, state, parseClassName, generateStyleKey, t);

            if (result) {
              state.hasClassNames = true;

              // Check if there's already a style prop on this element
              const styleAttribute = findStyleAttribute(path, targetStyleProp, t);

              if (styleAttribute) {
                // Merge with existing style prop
                mergeDynamicStyleAttribute(path, styleAttribute, result, t);
              } else {
                // Replace className with style prop
                replaceDynamicWithStyleAttribute(path, result, targetStyleProp, t);
              }
              return;
            }
          } catch (error) {
            // Fall through to warning
            if (process.env.NODE_ENV !== "production") {
              console.warn(
                `[react-native-tailwind] Failed to process dynamic ${attributeName} at ${state.file.opts.filename ?? "unknown"}: ${error instanceof Error ? error.message : String(error)}`,
              );
            }
          }
        }

        // Unsupported dynamic className - warn in development
        if (process.env.NODE_ENV !== "production") {
          const filename = state.file.opts.filename ?? "unknown";
          console.warn(
            `[react-native-tailwind] Dynamic ${attributeName} values are not fully supported at ${filename}. ` +
              `Use the ${targetStyleProp} prop for dynamic values.`,
          );
        }
      },
    },
  };
}
