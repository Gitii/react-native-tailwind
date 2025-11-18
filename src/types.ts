/**
 * Core type definitions
 */

import type { ImageStyle, TextStyle, ViewStyle } from "react-native";

export type RNStyle = ViewStyle | TextStyle | ImageStyle;

export type StyleObject = Record<Exclude<string, "shadowOffset">, string | number | undefined> & {
  shadowOffset?: { width: number; height: number };
};

export type SpacingValue = number;
export type ColorValue = string;
export type Parser = (className: string) => StyleObject | null;
