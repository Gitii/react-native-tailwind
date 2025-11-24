---
title: Babel Configuration
description: Complete reference for all Babel plugin options
---

Complete reference for all available Babel plugin configuration options.

## Basic Configuration

```javascript
// babel.config.js
module.exports = {
  plugins: [
    "@mgcrea/react-native-tailwind/babel", // Default options
  ],
};
```

## All Options

```javascript
// babel.config.js
module.exports = {
  plugins: [
    [
      "@mgcrea/react-native-tailwind/babel",
      {
        // Custom attributes to transform
        attributes: ["*ClassName"],

        // Custom StyleSheet identifier
        stylesIdentifier: "_twStyles",

        // Custom color scheme hook
        colorScheme: {
          importFrom: "react-native",
          importName: "useColorScheme",
        },

        // Scheme modifier configuration
        schemeModifier: {
          darkSuffix: "-dark",
          lightSuffix: "-light",
        },
      },
    ],
  ],
};
```

## Option Reference

### `attributes`

Configure which props to transform.

**Type:** `string[]`

**Default:** `["className", "contentContainerClassName", "columnWrapperClassName", "ListHeaderComponentClassName", "ListFooterComponentClassName"]`

**Examples:**

```javascript
// Exact matches
{
  attributes: ["className", "buttonClassName", "containerClassName"]
}

// Glob patterns
{
  attributes: ["*ClassName"]  // Matches any attribute ending in 'ClassName'
}

// Mixed
{
  attributes: [
    "className",
    "*ClassName",
    "custom*"
  ]
}
```

See [Custom Attributes](/advanced/custom-attributes/) for more details.

### `stylesIdentifier`

Customize the StyleSheet constant name.

**Type:** `string`

**Default:** `"_twStyles"`

**Examples:**

```javascript
{
  stylesIdentifier: "styles"      // Most common
}

{
  stylesIdentifier: "tw"          // Short form
}

{
  stylesIdentifier: "tailwind"    // Descriptive
}
```

See [Custom Styles Identifier](/advanced/custom-styles-identifier/) for more details.

### `colorScheme`

Configure custom color scheme hook.

**Type:** `{ importFrom: string; importName: string }`

**Default:** `{ importFrom: "react-native", importName: "useColorScheme" }`

**Examples:**

```javascript
// Custom hook
{
  colorScheme: {
    importFrom: "@/hooks/useColorScheme",
    importName: "useColorScheme"
  }
}

// React Navigation
{
  colorScheme: {
    importFrom: "@react-navigation/native",
    importName: "useTheme"  // Requires wrapper
  }
}

// Expo Router
{
  colorScheme: {
    importFrom: "expo-router",
    importName: "useColorScheme"
  }
}
```

See [Custom Color Scheme Hook](/advanced/custom-color-scheme-hook/) for more details.

### `schemeModifier`

Configure `scheme:` modifier color suffixes.

**Type:** `{ darkSuffix: string; lightSuffix: string }`

**Default:** `{ darkSuffix: "-dark", lightSuffix: "-light" }`

**Examples:**

```javascript
// Default (matches "color-dark" and "color-light")
{
  schemeModifier: {
    darkSuffix: "-dark",
    lightSuffix: "-light"
  }
}

// PascalCase (matches "colorDark" and "colorLight")
{
  schemeModifier: {
    darkSuffix: "Dark",
    lightSuffix: "Light"
  }
}

// Custom (matches "color_d" and "color_l")
{
  schemeModifier: {
    darkSuffix: "_d",
    lightSuffix: "_l"
  }
}
```

See [Color Scheme - Scheme Modifier](/guides/color-scheme/#scheme-modifier-convenience) for more details.

## Complete Example

```javascript
// babel.config.js
module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    [
      "@mgcrea/react-native-tailwind/babel",
      {
        // Transform all *ClassName props
        attributes: ["*ClassName"],

        // Use 'styles' as identifier
        stylesIdentifier: "styles",

        // Use custom theme hook
        colorScheme: {
          importFrom: "@/context/ThemeContext",
          importName: "useColorScheme",
        },

        // PascalCase suffixes for scheme modifier
        schemeModifier: {
          darkSuffix: "Dark",
          lightSuffix: "Light",
        },
      },
    ],
  ],
};
```

## Environment-Specific Configuration

```javascript
// babel.config.js
module.exports = function (api) {
  const isTest = api.env("test");

  return {
    presets: ["module:@react-native/babel-preset"],
    plugins: [
      [
        "@mgcrea/react-native-tailwind/babel",
        {
          // Mock color scheme in tests
          colorScheme: isTest
            ? {
                importFrom: "@/test/mocks/useColorScheme",
                importName: "useColorScheme",
              }
            : undefined,
        },
      ],
    ],
  };
};
```

## Clearing Cache

After changing Babel configuration, clear Metro's cache:

```bash
npx react-native start --reset-cache
```

## Related

- [Custom Attributes](/advanced/custom-attributes/)
- [Custom Styles Identifier](/advanced/custom-styles-identifier/)
- [Custom Color Scheme Hook](/advanced/custom-color-scheme-hook/)
- [Custom Colors](/advanced/custom-colors/)
- [Troubleshooting](/advanced/troubleshooting/)
