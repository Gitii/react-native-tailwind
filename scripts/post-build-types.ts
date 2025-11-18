#!/usr/bin/env node --experimental-strip-types
/**
 * Post-build script to copy react-native.d.ts to dist
 * This ensures the type declarations are available for consumers
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcPath = path.join(__dirname, "../src/react-native.d.ts");
const distPath = path.join(__dirname, "../dist/react-native.d.ts");

// Copy the react-native.d.ts file to dist
fs.copyFileSync(srcPath, distPath);
console.log("✓ Copied react-native.d.ts to dist/");
