---
title: How It Works
description: Understanding the compile-time transformation
---

The Babel plugin transforms your code at compile time, converting `className` props to optimized `StyleSheet.create` calls.

## Transformation Example

**Input** (what you write):

```tsx
<View className="m-4 p-2 bg-blue-500 rounded-lg" />
<ScrollView contentContainerClassName="items-center gap-4" />
<FlatList
  columnWrapperClassName="gap-4"
  ListHeaderComponentClassName="p-4 bg-gray-100"
/>
```

**Output** (what Babel generates):

```tsx
import { StyleSheet } from "react-native";

<View style={_twStyles._bg_blue_500_m_4_p_2_rounded_lg} />;
<ScrollView contentContainerStyle={_twStyles._gap_4_items_center} />;
<FlatList
  columnWrapperStyle={_twStyles._gap_4}
  ListHeaderComponentStyle={_twStyles._bg_gray_100_p_4}
/>;

const _twStyles = StyleSheet.create({
  _bg_blue_500_m_4_p_2_rounded_lg: {
    margin: 16,
    padding: 8,
    backgroundColor: "#3B82F6",
    borderRadius: 8,
  },
  _gap_4_items_center: {
    gap: 16,
    alignItems: "center",
  },
  _gap_4: {
    gap: 16,
  },
  _bg_gray_100_p_4: {
    backgroundColor: "#F3F4F6",
    padding: 16,
  },
});
```

## Key Concepts

### 1. Compile-Time Processing

All className strings are parsed during the build process:

- **Zero runtime overhead** — No parser shipped to your app
- **Optimized styles** — All styles compiled to `StyleSheet.create`
- **Type-safe** — Full TypeScript validation at compile time

### 2. Style Deduplication

The same class combinations always generate the same style key:

```tsx
// Both use the same style object
<View className="p-4 bg-blue-500" />
<View className="bg-blue-500 p-4" />  // Order doesn't matter

// Generated:
const _twStyles = StyleSheet.create({
  _bg_blue_500_p_4: { padding: 16, backgroundColor: "#3B82F6" }
});
```

### 3. Attribute Transformation

The plugin automatically converts className-style props to their style equivalents:

| className Prop | Transforms To |
|----------------|---------------|
| `className` | `style` |
| `contentContainerClassName` | `contentContainerStyle` |
| `columnWrapperClassName` | `columnWrapperStyle` |
| `ListHeaderComponentClassName` | `ListHeaderComponentStyle` |
| `ListFooterComponentClassName` | `ListFooterComponentStyle` |

You can configure custom attributes in the [Babel configuration](/react-native-tailwind/advanced/babel-configuration/).

### 4. Import Management

The plugin automatically:

- Imports `StyleSheet` from `react-native` when needed
- Removes unused `tw`/`twStyle` imports after transformation
- Injects `Platform` import when using platform modifiers
- Injects `useColorScheme` hook when using color scheme modifiers

## Architecture Benefits

### No Runtime Parser

Unlike runtime CSS-in-JS solutions, React Native Tailwind doesn't ship a parser to your app:

- **Smaller bundle size** — Only compiled styles (~4KB typical)
- **Faster startup** — No parsing on app launch
- **Better performance** — Native `StyleSheet` API only

### Build-Time Configuration

Custom colors and theme extensions are loaded during compilation:

```javascript
// tailwind.config.mjs (discovered at build time)
export default {
  theme: {
    extend: {
      colors: {
        primary: "#1d4ed8",
      },
    },
  },
};
```

```tsx
// Used at compile time, resolved before app runs
<View className="bg-primary" />
```

### Optimal React Native Integration

Generates code that uses React Native's best practices:

- `StyleSheet.create()` for style optimization
- `Platform.select()` for platform-specific styles
- `useColorScheme()` for theme detection
- Native Pressable/TextInput state handling

## What's Next?

- Explore [Basic Usage](/react-native-tailwind/guides/basic-usage/) examples
- Learn about [Dynamic ClassNames](/react-native-tailwind/guides/dynamic-classnames/)
- Understand [State Modifiers](/react-native-tailwind/guides/state-modifiers/)
