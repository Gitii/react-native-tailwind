import { beforeEach, describe, expect, it } from "vitest";
import { clearCache, getCacheStats, getCustomColors, setConfig, tw, twStyle } from "./runtime";

describe("runtime", () => {
  beforeEach(() => {
    clearCache();
    setConfig({}); // Reset config
  });

  describe("tw template tag", () => {
    it("should parse static classes", () => {
      const result = tw`m-4 p-2 bg-blue-500`;
      expect(result?.style).toEqual({
        margin: 16,
        padding: 8,
        backgroundColor: "#2b7fff",
      });
      expect(result?.activeStyle).toBeUndefined();
      expect(result?.disabledStyle).toBeUndefined();
    });

    it("should handle interpolated values", () => {
      const isActive = true;
      const result = tw`m-4 ${isActive && "bg-blue-500"}`;
      expect(result?.style).toEqual({
        margin: 16,
        backgroundColor: "#2b7fff",
      });
    });

    it("should handle conditional classes", () => {
      const isLarge = true;
      const result = tw`p-4 ${isLarge ? "text-xl" : "text-sm"}`;
      expect(result?.style).toEqual({
        padding: 16,
        fontSize: 20,
      });
    });

    it("should handle falsy values", () => {
      const result = tw`m-4 ${false} ${null} ${undefined} p-2`;
      expect(result?.style).toEqual({
        margin: 16,
        padding: 8,
      });
    });

    it("should return undefined for empty className", () => {
      const result = tw``;
      expect(result).toBeUndefined();
    });

    it("should normalize whitespace", () => {
      const result = tw`m-4    p-2   bg-blue-500`;
      expect(result?.style).toEqual({
        margin: 16,
        padding: 8,
        backgroundColor: "#2b7fff",
      });
    });
  });

  describe("twStyle function", () => {
    it("should parse className string", () => {
      const result = twStyle("m-4 p-2 bg-blue-500");
      expect(result?.style).toEqual({
        margin: 16,
        padding: 8,
        backgroundColor: "#2b7fff",
      });
      expect(result?.activeStyle).toBeUndefined();
    });

    it("should return undefined for empty string", () => {
      const result = twStyle("");
      expect(result).toBeUndefined();
    });

    it("should normalize whitespace", () => {
      const result = twStyle("m-4    p-2   bg-blue-500");
      expect(result?.style).toEqual({
        margin: 16,
        padding: 8,
        backgroundColor: "#2b7fff",
      });
    });
  });

  describe("setConfig", () => {
    it("should set custom colors", () => {
      setConfig({
        theme: {
          extend: {
            colors: {
              primary: "#007AFF",
              secondary: "#5856D6",
            },
          },
        },
      });

      const colors = getCustomColors();
      expect(colors).toEqual({
        primary: "#007AFF",
        secondary: "#5856D6",
      });
    });

    it("should flatten nested colors", () => {
      setConfig({
        theme: {
          extend: {
            colors: {
              brand: {
                light: "#FF6B6B",
                dark: "#CC0000",
              },
            },
          },
        },
      });

      const colors = getCustomColors();
      expect(colors).toEqual({
        "brand-light": "#FF6B6B",
        "brand-dark": "#CC0000",
      });
    });

    it("should handle mixed flat and nested colors", () => {
      setConfig({
        theme: {
          extend: {
            colors: {
              primary: "#007AFF",
              brand: {
                light: "#FF6B6B",
                dark: "#CC0000",
              },
            },
          },
        },
      });

      const colors = getCustomColors();
      expect(colors).toEqual({
        primary: "#007AFF",
        "brand-light": "#FF6B6B",
        "brand-dark": "#CC0000",
      });
    });

    it("should clear cache when config changes", () => {
      const style = tw`bg-blue-500`;
      expect(style).toBeDefined();
      expect(getCacheStats().size).toBe(1);

      setConfig({
        theme: {
          extend: {
            colors: { primary: "#007AFF" },
          },
        },
      });

      expect(getCacheStats().size).toBe(0);
    });

    it("should use custom colors in parsing", () => {
      setConfig({
        theme: {
          extend: {
            colors: {
              primary: "#007AFF",
            },
          },
        },
      });

      const result = tw`bg-primary`;
      expect(result?.style).toEqual({
        backgroundColor: "#007AFF",
      });
    });
  });

  describe("cache", () => {
    it("should cache parsed styles", () => {
      const result1 = tw`m-4 p-2`;
      const result2 = tw`m-4 p-2`;

      // Should return the same reference (cached)
      expect(result1).toBe(result2);
    });

    it("should track cache stats", () => {
      const style1 = tw`m-4`;
      const style2 = tw`p-2`;
      const style3 = tw`bg-blue-500`;
      expect(style1).toBeDefined();
      expect(style2).toBeDefined();
      expect(style3).toBeDefined();

      const stats = getCacheStats();
      expect(stats.size).toBe(3);
      expect(stats.keys).toContain("m-4");
      expect(stats.keys).toContain("p-2");
      expect(stats.keys).toContain("bg-blue-500");
    });

    it("should clear cache", () => {
      const style1 = tw`m-4`;
      const style2 = tw`p-2`;
      expect(style1).toBeDefined();
      expect(style2).toBeDefined();
      expect(getCacheStats().size).toBe(2);

      clearCache();
      expect(getCacheStats().size).toBe(0);
    });
  });

  describe("state modifiers", () => {
    it("should return activeStyle when active: modifier is used", () => {
      const result = tw`bg-blue-500 active:bg-blue-700`;
      expect(result?.style).toEqual({
        backgroundColor: "#2b7fff",
      });
      expect(result?.activeStyle).toEqual({
        backgroundColor: "#1447e6",
      });
      expect(result?.disabledStyle).toBeUndefined();
    });

    it("should return disabledStyle when disabled: modifier is used", () => {
      const result = tw`bg-blue-500 disabled:bg-gray-300`;
      expect(result?.style).toEqual({
        backgroundColor: "#2b7fff",
      });
      expect(result?.disabledStyle).toEqual({
        backgroundColor: "#d1d5dc",
      });
      expect(result?.activeStyle).toBeUndefined();
    });

    it("should return both activeStyle and disabledStyle when both modifiers are used", () => {
      const result = tw`bg-blue-500 active:bg-blue-700 disabled:bg-gray-300`;
      expect(result?.style).toEqual({
        backgroundColor: "#2b7fff",
      });
      expect(result?.activeStyle).toEqual({
        backgroundColor: "#1447e6",
      });
      expect(result?.disabledStyle).toEqual({
        backgroundColor: "#d1d5dc",
      });
    });

    it("should merge base and active styles with multiple properties", () => {
      const result = tw`p-4 m-2 bg-blue-500 active:bg-blue-700 active:p-6`;
      expect(result?.style).toEqual({
        padding: 16,
        margin: 8,
        backgroundColor: "#2b7fff",
      });
      expect(result?.activeStyle).toEqual({
        backgroundColor: "#1447e6",
        padding: 24,
      });
    });

    it("should handle only modifier classes (no base)", () => {
      const result = tw`active:bg-blue-700`;
      expect(result?.style).toEqual({});
      expect(result?.activeStyle).toEqual({
        backgroundColor: "#1447e6",
      });
    });

    it("should work with twStyle function", () => {
      const result = twStyle("bg-blue-500 active:bg-blue-700");
      expect(result?.style).toEqual({
        backgroundColor: "#2b7fff",
      });
      expect(result?.activeStyle).toEqual({
        backgroundColor: "#1447e6",
      });
    });

    it("should provide raw hex values for animations", () => {
      const result = tw`bg-blue-500 active:bg-blue-700`;
      // Access raw backgroundColor value for use with reanimated
      expect(result?.style.backgroundColor).toBe("#2b7fff");
      expect(result?.activeStyle?.backgroundColor).toBe("#1447e6");
    });

    it("should return focusStyle when focus: modifier is used", () => {
      const result = tw`bg-blue-500 focus:bg-blue-800`;
      expect(result?.style).toEqual({
        backgroundColor: "#2b7fff",
      });
      expect(result?.focusStyle).toEqual({
        backgroundColor: "#193cb8",
      });
      expect(result?.activeStyle).toBeUndefined();
      expect(result?.disabledStyle).toBeUndefined();
    });

    it("should return all three modifier styles when all are used", () => {
      const result = tw`bg-blue-500 active:bg-blue-700 focus:bg-blue-800 disabled:bg-gray-300`;
      expect(result?.style).toEqual({
        backgroundColor: "#2b7fff",
      });
      expect(result?.activeStyle).toEqual({
        backgroundColor: "#1447e6",
      });
      expect(result?.focusStyle).toEqual({
        backgroundColor: "#193cb8",
      });
      expect(result?.disabledStyle).toEqual({
        backgroundColor: "#d1d5dc",
      });
    });
  });
});
