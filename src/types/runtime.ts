import type { ImageStyle, TextStyle, ViewStyle } from "react-native";

/**
 * Union type for all React Native style types
 */
export type NativeStyle = ViewStyle | TextStyle | ImageStyle;

/**
 * Return type for tw/twStyle functions with separate style properties for modifiers
 * When color-scheme modifiers (dark:, light:) are present, style becomes an array with runtime conditionals
 */
export type TwStyle<T extends NativeStyle = NativeStyle> = {
  style: T | Array<T | false>;
  activeStyle?: T;
  focusStyle?: T;
  disabledStyle?: T;
  placeholderStyle?: TextStyle;
  lightStyle?: T;
  darkStyle?: T;
};
