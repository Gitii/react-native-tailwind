/**
 * Utility functions for processing tw`...` and twStyle() calls
 */

import type { NodePath } from "@babel/core";
import type * as BabelTypes from "@babel/types";
import type { ModifierType, ParsedModifier } from "../../parser/index.js";
import type { StyleObject } from "../../types/core.js";

/**
 * Plugin state interface (subset needed for tw processing)
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface TwProcessingState {
  styleRegistry: Map<string, StyleObject>;
  customColors: Record<string, string>;
  stylesIdentifier: string;
}

/**
 * Process tw`...` or twStyle('...') call and replace with TwStyle object
 * Generates: { style: styles._base, activeStyle: styles._active, ... }
 */
export function processTwCall(
  className: string,
  path: NodePath,
  state: TwProcessingState,
  parseClassName: (className: string, customColors: Record<string, string>) => StyleObject,
  generateStyleKey: (className: string) => string,
  splitModifierClasses: (className: string) => { baseClasses: string[]; modifierClasses: ParsedModifier[] },
  t: typeof BabelTypes,
): void {
  const { baseClasses, modifierClasses } = splitModifierClasses(className);

  // Build TwStyle object properties
  const objectProperties: BabelTypes.ObjectProperty[] = [];

  // Parse and add base styles
  if (baseClasses.length > 0) {
    const baseClassName = baseClasses.join(" ");
    const baseStyleObject = parseClassName(baseClassName, state.customColors);
    const baseStyleKey = generateStyleKey(baseClassName);
    state.styleRegistry.set(baseStyleKey, baseStyleObject);

    objectProperties.push(
      t.objectProperty(
        t.identifier("style"),
        t.memberExpression(t.identifier(state.stylesIdentifier), t.identifier(baseStyleKey)),
      ),
    );
  } else {
    // No base classes - add empty style object
    objectProperties.push(t.objectProperty(t.identifier("style"), t.objectExpression([])));
  }

  // Group modifiers by type
  const modifiersByType = new Map<ModifierType, ParsedModifier[]>();
  for (const mod of modifierClasses) {
    if (!modifiersByType.has(mod.modifier)) {
      modifiersByType.set(mod.modifier, []);
    }
    const modGroup = modifiersByType.get(mod.modifier);
    if (modGroup) {
      modGroup.push(mod);
    }
  }

  // Add modifier styles
  for (const [modifierType, modifiers] of modifiersByType) {
    const modifierClassNames = modifiers.map((m) => m.baseClass).join(" ");
    const modifierStyleObject = parseClassName(modifierClassNames, state.customColors);
    const modifierStyleKey = generateStyleKey(`${modifierType}_${modifierClassNames}`);
    state.styleRegistry.set(modifierStyleKey, modifierStyleObject);

    // Map modifier type to property name: active -> activeStyle
    const propertyName = `${modifierType}Style`;

    objectProperties.push(
      t.objectProperty(
        t.identifier(propertyName),
        t.memberExpression(t.identifier(state.stylesIdentifier), t.identifier(modifierStyleKey)),
      ),
    );
  }

  // Replace the tw`...` or twStyle('...') with the object
  const twStyleObject = t.objectExpression(objectProperties);
  path.replaceWith(twStyleObject);
}

/**
 * Remove tw/twStyle imports from @mgcrea/react-native-tailwind
 * This is called after all tw calls have been transformed
 */
export function removeTwImports(path: NodePath<BabelTypes.Program>, t: typeof BabelTypes): void {
  // Traverse the program to find and remove tw/twStyle imports
  path.traverse({
    ImportDeclaration(importPath) {
      const node = importPath.node;

      // Only process imports from main package
      if (node.source.value !== "@mgcrea/react-native-tailwind") {
        return;
      }

      // Filter out tw/twStyle specifiers
      const remainingSpecifiers = node.specifiers.filter((spec) => {
        if (t.isImportSpecifier(spec) && t.isIdentifier(spec.imported)) {
          const importedName = spec.imported.name;
          return importedName !== "tw" && importedName !== "twStyle";
        }
        return true;
      });

      if (remainingSpecifiers.length === 0) {
        // Remove entire import if no specifiers remain
        importPath.remove();
      } else if (remainingSpecifiers.length < node.specifiers.length) {
        // Update import with remaining specifiers
        node.specifiers = remainingSpecifiers;
      }
    },
  });
}
