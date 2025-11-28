---
title: Component Variants
description: Build type-safe components with variant-based styling using tw
---

When building design systems, components often need multiple variants (e.g., primary/secondary buttons, small/medium/large sizes). The `tw` template tag combined with TypeScript provides a powerful pattern for creating type-safe, variant-based components.

## Basic Variant Pattern

Define variants as a record mapping variant names to `TwStyle` objects:

```tsx
import { View, Text, type ViewStyle, type TextStyle } from "react-native";
import { Pressable, tw, type TwStyle } from "@mgcrea/react-native-tailwind";

// Define variant types
type ButtonVariant = "solid" | "outline" | "ghost";

// Define styles for each variant
const variantStyles = {
  solid: {
    container: tw`bg-blue-500 active:bg-blue-700`,
    text: tw`text-white`,
  },
  outline: {
    container: tw`border border-blue-500 bg-white active:bg-blue-50`,
    text: tw`text-blue-500`,
  },
  ghost: {
    container: tw`active:bg-blue-50`,
    text: tw`text-blue-500`,
  },
} satisfies Record<ButtonVariant, { container: TwStyle<ViewStyle>; text: TwStyle<TextStyle> }>;

type ButtonProps = {
  title: string;
  variant?: ButtonVariant;
  onPress?: () => void;
};

export function Button({ title, variant = "solid", onPress }: ButtonProps) {
  const styles = variantStyles[variant];

  return (
    <Pressable
      className="px-6 py-3 rounded-lg items-center justify-center"
      style={(state) => [styles.container.style, state.pressed && styles.container.activeStyle]}
      onPress={onPress}
    >
      <Text style={styles.text.style}>{title}</Text>
    </Pressable>
  );
}
```

## Multi-Dimensional Variants

Components often have multiple variant dimensions (e.g., size AND color). Structure your variants accordingly:

```tsx
import { View, Text, type ViewStyle, type TextStyle } from "react-native";
import { Pressable, tw, type TwStyle } from "@mgcrea/react-native-tailwind";

// Size variants
type ButtonSize = "sm" | "md" | "lg";

const sizeVariants = {
  sm: {
    container: tw`h-9 px-3 rounded-lg`,
    text: tw`text-sm`,
  },
  md: {
    container: tw`h-11 px-5 rounded-xl`,
    text: tw`text-base`,
  },
  lg: {
    container: tw`h-14 px-8 rounded-2xl`,
    text: tw`text-lg`,
  },
} satisfies Record<ButtonSize, { container: TwStyle<ViewStyle>; text: TwStyle<TextStyle> }>;

// Color variants
type ButtonColor = "primary" | "secondary" | "destructive";

const colorVariants = {
  primary: {
    container: tw`bg-blue-500 active:bg-blue-700`,
    text: tw`text-white`,
  },
  secondary: {
    container: tw`bg-gray-500 active:bg-gray-700`,
    text: tw`text-white`,
  },
  destructive: {
    container: tw`bg-red-500 active:bg-red-700`,
    text: tw`text-white`,
  },
} satisfies Record<ButtonColor, { container: TwStyle<ViewStyle>; text: TwStyle<TextStyle> }>;

type ButtonProps = {
  title: string;
  size?: ButtonSize;
  color?: ButtonColor;
  onPress?: () => void;
};

export function Button({ title, size = "md", color = "primary", onPress }: ButtonProps) {
  const sizeStyles = sizeVariants[size];
  const colorStyles = colorVariants[color];

  return (
    <Pressable
      className="flex-row items-center justify-center"
      style={(state) => [
        sizeStyles.container.style,
        colorStyles.container.style,
        state.pressed && colorStyles.container.activeStyle,
      ]}
      onPress={onPress}
    >
      <Text className="font-semibold" style={[sizeStyles.text.style, colorStyles.text.style]}>
        {title}
      </Text>
    </Pressable>
  );
}
```

## Complete Example: Button with Variants

Here's a full implementation combining size, color, and style variants:

