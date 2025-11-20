/**
 * Utility functions for processing dynamic className expressions
 */

import type * as BabelTypes from "@babel/types";
import type { StyleObject } from "../../types/core.js";

/**
 * Plugin state interface (subset needed for dynamic processing)
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface DynamicProcessingState {
  styleRegistry: Map<string, StyleObject>;
  customColors: Record<string, string>;
  stylesIdentifier: string;
}

/**
 * Result of processing a dynamic expression
 */
export type DynamicExpressionResult = {
  // The transformed expression to use in the style prop
  expression: BabelTypes.Expression;
  // Static parts that can be parsed at compile time (if any)
  staticParts?: string[];
};

/**
 * Process a dynamic className expression
 * Extracts static strings and transforms the expression to use pre-compiled styles
 */
export function processDynamicExpression(
  expression: BabelTypes.Expression,
  state: DynamicProcessingState,
  parseClassName: (className: string, customColors: Record<string, string>) => StyleObject,
  generateStyleKey: (className: string) => string,
  t: typeof BabelTypes,
) {
  // Handle template literals: `m-4 ${condition ? "p-4" : "p-2"}`
  if (t.isTemplateLiteral(expression)) {
    return processTemplateLiteral(expression, state, parseClassName, generateStyleKey, t);
  }

  // Handle conditional expressions: condition ? "m-4" : "p-2"
  if (t.isConditionalExpression(expression)) {
    return processConditionalExpression(expression, state, parseClassName, generateStyleKey, t);
  }

  // Handle logical expressions: condition && "m-4"
  if (t.isLogicalExpression(expression)) {
    return processLogicalExpression(expression, state, parseClassName, generateStyleKey, t);
  }

  // Unsupported expression type
  return null;
}

/**
 * Process template literal: `static ${dynamic} more-static`
 */
function processTemplateLiteral(
  node: BabelTypes.TemplateLiteral,
  state: DynamicProcessingState,
  parseClassName: (className: string, customColors: Record<string, string>) => StyleObject,
  generateStyleKey: (className: string) => string,
  t: typeof BabelTypes,
) {
  const parts: BabelTypes.MemberExpression[] = [];
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
        parts.push(t.memberExpression(t.identifier(state.stylesIdentifier), t.identifier(styleKey)));
      }
    }

    // Add dynamic expression if exists
    if (i < node.expressions.length) {
      const expr = node.expressions[i];

      // Recursively process nested dynamic expressions
      const result = processDynamicExpression(
        expr as BabelTypes.Expression,
        state,
        parseClassName,
        generateStyleKey,
        t,
      );
      if (result) {
        parts.push(result.expression as BabelTypes.MemberExpression);
      } else {
        // For unsupported expressions, keep them as-is
        // This won't work at runtime but maintains the structure
        parts.push(expr as BabelTypes.MemberExpression);
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
  node: BabelTypes.ConditionalExpression,
  state: DynamicProcessingState,
  parseClassName: (className: string, customColors: Record<string, string>) => StyleObject,
  generateStyleKey: (className: string) => string,
  t: typeof BabelTypes,
) {
  const consequent = processStringOrExpression(node.consequent, state, parseClassName, generateStyleKey, t);
  const alternate = processStringOrExpression(node.alternate, state, parseClassName, generateStyleKey, t);

  if (!consequent && !alternate) {
    return null;
  }

  // Build conditional: condition ? consequentStyle : alternateStyle
  const expression = t.conditionalExpression(
    node.test,
    (consequent as BabelTypes.Expression) ?? t.nullLiteral(),
    (alternate as BabelTypes.Expression) ?? t.nullLiteral(),
  );

  return { expression };
}

/**
 * Process logical expression: condition && "class-a"
 */
function processLogicalExpression(
  node: BabelTypes.LogicalExpression,
  state: DynamicProcessingState,
  parseClassName: (className: string, customColors: Record<string, string>) => StyleObject,
  generateStyleKey: (className: string) => string,
  t: typeof BabelTypes,
) {
  // Only handle AND (&&) expressions
  if (node.operator !== "&&") {
    return null;
  }

  const right = processStringOrExpression(node.right, state, parseClassName, generateStyleKey, t);

  if (!right) {
    return null;
  }

  // Build logical: condition && style
  const expression = t.logicalExpression("&&", node.left, right as BabelTypes.Expression);

  return { expression };
}

/**
 * Process a node that might be a string literal or another expression
 */
function processStringOrExpression(
  node: BabelTypes.StringLiteral | BabelTypes.Expression,
  state: DynamicProcessingState,
  parseClassName: (className: string, customColors: Record<string, string>) => StyleObject,
  generateStyleKey: (className: string) => string,
  t: typeof BabelTypes,
) {
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

    return t.memberExpression(t.identifier(state.stylesIdentifier), t.identifier(styleKey));
  }

  // Handle nested expressions recursively
  if (t.isConditionalExpression(node)) {
    const result = processConditionalExpression(node, state, parseClassName, generateStyleKey, t);
    return result?.expression ?? null;
  }

  if (t.isLogicalExpression(node)) {
    const result = processLogicalExpression(node, state, parseClassName, generateStyleKey, t);
    return result?.expression ?? null;
  }

  if (t.isTemplateLiteral(node)) {
    const result = processTemplateLiteral(node, state, parseClassName, generateStyleKey, t);
    return result?.expression ?? null;
  }

  // Unsupported - return null
  return null;
}
