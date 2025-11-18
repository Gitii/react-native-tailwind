/**
 * Enhanced TextInput component with focus state support for focus: modifier
 *
 * This component wraps React Native's TextInput and manages focus state internally,
 * allowing the style prop to be a function that receives { focused: boolean }.
 *
 * @example
 * ```tsx
 * import { TextInput } from '@mgcrea/react-native-tailwind';
 *
 * <TextInput
 *   className="border-2 border-gray-300 focus:border-blue-500 p-3 rounded-lg"
 *   placeholder="Email"
 * />
 * ```
 */

import { forwardRef, useCallback, useState } from "react";
import {
  type BlurEvent,
  type FocusEvent,
  TextInput as RNTextInput,
  type TextInputProps as RNTextInputProps,
} from "react-native";

export type TextInputProps = Omit<RNTextInputProps, "style"> & {
  /**
   * Style can be a static style object/array or a function that receives focus state
   */
  style?: RNTextInputProps["style"] | ((state: { focused: boolean }) => RNTextInputProps["style"]);
};

/**
 * Enhanced TextInput with focus state support
 *
 * Manages focus state internally and passes it to style functions,
 * enabling the use of focus: modifier in className.
 */
export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(
  { style, onFocus, onBlur, ...props },
  ref,
) {
  const [focused, setFocused] = useState(false);

  const handleFocus = useCallback(
    (e: FocusEvent) => {
      setFocused(true);
      onFocus?.(e);
    },
    [onFocus],
  );

  const handleBlur = useCallback(
    (e: BlurEvent) => {
      setFocused(false);
      onBlur?.(e);
    },
    [onBlur],
  );

  // Resolve style - call function with focus state if needed
  const resolvedStyle = typeof style === "function" ? style({ focused }) : style;

  return <RNTextInput ref={ref} style={resolvedStyle} onFocus={handleFocus} onBlur={handleBlur} {...props} />;
});
