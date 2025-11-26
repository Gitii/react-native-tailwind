---
title: Runtime tw
description: Use the runtime tw template tag for fully dynamic styling
---

For cases where you need **fully dynamic styling** (values only known at runtime), you can use the runtime `tw` template tag function. This provides runtime parsing of Tailwind classes with memoization for performance.

:::note
Use the compile-time `tw` (imported from `@mgcrea/react-native-tailwind`) when possible for zero runtime overhead. Only use the runtime version (imported from `@mgcrea/react-native-tailwind/runtime`) when styles must be determined at runtime.
:::

## Installation

The runtime module is already included in the package. Import it separately:

```typescript
import { tw, setConfig } from "@mgcrea/react-native-tailwind/runtime";
```

## Basic Usage

```tsx
import { View, Text, Pressable } from "react-native";
import { tw } from "@mgcrea/react-native-tailwind/runtime";
import { useState } from "react";

export function RuntimeExample({ color }) {
  const [isActive, setIsActive] = useState(false);
  const bgColor = tw`bg-${color}-500 active:bg-${color}-700`;
  const textColor = tw`text-${color}-500`;
  return (
    <View className="flex-1 p-4 bg-gray-100">
      <Pressable
        onPress={() => setIsActive(!isActive)}
        style={bgColor.style}
        className={`p-4 rounded-lg ${isActive ? "bg-green-500" : "bg-red-500"}`}
      >
        <Text style={textColor.style} className="font-bold text-center">
          {isActive ? "Active" : "Inactive"}
        </Text>
      </Pressable>
    </View>
  );
}
```

## Configuration

Configure custom colors and font families using `setConfig()`:

```typescript
import { setConfig } from "@mgcrea/react-native-tailwind/runtime";

// Match your tailwind.config structure
setConfig({
  theme: {
    extend: {
      colors: {
        primary: "#007AFF",
        secondary: "#5856D6",
        brand: {
          light: "#FF6B6B",
          dark: "#CC0000",
        },
      },
      fontFamily: {
        sans: ['"SF Pro Rounded"'],
        custom: ['"My Custom Font"'],
      },
    },
  },
});

// Now you can use custom theme
<View style={tw`bg-primary p-4`} />
<Text style={tw`text-brand-light font-custom`}>Custom styling</Text>
```

## API Reference

### `tw` Tagged Template

```typescript
function tw(strings: TemplateStringsArray, ...values: unknown[]): TwStyle;

type TwStyle = {
  style: ViewStyle | TextStyle | ImageStyle;
  activeStyle?: ViewStyle | TextStyle | ImageStyle;
  focusStyle?: ViewStyle | TextStyle | ImageStyle;
  disabledStyle?: ViewStyle | TextStyle | ImageStyle;
};
```

Parses Tailwind classes at runtime and returns a `TwStyle` object with separate properties for base styles and state modifiers. Results are automatically memoized for performance.

### `twStyle(className: string)`

```typescript
function twStyle(className: string): TwStyle | undefined;
```

String version for cases where template literals aren't needed. Returns `undefined` for empty strings.

### `setConfig(config: RuntimeConfig)`

```typescript
function setConfig(config: RuntimeConfig): void;
```

Configure runtime theme settings (colors, font families, etc.). Matches `tailwind.config.mjs` structure.

### `clearCache()`

```typescript
function clearCache(): void;
```

Clears the internal memoization cache. Useful for testing.

### `getCacheStats()`

```typescript
function getCacheStats(): { size: number; keys: string[] };
```

Returns cache statistics for debugging/monitoring.

## Performance Considerations

### Bundle Size

The runtime module adds ~25KB minified (~15-20KB gzipped) to your bundle.

### Caching

All parsed styles are automatically memoized, so repeated className strings have minimal overhead:

```tsx
// First call: Parses and caches
const styles1 = tw`p-4 bg-blue-500`;

// Second call: Returns cached result (very fast)
const styles2 = tw`p-4 bg-blue-500`;
```

### When to Use

**✅ Use runtime tw for:**

- Truly dynamic values that can't be determined at compile-time
- Prototyping and rapid development
- Dynamic theme systems that can't use `setConfig()`

