/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-dynamic-delete */
/**
 * Tailwind config loader for Babel plugin
 * Discovers and loads tailwind.config.* files from the project
 */

import * as fs from "fs";
import * as path from "path";
import { flattenColors } from "../utils/flattenColors";

export type TailwindConfig = {
  theme?: {
    extend?: {
      colors?: Record<string, string | Record<string, string>>;
      fontFamily?: Record<string, string | string[]>;
    };
    colors?: Record<string, string | Record<string, string>>;
    fontFamily?: Record<string, string | string[]>;
  };
};

// Cache configs per path to avoid repeated file I/O
const configCache = new Map<string, TailwindConfig | null>();

/**
 * Find tailwind.config.* file by traversing up from startDir
 */
export function findTailwindConfig(startDir: string): string | null {
  let currentDir = startDir;
  const root = path.parse(currentDir).root;

  const configNames = [
    "tailwind.config.mjs",
    "tailwind.config.js",
    "tailwind.config.cjs",
    "tailwind.config.ts",
  ];

  while (currentDir !== root) {
    for (const configName of configNames) {
      const configPath = path.join(currentDir, configName);
      if (fs.existsSync(configPath)) {
        return configPath;
      }
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}

/**
 * Load and parse tailwind config file
 */
export function loadTailwindConfig(configPath: string): TailwindConfig | null {
  // Check cache
  if (configCache.has(configPath)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return configCache.get(configPath)!;
  }

  try {
    // Clear require cache to allow hot reloading
    const resolvedPath = require.resolve(configPath);
    delete require.cache[resolvedPath];

    // Load config
    const config = require(configPath) as TailwindConfig | { default: TailwindConfig };

    // Handle both default export and direct export
    const resolved: TailwindConfig = "default" in config ? config.default : config;

    configCache.set(configPath, resolved);
    return resolved;
  } catch (error) {
    /* v8 ignore next 3 */
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[react-native-tailwind] Failed to load config from ${configPath}:`, error);
    }
    configCache.set(configPath, null);
    return null;
  }
}

/**
 * Custom theme configuration extracted from tailwind.config
 */
export type CustomTheme = {
  colors: Record<string, string>;
  fontFamily: Record<string, string>;
};

/**
 * Extract all custom theme extensions from tailwind config
 * Prefers theme.extend.* over theme.* to avoid overriding defaults
 */
export function extractCustomTheme(filename: string): CustomTheme {
  const projectDir = path.dirname(filename);
  const configPath = findTailwindConfig(projectDir);

  if (!configPath) {
    return { colors: {}, fontFamily: {} };
  }

  const config = loadTailwindConfig(configPath);
  if (!config?.theme) {
    return { colors: {}, fontFamily: {} };
  }

  // Extract colors
  /* v8 ignore next 5 */
  if (config.theme.colors && !config.theme.extend?.colors && process.env.NODE_ENV !== "production") {
    console.warn(
      "[react-native-tailwind] Using theme.colors will override all default colors. " +
        "Use theme.extend.colors to add custom colors while keeping defaults.",
    );
  }
  const colors = config.theme.extend?.colors ?? config.theme.colors ?? {};

  // Extract fontFamily
  /* v8 ignore next 5 */
  if (config.theme.fontFamily && !config.theme.extend?.fontFamily && process.env.NODE_ENV !== "production") {
    console.warn(
      "[react-native-tailwind] Using theme.fontFamily will override all default font families. " +
        "Use theme.extend.fontFamily to add custom fonts while keeping defaults.",
    );
  }
  const fontFamily = config.theme.extend?.fontFamily ?? config.theme.fontFamily ?? {};

  // Convert fontFamily values to strings (take first value if array)
  const fontFamilyResult: Record<string, string> = {};
  for (const [key, value] of Object.entries(fontFamily)) {
    if (Array.isArray(value)) {
      // Take first font in the array (React Native doesn't support font stacks)
      fontFamilyResult[key] = value[0];
    } else {
      fontFamilyResult[key] = value;
    }
  }

  return {
    colors: flattenColors(colors),
    fontFamily: fontFamilyResult,
  };
}
