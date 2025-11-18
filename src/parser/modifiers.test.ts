import { describe, expect, it } from "vitest";
import type { ModifierType, ParsedModifier } from "./modifiers";
import { hasModifier, parseModifier, splitModifierClasses } from "./modifiers";

describe("parseModifier - basic functionality", () => {
  it("should parse active modifier", () => {
    const result = parseModifier("active:bg-blue-500");
    expect(result).toEqual({
      modifier: "active",
      baseClass: "bg-blue-500",
    });
  });

  it("should parse hover modifier", () => {
    const result = parseModifier("hover:text-red-500");
    expect(result).toEqual({
      modifier: "hover",
      baseClass: "text-red-500",
    });
  });

  it("should parse focus modifier", () => {
    const result = parseModifier("focus:border-green-500");
    expect(result).toEqual({
      modifier: "focus",
      baseClass: "border-green-500",
    });
  });

  it("should parse disabled modifier", () => {
    const result = parseModifier("disabled:bg-gray-400");
    expect(result).toEqual({
      modifier: "disabled",
      baseClass: "bg-gray-400",
    });
  });

  it("should return null for class without modifier", () => {
    expect(parseModifier("bg-blue-500")).toBeNull();
    expect(parseModifier("text-red-500")).toBeNull();
    expect(parseModifier("p-4")).toBeNull();
  });
});

describe("parseModifier - various base classes", () => {
  it("should parse modifiers with spacing classes", () => {
    expect(parseModifier("active:m-4")).toEqual({
      modifier: "active",
      baseClass: "m-4",
    });
    expect(parseModifier("hover:p-8")).toEqual({
      modifier: "hover",
      baseClass: "p-8",
    });
  });

  it("should parse modifiers with layout classes", () => {
    expect(parseModifier("active:flex")).toEqual({
      modifier: "active",
      baseClass: "flex",
    });
    expect(parseModifier("focus:absolute")).toEqual({
      modifier: "focus",
      baseClass: "absolute",
    });
  });

  it("should parse modifiers with typography classes", () => {
    expect(parseModifier("hover:text-lg")).toEqual({
      modifier: "hover",
      baseClass: "text-lg",
    });
    expect(parseModifier("active:font-bold")).toEqual({
      modifier: "active",
      baseClass: "font-bold",
    });
  });

  it("should parse modifiers with arbitrary values", () => {
    expect(parseModifier("active:bg-[#ff0000]")).toEqual({
      modifier: "active",
      baseClass: "bg-[#ff0000]",
    });
    expect(parseModifier("hover:w-[100px]")).toEqual({
      modifier: "hover",
      baseClass: "w-[100px]",
    });
  });

  it("should parse modifiers with complex class names", () => {
    expect(parseModifier("active:inset-x-4")).toEqual({
      modifier: "active",
      baseClass: "inset-x-4",
    });
    expect(parseModifier("focus:border-blue-500")).toEqual({
      modifier: "focus",
      baseClass: "border-blue-500",
    });
  });
});

describe("parseModifier - edge cases", () => {
  it("should return null for unsupported modifiers", () => {
    expect(parseModifier("selected:bg-blue-500")).toBeNull();
    expect(parseModifier("pressed:bg-red-500")).toBeNull();
    expect(parseModifier("custom:bg-green-500")).toBeNull();
    expect(parseModifier("unknown:bg-gray-500")).toBeNull();
  });

  it("should return null for nested modifiers", () => {
    expect(parseModifier("active:hover:bg-blue-500")).toBeNull();
    expect(parseModifier("hover:focus:text-red-500")).toBeNull();
    expect(parseModifier("focus:active:p-4")).toBeNull();
  });

  it("should return null for empty base class", () => {
    expect(parseModifier("active:")).toBeNull();
    expect(parseModifier("hover:")).toBeNull();
    expect(parseModifier("focus:")).toBeNull();
  });

  it("should return null for empty modifier", () => {
    expect(parseModifier(":bg-blue-500")).toBeNull();
    expect(parseModifier(":")).toBeNull();
  });

  it("should return null for class with only colon", () => {
    expect(parseModifier(":")).toBeNull();
  });

  it("should return null for class with multiple colons but no modifier", () => {
    expect(parseModifier("bg:blue:500")).toBeNull();
  });

  it("should handle base classes that look like they have colons", () => {
    // Base class contains colon - should be rejected as nested modifier
    expect(parseModifier("active:some:thing")).toBeNull();
  });

  it("should return null for empty string", () => {
    expect(parseModifier("")).toBeNull();
  });
});

