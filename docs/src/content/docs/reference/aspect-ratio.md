---
title: Aspect Ratio
description: Control aspect ratio of views
---

Control the aspect ratio of views using preset or arbitrary values. Requires React Native 0.71+.

## Preset Values

```tsx
<View className="aspect-auto" />   // aspectRatio: undefined
<View className="aspect-square" /> // aspectRatio: 1
<View className="aspect-video" />  // aspectRatio: 16/9 (1.778)
```

## Arbitrary Values

Use `aspect-[width/height]` for custom ratios:

```tsx
<View className="aspect-[4/3]" />   // 4:3 ratio (1.333...)
<View className="aspect-[16/9]" />  // 16:9 ratio (1.778...)
<View className="aspect-[21/9]" />  // 21:9 ultrawide
<View className="aspect-[9/16]" />  // 9:16 portrait
<View className="aspect-[3/2]" />   // 3:2 ratio (1.5)
```

## Common Aspect Ratios

| Ratio | Class | Decimal | Use Case |
|-------|-------|---------|----------|
| 1:1 | `aspect-square` | 1.0 | Profile pictures, thumbnails |
| 16:9 | `aspect-video` | 1.778 | Videos, landscape photos |
| 4:3 | `aspect-[4/3]` | 1.333 | Standard photos |
| 3:2 | `aspect-[3/2]` | 1.5 | Classic photography |
| 21:9 | `aspect-[21/9]` | 2.333 | Ultrawide/cinematic |
| 9:16 | `aspect-[9/16]` | 0.5625 | Stories, vertical video |

## Examples

### Square image container

```tsx
<View className="w-full aspect-square bg-gray-200">
  <Image source={avatar} className="w-full h-full" />
</View>
```

### Video player container (16:9)

```tsx
<View className="w-full aspect-video bg-black">
  <VideoPlayer />
</View>
```

### Instagram-style square grid

```tsx
<View className="flex-row flex-wrap gap-2">
  {photos.map((photo) => (
    <View key={photo.id} className="w-[32%] aspect-square">
      <Image source={photo.uri} className="w-full h-full rounded" />
    </View>
  ))}
</View>
```

### Custom aspect ratio for wide images

```tsx
<View className="w-full aspect-[21/9] rounded-lg overflow-hidden">
  <Image source={banner} className="w-full h-full" resizeMode="cover" />
</View>
```

### Portrait orientation

```tsx
<View className="h-full aspect-[9/16]">
  <Story />
</View>
```

### Remove aspect ratio constraint

```tsx
<View className="aspect-square md:aspect-auto">
  Responsive aspect ratio
</View>
```

## Note

The aspect ratio is calculated as `width / height`. When combined with `w-full`, the height will be automatically calculated to maintain the ratio.

## Related

- [Sizing](/reference/sizing/) - Width and height utilities
- [Layout](/reference/layout/) - Flexbox utilities
