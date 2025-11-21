import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "src",
        replacement: resolve(__dirname, "src"),
      },
      {
        find: "test",
        replacement: resolve(__dirname, "test"),
      },
    ],
  },
  test: {
    include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    setupFiles: ["./test/setup.ts"],
    globals: true,
    coverage: {
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/types/**", "src/components/**", "**/*.d.ts", "**/*.test.ts", "**/*.test.tsx"],
    },
    server: {
      deps: {
        external: ["react-native"],
      },
    },
    resolveSnapshotPath: (testPath, snapExtension) => {
      return testPath.replace(/src\//, "test/snapshots/") + snapExtension;
    },
  },
});
