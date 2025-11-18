#!/usr/bin/env node
/**
 * Post-build script to copy react-native.d.ts to dist
 * This ensures the type declarations are available for consumers
 */

const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../src/react-native.d.ts');
const distPath = path.join(__dirname, '../dist/react-native.d.ts');

// Copy the react-native.d.ts file to dist
fs.copyFileSync(srcPath, distPath);
console.log('✓ Copied react-native.d.ts to dist/');
