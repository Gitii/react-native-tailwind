---
title: Custom Colors
description: Extend the default color palette via tailwind.config
---

Extend the default color palette and font families via `tailwind.config.*` in your project root.

## Configuration

Create a `tailwind.config.mjs` file in your project root:

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
      fontFamily: {
        sans: ['"SF Pro Rounded"'],
        custom: ['"My Custom Font"'],
      },
    },
  },
};
```

## Usage

```tsx
<View className="bg-primary p-4">
  <Text className="text-secondary font-custom">Custom styled text</Text>
  <Text className="font-sans">SF Pro Rounded text</Text>
  <View className="bg-brand-light rounded-lg" />
  <View className="bg-brand-dark rounded-lg" />
</View>
```

## Supported Formats

The config file can be in any of these formats:

- `tailwind.config.mjs` (ESM)
- `tailwind.config.js` (CommonJS)
- `tailwind.config.cjs` (CommonJS)
- `tailwind.config.ts` (TypeScript)

## How It Works

1. **Build-time discovery**: Babel plugin discovers config by traversing up from source files
2. **Merge with defaults**: Custom theme merged with defaults at build time (custom takes precedence)
3. **Flatten nested colors**: Nested color objects flattened with dash notation: `brand.light` → `brand-light`
4. **Font selection**: Uses first font in array (React Native doesn't support font stacks)
5. **Zero runtime overhead**: All loading happens during compilation

## Color Flattening

Nested color objects are automatically flattened:

```javascript
// tailwind.config.mjs
{
  colors: {
    brand: {
      light: "#f0f9ff",
      DEFAULT: "#0284c7",
      dark: "#0c4a6e",
    }
  }
}
```

Becomes:

```javascript
{
  "brand": "#0284c7",       // DEFAULT
  "brand-light": "#f0f9ff",
  "brand-dark": "#0c4a6e"
}
```

Usage:

```tsx
<View className="bg-brand" />         // Uses DEFAULT
<View className="bg-brand-light" />
<View className="bg-brand-dark" />
```

## Font Families

```javascript
// tailwind.config.mjs
{
  fontFamily: {
    sans: ['"SF Pro Rounded"', '"System"'],  // First font is used
    serif: ['"Georgia"'],
    mono: ['"Courier New"'],
    custom: ['"My Custom Font"'],
  }
}
```

Usage:

```tsx
<Text className="font-sans">SF Pro Rounded</Text>
<Text className="font-serif">Georgia</Text>
<Text className="font-mono">Courier New</Text>
<Text className="font-custom">My Custom Font</Text>
```

## Best Practices

### Use `theme.extend`

✅ **Recommended**: Use `theme.extend.*` to keep defaults

```javascript
{
  theme: {
    extend: {
      colors: {
        primary: "#1d4ed8",
      }
    }
  }
}
```

❌ **Not recommended**: Using `theme.colors` directly overrides all defaults

```javascript
{
  theme: {
    colors: {
      primary: "#1d4ed8",
      // ⚠️ All default colors (gray, blue, red, etc.) are now gone!
    }
  }
}
```

### Semantic Naming

Use semantic names for better maintainability:

```javascript
{
  colors: {
    primary: "#1d4ed8",
    secondary: "#9333ea",
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
  }
}
```

### Scheme Modifier Support

For `scheme:` modifier, define both light and dark variants:

```javascript
{
  colors: {
    systemBackground: {
      light: "#ffffff",
      dark: "#000000",
    },
    systemLabel: {
      light: "#000000",
      dark: "#ffffff",
    },
  }
}
```

Usage:

```tsx
<View className="scheme:bg-systemBackground">
  <Text className="scheme:text-systemLabel">Adaptive colors</Text>
</View>
```

## Clearing Cache

Config changes require Metro cache reset:

```bash
npx react-native start --reset-cache
```

## Troubleshooting

### Custom colors not recognized

1. **Config location**: Must be in project root or parent directory
2. **Config format**: Verify proper export (see examples above)
3. **Clear cache**: Config changes require Metro cache reset
4. **Use `theme.extend`**: Don't use `theme.colors` directly

### Color not found warning

If you see warnings about missing colors:

- Check spelling in both config and usage
- Verify config is being loaded (check file location)
- Clear Metro cache and restart

## Related

- [Colors Reference](/react-native-tailwind/reference/colors/) - Color utilities
- [Color Scheme](/react-native-tailwind/guides/color-scheme/) - Dark mode support
- [Troubleshooting](/react-native-tailwind/advanced/troubleshooting/) - Common issues
