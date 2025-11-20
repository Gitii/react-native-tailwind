import { describe, expect, it } from "vitest";
import { COLORS, parseColor } from "./colors";

// Helper to apply opacity to hex color for testing
function applyOpacity(hex: string, opacity: number): string {
  if (hex === "transparent") return "transparent";
  const cleanHex = hex.replace(/^#/, "");
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split("")
          .map((char) => char + char)
          .join("")
      : cleanHex;
  const alpha = Math.round((opacity / 100) * 255);
  const alphaHex = alpha.toString(16).padStart(2, "0").toUpperCase();
  return `#${fullHex.toUpperCase()}${alphaHex}`;
}

describe("COLORS", () => {
  it("should export complete color palette", () => {
    expect(COLORS).toMatchSnapshot();
  });
});

describe("parseColor - background colors", () => {
  it("should parse background colors with preset values", () => {
    expect(parseColor("bg-blue-500")).toEqual({ backgroundColor: COLORS["blue-500"] });
    expect(parseColor("bg-red-500")).toEqual({ backgroundColor: COLORS["red-500"] });
    expect(parseColor("bg-green-500")).toEqual({ backgroundColor: COLORS["green-500"] });
    expect(parseColor("bg-gray-300")).toEqual({ backgroundColor: COLORS["gray-300"] });
  });

  it("should parse background colors with basic values", () => {
    expect(parseColor("bg-white")).toEqual({ backgroundColor: "#FFFFFF" });
    expect(parseColor("bg-black")).toEqual({ backgroundColor: "#000000" });
    expect(parseColor("bg-transparent")).toEqual({ backgroundColor: "transparent" });
  });

  it("should parse background colors with arbitrary 6-digit hex values", () => {
    expect(parseColor("bg-[#ff0000]")).toEqual({ backgroundColor: "#ff0000" });
    expect(parseColor("bg-[#3B82F6]")).toEqual({ backgroundColor: "#3B82F6" });
    expect(parseColor("bg-[#000000]")).toEqual({ backgroundColor: "#000000" });
    expect(parseColor("bg-[#FFFFFF]")).toEqual({ backgroundColor: "#FFFFFF" });
  });

  it("should parse background colors with arbitrary 3-digit hex values", () => {
    expect(parseColor("bg-[#f00]")).toEqual({ backgroundColor: "#ff0000" });
    expect(parseColor("bg-[#abc]")).toEqual({ backgroundColor: "#aabbcc" });
    expect(parseColor("bg-[#123]")).toEqual({ backgroundColor: "#112233" });
    expect(parseColor("bg-[#FFF]")).toEqual({ backgroundColor: "#FFFFFF" });
  });

  it("should parse background colors with arbitrary 8-digit hex values (with alpha)", () => {
    expect(parseColor("bg-[#ff0000aa]")).toEqual({ backgroundColor: "#ff0000aa" });
    expect(parseColor("bg-[#3B82F680]")).toEqual({ backgroundColor: "#3B82F680" });
    expect(parseColor("bg-[#00000000]")).toEqual({ backgroundColor: "#00000000" });
    expect(parseColor("bg-[#FFFFFFFF]")).toEqual({ backgroundColor: "#FFFFFFFF" });
  });

  it("should handle case-insensitive hex values", () => {
    expect(parseColor("bg-[#FF0000]")).toEqual({ backgroundColor: "#FF0000" });
    expect(parseColor("bg-[#ff0000]")).toEqual({ backgroundColor: "#ff0000" });
    expect(parseColor("bg-[#Ff0000]")).toEqual({ backgroundColor: "#Ff0000" });
  });

  it("should prefer arbitrary values over preset colors", () => {
    // If someone creates a custom color named "[#ff0000]", the arbitrary value should take precedence
    const customColors = { "[#ff0000]": "#00ff00" };
    expect(parseColor("bg-[#ff0000]", customColors)).toEqual({ backgroundColor: "#ff0000" });
  });
});

describe("parseColor - text colors", () => {
  it("should parse text colors with preset values", () => {
    expect(parseColor("text-blue-500")).toEqual({ color: COLORS["blue-500"] });
    expect(parseColor("text-red-500")).toEqual({ color: COLORS["red-500"] });
    expect(parseColor("text-green-500")).toEqual({ color: COLORS["green-500"] });
    expect(parseColor("text-gray-700")).toEqual({ color: COLORS["gray-700"] });
  });

  it("should parse text colors with basic values", () => {
    expect(parseColor("text-white")).toEqual({ color: "#FFFFFF" });
    expect(parseColor("text-black")).toEqual({ color: "#000000" });
  });

  it("should parse text colors with arbitrary 6-digit hex values", () => {
    expect(parseColor("text-[#ff0000]")).toEqual({ color: "#ff0000" });
    expect(parseColor("text-[#3B82F6]")).toEqual({ color: "#3B82F6" });
    expect(parseColor("text-[#333333]")).toEqual({ color: "#333333" });
  });

  it("should parse text colors with arbitrary 3-digit hex values", () => {
    expect(parseColor("text-[#f00]")).toEqual({ color: "#ff0000" });
    expect(parseColor("text-[#abc]")).toEqual({ color: "#aabbcc" });
    expect(parseColor("text-[#000]")).toEqual({ color: "#000000" });
  });

  it("should parse text colors with arbitrary 8-digit hex values (with alpha)", () => {
    expect(parseColor("text-[#ff0000aa]")).toEqual({ color: "#ff0000aa" });
    expect(parseColor("text-[#00000080]")).toEqual({ color: "#00000080" });
  });
});

describe("parseColor - border colors", () => {
  it("should parse border colors with preset values", () => {
    expect(parseColor("border-blue-500")).toEqual({ borderColor: COLORS["blue-500"] });
    expect(parseColor("border-red-500")).toEqual({ borderColor: COLORS["red-500"] });
    expect(parseColor("border-green-500")).toEqual({ borderColor: COLORS["green-500"] });
    expect(parseColor("border-gray-200")).toEqual({ borderColor: COLORS["gray-200"] });
  });

  it("should parse border colors with basic values", () => {
    expect(parseColor("border-white")).toEqual({ borderColor: "#FFFFFF" });
    expect(parseColor("border-black")).toEqual({ borderColor: "#000000" });
    expect(parseColor("border-transparent")).toEqual({ borderColor: "transparent" });
  });

  it("should parse border colors with arbitrary 6-digit hex values", () => {
    expect(parseColor("border-[#ff0000]")).toEqual({ borderColor: "#ff0000" });
    expect(parseColor("border-[#3B82F6]")).toEqual({ borderColor: "#3B82F6" });
    expect(parseColor("border-[#cccccc]")).toEqual({ borderColor: "#cccccc" });
  });

  it("should parse border colors with arbitrary 3-digit hex values", () => {
    expect(parseColor("border-[#f00]")).toEqual({ borderColor: "#ff0000" });
    expect(parseColor("border-[#abc]")).toEqual({ borderColor: "#aabbcc" });
    expect(parseColor("border-[#999]")).toEqual({ borderColor: "#999999" });
  });

  it("should parse border colors with arbitrary 8-digit hex values (with alpha)", () => {
    expect(parseColor("border-[#ff0000aa]")).toEqual({ borderColor: "#ff0000aa" });
    expect(parseColor("border-[#0000FF50]")).toEqual({ borderColor: "#0000FF50" });
  });

  it("should not match border width classes", () => {
    expect(parseColor("border-0")).toBeNull();
    expect(parseColor("border-2")).toBeNull();
    expect(parseColor("border-4")).toBeNull();
  });
});

describe("parseColor - custom colors", () => {
  const customColors = {
    "brand-primary": "#FF6B6B",
    "brand-secondary": "#4ECDC4",
    accent: "#FFE66D",
  };

  it("should support custom background colors", () => {
    expect(parseColor("bg-brand-primary", customColors)).toEqual({ backgroundColor: "#FF6B6B" });
    expect(parseColor("bg-brand-secondary", customColors)).toEqual({ backgroundColor: "#4ECDC4" });
    expect(parseColor("bg-accent", customColors)).toEqual({ backgroundColor: "#FFE66D" });
  });

  it("should support custom text colors", () => {
    expect(parseColor("text-brand-primary", customColors)).toEqual({ color: "#FF6B6B" });
    expect(parseColor("text-brand-secondary", customColors)).toEqual({ color: "#4ECDC4" });
  });

  it("should support custom border colors", () => {
    expect(parseColor("border-brand-primary", customColors)).toEqual({ borderColor: "#FF6B6B" });
    expect(parseColor("border-accent", customColors)).toEqual({ borderColor: "#FFE66D" });
  });

  it("should allow custom colors to override preset colors", () => {
    const overrideColors = { "blue-500": "#FF0000" };
    expect(parseColor("bg-blue-500", overrideColors)).toEqual({ backgroundColor: "#FF0000" });
  });

  it("should support custom colors with DEFAULT key from tailwind.config", () => {
    // Simulates what flattenColors() produces from:
    // { primary: { DEFAULT: "#1bacb5", 50: "#eefdfd", ... } }
    const customColorsWithDefault = {
      primary: "#1bacb5", // DEFAULT becomes the parent key
      "primary-50": "#eefdfd",
      "primary-100": "#d4f9f9",
      "primary-500": "#1bacb5",
      "primary-900": "#1e4f5b",
    };

    // Test that bg-primary uses the DEFAULT value
    expect(parseColor("bg-primary", customColorsWithDefault)).toEqual({
      backgroundColor: "#1bacb5",
    });

    // Test that bg-primary-50 uses the shade value
    expect(parseColor("bg-primary-50", customColorsWithDefault)).toEqual({
      backgroundColor: "#eefdfd",
    });

    // Test with text colors
    expect(parseColor("text-primary", customColorsWithDefault)).toEqual({
      color: "#1bacb5",
    });

    // Test with border colors
    expect(parseColor("border-primary", customColorsWithDefault)).toEqual({
      borderColor: "#1bacb5",
    });
  });

  it("should fallback to preset colors when custom color not found", () => {
    expect(parseColor("bg-red-500", customColors)).toEqual({ backgroundColor: COLORS["red-500"] });
  });
});

describe("parseColor - edge cases", () => {
  it("should return null for invalid classes", () => {
    expect(parseColor("invalid")).toBeNull();
    expect(parseColor("bg")).toBeNull();
    expect(parseColor("text")).toBeNull();
    expect(parseColor("border")).toBeNull();
  });

  it("should return null for invalid color values", () => {
    expect(parseColor("bg-invalid")).toBeNull();
    expect(parseColor("text-notacolor")).toBeNull();
    expect(parseColor("border-xyz")).toBeNull();
  });

  it("should return null for invalid arbitrary hex values", () => {
    expect(parseColor("bg-[#ff]")).toBeNull(); // Too short (2 digits)
    expect(parseColor("bg-[#ffff]")).toBeNull(); // Invalid length (4 digits)
    expect(parseColor("bg-[#fffff]")).toBeNull(); // Invalid length (5 digits)
    expect(parseColor("bg-[#fffffff]")).toBeNull(); // Invalid length (7 digits)
    expect(parseColor("bg-[#fffffffff]")).toBeNull(); // Too long (9 digits)
  });

  it("should return null for malformed arbitrary values", () => {
    expect(parseColor("bg-[#ff0000")).toBeNull(); // Missing closing bracket
    expect(parseColor("bg-#ff0000]")).toBeNull(); // Missing opening bracket
    expect(parseColor("bg-[]")).toBeNull(); // Empty brackets
    expect(parseColor("bg-[ff0000]")).toBeNull(); // Missing # symbol
  });

  it("should return null for non-hex arbitrary values", () => {
    expect(parseColor("bg-[#gggggg]")).toBeNull(); // Invalid hex characters
    expect(parseColor("bg-[#zzzzzz]")).toBeNull(); // Invalid hex characters
    expect(parseColor("bg-[rgb(255,0,0)]")).toBeNull(); // RGB format not supported
  });

  it("should return null for non-color arbitrary values (to let other parsers handle them)", () => {
    // These should be handled by typography parser
    expect(parseColor("text-[13px]")).toBeNull();
    expect(parseColor("text-[18px]")).toBeNull();
    expect(parseColor("text-[24]")).toBeNull();
    // These should be handled by sizing parser
    expect(parseColor("bg-[100%]")).toBeNull();
    expect(parseColor("bg-[50px]")).toBeNull();
  });

  it("should not match partial class names", () => {
    expect(parseColor("background-blue-500")).toBeNull();
    expect(parseColor("textcolor-red-500")).toBeNull();
    expect(parseColor("border-color-blue-500")).toBeNull();
  });

  it("should handle all color scale variants", () => {
    const scales = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];
    scales.forEach((scale) => {
      expect(parseColor(`bg-blue-${scale}`)).toBeTruthy();
      expect(parseColor(`text-red-${scale}`)).toBeTruthy();
      expect(parseColor(`border-green-${scale}`)).toBeTruthy();
    });
  });
});

