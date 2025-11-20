import type { ImageStyle, TextStyle, ViewStyle } from "react-native";

/**
 * Union type for all React Native style types
 */
export type NativeStyle = ViewStyle | TextStyle | ImageStyle;

/**
 * Return type for tw/twStyle functions with separate style properties for modifiers
 */
export type TwStyle<T extends NativeStyle = NativeStyle> = {
  style: T;
  activeStyle?: T;
  focusStyle?: T;
  disabledStyle?: T;
  placeholderStyle?: TextStyle;
};
