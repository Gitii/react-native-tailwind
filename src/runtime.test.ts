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
      expect(result).toEqual({
        margin: 16,
        padding: 8,
        backgroundColor: "#2b7fff",
      });
    });

    it("should handle interpolated values", () => {
      const isActive = true;
      const result = tw`m-4 ${isActive && "bg-blue-500"}`;
      expect(result).toEqual({
        margin: 16,
        backgroundColor: "#2b7fff",
      });
    });

    it("should handle conditional classes", () => {
      const isLarge = true;
      const result = tw`p-4 ${isLarge ? "text-xl" : "text-sm"}`;
      expect(result).toEqual({
        padding: 16,
        fontSize: 20,
      });
    });

    it("should handle falsy values", () => {
      const result = tw`m-4 ${false} ${null} ${undefined} p-2`;
      expect(result).toEqual({
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
      expect(result).toEqual({
        margin: 16,
        padding: 8,
        backgroundColor: "#2b7fff",
      });
    });
  });

  describe("twStyle function", () => {
    it("should parse className string", () => {
      const result = twStyle("m-4 p-2 bg-blue-500");
      expect(result).toEqual({
        margin: 16,
        padding: 8,
        backgroundColor: "#2b7fff",
      });
    });

    it("should return undefined for empty string", () => {
      const result = twStyle("");
      expect(result).toBeUndefined();
    });

    it("should normalize whitespace", () => {
      const result = twStyle("m-4    p-2   bg-blue-500");
      expect(result).toEqual({
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
      expect(result).toEqual({
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
});
