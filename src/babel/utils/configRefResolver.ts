export type FullResolvedTheme = {
  colors: Record<string, string>;
  spacing: Record<string, number>;
  fontSize: Record<string, number>;
  fontFamily: Record<string, string>;
};

const BORDER_DIRECTION_TO_PROPERTY: Record<string, string[]> = {
  t: ["borderTopColor"],
  r: ["borderRightColor"],
  b: ["borderBottomColor"],
  l: ["borderLeftColor"],
  x: ["borderLeftColor", "borderRightColor"],
  y: ["borderTopColor", "borderBottomColor"],
};

const MARGIN_DIRECTION_TO_PROPERTY: Record<string, string> = {
  "": "margin",
  x: "marginHorizontal",
  y: "marginVertical",
  t: "marginTop",
  r: "marginRight",
  b: "marginBottom",
  l: "marginLeft",
  s: "marginStart",
  e: "marginEnd",
};

const PADDING_DIRECTION_TO_PROPERTY: Record<string, string> = {
  "": "padding",
  x: "paddingHorizontal",
  y: "paddingVertical",
  t: "paddingTop",
  r: "paddingRight",
  b: "paddingBottom",
  l: "paddingLeft",
  s: "paddingStart",
  e: "paddingEnd",
};

const GAP_DIRECTION_TO_PROPERTY: Record<string, string> = {
  "": "gap",
  x: "columnGap",
  y: "rowGap",
};

const OUTLINE_STYLE_KEYS = new Set(["solid", "dashed", "dotted", "none"]);

type ParsedRef = [property: string, key: string];

/**
 * Resolve class names into config reference paths.
 *
 * @example
 * resolveConfigRefs("bg-blue-500 p-4", theme)
 * // Map {
 * //   "backgroundColor" => ["theme", "colors", "blue-500"],
 * //   "padding" => ["theme", "spacing", "4"]
 * // }
 */
export function resolveConfigRefs(className: string, fullTheme: FullResolvedTheme): Map<string, string[]> {
  const refs = new Map<string, string[]>();
  const classes = className.split(/\s+/).filter(Boolean);

  for (const cls of classes) {
    if (isArbitraryValue(cls) || isOpacityModified(cls) || isNegated(cls)) {
      continue;
    }

    const directionalBorderMatch = cls.match(/^border-([xy])-(.+)$/);
    if (directionalBorderMatch) {
      const direction = directionalBorderMatch[1];
      const key = directionalBorderMatch[2];
      const properties = BORDER_DIRECTION_TO_PROPERTY[direction] ?? [];
      if (hasKey(fullTheme.colors, key)) {
        for (const property of properties) {
          refs.set(property, ["theme", "colors", key]);
        }
      }
      continue;
    }

    const colorMatch = parseColorClass(cls, fullTheme.colors);
    if (colorMatch) {
      const [property, key] = colorMatch;
      refs.set(property, ["theme", "colors", key]);
      continue;
    }

    const spacingMatch = parseSpacingClass(cls, fullTheme.spacing);
    if (spacingMatch) {
      const [property, key] = spacingMatch;
      refs.set(property, ["theme", "spacing", key]);
      continue;
    }

    const typographyMatch = parseTypographyClass(cls, fullTheme);
    if (typographyMatch) {
      const [property, key] = typographyMatch;
      const scale = property === "fontFamily" ? "fontFamily" : "fontSize";
      refs.set(property, ["theme", scale, key]);
      continue;
    }

    const sizingMatch = parseSizingClass(cls, fullTheme.spacing);
    if (sizingMatch) {
      const [property, key] = sizingMatch;
      refs.set(property, ["theme", "spacing", key]);
      continue;
    }

    const transformMatch = parseTransformClass(cls, fullTheme.spacing);
    if (transformMatch) {
      const [property, key] = transformMatch;
      refs.set(property, ["theme", "spacing", key]);
    }
  }

  return refs;
}

export function isArbitraryValue(cls: string): boolean {
  return cls.includes("[") && cls.includes("]");
}

export function isOpacityModified(cls: string): boolean {
  return cls.includes("/");
}

export function isNegated(cls: string): boolean {
  return cls.startsWith("-");
}