describe("parseModifier - case sensitivity", () => {
  it("should be case-sensitive for modifiers", () => {
    expect(parseModifier("Active:bg-blue-500")).toBeNull();
    expect(parseModifier("ACTIVE:bg-blue-500")).toBeNull();
    expect(parseModifier("Hover:text-red-500")).toBeNull();
    expect(parseModifier("FOCUS:border-green-500")).toBeNull();
  });

  it("should preserve case in base class", () => {
    const result = parseModifier("active:bg-Blue-500");
    expect(result).toEqual({
      modifier: "active",
      baseClass: "bg-Blue-500",
    });
  });
});

describe("hasModifier", () => {
  it("should return true for classes with modifiers", () => {
    expect(hasModifier("active:bg-blue-500")).toBe(true);
    expect(hasModifier("hover:text-red-500")).toBe(true);
    expect(hasModifier("focus:border-green-500")).toBe(true);
    expect(hasModifier("disabled:bg-gray-400")).toBe(true);
  });

  it("should return false for classes without modifiers", () => {
    expect(hasModifier("bg-blue-500")).toBe(false);
    expect(hasModifier("text-red-500")).toBe(false);
    expect(hasModifier("p-4")).toBe(false);
  });

  it("should return false for unsupported modifiers", () => {
    expect(hasModifier("selected:bg-gray-500")).toBe(false);
    expect(hasModifier("pressed:bg-blue-500")).toBe(false);
  });

  it("should return false for nested modifiers", () => {
    expect(hasModifier("active:hover:bg-blue-500")).toBe(false);
  });

  it("should return false for empty base class", () => {
    expect(hasModifier("active:")).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(hasModifier("")).toBe(false);
  });
});

describe("splitModifierClasses - basic functionality", () => {
  it("should split classes with and without modifiers", () => {
    const result = splitModifierClasses("bg-blue-500 active:bg-blue-700");
    expect(result).toEqual({
      baseClasses: ["bg-blue-500"],
      modifierClasses: [{ modifier: "active", baseClass: "bg-blue-700" }],
    });
  });

  it("should handle multiple base classes", () => {
    const result = splitModifierClasses("bg-blue-500 p-4 m-2 text-white");
    expect(result).toEqual({
      baseClasses: ["bg-blue-500", "p-4", "m-2", "text-white"],
      modifierClasses: [],
    });
  });

  it("should handle multiple modifier classes", () => {
    const result = splitModifierClasses("active:bg-blue-700 hover:bg-blue-800 focus:bg-blue-900");
    expect(result).toEqual({
      baseClasses: [],
      modifierClasses: [
        { modifier: "active", baseClass: "bg-blue-700" },
        { modifier: "hover", baseClass: "bg-blue-800" },
        { modifier: "focus", baseClass: "bg-blue-900" },
      ],
    });
  });

  it("should handle mixed base and modifier classes", () => {
    const result = splitModifierClasses("bg-blue-500 active:bg-blue-700 p-4 active:p-6");
    expect(result).toEqual({
      baseClasses: ["bg-blue-500", "p-4"],
      modifierClasses: [
        { modifier: "active", baseClass: "bg-blue-700" },
        { modifier: "active", baseClass: "p-6" },
      ],
    });
  });
});

