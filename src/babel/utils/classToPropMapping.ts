import type { NodePath } from "@babel/core";
import type * as BabelTypes from "@babel/types";
import type {
  ColorSchemeModifierType,
  CustomTheme,
  DirectionalModifierType,
  ParsedModifier,
  PlatformModifierType,
} from "../../parser/index.js";
import {
  expandSchemeModifier,
  isColorSchemeModifier,
  isDirectionalModifier,
  isPlatformModifier,
  isSchemeModifier,
  isStateModifier,
  parseClass,
  splitModifierClasses,
} from "../../parser/index.js";
import type { SchemeModifierConfig } from "../../types/config.js";
import type { StyleObject } from "../../types/core.js";
import { findComponentScope } from "../plugin/componentScope.js";
import { resolveConfigRefs, type FullResolvedTheme } from "./configRefResolver.js";
import { buildConfigRefExpression, injectColorSchemeHook } from "./styleInjection.js";

export type MappedPropPrimitive = string | number;

export type MappedPropValue = {
  value: MappedPropPrimitive;
  configRef?: string[];
};

export type ClassToPropMappingsResult = {
  mappedProps: Map<string, MappedPropValue>;
  unmatchedClasses: string[];
};

export type MappedModifierValues = {
  base?: MappedPropPrimitive;
  dark?: MappedPropPrimitive;
  light?: MappedPropPrimitive;
  ios?: MappedPropPrimitive;
  android?: MappedPropPrimitive;
  web?: MappedPropPrimitive;
  rtl?: MappedPropPrimitive;
  ltr?: MappedPropPrimitive;
  configRefs?: {
    base?: string[];
    dark?: string[];
    light?: string[];
    ios?: string[];
    android?: string[];
    web?: string[];
    rtl?: string[];
    ltr?: string[];
  };
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface ClassToPropMappingState {
  customTheme: CustomTheme;
  fullResolvedTheme: FullResolvedTheme;
  schemeModifierConfig: SchemeModifierConfig;
  needsPlatformImport: boolean;
  needsColorSchemeImport: boolean;
  needsI18nManagerImport: boolean;
  colorSchemeVariableName: string;
  colorSchemeHookName: string;
  colorSchemeLocalIdentifier?: string;
  i18nManagerVariableName: string;
  functionComponentsNeedingColorScheme: Set<NodePath<BabelTypes.Function>>;
  configProviderEnabled: boolean;
  needsConfigImport: boolean;
}

function toLiteralExpression(value: MappedPropPrimitive, t: typeof BabelTypes): BabelTypes.Expression {
  return typeof value === "number" ? t.numericLiteral(value) : t.stringLiteral(value);
}

function toMappedExpression(
  value: MappedPropPrimitive,
  configRef: string[] | undefined,
  configProviderEnabled: boolean,
  t: typeof BabelTypes,
): BabelTypes.Expression {
  if (configProviderEnabled && configRef) {
    return buildConfigRefExpression(configRef, "__twConfig", t);
  }
  return toLiteralExpression(value, t);
}

function getFirstStringValue(styleObject: StyleObject): string | null {
  for (const value of Object.values(styleObject)) {
    if (typeof value === "string") {
      return value;
    }
  }
  return null;
}

function getFirstNumericValue(styleObject: StyleObject): number | null {
  for (const value of Object.values(styleObject)) {
    if (typeof value === "number") {
      return value;
    }
  }
  return null;
}

function getColorValue(styleObject: StyleObject): string | null {
  const directColorKeys = ["color", "backgroundColor", "borderColor", "outlineColor"];
  for (const key of directColorKeys) {
    const value = styleObject[key];
    if (typeof value === "string") {
      return value;
    }
  }

  for (const [key, value] of Object.entries(styleObject)) {
    if (key.toLowerCase().includes("color") && typeof value === "string") {
      return value;
    }
  }

  return null;
}

function getConfigRefForKey(refs: Map<string, string[]>, keys: string[]): string[] | null {
  for (const key of keys) {
    const ref = refs.get(key);
    if (ref) {
      return ref;
    }
  }
  return null;
}

function warnUnsupportedModifier(modifier: ParsedModifier, filename?: string): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  if (modifier.modifier === "placeholder") {
    console.warn(
      `[react-native-tailwind] placeholder: modifier is not supported for class-to-prop mapping in v1. ` +
        `Ignoring "${modifier.modifier}:${modifier.baseClass}".`,
    );
    return;
  }

  console.warn(
    `[react-native-tailwind] ${modifier.modifier}: modifier is not supported for class-to-prop mapping in v1. ` +
      `Ignoring "${modifier.modifier}:${modifier.baseClass}".`,
  );
}

