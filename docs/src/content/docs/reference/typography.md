---
title: Typography
description: Text styling utilities including font size, weight, and alignment
---

Control text appearance with font size, weight, alignment, and decoration utilities.

## Font Size

```tsx
<Text className="text-xs" />   // fontSize: 12
<Text className="text-sm" />   // fontSize: 14
<Text className="text-base" /> // fontSize: 16
<Text className="text-lg" />   // fontSize: 18
<Text className="text-xl" />   // fontSize: 20
<Text className="text-2xl" />  // fontSize: 24
<Text className="text-3xl" />  // fontSize: 30
<Text className="text-4xl" />  // fontSize: 36
<Text className="text-5xl" />  // fontSize: 48
<Text className="text-6xl" />  // fontSize: 60
<Text className="text-7xl" />  // fontSize: 72
<Text className="text-8xl" />  // fontSize: 96
<Text className="text-9xl" />  // fontSize: 128
```

## Font Weight

```tsx
<Text className="font-thin" />       // fontWeight: '100'
<Text className="font-extralight" /> // fontWeight: '200'
<Text className="font-light" />      // fontWeight: '300'
<Text className="font-normal" />     // fontWeight: '400'
<Text className="font-medium" />     // fontWeight: '500'
<Text className="font-semibold" />   // fontWeight: '600'
<Text className="font-bold" />       // fontWeight: '700'
<Text className="font-extrabold" />  // fontWeight: '800'
<Text className="font-black" />      // fontWeight: '900'
```

## Font Style

```tsx
<Text className="italic" />     // fontStyle: 'italic'
<Text className="not-italic" /> // fontStyle: 'normal'
```

## Text Alignment

```tsx
<Text className="text-left" />    // textAlign: 'left'
<Text className="text-center" />  // textAlign: 'center'
<Text className="text-right" />   // textAlign: 'right'
<Text className="text-justify" /> // textAlign: 'justify'
```

## Text Decoration

```tsx
<Text className="underline" />      // textDecorationLine: 'underline'
<Text className="line-through" />   // textDecorationLine: 'line-through'
<Text className="no-underline" />   // textDecorationLine: 'none'
```

## Text Transform

```tsx
<Text className="uppercase" />   // textTransform: 'uppercase'
<Text className="lowercase" />   // textTransform: 'lowercase'
<Text className="capitalize" />  // textTransform: 'capitalize'
<Text className="normal-case" /> // textTransform: 'none'
```

## Line Height

### Numeric Scale

```tsx
<Text className="leading-3" />  // lineHeight: 12
<Text className="leading-4" />  // lineHeight: 16
<Text className="leading-5" />  // lineHeight: 20
<Text className="leading-6" />  // lineHeight: 24
<Text className="leading-7" />  // lineHeight: 28
<Text className="leading-8" />  // lineHeight: 32
<Text className="leading-9" />  // lineHeight: 36
<Text className="leading-10" /> // lineHeight: 40
```

### Named Values

```tsx
<Text className="leading-none" />     // lineHeight: 16
<Text className="leading-tight" />    // lineHeight: 20
<Text className="leading-snug" />     // lineHeight: 22
<Text className="leading-normal" />   // lineHeight: 24
<Text className="leading-relaxed" />  // lineHeight: 26
<Text className="leading-loose" />    // lineHeight: 32
```

## Common Patterns

### Heading Styles

```tsx
<Text className="text-3xl font-bold text-gray-900 mb-2">
  Heading 1
</Text>

<Text className="text-2xl font-semibold text-gray-800 mb-2">
  Heading 2
</Text>

<Text className="text-xl font-medium text-gray-700 mb-2">
  Heading 3
</Text>
```

### Body Text

```tsx
<Text className="text-base text-gray-600 leading-relaxed">
  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
</Text>
```

### Labels

```tsx
<Text className="text-sm font-medium text-gray-700 mb-1">
  Email Address
</Text>
```

### Links

```tsx
<Text className="text-blue-500 underline">
  Read more
</Text>
```

### Captions

```tsx
<Text className="text-xs text-gray-500 italic">
  Last updated 2 hours ago
</Text>
```

## Related

- [Colors](/reference/colors/) - Text color utilities
- [Spacing](/reference/spacing/) - Margin and padding
