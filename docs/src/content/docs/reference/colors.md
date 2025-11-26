---
title: Colors
description: Background, text, and border color utilities
---

Apply colors to backgrounds, text, and borders. Supports custom colors via [tailwind.config.*](/react-native-tailwind/advanced/custom-colors/).

## Color Utilities

### Background Colors

```tsx
<View className="bg-white" />
<View className="bg-black" />
<View className="bg-gray-500" />
<View className="bg-blue-500" />
<View className="bg-red-600" />
```

### Text Colors

```tsx
<Text className="text-white" />
<Text className="text-black" />
<Text className="text-gray-900" />
<Text className="text-blue-500" />
<Text className="text-red-600" />
```

### Border Colors

```tsx
<View className="border border-gray-300" />
<View className="border-2 border-blue-500" />
<View className="border-4 border-red-600" />
```

### Directional Border Colors

Apply different colors to individual border sides:

```tsx
<View className="border-t-red-500" />   // Top border color
<View className="border-r-blue-500" />  // Right border color
<View className="border-b-green-500" /> // Bottom border color
<View className="border-l-gray-300" />  // Left border color

// Horizontal and vertical shortcuts
<View className="border-x-blue-500" />  // Left + right borders
<View className="border-y-red-500" />   // Top + bottom borders
```

Combine with widths for accent borders:

```tsx
<View className="border border-gray-200 border-l-4 border-l-blue-500">
  // Gray border on all sides, thick blue left border
</View>
```

Supports all color features (opacity, arbitrary values, custom colors):

```tsx
<View className="border-t-red-500/50" />        // With opacity
<View className="border-l-[#ff0000]" />         // Arbitrary hex color
<View className="border-b-primary" />           // Custom color from config
```

See [Borders reference](/react-native-tailwind/reference/borders/) for more border utilities.

## Available Colors

- **gray**: `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`
- **red**: `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`
- **blue**: `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`
- **green**: `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`
- **yellow**: `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`
- **purple**: `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`
- **pink**: `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`
- **orange**: `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`
- **indigo**: `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`
- **white**: Single color
- **black**: Single color
- **transparent**: Transparent

## Opacity Modifiers

Apply transparency to any color using the `/` operator with a percentage value (0-100):

```tsx
<View className="bg-black/50" />           // 50% opacity black
<Text className="text-gray-900/80" />     // 80% opacity gray text
<View className="border-2 border-red-500/30" /> // 30% opacity red border
```

Works with all color types:

```tsx
// Preset colors
<View className="bg-blue-500/75" />

// Arbitrary colors
<View className="bg-[#ff0000]/40" />

// Custom colors
<View className="bg-primary/60" />
```

## Custom Colors

Extend the default palette via `tailwind.config.*`:

```javascript
// tailwind.config.mjs
export default {
  theme: {
    extend: {
      colors: {
        primary: "#1d4ed8",
        secondary: "#9333ea",
        brand: {
          light: "#f0f9ff",
          DEFAULT: "#0284c7",
          dark: "#0c4a6e",
        },
      },
    },
  },
};
```

Then use them:

```tsx
<View className="bg-primary" />
<Text className="text-secondary" />
<View className="border border-brand" />
<View className="bg-brand-light" />
<View className="bg-brand-dark" />
```

See [Custom Colors](/react-native-tailwind/advanced/custom-colors/) for more details.

## Common Patterns

### Card with theme-aware colors

```tsx
<View className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
  <Text className="text-gray-900 dark:text-white font-bold">Title</Text>
  <Text className="text-gray-600 dark:text-gray-300">Description</Text>
</View>
```

### Status indicators

```tsx
<View className="bg-green-100 border border-green-500 p-3 rounded">
  <Text className="text-green-900">Success message</Text>
</View>

<View className="bg-red-100 border border-red-500 p-3 rounded">
  <Text className="text-red-900">Error message</Text>
</View>

<View className="bg-yellow-100 border border-yellow-500 p-3 rounded">
  <Text className="text-yellow-900">Warning message</Text>
</View>
```

### Gradient-like effect (using opacity)

```tsx
<View className="bg-blue-500/10 p-4 rounded-lg">
  <View className="bg-blue-500/20 p-4 rounded-lg">
    <View className="bg-blue-500/30 p-4 rounded-lg">
      <Text className="text-blue-900">Nested opacity</Text>
    </View>
  </View>
</View>
```

## Related

- [Custom Colors](/react-native-tailwind/advanced/custom-colors/) - Extend the color palette
- [Color Scheme](/react-native-tailwind/guides/color-scheme/) - Dark mode support
- [Typography](/react-native-tailwind/reference/typography/) - Text styling
