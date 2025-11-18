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
import { StyleObject } from "src/types.js";
import type { ModifierType, ParsedModifier } from "../parser/index.js";
import { parseClassName as parseClassNameFn, splitModifierClasses } from "../parser/index.js";
import { generateStyleKey as generateStyleKeyFn } from "../utils/styleKey.js";
import { extractCustomColors } from "./config-loader.js";

type PluginState = PluginPass & {
  styleRegistry: Map<string, StyleObject>;
  hasClassNames: boolean;
  hasStyleSheetImport: boolean;
  customColors: Record<string, string>;
};

// Use a unique identifier to avoid conflicts with user's own styles
const STYLES_IDENTIFIER = "_twStyles";

/**
 * Supported className-like attributes
 */
const SUPPORTED_CLASS_ATTRIBUTES = [
  "className",
  "containerClassName",
  "contentContainerClassName",
  "columnWrapperClassName",
  "ListHeaderComponentClassName",
  "ListFooterComponentClassName",
] as const;

/**
 * Get the target style prop name based on the className attribute
 */
function getTargetStyleProp(attributeName: string): string {
  if (attributeName === "containerClassName") {
    return "containerStyle";
  }
  if (attributeName === "contentContainerClassName") {
    return "contentContainerStyle";
  }
  if (attributeName === "columnWrapperClassName") {
    return "columnWrapperStyle";
  }
  if (attributeName === "ListHeaderComponentClassName") {
    return "ListHeaderComponentStyle";
  }
  if (attributeName === "ListFooterComponentClassName") {
    return "ListFooterComponentStyle";
  }
  return "style";
}

/**
 * Check if a JSX element supports modifiers and determine which modifiers are supported
 * Returns an object with component info and supported modifiers
 */
function getComponentModifierSupport(
  jsxElement: any,
  t: typeof BabelTypes,
): { component: string; supportedModifiers: ModifierType[] } | null {
  if (!t.isJSXOpeningElement(jsxElement)) {
    return null;
  }

  const name = jsxElement.name;
  let componentName: string | null = null;

  // Handle simple identifier: <Pressable>
  if (t.isJSXIdentifier(name)) {
    componentName = name.name;
  }

  // Handle member expression: <ReactNative.Pressable>
  if (t.isJSXMemberExpression(name)) {
    const property = name.property;
    if (t.isJSXIdentifier(property)) {
      componentName = property.name;
    }
  }

  if (!componentName) {
    return null;
  }

  // Map components to their supported modifiers
  switch (componentName) {
    case "Pressable":
      return { component: "Pressable", supportedModifiers: ["active", "hover", "focus", "disabled"] };
    case "TextInput":
      return { component: "TextInput", supportedModifiers: ["focus", "disabled"] };
    default:
      return null;
  }
}

/**
 * Result of processing a dynamic expression
 */
type DynamicExpressionResult = {
  // The transformed expression to use in the style prop
  expression: any;
  // Static parts that can be parsed at compile time (if any)
  staticParts?: string[];
};

/**
 * Process a dynamic className expression
 * Extracts static strings and transforms the expression to use pre-compiled styles
 */
function processDynamicExpression(
  expression: any,
  state: PluginState,
  t: typeof BabelTypes,
): DynamicExpressionResult | null {
  // Handle template literals: `m-4 ${condition ? "p-4" : "p-2"}`
  if (t.isTemplateLiteral(expression)) {
    return processTemplateLiteral(expression, state, t);
  }

  // Handle conditional expressions: condition ? "m-4" : "p-2"
  if (t.isConditionalExpression(expression)) {
    return processConditionalExpression(expression, state, t);
  }

  // Handle logical expressions: condition && "m-4"
  if (t.isLogicalExpression(expression)) {
    return processLogicalExpression(expression, state, t);
  }

  // Unsupported expression type
  return null;
}

/**
 * Process template literal: `static ${dynamic} more-static`
 */
