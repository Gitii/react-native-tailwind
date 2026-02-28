/**
 * Shared test helper for Babel plugin transformations
 */

import { transformSync } from "@babel/core";
import babelPlugin, { type PluginOptions } from "../../src/babel/plugin.js";

/**
 * Helper to transform code with the Babel plugin
 *
 * @param code - The source code to transform
 * @param options - Plugin options (e.g., configProvider, colorScheme)
 * @param includeJsx - Whether to include JSX/TypeScript presets (default: false)
 * @returns The transformed code
 *
 * @example
 * // Basic transformation
 * const output = transform('<View className="m-4" />', undefined, true);
 *
 * @example
 * // With configProvider option
 * const output = transform(
 *   '<View className="m-4" />',
 *   { configProvider: { importFrom: './my-provider' } },
 *   true
 * );
 */
export function transform(
  code: string,
  options?: PluginOptions,
  includeJsx = false,
  filename = "/mock/project/src/test.tsx",
): string {
  const presets = includeJsx
    ? ["@babel/preset-react", ["@babel/preset-typescript", { isTSX: true, allExtensions: true }]]
    : [];

  const result = transformSync(code, {
    presets,
    plugins: [[babelPlugin, options]],
    filename,
    configFile: false,
    babelrc: false,
  });

  return result?.code ?? "";
}

/**
 * Convenience wrapper for transforming code with configProvider option
 *
 * @param code - The source code to transform
 * @param configProviderImportFrom - The import path for the config provider
 * @param options - Additional plugin options
 * @returns The transformed code
 *
 * @example
 * const output = transformWithConfig(
 *   '<View className="bg-blue-500" />',
 *   './my-provider'
 * );
 */
export function transformWithConfig(
  code: string,
  configProviderImportFrom: string,
  options?: Partial<PluginOptions>,
  filename = "/mock/project/src/test.tsx",
): string {
  return transform(
    code,
    {
      ...options,
      configProvider: { importFrom: configProviderImportFrom },
    },
    true,
    filename,
  );
}
