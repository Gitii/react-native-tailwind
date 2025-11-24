---
title: Reusable Components
description: Build reusable component libraries with className support
---

When building reusable components, use static `className` strings internally. To support `className` props from parent components, you **must** accept the corresponding `style` props (the Babel plugin transforms `className` to `style` before your component receives it).

## Basic Pattern

```tsx
import { Pressable, Text, View, StyleProp, ViewStyle } from "react-native";

type ButtonProps = {
  title: string;
  onPress?: () => void;
  // REQUIRED: Must accept style props for className to work
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  // Optional: Include in type for TypeScript compatibility
  className?: string; // compile-time only
  containerClassName?: string; // compile-time only
};

export function Button({ title, onPress, style, containerStyle }: ButtonProps) {
  // Use static className strings - these get optimized at compile-time
  return (
    <View className="p-2 bg-gray-100 rounded-lg" style={containerStyle}>
      <Pressable
        className="bg-blue-500 px-6 py-4 rounded-lg items-center"
        onPress={onPress}
        style={style}
      >
        <Text className="text-white text-center font-semibold text-base">{title}</Text>
      </Pressable>
    </View>
  );
}
```

## Key Points

- ✅ Use **static className strings** internally for default styling
- ✅ **Must accept `style` props** - the Babel plugin transforms `className` → `style` before your component receives it
- ✅ Include `className` props in the type (for TypeScript compatibility)
- ✅ **Don't destructure** className props - they're already transformed to `style` and will be `undefined` at runtime
- ✅ Babel plugin optimizes all static strings to `StyleSheet.create` calls

## Usage

```tsx
// Default styling (uses internal static classNames)
<Button title="Click Me" onPress={handlePress} />

// Override with runtime styles
<Button
  title="Custom"
  style={{ backgroundColor: "#10B981" }}
  containerStyle={{ padding: 16 }}
  onPress={handlePress}
/>

// className props are accepted but transformed by Babel upstream
<Button className="bg-red-500 p-8" title="Red Button" />
// At compile-time, this becomes:
// <Button style={_twStyles._bg_red_500_p_8} title="Red Button" />
// At runtime, className is undefined (already transformed to style)
```

## Card Component Example

```tsx
import { View, Text, StyleProp, ViewStyle, TextStyle } from "react-native";
import { Pressable } from "@mgcrea/react-native-tailwind";

type CardProps = {
  title: string;
  description: string;
  buttonText?: string;
  onPress?: () => void;
  // Style props for customization
  style?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  descriptionStyle?: StyleProp<TextStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  // className props (compile-time only)
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  buttonClassName?: string;
};

export function Card({
  title,
  description,
  buttonText = "Learn More",
  onPress,
  style,
  headerStyle,
  titleStyle,
  descriptionStyle,
  buttonStyle,
}: CardProps) {
  return (
    <View className="bg-white rounded-lg p-6 mb-4 border border-gray-200" style={style}>
      <View className="mb-4" style={headerStyle}>
        <Text className="text-xl font-semibold text-gray-900 mb-2" style={titleStyle}>
          {title}
        </Text>
        <Text className="text-base text-gray-600" style={descriptionStyle}>
          {description}
        </Text>
      </View>
      {onPress && (
        <Pressable
          className="bg-blue-500 active:bg-blue-700 px-4 py-2 rounded-lg items-center"
          onPress={onPress}
          style={buttonStyle}
        >
          <Text className="text-white font-semibold">{buttonText}</Text>
        </Pressable>
      )}
    </View>
  );
}
```

### Usage

```tsx
// Default styling
<Card
  title="Default Card"
  description="Uses built-in className styling"
  onPress={handlePress}
/>

// Custom styling with className (transformed at compile-time)
<Card
  className="bg-purple-100 border-purple-300"
  titleClassName="text-purple-900"
  buttonClassName="bg-purple-600 active:bg-purple-800"
  title="Purple Card"
  description="Custom purple theme"
  onPress={handlePress}
/>

// Custom styling with runtime styles
<Card
  style={{ backgroundColor: "#FEF3C7", borderColor: "#FCD34D" }}
  titleStyle={{ color: "#92400E" }}
  title="Custom Card"
  description="Custom colors via style props"
  onPress={handlePress}
/>
```

## Input Component Example

```tsx
import { TextInput as RNTextInput, View, Text, StyleProp, ViewStyle, TextStyle } from "react-native";
import { TextInput } from "@mgcrea/react-native-tailwind";

type InputProps = {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  // Style props
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  errorStyle?: StyleProp<TextStyle>;
  // className props (compile-time only)
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
};

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  style,
  inputStyle,
  labelStyle,
  errorStyle,
}: InputProps) {
  return (
    <View className="mb-4" style={style}>
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-2" style={labelStyle}>
          {label}
        </Text>
      )}
      <TextInput
        className="border-2 border-gray-300 focus:border-blue-500 p-3 rounded-lg bg-white"
        style={inputStyle}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
      />
      {error && (
        <Text className="text-sm text-red-600 mt-1" style={errorStyle}>
          {error}
        </Text>
      )}
    </View>
  );
}
```

### Usage

```tsx
<Input
  label="Email"
  placeholder="email@example.com"
  value={email}
  onChangeText={setEmail}
  error={emailError}
/>

// Custom styling
<Input
  inputClassName="border-purple-500 focus:border-purple-700"
  labelClassName="text-purple-900"
  label="Custom Input"
  placeholder="Enter text"
/>
```

## Component Library Pattern

When building a complete component library:

1. **Export enhanced components** for state modifiers:

```tsx
// components/index.ts
export { Pressable, TextInput } from "@mgcrea/react-native-tailwind";
export * from "./Button";
export * from "./Card";
export * from "./Input";
```

2. **Use consistent naming** for style props:

```tsx
// Always pair className with style props
type Props = {
  // Main component
  className?: string;
  style?: StyleProp<ViewStyle>;

  // Sub-components
  headerClassName?: string;
  headerStyle?: StyleProp<ViewStyle>;

  bodyClassName?: string;
  bodyStyle?: StyleProp<ViewStyle>;
};
```

3. **Document which props are compile-time only**:

```tsx
/**
 * Button component with Tailwind styling
 *
 * @param className - Compile-time only, transformed to style prop by Babel
 * @param style - Runtime style overrides
 * @param title - Button text
 * @param onPress - Press handler
 */
export function Button({ title, onPress, style }: ButtonProps) {
  // ...
}
```

## TypeScript Tips

### Union Types for Variants

```tsx
type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = {
  title: string;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  className?: string;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-blue-500 active:bg-blue-700",
  secondary: "bg-gray-500 active:bg-gray-700",
  danger: "bg-red-500 active:bg-red-700",
};

export function Button({ title, variant = "primary", style }: ButtonProps) {
  return (
    <Pressable className={`px-6 py-4 rounded-lg items-center ${variantStyles[variant]}`} style={style}>
      <Text className="text-white font-semibold">{title}</Text>
    </Pressable>
  );
}
```

### Generic Props

```tsx
type BaseProps<T = ViewStyle> = {
  className?: string;
  style?: StyleProp<T>;
};

type CardProps = BaseProps & {
  title: string;
  description: string;
  headerStyle?: StyleProp<ViewStyle>;
  headerClassName?: string;
};
```

## What's Next?

- Learn about [Custom Attributes](/advanced/custom-attributes/) for more control
- Explore [Babel Configuration](/advanced/babel-configuration/) for plugin options
- Check out [TypeScript setup](/getting-started/quick-start/#2-enable-typescript-support-typescript) for type safety
