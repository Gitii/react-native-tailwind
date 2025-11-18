/* eslint-disable @typescript-eslint/consistent-type-definitions */

/**
 * TypeScript declarations to add className prop to React Native components
 * This file provides module augmentation for react-native to add className prop support
 */

import "react-native";

declare module "react-native" {
  interface ViewProps {
    /**
     * Tailwind-like class names for styling
     * @example
     * <View className="flex items-center justify-center m-4 p-2 bg-blue-500 rounded-lg" />
     */
    className?: string;
  }

  interface TextProps {
    /**
     * Tailwind-like class names for styling
     * @example
     * <Text className="text-lg font-bold text-blue-500 text-center" />
     */
    className?: string;
  }

  interface ImageProps {
    /**
     * Tailwind-like class names for styling
     * @example
     * <Image className="w-full h-64 rounded-lg" source={...} />
     */
    className?: string;
  }

  interface ScrollViewProps {
    /**
     * Tailwind-like class names for styling
     * @example
     * <ScrollView className="flex-1 bg-gray-100 p-4" />
     */
    className?: string;

    /**
     * Tailwind-like class names for styling the content container
     * @example
     * <ScrollView contentContainerClassName="items-center p-4 gap-4" />
     */
    contentContainerClassName?: string;
  }

  interface TouchableOpacityProps {
    /**
     * Tailwind-like class names for styling
     * @example
     * <TouchableOpacity className="px-4 py-2 bg-blue-500 rounded-lg items-center" />
     */
    className?: string;
  }

  interface PressableProps {
    /**
     * Tailwind-like class names for styling
     * @example
     * <Pressable className="px-4 py-2 bg-blue-500 rounded-lg items-center" />
     */
    className?: string;
  }

  interface FlatListProps<ItemT> extends VirtualizedListProps<ItemT> {
    /**
     * Tailwind-like class names for styling
     * @example
     * <FlatList className="flex-1 bg-gray-100" data={items} renderItem={...} />
     */
    className?: string;

    /**
     * Tailwind-like class names for styling the content container
     * @example
     * <FlatList contentContainerClassName="p-4 gap-4" data={items} renderItem={...} />
     */
    contentContainerClassName?: string;

    /**
     * Tailwind-like class names for styling the column wrapper (when numColumns > 1)
     * @example
     * <FlatList columnWrapperClassName="gap-4 mb-4" numColumns={2} data={items} renderItem={...} />
     */
    columnWrapperClassName?: string;

    /**
     * Tailwind-like class names for styling the list header component
     * @example
     * <FlatList ListHeaderComponentClassName="p-4 bg-gray-200" data={items} renderItem={...} />
     */
    ListHeaderComponentClassName?: string;

    /**
     * Tailwind-like class names for styling the list footer component
     * @example
     * <FlatList ListFooterComponentClassName="p-4 bg-gray-200" data={items} renderItem={...} />
     */
    ListFooterComponentClassName?: string;
  }

  interface SectionListProps<_ItemT, _SectionT> {
    /**
     * Tailwind-like class names for styling
     * @example
     * <SectionList className="flex-1 bg-gray-100" sections={sections} renderItem={...} />
     */
    className?: string;

    /**
     * Tailwind-like class names for styling the content container
     * @example
     * <SectionList contentContainerClassName="p-4 gap-4" sections={sections} renderItem={...} />
     */
    contentContainerClassName?: string;

    /**
     * Tailwind-like class names for styling the list header component
     * @example
     * <SectionList ListHeaderComponentClassName="p-4 bg-gray-200" sections={sections} renderItem={...} />
     */
    ListHeaderComponentClassName?: string;

    /**
     * Tailwind-like class names for styling the list footer component
     * @example
     * <SectionList ListFooterComponentClassName="p-4 bg-gray-200" sections={sections} renderItem={...} />
     */
    ListFooterComponentClassName?: string;
  }
}