describe("splitModifierClasses - whitespace handling", () => {
  it("should handle leading whitespace", () => {
    const result = splitModifierClasses("  bg-blue-500 active:bg-blue-700");
    expect(result).toEqual({
      baseClasses: ["bg-blue-500"],
      modifierClasses: [{ modifier: "active", baseClass: "bg-blue-700" }],
    });
  });

  it("should handle trailing whitespace", () => {
    const result = splitModifierClasses("bg-blue-500 active:bg-blue-700  ");
    expect(result).toEqual({
      baseClasses: ["bg-blue-500"],
      modifierClasses: [{ modifier: "active", baseClass: "bg-blue-700" }],
    });
  });

  it("should handle multiple spaces between classes", () => {
    const result = splitModifierClasses("bg-blue-500    active:bg-blue-700");
    expect(result).toEqual({
      baseClasses: ["bg-blue-500"],
      modifierClasses: [{ modifier: "active", baseClass: "bg-blue-700" }],
    });
  });

  it("should handle tabs and newlines", () => {
    const result = splitModifierClasses("bg-blue-500\tactive:bg-blue-700\np-4");
    expect(result).toEqual({
      baseClasses: ["bg-blue-500", "p-4"],
      modifierClasses: [{ modifier: "active", baseClass: "bg-blue-700" }],
    });
  });

  it("should handle empty string", () => {
    const result = splitModifierClasses("");
    expect(result).toEqual({
      baseClasses: [],
      modifierClasses: [],
    });
  });

  it("should handle whitespace-only string", () => {
    const result = splitModifierClasses("   ");
    expect(result).toEqual({
      baseClasses: [],
      modifierClasses: [],
    });
  });
});

describe("splitModifierClasses - complex scenarios", () => {
  it("should handle duplicate modifiers for same property", () => {
    const result = splitModifierClasses("active:bg-blue-700 active:bg-red-700");
    expect(result).toEqual({
      baseClasses: [],
      modifierClasses: [
        { modifier: "active", baseClass: "bg-blue-700" },
        { modifier: "active", baseClass: "bg-red-700" },
      ],
    });
  });

  it("should handle all four modifier types", () => {
    const result = splitModifierClasses(
      "bg-gray-500 active:bg-blue-700 hover:bg-green-700 focus:bg-red-700 disabled:bg-gray-400",
    );
    expect(result).toEqual({
      baseClasses: ["bg-gray-500"],
      modifierClasses: [
        { modifier: "active", baseClass: "bg-blue-700" },
        { modifier: "hover", baseClass: "bg-green-700" },
        { modifier: "focus", baseClass: "bg-red-700" },
        { modifier: "disabled", baseClass: "bg-gray-400" },
      ],
    });
  });

  it("should ignore unsupported modifiers in the base classes", () => {
    const result = splitModifierClasses("bg-blue-500 pressed:bg-gray-500 active:bg-blue-700");
    expect(result).toEqual({
      baseClasses: ["bg-blue-500", "pressed:bg-gray-500"],
      modifierClasses: [{ modifier: "active", baseClass: "bg-blue-700" }],
    });
  });

  it("should handle modifiers with arbitrary values", () => {
    const result = splitModifierClasses("bg-blue-500 active:bg-[#ff0000] hover:w-[200px]");
    expect(result).toEqual({
      baseClasses: ["bg-blue-500"],
      modifierClasses: [
        { modifier: "active", baseClass: "bg-[#ff0000]" },
        { modifier: "hover", baseClass: "w-[200px]" },
      ],
    });
  });

  it("should handle real-world className example", () => {
    const result = splitModifierClasses(
      "flex items-center justify-center bg-blue-500 p-4 active:bg-blue-700 active:scale-95 hover:bg-blue-600",
    );
    expect(result).toEqual({
      baseClasses: ["flex", "items-center", "justify-center", "bg-blue-500", "p-4"],
      modifierClasses: [
        { modifier: "active", baseClass: "bg-blue-700" },
        { modifier: "active", baseClass: "scale-95" },
        { modifier: "hover", baseClass: "bg-blue-600" },
      ],
    });
  });
});

describe("splitModifierClasses - nested modifiers", () => {
  it("should ignore nested modifiers", () => {
    const result = splitModifierClasses("bg-blue-500 active:hover:bg-red-500");
    expect(result).toEqual({
      baseClasses: ["bg-blue-500", "active:hover:bg-red-500"],
      modifierClasses: [],
    });
  });
});

describe("type safety", () => {
  it("should properly type modifier types", () => {
    const result = parseModifier("active:bg-blue-500");
    if (result) {
      const modifier: ModifierType = result.modifier;
      expect(["active", "hover", "focus", "disabled"]).toContain(modifier);
    }
  });

  it("should properly type ParsedModifier", () => {
    const result = parseModifier("hover:text-red-500");
    if (result) {
      const parsed: ParsedModifier = result;
      expect(parsed).toHaveProperty("modifier");
      expect(parsed).toHaveProperty("baseClass");
      expect(typeof parsed.modifier).toBe("string");
      expect(typeof parsed.baseClass).toBe("string");
    }
  });
});
