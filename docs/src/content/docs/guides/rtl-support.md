---
title: RTL Support
description: "Build RTL-aware layouts using logical properties and directional modifiers"
---

Build RTL (Right-to-Left) aware layouts using React Native's logical properties and directional modifiers (`rtl:`, `ltr:`). This enables proper support for languages like Arabic, Hebrew, and Persian.

## Overview

RTL support in react-native-tailwind consists of two complementary features:

1. **Logical Properties** — Use `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, etc. for styles that auto-flip based on layout direction
2. **Directional Modifiers** — Use `rtl:` and `ltr:` to apply styles only in specific layout directions

## Logical Properties

Logical properties automatically flip horizontally based on the layout direction. They map to React Native's built-in logical style properties.

### Logical Spacing

```tsx
// Uses marginStart/marginEnd instead of marginLeft/marginRight
<View className="ms-4 me-8 ps-2 pe-4">
  <Text>Auto-flipping margins and padding</Text>
</View>
```

| Tailwind Class | React Native Property | RTL Behavior           |
| -------------- | --------------------- | ---------------------- |
| `ms-*`         | `marginStart`         | Left in LTR, Right in RTL |
| `me-*`         | `marginEnd`           | Right in LTR, Left in RTL |
| `ps-*`         | `paddingStart`        | Left in LTR, Right in RTL |
| `pe-*`         | `paddingEnd`          | Right in LTR, Left in RTL |

### Logical Positioning

```tsx
// Uses start/end instead of left/right for absolute positioning
<View className="absolute start-0 end-4 top-0">
  <Text>Positioned element</Text>
</View>
```

| Tailwind Class | React Native Property | RTL Behavior           |
| -------------- | --------------------- | ---------------------- |
| `start-*`      | `start`               | Left in LTR, Right in RTL |
| `end-*`        | `end`                 | Right in LTR, Left in RTL |
| `inset-s-*`    | `start`               | Left in LTR, Right in RTL |
| `inset-e-*`    | `end`                 | Right in LTR, Left in RTL |

### Logical Border Width

```tsx
// Uses borderStartWidth/borderEndWidth
<View className="border-s-2 border-e-4 border-gray-300">
  <Text>Directional borders</Text>
</View>
```

| Tailwind Class | React Native Property | RTL Behavior           |
| -------------- | --------------------- | ---------------------- |
| `border-s-*`   | `borderStartWidth`    | Left in LTR, Right in RTL |
| `border-e-*`   | `borderEndWidth`      | Right in LTR, Left in RTL |

### Logical Border Radius

```tsx
// Uses logical corner names
<View className="rounded-ss-lg rounded-ee-lg bg-blue-500">
  <Text>Diagonal rounded corners</Text>
</View>
```

| Tailwind Class  | React Native Property     | Description                |
| --------------- | ------------------------- | -------------------------- |
| `rounded-s-*`   | Top-start + Bottom-start  | Start side corners         |
| `rounded-e-*`   | Top-end + Bottom-end      | End side corners           |
| `rounded-ss-*`  | `borderTopStartRadius`    | Top-start corner           |
| `rounded-se-*`  | `borderTopEndRadius`      | Top-end corner             |
| `rounded-es-*`  | `borderBottomStartRadius` | Bottom-start corner        |
| `rounded-ee-*`  | `borderBottomEndRadius`   | Bottom-end corner          |

### Logical Text Alignment

React Native doesn't have `textAlign: 'start'/'end'` like CSS, but `text-start` and `text-end` **automatically expand** to directional modifiers for true RTL support:

```tsx
// These are equivalent - text-start auto-expands!
<Text className="text-start">Aligned to start</Text>
<Text className="ltr:text-left rtl:text-right">Aligned to start</Text>

// These are equivalent - text-end auto-expands!
<Text className="text-end">Aligned to end</Text>
<Text className="ltr:text-right rtl:text-left">Aligned to end</Text>
```

| Tailwind Class | Expands To | RTL Behavior |
| -------------- | ---------- | ------------ |
| `text-start`   | `ltr:text-left rtl:text-right` | ✅ Flips correctly |
| `text-end`     | `ltr:text-right rtl:text-left` | ✅ Flips correctly |
| `text-left`    | (no expansion) | Static (no flip) |
| `text-right`   | (no expansion) | Static (no flip) |

:::tip[Automatic Expansion]
Unlike web Tailwind where `text-start`/`text-end` rely on CSS logical properties, react-native-tailwind automatically expands these to `ltr:`/`rtl:` modifiers at compile time. This provides true RTL support with zero runtime overhead.
:::

## Directional Modifiers

Use `rtl:` and `ltr:` modifiers to apply styles conditionally based on `I18nManager.isRTL`.

### Basic Example

```tsx
import { View, Text } from "react-native";

export function DirectionalCard() {
  return (
    <View className="p-4 rtl:pr-8 ltr:pl-8 bg-white rounded-lg">
      <Text className="text-base">Content with directional padding</Text>
    </View>
  );
}
```

**Transforms to:**

```tsx
import { I18nManager, StyleSheet } from "react-native";

