/**
 * Layout utilities (flexbox, positioning, display)
 */

import type { StyleObject } from "../types";

// Display utilities
const DISPLAY_MAP: Record<string, StyleObject> = {
  flex: { display: "flex" },
  hidden: { display: "none" },
};

// Flex direction utilities
const FLEX_DIRECTION_MAP: Record<string, StyleObject> = {
  "flex-row": { flexDirection: "row" },
  "flex-row-reverse": { flexDirection: "row-reverse" },
  "flex-col": { flexDirection: "column" },
  "flex-col-reverse": { flexDirection: "column-reverse" },
};

// Flex wrap utilities
const FLEX_WRAP_MAP: Record<string, StyleObject> = {
  "flex-wrap": { flexWrap: "wrap" },
  "flex-wrap-reverse": { flexWrap: "wrap-reverse" },
  "flex-nowrap": { flexWrap: "nowrap" },
};

// Flex utilities
const FLEX_MAP: Record<string, StyleObject> = {
  "flex-1": { flex: 1 },
  "flex-auto": { flex: 1 },
  "flex-none": { flex: 0 },
};

// Flex grow/shrink utilities
const GROW_SHRINK_MAP: Record<string, StyleObject> = {
  grow: { flexGrow: 1 },
  "grow-0": { flexGrow: 0 },
  shrink: { flexShrink: 1 },
  "shrink-0": { flexShrink: 0 },
};

// Justify content utilities
const JUSTIFY_CONTENT_MAP: Record<string, StyleObject> = {
  "justify-start": { justifyContent: "flex-start" },
  "justify-end": { justifyContent: "flex-end" },
  "justify-center": { justifyContent: "center" },
  "justify-between": { justifyContent: "space-between" },
  "justify-around": { justifyContent: "space-around" },
  "justify-evenly": { justifyContent: "space-evenly" },
};

// Align items utilities
const ALIGN_ITEMS_MAP: Record<string, StyleObject> = {
  "items-start": { alignItems: "flex-start" },
  "items-end": { alignItems: "flex-end" },
  "items-center": { alignItems: "center" },
  "items-baseline": { alignItems: "baseline" },
  "items-stretch": { alignItems: "stretch" },
};

// Align self utilities
const ALIGN_SELF_MAP: Record<string, StyleObject> = {
  "self-auto": { alignSelf: "auto" },
  "self-start": { alignSelf: "flex-start" },
  "self-end": { alignSelf: "flex-end" },
  "self-center": { alignSelf: "center" },
  "self-stretch": { alignSelf: "stretch" },
  "self-baseline": { alignSelf: "baseline" },
};

// Align content utilities
const ALIGN_CONTENT_MAP: Record<string, StyleObject> = {
  "content-start": { alignContent: "flex-start" },
  "content-end": { alignContent: "flex-end" },
  "content-center": { alignContent: "center" },
  "content-between": { alignContent: "space-between" },
  "content-around": { alignContent: "space-around" },
  "content-stretch": { alignContent: "stretch" },
};

// Position utilities
const POSITION_MAP: Record<string, StyleObject> = {
  absolute: { position: "absolute" },
  relative: { position: "relative" },
};

// Overflow utilities
const OVERFLOW_MAP: Record<string, StyleObject> = {
  "overflow-hidden": { overflow: "hidden" },
  "overflow-visible": { overflow: "visible" },
  "overflow-scroll": { overflow: "scroll" },
};

/**
 * Parse layout classes
 */
export function parseLayout(cls: string): StyleObject | null {
  // Try each lookup table in order
  return (
    DISPLAY_MAP[cls] ??
    FLEX_DIRECTION_MAP[cls] ??
    FLEX_WRAP_MAP[cls] ??
    FLEX_MAP[cls] ??
    GROW_SHRINK_MAP[cls] ??
    JUSTIFY_CONTENT_MAP[cls] ??
    ALIGN_ITEMS_MAP[cls] ??
    ALIGN_SELF_MAP[cls] ??
    ALIGN_CONTENT_MAP[cls] ??
    POSITION_MAP[cls] ??
    OVERFLOW_MAP[cls] ??
    null
  );
}
