---
title: Quick Start
description: Set up React Native Tailwind in your project
---

## 1. Add Babel Plugin

Update your `babel.config.js` to include the React Native Tailwind plugin:

```javascript
module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    "@mgcrea/react-native-tailwind/babel", // Add this line
  ],
};
```

## 2. Enable TypeScript Support (TypeScript Projects)

Create a type declaration file in your project to enable `className` prop autocomplete:

**Create `src/types/react-native-tailwind.d.ts`:**

```typescript
import "@mgcrea/react-native-tailwind/react-native";
```

This file will be automatically picked up by TypeScript and enables autocomplete for the `className` prop on all React Native components.

:::note
**Why is this needed?** TypeScript module augmentation requires the declaration file to be part of your project's compilation context. This one-time setup ensures the `className` prop is recognized throughout your codebase.
:::

## 3. Start Using className

You're ready to use Tailwind-style classes in your React Native components!

```tsx
import { View, Text } from "react-native";

export function MyComponent() {
  return (
    <View className="flex-1 bg-gray-100 p-4">
      <Text className="text-xl font-bold text-blue-500">Hello, Tailwind!</Text>
    </View>
  );
}
```

## Clear Metro Cache (If Needed)

After adding the Babel plugin, you may need to clear Metro's cache:

```bash
npx react-native start --reset-cache
```

## What's Next?

- Learn [How It Works](/react-native-tailwind/getting-started/how-it-works/) to understand the compile-time transformation
- Explore [Basic Usage](/react-native-tailwind/guides/basic-usage/) examples
- Check out the [API Reference](/react-native-tailwind/reference/spacing/) for available utilities
