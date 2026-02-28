import type * as BabelTypes from "@babel/types";
import type { ComponentClassToPropRule } from "../plugin/state.js";

export function normalizeClassToPropRules(
  rules: ComponentClassToPropRule[] | undefined,
): ComponentClassToPropRule[] {
  if (!rules || rules.length === 0) {
    return [];
  }

  const normalizedRules: ComponentClassToPropRule[] = [];

  for (const rule of rules) {
    const importFrom = typeof rule.importFrom === "string" ? rule.importFrom.trim() : "";
    if (!importFrom) {
      console.warn(
        "[react-native-tailwind] Class-to-prop mapping rule has empty importFrom. Rule will be ignored.",
      );
      continue;
    }

    const components = Array.isArray(rule.components)
      ? rule.components.map((component) => component.trim()).filter(Boolean)
      : [];

    if (components.length === 0) {
      console.warn(
        `[react-native-tailwind] Class-to-prop mapping rule for '${importFrom}' has empty components array. Rule will be ignored.`,
      );
      continue;
    }

    const mappingEntries = Object.entries(rule.mapping ?? {});
    if (mappingEntries.length === 0) {
      console.warn(
        `[react-native-tailwind] Class-to-prop mapping rule for '${importFrom}' has empty mapping object. Rule will be ignored.`,
      );
      continue;
    }

    const validMapping = Object.fromEntries(
      mappingEntries
        .map(([prop, pattern]) => [prop.trim(), pattern.trim()] as const)
        .filter(([prop, pattern]) => {
          if (!prop || !pattern) {
            return false;
          }
          if (!pattern.includes("*")) {
            console.warn(
              `[react-native-tailwind] Class-to-prop mapping pattern '${pattern}' for prop '${prop}' in rule from '${importFrom}' does not contain '*' wildcard. Pattern will be ignored.`,
            );
            return false;
          }
          return true;
        }),
    );

    if (Object.keys(validMapping).length === 0) {
      console.warn(
        `[react-native-tailwind] Class-to-prop mapping rule for '${importFrom}' has no valid mapping patterns. Rule will be ignored.`,
      );
      continue;
    }

    normalizedRules.push({
      importFrom,
      components,
      mapping: validMapping,
    });
  }

  return normalizedRules;
}

export function buildImportMap(
  importDeclaration: BabelTypes.ImportDeclaration,
  rules: ComponentClassToPropRule[],
  t: typeof BabelTypes,
): Map<string, string> | null {
  if (importDeclaration.importKind === "type") {
    return null;
  }

  const importSource = importDeclaration.source.value;
  const hasMatchingRule = rules.some((rule) => rule.importFrom === importSource);
  if (!hasMatchingRule) {
    return null;
  }

  const localToSource = new Map<string, string>();

  for (const spec of importDeclaration.specifiers) {
    if (t.isImportSpecifier(spec)) {
      if (spec.importKind === "type") {
        continue;
      }
      localToSource.set(spec.local.name, importSource);
      continue;
    }

    if (t.isImportNamespaceSpecifier(spec)) {
      localToSource.set(spec.local.name, importSource);
      continue;
    }

    if (t.isImportDefaultSpecifier(spec)) {
      localToSource.set(spec.local.name, importSource);
    }
  }

  return localToSource.size > 0 ? localToSource : null;
}

function matchesRuleComponent(rule: ComponentClassToPropRule, componentName: string): boolean {
  return rule.components.includes("*") || rule.components.includes(componentName);
}

export function getClassToPropRule(
  jsxElement: BabelTypes.JSXOpeningElement,
  importMap: Map<string, Set<string>>,
  rules: ComponentClassToPropRule[],
  t: typeof BabelTypes,
): ComponentClassToPropRule | null {
  const name = jsxElement.name;

  if (t.isJSXIdentifier(name)) {
    const localName = name.name;

    for (const [importSource, localNames] of importMap) {
      if (!localNames.has(localName)) {
        continue;
      }

      for (const rule of rules) {
        if (rule.importFrom === importSource && matchesRuleComponent(rule, localName)) {
          return rule;
        }
      }

      return null;
    }

    return null;
  }

  if (t.isJSXMemberExpression(name)) {
    const namespace = name.object;
    const property = name.property;

    if (!t.isJSXIdentifier(namespace) || !t.isJSXIdentifier(property)) {
      return null;
    }

    const namespaceName = namespace.name;
    const componentName = property.name;

    for (const [importSource, localNames] of importMap) {
      if (!localNames.has(namespaceName)) {
        continue;
      }

      for (const rule of rules) {
        if (rule.importFrom === importSource && matchesRuleComponent(rule, componentName)) {
          return rule;
        }
      }

      return null;
    }
  }

  return null;
}
