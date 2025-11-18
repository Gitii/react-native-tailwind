import { describe, expect, it } from "vitest";
import { FONT_SIZES, LETTER_SPACING_SCALE, parseTypography } from "./typography";

describe("FONT_SIZES", () => {
  it("should export complete font size scale", () => {
    expect(FONT_SIZES).toMatchSnapshot();
  });
});

describe("LETTER_SPACING_SCALE", () => {
  it("should export complete letter spacing scale", () => {
    expect(LETTER_SPACING_SCALE).toMatchSnapshot();
  });
});

describe("parseTypography - font size", () => {
  it("should parse font size with preset values", () => {
    expect(parseTypography("text-xs")).toEqual({ fontSize: 12 });
    expect(parseTypography("text-sm")).toEqual({ fontSize: 14 });
    expect(parseTypography("text-base")).toEqual({ fontSize: 16 });
    expect(parseTypography("text-lg")).toEqual({ fontSize: 18 });
    expect(parseTypography("text-xl")).toEqual({ fontSize: 20 });
    expect(parseTypography("text-2xl")).toEqual({ fontSize: 24 });
    expect(parseTypography("text-3xl")).toEqual({ fontSize: 30 });
    expect(parseTypography("text-4xl")).toEqual({ fontSize: 36 });
    expect(parseTypography("text-5xl")).toEqual({ fontSize: 48 });
    expect(parseTypography("text-6xl")).toEqual({ fontSize: 60 });
    expect(parseTypography("text-7xl")).toEqual({ fontSize: 72 });
    expect(parseTypography("text-8xl")).toEqual({ fontSize: 96 });
    expect(parseTypography("text-9xl")).toEqual({ fontSize: 128 });
  });

  it("should parse font size with arbitrary pixel values", () => {
    expect(parseTypography("text-[18px]")).toEqual({ fontSize: 18 });
    expect(parseTypography("text-[18]")).toEqual({ fontSize: 18 });
    expect(parseTypography("text-[22px]")).toEqual({ fontSize: 22 });
    expect(parseTypography("text-[22]")).toEqual({ fontSize: 22 });
    expect(parseTypography("text-[100px]")).toEqual({ fontSize: 100 });
  });
});

describe("parseTypography - font weight", () => {
  it("should parse font weight values", () => {
    expect(parseTypography("font-thin")).toEqual({ fontWeight: "100" });
    expect(parseTypography("font-extralight")).toEqual({ fontWeight: "200" });
    expect(parseTypography("font-light")).toEqual({ fontWeight: "300" });
    expect(parseTypography("font-normal")).toEqual({ fontWeight: "400" });
    expect(parseTypography("font-medium")).toEqual({ fontWeight: "500" });
    expect(parseTypography("font-semibold")).toEqual({ fontWeight: "600" });
    expect(parseTypography("font-bold")).toEqual({ fontWeight: "700" });
    expect(parseTypography("font-extrabold")).toEqual({ fontWeight: "800" });
    expect(parseTypography("font-black")).toEqual({ fontWeight: "900" });
  });
});

describe("parseTypography - font style", () => {
  it("should parse font style values", () => {
    expect(parseTypography("italic")).toEqual({ fontStyle: "italic" });
    expect(parseTypography("not-italic")).toEqual({ fontStyle: "normal" });
  });
});

describe("parseTypography - text alignment", () => {
  it("should parse text alignment values", () => {
    expect(parseTypography("text-left")).toEqual({ textAlign: "left" });
    expect(parseTypography("text-center")).toEqual({ textAlign: "center" });
    expect(parseTypography("text-right")).toEqual({ textAlign: "right" });
    expect(parseTypography("text-justify")).toEqual({ textAlign: "justify" });
  });
});

describe("parseTypography - text decoration", () => {
  it("should parse text decoration values", () => {
    expect(parseTypography("underline")).toEqual({
      textDecorationLine: "underline",
    });
    expect(parseTypography("line-through")).toEqual({
      textDecorationLine: "line-through",
    });
    expect(parseTypography("no-underline")).toEqual({
      textDecorationLine: "none",
    });
  });
});

describe("parseTypography - text transform", () => {
  it("should parse text transform values", () => {
    expect(parseTypography("uppercase")).toEqual({
      textTransform: "uppercase",
    });
    expect(parseTypography("lowercase")).toEqual({
      textTransform: "lowercase",
    });
    expect(parseTypography("capitalize")).toEqual({
      textTransform: "capitalize",
    });
    expect(parseTypography("normal-case")).toEqual({ textTransform: "none" });
  });
});

