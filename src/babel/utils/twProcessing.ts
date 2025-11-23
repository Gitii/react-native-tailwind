/**
 * Utility functions for processing tw`...` and twStyle() calls
 */

import type { NodePath } from "@babel/core";
import type * as BabelTypes from "@babel/types";
import type { CustomTheme, ModifierType, ParsedModifier } from "../../parser/index.js";
import { expandSchemeModifier, isColorSchemeModifier, isSchemeModifier } from "../../parser/index.js";
import type { SchemeModifierConfig } from "../../types/config.js";
import type { StyleObject } from "../../types/core.js";
import { processColorSchemeModifiers } from "./colorSchemeModifierProcessing.js";

/**
 * Plugin state interface (subset needed for tw processing)
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface TwProcessingState {
  styleRegistry: Map<string, StyleObject>;
  customTheme: CustomTheme;
  schemeModifierConfig: SchemeModifierConfig;
  stylesIdentifier: string;
  // Color scheme support (for dark:/light: modifiers)
  needsColorSchemeImport: boolean;
  colorSchemeVariableName: string;
  functionComponentsNeedingColorScheme: Set<NodePath<BabelTypes.Function>>;
  colorSchemeLocalIdentifier?: string;
}

/**
 * Process tw`...` or twStyle('...') call and replace with TwStyle object
 * Generates: { style: styles._base, activeStyle: styles._active, ... }
 * When color-scheme modifiers are present, generates: { style: [base, _twColorScheme === 'dark' && dark, ...] }
 */
export function processTwCall(
  className: string,
  path: NodePath,
  state: TwProcessingState,
  parseClassName: (className: string, customTheme?: CustomTheme) => StyleObject,
  generateStyleKey: (className: string) => string,
  splitModifierClasses: (className: string) => { baseClasses: string[]; modifierClasses: ParsedModifier[] },
  findComponentScope: (path: NodePath, t: typeof BabelTypes) => NodePath<BabelTypes.Function> | null,
  t: typeof BabelTypes,
): void {
  const { baseClasses, modifierClasses: rawModifierClasses } = splitModifierClasses(className);

  // Expand scheme: modifiers into dark: and light: modifiers
  const modifierClasses: ParsedModifier[] = [];
  for (const modifier of rawModifierClasses) {
    if (isSchemeModifier(modifier.modifier)) {
      // Expand scheme: into dark: and light:
      const expanded = expandSchemeModifier(
        modifier,
        state.customTheme.colors ?? {},
        state.schemeModifierConfig.darkSuffix ?? "-dark",
        state.schemeModifierConfig.lightSuffix ?? "-light",
      );
      modifierClasses.push(...expanded);
    } else {
      // Keep other modifiers as-is
      modifierClasses.push(modifier);
    }
  }

  // Build TwStyle object properties
  const objectProperties: BabelTypes.ObjectProperty[] = [];

  // Parse and add base styles
  if (baseClasses.length > 0) {
    const baseClassName = baseClasses.join(" ");
    const baseStyleObject = parseClassName(baseClassName, state.customTheme);
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

  // Separate color-scheme modifiers from other modifiers
  const colorSchemeModifiers = modifierClasses.filter((m) => isColorSchemeModifier(m.modifier));
  const otherModifiers = modifierClasses.filter((m) => !isColorSchemeModifier(m.modifier));

  // Check if we need color scheme support
  const hasColorSchemeModifiers = colorSchemeModifiers.length > 0;
  let componentScope: NodePath<BabelTypes.Function> | null = null;

  if (hasColorSchemeModifiers) {
    // Find component scope for hook injection
    componentScope = findComponentScope(path, t);

    if (!componentScope) {
      // Warning: color scheme modifiers used outside component scope
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[react-native-tailwind] Color scheme modifiers (dark:, light:) in tw/twStyle calls ` +
            `must be used inside a React component. Modifiers will be ignored.`,
        );
      }
    } else {
      // Track this component as needing the color scheme hook
      state.functionComponentsNeedingColorScheme.add(componentScope);
    }
  }

  // Process color scheme modifiers if we have a valid component scope
  if (hasColorSchemeModifiers && componentScope) {
    // Generate conditional expressions for color scheme
    const colorSchemeConditionals = processColorSchemeModifiers(
      colorSchemeModifiers,
      state,
      parseClassName,
      generateStyleKey,
      t,
    );

    // Build style array: [baseStyle, _twColorScheme === 'dark' && darkStyle, ...]
    const styleArrayElements: BabelTypes.Expression[] = [];

    // Add base style if present
    if (baseClasses.length > 0) {
      const baseClassName = baseClasses.join(" ");
      const baseStyleObject = parseClassName(baseClassName, state.customTheme);
      const baseStyleKey = generateStyleKey(baseClassName);
      state.styleRegistry.set(baseStyleKey, baseStyleObject);
      styleArrayElements.push(
        t.memberExpression(t.identifier(state.stylesIdentifier), t.identifier(baseStyleKey)),
      );
    }

    // Add color scheme conditionals
    styleArrayElements.push(...colorSchemeConditionals);

    // Replace style property with array
    objectProperties[0] = t.objectProperty(t.identifier("style"), t.arrayExpression(styleArrayElements));

    // Also add darkStyle/lightStyle properties for manual processing
    // (e.g., extracting raw hex values for Reanimated animations)
    const darkModifiers = colorSchemeModifiers.filter((m) => m.modifier === "dark");
    const lightModifiers = colorSchemeModifiers.filter((m) => m.modifier === "light");

    if (darkModifiers.length > 0) {
      const darkClassNames = darkModifiers.map((m) => m.baseClass).join(" ");
      const darkStyleObject = parseClassName(darkClassNames, state.customTheme);
      const darkStyleKey = generateStyleKey(`dark_${darkClassNames}`);
      state.styleRegistry.set(darkStyleKey, darkStyleObject);

      objectProperties.push(
        t.objectProperty(
          t.identifier("darkStyle"),
          t.memberExpression(t.identifier(state.stylesIdentifier), t.identifier(darkStyleKey)),
        ),
      );
    }

    if (lightModifiers.length > 0) {
      const lightClassNames = lightModifiers.map((m) => m.baseClass).join(" ");
      const lightStyleObject = parseClassName(lightClassNames, state.customTheme);
      const lightStyleKey = generateStyleKey(`light_${lightClassNames}`);
      state.styleRegistry.set(lightStyleKey, lightStyleObject);

      objectProperties.push(
        t.objectProperty(
          t.identifier("lightStyle"),
          t.memberExpression(t.identifier(state.stylesIdentifier), t.identifier(lightStyleKey)),
        ),
      );
    }
  }

  // Group other modifiers by type (non-color-scheme modifiers)
  const modifiersByType = new Map<ModifierType, ParsedModifier[]>();
  for (const mod of otherModifiers) {
    if (!modifiersByType.has(mod.modifier)) {
      modifiersByType.set(mod.modifier, []);
    }
    const modGroup = modifiersByType.get(mod.modifier);
    if (modGroup) {
      modGroup.push(mod);
    }
  }

  // Add modifier styles (activeStyle, focusStyle, etc.) for non-color-scheme modifiers
  for (const [modifierType, modifiers] of modifiersByType) {
    const modifierClassNames = modifiers.map((m) => m.baseClass).join(" ");
    const modifierStyleObject = parseClassName(modifierClassNames, state.customTheme);
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
