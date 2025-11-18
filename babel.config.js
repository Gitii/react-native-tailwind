export default {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    [
      "module-resolver",
      {
        alias: {
          src: "./src",
        },
      },
    ],
  ],
  overrides: [
    {
      // Special handling for the babel plugin - output as CommonJS
      test: /src\/babel\/index\.ts$/,
      presets: [
        [
          "@babel/preset-typescript",
          {
            allowDeclareFields: true,
          },
        ],
      ],
      plugins: [
        [
          "@babel/plugin-transform-modules-commonjs",
          {
            importInterop: "babel",
          },
        ],
      ],
    },
  ],
};