export function parseColorClass(cls: string, colors: Record<string, string>): ParsedRef | null {
  if (cls.startsWith("bg-")) {
    const key = cls.substring(3);
    return hasKey(colors, key) ? ["backgroundColor", key] : null;
  }

  if (cls.startsWith("text-")) {
    const key = cls.substring(5);
    return hasKey(colors, key) ? ["color", key] : null;
  }

  const directionalBorderMatch = cls.match(/^border-([trblxy])-(.+)$/);
  if (directionalBorderMatch) {
    const direction = directionalBorderMatch[1];
    const key = directionalBorderMatch[2];
    if (!hasKey(colors, key)) {
      return null;
    }
    const props = BORDER_DIRECTION_TO_PROPERTY[direction];
    return props ? [props[0], key] : null;
  }

  if (cls.startsWith("border-") && !/^border-[0-9]/.test(cls)) {
    const key = cls.substring(7);
    return hasKey(colors, key) ? ["borderColor", key] : null;
  }

  if (cls.startsWith("outline-") && !/^outline-[0-9]/.test(cls) && !cls.startsWith("outline-offset-")) {
    const key = cls.substring(8);
    if (OUTLINE_STYLE_KEYS.has(key)) {
      return null;
    }
    return hasKey(colors, key) ? ["outlineColor", key] : null;
  }

  return null;
}

export function parseSpacingClass(cls: string, spacing: Record<string, number>): ParsedRef | null {
  const marginMatch = cls.match(/^m([xytrblse]?)-(.+)$/);
  if (marginMatch) {
    const direction = marginMatch[1];
    const key = marginMatch[2];
    const property = MARGIN_DIRECTION_TO_PROPERTY[direction];
    if (property && hasKey(spacing, key)) {
      return [property, key];
    }
  }

  const paddingMatch = cls.match(/^p([xytrblse]?)-(.+)$/);
  if (paddingMatch) {
    const direction = paddingMatch[1];
    const key = paddingMatch[2];
    const property = PADDING_DIRECTION_TO_PROPERTY[direction];
    if (property && hasKey(spacing, key)) {
      return [property, key];
    }
  }

  const gapMatch = cls.match(/^gap(?:-([xy]))?-(.+)$/);
  if (gapMatch) {
    const direction = gapMatch[1] ?? "";
    const key = gapMatch[2];
    const property = GAP_DIRECTION_TO_PROPERTY[direction];
    if (property && hasKey(spacing, key)) {
      return [property, key];
    }
  }

  return null;
}

export function parseTypographyClass(cls: string, theme: FullResolvedTheme): ParsedRef | null {
  if (cls.startsWith("text-")) {
    const key = cls.substring(5);
    if (hasKey(theme.colors, key)) {
      return ["color", key];
    }
    if (hasKey(theme.fontSize, key)) {
      return ["fontSize", key];
    }
  }

  if (cls.startsWith("font-")) {
    const key = cls.substring(5);
    if (hasKey(theme.fontFamily, key)) {
      return ["fontFamily", key];
    }
  }

  return null;
}

function parseSizingClass(cls: string, spacing: Record<string, number>): ParsedRef | null {
  const prefixes: Array<[prefix: string, property: string]> = [
    ["min-w-", "minWidth"],
    ["max-w-", "maxWidth"],
    ["min-h-", "minHeight"],
    ["max-h-", "maxHeight"],
    ["w-", "width"],
    ["h-", "height"],
  ];

  for (const [prefix, property] of prefixes) {
    if (cls.startsWith(prefix)) {
      const key = cls.substring(prefix.length);
      return hasKey(spacing, key) ? [property, key] : null;
    }
  }

  return null;
}

function parseTransformClass(cls: string, spacing: Record<string, number>): ParsedRef | null {
  if (cls.startsWith("translate-x-")) {
    const key = cls.substring(12);
    return hasKey(spacing, key) ? ["translateX", key] : null;
  }

  if (cls.startsWith("translate-y-")) {
    const key = cls.substring(12);
    return hasKey(spacing, key) ? ["translateY", key] : null;
  }

  return null;
}

function hasKey<T>(record: Record<string, T>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}
