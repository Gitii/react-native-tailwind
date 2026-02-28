import * as t from "@babel/types";
import { describe, expect, it, vi } from "vitest";
import type { ComponentClassToPropRule } from "../plugin/state.js";
import { buildImportMap, getClassToPropRule, normalizeClassToPropRules } from "./componentMatcher.js";

describe("componentMatcher", () => {
  describe("normalizeClassToPropRules", () => {
    it("should pass through valid rules unchanged", () => {
      const rules: ComponentClassToPropRule[] = [
        {
          importFrom: "lucide-react-native",
          components: ["Icon"],
          mapping: { color: "text-*", size: "size-*" },
        },
      ];

      const result = normalizeClassToPropRules(rules);

      expect(result).toEqual([
        {
          importFrom: "lucide-react-native",
          components: ["Icon"],
          mapping: { color: "text-*", size: "size-*" },
        },
      ]);
    });

    it("should return empty array for undefined input", () => {
      const result = normalizeClassToPropRules(undefined);
      expect(result).toEqual([]);
    });

    it("should return empty array for empty array input", () => {
      const result = normalizeClassToPropRules([]);
      expect(result).toEqual([]);
    });

    it("should warn and filter rules with empty importFrom", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const rules: ComponentClassToPropRule[] = [
        { importFrom: "", components: ["Icon"], mapping: { color: "text-*" } },
        { importFrom: "  ", components: ["Icon"], mapping: { color: "text-*" } },
      ];

      const result = normalizeClassToPropRules(rules);

      expect(result).toEqual([]);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("[react-native-tailwind]"));
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("empty importFrom"));

      spy.mockRestore();
    });

    it("should warn and filter rules with missing importFrom", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const rules = [
        { components: ["Icon"], mapping: { color: "text-*" } },
      ] as unknown as ComponentClassToPropRule[];

      const result = normalizeClassToPropRules(rules);

      expect(result).toEqual([]);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("empty importFrom"));

      spy.mockRestore();
    });

    it("should warn and filter rules with empty components array", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const rules: ComponentClassToPropRule[] = [
        { importFrom: "my-lib", components: [], mapping: { color: "text-*" } },
      ];

      const result = normalizeClassToPropRules(rules);

      expect(result).toEqual([]);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("[react-native-tailwind]"));
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("empty components array"));

      spy.mockRestore();
    });

    it("should warn and filter rules with empty mapping object", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const rules: ComponentClassToPropRule[] = [{ importFrom: "my-lib", components: ["Icon"], mapping: {} }];

      const result = normalizeClassToPropRules(rules);

      expect(result).toEqual([]);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("[react-native-tailwind]"));
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("empty mapping object"));

      spy.mockRestore();
    });

    it("should warn and filter mapping patterns without * wildcard", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const rules: ComponentClassToPropRule[] = [
        {
          importFrom: "my-lib",
          components: ["Icon"],
          mapping: { color: "text-red-500" },
        },
      ];

      const result = normalizeClassToPropRules(rules);

      // Rule is filtered out entirely because no valid mappings remain
      expect(result).toEqual([]);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("does not contain '*' wildcard"));

      spy.mockRestore();
    });

    it("should keep valid patterns and filter invalid ones within a rule", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const rules: ComponentClassToPropRule[] = [
        {
          importFrom: "my-lib",
          components: ["Icon"],
          mapping: { color: "text-*", size: "fixed-size" },
        },
      ];

      const result = normalizeClassToPropRules(rules);

      expect(result).toEqual([
        {
          importFrom: "my-lib",
          components: ["Icon"],
          mapping: { color: "text-*" },
        },
      ]);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("does not contain '*' wildcard"));

      spy.mockRestore();
    });

    it("should trim whitespace from importFrom, components, and mapping entries", () => {
      const rules: ComponentClassToPropRule[] = [
        {
          importFrom: "  my-lib  ",
          components: ["  Icon  ", "  Button  "],
          mapping: { "  color  ": "  text-*  " },
        },
      ];

      const result = normalizeClassToPropRules(rules);

      expect(result).toEqual([
        {
          importFrom: "my-lib",
          components: ["Icon", "Button"],
          mapping: { color: "text-*" },
        },
      ]);
    });

    it("should handle multiple rules with mixed validity", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const rules: ComponentClassToPropRule[] = [
        {
          importFrom: "valid-lib",
          components: ["Icon"],
          mapping: { color: "text-*" },
        },
        {
          importFrom: "",
          components: ["Button"],
          mapping: { size: "size-*" },
        },
        {
          importFrom: "other-lib",
          components: ["*"],
          mapping: { opacity: "opacity-*" },
        },
      ];

      const result = normalizeClassToPropRules(rules);

      expect(result).toHaveLength(2);
      expect(result[0].importFrom).toBe("valid-lib");
      expect(result[1].importFrom).toBe("other-lib");

      spy.mockRestore();
    });

    it("should filter blank component names from components array", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const rules: ComponentClassToPropRule[] = [
        {
          importFrom: "my-lib",
          components: ["", "  "],
          mapping: { color: "text-*" },
        },
      ];

      const result = normalizeClassToPropRules(rules);

      // All components are blank → empty components → filtered
      expect(result).toEqual([]);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("empty components array"));

      spy.mockRestore();
    });
  });

  describe("buildImportMap", () => {
    const rules: ComponentClassToPropRule[] = [
      {
        importFrom: "lucide-react-native",
        components: ["Icon"],
        mapping: { color: "text-*" },
      },
    ];

    it("should map named imports to their source", () => {
      // import { Icon } from "lucide-react-native"
      const importDecl = t.importDeclaration(
        [t.importSpecifier(t.identifier("Icon"), t.identifier("Icon"))],
        t.stringLiteral("lucide-react-native"),
      );

      const result = buildImportMap(importDecl, rules, t);

      expect(result).toBeInstanceOf(Map);
      expect(result!.get("Icon")).toBe("lucide-react-native");
      expect(result!.size).toBe(1);
    });

    it("should map aliased imports using the local name", () => {
      // import { Icon as MyIcon } from "lucide-react-native"
      const importDecl = t.importDeclaration(
        [t.importSpecifier(t.identifier("MyIcon"), t.identifier("Icon"))],
        t.stringLiteral("lucide-react-native"),
      );

      const result = buildImportMap(importDecl, rules, t);

      expect(result).toBeInstanceOf(Map);
      expect(result!.get("MyIcon")).toBe("lucide-react-native");
      expect(result!.has("Icon")).toBe(false);
    });

    it("should map namespace imports", () => {
      // import * as Icons from "lucide-react-native"
      const importDecl = t.importDeclaration(
        [t.importNamespaceSpecifier(t.identifier("Icons"))],
        t.stringLiteral("lucide-react-native"),
      );

      const result = buildImportMap(importDecl, rules, t);

      expect(result).toBeInstanceOf(Map);
      expect(result!.get("Icons")).toBe("lucide-react-native");
    });

    it("should map default imports", () => {
      // import Icon from "lucide-react-native"
      const importDecl = t.importDeclaration(
        [t.importDefaultSpecifier(t.identifier("Icon"))],
        t.stringLiteral("lucide-react-native"),
      );

      const result = buildImportMap(importDecl, rules, t);

      expect(result).toBeInstanceOf(Map);
      expect(result!.get("Icon")).toBe("lucide-react-native");
    });

    it("should return null for non-matching import sources", () => {
      // import { Something } from "unrelated-lib"
      const importDecl = t.importDeclaration(
        [t.importSpecifier(t.identifier("Something"), t.identifier("Something"))],
        t.stringLiteral("unrelated-lib"),
      );

      const result = buildImportMap(importDecl, rules, t);

      expect(result).toBeNull();
    });

    it("should return null for type-only imports", () => {
      // import type { Icon } from "lucide-react-native"
      const importDecl = t.importDeclaration(
        [t.importSpecifier(t.identifier("Icon"), t.identifier("Icon"))],
        t.stringLiteral("lucide-react-native"),
      );
      importDecl.importKind = "type";

      const result = buildImportMap(importDecl, rules, t);

      expect(result).toBeNull();
    });

    it("should skip type-only specifiers within a value import", () => {
      // import { type IconType, Icon } from "lucide-react-native"
      const typeSpec = t.importSpecifier(t.identifier("IconType"), t.identifier("IconType"));
      typeSpec.importKind = "type";
      const valueSpec = t.importSpecifier(t.identifier("Icon"), t.identifier("Icon"));

      const importDecl = t.importDeclaration([typeSpec, valueSpec], t.stringLiteral("lucide-react-native"));

      const result = buildImportMap(importDecl, rules, t);

      expect(result).toBeInstanceOf(Map);
      expect(result!.size).toBe(1);
      expect(result!.get("Icon")).toBe("lucide-react-native");
      expect(result!.has("IconType")).toBe(false);
    });

    it("should handle multiple specifiers from the same source", () => {
      // import { Icon, ArrowLeft, ChevronRight } from "lucide-react-native"
      const importDecl = t.importDeclaration(
        [
          t.importSpecifier(t.identifier("Icon"), t.identifier("Icon")),
          t.importSpecifier(t.identifier("ArrowLeft"), t.identifier("ArrowLeft")),
          t.importSpecifier(t.identifier("ChevronRight"), t.identifier("ChevronRight")),
        ],
        t.stringLiteral("lucide-react-native"),
      );

      const result = buildImportMap(importDecl, rules, t);

      expect(result).toBeInstanceOf(Map);
      expect(result!.size).toBe(3);
      expect(result!.get("Icon")).toBe("lucide-react-native");
      expect(result!.get("ArrowLeft")).toBe("lucide-react-native");
      expect(result!.get("ChevronRight")).toBe("lucide-react-native");
    });

    it("should handle mixed default and named imports", () => {
      // import Icon, { ArrowLeft } from "lucide-react-native"
      const importDecl = t.importDeclaration(
        [
          t.importDefaultSpecifier(t.identifier("Icon")),
          t.importSpecifier(t.identifier("ArrowLeft"), t.identifier("ArrowLeft")),
        ],
        t.stringLiteral("lucide-react-native"),
      );

      const result = buildImportMap(importDecl, rules, t);

      expect(result).toBeInstanceOf(Map);
      expect(result!.size).toBe(2);
      expect(result!.get("Icon")).toBe("lucide-react-native");
      expect(result!.get("ArrowLeft")).toBe("lucide-react-native");
    });
  });

  describe("getClassToPropRule", () => {
    const rules: ComponentClassToPropRule[] = [
      {
        importFrom: "lucide-react-native",
        components: ["Icon", "ArrowLeft"],
        mapping: { color: "text-*" },
      },
      {
        importFrom: "other-lib",
        components: ["*"],
        mapping: { size: "size-*" },
      },
    ];

    // importMap: Map<source, Set<localNames>>
    const importMap = new Map<string, Set<string>>([
      ["lucide-react-native", new Set(["Icon", "ArrowLeft"])],
      ["other-lib", new Set(["Widget", "Button"])],
    ]);

    it("should return matching rule for exact component name", () => {
      const element = t.jsxOpeningElement(t.jsxIdentifier("Icon"), [], false);

      const result = getClassToPropRule(element, importMap, rules, t);

      expect(result).not.toBeNull();
      expect(result!.importFrom).toBe("lucide-react-native");
      expect(result!.mapping).toEqual({ color: "text-*" });
    });

    it("should return matching rule for another exact component in the same rule", () => {
      const element = t.jsxOpeningElement(t.jsxIdentifier("ArrowLeft"), [], false);

      const result = getClassToPropRule(element, importMap, rules, t);

      expect(result).not.toBeNull();
      expect(result!.importFrom).toBe("lucide-react-native");
    });

    it("should return matching rule for wildcard ['*'] components", () => {
      const element = t.jsxOpeningElement(t.jsxIdentifier("Widget"), [], false);

      const result = getClassToPropRule(element, importMap, rules, t);

      expect(result).not.toBeNull();
      expect(result!.importFrom).toBe("other-lib");
      expect(result!.components).toContain("*");
    });

    it("should return null for non-imported component", () => {
      const element = t.jsxOpeningElement(t.jsxIdentifier("UnknownComponent"), [], false);

      const result = getClassToPropRule(element, importMap, rules, t);

      expect(result).toBeNull();
    });

    it("should return null for imported component not in rule components list", () => {
      // Component imported from lucide but not in rule's components array
      const localMap = new Map<string, Set<string>>([["lucide-react-native", new Set(["ChevronRight"])]]);

      const element = t.jsxOpeningElement(t.jsxIdentifier("ChevronRight"), [], false);

      const result = getClassToPropRule(element, localMap, rules, t);

      expect(result).toBeNull();
    });

    it("should match member expression <Icons.Home> via namespace import", () => {
      const namespaceMap = new Map<string, Set<string>>([["lucide-react-native", new Set(["Icons"])]]);

      // <Icons.Home />
      const element = t.jsxOpeningElement(
        t.jsxMemberExpression(t.jsxIdentifier("Icons"), t.jsxIdentifier("Home")),
        [],
        false,
      );

      // "*" wildcard not set for lucide rule, and "Home" is not in components
      const result = getClassToPropRule(element, namespaceMap, rules, t);

      // Home is not in lucide-react-native components ["Icon", "ArrowLeft"]
      expect(result).toBeNull();
    });

    it("should match member expression when component is in rule", () => {
      const namespaceMap = new Map<string, Set<string>>([["lucide-react-native", new Set(["Icons"])]]);

      // <Icons.Icon />
      const element = t.jsxOpeningElement(
        t.jsxMemberExpression(t.jsxIdentifier("Icons"), t.jsxIdentifier("Icon")),
        [],
        false,
      );

      const result = getClassToPropRule(element, namespaceMap, rules, t);

      expect(result).not.toBeNull();
      expect(result!.importFrom).toBe("lucide-react-native");
    });

    it("should match member expression with wildcard rule", () => {
      const namespaceMap = new Map<string, Set<string>>([["other-lib", new Set(["UI"])]]);

      // <UI.AnyComponent />
      const element = t.jsxOpeningElement(
        t.jsxMemberExpression(t.jsxIdentifier("UI"), t.jsxIdentifier("AnyComponent")),
        [],
        false,
      );

      const result = getClassToPropRule(element, namespaceMap, rules, t);

      expect(result).not.toBeNull();
      expect(result!.importFrom).toBe("other-lib");
      expect(result!.components).toContain("*");
    });

    it("should return null for empty import map", () => {
      const emptyMap = new Map<string, Set<string>>();
      const element = t.jsxOpeningElement(t.jsxIdentifier("Icon"), [], false);

      const result = getClassToPropRule(element, emptyMap, rules, t);

      expect(result).toBeNull();
    });

    it("should return null for member expression with non-imported namespace", () => {
      // <Unknown.Icon />
      const element = t.jsxOpeningElement(
        t.jsxMemberExpression(t.jsxIdentifier("Unknown"), t.jsxIdentifier("Icon")),
        [],
        false,
      );

      const result = getClassToPropRule(element, importMap, rules, t);

      expect(result).toBeNull();
    });
  });
});
