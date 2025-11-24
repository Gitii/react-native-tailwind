---
title: Sizing
description: Width and height utilities
---

Control element dimensions with width and height utilities.

## Width

### Numeric

```tsx
<View className="w-0" />   // width: 0
<View className="w-4" />   // width: 16
<View className="w-8" />   // width: 32
<View className="w-16" />  // width: 64
<View className="w-32" />  // width: 128
<View className="w-64" />  // width: 256
<View className="w-96" />  // width: 384
```

### Fractional

```tsx
<View className="w-1/2" />  // width: '50%'
<View className="w-1/3" />  // width: '33.333333%'
<View className="w-2/3" />  // width: '66.666667%'
<View className="w-1/4" />  // width: '25%'
<View className="w-3/4" />  // width: '75%'
<View className="w-1/5" />  // width: '20%'
```

### Special

```tsx
<View className="w-full" /> // width: '100%'
<View className="w-auto" /> // width: undefined
```

### Arbitrary

```tsx
<View className="w-[123px]" /> // width: 123
<View className="w-[50%]" />   // width: '50%'
```

## Height

### Numeric

```tsx
<View className="h-0" />   // height: 0
<View className="h-4" />   // height: 16
<View className="h-8" />   // height: 32
<View className="h-16" />  // height: 64
<View className="h-32" />  // height: 128
<View className="h-64" />  // height: 256
<View className="h-96" />  // height: 384
```

### Fractional

```tsx
<View className="h-1/2" />  // height: '50%'
<View className="h-1/3" />  // height: '33.333333%'
<View className="h-2/3" />  // height: '66.666667%'
<View className="h-1/4" />  // height: '25%'
<View className="h-3/4" />  // height: '75%'
```

### Special

```tsx
<View className="h-full" /> // height: '100%'
<View className="h-auto" /> // height: undefined
```

### Arbitrary

```tsx
<View className="h-[123px]" /> // height: 123
<View className="h-[80%]" />   // height: '80%'
```

## Min Width

```tsx
<View className="min-w-0" />    // minWidth: 0
<View className="min-w-16" />   // minWidth: 64
<View className="min-w-full" /> // minWidth: '100%'
<View className="min-w-[200px]" /> // minWidth: 200
```

## Max Width

```tsx
<View className="max-w-16" />   // maxWidth: 64
<View className="max-w-full" /> // maxWidth: '100%'
<View className="max-w-[400px]" /> // maxWidth: 400
```

## Min Height

```tsx
<View className="min-h-0" />    // minHeight: 0
<View className="min-h-16" />   // minHeight: 64
<View className="min-h-full" /> // minHeight: '100%'
<View className="min-h-[200px]" /> // minHeight: 200
```

## Max Height

```tsx
<View className="max-h-16" />   // maxHeight: 64
<View className="max-h-full" /> // maxHeight: '100%'
<View className="max-h-[80%]" /> // maxHeight: '80%'
```

## Common Patterns

### Full Screen

```tsx
<View className="w-full h-full">
  <Text>Full screen content</Text>
</View>
```

### Half Width

```tsx
<View className="flex-row gap-2">
  <View className="w-1/2 bg-blue-500 p-4" />
  <View className="w-1/2 bg-red-500 p-4" />
</View>
```

### Fixed Size Square

```tsx
<View className="w-16 h-16 bg-gray-200 rounded" />
```

### Responsive Grid

```tsx
<View className="flex-row flex-wrap gap-2">
  <View className="w-[48%] bg-gray-200 p-4">Item 1</View>
  <View className="w-[48%] bg-gray-200 p-4">Item 2</View>
</View>
```

### Minimum Content Height

```tsx
<View className="min-h-[200px] bg-gray-100 p-4">
  <Text>Content with minimum height</Text>
</View>
```

### Maximum Width Container

```tsx
<View className="w-full max-w-[600px] mx-auto p-4">
  <Text>Centered container with max width</Text>
</View>
```

## Note

Arbitrary sizing supports:
- Pixel values: `[123px]` or `[123]`
- Percentages: `[50%]`

Other units (`rem`, `em`, `vh`, `vw`) are not supported in React Native.

## Related

- [Spacing](./spacing/) - Margin and padding
- [Layout](./layout/) - Flexbox utilities
- [Aspect Ratio](./aspect-ratio/) - Aspect ratio utilities
