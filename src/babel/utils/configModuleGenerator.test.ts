import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { generateConfigModule, getConfigModulePath, writeConfigModule } from "./configModuleGenerator";

const fullTheme = {
  colors: {
    "blue-500": "#3B82F6",
    "blue-600": "#2563EB",
    "gray-100": "#F3F4F6",
    white: "#FFFFFF",
  },
  spacing: {
    4: 16,
  },
  fontFamily: {
    sans: "System",
  },
  fontSize: {
    xl: 20,
  },
};

const tempDirs: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function createTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tw-config-generator-"));
  tempDirs.push(dir);
  return dir;
}

describe("generateConfigModule", () => {
  it("returns a string with the default import statement", () => {
    const source = generateConfigModule(fullTheme, "@/provider", "provideConfig");
    expect(source).toContain("import { provideConfig } from '@/provider';");
  });

  it("generates originalConfig with nested colors, not flat colors", () => {
    const source = generateConfigModule(fullTheme, "./provider.js", "provideConfig");
    expect(source).toContain('"blue": {');
    expect(source).toContain('"500": "#3B82F6"');
    expect(source).toContain('"600": "#2563EB"');
    expect(source).toContain('"gray": {');
    expect(source).toContain('"100": "#F3F4F6"');
    expect(source).not.toContain('"blue-500": "#3B82F6"');
  });

  it("includes flatten helper and flatten call in __twConfig export", () => {
    const source = generateConfigModule(fullTheme, "./provider.js", "provideConfig");
    expect(source).toContain("function _flattenColors(colors, prefix = '') {");
    expect(source).toContain("colors: _flattenColors(_provided.theme.colors),");
  });

  it("passes spacing, fontFamily, and fontSize through without flattening", () => {
    const source = generateConfigModule(fullTheme, "./provider.js", "provideConfig");
    expect(source).toContain("spacing: _provided.theme.spacing,");
    expect(source).toContain("fontFamily: _provided.theme.fontFamily,");
    expect(source).toContain("fontSize: _provided.theme.fontSize,");
  });

  it("supports a custom provider import name", () => {
    const source = generateConfigModule(fullTheme, "./provider.js", "resolveTheme");
    expect(source).toContain("import { resolveTheme } from './provider.js';");
    expect(source).toContain("const _provided = resolveTheme(originalConfig);");
  });
});

describe("writeConfigModule", () => {
  it("writes module content to disk", () => {
    const dir = createTempDir();
    const filePath = path.join(dir, ".generated.tailwind.config.js");
    writeConfigModule(filePath, "export const ok = true;\n");
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.readFileSync(filePath, "utf8")).toBe("export const ok = true;\n");
  });

  it("is idempotent and only writes when content changes", () => {
    const writeSpy = vi.spyOn(fs, "writeFileSync");
    const dir = createTempDir();
    const filePath = path.join(dir, ".generated.tailwind.config.js");

    writeConfigModule(filePath, "first\n");
    writeConfigModule(filePath, "first\n");
    writeConfigModule(filePath, "second\n");

    expect(writeSpy).toHaveBeenCalledTimes(2);
    expect(fs.readFileSync(filePath, "utf8")).toBe("second\n");
  });
});

describe("getConfigModulePath", () => {
  it("returns .generated.tailwind.config.js next to the tailwind config", () => {
    const result = getConfigModulePath("/repo/mobile/tailwind.config.ts");
    expect(result).toBe(path.join("/repo/mobile", ".generated.tailwind.config.js"));
  });
});

describe("integration", () => {
  it("generates valid JavaScript that passes node --check", () => {
    const dir = createTempDir();
    const providerPath = path.join(dir, "provider.js");
    const generatedPath = path.join(dir, ".generated.tailwind.config.js");

    fs.writeFileSync(providerPath, "export function provideConfig(config) { return config; }\n", "utf8");
    const source = generateConfigModule(fullTheme, "./provider.js", "provideConfig");
    writeConfigModule(generatedPath, source);

    expect(() => execFileSync("node", ["--check", generatedPath], { encoding: "utf8" })).not.toThrow();
  });

  it("passes nested colors to provider and exports flattened runtime colors", async () => {
    const dir = createTempDir();
    const providerPath = path.join(dir, "provider.js");
    const generatedPath = path.join(dir, ".generated.tailwind.config.js");

    fs.writeFileSync(
      providerPath,
      [
        "export function provideConfig(config) {",
        "  if (!config.theme.colors.blue || !config.theme.colors.blue['500']) {",
        "    throw new Error('Provider did not receive nested colors');",
        "  }",
        "  return {",
        "    theme: {",
        "      ...config.theme,",
        "      colors: {",
        "        ...config.theme.colors,",
        "        green: { 500: '#22C55E' },",
        "      },",
        "    },",
        "  };",
        "}",
        "",
      ].join("\n"),
      "utf8",
    );

    const source = generateConfigModule(fullTheme, "./provider.js", "provideConfig");
    writeConfigModule(generatedPath, source);

    const mod = (await import(`${pathToFileURL(generatedPath).href}?v=${Date.now()}`)) as {
      __twConfig: {
        theme: {
          colors: Record<string, string>;
          spacing: Record<string, number>;
          fontFamily: Record<string, string>;
          fontSize: Record<string, number>;
        };
      };
    };
    expect(mod.__twConfig.theme.colors["blue-500"]).toBe("#3B82F6");
    expect(mod.__twConfig.theme.colors["green-500"]).toBe("#22C55E");
    expect(mod.__twConfig.theme.colors.white).toBe("#FFFFFF");
    expect(mod.__twConfig.theme.spacing["4"]).toBe(16);
    expect(mod.__twConfig.theme.fontFamily.sans).toBe("System");
    expect(mod.__twConfig.theme.fontSize.xl).toBe(20);
  });
});