const _twIsRTL = I18nManager.isRTL;

<View
  style={[
    _twStyles._bg_white_p_4_rounded_lg,
    _twIsRTL && _twStyles._rtl_pr_8,
    !_twIsRTL && _twStyles._ltr_pl_8,
  ]}
>
  <Text style={_twStyles._text_base}>Content with directional padding</Text>
</View>;
```

### Combining RTL/LTR Modifiers

Apply different styles based on layout direction:

```tsx
// Different icon positioning for RTL vs LTR
<View className="flex-row items-center rtl:flex-row-reverse">
  <Icon name="arrow-right" className="rtl:rotate-180" />
  <Text className="ml-2 rtl:ml-0 rtl:mr-2">Continue</Text>
</View>
```

### With Platform Modifiers

Directional modifiers work alongside platform modifiers:

```tsx
<View className="p-4 ios:p-6 android:p-8 rtl:pr-8 ltr:pl-8 bg-white">
  <Text>Platform + directional styles</Text>
</View>
```

### With Color Scheme Modifiers

Combine with dark mode support:

```tsx
<View className="bg-white dark:bg-gray-900 rtl:border-r-4 ltr:border-l-4 border-blue-500">
  <Text className="text-gray-900 dark:text-gray-100">Dark mode + RTL aware</Text>
</View>
```

### With State Modifiers

Works with interactive components:

```tsx
import { Pressable } from "@mgcrea/react-native-tailwind";

<Pressable className="bg-blue-500 active:bg-blue-700 rtl:rounded-r-lg ltr:rounded-l-lg p-4">
  <Text className="text-white">Interactive + directional</Text>
</Pressable>;
```

## Using with tw/twStyle

Directional modifiers also work in `tw` tagged templates and `twStyle()` calls:

```tsx
import { tw } from "@mgcrea/react-native-tailwind";

function MyComponent() {
  const cardStyles = tw`p-4 rtl:pr-8 ltr:pl-8 bg-white`;

  return (
    <View style={cardStyles.style}>
      <Text>RTL-aware card</Text>
    </View>
  );
}
```

The generated object includes:
- `style` — Array with runtime conditionals
- `rtlStyle` — RTL-specific styles for manual access
- `ltrStyle` — LTR-specific styles for manual access

## Supported Modifiers

| Modifier | Condition             | Description              |
| -------- | --------------------- | ------------------------ |
| `rtl:`   | `I18nManager.isRTL`   | Applied in RTL layouts   |
| `ltr:`   | `!I18nManager.isRTL`  | Applied in LTR layouts   |

## Key Features

- ✅ **Zero runtime overhead** — All parsing happens at compile-time
- ✅ **Native React Native API** — Uses `I18nManager.isRTL` under the hood
- ✅ **Works on all components** — No special wrappers needed
- ✅ **Combines with other modifiers** — Platform, color scheme, and state modifiers
- ✅ **Works with tw/twStyle** — Full support in template literals and function calls
- ✅ **Type-safe** — Full TypeScript support

## When to Use What

| Scenario | Recommended Approach |
| -------- | -------------------- |
| Spacing that should flip | Logical properties (`ms-*`, `me-*`) |
| Positioning that should flip | Logical properties (`start-*`, `end-*`) |
| Completely different styles per direction | Directional modifiers (`rtl:`, `ltr:`) |
| Icons that need rotation in RTL | `rtl:rotate-180` |
| Flex direction reversal | `rtl:flex-row-reverse` |

## Complete Example

```tsx
import { View, Text, Image } from "react-native";
import { Pressable } from "@mgcrea/react-native-tailwind";

export function RTLCard({ title, description, imageUrl, onPress }) {
  return (
    <View className="bg-white rounded-lg overflow-hidden shadow-md">
      {/* Image with directional margin */}
      <Image
        source={{ uri: imageUrl }}
        className="w-full h-48"
      />

      {/* Content with logical padding */}
      <View className="p-4 ps-6 pe-4">
        <Text className="text-xl font-bold mb-2 text-start">{title}</Text>
        <Text className="text-base text-gray-600 mb-4 text-start">{description}</Text>

        {/* Button with directional rounding */}
        <Pressable
          className="bg-blue-500 active:bg-blue-700 px-6 py-3 items-center
                     rtl:rounded-l-full ltr:rounded-r-full"
          onPress={onPress}
        >
          <View className="flex-row items-center rtl:flex-row-reverse">
            <Text className="text-white font-semibold me-2">Continue</Text>
            <Text className="text-white rtl:rotate-180">→</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
```

## Testing RTL Layouts

To test RTL layouts in development:

```tsx
import { I18nManager } from "react-native";

// Force RTL layout
I18nManager.forceRTL(true);

// Then reload the app
```

Note: Changes to `I18nManager.forceRTL()` require an app restart to take effect.

## What's Next?

- Learn about [Platform Modifiers](/react-native-tailwind/guides/platform-modifiers/) for platform-specific styles
- Explore [Color Scheme](/react-native-tailwind/guides/color-scheme/) for dark mode support
- Check out [State Modifiers](/react-native-tailwind/guides/state-modifiers/) for interactive components
