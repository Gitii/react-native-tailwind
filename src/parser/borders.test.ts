import { describe, expect, it } from "vitest";
import { BORDER_RADIUS_SCALE, BORDER_WIDTH_SCALE, parseBorder } from "./borders";

describe("BORDER_WIDTH_SCALE", () => {
  it("should export complete border width scale", () => {
    expect(BORDER_WIDTH_SCALE).toMatchSnapshot();
  });
});

describe("BORDER_RADIUS_SCALE", () => {
  it("should export complete border radius scale", () => {
    expect(BORDER_RADIUS_SCALE).toMatchSnapshot();
  });
});

describe("parseBorder - border width all sides", () => {
  it("should parse border shorthand", () => {
    expect(parseBorder("border")).toEqual({ borderWidth: 1 });
  });

  it("should parse border with preset values", () => {
    expect(parseBorder("border-0")).toEqual({ borderWidth: 0 });
    expect(parseBorder("border-2")).toEqual({ borderWidth: 2 });
    expect(parseBorder("border-4")).toEqual({ borderWidth: 4 });
    expect(parseBorder("border-8")).toEqual({ borderWidth: 8 });
  });

  it("should parse border with arbitrary pixel values", () => {
    expect(parseBorder("border-[1px]")).toEqual({ borderWidth: 1 });
    expect(parseBorder("border-[1]")).toEqual({ borderWidth: 1 });
    expect(parseBorder("border-[3px]")).toEqual({ borderWidth: 3 });
    expect(parseBorder("border-[10px]")).toEqual({ borderWidth: 10 });
  });
});

describe("parseBorder - border width directional", () => {
  it("should parse border top", () => {
    expect(parseBorder("border-t")).toEqual({ borderTopWidth: 1 });
    expect(parseBorder("border-t-0")).toEqual({ borderTopWidth: 0 });
    expect(parseBorder("border-t-2")).toEqual({ borderTopWidth: 2 });
    expect(parseBorder("border-t-4")).toEqual({ borderTopWidth: 4 });
    expect(parseBorder("border-t-8")).toEqual({ borderTopWidth: 8 });
  });

  it("should parse border right", () => {
    expect(parseBorder("border-r")).toEqual({ borderRightWidth: 1 });
    expect(parseBorder("border-r-0")).toEqual({ borderRightWidth: 0 });
    expect(parseBorder("border-r-2")).toEqual({ borderRightWidth: 2 });
    expect(parseBorder("border-r-4")).toEqual({ borderRightWidth: 4 });
  });

  it("should parse border bottom", () => {
    expect(parseBorder("border-b")).toEqual({ borderBottomWidth: 1 });
    expect(parseBorder("border-b-0")).toEqual({ borderBottomWidth: 0 });
    expect(parseBorder("border-b-2")).toEqual({ borderBottomWidth: 2 });
    expect(parseBorder("border-b-4")).toEqual({ borderBottomWidth: 4 });
  });

  it("should parse border left", () => {
    expect(parseBorder("border-l")).toEqual({ borderLeftWidth: 1 });
    expect(parseBorder("border-l-0")).toEqual({ borderLeftWidth: 0 });
    expect(parseBorder("border-l-2")).toEqual({ borderLeftWidth: 2 });
    expect(parseBorder("border-l-4")).toEqual({ borderLeftWidth: 4 });
  });

  it("should parse directional borders with arbitrary values", () => {
    expect(parseBorder("border-t-[3px]")).toEqual({ borderTopWidth: 3 });
    expect(parseBorder("border-r-[5px]")).toEqual({ borderRightWidth: 5 });
    expect(parseBorder("border-b-[7px]")).toEqual({ borderBottomWidth: 7 });
    expect(parseBorder("border-l-[9px]")).toEqual({ borderLeftWidth: 9 });
  });
});

describe("parseBorder - border style", () => {
  it("should parse border styles", () => {
    expect(parseBorder("border-solid")).toEqual({ borderStyle: "solid" });
    expect(parseBorder("border-dotted")).toEqual({ borderStyle: "dotted" });
    expect(parseBorder("border-dashed")).toEqual({ borderStyle: "dashed" });
  });
});

