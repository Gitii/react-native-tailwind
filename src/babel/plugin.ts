/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/**
 * Babel plugin for react-native-tailwind
 * Transforms className props to style props at compile time
 */

import type { NodePath, PluginObj, PluginPass } from "@babel/core";
import * as BabelTypes from "@babel/types";
import { parseClassName, parsePlaceholderClasses, splitModifierClasses } from "../parser/index.js";
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
import { getComponentModifierSupport } from "./utils/componentSupport.js";
import { processDynamicExpression } from "./utils/dynamicProcessing.js";
import { createStyleFunction, processStaticClassNameWithModifiers } from "./utils/modifierProcessing.js";
import { addStyleSheetImport, injectStylesAtTop } from "./utils/styleInjection.js";
import {
  addOrMergePlaceholderTextColorProp,
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
  customColors: Record<string, string>;
  supportedAttributes: Set<string>;
  attributePatterns: RegExp[];
  stylesIdentifier: string;
  // Track tw/twStyle imports from main package
  twImportNames: Set<string>; // e.g., ['tw', 'twStyle'] or ['tw as customTw']
  hasTwImport: boolean;
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
          state.supportedAttributes = exactMatches;
          state.attributePatterns = patterns;
          state.stylesIdentifier = stylesIdentifier;
          state.twImportNames = new Set();
          state.hasTwImport = false;

          // Load custom colors from tailwind.config.*
          state.customColors = extractCustomColors(state.file.opts.filename ?? "");
        },

        exit(path: NodePath, state: PluginState) {
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

          // Generate and inject StyleSheet.create at the beginning of the file (after imports)
          // This ensures _twStyles is defined before any code that references it
          injectStylesAtTop(path, state.styleRegistry, state.stylesIdentifier, t);
        },
      },

      // Check if StyleSheet is already imported and track tw/twStyle imports
      ImportDeclaration(path: NodePath, state: PluginState) {
        const node = path.node as any;

        // Track react-native StyleSheet import
        if (node.source.value === "react-native") {
          const specifiers = node.specifiers;
          const hasStyleSheet = specifiers.some((spec: any) => {
            if (t.isImportSpecifier(spec) && t.isIdentifier(spec.imported)) {
              return spec.imported.name === "StyleSheet";
            }
            return false;
          });

          if (hasStyleSheet) {
            state.hasStyleSheetImport = true;
          } else {
            // Add StyleSheet to existing import
            node.specifiers.push(t.importSpecifier(t.identifier("StyleSheet"), t.identifier("StyleSheet")));
            state.hasStyleSheetImport = true;
          }
        }

        // Track tw/twStyle imports from main package (for compile-time transformation)
        if (node.source.value === "@mgcrea/react-native-tailwind") {
          const specifiers = node.specifiers;
          specifiers.forEach((spec: any) => {
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
      TaggedTemplateExpression(path: NodePath, state: PluginState) {
        const node = path.node as any;

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
      CallExpression(path: NodePath, state: PluginState) {
        const node = path.node as any;

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

      JSXAttribute(path: NodePath, state: PluginState) {
        const node = path.node as any;
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

          // Check if className contains modifiers (active:, hover:, focus:, placeholder:)
          const { baseClasses, modifierClasses } = splitModifierClasses(className);

          // Separate placeholder modifiers from state modifiers
          const placeholderModifiers = modifierClasses.filter((m) => m.modifier === "placeholder");
          const stateModifiers = modifierClasses.filter((m) => m.modifier !== "placeholder");

          // Handle placeholder modifiers first (they generate placeholderTextColor prop, not style)
          if (placeholderModifiers.length > 0) {
            // Check if this is a TextInput component (placeholder only works on TextInput)
            const jsxOpeningElement = path.parent;
            const componentSupport = getComponentModifierSupport(jsxOpeningElement, t);

            if (componentSupport?.supportedModifiers.includes("placeholder")) {
              const placeholderClasses = placeholderModifiers.map((m) => m.baseClass).join(" ");
              const placeholderColor = parsePlaceholderClasses(placeholderClasses, state.customColors);

              if (placeholderColor) {
                // Add or merge placeholderTextColor prop
                const parent = path.parent as any;
                addOrMergePlaceholderTextColorProp(parent, placeholderColor, t);
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

          // If there are state modifiers, check if this component supports them
          if (stateModifiers.length > 0) {
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

                  const parent = path.parent as any;
                  const styleAttribute = parent.attributes.find(
                    (attr: any) => t.isJSXAttribute(attr) && attr.name.name === targetStyleProp,
                  );

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

                const parent = path.parent as any;
                const styleAttribute = parent.attributes.find(
                  (attr: any) => t.isJSXAttribute(attr) && attr.name.name === targetStyleProp,
                );

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
          const parent = path.parent as any;
          const styleAttribute = parent.attributes.find(
            (attr: any) => t.isJSXAttribute(attr) && attr.name.name === targetStyleProp,
          );

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
              const parent = path.parent as any;
              const styleAttribute = parent.attributes.find(
                (attr: any) => t.isJSXAttribute(attr) && attr.name.name === targetStyleProp,
              );

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
