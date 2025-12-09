/**
 * Smart merge utility for StyleObject values
 * Handles array properties (like transform) by concatenating instead of overwriting
 */

import type { StyleObject } from "../types/core";

/**
 * Properties that should be merged as arrays (concatenated) rather than overwritten
 */
const ARRAY_MERGE_PROPERTIES = new Set<string>(["transform"]);

/**
 * Merge two StyleObject instances, handling array properties specially
 *
 * @param target - The target object to merge into (mutated)
 * @param source - The source object to merge from
 * @returns The merged target object
 *
 * @example
 * // Standard properties are overwritten (like Object.assign)
 * mergeStyles({ margin: 4 }, { padding: 8 })
 * // => { margin: 4, padding: 8 }
 *
 * @example
 * // Array properties (transform) are concatenated
 * mergeStyles(
 *   { transform: [{ rotate: '45deg' }] },
 *   { transform: [{ scale: 1.1 }] }
 * )
 * // => { transform: [{ rotate: '45deg' }, { scale: 1.1 }] }
 */
export function mergeStyles(target: StyleObject, source: StyleObject): StyleObject {
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];

      // Handle array merge properties (like transform)
      if (ARRAY_MERGE_PROPERTIES.has(key) && Array.isArray(sourceValue)) {
        const targetValue = target[key];
        if (Array.isArray(targetValue)) {
          // Concatenate arrays
          (target as Record<string, unknown>)[key] = [...targetValue, ...sourceValue];
        } else {
          // No existing array, just assign
          target[key] = sourceValue;
        }
      } else {
        // Standard Object.assign behavior for non-array properties
        target[key] = sourceValue;
      }
    }
  }

  return target;
}
