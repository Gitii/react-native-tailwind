import { setPlatform } from "test/mocks/react-native";
import { beforeEach, describe, expect, it } from "vitest";
import { SHADOW_SCALE, parseShadow, rebuildShadowScale } from "./shadows";

// Reset to iOS before each test
beforeEach(() => {
  setPlatform("ios");
  rebuildShadowScale();
});

describe("SHADOW_SCALE", () => {
  it("should export complete shadow scale", () => {
    expect(SHADOW_SCALE).toMatchSnapshot();
  });

  it("should have all shadow variants", () => {
    expect(SHADOW_SCALE).toHaveProperty("shadow-sm");
    expect(SHADOW_SCALE).toHaveProperty("shadow");
    expect(SHADOW_SCALE).toHaveProperty("shadow-md");
    expect(SHADOW_SCALE).toHaveProperty("shadow-lg");
    expect(SHADOW_SCALE).toHaveProperty("shadow-xl");
    expect(SHADOW_SCALE).toHaveProperty("shadow-2xl");
    expect(SHADOW_SCALE).toHaveProperty("shadow-none");
  });
});

describe("parseShadow - basic shadows", () => {
  it("should parse shadow-sm", () => {
    const result = parseShadow("shadow-sm");
    expect(result).toBeTruthy();
    expect(result).toHaveProperty("shadowColor");
    expect(result).toHaveProperty("shadowOffset");
    expect(result).toHaveProperty("shadowOpacity");
    expect(result).toHaveProperty("shadowRadius");
  });

  it("should parse default shadow", () => {
    const result = parseShadow("shadow");
    expect(result).toBeTruthy();
  });

  it("should parse shadow-md", () => {
    const result = parseShadow("shadow-md");
    expect(result).toBeTruthy();
  });

  it("should parse shadow-lg", () => {
    const result = parseShadow("shadow-lg");
    expect(result).toBeTruthy();
  });

  it("should parse shadow-xl", () => {
    const result = parseShadow("shadow-xl");
    expect(result).toBeTruthy();
  });

  it("should parse shadow-2xl", () => {
    const result = parseShadow("shadow-2xl");
    expect(result).toBeTruthy();
  });

  it("should parse shadow-none", () => {
    const result = parseShadow("shadow-none");
    expect(result).toBeTruthy();
    expect(result).toMatchObject({
      shadowColor: "transparent",
      shadowOpacity: 0,
      shadowRadius: 0,
    });
  });
});

describe("parseShadow - shadow properties (iOS)", () => {
  beforeEach(() => {
    setPlatform("ios");
  });

  it("should have increasing shadow values for larger shadows", () => {
    const sm = parseShadow("shadow-sm");
    const md = parseShadow("shadow-md");
    const lg = parseShadow("shadow-lg");
    const xl = parseShadow("shadow-xl");
    const xxl = parseShadow("shadow-2xl");

    // Shadow opacity should increase
    expect(md?.shadowOpacity).toBeGreaterThan(sm?.shadowOpacity as number);
    expect(lg?.shadowOpacity).toBeGreaterThan(md?.shadowOpacity as number);

    // Shadow radius should increase
    expect(md?.shadowRadius).toBeGreaterThan(sm?.shadowRadius as number);
    expect(lg?.shadowRadius).toBeGreaterThan(md?.shadowRadius as number);
    expect(xl?.shadowRadius).toBeGreaterThan(lg?.shadowRadius as number);
    expect(xxl?.shadowRadius).toBeGreaterThan(xl?.shadowRadius as number);
  });

  it("should use consistent shadow color", () => {
    const shadows = ["shadow-sm", "shadow", "shadow-md", "shadow-lg", "shadow-xl", "shadow-2xl"];

    shadows.forEach((shadow) => {
      const result = parseShadow(shadow);
      expect(result?.shadowColor).toBe("#000000");
    });
  });

  it("should have proper shadowOffset structure", () => {
    const result = parseShadow("shadow");
    expect(result?.shadowOffset).toHaveProperty("width");
    expect(result?.shadowOffset).toHaveProperty("height");
    expect(typeof result?.shadowOffset?.width).toBe("number");
    expect(typeof result?.shadowOffset?.height).toBe("number");
  });

  it("should not have elevation property on iOS", () => {
    const result = parseShadow("shadow");
    expect(result).not.toHaveProperty("elevation");
  });
});

describe("parseShadow - shadow properties (Android)", () => {
  beforeEach(() => {
    setPlatform("android");
    rebuildShadowScale();
  });

  it("should have increasing elevation values for larger shadows", () => {
    const sm = parseShadow("shadow-sm");
    const md = parseShadow("shadow-md");
    const lg = parseShadow("shadow-lg");
    const xl = parseShadow("shadow-xl");
    const xxl = parseShadow("shadow-2xl");

    // Elevation should increase
    expect(md?.elevation).toBeGreaterThan(sm?.elevation as number);
    expect(lg?.elevation).toBeGreaterThan(md?.elevation as number);
    expect(xl?.elevation).toBeGreaterThan(lg?.elevation as number);
    expect(xxl?.elevation).toBeGreaterThan(xl?.elevation as number);
  });

  it("should not have shadow properties on Android", () => {
    const result = parseShadow("shadow");
    expect(result).not.toHaveProperty("shadowColor");
    expect(result).not.toHaveProperty("shadowOffset");
    expect(result).not.toHaveProperty("shadowOpacity");
    expect(result).not.toHaveProperty("shadowRadius");
  });
});

describe("parseShadow - invalid classes", () => {
  it("should return null for invalid shadow classes", () => {
    expect(parseShadow("shadow-invalid")).toBeNull();
    expect(parseShadow("shadows")).toBeNull();
    expect(parseShadow("shadow-")).toBeNull();
    expect(parseShadow("shadow-small")).toBeNull();
    expect(parseShadow("shadow-3xl")).toBeNull();
  });

  it("should return null for non-shadow classes", () => {
    expect(parseShadow("bg-blue-500")).toBeNull();
    expect(parseShadow("p-4")).toBeNull();
    expect(parseShadow("text-white")).toBeNull();
    expect(parseShadow("border-2")).toBeNull();
  });

  it("should return null for empty or invalid input", () => {
    expect(parseShadow("")).toBeNull();
    expect(parseShadow("shadow123")).toBeNull();
  });
});

describe("parseShadow - comprehensive coverage", () => {
  it("should parse all shadow variants without errors", () => {
    const variants = [
      "shadow-sm",
      "shadow",
      "shadow-md",
      "shadow-lg",
      "shadow-xl",
      "shadow-2xl",
      "shadow-none",
    ];

    variants.forEach((variant) => {
      const result = parseShadow(variant);
      expect(result).toBeTruthy();
      expect(typeof result).toBe("object");
    });
  });

  it("should return consistent results for same input", () => {
    const result1 = parseShadow("shadow-md");
    const result2 = parseShadow("shadow-md");
    expect(result1).toEqual(result2);
  });

  it("should handle case-sensitive class names", () => {
    // Shadow classes are case-sensitive
    expect(parseShadow("SHADOW")).toBeNull();
    expect(parseShadow("Shadow-md")).toBeNull();
    expect(parseShadow("shadow-MD")).toBeNull();
  });
});
