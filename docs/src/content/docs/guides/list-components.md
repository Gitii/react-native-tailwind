---
title: List Components
description: Style ScrollView and FlatList components with special className props
---

React Native Tailwind supports special `className` props for styling list components like `ScrollView` and `FlatList`.

## ScrollView Content Container

Use `contentContainerClassName` to style the ScrollView's content container:

```tsx
import { ScrollView, View, Text } from "react-native";

export function MyScrollView() {
  return (
    <ScrollView
      className="flex-1 bg-gray-100"
      contentContainerClassName="items-center p-4 gap-4"
    >
      <View className="bg-white rounded-lg p-4">
        <Text className="text-lg">Item 1</Text>
      </View>
      <View className="bg-white rounded-lg p-4">
        <Text className="text-lg">Item 2</Text>
      </View>
      <View className="bg-white rounded-lg p-4">
        <Text className="text-lg">Item 3</Text>
      </View>
    </ScrollView>
  );
}
```

**Transforms to:**

```tsx
<ScrollView
  style={_twStyles._bg_gray_100_flex_1}
  contentContainerStyle={_twStyles._gap_4_items_center_p_4}
>
  {/* ... */}
</ScrollView>
```

## FlatList with Column Wrapper

Use `columnWrapperClassName` for multi-column FlatLists:

```tsx
import { FlatList, View, Text } from "react-native";

export function GridList({ items }) {
  return (
    <FlatList
      className="flex-1 bg-gray-100"
      contentContainerClassName="p-4"
      columnWrapperClassName="gap-4 mb-4"
      numColumns={2}
      data={items}
      renderItem={({ item }) => (
        <View className="flex-1 bg-white rounded-lg p-4">
          <Text className="text-lg">{item.name}</Text>
        </View>
      )}
    />
  );
}
```

**Transforms to:**

```tsx
<FlatList
  style={_twStyles._bg_gray_100_flex_1}
  contentContainerStyle={_twStyles._p_4}
  columnWrapperStyle={_twStyles._gap_4_mb_4}
  numColumns={2}
  data={items}
  renderItem={({ item }) => (
    <View style={_twStyles._bg_white_flex_1_p_4_rounded_lg}>
      <Text style={_twStyles._text_lg}>{item.name}</Text>
    </View>
  )}
/>
```

## FlatList with Header and Footer

Use `ListHeaderComponentClassName` and `ListFooterComponentClassName`:

```tsx
import { FlatList, View, Text } from "react-native";

export function ListWithHeaderFooter({ items }) {
  return (
    <FlatList
      className="flex-1"
      contentContainerClassName="p-4"
      ListHeaderComponentClassName="p-4 bg-blue-500 mb-4 rounded-lg"
      ListFooterComponentClassName="p-4 bg-gray-200 mt-4 rounded-lg"
      data={items}
      ListHeaderComponent={<Text className="text-white font-bold">Header</Text>}
      ListFooterComponent={<Text className="text-gray-600">End of list</Text>}
      renderItem={({ item }) => (
        <View className="bg-white rounded-lg p-4 mb-2">
          <Text>{item.name}</Text>
        </View>
      )}
    />
  );
}
```

**Transforms to:**

```tsx
<FlatList
  style={_twStyles._flex_1}
  contentContainerStyle={_twStyles._p_4}
  ListHeaderComponentStyle={_twStyles._bg_blue_500_mb_4_p_4_rounded_lg}
  ListFooterComponentStyle={_twStyles._bg_gray_200_mt_4_p_4_rounded_lg}
  data={items}
  ListHeaderComponent={<Text style={_twStyles._font_bold_text_white}>Header</Text>}
  ListFooterComponent={<Text style={_twStyles._text_gray_600}>End of list</Text>}
  renderItem={({ item }) => (
    <View style={_twStyles._bg_white_mb_2_p_4_rounded_lg}>
      <Text>{item.name}</Text>
    </View>
  )}
/>
```

## Supported className Props

The Babel plugin automatically transforms these props:

| className Prop | Transforms To | Component |
|----------------|---------------|-----------|
| `className` | `style` | All components |
| `contentContainerClassName` | `contentContainerStyle` | ScrollView, FlatList |
| `columnWrapperClassName` | `columnWrapperStyle` | FlatList (with numColumns > 1) |
| `ListHeaderComponentClassName` | `ListHeaderComponentStyle` | FlatList |
| `ListFooterComponentClassName` | `ListFooterComponentStyle` | FlatList |

## Complete Example

Here's a complete example showing all list styling features:

```tsx
import { FlatList, View, Text, RefreshControl } from "react-native";
import { useState } from "react";

export function CompleteList({ items }) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate fetch
    setTimeout(() => setRefreshing(false), 2000);
  };

  return (
    <FlatList
      className="flex-1 bg-gray-100"
      contentContainerClassName="p-4"
      columnWrapperClassName="gap-4 mb-4"
      ListHeaderComponentClassName="p-6 bg-gradient-to-r from-blue-500 to-purple-600 mb-6 rounded-xl"
      ListFooterComponentClassName="p-4 bg-white border border-gray-200 mt-6 rounded-lg items-center"
      numColumns={2}
      data={items}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View>
          <Text className="text-2xl font-bold text-white mb-2">My Gallery</Text>
          <Text className="text-white opacity-80">Browse our collection</Text>
        </View>
      }
      ListFooterComponent={
        <View>
          <Text className="text-gray-600 text-sm">End of gallery</Text>
          <Text className="text-gray-400 text-xs mt-1">{items.length} items total</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View className="flex-1 bg-white rounded-xl p-4 border border-gray-200">
          <View className="w-full aspect-square bg-gray-200 rounded-lg mb-3" />
          <Text className="text-base font-semibold text-gray-900 mb-1">{item.name}</Text>
          <Text className="text-sm text-gray-600">{item.description}</Text>
        </View>
      )}
      ListEmptyComponent={
        <View className="items-center justify-center py-12">
          <Text className="text-gray-400 text-lg">No items found</Text>
        </View>
      }
    />
  );
}
```

## Custom Attributes

You can configure additional custom attributes using the [Babel configuration](../advanced/babel-configuration/). For example, to support `ListEmptyComponentClassName`:

```javascript
// babel.config.js
module.exports = {
  plugins: [
    [
      "@mgcrea/react-native-tailwind/babel",
      {
        attributes: [
          "*ClassName", // Matches all attributes ending in ClassName
        ],
      },
    ],
  ],
};
```

Then use it:

```tsx
<FlatList
  data={[]}
  ListEmptyComponentClassName="items-center py-12"
  ListEmptyComponent={<Text className="text-gray-400">No items</Text>}
/>
```

## What's Next?

- Learn about [Custom Attributes](../advanced/custom-attributes/) for more control
- Explore [Babel Configuration](../advanced/babel-configuration/) for plugin options
- Check out [Reusable Components](./reusable-components/) for building component libraries
