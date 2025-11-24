---
title: Borders
description: Border width, radius, and style utilities
---

## Border Width

### All Sides

```tsx
<View className="border" />   // borderWidth: 1
<View className="border-0" /> // borderWidth: 0
<View className="border-2" /> // borderWidth: 2
<View className="border-4" /> // borderWidth: 4
<View className="border-8" /> // borderWidth: 8
```

### Directional

```tsx
<View className="border-t" />   // borderTopWidth: 1
<View className="border-r" />   // borderRightWidth: 1
<View className="border-b" />   // borderBottomWidth: 1
<View className="border-l" />   // borderLeftWidth: 1

<View className="border-t-2" /> // borderTopWidth: 2
<View className="border-r-4" /> // borderRightWidth: 4
```

### Arbitrary Values

```tsx
<View className="border-[3px]" />  // borderWidth: 3
<View className="border-t-[5px]" /> // borderTopWidth: 5
```

## Border Radius

### All Corners

```tsx
<View className="rounded-none" /> // borderRadius: 0
<View className="rounded-sm" />   // borderRadius: 2
<View className="rounded" />      // borderRadius: 4
<View className="rounded-md" />   // borderRadius: 6
<View className="rounded-lg" />   // borderRadius: 8
<View className="rounded-xl" />   // borderRadius: 12
<View className="rounded-2xl" />  // borderRadius: 16
<View className="rounded-3xl" />  // borderRadius: 24
<View className="rounded-full" /> // borderRadius: 9999
```

### Directional

```tsx
<View className="rounded-t-lg" /> // borderTopLeftRadius & borderTopRightRadius: 8
<View className="rounded-r-lg" /> // borderTopRightRadius & borderBottomRightRadius: 8
<View className="rounded-b-lg" /> // borderBottomLeftRadius & borderBottomRightRadius: 8
<View className="rounded-l-lg" /> // borderTopLeftRadius & borderBottomLeftRadius: 8
```

### Individual Corners

```tsx
<View className="rounded-tl-lg" /> // borderTopLeftRadius: 8
<View className="rounded-tr-lg" /> // borderTopRightRadius: 8
<View className="rounded-bl-lg" /> // borderBottomLeftRadius: 8
<View className="rounded-br-lg" /> // borderBottomRightRadius: 8
```

### Arbitrary Values

```tsx
<View className="rounded-[20px]" />    // borderRadius: 20
<View className="rounded-tl-[16px]" /> // borderTopLeftRadius: 16
```

## Border Style

```tsx
<View className="border-solid" />  // borderStyle: 'solid'
<View className="border-dotted" /> // borderStyle: 'dotted'
<View className="border-dashed" /> // borderStyle: 'dashed'
```

## Common Patterns

### Card with border

```tsx
<View className="border border-gray-200 rounded-lg p-4">
  <Text>Card content</Text>
</View>
```

### Outlined button

```tsx
<Pressable className="border-2 border-blue-500 rounded-lg px-6 py-3">
  <Text className="text-blue-500 font-semibold">Button</Text>
</Pressable>
```

### Circular avatar

```tsx
<View className="w-16 h-16 rounded-full border-2 border-white">
  <Image source={avatar} className="w-full h-full rounded-full" />
</View>
```

### Divider

```tsx
<View className="border-b border-gray-200 my-4" />
```

## Related

- [Colors](/reference/colors/) - Border color utilities
- [Shadows](/reference/shadows/) - Shadow and elevation