describe("parseBorder - border radius all corners", () => {
  it("should parse rounded shorthand", () => {
    expect(parseBorder("rounded")).toEqual({ borderRadius: 4 });
  });

  it("should parse rounded with preset values", () => {
    expect(parseBorder("rounded-none")).toEqual({ borderRadius: 0 });
    expect(parseBorder("rounded-sm")).toEqual({ borderRadius: 2 });
    expect(parseBorder("rounded-md")).toEqual({ borderRadius: 6 });
    expect(parseBorder("rounded-lg")).toEqual({ borderRadius: 8 });
    expect(parseBorder("rounded-xl")).toEqual({ borderRadius: 12 });
    expect(parseBorder("rounded-2xl")).toEqual({ borderRadius: 16 });
    expect(parseBorder("rounded-3xl")).toEqual({ borderRadius: 24 });
    expect(parseBorder("rounded-full")).toEqual({ borderRadius: 9999 });
  });

  it("should parse rounded with arbitrary pixel values", () => {
    expect(parseBorder("rounded-[5px]")).toEqual({ borderRadius: 5 });
    expect(parseBorder("rounded-[10px]")).toEqual({ borderRadius: 10 });
    expect(parseBorder("rounded-[15]")).toEqual({ borderRadius: 15 });
  });
});

describe("parseBorder - border radius sides", () => {
  it("should parse rounded top", () => {
    expect(parseBorder("rounded-t")).toEqual({
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
    });
    expect(parseBorder("rounded-t-lg")).toEqual({
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    });
    expect(parseBorder("rounded-t-[12px]")).toEqual({
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    });
  });

  it("should parse rounded right", () => {
    expect(parseBorder("rounded-r")).toEqual({
      borderTopRightRadius: 4,
      borderBottomRightRadius: 4,
    });
    expect(parseBorder("rounded-r-lg")).toEqual({
      borderTopRightRadius: 8,
      borderBottomRightRadius: 8,
    });
    expect(parseBorder("rounded-r-[12px]")).toEqual({
      borderTopRightRadius: 12,
      borderBottomRightRadius: 12,
    });
  });

  it("should parse rounded bottom", () => {
    expect(parseBorder("rounded-b")).toEqual({
      borderBottomLeftRadius: 4,
      borderBottomRightRadius: 4,
    });
    expect(parseBorder("rounded-b-lg")).toEqual({
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
    });
    expect(parseBorder("rounded-b-[12px]")).toEqual({
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
    });
  });

  it("should parse rounded left", () => {
    expect(parseBorder("rounded-l")).toEqual({
      borderTopLeftRadius: 4,
      borderBottomLeftRadius: 4,
    });
    expect(parseBorder("rounded-l-lg")).toEqual({
      borderTopLeftRadius: 8,
      borderBottomLeftRadius: 8,
    });
    expect(parseBorder("rounded-l-[12px]")).toEqual({
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
    });
  });
});

describe("parseBorder - border radius specific corners", () => {
  it("should parse rounded top-left", () => {
    expect(parseBorder("rounded-tl")).toEqual({ borderTopLeftRadius: 4 });
    expect(parseBorder("rounded-tl-lg")).toEqual({ borderTopLeftRadius: 8 });
    expect(parseBorder("rounded-tl-[12px]")).toEqual({
      borderTopLeftRadius: 12,
    });
  });

  it("should parse rounded top-right", () => {
    expect(parseBorder("rounded-tr")).toEqual({ borderTopRightRadius: 4 });
    expect(parseBorder("rounded-tr-lg")).toEqual({ borderTopRightRadius: 8 });
    expect(parseBorder("rounded-tr-[12px]")).toEqual({
      borderTopRightRadius: 12,
    });
  });

  it("should parse rounded bottom-left", () => {
    expect(parseBorder("rounded-bl")).toEqual({ borderBottomLeftRadius: 4 });
    expect(parseBorder("rounded-bl-lg")).toEqual({ borderBottomLeftRadius: 8 });
    expect(parseBorder("rounded-bl-[12px]")).toEqual({
      borderBottomLeftRadius: 12,
    });
  });

  it("should parse rounded bottom-right", () => {
    expect(parseBorder("rounded-br")).toEqual({ borderBottomRightRadius: 4 });
    expect(parseBorder("rounded-br-lg")).toEqual({
      borderBottomRightRadius: 8,
    });
    expect(parseBorder("rounded-br-[12px]")).toEqual({
      borderBottomRightRadius: 12,
    });
  });
});

