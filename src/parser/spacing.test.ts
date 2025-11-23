import { describe, expect, it } from "vitest";
import { SPACING_SCALE, parseSpacing } from "./spacing";

describe("SPACING_SCALE", () => {
  it("should export complete spacing scale", () => {
    expect(SPACING_SCALE).toMatchSnapshot();
  });
});

describe("parseSpacing - margin", () => {
  it("should parse margin all sides", () => {
    expect(parseSpacing("m-0")).toEqual({ margin: 0 });
    expect(parseSpacing("m-4")).toEqual({ margin: 16 });
    expect(parseSpacing("m-8")).toEqual({ margin: 32 });
    expect(parseSpacing("m-96")).toEqual({ margin: 384 });
  });

  it("should parse margin with fractional values", () => {
    expect(parseSpacing("m-0.5")).toEqual({ margin: 2 });
    expect(parseSpacing("m-1.5")).toEqual({ margin: 6 });
    expect(parseSpacing("m-2.5")).toEqual({ margin: 10 });
  });

  it("should parse margin horizontal", () => {
    expect(parseSpacing("mx-0")).toEqual({ marginHorizontal: 0 });
    expect(parseSpacing("mx-4")).toEqual({ marginHorizontal: 16 });
    expect(parseSpacing("mx-8")).toEqual({ marginHorizontal: 32 });
  });

  it("should parse margin vertical", () => {
    expect(parseSpacing("my-0")).toEqual({ marginVertical: 0 });
    expect(parseSpacing("my-4")).toEqual({ marginVertical: 16 });
    expect(parseSpacing("my-8")).toEqual({ marginVertical: 32 });
  });

  it("should parse margin directional", () => {
    expect(parseSpacing("mt-4")).toEqual({ marginTop: 16 });
    expect(parseSpacing("mr-4")).toEqual({ marginRight: 16 });
    expect(parseSpacing("mb-4")).toEqual({ marginBottom: 16 });
    expect(parseSpacing("ml-4")).toEqual({ marginLeft: 16 });
  });

  it("should parse margin with arbitrary values", () => {
    expect(parseSpacing("m-[16px]")).toEqual({ margin: 16 });
    expect(parseSpacing("m-[16]")).toEqual({ margin: 16 });
    expect(parseSpacing("m-[100px]")).toEqual({ margin: 100 });
    expect(parseSpacing("m-[100]")).toEqual({ margin: 100 });
  });

  it("should parse margin directional with arbitrary values", () => {
    expect(parseSpacing("mt-[24px]")).toEqual({ marginTop: 24 });
    expect(parseSpacing("mr-[32]")).toEqual({ marginRight: 32 });
    expect(parseSpacing("mb-[16px]")).toEqual({ marginBottom: 16 });
    expect(parseSpacing("ml-[48]")).toEqual({ marginLeft: 48 });
  });

  it("should parse margin horizontal/vertical with arbitrary values", () => {
    expect(parseSpacing("mx-[20px]")).toEqual({ marginHorizontal: 20 });
    expect(parseSpacing("my-[30]")).toEqual({ marginVertical: 30 });
  });
});

describe("parseSpacing - negative margin", () => {
  it("should parse negative margin all sides", () => {
    expect(parseSpacing("-m-0")).toEqual({ margin: -0 }); // JavaScript -0 is distinct from +0
    expect(parseSpacing("-m-4")).toEqual({ margin: -16 });
    expect(parseSpacing("-m-8")).toEqual({ margin: -32 });
    expect(parseSpacing("-m-96")).toEqual({ margin: -384 });
  });

  it("should parse negative margin with fractional values", () => {
    expect(parseSpacing("-m-0.5")).toEqual({ margin: -2 });
    expect(parseSpacing("-m-1.5")).toEqual({ margin: -6 });
    expect(parseSpacing("-m-2.5")).toEqual({ margin: -10 });
  });

  it("should parse negative margin horizontal", () => {
    expect(parseSpacing("-mx-4")).toEqual({ marginHorizontal: -16 });
    expect(parseSpacing("-mx-8")).toEqual({ marginHorizontal: -32 });
  });

  it("should parse negative margin vertical", () => {
    expect(parseSpacing("-my-4")).toEqual({ marginVertical: -16 });
    expect(parseSpacing("-my-8")).toEqual({ marginVertical: -32 });
  });

  it("should parse negative margin directional", () => {
    expect(parseSpacing("-mt-4")).toEqual({ marginTop: -16 });
    expect(parseSpacing("-mr-4")).toEqual({ marginRight: -16 });
    expect(parseSpacing("-mb-4")).toEqual({ marginBottom: -16 });
    expect(parseSpacing("-ml-4")).toEqual({ marginLeft: -16 });
  });

  it("should parse negative margin with arbitrary values", () => {
    expect(parseSpacing("-m-[16px]")).toEqual({ margin: -16 });
    expect(parseSpacing("-m-[16]")).toEqual({ margin: -16 });
    expect(parseSpacing("-m-[100px]")).toEqual({ margin: -100 });
    expect(parseSpacing("-m-[100]")).toEqual({ margin: -100 });
  });

  it("should parse negative margin directional with arbitrary values", () => {
    expect(parseSpacing("-mt-[24px]")).toEqual({ marginTop: -24 });
    expect(parseSpacing("-mr-[32]")).toEqual({ marginRight: -32 });
    expect(parseSpacing("-mb-[16px]")).toEqual({ marginBottom: -16 });
    expect(parseSpacing("-ml-[48]")).toEqual({ marginLeft: -48 });
  });

  it("should parse negative margin horizontal/vertical with arbitrary values", () => {
    expect(parseSpacing("-mx-[20px]")).toEqual({ marginHorizontal: -20 });
    expect(parseSpacing("-my-[30]")).toEqual({ marginVertical: -30 });
  });

  it("should not parse negative padding (invalid)", () => {
    expect(parseSpacing("-p-4")).toBeNull();
    expect(parseSpacing("-px-4")).toBeNull();
    expect(parseSpacing("-pt-4")).toBeNull();
    expect(parseSpacing("-p-[16px]")).toBeNull();
  });

  it("should not parse negative gap (invalid)", () => {
    expect(parseSpacing("-gap-4")).toBeNull();
    expect(parseSpacing("-gap-[16px]")).toBeNull();
  });
});