describe("parseColor - comprehensive coverage", () => {
  it("should parse all color types with same preset color", () => {
    expect(parseColor("bg-blue-500")).toEqual({ backgroundColor: COLORS["blue-500"] });
    expect(parseColor("text-blue-500")).toEqual({ color: COLORS["blue-500"] });
    expect(parseColor("border-blue-500")).toEqual({ borderColor: COLORS["blue-500"] });
  });

  it("should parse all color types with same arbitrary hex", () => {
    expect(parseColor("bg-[#ff0000]")).toEqual({ backgroundColor: "#ff0000" });
    expect(parseColor("text-[#ff0000]")).toEqual({ color: "#ff0000" });
    expect(parseColor("border-[#ff0000]")).toEqual({ borderColor: "#ff0000" });
  });

  it("should handle all color families", () => {
    const families = ["gray", "red", "blue", "green", "yellow", "purple", "pink", "orange", "indigo"];
    families.forEach((family) => {
      expect(parseColor(`bg-${family}-500`)).toBeTruthy();
      expect(parseColor(`text-${family}-500`)).toBeTruthy();
      expect(parseColor(`border-${family}-500`)).toBeTruthy();
    });
  });

  it("should handle arbitrary values with mixed case", () => {
    expect(parseColor("bg-[#AbCdEf]")).toEqual({ backgroundColor: "#AbCdEf" });
    expect(parseColor("text-[#aBcDeF]")).toEqual({ color: "#aBcDeF" });
    expect(parseColor("border-[#ABCDEF]")).toEqual({ borderColor: "#ABCDEF" });
  });

  it("should expand 3-digit hex consistently across all color types", () => {
    expect(parseColor("bg-[#abc]")).toEqual({ backgroundColor: "#aabbcc" });
    expect(parseColor("text-[#abc]")).toEqual({ color: "#aabbcc" });
    expect(parseColor("border-[#abc]")).toEqual({ borderColor: "#aabbcc" });
  });

  it("should handle alpha channel consistently across all color types", () => {
    expect(parseColor("bg-[#ff0000aa]")).toEqual({ backgroundColor: "#ff0000aa" });
    expect(parseColor("text-[#ff0000aa]")).toEqual({ color: "#ff0000aa" });
    expect(parseColor("border-[#ff0000aa]")).toEqual({ borderColor: "#ff0000aa" });
  });
});

