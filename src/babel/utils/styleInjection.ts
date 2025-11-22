/**
 * Utility functions for injecting StyleSheet imports and style definitions
 */

import type { NodePath } from "@babel/core";
import type * as BabelTypes from "@babel/types";
import type { StyleObject } from "../../types/core.js";

/**
 * Add StyleSheet import to the file or merge with existing react-native import
 */
export function addStyleSheetImport(path: NodePath<BabelTypes.Program>, t: typeof BabelTypes): void {
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
    // Add StyleSheet to existing react-native import
    reactNativeImport.specifiers.push(
      t.importSpecifier(t.identifier("StyleSheet"), t.identifier("StyleSheet")),
    );
  } else {
    // Create new react-native import with StyleSheet
    const importDeclaration = t.importDeclaration(
      [t.importSpecifier(t.identifier("StyleSheet"), t.identifier("StyleSheet"))],
      t.stringLiteral("react-native"),
    );
    path.unshiftContainer("body", importDeclaration);
  }
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
 * Add useColorScheme import to the file or merge with existing react-native import
 */
export function addColorSchemeImport(path: NodePath<BabelTypes.Program>, t: typeof BabelTypes): void {
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
    // Check if useColorScheme is already imported
    const hasUseColorScheme = reactNativeImport.specifiers.some(
      (spec) =>
        t.isImportSpecifier(spec) &&
        spec.imported.type === "Identifier" &&
        spec.imported.name === "useColorScheme",
    );

    if (!hasUseColorScheme) {
      // Add useColorScheme to existing react-native import
      reactNativeImport.specifiers.push(
        t.importSpecifier(t.identifier("useColorScheme"), t.identifier("useColorScheme")),
      );
    }
  } else {
    // Create new react-native import with useColorScheme
    const importDeclaration = t.importDeclaration(
      [t.importSpecifier(t.identifier("useColorScheme"), t.identifier("useColorScheme"))],
      t.stringLiteral("react-native"),
    );
    path.unshiftContainer("body", importDeclaration);
  }
}

/**
 * Inject useColorScheme hook call at the top of a function component
 *
 * @param functionPath - Path to the function component
 * @param colorSchemeVariableName - Name for the color scheme variable
 * @param t - Babel types
 * @returns true if hook was injected, false if already exists
 */
export function injectColorSchemeHook(
  functionPath: NodePath<BabelTypes.Function>,
  colorSchemeVariableName: string,
  t: typeof BabelTypes,
): boolean {
  let body = functionPath.node.body;

  // Handle concise arrow functions: () => <JSX />
  // Convert to block statement: () => { const _twColorScheme = useColorScheme(); return <JSX />; }
  if (!t.isBlockStatement(body)) {
    if (t.isArrowFunctionExpression(functionPath.node) && t.isExpression(body)) {
      // Convert concise body to block statement with return
      const returnStatement = t.returnStatement(body);
      const blockStatement = t.blockStatement([returnStatement]);
      functionPath.node.body = blockStatement;
      body = blockStatement;
    } else {
      // Other non-block functions (shouldn't happen for components, but be safe)
      return false;
    }
  }

  // Check if hook is already injected
  const hasHook = body.body.some((statement) => {
    if (
      t.isVariableDeclaration(statement) &&
      statement.declarations.length > 0 &&
      t.isVariableDeclarator(statement.declarations[0])
    ) {
      const declarator = statement.declarations[0];
      return t.isIdentifier(declarator.id) && declarator.id.name === colorSchemeVariableName;
    }
    return false;
  });

  if (hasHook) {
    return false; // Already injected
  }

  // Create: const _twColorScheme = useColorScheme();
  const hookCall = t.variableDeclaration("const", [
    t.variableDeclarator(
      t.identifier(colorSchemeVariableName),
      t.callExpression(t.identifier("useColorScheme"), []),
    ),
  ]);

  // Insert at the beginning of function body
  body.body.unshift(hookCall);

  return true;
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