function processTemplateLiteral(
  node: any,
  state: PluginState,
  t: typeof BabelTypes,
): DynamicExpressionResult | null {
  const parts: any[] = [];
  const staticParts: string[] = [];

  // Process quasis (static parts) and expressions (dynamic parts)
  for (let i = 0; i < node.quasis.length; i++) {
    const quasi = node.quasis[i];
    const staticText = quasi.value.cooked?.trim();

    // Add static part if not empty
    if (staticText) {
      // Parse static classes and add to registry
      const classes = staticText.split(/\s+/).filter(Boolean);
      for (const cls of classes) {
        const styleObject = parseClassName(cls, state.customColors);
        const styleKey = generateStyleKey(cls);
        state.styleRegistry.set(styleKey, styleObject);
        staticParts.push(cls);

        // Add to parts array
        parts.push(t.memberExpression(t.identifier(STYLES_IDENTIFIER), t.identifier(styleKey)));
      }
    }

    // Add dynamic expression if exists
    if (i < node.expressions.length) {
      const expr = node.expressions[i];

      // Recursively process nested dynamic expressions
      const result = processDynamicExpression(expr, state, t);
      if (result) {
        parts.push(result.expression);
      } else {
        // For unsupported expressions, keep them as-is
        // This won't work at runtime but maintains the structure
        parts.push(expr);
      }
    }
  }

  if (parts.length === 0) {
    return null;
  }

  // If single part, return it directly; otherwise return array
  const expression = parts.length === 1 ? parts[0] : t.arrayExpression(parts);

  return {
    expression,
    staticParts: staticParts.length > 0 ? staticParts : undefined,
  };
}

/**
 * Process conditional expression: condition ? "class-a" : "class-b"
 */
function processConditionalExpression(
  node: any,
  state: PluginState,
  t: typeof BabelTypes,
): DynamicExpressionResult | null {
  const consequent = processStringOrExpression(node.consequent, state, t);
  const alternate = processStringOrExpression(node.alternate, state, t);

  if (!consequent && !alternate) {
    return null;
  }

  // Build conditional: condition ? consequentStyle : alternateStyle
  const expression = t.conditionalExpression(
    node.test,
    consequent ?? t.nullLiteral(),
    alternate ?? t.nullLiteral(),
  );

  return { expression };
}

/**
 * Process logical expression: condition && "class-a"
 */
function processLogicalExpression(
  node: any,
  state: PluginState,
  t: typeof BabelTypes,
): DynamicExpressionResult | null {
  // Only handle AND (&&) expressions
  if (node.operator !== "&&") {
    return null;
  }

  const right = processStringOrExpression(node.right, state, t);

  if (!right) {
    return null;
  }

  // Build logical: condition && style
  const expression = t.logicalExpression("&&", node.left, right);

  return { expression };
}

/**
 * Process a node that might be a string literal or another expression
 */
function processStringOrExpression(node: any, state: PluginState, t: typeof BabelTypes): any {
  // Handle string literals
  if (t.isStringLiteral(node)) {
    const className = node.value.trim();
    if (!className) {
      return null;
    }

    // Parse and register styles
    const styleObject = parseClassName(className, state.customColors);
    const styleKey = generateStyleKey(className);
    state.styleRegistry.set(styleKey, styleObject);

    return t.memberExpression(t.identifier(STYLES_IDENTIFIER), t.identifier(styleKey));
  }

  // Handle nested expressions recursively
  if (t.isConditionalExpression(node)) {
    const result = processConditionalExpression(node, state, t);
    return result?.expression ?? null;
  }

  if (t.isLogicalExpression(node)) {
    const result = processLogicalExpression(node, state, t);
    return result?.expression ?? null;
  }

  if (t.isTemplateLiteral(node)) {
    const result = processTemplateLiteral(node, state, t);
    return result?.expression ?? null;
  }

  // Unsupported - return null
  return null;
}

/**
 * Process a static className string that contains modifiers
 * Returns a style function expression for Pressable components
 */
