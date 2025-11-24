---
title: Custom Styles Identifier
description: Customize the StyleSheet constant name
---

By default, the Babel plugin generates a StyleSheet constant named `_twStyles`. You can customize this identifier to avoid conflicts or match your project's naming conventions.

## Configuration

```javascript
// babel.config.js
module.exports = {
  plugins: [
    [
      "@mgcrea/react-native-tailwind/babel",
      {
        stylesIdentifier: "styles", // or 'tw', 'tailwind', etc.
      },
    ],
  ],
};
```

## Default Behavior

```tsx
// Input
<View className="p-4 bg-blue-500" />

// Output
<View style={_twStyles._bg_blue_500_p_4} />

const _twStyles = StyleSheet.create({
  _bg_blue_500_p_4: { padding: 16, backgroundColor: '#3B82F6' }
});
```

## With Custom Identifier

```tsx
// Input (with stylesIdentifier: "styles")
<View className="p-4 bg-blue-500" />

// Output
<View style={styles._bg_blue_500_p_4} />

const styles = StyleSheet.create({
  _bg_blue_500_p_4: { padding: 16, backgroundColor: '#3B82F6' }
});
```

## Use Cases

### Avoid Conflicts

If you already have a `_twStyles` variable in your code:

```javascript
{
  stylesIdentifier: "twStyles"
}
```

### Consistency

Match your existing StyleSheet naming convention:

```javascript
{
  stylesIdentifier: "styles"  // Most common
}
```

### Shorter Names

Use a shorter identifier for more compact code:

```javascript
{
  stylesIdentifier: "tw"  // or "s"
}
```

### Team Conventions

Align with your team's coding standards:

```javascript
{
  stylesIdentifier: "tailwindStyles"
}
```

## Important Notes

- The identifier must be a valid JavaScript variable name
- Choose a name that won't conflict with existing variables in your files
- The same identifier is used across all files in your project

## Related

- [Babel Configuration](/advanced/babel-configuration/) - All plugin options
- [Custom Attributes](/advanced/custom-attributes/) - Configure attribute transforms
