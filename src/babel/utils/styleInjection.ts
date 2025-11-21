/**
 * Utility functions for injecting StyleSheet imports and style definitions
 */

import type { NodePath } from "@babel/core";
import type * as BabelTypes from "@babel/types";
import type { StyleObject } from "../../types/core.js";

/**
 * Add StyleSheet import to the file
 */
export function addStyleSheetImport(path: NodePath<BabelTypes.Program>, t: typeof BabelTypes): void {
  const importDeclaration = t.importDeclaration(
    [t.importSpecifier(t.identifier("StyleSheet"), t.identifier("StyleSheet"))],
    t.stringLiteral("react-native"),
  );

  // Add import at the top of the file
  path.unshiftContainer("body", importDeclaration);
}

/**
 * Add Platform import to the file or merge with existing react-native import
 */
export function addPlatformImport(path: NodePath<BabelTypes.Program>, t: typeof BabelTypes): void {
  // Check if there's already a react-native import
  const body = path.node.body;
  let reactNativeImport: BabelTypes.ImportDeclaration | null = null;

  for (const statement of body) {
    if (t.isImportDeclaration(statement) && statement.source.value === "react-native") {
      reactNativeImport = statement;
      break;
    }
  }

  if (reactNativeImport) {
    // Add Platform to existing react-native import
    reactNativeImport.specifiers.push(t.importSpecifier(t.identifier("Platform"), t.identifier("Platform")));
  } else {
    // Create new react-native import with Platform
    const importDeclaration = t.importDeclaration(
      [t.importSpecifier(t.identifier("Platform"), t.identifier("Platform"))],
      t.stringLiteral("react-native"),
    );
    path.unshiftContainer("body", importDeclaration);
  }
}

/**
 * Inject StyleSheet.create with all collected styles at the top of the file
 * This ensures the styles object is defined before any code that references it
 */
export function injectStylesAtTop(
  path: NodePath<BabelTypes.Program>,
  styleRegistry: Map<string, StyleObject>,
  stylesIdentifier: string,
  t: typeof BabelTypes,
): void {
  // Build style object properties
  const styleProperties: BabelTypes.ObjectProperty[] = [];

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

  // Create: const _twStyles = StyleSheet.create({ ... })
  const styleSheet = t.variableDeclaration("const", [
    t.variableDeclarator(
      t.identifier(stylesIdentifier),
      t.callExpression(t.memberExpression(t.identifier("StyleSheet"), t.identifier("create")), [
        t.objectExpression(styleProperties),
      ]),
    ),
  ]);

  // Find the index to insert after all imports
  const body = path.node.body;
  let insertIndex = 0;

  // Find the last import statement
  for (let i = 0; i < body.length; i++) {
    if (t.isImportDeclaration(body[i])) {
      insertIndex = i + 1;
    } else {
      // Stop at the first non-import statement
      break;
    }
  }

  // Insert StyleSheet.create after imports
  body.splice(insertIndex, 0, styleSheet);
}