describe("parseColor - opacity modifiers", () => {
  it("should parse background colors with opacity modifiers", () => {
    expect(parseColor("bg-black/50")).toEqual({ backgroundColor: applyOpacity(COLORS.black, 50) });
    expect(parseColor("bg-white/50")).toEqual({ backgroundColor: applyOpacity(COLORS.white, 50) });
    expect(parseColor("bg-blue-500/80")).toEqual({ backgroundColor: applyOpacity(COLORS["blue-500"], 80) });
    expect(parseColor("bg-red-500/30")).toEqual({ backgroundColor: applyOpacity(COLORS["red-500"], 30) });
  });

  it("should parse text colors with opacity modifiers", () => {
    expect(parseColor("text-black/80")).toEqual({ color: applyOpacity(COLORS.black, 80) });
    expect(parseColor("text-white/90")).toEqual({ color: applyOpacity(COLORS.white, 90) });
    expect(parseColor("text-gray-900/70")).toEqual({ color: applyOpacity(COLORS["gray-900"], 70) });
    expect(parseColor("text-blue-500/50")).toEqual({ color: applyOpacity(COLORS["blue-500"], 50) });
  });

  it("should parse border colors with opacity modifiers", () => {
    expect(parseColor("border-black/25")).toEqual({ borderColor: applyOpacity(COLORS.black, 25) });
    expect(parseColor("border-red-500/60")).toEqual({ borderColor: applyOpacity(COLORS["red-500"], 60) });
    expect(parseColor("border-gray-200/40")).toEqual({ borderColor: applyOpacity(COLORS["gray-200"], 40) });
  });

  it("should handle opacity modifier with arbitrary hex colors", () => {
    expect(parseColor("bg-[#ff0000]/50")).toEqual({ backgroundColor: "#FF000080" });
    expect(parseColor("text-[#3B82F6]/80")).toEqual({ color: "#3B82F6CC" });
    expect(parseColor("border-[#abc]/60")).toEqual({ borderColor: "#AABBCC99" });
  });

  it("should handle opacity modifier with custom colors", () => {
    const customColors = { "brand-primary": "#FF6B6B" };
    expect(parseColor("bg-brand-primary/50", customColors)).toEqual({ backgroundColor: "#FF6B6B80" });
    expect(parseColor("text-brand-primary/75", customColors)).toEqual({ color: "#FF6B6BBF" });
  });

  it("should handle opacity 0 (fully transparent)", () => {
    expect(parseColor("bg-black/0")).toEqual({ backgroundColor: applyOpacity(COLORS.black, 0) });
    expect(parseColor("text-red-500/0")).toEqual({ color: applyOpacity(COLORS["red-500"], 0) });
  });

  it("should handle opacity 100 (fully opaque)", () => {
    expect(parseColor("bg-black/100")).toEqual({ backgroundColor: applyOpacity(COLORS.black, 100) });
    expect(parseColor("text-blue-500/100")).toEqual({ color: applyOpacity(COLORS["blue-500"], 100) });
  });

  it("should handle transparent color with opacity modifier", () => {
    // Transparent with opacity should remain transparent
    expect(parseColor("bg-transparent/50")).toEqual({ backgroundColor: "transparent" });
  });

  it("should convert opacity percentage to correct hex values", () => {
    // Test key opacity values
    expect(parseColor("bg-black/0")).toEqual({ backgroundColor: "#00000000" }); // 0%
    expect(parseColor("bg-black/10")).toEqual({ backgroundColor: "#0000001A" }); // ~10%
    expect(parseColor("bg-black/25")).toEqual({ backgroundColor: "#00000040" }); // 25%
    expect(parseColor("bg-black/50")).toEqual({ backgroundColor: "#00000080" }); // 50%
    expect(parseColor("bg-black/75")).toEqual({ backgroundColor: "#000000BF" }); // 75%
    expect(parseColor("bg-black/100")).toEqual({ backgroundColor: "#000000FF" }); // 100%
  });

  it("should return null for invalid opacity values", () => {
    expect(parseColor("bg-black/101")).toBeNull(); // > 100
    expect(parseColor("bg-black/-1")).toBeNull(); // < 0
    expect(parseColor("bg-black/150")).toBeNull(); // Way over 100
  });

  it("should return null for malformed opacity syntax", () => {
    expect(parseColor("bg-black/")).toBeNull(); // Missing opacity value
    expect(parseColor("bg-black/abc")).toBeNull(); // Non-numeric opacity
    expect(parseColor("bg-black/50/")).toBeNull(); // Extra slash
  });

  it("should handle opacity with 3-digit hex expansion", () => {
    expect(parseColor("bg-[#f00]/50")).toEqual({ backgroundColor: "#FF000080" });
    expect(parseColor("text-[#abc]/75")).toEqual({ color: "#AABBCCBF" });
  });

  it("should work with all color families", () => {
    const families = ["gray", "red", "blue", "green", "yellow", "purple", "pink", "orange", "indigo"];
    families.forEach((family) => {
      expect(parseColor(`bg-${family}-500/50`)).toBeTruthy();
      expect(parseColor(`text-${family}-500/50`)).toBeTruthy();
      expect(parseColor(`border-${family}-500/50`)).toBeTruthy();
    });
  });
});
