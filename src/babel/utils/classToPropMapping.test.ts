import * as t from "@babel/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CustomTheme } from "../../parser";
import { SPACING_SCALE } from "../../parser/spacing";
import { FONT_SIZES } from "../../parser/typography";
import { COLORS } from "../../utils/colorUtils";
import {
  buildMappedPropExpression,
  extractPropValue,
  matchClassToPattern,
  processClassToPropMappings,
  type MappedModifierValues,
} from "./classToPropMapping";
import type { FullResolvedTheme } from "./configRefResolver";

// Theme fixtures (following configRefResolver.test.ts pattern)
const baseTheme: FullResolvedTheme = {
  colors: { ...COLORS },
  spacing: { ...SPACING_SCALE },
  fontSize: { ...FONT_SIZES },
  fontFamily: {
    sans: "System",
    serif: "serif",
    mono: "Courier",
  },
};

const emptyCustomTheme: CustomTheme = {};

// ─── matchClassToPattern ────────────────────────────────────────────

describe("matchClassToPattern", () => {
  it("matches text-red-500 against text-* wildcard", () => {
    expect(matchClassToPattern("text-red-500", "text-*")).toBe(true);
  });

  it("matches size-6 against size-* wildcard", () => {
    expect(matchClassToPattern("size-6", "size-*")).toBe(true);
  });

  it("does not match bg-blue-500 against text-* wildcard", () => {
    expect(matchClassToPattern("bg-blue-500", "text-*")).toBe(false);
  });

  it("requires exact match for patterns without wildcard", () => {
    expect(matchClassToPattern("opacity-50", "opacity-50")).toBe(true);
    expect(matchClassToPattern("opacity-75", "opacity-50")).toBe(false);
  });

  it("does not match prefix-only token (classToken === prefix)", () => {
    // "text-" starts with prefix "text-" but length is equal, not greater
    expect(matchClassToPattern("text-", "text-*")).toBe(false);
  });

  it("matches various wildcard patterns", () => {
    expect(matchClassToPattern("opacity-50", "opacity-*")).toBe(true);
    expect(matchClassToPattern("opacity-100", "opacity-*")).toBe(true);
    expect(matchClassToPattern("bg-blue-500", "bg-*")).toBe(true);
  });

  it("does not match unrelated classes against wildcard", () => {
    expect(matchClassToPattern("font-bold", "text-*")).toBe(false);
    expect(matchClassToPattern("p-4", "size-*")).toBe(false);
    expect(matchClassToPattern("m-2", "opacity-*")).toBe(false);
  });
});

// ─── extractPropValue ───────────────────────────────────────────────

