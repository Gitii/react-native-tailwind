---
title: Shadows & Elevation
description: Shadow and elevation utilities for depth
---

Apply platform-specific shadows and elevation to create depth and visual hierarchy. Automatically uses iOS shadow properties or Android elevation based on the platform.

## Available Shadow Sizes

```tsx
<View className="shadow-sm" />   // Subtle shadow
<View className="shadow" />      // Default shadow
<View className="shadow-md" />   // Medium shadow
<View className="shadow-lg" />   // Large shadow
<View className="shadow-xl" />   // Extra large shadow
<View className="shadow-2xl" />  // Extra extra large shadow
<View className="shadow-none" /> // Remove shadow
```

## Platform Differences

| Platform | Properties Used |
|----------|----------------|
| **iOS** | `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius` |
| **Android** | `elevation` |

## iOS Shadow Values

| Class | shadowOpacity | shadowRadius | shadowOffset |
|-------|---------------|--------------|--------------|
| `shadow-sm` | 0.05 | 1 | { width: 0, height: 1 } |
| `shadow` | 0.1 | 2 | { width: 0, height: 1 } |
| `shadow-md` | 0.15 | 4 | { width: 0, height: 3 } |
| `shadow-lg` | 0.2 | 8 | { width: 0, height: 6 } |
| `shadow-xl` | 0.25 | 12 | { width: 0, height: 10 } |
| `shadow-2xl` | 0.3 | 24 | { width: 0, height: 20 } |

## Android Elevation Values

| Class | elevation |
|-------|-----------|
| `shadow-sm` | 1 |
| `shadow` | 2 |
| `shadow-md` | 4 |
| `shadow-lg` | 8 |
| `shadow-xl` | 12 |
| `shadow-2xl` | 16 |

## Examples

### Card with shadow

```tsx
<View className="bg-white rounded-lg shadow-lg p-6 m-4">
  <Text className="text-xl font-bold">Card Title</Text>
  <Text className="text-gray-600">Card with large shadow</Text>
</View>
```

### Button with subtle shadow

```tsx
<Pressable className="bg-blue-500 shadow-sm rounded-lg px-6 py-3">
  <Text className="text-white">Press Me</Text>
</Pressable>
```

### Different shadow sizes

```tsx
<View className="shadow-sm p-4 bg-white mb-4 rounded">Subtle</View>
<View className="shadow p-4 bg-white mb-4 rounded">Default</View>
<View className="shadow-md p-4 bg-white mb-4 rounded">Medium</View>
<View className="shadow-lg p-4 bg-white mb-4 rounded">Large</View>
<View className="shadow-xl p-4 bg-white mb-4 rounded">Extra Large</View>
<View className="shadow-2xl p-4 bg-white mb-4 rounded">2X Large</View>
```

### Remove shadow conditionally

```tsx
<View className="shadow-lg ios:shadow-none p-4 bg-white rounded">
  Shadow only on Android
</View>
```

## Note

All shadow parsing happens at compile-time with zero runtime overhead. The platform detection uses React Native's `Platform.select()` API.

## Related

- [Borders](/react-native-tailwind/reference/borders/) - Border utilities
- [Colors](/react-native-tailwind/reference/colors/) - Background colors
- [Platform Modifiers](/react-native-tailwind/guides/platform-modifiers/) - Platform-specific styling
