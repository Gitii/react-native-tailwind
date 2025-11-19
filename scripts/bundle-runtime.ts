#!/usr/bin/env node --experimental-strip-types
/**
 * Bundle the runtime module for React Native
 * Creates both ESM and CommonJS outputs
 */

import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bundle(): Promise<void> {
  const sharedOptions: esbuild.BuildOptions = {
    entryPoints: [path.join(__dirname, "..", "src", "runtime.ts")],
    bundle: true,
    platform: "neutral", // Works in both Node.js and React Native
    target: ["es2017"], // React Native compatibility
    external: ["react-native"], // Don't bundle React Native
    sourcemap: true,
    minify: true,
  };

  try {
    // Build ESM version
    await esbuild.build({
      ...sharedOptions,
      format: "esm",
      outfile: path.join(__dirname, "..", "dist", "runtime.js"),
    });
    console.log("✓ Built ESM runtime bundle: dist/runtime.js");

    // Build CommonJS version
    await esbuild.build({
      ...sharedOptions,
      format: "cjs",
      outfile: path.join(__dirname, "..", "dist", "runtime.cjs"),
    });
    console.log("✓ Built CommonJS runtime bundle: dist/runtime.cjs");
  } catch (error) {
    console.error("✗ Failed to bundle runtime:", error);
    process.exit(1);
  }
}

void bundle();