```tsx
import { type PropsWithChildren } from "react";
import { Text, type StyleProp, type ViewStyle, type TextStyle } from "react-native";
import { Pressable, tw, type PressableProps, type TwStyle } from "@mgcrea/react-native-tailwind";

// Types
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonVariant = "solid" | "outline" | "ghost";
export type ButtonColor = "primary" | "destructive" | "neutral";

// Size variants
const sizeVariants = {
  sm: {
    container: tw`h-9 px-3 rounded-lg`,
    text: tw`text-sm`,
  },
  md: {
    container: tw`h-11 px-5 rounded-xl`,
    text: tw`text-base`,
  },
  lg: {
    container: tw`h-14 px-8 rounded-2xl`,
    text: tw`text-lg`,
  },
} satisfies Record<ButtonSize, { container: TwStyle<ViewStyle>; text: TwStyle<TextStyle> }>;

// Style variants per color
const variantStyles: Record<
  ButtonVariant,
  Record<ButtonColor, { container: TwStyle<ViewStyle>; text: TwStyle<TextStyle> }>
> = {
  solid: {
    primary: {
      container: tw`bg-blue-500 active:bg-blue-700 disabled:bg-blue-300`,
      text: tw`text-white`,
    },
    destructive: {
      container: tw`bg-red-500 active:bg-red-700 disabled:bg-red-300`,
      text: tw`text-white`,
    },
    neutral: {
      container: tw`bg-gray-900 active:bg-gray-700 disabled:bg-gray-400`,
      text: tw`text-white`,
    },
  },
  outline: {
    primary: {
      container: tw`border border-blue-500 bg-white active:bg-blue-50`,
      text: tw`text-blue-500`,
    },
    destructive: {
      container: tw`border border-red-500 bg-white active:bg-red-50`,
      text: tw`text-red-500`,
    },
    neutral: {
      container: tw`border border-gray-300 bg-white active:bg-gray-100`,
      text: tw`text-gray-900`,
    },
  },
  ghost: {
    primary: {
      container: tw`active:bg-blue-50`,
      text: tw`text-blue-500`,
    },
    destructive: {
      container: tw`active:bg-red-50`,
      text: tw`text-red-500`,
    },
    neutral: {
      container: tw`active:bg-gray-100`,
      text: tw`text-gray-900`,
    },
  },
};

// Props
export type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

// Component
export function Button({
  variant = "solid",
  size = "md",
  color = "primary",
  title,
  children,
  disabled,
  style,
  textStyle,
  ...props
}: PropsWithChildren<ButtonProps>) {
  const sizeStyles = sizeVariants[size];
  const colorStyles = variantStyles[variant][color];

  return (
    <Pressable
      className="flex-row items-center justify-center"
      style={(state) => [
        sizeStyles.container.style,
        colorStyles.container.style,
        state.pressed && colorStyles.container.activeStyle,
        disabled && colorStyles.container.disabledStyle,
        style,
      ]}
      disabled={disabled}
      {...props}
    >
      {children ?? (
        <Text
          className="font-semibold"
          style={[sizeStyles.text.style, colorStyles.text.style, textStyle]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
```

### Usage

```tsx
// Default: solid, medium, primary
<Button title="Click Me" onPress={handlePress} />

// Outline destructive button
<Button
  title="Delete"
  variant="outline"
  color="destructive"
  onPress={handleDelete}
/>

// Large ghost button
<Button
  title="Learn More"
  variant="ghost"
  size="lg"
  color="primary"
  onPress={handleLearnMore}
/>

// Disabled state
<Button
  title="Submitting..."
  disabled={isLoading}
/>

// With custom style overrides
<Button
  title="Custom"
  style={{ marginTop: 16 }}
  textStyle={{ letterSpacing: 1 }}
/>
```

## Key Points

### Type Safety with `satisfies`

Use TypeScript's `satisfies` operator to ensure your variant objects match the expected shape while preserving literal types:

```tsx
const sizeVariants = {
  sm: { container: tw`h-9 px-3`, text: tw`text-sm` },
  md: { container: tw`h-11 px-5`, text: tw`text-base` },
  lg: { container: tw`h-14 px-8`, text: tw`text-lg` },
} satisfies Record<ButtonSize, { container: TwStyle<ViewStyle>; text: TwStyle<TextStyle> }>;
```

### Using TwStyle Properties

The `TwStyle` type provides typed access to modifier styles:

```tsx
type TwStyle<T> = {
  style: T;                    // Base styles
  activeStyle?: T;             // active: modifier
  focusStyle?: T;              // focus: modifier
  disabledStyle?: T;           // disabled: modifier
  hoverStyle?: T;              // hover: modifier
  // ... other modifiers
};
```

Apply them conditionally based on component state:

```tsx
<Pressable
  style={(state) => [
    styles.container.style,
    state.pressed && styles.container.activeStyle,
    state.focused && styles.container.focusStyle,
    disabled && styles.container.disabledStyle,
  ]}
>
```

### Combining Multiple Style Sources

When combining styles from different variant dimensions, use array syntax:

```tsx
style={(state) => [
  sizeStyles.container.style,      // Size dimension
  colorStyles.container.style,     // Color dimension
  state.pressed && colorStyles.container.activeStyle,
  style,                           // User overrides
]}
```

### Null-Safe Variants

For optional variant styles, use null checks:

```tsx
const variantStyles = {
  link: {
    container: null,  // No container styles for link variant
    text: tw`text-blue-500 underline`,
  },
};

// In component
style={[
  sizeStyles.container.style,
  colorStyles.container?.style,  // Safe access
  state.pressed && colorStyles.container?.activeStyle,
]}
```

## What's Next?

- Learn about [Compile-Time tw](/react-native-tailwind/guides/compile-time-tw/) for the `tw` template basics
- Explore [State Modifiers](/react-native-tailwind/guides/state-modifiers/) for interactive styling
- Check out [Reusable Components](/react-native-tailwind/guides/reusable-components/) for component library patterns
