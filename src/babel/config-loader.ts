/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-dynamic-delete */
/**
 * Tailwind config loader for Babel plugin
 * Discovers and loads tailwind.config.* files from the project
 */

import * as fs from "fs";
import * as path from "path";

export type TailwindConfig = {
  theme?: {
    extend?: {
      colors?: Record<string, string | Record<string, string>>;
    };
    colors?: Record<string, string | Record<string, string>>;
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
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[react-native-tailwind] Failed to load config from ${configPath}:`, error);
    }
    configCache.set(configPath, null);
    return null;
  }
}

/**
 * Flatten nested color objects into dot notation
 * Example: { brand: { light: '#fff', dark: '#000' } } -> { 'brand-light': '#fff', 'brand-dark': '#000' }
 */
function flattenColors(
  colors: Record<string, string | Record<string, string>>,
  prefix = "",
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(colors)) {
    const newKey = prefix ? `${prefix}-${key}` : key;

    if (typeof value === "string") {
      result[newKey] = value;
    } else if (typeof value === "object" && value !== null) {
      Object.assign(result, flattenColors(value, newKey));
    }
  }

  return result;
}

/**
 * Extract custom colors from tailwind config
 * Prefers theme.extend.colors over theme.colors to avoid overriding defaults
 */
export function extractCustomColors(filename: string): Record<string, string> {
  const projectDir = path.dirname(filename);
  const configPath = findTailwindConfig(projectDir);

  if (!configPath) {
    return {};
  }

  const config = loadTailwindConfig(configPath);
  if (!config?.theme) {
    return {};
  }

  // Warn if using theme.colors instead of theme.extend.colors
  if (config.theme.colors && !config.theme.extend?.colors && process.env.NODE_ENV !== "production") {
    console.warn(
      "[react-native-tailwind] Using theme.colors will override all default colors. " +
        "Use theme.extend.colors to add custom colors while keeping defaults.",
    );
  }

  // Prefer theme.extend.colors
  const colors = config.theme.extend?.colors ?? config.theme.colors ?? {};

  return flattenColors(colors);
}
