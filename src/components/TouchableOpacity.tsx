/**
 * Enhanced TouchableOpacity component with modifier support
 * Adds active state support for active: modifier via onPressIn/onPressOut
 */

import type { ComponentRef } from "react";
import { forwardRef, useCallback, useState } from "react";
import {
  TouchableOpacity as RNTouchableOpacity,
  type TouchableOpacityProps as RNTouchableOpacityProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

// TouchableOpacity state for style function
type TouchableOpacityState = { active: boolean; disabled: boolean | null | undefined };

export type TouchableOpacityProps = Omit<RNTouchableOpacityProps, "style"> & {
  /**
   * Style can be a static style object/array or a function that receives TouchableOpacity state
   */
  style?: StyleProp<ViewStyle> | ((state: TouchableOpacityState) => StyleProp<ViewStyle>);
  className?: string; // compile-time only
};

/**
 * Enhanced TouchableOpacity that supports active: and disabled: modifiers
 *
 * @example
 * <TouchableOpacity
 *   disabled={isLoading}
 *   className="bg-blue-500 active:bg-blue-700 disabled:bg-gray-400"
 * >
 *   <Text>Submit</Text>
 * </TouchableOpacity>
 */
export const TouchableOpacity = forwardRef<ComponentRef<typeof RNTouchableOpacity>, TouchableOpacityProps>(
  function TouchableOpacity({ style, disabled = false, onPressIn, onPressOut, ...props }, ref) {
    const [isActive, setIsActive] = useState(false);

    const handlePressIn = useCallback(
      (event: Parameters<NonNullable<RNTouchableOpacityProps["onPressIn"]>>[0]) => {
        setIsActive(true);
        onPressIn?.(event);
      },
      [onPressIn],
    );

    const handlePressOut = useCallback(
      (event: Parameters<NonNullable<RNTouchableOpacityProps["onPressOut"]>>[0]) => {
        setIsActive(false);
        onPressOut?.(event);
      },
      [onPressOut],
    );

    // Inject active and disabled state into style function context
    const resolvedStyle = typeof style === "function" ? style({ active: isActive, disabled }) : style;

    return (
      <RNTouchableOpacity
        ref={ref}
        disabled={disabled}
        style={resolvedStyle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      />
    );
  },
);
