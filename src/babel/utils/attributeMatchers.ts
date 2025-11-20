/**
 * Utility functions for matching and handling JSX attribute names
 */

/**
 * Default className-like attributes (used when no custom attributes are provided)
 */
export const DEFAULT_CLASS_ATTRIBUTES = [
  "className",
  "contentContainerClassName",
  "columnWrapperClassName",
  "ListHeaderComponentClassName",
  "ListFooterComponentClassName",
] as const;

/**
 * Build attribute matching structures from plugin options
 * Separates exact matches from pattern-based matches
 */
export function buildAttributeMatchers(attributes: string[]): {
  exactMatches: Set<string>;
  patterns: RegExp[];
} {
  const exactMatches = new Set<string>();
  const patterns: RegExp[] = [];

  for (const attr of attributes) {
    if (attr.includes("*")) {
      // Convert glob pattern to regex
      // *ClassName -> /^.*ClassName$/
      // container* -> /^container.*$/
      const regexPattern = "^" + attr.replace(/\*/g, ".*") + "$";
      patterns.push(new RegExp(regexPattern));
    } else {
      // Exact match
      exactMatches.add(attr);
    }
  }

  return { exactMatches, patterns };
}

/**
 * Check if an attribute name matches the configured attributes
 */
export function isAttributeSupported(
  attributeName: string,
  exactMatches: Set<string>,
  patterns: RegExp[],
): boolean {
  // Check exact matches first (faster)
  if (exactMatches.has(attributeName)) {
    return true;
  }

  // Check pattern matches
  for (const pattern of patterns) {
    if (pattern.test(attributeName)) {
      return true;
    }
  }

  return false;
}

/**
 * Get the target style prop name based on the className attribute
 */
export function getTargetStyleProp(attributeName: string): string {
  return attributeName.endsWith("ClassName") ? attributeName.replace("ClassName", "Style") : "style";
}
