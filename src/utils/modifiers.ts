/**
 * Shared utilities for parsing state modifiers (active:, focus:, disabled:)
 * Used by both runtime parser and Babel plugin
 */

// Supported state modifiers for Pressable/TextInput components
export const SUPPORTED_MODIFIERS = ["active", "focus", "disabled"] as const;
export type SupportedModifier = (typeof SUPPORTED_MODIFIERS)[number];

/**
 * Detect if a className contains any state modifiers (active:, focus:, disabled:)
 */
export function hasModifiers(className: string): boolean {
  return SUPPORTED_MODIFIERS.some((modifier) => className.includes(`${modifier}:`));
}

/**
 * Split className into base classes and modifier-specific classes
 * Returns: { base: string[], modifiers: Map<modifier, string[]> }
 *
 * @example
 * splitModifierClasses('bg-blue-500 active:bg-blue-700 disabled:bg-gray-300')
 * // Returns:
 * // {
 * //   base: ['bg-blue-500'],
 * //   modifiers: Map {
 * //     'active' => ['bg-blue-700'],
 * //     'disabled' => ['bg-gray-300']
 * //   }
 * // }
 */
export function splitModifierClasses(className: string): {
  base: string[];
  modifiers: Map<SupportedModifier, string[]>;
} {
  const classes = className.split(/\s+/).filter(Boolean);
  const base: string[] = [];
  const modifiers = new Map<SupportedModifier, string[]>();

  for (const cls of classes) {
    let matched = false;
    for (const modifier of SUPPORTED_MODIFIERS) {
      const prefix = `${modifier}:`;
      if (cls.startsWith(prefix)) {
        const cleanClass = cls.slice(prefix.length);
        if (!modifiers.has(modifier)) {
          modifiers.set(modifier, []);
        }
        const modifierClasses = modifiers.get(modifier);
        if (modifierClasses) {
          modifierClasses.push(cleanClass);
        }
        matched = true;
        break;
      }
    }
    if (!matched) {
      base.push(cls);
    }
  }

  return { base, modifiers };
}
