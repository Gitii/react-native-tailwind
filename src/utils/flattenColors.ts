/**
 * Type representing a nested color structure that can be arbitrarily deep
 */
type NestedColors = {
  [key: string]: string | NestedColors;
};

/**
 * Flatten nested color objects into flat key-value map
 * Example: { brand: { light: '#fff', dark: '#000' } } => { 'brand-light': '#fff', 'brand-dark': '#000' }
 *
 * @param colors - Nested color object where values can be strings or objects
 * @param prefix - Optional prefix for nested keys (used for recursion)
 * @returns Flattened color map with dash-separated keys
 */
export function flattenColors(colors: NestedColors, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(colors)) {
    const newKey = prefix ? `${prefix}-${key}` : key;

    if (typeof value === "string") {
      result[newKey] = value;
    } else if (typeof value === "object" && value !== null) {
      // Recursively flatten nested objects
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      Object.assign(result, flattenColors(value as NestedColors, newKey));
    }
  }

  return result;
}