describe("parseSpacing - padding", () => {
  it("should parse padding all sides", () => {
    expect(parseSpacing("p-0")).toEqual({ padding: 0 });
    expect(parseSpacing("p-4")).toEqual({ padding: 16 });
    expect(parseSpacing("p-8")).toEqual({ padding: 32 });
    expect(parseSpacing("p-96")).toEqual({ padding: 384 });
  });

  it("should parse padding with fractional values", () => {
    expect(parseSpacing("p-0.5")).toEqual({ padding: 2 });
    expect(parseSpacing("p-1.5")).toEqual({ padding: 6 });
    expect(parseSpacing("p-2.5")).toEqual({ padding: 10 });
  });

  it("should parse padding horizontal", () => {
    expect(parseSpacing("px-0")).toEqual({ paddingHorizontal: 0 });
    expect(parseSpacing("px-4")).toEqual({ paddingHorizontal: 16 });
    expect(parseSpacing("px-8")).toEqual({ paddingHorizontal: 32 });
  });

  it("should parse padding vertical", () => {
    expect(parseSpacing("py-0")).toEqual({ paddingVertical: 0 });
    expect(parseSpacing("py-4")).toEqual({ paddingVertical: 16 });
    expect(parseSpacing("py-8")).toEqual({ paddingVertical: 32 });
  });

  it("should parse padding directional", () => {
    expect(parseSpacing("pt-4")).toEqual({ paddingTop: 16 });
    expect(parseSpacing("pr-4")).toEqual({ paddingRight: 16 });
    expect(parseSpacing("pb-4")).toEqual({ paddingBottom: 16 });
    expect(parseSpacing("pl-4")).toEqual({ paddingLeft: 16 });
  });

  it("should parse padding with arbitrary values", () => {
    expect(parseSpacing("p-[16px]")).toEqual({ padding: 16 });
    expect(parseSpacing("p-[16]")).toEqual({ padding: 16 });
    expect(parseSpacing("p-[100px]")).toEqual({ padding: 100 });
    expect(parseSpacing("p-[100]")).toEqual({ padding: 100 });
  });

  it("should parse padding directional with arbitrary values", () => {
    expect(parseSpacing("pt-[24px]")).toEqual({ paddingTop: 24 });
    expect(parseSpacing("pr-[32]")).toEqual({ paddingRight: 32 });
    expect(parseSpacing("pb-[16px]")).toEqual({ paddingBottom: 16 });
    expect(parseSpacing("pl-[48]")).toEqual({ paddingLeft: 48 });
  });

  it("should parse padding horizontal/vertical with arbitrary values", () => {
    expect(parseSpacing("px-[20px]")).toEqual({ paddingHorizontal: 20 });
    expect(parseSpacing("py-[30]")).toEqual({ paddingVertical: 30 });
  });
});

