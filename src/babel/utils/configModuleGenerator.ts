import fs from "node:fs";
import path from "node:path";

export type FullResolvedTheme = {
  colors: Record<string, string>;
  spacing: Record<string, number>;
  fontFamily: Record<string, string>;
  fontSize: Record<string, number>;
};

type NestedColorValue = string | { [key: string]: NestedColorValue };

/**
 * Rebuilds Tailwind-like nested colors from flat keys.
 *
 * @example
 * unflattenColors({ "blue-500": "#3B82F6", white: "#FFFFFF" })
 * // => { blue: { "500": "#3B82F6" }, white: "#FFFFFF" }
 *
 * @example
 * unflattenColors({ "gray-100": "#F3F4F6", "gray-900": "#111827" })
 * // => { gray: { "100": "#F3F4F6", "900": "#111827" } }
 */
export function unflattenColors(flatColors: Record<string, string>): Record<string, NestedColorValue> {
  const nested: Record<string, NestedColorValue> = {};

  for (const [flatKey, value] of Object.entries(flatColors)) {
    const parts = flatKey.split("-");
    if (parts.length === 1) {
      nested[flatKey] = value;
      continue;
    }

    let current: Record<string, NestedColorValue> = nested;
    for (const part of parts.slice(0, -1)) {
      if (typeof current[part] === "string" || current[part] === undefined) {
        current[part] = {};
      }
      current = current[part] as Record<string, NestedColorValue>;
    }

    const leafKey = parts[parts.length - 1];
    current[leafKey] = value;
  }

  return nested;
}

export function getConfigModulePath(tailwindConfigPath: string): string {
  return path.join(path.dirname(tailwindConfigPath), ".generated.tailwind.config.js");
}

export function generateConfigModule(
  fullTheme: FullResolvedTheme,
  providerImportFrom: string,
  providerImportName: string,
): string {
  const nestedColors = unflattenColors(fullTheme.colors);
  const escapedImportPath = providerImportFrom.replace(/'/g, "\\'");

  return [
    `import { ${providerImportName} } from '${escapedImportPath}';`,
    "",
    "const originalConfig = {",
    "  theme: {",
    `    colors: ${JSON.stringify(nestedColors, null, 2)},`,
    `    spacing: ${JSON.stringify(fullTheme.spacing, null, 2)},`,
    `    fontFamily: ${JSON.stringify(fullTheme.fontFamily, null, 2)},`,
    `    fontSize: ${JSON.stringify(fullTheme.fontSize, null, 2)},`,
    "  },",
    "};",
    "",
    `const _provided = ${providerImportName}(originalConfig);`,
    "",
    "function _flattenColors(colors, prefix = '') {",
    "  const result = {};",
    "  for (const [key, value] of Object.entries(colors)) {",
    "    if (typeof value === 'object' && value !== null) {",
    "      Object.assign(result, _flattenColors(value, prefix ? `${prefix}-${key}` : key));",
    "    } else {",
    "      result[prefix ? `${prefix}-${key}` : key] = value;",
    "    }",
    "  }",
    "  return result;",
    "}",
    "",
    "export const __twConfig = {",
    "  theme: {",
    "    colors: _flattenColors(_provided.theme.colors),",
    "    spacing: _provided.theme.spacing,",
    "    fontFamily: _provided.theme.fontFamily,",
    "    fontSize: _provided.theme.fontSize,",
    "  },",
    "};",
    "",
  ].join("\n");
}

export function writeConfigModule(outputPath: string, content: string): void {
  try {
    if (fs.existsSync(outputPath)) {
      const current = fs.readFileSync(outputPath, "utf8");
      if (current === content) {
        return;
      }
    }

    fs.writeFileSync(outputPath, content, "utf8");
  } catch (error) {
    throw new Error(
      `[react-native-tailwind] Failed to write generated config module at ${outputPath}: ${String(error)}`,
    );
  }
}
