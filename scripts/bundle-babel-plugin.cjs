#!/usr/bin/env node
/**
 * Bundle the Babel plugin with all dependencies into a single CommonJS file
 */

const esbuild = require('esbuild');
const path = require('path');

async function bundle() {
  try {
    await esbuild.build({
      entryPoints: [path.join(__dirname, '..', 'src', 'babel', 'index.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      outfile: path.join(__dirname, '..', 'dist', 'babel', 'index.cjs'),
      external: [
        '@babel/core',
        '@babel/types',
        '@babel/runtime',
      ],
      minify: false,
      sourcemap: false,
    });
    console.log('✓ Babel plugin bundled successfully');
  } catch (error) {
    console.error('✗ Failed to bundle Babel plugin:', error);
    process.exit(1);
  }
}

bundle();