export function matchClassToPattern(classToken: string, pattern: string): boolean {
  if (!pattern.endsWith("*")) {
    return classToken === pattern;
  }

  const prefix = pattern.slice(0, -1);
  return classToken.startsWith(prefix) && classToken.length > prefix.length;
}

export function resolveConfigRefForProp(
  classToken: string,
  targetProp: string,
  fullResolvedTheme: FullResolvedTheme,
): string[] | null {
  const refs = resolveConfigRefs(classToken, fullResolvedTheme);
  if (refs.size === 0) {
    return null;
  }

  if (targetProp === "color") {
    return getConfigRefForKey(refs, [
      "color",
      "backgroundColor",
      "borderColor",
      "borderTopColor",
      "borderRightColor",
      "borderBottomColor",
      "borderLeftColor",
      "outlineColor",
    ]);
  }

  if (targetProp === "size") {
    return getConfigRefForKey(refs, ["width", "height"]);
  }

  if (targetProp === "opacity") {
    return getConfigRefForKey(refs, ["opacity"]);
  }

  return refs.values().next().value ?? null;
}

export function extractPropValue(
  classToken: string,
  targetProp: string,
  customTheme: CustomTheme,
  fullResolvedTheme: FullResolvedTheme,
): MappedPropValue | null {
  const styleObject = parseClass(classToken, customTheme);
  if (Object.keys(styleObject).length === 0) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[react-native-tailwind] Unknown class "${classToken}" could not be parsed for prop mapping.`,
      );
    }
    return null;
  }

  if (targetProp === "color") {
    const colorValue = getColorValue(styleObject);
    if (!colorValue) {
      return null;
    }
    const configRef = resolveConfigRefForProp(classToken, targetProp, fullResolvedTheme);
    return configRef ? { value: colorValue, configRef } : { value: colorValue };
  }

  if (targetProp === "size") {
    const width = styleObject.width;
    const height = styleObject.height;
    if (typeof width !== "number" || typeof height !== "number" || width !== height) {
      return null;
    }
    const configRef = resolveConfigRefForProp(classToken, targetProp, fullResolvedTheme);
    return configRef ? { value: width, configRef } : { value: width };
  }

  if (targetProp === "opacity") {
    const opacityValue = styleObject.opacity;
    if (typeof opacityValue !== "number") {
      return null;
    }
    const configRef = resolveConfigRefForProp(classToken, targetProp, fullResolvedTheme);
    return configRef ? { value: opacityValue, configRef } : { value: opacityValue };
  }

  const numericValue = getFirstNumericValue(styleObject);
  if (numericValue !== null) {
    const configRef = resolveConfigRefForProp(classToken, targetProp, fullResolvedTheme);
    return configRef ? { value: numericValue, configRef } : { value: numericValue };
  }

  const stringValue = getFirstStringValue(styleObject);
  if (stringValue !== null) {
    const configRef = resolveConfigRefForProp(classToken, targetProp, fullResolvedTheme);
    return configRef ? { value: stringValue, configRef } : { value: stringValue };
  }

  return null;
}

export function processClassToPropMappings(
  className: string,
  mappingRules: Record<string, string>,
  customTheme: CustomTheme,
  fullResolvedTheme: FullResolvedTheme,
): ClassToPropMappingsResult {
  const classTokens = className.split(/\s+/).filter(Boolean);
  const mappedProps = new Map<string, MappedPropValue>();
  const unmatchedClasses: string[] = [];

  for (const classToken of classTokens) {
    let matchedAnyPattern = false;

    for (const [propName, pattern] of Object.entries(mappingRules)) {
      if (!matchClassToPattern(classToken, pattern)) {
        continue;
      }

      matchedAnyPattern = true;
      const extractedValue = extractPropValue(classToken, propName, customTheme, fullResolvedTheme);
      if (!extractedValue) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[react-native-tailwind] Class "${classToken}" matched pattern "${pattern}" but could not extract a value for prop "${propName}".`,
          );
        }
        continue;
      }

      if (mappedProps.has(propName) && process.env.NODE_ENV !== "production") {
        console.warn(
          `[react-native-tailwind] Multiple class tokens mapped to prop "${propName}". ` +
            `Last match wins: "${classToken}".`,
        );
      }

      mappedProps.set(propName, extractedValue);
    }

    if (!matchedAnyPattern) {
      unmatchedClasses.push(classToken);
    }
  }

  return { mappedProps, unmatchedClasses };
}

