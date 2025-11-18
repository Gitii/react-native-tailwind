# Quick Start Guide

Get up and running with @mgcrea/react-native-tailwind in 3 minutes!

## Installation

```bash
npm install @mgcrea/react-native-tailwind
```

## Setup (2 steps)

### 1. Update babel.config.js

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@mgcrea/react-native-tailwind/babel', // ← Add this
  ],
};
```

### 2. Add Type Definitions (TypeScript only)

In your App.tsx (or any file using className):

```typescript
import '@mgcrea/react-native-tailwind/src/react-native';
import { View, Text } from 'react-native';
```

## Usage

```tsx
export function App() {
  return (
    <View className="flex-1 bg-gray-100 p-4">
      <Text className="text-2xl font-bold text-blue-500 mb-4">
        Hello Tailwind!
      </Text>

      <View className="bg-white rounded-lg p-6">
        <Text className="text-base text-gray-700">
          This is compiled at build time with zero runtime overhead!
        </Text>
      </View>
    </View>
  );
}
```

## What Happens?

The Babel plugin transforms your code from this:

```tsx
<View className="m-4 p-2 bg-blue-500" />
```

To this at compile-time:

```tsx
<View style={styles._bg_blue_500_m_4_p_2} />

const styles = StyleSheet.create({
  _bg_blue_500_m_4_p_2: {
    margin: 16,
    padding: 8,
    backgroundColor: '#3B82F6',
  },
});
```

## Common Classes

### Layout
```tsx
className="flex-1 flex-row items-center justify-between"
```

### Spacing
```tsx
className="m-4 px-6 py-3"
```

### Colors
```tsx
className="bg-blue-500 text-white border border-gray-200"
```

### Typography
```tsx
className="text-xl font-bold text-center"
```

### Borders & Rounded
```tsx
className="border-2 border-gray-300 rounded-lg"
```

## Need Help?

- 📖 [Full Documentation](README.md)
- 💬 [GitHub Issues](https://github.com/mgcrea/react-native-tailwind/issues)
- 🎯 See the [example app](./example) for a complete working example

## Next Steps

1. Clear Metro cache: `npx react-native start --reset-cache`
2. Run your app: `npx react-native run-ios` or `npx react-native run-android`
3. Check the [README](README.md) for the full list of supported classes

Happy coding! 🎉