describe("extractPropValue", () => {
  let warnSpy: ReturnType<typeof vi.spyOn> | undefined;

  afterEach(() => {
    warnSpy?.mockRestore();
    warnSpy = undefined;
  });

  it("extracts color value for text-red-500", () => {
    const result = extractPropValue("text-red-500", "color", emptyCustomTheme, baseTheme);
    expect(result).not.toBeNull();
    expect(result!.value).toBe(COLORS["red-500"]);
    expect(result!.configRef).toEqual(["theme", "colors", "red-500"]);
  });

  it("extracts size value for size-6", () => {
    const result = extractPropValue("size-6", "size", emptyCustomTheme, baseTheme);
    expect(result).not.toBeNull();
    expect(result!.value).toBe(24); // SPACING_SCALE["6"] = 24
  });

  it("extracts opacity value for opacity-50", () => {
    const result = extractPropValue("opacity-50", "opacity", emptyCustomTheme, baseTheme);
    expect(result).not.toBeNull();
    expect(result!.value).toBe(0.5);
  });

  it("extracts color value with custom theme colors", () => {
    const customTheme: CustomTheme = {
      colors: { primary: "#1bacb5" },
    };
    const themeWithPrimary: FullResolvedTheme = {
      ...baseTheme,
      colors: { ...baseTheme.colors, primary: "#1bacb5" },
    };

    const result = extractPropValue("text-primary", "color", customTheme, themeWithPrimary);
    expect(result).not.toBeNull();
    expect(result!.value).toBe("#1bacb5");
    expect(result!.configRef).toEqual(["theme", "colors", "primary"]);
  });

  it("returns null for unknown class and warns", () => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = extractPropValue("nonexistent-class-xyz", "color", emptyCustomTheme, baseTheme);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      '[react-native-tailwind] Unknown class "nonexistent-class-xyz" could not be parsed for prop mapping.',
    );
  });

  it("returns null when color prop has no color value", () => {
    // p-4 → { padding: 16 } — no color-like value
    const result = extractPropValue("p-4", "color", emptyCustomTheme, baseTheme);
    expect(result).toBeNull();
  });

  it("extracts backgroundColor via color prop for bg-blue-500", () => {
    const result = extractPropValue("bg-blue-500", "color", emptyCustomTheme, baseTheme);
    expect(result).not.toBeNull();
    expect(result!.value).toBe(COLORS["blue-500"]);
  });

  it("returns null for size when width !== height", () => {
    // w-4 only sets width (16), no height
    const result = extractPropValue("w-4", "size", emptyCustomTheme, baseTheme);
    expect(result).toBeNull();
  });

  it("returns null for opacity when no opacity value in style", () => {
    // text-red-500 → { color: "..." } — no opacity property
    const result = extractPropValue("text-red-500", "opacity", emptyCustomTheme, baseTheme);
    expect(result).toBeNull();
  });

  it("falls back to first numeric value for generic prop", () => {
    // p-4 → { padding: 16 }
    const result = extractPropValue("p-4", "customProp", emptyCustomTheme, baseTheme);
    expect(result).not.toBeNull();
    expect(result!.value).toBe(16);
  });

  it("falls back to first string value for generic prop when no numeric", () => {
    const customTheme: CustomTheme = { fontFamily: { sans: "System" } };
    const result = extractPropValue("font-sans", "customProp", customTheme, baseTheme);
    expect(result).not.toBeNull();
    expect(result!.value).toBe("System");
  });
});

// ─── processClassToPropMappings ─────────────────────────────────────

describe("processClassToPropMappings", () => {
  let warnSpy: ReturnType<typeof vi.spyOn> | undefined;

  afterEach(() => {
    warnSpy?.mockRestore();
    warnSpy = undefined;
  });

  it("maps multiple classes to different props correctly", () => {
    const result = processClassToPropMappings(
      "text-red-500 size-6",
      { color: "text-*", size: "size-*" },
      emptyCustomTheme,
      baseTheme,
    );

    expect(result.mappedProps.get("color")?.value).toBe(COLORS["red-500"]);
    expect(result.mappedProps.get("size")?.value).toBe(24);
    expect(result.unmatchedClasses).toEqual([]);
  });

  it("collects unmatched classes in unmatchedClasses", () => {
    const result = processClassToPropMappings(
      "text-red-500 p-4 font-bold",
      { color: "text-*" },
      emptyCustomTheme,
      baseTheme,
    );

    expect(result.mappedProps.get("color")?.value).toBe(COLORS["red-500"]);
    expect(result.unmatchedClasses).toEqual(["p-4", "font-bold"]);
  });

  it("last match wins when multiple classes map to same prop", () => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = processClassToPropMappings(
      "text-red-500 text-blue-500",
      { color: "text-*" },
      emptyCustomTheme,
      baseTheme,
    );

    // Last match (text-blue-500) should win
    expect(result.mappedProps.get("color")?.value).toBe(COLORS["blue-500"]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Multiple class tokens mapped to prop "color"'),
    );
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Last match wins: "text-blue-500"'));
  });

  it("warns when class matches pattern but value cannot be extracted", () => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // text-red-500 matches "text-*" but has no size value (width/height check fails)
    const result = processClassToPropMappings("text-red-500", { size: "text-*" }, emptyCustomTheme, baseTheme);

    expect(result.mappedProps.has("size")).toBe(false);
    // Token matched so it's not "unmatched"
    expect(result.unmatchedClasses).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Class "text-red-500" matched pattern "text-*" but could not extract a value for prop "size"',
      ),
    );
  });

  it("handles empty className string", () => {
    const result = processClassToPropMappings("", { color: "text-*" }, emptyCustomTheme, baseTheme);

    expect(result.mappedProps.size).toBe(0);
    expect(result.unmatchedClasses).toEqual([]);
  });

  it("handles className with only unmatched classes", () => {
    const result = processClassToPropMappings("p-4 m-2", { color: "text-*" }, emptyCustomTheme, baseTheme);

    expect(result.mappedProps.size).toBe(0);
    expect(result.unmatchedClasses).toEqual(["p-4", "m-2"]);
  });

  it("maps opacity class correctly", () => {
    const result = processClassToPropMappings(
      "opacity-50",
      { opacity: "opacity-*" },
      emptyCustomTheme,
      baseTheme,
    );

    expect(result.mappedProps.get("opacity")?.value).toBe(0.5);
    expect(result.unmatchedClasses).toEqual([]);
  });
});

