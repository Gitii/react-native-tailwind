import baseConfig from "@mgcrea/eslint-config-react-native";

const config = [
  ...baseConfig,
  {
    rules: {
      "@typescript-eslint/prefer-regexp-exec": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
    },
  },
  {
    ignores: [".idea/**", "example/**", "test/**"],
  },
  {
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];

export default config;
