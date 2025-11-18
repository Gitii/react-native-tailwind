#!/usr/bin/env node --experimental-strip-types
/**
 * Bundle the Babel plugin with all dependencies into a single CommonJS file
 */

import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bundle(): Promise<void> {
  try {
    await esbuild.build({
      entryPoints: [path.join(__dirname, "..", "src", "babel", "index.ts")],
      bundle: true,
      platform: "node",
      target: "node18",
      format: "cjs",
      outfile: path.join(__dirname, "..", "dist", "babel", "index.cjs"),
      external: ["@babel/core", "@babel/types", "@babel/runtime"],
      minify: false,
      sourcemap: false,
    });
    console.log("✓ Babel plugin bundled successfully");
  } catch (error) {
    console.error("✗ Failed to bundle Babel plugin:", error);
    process.exit(1);
  }
}

void bundle();
