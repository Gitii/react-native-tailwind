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
  // Check if there's already a value import from react-native
  const body = path.node.body;
  let existingValueImport: BabelTypes.ImportDeclaration | null = null;

  for (const statement of body) {
    if (t.isImportDeclaration(statement) && statement.source.value === "react-native") {
      // Skip type-only imports (they get erased at runtime)
      if (statement.importKind === "type") {
        continue;
      }
      // Skip namespace imports (import * as RN) - can't add named specifiers to them
      const hasNamespaceImport = statement.specifiers.some((spec) => t.isImportNamespaceSpecifier(spec));
      if (hasNamespaceImport) {
        continue;
      }
      existingValueImport = statement;
      break; // Found a value import, we can stop
    }
  }

  if (existingValueImport) {
    // Check if StyleSheet is already imported
    const hasStyleSheet = existingValueImport.specifiers.some(
      (spec) =>
        t.isImportSpecifier(spec) &&
        spec.imported.type === "Identifier" &&
        spec.imported.name === "StyleSheet",
    );

    if (!hasStyleSheet) {
      // Add StyleSheet to existing value import
      existingValueImport.specifiers.push(
        t.importSpecifier(t.identifier("StyleSheet"), t.identifier("StyleSheet")),
      );
    }
  } else {
    // No value import exists - create a new one
    // (Don't merge with type-only or namespace imports)
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
  // Check if there's already a value import from react-native
  const body = path.node.body;
  let existingValueImport: BabelTypes.ImportDeclaration | null = null;

  for (const statement of body) {
    if (t.isImportDeclaration(statement) && statement.source.value === "react-native") {
      // Skip type-only imports (they get erased at runtime)
      if (statement.importKind === "type") {
        continue;
      }
      // Skip namespace imports (import * as RN) - can't add named specifiers to them
      const hasNamespaceImport = statement.specifiers.some((spec) => t.isImportNamespaceSpecifier(spec));
      if (hasNamespaceImport) {
        continue;
      }
      existingValueImport = statement;
      break; // Found a value import, we can stop
    }
  }

  if (existingValueImport) {
    // Check if Platform is already imported
    const hasPlatform = existingValueImport.specifiers.some(
      (spec) =>
        t.isImportSpecifier(spec) && spec.imported.type === "Identifier" && spec.imported.name === "Platform",
    );

    if (!hasPlatform) {
      // Add Platform to existing value import
      existingValueImport.specifiers.push(
        t.importSpecifier(t.identifier("Platform"), t.identifier("Platform")),
      );
    }
  } else {
    // No value import exists - create a new one
    // (Don't merge with type-only or namespace imports)
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
export function addColorSchemeImport(
  path: NodePath<BabelTypes.Program>,
  importSource: string,
  hookName: string,
  t: typeof BabelTypes,
): void {
  // Check if there's already an import from the specified source
  const body = path.node.body;
  let existingValueImport: BabelTypes.ImportDeclaration | null = null;

  for (const statement of body) {
    if (t.isImportDeclaration(statement) && statement.source.value === importSource) {
      // Only consider value imports (not type-only imports which get erased)
      if (statement.importKind !== "type") {
        existingValueImport = statement;
        break; // Found a value import, we can stop
      }
    }
  }

  // If we found a value import (not type-only), merge with it
  if (existingValueImport) {
    // Check if the hook is already imported
    const hasHook = existingValueImport.specifiers.some(
      (spec) =>
        t.isImportSpecifier(spec) && spec.imported.type === "Identifier" && spec.imported.name === hookName,
    );

    if (!hasHook) {
      // Add hook to existing value import
      existingValueImport.specifiers.push(t.importSpecifier(t.identifier(hookName), t.identifier(hookName)));
    }
  } else {
    // No value import exists - create a new one
    // (Don't merge with type-only imports as they get erased by Babel/TypeScript)
    const importDeclaration = t.importDeclaration(
      [t.importSpecifier(t.identifier(hookName), t.identifier(hookName))],
      t.stringLiteral(importSource),
    );
    path.unshiftContainer("body", importDeclaration);
  }
}

/**
 * Inject color scheme hook call at the top of a function component
 *
 * @param functionPath - Path to the function component
 * @param colorSchemeVariableName - Name for the color scheme variable
 * @param hookName - Name of the hook to call (e.g., 'useColorScheme')
 * @param localIdentifier - Local identifier if hook is already imported with an alias
 * @param t - Babel types
 * @returns true if hook was injected, false if already exists
 */
export function injectColorSchemeHook(
  functionPath: NodePath<BabelTypes.Function>,
  colorSchemeVariableName: string,
  hookName: string,
  localIdentifier: string | undefined,
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

  // Use the local identifier if hook was already imported with an alias,
  // otherwise use the configured hook name
  // e.g., import { useTheme as navTheme } → call navTheme()
  const identifierToCall = localIdentifier ?? hookName;

  // Create: const _twColorScheme = useColorScheme(); (or aliased name if already imported)
  const hookCall = t.variableDeclaration("const", [
    t.variableDeclarator(
      t.identifier(colorSchemeVariableName),
      t.callExpression(t.identifier(identifierToCall), []),
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
