---
title: Arbitrary Values
description: Use custom sizes, spacing, and borders not in the preset scales
---

Use arbitrary values for custom sizes, spacing, and borders not in the preset scales.

## Supported Utilities

### Spacing

```tsx
<View className="m-[16px]" />   // margin: 16
<View className="p-[20px]" />   // padding: 20
<View className="mx-[24px]" />  // marginHorizontal: 24
<View className="my-[12px]" />  // marginVertical: 12
<View className="mt-[8px]" />   // marginTop: 8
<View className="gap-[12px]" /> // gap: 12
```

:::note
Arbitrary spacing values only support pixel values. Percentages and other units are not supported.
:::

### Sizing

```tsx
<View className="w-[350px]" />    // width: 350
<View className="h-[85%]" />      // height: '85%'
<View className="min-w-[200px]" /> // minWidth: 200
<View className="max-h-[80%]" />   // maxHeight: '80%'
```

Supports:

- Pixel values: `[123px]` or `[123]`
- Percentages: `[50%]`, `[33.333%]`

### Border Width

```tsx
<View className="border-[3px]" />  // borderWidth: 3
<View className="border-t-[5px]" /> // borderTopWidth: 5
<View className="border-r-[2px]" /> // borderRightWidth: 2
<View className="border-b-[4px]" /> // borderBottomWidth: 4
<View className="border-l-[1px]" /> // borderLeftWidth: 1
```

### Border Radius

```tsx
<View className="rounded-[20px]" />    // borderRadius: 20
<View className="rounded-t-[16px]" />  // borderTopLeftRadius & borderTopRightRadius: 16
<View className="rounded-tl-[12px]" /> // borderTopLeftRadius: 12
<View className="rounded-br-[8px]" />  // borderBottomRightRadius: 8
```

### Transforms

#### Scale

```tsx
<View className="scale-[1.23]" />   // scale: 1.23
<View className="scale-x-[0.5]" />  // scaleX: 0.5
<View className="scale-y-[2.5]" />  // scaleY: 2.5
```

#### Rotate

```tsx
<View className="rotate-[37deg]" />     // rotate: '37deg'
<View className="-rotate-[15deg]" />    // rotate: '-15deg'
<View className="rotate-x-[30deg]" />   // rotateX: '30deg'
<View className="rotate-y-[45deg]" />   // rotateY: '45deg'
<View className="rotate-z-[60deg]" />   // rotateZ: '60deg'
```

#### Translate

```tsx
<View className="translate-x-[50px]" />  // translateX: 50
<View className="translate-y-[100px]" /> // translateY: 100
<View className="translate-x-[50%]" />   // translateX: '50%'
<View className="-translate-y-[25px]" /> // translateY: -25
```

#### Skew

```tsx
<View className="skew-x-[15deg]" />  // skewX: '15deg'
<View className="-skew-y-[8deg]" />  // skewY: '-8deg'
```

#### Perspective

```tsx
<View className="perspective-[1500]" /> // perspective: 1500
<View className="perspective-[2000]" /> // perspective: 2000
```

## Format Examples

### Pixels

```tsx
// With 'px' unit
<View className="w-[350px]" />
<View className="p-[20px]" />
<View className="border-[3px]" />

// Without unit (defaults to pixels)
<View className="w-[350]" />
<View className="p-[20]" />
<View className="border-[3]" />
```

### Percentages

```tsx
<View className="w-[85%]" />
<View className="h-[50%]" />
<View className="max-w-[90%]" />
<View className="translate-x-[50%]" />
```

### Degrees

```tsx
<View className="rotate-[37deg]" />
<View className="skew-x-[15deg]" />
```

### Decimals

```tsx
<View className="scale-[1.23]" />
<View className="w-[123.45px]" />
<View className="h-[33.333%]" />
```

## Common Patterns

### Custom Size Card

```tsx
<View className="w-[350px] h-[200px] bg-white rounded-[20px] p-[24px]">
  <Text>Custom sized card</Text>
</View>
```

### Precise Spacing

```tsx
<View className="flex-row gap-[18px]">
  <View className="flex-1 bg-blue-500 p-[14px] rounded-[10px]" />
  <View className="flex-1 bg-red-500 p-[14px] rounded-[10px]" />
</View>
```

### Custom Transform

```tsx
<View className="scale-[1.15] rotate-[7deg] translate-x-[5px] translate-y-[-3px]">
  <Text>Custom transformed element</Text>
</View>
```

### Responsive Sizing

```tsx
<View className="w-[90%] max-w-[600px] mx-auto p-[32px]">
  <Text>Centered container with custom constraints</Text>
</View>
```

## What's Not Supported

:::caution[Unsupported Units]
CSS units not available in React Native:

- `rem`, `em` - Use pixels instead
- `vh`, `vw` - Use percentages or Dimensions API
- `ch`, `ex` - Not supported in React Native
  :::

## Related

- [Spacing](/react-native-tailwind/reference/spacing/) - Preset spacing values
- [Sizing](/react-native-tailwind/reference/sizing/) - Preset sizing values
- [Borders](/react-native-tailwind/reference/borders/) - Preset border values
- [Transforms](/react-native-tailwind/reference/transforms/) - Preset transform values
