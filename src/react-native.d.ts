/**
 * TypeScript declarations to add className prop to React Native components
 */

import 'react-native';

declare module 'react-native' {
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
}
