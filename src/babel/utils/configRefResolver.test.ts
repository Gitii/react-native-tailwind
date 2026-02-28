import { describe, expect, it } from "vitest";
import { parseClass } from "../../parser";
import { SPACING_SCALE } from "../../parser/spacing";
import { FONT_SIZES } from "../../parser/typography";
import { COLORS } from "../../utils/colorUtils";
import { resolveConfigRefs, type FullResolvedTheme } from "./configRefResolver";

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

describe("resolveConfigRefs", () => {
  it("maps color classes to config paths", () => {
    expect(resolveConfigRefs("bg-blue-500", baseTheme)).toEqual(
      new Map([["backgroundColor", ["theme", "colors", "blue-500"]]]),
    );
    expect(resolveConfigRefs("text-red-500", baseTheme)).toEqual(
      new Map([["color", ["theme", "colors", "red-500"]]]),
    );
    expect(resolveConfigRefs("border-gray-300", baseTheme)).toEqual(
      new Map([["borderColor", ["theme", "colors", "gray-300"]]]),
    );
    expect(resolveConfigRefs("outline-green-500", baseTheme)).toEqual(
      new Map([["outlineColor", ["theme", "colors", "green-500"]]]),
    );
  });

  it("maps directional border color classes", () => {
    expect(resolveConfigRefs("border-t-blue-500", baseTheme)).toEqual(
      new Map([["borderTopColor", ["theme", "colors", "blue-500"]]]),
    );
    expect(resolveConfigRefs("border-x-blue-500", baseTheme)).toEqual(
      new Map([
        ["borderLeftColor", ["theme", "colors", "blue-500"]],
        ["borderRightColor", ["theme", "colors", "blue-500"]],
      ]),
    );
  });

  it("maps spacing and directional spacing classes", () => {
    expect(resolveConfigRefs("p-4", baseTheme)).toEqual(new Map([["padding", ["theme", "spacing", "4"]]]));
    expect(resolveConfigRefs("m-8", baseTheme)).toEqual(new Map([["margin", ["theme", "spacing", "8"]]]));
    expect(resolveConfigRefs("mx-2", baseTheme)).toEqual(
      new Map([["marginHorizontal", ["theme", "spacing", "2"]]]),
    );
    expect(resolveConfigRefs("py-6", baseTheme)).toEqual(
      new Map([["paddingVertical", ["theme", "spacing", "6"]]]),
    );
    expect(resolveConfigRefs("mt-2", baseTheme)).toEqual(new Map([["marginTop", ["theme", "spacing", "2"]]]));
    expect(resolveConfigRefs("pl-4", baseTheme)).toEqual(
      new Map([["paddingLeft", ["theme", "spacing", "4"]]]),
    );
    expect(resolveConfigRefs("gap-4", baseTheme)).toEqual(new Map([["gap", ["theme", "spacing", "4"]]]));
    expect(resolveConfigRefs("gap-x-2", baseTheme)).toEqual(
      new Map([["columnGap", ["theme", "spacing", "2"]]]),
    );
    expect(resolveConfigRefs("gap-y-2", baseTheme)).toEqual(new Map([["rowGap", ["theme", "spacing", "2"]]]));
  });

  it("maps typography classes", () => {
    expect(resolveConfigRefs("text-xl", baseTheme)).toEqual(
      new Map([["fontSize", ["theme", "fontSize", "xl"]]]),
    );
    expect(resolveConfigRefs("font-sans", baseTheme)).toEqual(
      new Map([["fontFamily", ["theme", "fontFamily", "sans"]]]),
    );
  });

  it("maps sizing classes using spacing scale", () => {
    expect(resolveConfigRefs("w-8", baseTheme)).toEqual(new Map([["width", ["theme", "spacing", "8"]]]));
    expect(resolveConfigRefs("h-4", baseTheme)).toEqual(new Map([["height", ["theme", "spacing", "4"]]]));
    expect(resolveConfigRefs("min-w-8", baseTheme)).toEqual(
      new Map([["minWidth", ["theme", "spacing", "8"]]]),
    );
    expect(resolveConfigRefs("max-w-8", baseTheme)).toEqual(
      new Map([["maxWidth", ["theme", "spacing", "8"]]]),
    );
  });

  it("maps transform translate classes using spacing scale", () => {
    expect(resolveConfigRefs("translate-x-4", baseTheme)).toEqual(
      new Map([["translateX", ["theme", "spacing", "4"]]]),
    );
    expect(resolveConfigRefs("translate-y-2", baseTheme)).toEqual(
      new Map([["translateY", ["theme", "spacing", "2"]]]),
    );
  });

  it("returns empty map for excluded classes", () => {
    expect(resolveConfigRefs("bg-[#ff0000]", baseTheme)).toEqual(new Map());
    expect(resolveConfigRefs("p-[16px]", baseTheme)).toEqual(new Map());
    expect(resolveConfigRefs("bg-blue-500/50", baseTheme)).toEqual(new Map());
    expect(resolveConfigRefs("-m-4", baseTheme)).toEqual(new Map());
    expect(resolveConfigRefs("-translate-x-2", baseTheme)).toEqual(new Map());
  });

  it("returns empty map for unknown keys", () => {
    expect(resolveConfigRefs("bg-fakecololr", baseTheme)).toEqual(new Map());
    expect(resolveConfigRefs("text-not-a-size", baseTheme)).toEqual(new Map());
    expect(resolveConfigRefs("font-not-a-family", baseTheme)).toEqual(new Map());
    expect(resolveConfigRefs("w-nope", baseTheme)).toEqual(new Map());
  });

  it("resolves multiple classes in one string", () => {
    expect(resolveConfigRefs("bg-blue-500 p-4 text-xl", baseTheme)).toEqual(
      new Map([
        ["backgroundColor", ["theme", "colors", "blue-500"]],
        ["padding", ["theme", "spacing", "4"]],
        ["fontSize", ["theme", "fontSize", "xl"]],
      ]),
    );
  });

  it("resolves custom theme colors", () => {
    const customTheme: FullResolvedTheme = {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: "#1bacb5",
      },
    };

    expect(resolveConfigRefs("bg-primary", customTheme)).toEqual(
      new Map([["backgroundColor", ["theme", "colors", "primary"]]]),
    );
  });

  it("disambiguates text-* classes by checking colors before font size", () => {
    const customTheme: FullResolvedTheme = {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        xl: "#123456",
      },
    };

    expect(resolveConfigRefs("text-xl", customTheme)).toEqual(new Map([["color", ["theme", "colors", "xl"]]]));
  });
});

describe("resolveConfigRefs cross-validation", () => {
  const customTheme = {
    colors: baseTheme.colors,
    spacing: baseTheme.spacing,
    fontSize: baseTheme.fontSize,
    fontFamily: baseTheme.fontFamily,
  };

  it("matches parser output property keys for representative theme-derived classes", () => {
    const classes = ["bg-blue-500", "p-4", "text-xl", "font-sans", "w-8", "gap-2", "border-red-500"];

    for (const cls of classes) {
      const parsed = parseClass(cls, customTheme);
      const resolverProps = [...resolveConfigRefs(cls, baseTheme).keys()].sort();
      const parserProps = Object.keys(parsed).sort();
      expect(resolverProps).toEqual(parserProps);
    }
  });
});
