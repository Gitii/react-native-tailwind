/**
 * Shared test helper for Babel plugin transformations
 */

import { transformSync } from "@babel/core";
import babelPlugin, { type PluginOptions } from "../../src/babel/plugin.js";

/**
 * Helper to transform code with the Babel plugin
 */
export function transform(code: string, options?: PluginOptions, includeJsx = false): string {
  const presets = includeJsx
    ? ["@babel/preset-react", ["@babel/preset-typescript", { isTSX: true, allExtensions: true }]]
    : [];

  const result = transformSync(code, {
    presets,
    plugins: [[babelPlugin, options]],
    filename: "test.tsx",
    configFile: false,
    babelrc: false,
  });

  return result?.code ?? "";
}
