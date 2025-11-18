/**
 * Modifier parsing utilities for state-based class names (active:, hover:, focus:)
 */

export type ModifierType = "active" | "hover" | "focus" | "disabled";

export type ParsedModifier = {
  modifier: ModifierType;
  baseClass: string;
};

/**
 * Supported modifiers that map to component states
 */
const SUPPORTED_MODIFIERS: readonly ModifierType[] = ["active", "hover", "focus", "disabled"] as const;

/**
 * Parse a class name to detect and extract modifiers
 *
 * @param cls - Class name to parse (e.g., "active:bg-blue-500")
 * @returns ParsedModifier if modifier found, null otherwise
 *
 * @example
 * parseModifier("active:bg-blue-500") // { modifier: "active", baseClass: "bg-blue-500" }
 * parseModifier("bg-blue-500") // null
 * parseModifier("hover:focus:bg-blue-500") // null (nested modifiers not supported)
 */
export function parseModifier(cls: string): ParsedModifier | null {
  const colonIndex = cls.indexOf(":");

  // No colon means no modifier
  if (colonIndex === -1) {
    return null;
  }

  const potentialModifier = cls.slice(0, colonIndex);
  const baseClass = cls.slice(colonIndex + 1);

  // Check if it's a supported modifier
  if (!SUPPORTED_MODIFIERS.includes(potentialModifier as ModifierType)) {
    return null;
  }

  // Check for nested modifiers (not currently supported)
  if (baseClass.includes(":")) {
    return null;
  }

  // Base class must not be empty
  if (!baseClass) {
    return null;
  }

  return {
    modifier: potentialModifier as ModifierType,
    baseClass,
  };
}

/**
 * Check if a class name contains a modifier
 *
 * @param cls - Class name to check
 * @returns true if class has a supported modifier prefix
 */
export function hasModifier(cls: string): boolean {
  return parseModifier(cls) !== null;
}

/**
 * Split a space-separated className string into base and modifier classes
 *
 * @param className - Space-separated class names
 * @returns Object with baseClasses and modifierClasses arrays
 *
 * @example
 * splitModifierClasses("bg-blue-500 active:bg-blue-700 p-4 active:p-6")
 * // {
 * //   baseClasses: ["bg-blue-500", "p-4"],
 * //   modifierClasses: [
 * //     { modifier: "active", baseClass: "bg-blue-700" },
 * //     { modifier: "active", baseClass: "p-6" }
 * //   ]
 * // }
 */
export function splitModifierClasses(className: string): {
  baseClasses: string[];
  modifierClasses: ParsedModifier[];
} {
  const classes = className.trim().split(/\s+/).filter(Boolean);
  const baseClasses: string[] = [];
  const modifierClasses: ParsedModifier[] = [];

  for (const cls of classes) {
    const parsed = parseModifier(cls);
    if (parsed) {
      modifierClasses.push(parsed);
    } else {
      baseClasses.push(cls);
    }
  }

  return { baseClasses, modifierClasses };
}
