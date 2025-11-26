/**
 * Component scope detection helpers for hook injection
 */

import type { NodePath } from "@babel/core";
import type * as BabelTypes from "@babel/types";

/**
 * Check if a function path represents a valid component scope for hook injection
 * Valid scopes:
 * - Top-level FunctionDeclaration
 * - FunctionExpression/ArrowFunctionExpression in top-level VariableDeclarator (with PascalCase name)
 * - NOT class methods, NOT nested functions, NOT inline callbacks
 *
 * @param functionPath - Path to the function to check
 * @param t - Babel types
 * @returns true if function is a valid component scope
 */
export function isComponentScope(functionPath: NodePath<BabelTypes.Function>, t: typeof BabelTypes): boolean {
  const node = functionPath.node;
  const parent = functionPath.parent;
  const parentPath = functionPath.parentPath;

  // Reject class methods (class components not supported for hooks)
  if (t.isClassMethod(parent)) {
    return false;
  }

  // Reject if inside a class body
  if (functionPath.findParent((p) => t.isClassBody(p.node))) {
    return false;
  }

  // Accept top-level FunctionDeclaration
  if (t.isFunctionDeclaration(node)) {
    // Check if it's at program level or in export
    if (t.isProgram(parent) || t.isExportNamedDeclaration(parent) || t.isExportDefaultDeclaration(parent)) {
      return true;
    }
  }

  // Accept FunctionExpression/ArrowFunctionExpression in VariableDeclarator
  if (t.isFunctionExpression(node) || t.isArrowFunctionExpression(node)) {
    if (t.isVariableDeclarator(parent)) {
      // Check if it's at program level (via VariableDeclaration)
      const varDeclarationPath = parentPath?.parentPath;
      if (
        varDeclarationPath &&
        t.isVariableDeclaration(varDeclarationPath.node) &&
        (t.isProgram(varDeclarationPath.parent) || t.isExportNamedDeclaration(varDeclarationPath.parent))
      ) {
        // Check for PascalCase naming (component convention)
        if (t.isIdentifier(parent.id)) {
          const name = parent.id.name;
          return /^[A-Z]/.test(name); // Starts with uppercase
        }
      }
    }
  }

  return false;
}

/**
 * Find the nearest valid component scope for hook injection
 * Climbs the AST from the current path to find a component-level function
 *
 * @param path - Starting path (e.g., JSXAttribute)
 * @param t - Babel types
 * @returns NodePath to component function, or null if not found
 */
export function findComponentScope(
  path: NodePath,
  t: typeof BabelTypes,
): NodePath<BabelTypes.Function> | null {
  let current = path.getFunctionParent();

  while (current) {
    if (t.isFunction(current.node) && isComponentScope(current, t)) {
      return current;
    }
    // Climb to next parent function
    current = current.getFunctionParent();
  }

  return null;
}