function processStaticClassNameWithModifiers(
  className: string,
  state: PluginState,
  t: typeof BabelTypes,
): any {
  const { baseClasses, modifierClasses } = splitModifierClasses(className);

  // Parse and register base classes
  let baseStyleExpression: any = null;
  if (baseClasses.length > 0) {
    const baseClassName = baseClasses.join(" ");
    const baseStyleObject = parseClassName(baseClassName, state.customColors);
    const baseStyleKey = generateStyleKey(baseClassName);
    state.styleRegistry.set(baseStyleKey, baseStyleObject);
    baseStyleExpression = t.memberExpression(t.identifier(STYLES_IDENTIFIER), t.identifier(baseStyleKey));
  }

  // Parse and register modifier classes
  // Group by modifier type for better organization
  const modifiersByType = new Map<ModifierType, ParsedModifier[]>();
  for (const mod of modifierClasses) {
    if (!modifiersByType.has(mod.modifier)) {
      modifiersByType.set(mod.modifier, []);
    }
    const modGroup = modifiersByType.get(mod.modifier);
    if (modGroup) {
      modGroup.push(mod);
    }
  }

  // Build style function: ({ pressed }) => [baseStyle, pressed && modifierStyle]
  const styleArrayElements: any[] = [];

  // Add base style first
  if (baseStyleExpression) {
    styleArrayElements.push(baseStyleExpression);
  }

  // Add conditional styles for each modifier type
  for (const [modifierType, modifiers] of modifiersByType) {
    // Parse all modifier classes together
    const modifierClassNames = modifiers.map((m) => m.baseClass).join(" ");
    const modifierStyleObject = parseClassName(modifierClassNames, state.customColors);
    const modifierStyleKey = generateStyleKey(`${modifierType}_${modifierClassNames}`);
    state.styleRegistry.set(modifierStyleKey, modifierStyleObject);

    // Create conditional: pressed && styles._active_bg_blue_700
    const stateProperty = getStatePropertyForModifier(modifierType);
    const conditionalExpression = t.logicalExpression(
      "&&",
      t.identifier(stateProperty),
      t.memberExpression(t.identifier(STYLES_IDENTIFIER), t.identifier(modifierStyleKey)),
    );

    styleArrayElements.push(conditionalExpression);
  }

  // If only base style, return it directly; otherwise return array
  if (styleArrayElements.length === 1) {
    return styleArrayElements[0];
  }

  return t.arrayExpression(styleArrayElements);
}

/**
 * Get the state property name for a modifier type
 * Maps modifier types to component state parameter properties
 */
function getStatePropertyForModifier(modifier: ModifierType): string {
  switch (modifier) {
    case "active":
      return "pressed";
    case "hover":
      return "hovered";
    case "focus":
      return "focused";
    case "disabled":
      return "disabled";
    default:
      return "pressed"; // fallback
  }
}

/**
 * Create a style function for Pressable: ({ pressed }) => styleExpression
 */
function createStyleFunction(styleExpression: any, modifierTypes: ModifierType[], t: typeof BabelTypes): any {
  // Build parameter object: { pressed, hovered, focused }
  const paramProperties: any[] = [];
  const usedStateProps = new Set<string>();

  for (const modifierType of modifierTypes) {
    const stateProperty = getStatePropertyForModifier(modifierType);
    if (!usedStateProps.has(stateProperty)) {
      usedStateProps.add(stateProperty);
      paramProperties.push(
        t.objectProperty(t.identifier(stateProperty), t.identifier(stateProperty), false, true),
      );
    }
  }

  const param = t.objectPattern(paramProperties);

  // Create arrow function: ({ pressed }) => styleExpression
  return t.arrowFunctionExpression([param], styleExpression);
}

