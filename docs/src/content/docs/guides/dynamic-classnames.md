---
title: Dynamic ClassNames
description: Use conditional styling with hybrid compile-time optimization
---

You can use dynamic expressions in `className` for conditional styling. The Babel plugin will parse all static strings at compile-time and preserve the conditional logic.

## Conditional Expression

```tsx
import { useState } from "react";
import { View, Text, Pressable } from "react-native";

export function ToggleButton() {
  const [isActive, setIsActive] = useState(false);

  return (
    <Pressable
      onPress={() => setIsActive(!isActive)}
      className={isActive ? "bg-green-500 p-4" : "bg-red-500 p-4"}
    >
      <Text className="text-white">{isActive ? "Active" : "Inactive"}</Text>
    </Pressable>
  );
}
```

**Transforms to:**

```tsx
<Pressable
  onPress={() => setIsActive(!isActive)}
  style={isActive ? _twStyles._bg_green_500_p_4 : _twStyles._bg_red_500_p_4}
>
  <Text style={_twStyles._text_white}>{isActive ? "Active" : "Inactive"}</Text>
</Pressable>
```

## Template Literals (Static + Dynamic)

Combine static classes with dynamic conditionals:

```tsx
<Pressable
  className={`border-2 rounded-lg ${isActive ? "bg-blue-500" : "bg-gray-300"} p-4`}
>
  <Text className="text-white">Click Me</Text>
</Pressable>
```

**Transforms to:**

```tsx
<Pressable
  style={[
    _twStyles._border_2,
    _twStyles._rounded_lg,
    isActive ? _twStyles._bg_blue_500 : _twStyles._bg_gray_300,
    _twStyles._p_4,
  ]}
>
  <Text style={_twStyles._text_white}>Click Me</Text>
</Pressable>
```

## Logical Expression

Use the `&&` operator for conditional classes:

```tsx
<View className={`p-4 bg-gray-100 ${isActive && "border-4 border-purple-500"}`}>
  <Text>Content</Text>
</View>
```

**Transforms to:**

```tsx
<View
  style={[
    _twStyles._p_4,
    _twStyles._bg_gray_100,
    isActive && _twStyles._border_4_border_purple_500,
  ]}
>
  <Text>Content</Text>
</View>
```

## Multiple Conditionals

You can combine multiple conditional expressions:

```tsx
<View
  className={`${size === "lg" ? "p-8" : "p-4"} ${isActive ? "bg-blue-500" : "bg-gray-400"}`}
>
  <Text>Dynamic Size & Color</Text>
</View>
```

## Key Benefits

- ✅ All string literals are parsed at compile-time
- ✅ Only conditional logic remains at runtime (no parser overhead)
- ✅ Full type-safety and validation for all class names
- ✅ Optimal performance with pre-compiled styles

## What Won't Work

Runtime variables in class names cannot be parsed at compile time:

```tsx
// ❌ Runtime variables in class names
const spacing = 4;
<View className={`p-${spacing}`} />  // Can't parse "p-${spacing}" at compile time

// ✅ Use inline style for truly dynamic values:
<View className="border-2" style={{ padding: spacing * 4 }} />
```

## Complex Example

Here's a complete example showing multiple conditional patterns:

```tsx
import { useState } from "react";
import { View, Text, Pressable } from "react-native";

export function StatusCard({ status }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View
      className={`
        rounded-lg p-4 mb-2
        ${status === "success" ? "bg-green-100 border-green-500" : ""}
        ${status === "error" ? "bg-red-100 border-red-500" : ""}
        ${status === "warning" ? "bg-yellow-100 border-yellow-500" : ""}
        ${isExpanded ? "border-2" : "border"}
      `}
    >
      <Pressable onPress={() => setIsExpanded(!isExpanded)}>
        <Text className="font-semibold">{status.toUpperCase()}</Text>
      </Pressable>
      {isExpanded && (
        <Text className="mt-2 text-sm text-gray-600">
          Additional details here
        </Text>
      )}
    </View>
  );
}
```

## What's Next?

- Learn about [State Modifiers](/react-native-tailwind/guides/state-modifiers/) for cleaner interactive styling
- Explore [Runtime tw](/react-native-tailwind/guides/runtime-tw/) for fully dynamic styling needs
- Check out [Combining with Inline Styles](/react-native-tailwind/guides/basic-usage/#combining-with-inline-styles)