describe("parseSpacing - gap", () => {
  it("should parse gap", () => {
    expect(parseSpacing("gap-0")).toEqual({ gap: 0 });
    expect(parseSpacing("gap-4")).toEqual({ gap: 16 });
    expect(parseSpacing("gap-8")).toEqual({ gap: 32 });
    expect(parseSpacing("gap-96")).toEqual({ gap: 384 });
  });

  it("should parse gap with fractional values", () => {
    expect(parseSpacing("gap-0.5")).toEqual({ gap: 2 });
    expect(parseSpacing("gap-1.5")).toEqual({ gap: 6 });
    expect(parseSpacing("gap-2.5")).toEqual({ gap: 10 });
  });

  it("should parse gap with arbitrary values", () => {
    expect(parseSpacing("gap-[16px]")).toEqual({ gap: 16 });
    expect(parseSpacing("gap-[16]")).toEqual({ gap: 16 });
    expect(parseSpacing("gap-[100px]")).toEqual({ gap: 100 });
    expect(parseSpacing("gap-[100]")).toEqual({ gap: 100 });
  });
});

describe("parseSpacing - edge cases", () => {
  it("should return null for invalid classes", () => {
    expect(parseSpacing("invalid")).toBeNull();
    expect(parseSpacing("m")).toBeNull();
    expect(parseSpacing("p")).toBeNull();
    expect(parseSpacing("margin-4")).toBeNull();
    expect(parseSpacing("padding-4")).toBeNull();
  });

  it("should return null for invalid spacing values", () => {
    expect(parseSpacing("m-invalid")).toBeNull();
    expect(parseSpacing("p-999")).toBeNull();
    expect(parseSpacing("gap-abc")).toBeNull();
  });

  it("should return null for arbitrary values with unsupported units", () => {
    expect(parseSpacing("m-[16rem]")).toBeNull();
    expect(parseSpacing("p-[2em]")).toBeNull();
    expect(parseSpacing("gap-[50%]")).toBeNull();
  });

  it("should return null for malformed arbitrary values", () => {
    expect(parseSpacing("m-[16")).toBeNull();
    expect(parseSpacing("p-16]")).toBeNull();
    expect(parseSpacing("gap-[]")).toBeNull();
  });

  it("should handle edge case spacing values", () => {
    expect(parseSpacing("m-0")).toEqual({ margin: 0 });
    expect(parseSpacing("p-0")).toEqual({ padding: 0 });
    expect(parseSpacing("gap-0")).toEqual({ gap: 0 });
  });

  it("should not match partial class names", () => {
    expect(parseSpacing("sm-4")).toBeNull();
    expect(parseSpacing("margin-4")).toBeNull();
    expect(parseSpacing("padding-4")).toBeNull();
  });
});

describe("parseSpacing - decimal arbitrary values", () => {
  it("should parse margin with decimal arbitrary values", () => {
    expect(parseSpacing("m-[4.5px]")).toEqual({ margin: 4.5 });
    expect(parseSpacing("m-[4.5]")).toEqual({ margin: 4.5 });
    expect(parseSpacing("m-[16.75px]")).toEqual({ margin: 16.75 });
    expect(parseSpacing("m-[16.75]")).toEqual({ margin: 16.75 });
    expect(parseSpacing("m-[100.25px]")).toEqual({ margin: 100.25 });
    expect(parseSpacing("m-[0.5]")).toEqual({ margin: 0.5 });
  });

  it("should parse padding with decimal arbitrary values", () => {
    expect(parseSpacing("p-[4.5px]")).toEqual({ padding: 4.5 });
    expect(parseSpacing("p-[4.5]")).toEqual({ padding: 4.5 });
    expect(parseSpacing("pl-[4.5px]")).toEqual({ paddingLeft: 4.5 });
    expect(parseSpacing("pl-[4.5]")).toEqual({ paddingLeft: 4.5 });
    expect(parseSpacing("pr-[16.75px]")).toEqual({ paddingRight: 16.75 });
    expect(parseSpacing("pt-[10.5]")).toEqual({ paddingTop: 10.5 });
    expect(parseSpacing("pb-[20.25px]")).toEqual({ paddingBottom: 20.25 });
  });

  it("should parse padding horizontal/vertical with decimal arbitrary values", () => {
    expect(parseSpacing("px-[4.5px]")).toEqual({ paddingHorizontal: 4.5 });
    expect(parseSpacing("py-[10.75]")).toEqual({ paddingVertical: 10.75 });
  });

  it("should parse gap with decimal arbitrary values", () => {
    expect(parseSpacing("gap-[4.5px]")).toEqual({ gap: 4.5 });
    expect(parseSpacing("gap-[4.5]")).toEqual({ gap: 4.5 });
    expect(parseSpacing("gap-[16.75px]")).toEqual({ gap: 16.75 });
    expect(parseSpacing("gap-[0.5]")).toEqual({ gap: 0.5 });
  });

  it("should parse negative margin with decimal arbitrary values", () => {
    expect(parseSpacing("-m-[4.5px]")).toEqual({ margin: -4.5 });
    expect(parseSpacing("-m-[4.5]")).toEqual({ margin: -4.5 });
    expect(parseSpacing("-m-[10.5px]")).toEqual({ margin: -10.5 });
    expect(parseSpacing("-mt-[16.75px]")).toEqual({ marginTop: -16.75 });
    expect(parseSpacing("-ml-[8.25]")).toEqual({ marginLeft: -8.25 });
    expect(parseSpacing("-mx-[12.5px]")).toEqual({ marginHorizontal: -12.5 });
    expect(parseSpacing("-my-[20.75]")).toEqual({ marginVertical: -20.75 });
  });

  it("should parse margin directional with decimal arbitrary values", () => {
    expect(parseSpacing("mt-[4.5px]")).toEqual({ marginTop: 4.5 });
    expect(parseSpacing("mr-[8.25]")).toEqual({ marginRight: 8.25 });
    expect(parseSpacing("mb-[16.75px]")).toEqual({ marginBottom: 16.75 });
    expect(parseSpacing("ml-[12.5]")).toEqual({ marginLeft: 12.5 });
  });

  it("should parse margin horizontal/vertical with decimal arbitrary values", () => {
    expect(parseSpacing("mx-[4.5px]")).toEqual({ marginHorizontal: 4.5 });
    expect(parseSpacing("my-[10.75]")).toEqual({ marginVertical: 10.75 });
  });

  it("should handle edge case decimal values", () => {
    expect(parseSpacing("m-[0.1px]")).toEqual({ margin: 0.1 });
    expect(parseSpacing("p-[0.001]")).toEqual({ padding: 0.001 });
    expect(parseSpacing("gap-[999.999px]")).toEqual({ gap: 999.999 });
    expect(parseSpacing("-m-[0.5]")).toEqual({ margin: -0.5 });
  });
});

