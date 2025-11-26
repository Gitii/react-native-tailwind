---
title: Platform Modifiers
description: "Apply platform-specific styles using ios:, android:, and web: modifiers"
---

Apply platform-specific styles using `ios:`, `android:`, and `web:` modifiers. These work on **all components** and compile to `Platform.select()` calls with zero runtime parsing overhead.

## Basic Example

```tsx
import { View, Text } from "react-native";

export function PlatformCard() {
  return (
    <View className="p-4 ios:p-6 android:p-8 bg-white rounded-lg">
      <Text className="text-base ios:text-blue-600 android:text-green-600">Platform-specific styles</Text>
    </View>
  );
}
```

**Transforms to:**

```tsx
import { Platform, StyleSheet } from "react-native";

<View
  style={[
    _twStyles._bg_white_p_4_rounded_lg,
    Platform.select({
      ios: _twStyles._ios_p_6,
      android: _twStyles._android_p_8,
    }),
  ]}
>
  <Text
    style={[
      _twStyles._text_base,
      Platform.select({
        ios: _twStyles._ios_text_blue_600,
        android: _twStyles._android_text_green_600,
      }),
    ]}
  >
    Platform-specific styles
  </Text>
</View>;
```

## Common Use Cases

### Platform-Specific Colors

Different colors per platform for brand consistency:

```tsx
<View className="bg-blue-500 ios:bg-blue-600 android:bg-green-600">
  <Text className="text-white">Platform-specific background</Text>
</View>
```

### Platform-Specific Spacing

More padding on Android due to larger default touch targets:

```tsx
<View className="p-4 ios:p-6 android:p-8">
  <Text>Platform-specific padding</Text>
</View>
```

### Combined with Base Styles

Base styles with platform-specific overrides:

```tsx
<View className="border-2 border-gray-300 ios:border-blue-500 android:border-green-500 rounded-lg p-4">
  <Text className="text-gray-800 ios:text-blue-800 android:text-green-800">
    Base styles with platform overrides
  </Text>
</View>
```

### Multiple Platform Modifiers

Combine multiple platform-specific styles:

```tsx
<View className="bg-gray-100 ios:bg-blue-50 android:bg-green-50 p-4 ios:p-6 android:p-8 rounded-lg">
  <Text>Multiple platform styles</Text>
</View>
```

### Web Platform Support

Different styles for React Native Web:

```tsx
<View className="p-4 ios:p-6 android:p-8 web:p-2">
  <Text className="text-base web:text-lg">Cross-platform styling</Text>
</View>
```

### Mixing with State Modifiers

Platform modifiers work alongside state modifiers:

```tsx
import { Pressable } from "@mgcrea/react-native-tailwind";

<Pressable className="bg-blue-500 active:bg-blue-700 ios:border-2 android:border-0 p-4 rounded-lg">
  <Text className="text-white">Button with platform + state modifiers</Text>
</Pressable>;
```

## Supported Platforms

| Modifier   | Platform         | Description                |
| ---------- | ---------------- | -------------------------- |
| `ios:`     | iOS              | Styles specific to iOS     |
| `android:` | Android          | Styles specific to Android |
| `web:`     | React Native Web | Styles for web platform    |

## Key Features

- ✅ **Works on all components** — No need for enhanced components (unlike state modifiers)
- ✅ **Zero runtime overhead** — All parsing happens at compile-time
- ✅ **Native Platform API** — Uses React Native's `Platform.select()` under the hood
- ✅ **Type-safe** — Full TypeScript autocomplete for platform modifiers
- ✅ **Optimized** — Styles deduplicated via `StyleSheet.create`
- ✅ **Works with custom colors** — `ios:bg-primary`, `android:bg-secondary`, etc.
- ✅ **Minimal runtime cost** — Only one `Platform.select()` call per element with platform modifiers

## How it Works

The Babel plugin:

1. Detects platform modifiers during compilation
2. Parses all platform-specific classes at compile-time
3. Generates `Platform.select()` expressions with references to pre-compiled styles
4. Auto-imports `Platform` from `react-native` when needed
5. Merges platform styles with base classes and other modifiers in style arrays

This approach provides the best of both worlds: compile-time optimization for all styles, with minimal runtime platform detection only for the conditional selection logic.

## Complete Example

```tsx
import { View, Text, Image } from "react-native";
import { Pressable } from "@mgcrea/react-native-tailwind";

export function PlatformCard({ title, description, imageUrl, onPress }) {
  return (
    <View className="bg-white ios:shadow-lg android:elevation-4 rounded-lg overflow-hidden mb-4">
      <Image source={{ uri: imageUrl }} className="w-full h-48 ios:h-56 android:h-64" />
      <View className="p-4 ios:p-6 android:p-8">
        <Text className="text-xl font-bold mb-2 ios:text-blue-900 android:text-green-900">{title}</Text>
        <Text className="text-base text-gray-600 mb-4">{description}</Text>
        <Pressable
          className="bg-blue-500 active:bg-blue-700 ios:rounded-lg android:rounded-full px-6 py-3 items-center"
          onPress={onPress}
        >
          <Text className="text-white font-semibold">Learn More</Text>
        </Pressable>
      </View>
    </View>
  );
}
```

## What's Next?

- Learn about [Color Scheme](/react-native-tailwind/guides/color-scheme/) for dark mode support
- Explore [State Modifiers](/react-native-tailwind/guides/state-modifiers/) for interactive components
- Check out [Custom Colors](/react-native-tailwind/advanced/custom-colors/) for theme customization
