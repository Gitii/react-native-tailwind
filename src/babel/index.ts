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
import { parseClassName as parseClassNameFn } from "../parser/index.js";
import { generateStyleKey as generateStyleKeyFn } from "../utils/styleKey.js";
import { extractCustomColors } from "./config-loader.js";

type PluginState = PluginPass & {
  styleRegistry: Map<string, Record<string, string | number>>;
  hasClassNames: boolean;
  hasStyleSheetImport: boolean;
  customColors: Record<string, string>;
};

/**
 * Supported className-like attributes
 */
const SUPPORTED_CLASS_ATTRIBUTES = [
  "className",
  "contentContainerClassName",
  "columnWrapperClassName",
  "ListHeaderComponentClassName",
  "ListFooterComponentClassName",
] as const;

/**
 * Get the target style prop name based on the className attribute
 */
function getTargetStyleProp(attributeName: string): string {
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

        // Only handle static string literals
        if (!t.isStringLiteral(value)) {
          // Warn about dynamic className in development
          if (process.env.NODE_ENV !== "production") {
            const filename = state.file.opts.filename ?? "unknown";
            const targetStyleProp = getTargetStyleProp(attributeName);
            console.warn(
              `[react-native-tailwind] Dynamic ${attributeName} values are not supported at ${filename}. ` +
                `Use the ${targetStyleProp} prop for dynamic values.`,
            );
          }
          return;
        }

        const className = value.value.trim();

        // Skip empty classNames
        if (!className) {
          path.remove();
          return;
        }

        state.hasClassNames = true;

        // Parse className to React Native styles
        const styleObject = parseClassName(className, state.customColors);

        // Generate unique style key
        const styleKey = generateStyleKey(className);

        // Store in registry
        state.styleRegistry.set(styleKey, styleObject);

        // Determine target style prop based on attribute name
        const targetStyleProp = getTargetStyleProp(attributeName);

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
    t.jsxExpressionContainer(t.memberExpression(t.identifier("styles"), t.identifier(styleKey))),
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
    t.memberExpression(t.identifier("styles"), t.identifier(styleKey)),
    existingStyle,
  ]);

  styleAttribute.value = t.jsxExpressionContainer(styleArray);

  // Remove the className attribute
  classNamePath.remove();
}

/**
 * Inject StyleSheet.create with all collected styles
 */
function injectStyles(
  path: NodePath,
  styleRegistry: Map<string, Record<string, string | number>>,
  t: typeof BabelTypes,
) {
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

  // Create: const styles = StyleSheet.create({ ... })
  const styleSheet = t.variableDeclaration("const", [
    t.variableDeclarator(
      t.identifier("styles"),
      t.callExpression(t.memberExpression(t.identifier("StyleSheet"), t.identifier("create")), [
        t.objectExpression(styleProperties),
      ]),
    ),
  ]);

  // Add StyleSheet.create at the end of the file
  (path as any).pushContainer("body", styleSheet);
}

// Helper functions that use the imported parser
function parseClassName(
  className: string,
  customColors: Record<string, string>,
): Record<string, string | number> {
  return parseClassNameFn(className, customColors);
}

function generateStyleKey(className: string): string {
  return generateStyleKeyFn(className);
}
