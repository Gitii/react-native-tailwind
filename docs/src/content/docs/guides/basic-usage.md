---
title: Basic Usage
description: Learn the basics of using className in React Native components
---

## Simple Component

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

## Card Component Example

Here's a more complete example showing a card component with interactive elements:

```tsx
import { View, Text, Pressable } from "react-native";

export function Card({ title, description, onPress }) {
  return (
    <View className="bg-white rounded-lg p-6 mb-4 border border-gray-200">
      <Text className="text-xl font-semibold text-gray-900 mb-2">{title}</Text>
      <Text className="text-base text-gray-600 mb-4">{description}</Text>
      <Pressable
        className="bg-blue-500 active:bg-blue-700 px-4 py-2 rounded-lg items-center"
        onPress={onPress}
      >
        <Text className="text-white font-semibold">Learn More</Text>
      </Pressable>
    </View>
  );
}
```

## Combining with Inline Styles

You can use inline `style` prop alongside `className` for dynamic values:

```tsx
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function SafeView({ children }) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 p-4 bg-blue-500" style={{ paddingTop: insets.top }}>
      <Text>Content with safe area</Text>
    </View>
  );
}
```

The Babel plugin will merge them automatically:

```tsx
// Transforms to:
<View style={[_twStyles._bg_blue_500_flex_1_p_4, { paddingTop: insets.top }]}>
  <Text>Content with safe area</Text>
</View>
```

## Common Patterns

### Centered Content

```tsx
<View className="flex-1 items-center justify-center bg-gray-100">
  <Text className="text-2xl font-bold">Centered Text</Text>
</View>
```

### Horizontal Layout

```tsx
<View className="flex-row items-center gap-4 p-4">
  <View className="w-12 h-12 bg-blue-500 rounded-full" />
  <View className="flex-1">
    <Text className="text-lg font-semibold">Title</Text>
    <Text className="text-sm text-gray-600">Subtitle</Text>
  </View>
</View>
```

### Card List

```tsx
<View className="flex-1 bg-gray-100 p-4">
  <View className="bg-white rounded-lg p-4 mb-2">
    <Text className="text-base font-medium">Item 1</Text>
  </View>
  <View className="bg-white rounded-lg p-4 mb-2">
    <Text className="text-base font-medium">Item 2</Text>
  </View>
  <View className="bg-white rounded-lg p-4 mb-2">
    <Text className="text-base font-medium">Item 3</Text>
  </View>
</View>
```

## What's Next?

- Learn about [Dynamic ClassNames](/react-native-tailwind/guides/dynamic-classnames/) for conditional styling
- Explore [State Modifiers](/react-native-tailwind/guides/state-modifiers/) for interactive components
- Check out the [Spacing Reference](/react-native-tailwind/reference/spacing/) for available utilities
