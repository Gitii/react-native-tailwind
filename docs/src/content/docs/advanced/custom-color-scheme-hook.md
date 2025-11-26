---
title: Custom Color Scheme Hook
description: Use custom color scheme hooks from theme providers
---

By default, the plugin uses React Native's built-in `useColorScheme()` hook for `dark:` and `light:` modifiers. You can configure it to use a custom color scheme hook from theme providers like React Navigation, Expo, or your own implementation.

## Configuration

```javascript
// babel.config.js
module.exports = {
  plugins: [
    [
      "@mgcrea/react-native-tailwind/babel",
      {
        colorScheme: {
          importFrom: "@/hooks/useColorScheme", // Module to import from
          importName: "useColorScheme",          // Hook name to import
        },
      },
    ],
  ],
};
```

## Use Cases

### Custom Theme Provider

Override system color scheme with user preferences from a store:

```typescript
// src/hooks/useColorScheme.ts
import { useColorScheme as useSystemColorScheme } from "react-native";
import { profileStore } from "@/stores/profileStore";
import { type ColorSchemeName } from "react-native";

export const useColorScheme = (): ColorSchemeName => {
  const systemColorScheme = useSystemColorScheme();
  const userTheme = profileStore.theme; // 'dark' | 'light' | 'auto'

  // Return user preference, or fall back to system if set to 'auto'
  return userTheme === 'auto' ? systemColorScheme : userTheme;
};
```

```javascript
// babel.config.js
{
  colorScheme: {
    importFrom: "@/hooks/useColorScheme",
    importName: "useColorScheme"
  }
}
```

### React Navigation Theme

Integrate with React Navigation's theme system:

```typescript
// hooks/useColorScheme.ts
import { useTheme as useNavTheme } from "@react-navigation/native";
import { type ColorSchemeName } from "react-native";

export const useColorScheme = (): ColorSchemeName => {
  const { dark } = useNavTheme();
  return dark ? "dark" : "light";
};
```

```javascript
// babel.config.js
{
  colorScheme: {
    importFrom: "@/hooks/useColorScheme",
    importName: "useColorScheme"
  }
}
```

### Expo Router Theme

Use Expo Router's theme hook:

```javascript
// babel.config.js
{
  colorScheme: {
    importFrom: "expo-router",
    importName: "useColorScheme"
  }
}
```

### Testing

Mock color scheme for tests:

```typescript
// test/mocks/useColorScheme.ts
export const useColorScheme = () => "light"; // Or "dark" for dark mode tests
```

```javascript
// babel.config.js (test environment)
{
  colorScheme: {
    importFrom: "@/test/mocks/useColorScheme",
    importName: "useColorScheme"
  }
}
```

## How It Works

When you use `dark:` or `light:` modifiers:

```tsx
<View className="bg-white dark:bg-gray-900" />
```

The plugin will:

1. Import your custom hook: `import { useColorScheme } from "@/hooks/useColorScheme"`
2. Inject it in components: `const _twColorScheme = useColorScheme();`
3. Generate conditionals: `_twColorScheme === "dark" && styles._dark_bg_gray_900`

## Default Behavior

Without custom configuration, the plugin uses React Native's built-in hook:

```typescript
import { useColorScheme } from "react-native"
```

This works out of the box for basic system color scheme detection.

## Requirements

- Your custom hook must return `ColorSchemeName` (type from React Native: `"light" | "dark" | null | undefined`)
- The hook must be compatible with React's rules of hooks (can only be called in function components)
- Import merging works automatically if you already import from the same source

## Complete Example

```typescript
// src/context/ThemeContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import { type ColorSchemeName } from "react-native";

type ThemeContextType = {
  colorScheme: ColorSchemeName;
  setColorScheme: (scheme: "light" | "dark" | "auto") => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [userPreference, setUserPreference] = useState<"light" | "dark" | "auto">("auto");

  const colorScheme = userPreference === "auto" ? systemColorScheme : userPreference;

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme: setUserPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useColorScheme(): ColorSchemeName {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useColorScheme must be used within ThemeProvider");
  return context.colorScheme;
}
```

```javascript
// babel.config.js
module.exports = {
  plugins: [
    [
      "@mgcrea/react-native-tailwind/babel",
      {
        colorScheme: {
          importFrom: "@/context/ThemeContext",
          importName: "useColorScheme",
        },
      },
    ],
  ],
};
```

Now your components will use the custom hook:

```tsx
function MyComponent() {
  // Uses your custom useColorScheme from ThemeContext
  return (
    <View className="bg-white dark:bg-gray-900">
      <Text className="text-gray-900 dark:text-white">Theme-aware text</Text>
    </View>
  );
}
```

## Related

- [Color Scheme](/react-native-tailwind/guides/color-scheme/) - Using color scheme modifiers
- [Babel Configuration](/react-native-tailwind/advanced/babel-configuration/) - All plugin options
- [Custom Colors](/react-native-tailwind/advanced/custom-colors/) - Extend color palette