// ─── buildMappedPropExpression ──────────────────────────────────────

describe("buildMappedPropExpression", () => {
  const makeState = () => ({
    colorSchemeVariableName: "_colorScheme",
    i18nManagerVariableName: "_isRTL",
    needsColorSchemeImport: false,
    needsPlatformImport: false,
    needsI18nManagerImport: false,
    configProviderEnabled: false,
    needsConfigImport: false,
  });

  it("builds conditional expression for dark/light color scheme", () => {
    const state = makeState();
    const values: MappedModifierValues = {
      dark: COLORS["red-500"],
      light: COLORS["blue-500"],
    };

    const expr = buildMappedPropExpression("color", values, state, t);

    // Should produce: _colorScheme === "dark" ? "<red>" : "<blue>"
    expect(t.isConditionalExpression(expr)).toBe(true);
    expect(state.needsColorSchemeImport).toBe(true);

    const cond = expr as t.ConditionalExpression;
    // Test: _colorScheme === "dark"
    expect(t.isBinaryExpression(cond.test)).toBe(true);
    const test = cond.test as t.BinaryExpression;
    expect(test.operator).toBe("===");
    expect(t.isIdentifier(test.left)).toBe(true);
    expect((test.left as t.Identifier).name).toBe("_colorScheme");
    expect(t.isStringLiteral(test.right)).toBe(true);
    expect((test.right as t.StringLiteral).value).toBe("dark");

    // Consequent: dark value
    expect(t.isStringLiteral(cond.consequent)).toBe(true);
    expect((cond.consequent as t.StringLiteral).value).toBe(COLORS["red-500"]);

    // Alternate: light value
    expect(t.isStringLiteral(cond.alternate)).toBe(true);
    expect((cond.alternate as t.StringLiteral).value).toBe(COLORS["blue-500"]);
  });

  it("builds Platform.select for ios/android modifiers", () => {
    const state = makeState();
    const values: MappedModifierValues = {
      ios: 24,
      android: 32,
    };

    const expr = buildMappedPropExpression("size", values, state, t);

    // Should produce: Platform.select({ ios: 24, android: 32 })
    expect(t.isCallExpression(expr)).toBe(true);
    expect(state.needsPlatformImport).toBe(true);

    const call = expr as t.CallExpression;
    // Callee: Platform.select
    expect(t.isMemberExpression(call.callee)).toBe(true);
    const callee = call.callee as t.MemberExpression;
    expect((callee.object as t.Identifier).name).toBe("Platform");
    expect((callee.property as t.Identifier).name).toBe("select");

    // Single object argument with ios + android properties
    expect(call.arguments).toHaveLength(1);
    expect(t.isObjectExpression(call.arguments[0])).toBe(true);
    const objExpr = call.arguments[0] as t.ObjectExpression;
    const keys = objExpr.properties.filter(t.isObjectProperty).map((p) => (p.key as t.Identifier).name);
    expect(keys).toContain("ios");
    expect(keys).toContain("android");
  });

  it("builds simple string literal for base-only value", () => {
    const state = makeState();
    const values: MappedModifierValues = { base: "#ef4444" };

    const expr = buildMappedPropExpression("color", values, state, t);

    expect(t.isStringLiteral(expr)).toBe(true);
    expect((expr as t.StringLiteral).value).toBe("#ef4444");
  });

  it("builds numeric literal for base-only numeric value", () => {
    const state = makeState();
    const values: MappedModifierValues = { base: 24 };

    const expr = buildMappedPropExpression("size", values, state, t);

    expect(t.isNumericLiteral(expr)).toBe(true);
    expect((expr as t.NumericLiteral).value).toBe(24);
  });

  it("falls back to undefined with warning when no values provided (state modifiers skipped)", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const state = makeState();
    const values: MappedModifierValues = {};

    const expr = buildMappedPropExpression("color", values, state, t);

    expect(t.isIdentifier(expr)).toBe(true);
    expect((expr as t.Identifier).name).toBe("undefined");
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Unable to build mapped prop expression for "color"'),
    );

    spy.mockRestore();
  });

  it("includes base value as default in Platform.select", () => {
    const state = makeState();
    const values: MappedModifierValues = {
      base: 20,
      ios: 24,
      android: 32,
    };

    const expr = buildMappedPropExpression("size", values, state, t);

    expect(t.isCallExpression(expr)).toBe(true);
    const objExpr = (expr as t.CallExpression).arguments[0] as t.ObjectExpression;
    const keys = objExpr.properties.filter(t.isObjectProperty).map((p) => (p.key as t.Identifier).name);
    expect(keys).toContain("ios");
    expect(keys).toContain("android");
    expect(keys).toContain("default");
  });

  it("handles directional rtl/ltr modifiers", () => {
    const state = makeState();
    const values: MappedModifierValues = {
      rtl: 10,
      ltr: 20,
    };

    const expr = buildMappedPropExpression("padding", values, state, t);

    // Should produce: _isRTL ? 10 : 20
    expect(t.isConditionalExpression(expr)).toBe(true);
    expect(state.needsI18nManagerImport).toBe(true);

    const cond = expr as t.ConditionalExpression;
    expect(t.isIdentifier(cond.test)).toBe(true);
    expect((cond.test as t.Identifier).name).toBe("_isRTL");
    expect(t.isNumericLiteral(cond.consequent)).toBe(true);
    expect((cond.consequent as t.NumericLiteral).value).toBe(10);
    expect(t.isNumericLiteral(cond.alternate)).toBe(true);
    expect((cond.alternate as t.NumericLiteral).value).toBe(20);
  });

  it("layers color scheme inside Platform.select", () => {
    const state = makeState();
    const values: MappedModifierValues = {
      dark: "#111",
      light: "#fff",
      ios: 24,
    };

    const expr = buildMappedPropExpression("mixed", values, state, t);

    // Outermost: Platform.select
    expect(t.isCallExpression(expr)).toBe(true);
    expect(state.needsColorSchemeImport).toBe(true);
    expect(state.needsPlatformImport).toBe(true);

    // The color scheme conditional should be nested as default in Platform.select
    const objExpr = (expr as t.CallExpression).arguments[0] as t.ObjectExpression;
    const keys = objExpr.properties.filter(t.isObjectProperty).map((p) => (p.key as t.Identifier).name);
    expect(keys).toContain("ios");
    expect(keys).toContain("default");
  });
});