export default function reactNativeTailwindBabelPlugin({
  types: t,
}: {
  types: typeof BabelTypes;
}): PluginObj<PluginState> {
  return {
    name: "react-native-tailwind",

    visitor: {
      Program: {
        enter(_path: NodePath, state: PluginState) {
          // Initialize state for this file
          state.styleRegistry = new Map();
          state.hasClassNames = false;
          state.hasStyleSheetImport = false;

          // Load custom colors from tailwind.config.*
          state.customColors = extractCustomColors(state.file.opts.filename ?? "");
        },

        exit(path: NodePath, state: PluginState) {
          // If no classNames were found, skip StyleSheet generation
          if (!state.hasClassNames || state.styleRegistry.size === 0) {
            return;
          }

          // Add StyleSheet import if not already present
          if (!state.hasStyleSheetImport) {
            addStyleSheetImport(path, t);
          }

          // Generate and inject StyleSheet.create at the end of the file
          injectStyles(path, state.styleRegistry, t);
        },
      },

      // Check if StyleSheet is already imported
      ImportDeclaration(path: NodePath, state: PluginState) {
        const node = path.node as any;
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
      },

      JSXAttribute(path: NodePath, state: PluginState) {
        const node = path.node as any;
        const attributeName = node.name.name;

        // Only process className-like attributes
        if (!SUPPORTED_CLASS_ATTRIBUTES.includes(attributeName)) {
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

          // Check if className contains modifiers (active:, hover:, focus:)
          const { baseClasses, modifierClasses } = splitModifierClasses(className);

          // If there are modifiers, check if this component supports them
          if (modifierClasses.length > 0) {
            // Get the JSX opening element (the direct parent of the attribute)
            const jsxOpeningElement = path.parent;
            const componentSupport = getComponentModifierSupport(jsxOpeningElement, t);

            if (componentSupport) {
              // Get modifier types used in className
              const usedModifiers = Array.from(new Set(modifierClasses.map((m) => m.modifier)));

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
                const supportedModifierClasses = modifierClasses.filter((m) =>
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
                const styleExpression = processStaticClassNameWithModifiers(className, state, t);
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
                const usedModifiers = Array.from(new Set(modifierClasses.map((m) => m.modifier)));
                console.warn(
                  `[react-native-tailwind] Modifiers (${usedModifiers.map((m) => `${m}:`).join(", ")}) can only be used on compatible components (Pressable, TextInput). Found on unsupported element at ${state.file.opts.filename ?? "unknown"}`,
                );
              }
              // Fall through to normal processing (ignore modifiers)
            }
          }

          // Normal processing without modifiers
          const styleObject = parseClassName(className, state.customColors);
          const styleKey = generateStyleKey(className);
          state.styleRegistry.set(styleKey, styleObject);

          // Check if there's already a style prop on this element
          const parent = path.parent as any;
          const styleAttribute = parent.attributes.find(
            (attr: any) => t.isJSXAttribute(attr) && attr.name.name === targetStyleProp,
          );

          if (styleAttribute) {
            // Merge with existing style prop
            mergeStyleAttribute(path, styleAttribute, styleKey, t);
          } else {
            // Replace className with style prop
            replaceWithStyleAttribute(path, styleKey, targetStyleProp, t);
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
            const result = processDynamicExpression(expression, state, t);

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

/**
 * Add StyleSheet import to the file
 */
function addStyleSheetImport(path: NodePath, t: typeof BabelTypes) {
  const importDeclaration = t.importDeclaration(
    [t.importSpecifier(t.identifier("StyleSheet"), t.identifier("StyleSheet"))],
    t.stringLiteral("react-native"),
  );

  // Add import at the top of the file
  (path as any).unshiftContainer("body", importDeclaration);
}

/**
 * Replace className with style attribute
 */
function replaceWithStyleAttribute(
  classNamePath: NodePath,
  styleKey: string,
  targetStyleProp: string,
  t: typeof BabelTypes,
) {
  const styleAttribute = t.jsxAttribute(
    t.jsxIdentifier(targetStyleProp),
    t.jsxExpressionContainer(t.memberExpression(t.identifier(STYLES_IDENTIFIER), t.identifier(styleKey))),
  );

  classNamePath.replaceWith(styleAttribute);
}

/**
 * Merge className styles with existing style prop
 */
function mergeStyleAttribute(
  classNamePath: NodePath,
  styleAttribute: any,
  styleKey: string,
  t: typeof BabelTypes,
) {
  const existingStyle = styleAttribute.value.expression;

  // Create array with className styles first, then existing styles
  // This allows existing styles to override className styles
  const styleArray = t.arrayExpression([
    t.memberExpression(t.identifier(STYLES_IDENTIFIER), t.identifier(styleKey)),
    existingStyle,
  ]);

  styleAttribute.value = t.jsxExpressionContainer(styleArray);

  // Remove the className attribute
  classNamePath.remove();
}

/**
 * Replace className with dynamic style attribute
 */
function replaceDynamicWithStyleAttribute(
  classNamePath: NodePath,
  result: DynamicExpressionResult,
  targetStyleProp: string,
  t: typeof BabelTypes,
) {
  const styleAttribute = t.jsxAttribute(
    t.jsxIdentifier(targetStyleProp),
    t.jsxExpressionContainer(result.expression),
  );

  classNamePath.replaceWith(styleAttribute);
}

/**
 * Merge dynamic className styles with existing style prop
 */
function mergeDynamicStyleAttribute(
  classNamePath: NodePath,
  styleAttribute: any,
  result: DynamicExpressionResult,
  t: typeof BabelTypes,
) {
  const existingStyle = styleAttribute.value.expression;

  // Merge dynamic expression with existing styles
  // If existing is already an array, append to it; otherwise create new array
  let styleArray;
  if (t.isArrayExpression(existingStyle)) {
    // Prepend dynamic styles to existing array
    styleArray = t.arrayExpression([result.expression, ...existingStyle.elements]);
  } else {
    // Create new array with dynamic styles first, then existing
    styleArray = t.arrayExpression([result.expression, existingStyle]);
  }

  styleAttribute.value = t.jsxExpressionContainer(styleArray);

  // Remove the className attribute
  classNamePath.remove();
}

/**
 * Replace className with style function attribute (for Pressable with modifiers)
 */
function replaceWithStyleFunctionAttribute(
  classNamePath: NodePath,
  styleFunctionExpression: any,
  targetStyleProp: string,
  t: typeof BabelTypes,
) {
  const styleAttribute = t.jsxAttribute(
    t.jsxIdentifier(targetStyleProp),
    t.jsxExpressionContainer(styleFunctionExpression),
  );

  classNamePath.replaceWith(styleAttribute);
}

/**
 * Merge className style function with existing style prop (for Pressable with modifiers)
 */
function mergeStyleFunctionAttribute(
  classNamePath: NodePath,
  styleAttribute: any,
  styleFunctionExpression: any,
  t: typeof BabelTypes,
) {
  const existingStyle = styleAttribute.value.expression;

  // Create a wrapper function that merges both styles
  // ({ pressed }) => [styleFunctionResult, existingStyle]
  // We need to call the style function and merge results

  // If existing is already a function, we need to handle it specially
  if (t.isArrowFunctionExpression(existingStyle) || t.isFunctionExpression(existingStyle)) {
    // Both are functions - create wrapper that calls both
    // (_state) => [newStyleFn(_state), existingStyleFn(_state)]
    // Create an identifier for the parameter to pass to the function calls
    const paramIdentifier = t.identifier("_state");

    const newFunctionCall = t.callExpression(styleFunctionExpression, [paramIdentifier]);
    const existingFunctionCall = t.callExpression(existingStyle, [paramIdentifier]);

    const mergedArray = t.arrayExpression([newFunctionCall, existingFunctionCall]);
    const wrapperFunction = t.arrowFunctionExpression([paramIdentifier], mergedArray);

    styleAttribute.value = t.jsxExpressionContainer(wrapperFunction);
  } else {
    // Existing is static - create function that returns array
    // (_state) => [styleFunctionResult, existingStyle]
    // Create an identifier for the parameter to pass to the function call
    const paramIdentifier = t.identifier("_state");

    const functionCall = t.callExpression(styleFunctionExpression, [paramIdentifier]);
    const mergedArray = t.arrayExpression([functionCall, existingStyle]);
    const wrapperFunction = t.arrowFunctionExpression([paramIdentifier], mergedArray);

    styleAttribute.value = t.jsxExpressionContainer(wrapperFunction);
  }

  // Remove the className attribute
  classNamePath.remove();
}

/**
 * Inject StyleSheet.create with all collected styles
 */
function injectStyles(path: NodePath, styleRegistry: Map<string, StyleObject>, t: typeof BabelTypes) {
  // Build style object properties
  const styleProperties: any[] = [];

  for (const [key, styleObject] of styleRegistry) {
    const properties = Object.entries(styleObject).map(([styleProp, styleValue]) => {
      let valueNode;

      if (typeof styleValue === "number") {
        valueNode = t.numericLiteral(styleValue);
      } else if (typeof styleValue === "string") {
        valueNode = t.stringLiteral(styleValue);
      } else {
        // Fallback for other types
        valueNode = t.valueToNode(styleValue);
      }

      return t.objectProperty(t.identifier(styleProp), valueNode);
    });

    styleProperties.push(t.objectProperty(t.identifier(key), t.objectExpression(properties)));
  }

  // Create: const _tailwindStyles = StyleSheet.create({ ... })
  const styleSheet = t.variableDeclaration("const", [
    t.variableDeclarator(
      t.identifier(STYLES_IDENTIFIER),
      t.callExpression(t.memberExpression(t.identifier("StyleSheet"), t.identifier("create")), [
        t.objectExpression(styleProperties),
      ]),
    ),
  ]);

  // Add StyleSheet.create at the end of the file
  (path as any).pushContainer("body", styleSheet);
}

// Helper functions that use the imported parser
function parseClassName(className: string, customColors: Record<string, string>): StyleObject {
  return parseClassNameFn(className, customColors);
}

function generateStyleKey(className: string): string {
  return generateStyleKeyFn(className);
}
