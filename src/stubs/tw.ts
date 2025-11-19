/**
 * Compile-time stub for tw/twStyle functions
 *
 * These functions are transformed by the Babel plugin at compile-time.
 * If you see these errors at runtime, it means the Babel plugin is not configured correctly.
 *
 * For runtime parsing, use: import { tw } from '@mgcrea/react-native-tailwind/runtime'
 */

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
};

/**
 * Compile-time Tailwind CSS template tag (transformed by Babel plugin)
 *
 * This function is replaced at compile-time by the Babel plugin.
 * The import is removed and calls are transformed to inline style objects.
 *
 * @example
 * ```tsx
 * import { tw } from '@mgcrea/react-native-tailwind';
 *
 * const styles = tw`bg-blue-500 active:bg-blue-700`;
 * // Transformed to:
 * // const styles = {
 * //   style: styles._bg_blue_500,
 * //   activeStyle: styles._active_bg_blue_700
 * // };
 * ```
 */
export function tw<T extends NativeStyle = NativeStyle>(
  _strings: TemplateStringsArray,
  ..._values: unknown[]
): TwStyle<T> {
  throw new Error(
    "tw() must be transformed by the Babel plugin. " +
      "Ensure @mgcrea/react-native-tailwind/babel is configured in your babel.config.js. " +
      "For runtime parsing, use: import { tw } from '@mgcrea/react-native-tailwind/runtime'",
  );
}

/**
 * Compile-time Tailwind CSS string function (transformed by Babel plugin)
 *
 * This function is replaced at compile-time by the Babel plugin.
 * The import is removed and calls are transformed to inline style objects.
 *
 * @example
 * ```tsx
 * import { twStyle } from '@mgcrea/react-native-tailwind';
 *
 * const styles = twStyle('bg-blue-500 active:bg-blue-700');
 * // Transformed to:
 * // const styles = {
 * //   style: styles._bg_blue_500,
 * //   activeStyle: styles._active_bg_blue_700
 * // };
 * ```
 */
export function twStyle<T extends NativeStyle = NativeStyle>(_className: string): TwStyle<T> | undefined {
  throw new Error(
    "twStyle() must be transformed by the Babel plugin. " +
      "Ensure @mgcrea/react-native-tailwind/babel is configured in your babel.config.js. " +
      "For runtime parsing, use: import { twStyle } from '@mgcrea/react-native-tailwind/runtime'",
  );
}
