---
title: Introduction
description: Compile-time Tailwind CSS for React Native with zero runtime overhead
---

Compile-time Tailwind CSS for React Native with zero runtime overhead. Transform `className` props to optimized `StyleSheet.create()` calls at build time.

## Features

- **⚡ Zero Runtime Overhead** - All transformations happen at compile time
- **🔧 No Dependencies** - Direct-to-React-Native style generation without tailwindcss package
- **🎯 Babel-only Setup** - No Metro configuration required
- **📝 TypeScript-first** - Full type safety and autocomplete support
- **🚀 Optimized Performance** - Compiles down to StyleSheet.create for optimal performance
- **📦 Small Bundle Size** - Only includes actual styles used in your app
- **🎨 Custom Colors** - Extend the default palette via tailwind.config.*
- **📐 Arbitrary Values** - Use custom sizes and borders: `w-[123px]`, `rounded-[20px]`
- **🔀 Dynamic className** - Conditional styles with hybrid compile-time optimization
- **🏃 Runtime Option** - Optional tw template tag for fully dynamic styling (~25KB)
- **🎯 State Modifiers** - `active:`, `hover:`, `focus:`, and `disabled:` modifiers for interactive components
- **📱 Platform Modifiers** - `ios:`, `android:`, and `web:` modifiers for platform-specific styling
- **🌓 Color Scheme Modifiers** - `dark:` and `light:` modifiers for automatic theme adaptation
- **🎨 Scheme Modifier** - `scheme:` convenience modifier that expands to both dark: and light: variants
- **📜 Special Style Props** - Support for `contentContainerClassName`, `columnWrapperClassName`, and more
- **🎛️ Custom Attributes** - Configure which props to transform with exact matching or glob patterns

## Quick Example

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

**Transforms to:**

```tsx
import { StyleSheet } from "react-native";

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
    backgroundColor: "#F3F4F6",
    padding: 16,
  },
  _font_bold_text_blue_500_text_xl: {
    fontWeight: "700",
    color: "#3B82F6",
    fontSize: 20,
  },
});
```

## Getting Started

Follow the [installation guide](/react-native-tailwind/getting-started/installation/) to set up React Native Tailwind in your project, then check out the [quick start](/react-native-tailwind/getting-started/quick-start/) to learn the basics.
