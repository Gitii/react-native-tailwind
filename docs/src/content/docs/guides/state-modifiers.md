---
title: State Modifiers
description: Apply styles based on component state with zero runtime overhead
---

Apply styles based on component state using modifiers like `active:`, `focus:`, and `disabled:`. The Babel plugin automatically generates optimized style functions.

:::note[Enhanced Components]
Some state modifiers may require using the enhanced `Pressable` and `TextInput` components from `@mgcrea/react-native-tailwind`.
:::

## Active Modifier (Pressable)

Use the `active:` modifier to apply styles when a Pressable component is pressed.

### Basic Example

```tsx
import { Text, Pressable } from "react-native";

export function MyButton() {
  return (
    <Pressable className="bg-blue-500 active:bg-blue-700 p-4 rounded-lg">
      <Text className="text-white font-semibold">Press Me</Text>
    </Pressable>
  );
}
```

**Transforms to:**

```tsx
<Pressable
  style={({ pressed }) => [_twStyles._bg_blue_500_p_4_rounded_lg, pressed && _twStyles._active_bg_blue_700]}
>
  <Text style={_twStyles._font_semibold_text_white}>Press Me</Text>
</Pressable>
```

### Multiple Active Modifiers

```tsx
<Pressable className="bg-green-500 active:bg-green-700 p-4 active:p-6 rounded-lg">
  <Text className="text-white">Press for darker & larger padding</Text>
</Pressable>
```

### Complex Styling

```tsx
<Pressable className="bg-purple-500 active:bg-purple-800 border-2 border-purple-700 active:border-purple-900 p-4 rounded-lg">
  <Text className="text-white">Background + Border Changes</Text>
</Pressable>
```

## Focus Modifier (TextInput)

Use the `focus:` modifier to apply styles when a TextInput component is focused.

### Basic Example

```tsx
import { TextInput } from "@mgcrea/react-native-tailwind";

export function MyInput() {
  return (
    <TextInput
      className="border-2 border-gray-300 focus:border-blue-500 p-3 rounded-lg bg-white"
      placeholder="Email address"
    />
  );
}
```

### Multiple Focus Modifiers

```tsx
<TextInput
  className="border-2 border-gray-300 focus:border-green-500 bg-gray-50 focus:bg-white p-3 rounded-lg"
  placeholder="Enter text"
/>
```

## Disabled Modifier

Use the `disabled:` modifier to apply styles when a component is disabled.

:::note[How Pressable states are wired]
`Pressable` gets its `active:` behavior for free from React Native's `style={({ pressed }) => ...}` API, but React Native does not pass `disabled` into that callback. The enhanced `Pressable` shipped by this library injects the `disabled` flag so `disabled:` modifiers work correctly.
:::

### Pressable Example

```tsx
import { Pressable, Text } from "@mgcrea/react-native-tailwind";

export function SubmitButton({ isLoading }) {
  return (
    <Pressable
      disabled={isLoading}
      className="bg-blue-500 active:bg-blue-700 disabled:bg-gray-400 p-4 rounded-lg"
    >
      <Text className="text-white font-semibold">{isLoading ? "Loading..." : "Submit"}</Text>
    </Pressable>
  );
}
```

### TextInput Example

```tsx
import { TextInput } from "@mgcrea/react-native-tailwind";

export function MyInput({ isEditing }) {
  return (
    <TextInput
      disabled={!isEditing}
      className="border-2 border-gray-300 focus:border-blue-500 disabled:bg-gray-100 disabled:border-gray-200 p-3 rounded-lg"
      placeholder="Enter text"
    />
  );
}
```

### TextInput `disabled` Prop

The enhanced `TextInput` provides a convenient `disabled` prop:

```tsx
// These are equivalent:
<TextInput disabled={true} />
<TextInput editable={false} />

// If both are provided, disabled takes precedence:
<TextInput disabled={true} editable={true} /> // Component is disabled
```

## Supported Modifiers by Component

| Component   | Supported Modifiers                        | Import From                     |
| ----------- | ------------------------------------------ | ------------------------------- |
| `Pressable` | `active:`, `hover:`, `focus:`, `disabled:` | `@mgcrea/react-native-tailwind` |
| `TextInput` | `focus:`, `disabled:`                      | `@mgcrea/react-native-tailwind` |

## Key Features

- ✅ **Zero runtime overhead** — All parsing happens at compile-time
- ✅ **Native Pressable API** — Uses Pressable's `style={({ pressed }) => ...}` pattern
- ✅ **Type-safe** — Full TypeScript autocomplete for modifier classes
- ✅ **Optimized** — Styles deduplicated via `StyleSheet.create`
- ✅ **Works with custom colors** — `active:bg-primary`, `focus:border-secondary`, etc.

## Important Notes

- ⚠️ **Enhanced components required** — State modifiers require using the enhanced components from this package
- ℹ️ **Component-specific** — Each modifier only works on compatible components
- ℹ️ **No nested modifiers** — Combinations like `active:focus:bg-blue-500` are not currently supported
- ✅ **Minimal runtime cost** — Only adds state management (focus tracking, disabled injection)

## Complete Example

```tsx
import { View, Text } from "react-native";
import { Pressable, TextInput } from "@mgcrea/react-native-tailwind";
import { useState } from "react";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <View className="p-4 gap-4">
      <TextInput
        className="border-2 border-gray-300 focus:border-blue-500 p-3 rounded-lg bg-white"
        placeholder="Email"
      />
      <TextInput
        className="border-2 border-gray-300 focus:border-blue-500 p-3 rounded-lg bg-white"
        placeholder="Password"
        secureTextEntry
      />
      <Pressable
        disabled={isLoading}
        className="bg-blue-500 active:bg-blue-700 disabled:bg-gray-400 p-4 rounded-lg items-center"
        onPress={() => setIsLoading(true)}
      >
        <Text className="text-white font-semibold">{isLoading ? "Loading..." : "Sign In"}</Text>
      </Pressable>
    </View>
  );
}
```

## What's Next?

- Learn about [Platform Modifiers](/react-native-tailwind/guides/platform-modifiers/) for platform-specific styling
- Explore [Color Scheme](/react-native-tailwind/guides/color-scheme/) for dark mode support
- Check out [Dynamic ClassNames](/react-native-tailwind/guides/dynamic-classnames/) for more conditional patterns