**❌ Don't use runtime tw for:**

- Static styles (use compile-time `className` instead for zero overhead)
- Performance-critical hot paths (compile-time is faster)
- Production code where bundle size matters and compile-time would work

## Runtime vs Compile-Time

| Feature        | Compile-Time (`className`)      | Runtime (`tw` tag)      |
| -------------- | ------------------------------- | ----------------------- |
| Bundle Size    | Only used styles (~4KB typical) | Full parser (~25KB)     |
| Performance    | Zero overhead (pre-compiled)    | Fast (memoized parsing) |
| Dynamic Values | Conditional only                | Fully dynamic           |
| Custom Colors  | Via `tailwind.config.*`         | Via `setConfig()`       |
| Type Safety    | Full TypeScript support         | Full TypeScript support |

## Complete Example

```tsx
import { View, Text, ScrollView } from "react-native";
import { Pressable } from "react-native";
import { tw, setConfig } from "@mgcrea/react-native-tailwind/runtime";
import { useState } from "react";

// Configure custom theme
setConfig({
  theme: {
    extend: {
      colors: {
        primary: "#007AFF",
        secondary: "#5856D6",
      },
    },
  },
});

export function DynamicThemeApp() {
  const [theme, setTheme] = useState<"primary" | "secondary">("primary");
  const [size, setSize] = useState<"sm" | "md" | "lg">("md");

  const sizeMap = {
    sm: "p-2 text-sm",
    md: "p-4 text-base",
    lg: "p-6 text-lg",
  };

  return (
    <ScrollView style={tw`flex-1 bg-gray-100`}>
      <View style={tw`p-4 gap-4`}>
        <Text style={tw`text-2xl font-bold mb-4`}>Runtime Styling Demo</Text>

        {/* Dynamic theme card */}
        <View style={tw`bg-${theme} ${sizeMap[size]} rounded-lg`}>
          <Text style={tw`text-white font-semibold`}>
            Theme: {theme}, Size: {size}
          </Text>
        </View>

        {/* Theme switcher */}
        <View style={tw`flex-row gap-2`}>
          <Pressable
            onPress={() => setTheme("primary")}
            style={tw`flex-1 p-3 rounded-lg ${theme === "primary" ? "bg-primary" : "bg-gray-300"}`}
          >
            <Text style={tw`text-center font-semibold`}>Primary</Text>
          </Pressable>
          <Pressable
            onPress={() => setTheme("secondary")}
            style={tw`flex-1 p-3 rounded-lg ${theme === "secondary" ? "bg-secondary" : "bg-gray-300"}`}
          >
            <Text style={tw`text-center font-semibold`}>Secondary</Text>
          </Pressable>
        </View>

        {/* Size switcher */}
        <View style={tw`flex-row gap-2`}>
          <Pressable
            onPress={() => setSize("sm")}
            style={tw`flex-1 p-2 rounded-lg ${size === "sm" ? "bg-blue-500" : "bg-gray-300"}`}
          >
            <Text style={tw`text-center text-sm`}>Small</Text>
          </Pressable>
          <Pressable
            onPress={() => setSize("md")}
            style={tw`flex-1 p-3 rounded-lg ${size === "md" ? "bg-blue-500" : "bg-gray-300"}`}
          >
            <Text style={tw`text-center text-base`}>Medium</Text>
          </Pressable>
          <Pressable
            onPress={() => setSize("lg")}
            style={tw`flex-1 p-4 rounded-lg ${size === "lg" ? "bg-blue-500" : "bg-gray-300"}`}
          >
            <Text style={tw`text-center text-lg`}>Large</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
```

## Recommendation

**Use compile-time `className` by default** for best performance. Only use runtime `tw` when you need fully dynamic styling that can't be expressed with conditional logic.

## What's Next?

- Learn about [Compile-Time tw](/react-native-tailwind/guides/compile-time-tw/) for zero runtime overhead
- Explore [Dynamic ClassNames](/react-native-tailwind/guides/dynamic-classnames/) for hybrid optimization
- Check out [Custom Colors](/react-native-tailwind/advanced/custom-colors/) for theme configuration
