/**
 * Enhanced Pressable component with modifier support
 * Injects disabled state into style function for disabled: modifier support
 */

import type { ComponentRef } from "react";
import { forwardRef } from "react";
import {
  Pressable as RNPressable,
  type PressableStateCallbackType,
  type PressableProps as RNPressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

// Extend PressableStateCallbackType to include disabled
type EnhancedPressableState = PressableStateCallbackType & { disabled: boolean | null | undefined };

export type PressableProps = Omit<RNPressableProps, "style"> & {
  /**
   * Style can be a static style object/array or a function that receives Pressable state + disabled
   */
  style?: StyleProp<ViewStyle> | ((state: EnhancedPressableState) => StyleProp<ViewStyle>);
  className?: string; // compile-time only
};

/**
 * Enhanced Pressable that supports the disabled: modifier
 *
 * @example
 * <Pressable
 *   disabled={isLoading}
 *   className="bg-blue-500 active:bg-blue-700 disabled:bg-gray-400"
 * >
 *   <Text>Submit</Text>
 * </Pressable>
 */
export const Pressable = forwardRef<ComponentRef<typeof RNPressable>, PressableProps>(function Pressable(
  { style, disabled = false, ...props },
  ref,
) {
  // Inject disabled into style function context
  const resolvedStyle =
    typeof style === "function" ? (state: PressableStateCallbackType) => style({ ...state, disabled }) : style;

  return <RNPressable ref={ref} disabled={disabled} style={resolvedStyle} {...props} />;
});
