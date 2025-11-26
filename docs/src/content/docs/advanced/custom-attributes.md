---
title: Custom Attributes
description: Configure which props to transform with exact matching or glob patterns
---

By default, the Babel plugin transforms these className-like attributes to their corresponding style props. You can customize which attributes are transformed using the `attributes` plugin option.

## Default Attributes

- `className` → `style`
- `contentContainerClassName` → `contentContainerStyle`
- `columnWrapperClassName` → `columnWrapperStyle`
- `ListHeaderComponentClassName` → `ListHeaderComponentStyle`
- `ListFooterComponentClassName` → `ListFooterComponentStyle`

## Exact Matches

```javascript
// babel.config.js
module.exports = {
  plugins: [
    [
      "@mgcrea/react-native-tailwind/babel",
      {
        attributes: ["className", "buttonClassName", "containerClassName"],
      },
    ],
  ],
};
```

## Pattern Matching

Use glob patterns to match multiple attributes:

```javascript
// babel.config.js
module.exports = {
  plugins: [
    [
      "@mgcrea/react-native-tailwind/babel",
      {
        // Matches any attribute ending in 'ClassName'
        attributes: ["*ClassName"],
      },
    ],
  ],
};
```

## Combined

Mix exact matches and patterns:

```javascript
// babel.config.js
module.exports = {
  plugins: [
    [
      "@mgcrea/react-native-tailwind/babel",
      {
        attributes: [
          "className",
          "*ClassName", // containerClassName, buttonClassName, etc.
          "custom*", // customButton, customHeader, etc.
        ],
      },
    ],
  ],
};
```

## Usage Example

```tsx
// With custom attributes configured
function Button({ title, onPress, buttonClassName, containerClassName }) {
  return (
    <View containerClassName="p-2 bg-gray-100">
      <Pressable buttonClassName="bg-blue-500 px-6 py-4 rounded-lg" onPress={onPress}>
        <Text className="text-white font-semibold">{title}</Text>
      </Pressable>
    </View>
  );
}
```

**Transforms to:**

```tsx
function Button({ title, onPress, buttonStyle, containerStyle }) {
  return (
    <View style={[_twStyles._bg_gray_100_p_2, containerStyle]}>
      <Pressable style={[_twStyles._bg_blue_500_px_6_py_4_rounded_lg, buttonStyle]} onPress={onPress}>
        <Text style={_twStyles._font_semibold_text_white}>{title}</Text>
      </Pressable>
    </View>
  );
}
```

## Naming Convention

Attributes ending in `ClassName` are automatically converted to their `Style` equivalent:

- `buttonClassName` → `buttonStyle`
- `containerClassName` → `containerStyle`
- `headerClassName` → `headerStyle`

For attributes not ending in `ClassName`, the `style` prop is used.

## TypeScript Support

When using custom attributes, you'll need to augment the component types:

```typescript
// types/react-native-tailwind.d.ts
import "@mgcrea/react-native-tailwind/react-native";

declare module "react-native" {
  interface ViewProps {
    containerClassName?: string;
  }

  interface PressableProps {
    buttonClassName?: string;
  }
}
```

## Use Cases

### Component Library

```tsx
// Button.tsx
type ButtonProps = {
  title: string;
  onPress: () => void;
  buttonClassName?: string;
  containerClassName?: string;
  buttonStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, buttonStyle, containerStyle }: ButtonProps) {
  return (
    <View containerClassName="p-2 bg-gray-100" style={containerStyle}>
      <Pressable buttonClassName="bg-blue-500 px-6 py-4 rounded-lg" onPress={onPress} style={buttonStyle}>
        <Text className="text-white font-semibold">{title}</Text>
      </Pressable>
    </View>
  );
}
```

### Custom List Components

```tsx
<MyList
  itemClassName="p-4 bg-white mb-2"
  headerClassName="p-6 bg-blue-500"
  footerClassName="p-4 bg-gray-200"
/>
```

## Related

- [Babel Configuration](/react-native-tailwind/advanced/babel-configuration/) - All plugin options
- [Reusable Components](/react-native-tailwind/guides/reusable-components/) - Building component libraries
- [List Components](/react-native-tailwind/guides/list-components/) - Styling lists