describe("parseTypography - line height", () => {
  it("should parse line height with preset values", () => {
    expect(parseTypography("leading-none")).toEqual({ lineHeight: 16 });
    expect(parseTypography("leading-tight")).toEqual({ lineHeight: 20 });
    expect(parseTypography("leading-snug")).toEqual({ lineHeight: 22 });
    expect(parseTypography("leading-normal")).toEqual({ lineHeight: 24 });
    expect(parseTypography("leading-relaxed")).toEqual({ lineHeight: 28 });
    expect(parseTypography("leading-loose")).toEqual({ lineHeight: 32 });
  });

  it("should parse line height with arbitrary pixel values", () => {
    expect(parseTypography("leading-[24px]")).toEqual({ lineHeight: 24 });
    expect(parseTypography("leading-[24]")).toEqual({ lineHeight: 24 });
    expect(parseTypography("leading-[30px]")).toEqual({ lineHeight: 30 });
    expect(parseTypography("leading-[30]")).toEqual({ lineHeight: 30 });
    expect(parseTypography("leading-[50px]")).toEqual({ lineHeight: 50 });
  });
});

describe("parseTypography - letter spacing", () => {
  it("should parse letter spacing with preset values", () => {
    expect(parseTypography("tracking-tighter")).toEqual({
      letterSpacing: -0.8,
    });
    expect(parseTypography("tracking-tight")).toEqual({ letterSpacing: -0.4 });
    expect(parseTypography("tracking-normal")).toEqual({ letterSpacing: 0 });
    expect(parseTypography("tracking-wide")).toEqual({ letterSpacing: 0.4 });
    expect(parseTypography("tracking-wider")).toEqual({ letterSpacing: 0.8 });
    expect(parseTypography("tracking-widest")).toEqual({ letterSpacing: 1.6 });
  });
});

describe("parseTypography - edge cases", () => {
  it("should return null for invalid classes", () => {
    expect(parseTypography("invalid")).toBeNull();
    expect(parseTypography("text")).toBeNull();
    expect(parseTypography("font")).toBeNull();
    expect(parseTypography("leading")).toBeNull();
    expect(parseTypography("tracking")).toBeNull();
  });

  it("should return null for invalid font size values", () => {
    expect(parseTypography("text-invalid")).toBeNull();
    expect(parseTypography("text-10xl")).toBeNull();
  });

  it("should return null for invalid font weight values", () => {
    expect(parseTypography("font-invalid")).toBeNull();
    expect(parseTypography("font-100")).toBeNull();
  });

  it("should return null for arbitrary values with unsupported units", () => {
    expect(parseTypography("text-[16rem]")).toBeNull();
    expect(parseTypography("text-[2em]")).toBeNull();
    expect(parseTypography("leading-[2rem]")).toBeNull();
    expect(parseTypography("leading-[1.5em]")).toBeNull();
  });

  it("should return null for malformed arbitrary values", () => {
    expect(parseTypography("text-[16")).toBeNull();
    expect(parseTypography("text-16]")).toBeNull();
    expect(parseTypography("text-[]")).toBeNull();
    expect(parseTypography("leading-[24")).toBeNull();
    expect(parseTypography("leading-24]")).toBeNull();
  });

  it("should not match partial class names", () => {
    expect(parseTypography("mytext-lg")).toBeNull();
    expect(parseTypography("font-bold-extra")).toBeNull();
    expect(parseTypography("italic-text")).toBeNull();
  });
});

describe("parseTypography - comprehensive coverage", () => {
  it("should handle all typography categories independently", () => {
    // Font size
    expect(parseTypography("text-base")).toEqual({ fontSize: 16 });
    // Font weight
    expect(parseTypography("font-bold")).toEqual({ fontWeight: "700" });
    // Font style
    expect(parseTypography("italic")).toEqual({ fontStyle: "italic" });
    // Text alignment
    expect(parseTypography("text-center")).toEqual({ textAlign: "center" });
    // Text decoration
    expect(parseTypography("underline")).toEqual({
      textDecorationLine: "underline",
    });
    // Text transform
    expect(parseTypography("uppercase")).toEqual({
      textTransform: "uppercase",
    });
    // Line height
    expect(parseTypography("leading-normal")).toEqual({ lineHeight: 24 });
    // Letter spacing
    expect(parseTypography("tracking-wide")).toEqual({ letterSpacing: 0.4 });
  });

  it("should handle arbitrary values for font size and line height", () => {
    expect(parseTypography("text-[19px]")).toEqual({ fontSize: 19 });
    expect(parseTypography("text-[19]")).toEqual({ fontSize: 19 });
    expect(parseTypography("leading-[26px]")).toEqual({ lineHeight: 26 });
    expect(parseTypography("leading-[26]")).toEqual({ lineHeight: 26 });
  });

  it("should handle edge case values", () => {
    // Smallest font size
    expect(parseTypography("text-xs")).toEqual({ fontSize: 12 });
    // Largest font size
    expect(parseTypography("text-9xl")).toEqual({ fontSize: 128 });
    // Smallest line height
    expect(parseTypography("leading-none")).toEqual({ lineHeight: 16 });
    // Largest line height
    expect(parseTypography("leading-loose")).toEqual({ lineHeight: 32 });
    // Negative letter spacing
    expect(parseTypography("tracking-tighter")).toEqual({
      letterSpacing: -0.8,
    });
    // Positive letter spacing
    expect(parseTypography("tracking-widest")).toEqual({ letterSpacing: 1.6 });
  });
});