describe("parseSpacing - comprehensive coverage", () => {
  it("should parse all margin directions with same value", () => {
    const value = 16;
    expect(parseSpacing("m-4")).toEqual({ margin: value });
    expect(parseSpacing("mx-4")).toEqual({ marginHorizontal: value });
    expect(parseSpacing("my-4")).toEqual({ marginVertical: value });
    expect(parseSpacing("mt-4")).toEqual({ marginTop: value });
    expect(parseSpacing("mr-4")).toEqual({ marginRight: value });
    expect(parseSpacing("mb-4")).toEqual({ marginBottom: value });
    expect(parseSpacing("ml-4")).toEqual({ marginLeft: value });
  });

  it("should parse all padding directions with same value", () => {
    const value = 16;
    expect(parseSpacing("p-4")).toEqual({ padding: value });
    expect(parseSpacing("px-4")).toEqual({ paddingHorizontal: value });
    expect(parseSpacing("py-4")).toEqual({ paddingVertical: value });
    expect(parseSpacing("pt-4")).toEqual({ paddingTop: value });
    expect(parseSpacing("pr-4")).toEqual({ paddingRight: value });
    expect(parseSpacing("pb-4")).toEqual({ paddingBottom: value });
    expect(parseSpacing("pl-4")).toEqual({ paddingLeft: value });
  });

  it("should handle large spacing values", () => {
    expect(parseSpacing("m-96")).toEqual({ margin: 384 });
    expect(parseSpacing("p-96")).toEqual({ padding: 384 });
    expect(parseSpacing("gap-96")).toEqual({ gap: 384 });
  });

  it("should handle arbitrary values across all margin directions", () => {
    expect(parseSpacing("m-[50px]")).toEqual({ margin: 50 });
    expect(parseSpacing("mx-[50px]")).toEqual({ marginHorizontal: 50 });
    expect(parseSpacing("my-[50px]")).toEqual({ marginVertical: 50 });
    expect(parseSpacing("mt-[50px]")).toEqual({ marginTop: 50 });
    expect(parseSpacing("mr-[50px]")).toEqual({ marginRight: 50 });
    expect(parseSpacing("mb-[50px]")).toEqual({ marginBottom: 50 });
    expect(parseSpacing("ml-[50px]")).toEqual({ marginLeft: 50 });
  });

  it("should handle arbitrary values across all padding directions", () => {
    expect(parseSpacing("p-[50px]")).toEqual({ padding: 50 });
    expect(parseSpacing("px-[50px]")).toEqual({ paddingHorizontal: 50 });
    expect(parseSpacing("py-[50px]")).toEqual({ paddingVertical: 50 });
    expect(parseSpacing("pt-[50px]")).toEqual({ paddingTop: 50 });
    expect(parseSpacing("pr-[50px]")).toEqual({ paddingRight: 50 });
    expect(parseSpacing("pb-[50px]")).toEqual({ paddingBottom: 50 });
    expect(parseSpacing("pl-[50px]")).toEqual({ paddingLeft: 50 });
  });
});
