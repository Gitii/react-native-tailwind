# Init-Only Themes

Right now, the tailwind config is resolved at build time and fonts, spacing and colors are resolved also at build time.
That enables very good performance but it also means that we can't change the theme at runtime.

## Motivation

Android supports dynamic colors based on the user's wallpaper and preferences, and it would be great to be able to adapt the theme of the app to match the system theme.

## Proposal

Optionally, the actual values are resolved once during module creation.
In each module, stylesheets are created using resolved (literal) values.
Instead of using the resolved values, we can reference the theme values in the stylesheets and resolve them at runtime - during **cretation** of the module.

## Example

```jsx
import { View, Text } from "react-native";

export function MyComponent() {
  return (
    <View className="flex-1 bg-gray-100 p-4">
      <Text className="text-xl font-bold text-blue-500">Hello, Tailwind!</Text>
    </View>
  );
}
```

```js
module.exports = {
  plugins: [
    [
      "@mgcrea/react-native-tailwind/babel",
      {
        configProvider: {
            importFrom: "/absolute-path-or-module/to/some-where/my-config-provider.js",
            importName: "provideConfig", // signature: <T>(originalConfig: T) => T
        }
      },
    ],
  ],
};
```

```jsx
import { StyleSheet } from "react-native";
import { __twConfig } from "./.generated.tailwind.config.js";

export function MyComponent() {
  return (
    <View style={_twStyles._bg_gray_100_flex_1_p_4}>
      <Text style={_twStyles._font_bold_text_blue_500_text_xl}>Hello, Tailwind!</Text>
    </View>
  );
}

const _twStyles = StyleSheet.create({
  _bg_gray_100_flex_1_p_4: {
    flex: 1,
    backgroundColor: __twConfig.theme.colors.gray[100], // "#F3F4F6",
    padding: __twConfig.theme.spacing[4], // 16,
  },
  _font_bold_text_blue_500_text_xl: {
    fontWeight: __twConfig.theme.fontWeight.bold, // "700",
    color: __twConfig.theme.colors.blue[500], // "#3B82F6",
    fontSize: __twConfig.theme.fontSize.xl, // 20,
  },
});
```

```jsx
// .generated.tailwind.config.js

import { provideConfig } from "/absolute-path-or-module/to/some-where/my-config-provider.js"; 

// Original config from tailwind.config.js, inlined here during build time.
const originalConfig = { 
  theme: {
    colors: {
      gray: {
        100: "#F3F4F6",
      },
      blue: {
        500: "#3B82F6",
      },
    },
    spacing: {
      4: 16,
    },
    fontWeight: {
      bold: "700",
    },
    fontSize: {
      xl: 20,
    },
  },
};

// The actual config is resolved once during module creation and never changes after that.
// The provider is responsible for merging the original config with the custom values and returning the final config.
// Original and final config must have the same shape, otherwise the generated stylesheets will be broken.
export const __twConfig = provideConfig(originalConfig);

```
## Open Questions

- Light/dark mode support SHOULD be easy to adapt, the idea is the same. Because we "just" move the point of resolution, we can still support the same features as before, but with the ability to change the theme at runtime once.
