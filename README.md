# @mgcrea/react-native-tailwind

> Compile-time Tailwind CSS for React Native with zero runtime overhead

A modern, performant Tailwind-like utility library for React Native that transforms `className` props to optimized `StyleSheet.create` calls at build time using a Babel plugin.

## Features

- ✅ **Zero runtime overhead** - All transformations happen at compile time
- ✅ **Babel-only setup** - No Metro configuration required (like Reanimated)
- ✅ **TypeScript-first** - Full type safety and autocomplete support
- ✅ **Optimized performance** - Uses `StyleSheet.create` for optimal React Native performance
- ✅ **Small bundle size** - Only includes actual styles used in your app
- ✅ **No dependencies** - Direct-to-React-Native style generation without tailwindcss package

## Installation

```bash
npm install @mgcrea/react-native-tailwind
# or
yarn add @mgcrea/react-native-tailwind
# or
pnpm add @mgcrea/react-native-tailwind
```

## Setup

### 1. Add Babel Plugin

Update your `babel.config.js`:

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@mgcrea/react-native-tailwind/babel', // Add this line
  ],
};
```

### 2. Enable TypeScript Support (TypeScript)

Create a type declaration file in your project to enable `className` prop autocomplete:

**Create `src/types/react-native-tailwind.d.ts`:**

```typescript
import '@mgcrea/react-native-tailwind/react-native';
```

This file will be automatically picked up by TypeScript and enables autocomplete for the `className` prop on all React Native components.

> **Why is this needed?** TypeScript module augmentation requires the declaration file to be part of your project's compilation context. This one-time setup ensures the `className` prop is recognized throughout your codebase.

### 3. Start Using className

```tsx
import { View, Text } from 'react-native';

export function MyComponent() {
  return (
    <View className="flex-1 bg-gray-100 p-4">
      <Text className="text-xl font-bold text-blue-500">
        Hello, Tailwind!
      </Text>
    </View>
  );
}
```

## How It Works

The Babel plugin transforms your code at compile time:

### Input (what you write):

```tsx
<View className="m-4 p-2 bg-blue-500 rounded-lg" />
```

### Output (what Babel generates):

```tsx
import { StyleSheet } from 'react-native';

<View style={styles._bg_blue_500_m_4_p_2_rounded_lg} />

