/**
 * Core type definitions
 */

import type { ViewStyle, TextStyle, ImageStyle } from 'react-native';

export type RNStyle = ViewStyle | TextStyle | ImageStyle;

export type StyleObject = {
  [key: string]: string | number;
};

export type SpacingValue = number;
export type ColorValue = string;
export type Parser = (className: string) => StyleObject | null;