describe("parseBorder - edge cases", () => {
  it("should return null for invalid classes", () => {
    expect(parseBorder("invalid")).toBeNull();
    expect(parseBorder("border-")).toBeNull();
    expect(parseBorder("rounded-")).toBeNull();
    expect(parseBorder("borders-4")).toBeNull();
  });

  it("should return null for invalid border width values", () => {
    expect(parseBorder("border-invalid")).toBeNull();
    expect(parseBorder("border-3")).toBeNull(); // Not in scale
    expect(parseBorder("border-16")).toBeNull(); // Not in scale
    expect(parseBorder("border-t-3")).toBeNull(); // Not in scale
  });

  it("should return null for invalid border radius values", () => {
    expect(parseBorder("rounded-invalid")).toBeNull();
    expect(parseBorder("rounded-4xl")).toBeNull(); // Not in scale
    expect(parseBorder("rounded-t-invalid")).toBeNull();
  });

  it("should return null for arbitrary values with unsupported units", () => {
    expect(parseBorder("border-[2rem]")).toBeNull();
    expect(parseBorder("border-[1em]")).toBeNull();
    expect(parseBorder("rounded-[2rem]")).toBeNull();
    expect(parseBorder("rounded-[1em]")).toBeNull();
  });

  it("should return null for malformed arbitrary values", () => {
    expect(parseBorder("border-[8")).toBeNull();
    expect(parseBorder("border-8]")).toBeNull();
    expect(parseBorder("border-[]")).toBeNull();
    expect(parseBorder("rounded-[12")).toBeNull();
    expect(parseBorder("rounded-12]")).toBeNull();
  });

  it("should handle edge case values", () => {
    expect(parseBorder("border-0")).toEqual({ borderWidth: 0 });
    expect(parseBorder("border-t-0")).toEqual({ borderTopWidth: 0 });
    expect(parseBorder("rounded-none")).toEqual({ borderRadius: 0 });
    expect(parseBorder("rounded-full")).toEqual({ borderRadius: 9999 });
  });

  it("should not match partial class names", () => {
    expect(parseBorder("myborder-4")).toBeNull();
    expect(parseBorder("border-solid-extra")).toBeNull();
    expect(parseBorder("myrounded-lg")).toBeNull();
  });
});

describe("parseBorder - comprehensive coverage", () => {
  it("should handle all border width directions with same value", () => {
    expect(parseBorder("border-2")).toEqual({ borderWidth: 2 });
    expect(parseBorder("border-t-2")).toEqual({ borderTopWidth: 2 });
    expect(parseBorder("border-r-2")).toEqual({ borderRightWidth: 2 });
    expect(parseBorder("border-b-2")).toEqual({ borderBottomWidth: 2 });
    expect(parseBorder("border-l-2")).toEqual({ borderLeftWidth: 2 });
  });

  it("should handle all border radius types with same value", () => {
    // All corners
    expect(parseBorder("rounded-lg")).toEqual({ borderRadius: 8 });

    // Sides
    expect(parseBorder("rounded-t-lg")).toEqual({
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    });
    expect(parseBorder("rounded-r-lg")).toEqual({
      borderTopRightRadius: 8,
      borderBottomRightRadius: 8,
    });
    expect(parseBorder("rounded-b-lg")).toEqual({
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
    });
    expect(parseBorder("rounded-l-lg")).toEqual({
      borderTopLeftRadius: 8,
      borderBottomLeftRadius: 8,
    });

    // Specific corners
    expect(parseBorder("rounded-tl-lg")).toEqual({ borderTopLeftRadius: 8 });
    expect(parseBorder("rounded-tr-lg")).toEqual({ borderTopRightRadius: 8 });
    expect(parseBorder("rounded-bl-lg")).toEqual({ borderBottomLeftRadius: 8 });
    expect(parseBorder("rounded-br-lg")).toEqual({
      borderBottomRightRadius: 8,
    });
  });

  it("should handle arbitrary values across all border width types", () => {
    expect(parseBorder("border-[5px]")).toEqual({ borderWidth: 5 });
    expect(parseBorder("border-t-[5px]")).toEqual({ borderTopWidth: 5 });
    expect(parseBorder("border-r-[5px]")).toEqual({ borderRightWidth: 5 });
    expect(parseBorder("border-b-[5px]")).toEqual({ borderBottomWidth: 5 });
    expect(parseBorder("border-l-[5px]")).toEqual({ borderLeftWidth: 5 });
  });

  it("should handle arbitrary values across all border radius types", () => {
    expect(parseBorder("rounded-[10px]")).toEqual({ borderRadius: 10 });

    expect(parseBorder("rounded-t-[10px]")).toEqual({
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
    });

    expect(parseBorder("rounded-tl-[10px]")).toEqual({
      borderTopLeftRadius: 10,
    });
  });

  it("should handle all border styles", () => {
    expect(parseBorder("border-solid")).toEqual({ borderStyle: "solid" });
    expect(parseBorder("border-dotted")).toEqual({ borderStyle: "dotted" });
    expect(parseBorder("border-dashed")).toEqual({ borderStyle: "dashed" });
  });

  it("should handle shorthand classes correctly", () => {
    expect(parseBorder("border")).toEqual({ borderWidth: 1 });
    expect(parseBorder("rounded")).toEqual({ borderRadius: 4 });
    expect(parseBorder("border-t")).toEqual({ borderTopWidth: 1 });
    expect(parseBorder("rounded-t")).toEqual({
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
    });
  });
});