const styles = StyleSheet.create({
  _bg_blue_500_m_4_p_2_rounded_lg: {
    margin: 16,
    padding: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
});
```

## Supported Classes

### Spacing (Margin & Padding)

- `m-{size}` - margin (all sides)
- `mx-{size}`, `my-{size}` - horizontal/vertical margin
- `mt-{size}`, `mr-{size}`, `mb-{size}`, `ml-{size}` - directional margin
- `p-{size}` - padding (all sides)
- `px-{size}`, `py-{size}` - horizontal/vertical padding
- `pt-{size}`, `pr-{size}`, `pb-{size}`, `pl-{size}` - directional padding
- `gap-{size}` - gap

**Available sizes:** 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96

### Layout (Flexbox)

- `flex`, `flex-1`, `flex-auto`, `flex-none`
- `flex-row`, `flex-row-reverse`, `flex-col`, `flex-col-reverse`
- `flex-wrap`, `flex-wrap-reverse`, `flex-nowrap`
- `items-start`, `items-end`, `items-center`, `items-baseline`, `items-stretch`
- `justify-start`, `justify-end`, `justify-center`, `justify-between`, `justify-around`, `justify-evenly`
- `self-auto`, `self-start`, `self-end`, `self-center`, `self-stretch`, `self-baseline`
- `grow`, `grow-0`, `shrink`, `shrink-0`

### Colors

- `bg-{color}-{shade}` - background color
- `text-{color}-{shade}` - text color
- `border-{color}-{shade}` - border color

**Available colors:** gray, red, blue, green, yellow, purple, pink, orange, indigo, white, black, transparent

**Available shades:** 50, 100, 200, 300, 400, 500, 600, 700, 800, 900

### Typography

- **Font Size:** `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`, `text-5xl`, `text-6xl`, `text-7xl`, `text-8xl`, `text-9xl`
- **Font Weight:** `font-thin`, `font-extralight`, `font-light`, `font-normal`, `font-medium`, `font-semibold`, `font-bold`, `font-extrabold`, `font-black`
- **Font Style:** `italic`, `not-italic`
- **Text Align:** `text-left`, `text-center`, `text-right`, `text-justify`
- **Text Decoration:** `underline`, `line-through`, `no-underline`
- **Text Transform:** `uppercase`, `lowercase`, `capitalize`, `normal-case`
- **Line Height:** `leading-none`, `leading-tight`, `leading-snug`, `leading-normal`, `leading-relaxed`, `leading-loose`

### Borders

- **Width:** `border`, `border-0`, `border-2`, `border-4`, `border-8`
- **Directional:** `border-t`, `border-r`, `border-b`, `border-l` (with variants -0, -2, -4)
- **Radius:** `rounded-none`, `rounded-sm`, `rounded`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full`
- **Directional Radius:** `rounded-t`, `rounded-r`, `rounded-b`, `rounded-l` (with -none, -lg variants)
- **Style:** `border-solid`, `border-dotted`, `border-dashed`

### Sizing

- `w-{size}`, `h-{size}` - width/height
- `min-w-{size}`, `min-h-{size}` - min width/height
- `max-w-{size}`, `max-h-{size}` - max width/height

**Available sizes:**
- Numeric: 0-96 (same as spacing scale)
- Fractional: `1/2`, `1/3`, `2/3`, `1/4`, `3/4`, `1/5`, `2/5`, `3/5`, `4/5`, `1/6`, `2/6`, `3/6`, `4/6`, `5/6`
- Special: `full` (100%), `auto`

### Other

- **Position:** `absolute`, `relative`
- **Overflow:** `overflow-hidden`, `overflow-visible`, `overflow-scroll`
- **Display:** `flex`, `hidden`

## Examples

### Basic Card Component

```tsx
import { View, Text, Pressable } from 'react-native';

export function Card({ title, description, onPress }) {
  return (
    <View className="bg-white rounded-lg p-6 mb-4 border border-gray-200">
      <Text className="text-xl font-semibold text-gray-900 mb-2">
        {title}
      </Text>
      <Text className="text-base text-gray-600 mb-4">
        {description}
      </Text>
      <Pressable
        className="bg-blue-500 px-4 py-2 rounded-lg items-center"
        onPress={onPress}
      >
        <Text className="text-white font-semibold">
          Learn More
        </Text>
      </Pressable>
    </View>
  );
}
```

### Combining with Inline Styles

You can still use inline `style` prop alongside `className`:

```tsx
<View
  className="flex-1 p-4 bg-blue-500"
  style={{ paddingTop: safeAreaInsets.top }}
>
  <Text>Content</Text>
</View>
```

The Babel plugin will generate:

```tsx
<View style={[styles._className_styles, { paddingTop: safeAreaInsets.top }]}>
  <Text>Content</Text>
</View>
```

## Performance

### Benchmark Comparison

| Approach | Runtime Overhead | Bundle Size | Build Time |
|----------|-----------------|-------------|------------|
| **This Library (Babel)** | 0ms (compile-time) | ~4kb | +50-200ms |
| Runtime Parser | ~2-5ms per component | ~28kb | 0ms |
| NativeWind v4 | Very low | Medium | +100-500ms |

### Why It's Fast

1. **Zero Runtime Cost:** All className parsing happens at build time
2. **StyleSheet.create:** Uses React Native's optimized StyleSheet API
3. **Tree Shaking:** Only includes styles actually used in your app
4. **Deduplication:** Identical styles are reused across components

## Limitations

### Dynamic Class Names Not Supported

```tsx
// ❌ This will NOT work
const spacing = 4;
<View className={`m-${spacing} p-2`} />

// ✅ Use inline styles for dynamic values
<View className="p-2" style={{ margin: spacing * 4 }} />
```

The Babel plugin can only transform static string literals. For dynamic styling, use the `style` prop.

## Comparison with Other Libraries

### vs NativeWind

| Feature | NativeWind v4 | This Library |
|---------|---------------|--------------|
| Setup | Metro + Babel | Babel only |
| tailwindcss dependency | Yes | No |
| Runtime overhead | Very low | Zero |
| Dynamic classes | Full support | Limited |
| Bundle size | Medium | Smaller |
| Learning curve | Moderate | Low |

### vs twrnc (Tailwind React Native Classnames)

| Feature | twrnc | This Library |
|---------|-------|--------------|
| Approach | Runtime parser | Compile-time |
| Performance | Good (cached) | Excellent (zero runtime) |
| Bundle size | ~20kb | ~4kb |
| Dynamic classes | Full support | Limited |

## Migration from Runtime Wrapper

If you were using the old `createTailwindComponent` wrapper:

### Before:

```tsx
import { createTailwindViewComponent } from '@mgcrea/react-native-tailwind';

const StyledView = createTailwindViewComponent(View);

<StyledView className="m-4 p-2" />
```

### After:

```tsx
import { View } from 'react-native';

<View className="m-4 p-2" />
```

Simply:
1. Add the Babel plugin to your config
2. Create the TypeScript declaration file (`src/types/react-native-tailwind.d.ts`)
3. Use `className` directly on React Native components!

## Advanced Usage

### Custom Colors via Tailwind Config

You can extend the default color palette by creating a `tailwind.config.js` (or `.mjs`, `.cjs`) file in your project root:

```javascript
// tailwind.config.mjs
export default {
  theme: {
    extend: {
      colors: {
        primary: '#1d4ed8',
        secondary: '#9333ea',
        brand: {
          light: '#f0f9ff',
          DEFAULT: '#0284c7',
          dark: '#0c4a6e',
        },
      },
    },
  },
};
```

Then use your custom colors in className:

```tsx
<View className="bg-primary p-4">
  <Text className="text-brand">Custom branded text</Text>
  <View className="bg-brand-light rounded-lg">
    {/* Nested colors become brand-light, brand-dark */}
  </View>
</View>
```

**How it works:**
- The Babel plugin automatically discovers `tailwind.config.*` files by traversing up from your source files
- Custom colors are merged with defaults at build time (custom colors take precedence)
- Nested color objects are flattened using dash notation (e.g., `brand.light` → `brand-light`)
- **Zero runtime overhead** - All config loading happens during compilation

**Supported config formats:**
- `tailwind.config.js` (CommonJS)
- `tailwind.config.mjs` (ES modules)
- `tailwind.config.cjs` (CommonJS explicit)
- `tailwind.config.ts` (TypeScript - experimental)

**Best practice:**
Use `theme.extend.colors` to add custom colors while keeping all default Tailwind colors. Using `theme.colors` directly will override all defaults.

### Accessing the Parser Programmatically

```typescript
import { parseClassName } from '@mgcrea/react-native-tailwind';

const styles = parseClassName('m-4 p-2 bg-blue-500');
// Returns: { margin: 16, padding: 8, backgroundColor: '#3B82F6' }
```

### Customizing Colors/Spacing

You can import and modify the default scales:

```typescript
import { COLORS, SPACING_SCALE } from '@mgcrea/react-native-tailwind';

// Use in your own utilities
const customColor = COLORS['blue-500']; // '#3B82F6'
const customSpacing = SPACING_SCALE[4]; // 16
```

## Troubleshooting

### TypeScript Errors

If you see TypeScript errors about `className` not being a valid prop:

1. Make sure you've created the type declaration file:
   ```typescript
   // src/types/react-native-tailwind.d.ts
   import '@mgcrea/react-native-tailwind/react-native';
   ```

2. Verify the file is in a location covered by your `tsconfig.json` `include` pattern

3. Restart your TypeScript server in VS Code (Cmd+Shift+P → "TypeScript: Restart TS Server")

### Babel Plugin Not Working

1. Clear Metro cache:
   ```bash
   npx react-native start --reset-cache
   ```

2. Verify `babel.config.js` includes the plugin:
   ```javascript
   plugins: ['@mgcrea/react-native-tailwind/babel']
   ```

3. Check that the plugin is installed in your `node_modules`

### Custom Colors Not Working

If your custom colors from `tailwind.config.*` aren't being recognized:

1. **Check config file location**: The config must be in your project root or a parent directory. The Babel plugin searches upward from each source file.

2. **Verify config format**: Make sure your config exports the theme correctly:
   ```javascript
   // ✅ Correct (CommonJS)
   module.exports = {
     theme: { extend: { colors: { ... } } }
   };

   // ✅ Correct (ESM)
   export default {
     theme: { extend: { colors: { ... } } }
   };
   ```

3. **Clear Metro cache**: Config changes require cache reset:
   ```bash
   npx react-native start --reset-cache
   ```

4. **Check build output**: The Babel plugin logs warnings about config loading in development. Check Metro logs for `[react-native-tailwind]` messages.

5. **Use theme.extend.colors**: Don't use `theme.colors` directly as it will override all defaults:
   ```javascript
   // ❌ Overrides all defaults
   theme: { colors: { primary: '#000' } }

   // ✅ Extends defaults
   theme: { extend: { colors: { primary: '#000' } } }
   ```

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) first.

## License

MIT © [Olivier Louvignes](https://github.com/mgcrea)

## Acknowledgments

- Inspired by [Tailwind CSS](https://tailwindcss.com/)
- Babel transformation approach inspired by [Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- Performance optimizations inspired by [fast-styles](https://github.com/ferologics/fast-styles)
