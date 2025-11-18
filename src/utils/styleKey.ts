/**
 * Utility to generate unique, stable style keys from class names
 */

/**
 * Generate a unique style key from a className string
 * @param className - Space-separated class names
 * @returns Unique style key suitable for use as JavaScript identifier
 */
export function generateStyleKey(className: string): string {
  // Split, sort for consistency, and create stable key
  const classes = className.split(/\s+/).filter(Boolean).sort(); // Sort to ensure same classes in different order produce same key

  // Convert to valid JavaScript identifier
  const key =
    "_" +
    classes
      .join("_")
      .replace(/[^a-zA-Z0-9_]/g, "_") // Replace non-alphanumeric with underscore
      .replace(/_+/g, "_"); // Collapse multiple underscores

  return key;
}