export function buildMappedPropExpression(
  propName: string,
  values: MappedModifierValues,
  state: Pick<
    ClassToPropMappingState,
    | "colorSchemeVariableName"
    | "i18nManagerVariableName"
    | "needsColorSchemeImport"
    | "needsPlatformImport"
    | "needsI18nManagerImport"
    | "configProviderEnabled"
    | "needsConfigImport"
  >,
  t: typeof BabelTypes,
): BabelTypes.Expression {
  if (state.configProviderEnabled && values.configRefs) {
    const refs = values.configRefs;
    if (refs.base || refs.dark || refs.light || refs.ios || refs.android || refs.web || refs.rtl || refs.ltr) {
      state.needsConfigImport = true;
    }
  }

  let expression: BabelTypes.Expression | null =
    values.base !== undefined
      ? toMappedExpression(values.base, values.configRefs?.base, state.configProviderEnabled, t)
      : null;

  const hasColorScheme = values.dark !== undefined || values.light !== undefined;
  if (hasColorScheme) {
    state.needsColorSchemeImport = true;

    const defaultExpression = expression ?? t.identifier("undefined");
    const darkExpression =
      values.dark !== undefined ? toMappedExpression(values.dark, values.configRefs?.dark, state.configProviderEnabled, t) : t.cloneNode(defaultExpression);
    const lightExpression =
      values.light !== undefined ? toMappedExpression(values.light, values.configRefs?.light, state.configProviderEnabled, t) : t.cloneNode(defaultExpression);

    expression = t.conditionalExpression(
      t.binaryExpression("===", t.identifier(state.colorSchemeVariableName), t.stringLiteral("dark")),
      darkExpression,
      lightExpression,
    );
  }

  const hasDirectional = values.rtl !== undefined || values.ltr !== undefined;
  if (hasDirectional) {
    state.needsI18nManagerImport = true;

    const defaultExpression = expression ?? t.identifier("undefined");
    const rtlExpression =
      values.rtl !== undefined ? toMappedExpression(values.rtl, values.configRefs?.rtl, state.configProviderEnabled, t) : t.cloneNode(defaultExpression);
    const ltrExpression =
      values.ltr !== undefined ? toMappedExpression(values.ltr, values.configRefs?.ltr, state.configProviderEnabled, t) : t.cloneNode(defaultExpression);

    expression = t.conditionalExpression(
      t.identifier(state.i18nManagerVariableName),
      rtlExpression,
      ltrExpression,
    );
  }

  const hasPlatform = values.ios !== undefined || values.android !== undefined || values.web !== undefined;
  if (hasPlatform) {
    state.needsPlatformImport = true;

    const selectProperties: BabelTypes.ObjectProperty[] = [];
    if (values.ios !== undefined) {
      selectProperties.push(t.objectProperty(t.identifier("ios"), toMappedExpression(values.ios, values.configRefs?.ios, state.configProviderEnabled, t)));
    }
    if (values.android !== undefined) {
      selectProperties.push(t.objectProperty(t.identifier("android"), toMappedExpression(values.android, values.configRefs?.android, state.configProviderEnabled, t)));
    }
    if (values.web !== undefined) {
      selectProperties.push(t.objectProperty(t.identifier("web"), toMappedExpression(values.web, values.configRefs?.web, state.configProviderEnabled, t)));
    }

    if (expression) {
      selectProperties.push(t.objectProperty(t.identifier("default"), expression));
    }

    expression = t.callExpression(t.memberExpression(t.identifier("Platform"), t.identifier("select")), [
      t.objectExpression(selectProperties),
    ]);
  }

  if (expression) {
    return expression;
  }

  const fallbackValue =
    values.dark ?? values.light ?? values.rtl ?? values.ltr ?? values.ios ?? values.android ?? values.web;

  if (fallbackValue !== undefined) {
    const fallbackConfigRef =
      values.configRefs?.dark ??
      values.configRefs?.light ??
      values.configRefs?.rtl ??
      values.configRefs?.ltr ??
      values.configRefs?.ios ??
      values.configRefs?.android ??
      values.configRefs?.web;
    return toMappedExpression(fallbackValue, fallbackConfigRef, state.configProviderEnabled, t);
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[react-native-tailwind] Unable to build mapped prop expression for "${propName}". Falling back to undefined.`,
    );
  }

  return t.identifier("undefined");
}

export function processModifiedClassToPropMappings(
  className: string,
  mappingRules: Record<string, string>,
  state: ClassToPropMappingState,
  t: typeof BabelTypes,
  path?: NodePath,
): Map<string, BabelTypes.Expression> {
  const { baseClasses, modifierClasses: rawModifierClasses } = splitModifierClasses(className);

  const modifierClasses: ParsedModifier[] = [];
  for (const modifier of rawModifierClasses) {
    if (isSchemeModifier(modifier.modifier)) {
      const expandedModifiers = expandSchemeModifier(
        modifier,
        state.customTheme.colors ?? {},
        state.schemeModifierConfig.darkSuffix ?? "-dark",
        state.schemeModifierConfig.lightSuffix ?? "-light",
      );
      modifierClasses.push(...expandedModifiers);
      continue;
    }

    modifierClasses.push(modifier);
  }

  const baseResult = processClassToPropMappings(
    baseClasses.join(" "),
    mappingRules,
    state.customTheme,
    state.fullResolvedTheme,
  );

  const valuesByProp = new Map<string, MappedModifierValues>();

  for (const [propName, mappedValue] of baseResult.mappedProps) {
    const modValues: MappedModifierValues = { base: mappedValue.value };
    if (mappedValue.configRef) {
      modValues.configRefs = { base: mappedValue.configRef };
    }
    valuesByProp.set(propName, modValues);
  }

  let hasColorSchemeModifiers = false;

  for (const modifier of modifierClasses) {
    if (isStateModifier(modifier.modifier)) {
      warnUnsupportedModifier(modifier);
      continue;
    }

    let matchedPropName: string | null = null;
    for (const [propName, pattern] of Object.entries(mappingRules)) {
      if (matchClassToPattern(modifier.baseClass, pattern)) {
        matchedPropName = propName;
        break;
      }
    }

    if (!matchedPropName) {
      continue;
    }

    const extracted = extractPropValue(
      modifier.baseClass,
      matchedPropName,
      state.customTheme,
      state.fullResolvedTheme,
    );
    if (!extracted) {
      continue;
    }

    const currentValues = valuesByProp.get(matchedPropName) ?? {};

    if (isColorSchemeModifier(modifier.modifier)) {
      hasColorSchemeModifiers = true;
      const scheme = modifier.modifier as ColorSchemeModifierType;
      currentValues[scheme] = extracted.value;
      if (extracted.configRef) {
        if (!currentValues.configRefs) currentValues.configRefs = {};
        currentValues.configRefs[scheme] = extracted.configRef;
      }
    } else if (isPlatformModifier(modifier.modifier)) {
      const platform = modifier.modifier as PlatformModifierType;
      currentValues[platform] = extracted.value;
      if (extracted.configRef) {
        if (!currentValues.configRefs) currentValues.configRefs = {};
        currentValues.configRefs[platform] = extracted.configRef;
      }
    } else if (isDirectionalModifier(modifier.modifier)) {
      const direction = modifier.modifier as DirectionalModifierType;
      currentValues[direction] = extracted.value;
      if (extracted.configRef) {
        if (!currentValues.configRefs) currentValues.configRefs = {};
        currentValues.configRefs[direction] = extracted.configRef;
      }
    }

    valuesByProp.set(matchedPropName, currentValues);
  }

  if (hasColorSchemeModifiers) {
    state.needsColorSchemeImport = true;

    if (path) {
      const componentScope = findComponentScope(path, t);
      if (componentScope) {
        state.functionComponentsNeedingColorScheme.add(componentScope);
        injectColorSchemeHook(
          componentScope,
          state.colorSchemeVariableName,
          state.colorSchemeHookName,
          state.colorSchemeLocalIdentifier,
          t,
        );
      }
    }
  }

  const mappedExpressions = new Map<string, BabelTypes.Expression>();
  for (const [propName, values] of valuesByProp) {
    mappedExpressions.set(propName, buildMappedPropExpression(propName, values, state, t));
  }

  return mappedExpressions;
}
