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

// Z-index scale
export const Z_INDEX_SCALE: Record<string, number> = {
  0: 0,
  10: 10,
  20: 20,
  30: 30,
  40: 40,
  50: 50,
  auto: 0, // React Native doesn't have 'auto', default to 0
};

// Inset scale (for top/right/bottom/left positioning in pixels)
export const INSET_SCALE: Record<string, number> = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
};

/**
 * Parse layout classes
 */
export function parseLayout(cls: string): StyleObject | null {
  // Z-index: z-0, z-10, z-20, etc.
  if (cls.startsWith("z-")) {
    const zKey = cls.substring(2);
    const zValue = Z_INDEX_SCALE[zKey];
    if (zValue !== undefined) {
      return { zIndex: zValue };
    }
  }

  // Top positioning: top-0, top-4, etc.
  if (cls.startsWith("top-")) {
    const topKey = cls.substring(4);

    // Auto value - return empty object (no-op, removes the property)
    if (topKey === "auto") {
      return {};
    }

    const topValue = INSET_SCALE[topKey];
    if (topValue !== undefined) {
      return { top: topValue };
    }
  }

  // Right positioning: right-0, right-4, etc.
  if (cls.startsWith("right-")) {
    const rightKey = cls.substring(6);

    // Auto value - return empty object (no-op, removes the property)
    if (rightKey === "auto") {
      return {};
    }

    const rightValue = INSET_SCALE[rightKey];
    if (rightValue !== undefined) {
      return { right: rightValue };
    }
  }

  // Bottom positioning: bottom-0, bottom-4, etc.
  if (cls.startsWith("bottom-")) {
    const bottomKey = cls.substring(7);

    // Auto value - return empty object (no-op, removes the property)
    if (bottomKey === "auto") {
      return {};
    }

    const bottomValue = INSET_SCALE[bottomKey];
    if (bottomValue !== undefined) {
      return { bottom: bottomValue };
    }
  }

  // Left positioning: left-0, left-4, etc.
  if (cls.startsWith("left-")) {
    const leftKey = cls.substring(5);

    // Auto value - return empty object (no-op, removes the property)
    if (leftKey === "auto") {
      return {};
    }

    const leftValue = INSET_SCALE[leftKey];
    if (leftValue !== undefined) {
      return { left: leftValue };
    }
  }

  // Inset (all sides): inset-0, inset-4, etc.
  if (cls.startsWith("inset-")) {
    const insetKey = cls.substring(6);
    const insetValue = INSET_SCALE[insetKey];
    if (insetValue !== undefined) {
      return { top: insetValue, right: insetValue, bottom: insetValue, left: insetValue };
    }
  }

  // Inset X (left and right): inset-x-0, inset-x-4, etc.
  if (cls.startsWith("inset-x-")) {
    const insetKey = cls.substring(8);
    const insetValue = INSET_SCALE[insetKey];
    if (insetValue !== undefined) {
      return { left: insetValue, right: insetValue };
    }
  }

  // Inset Y (top and bottom): inset-y-0, inset-y-4, etc.
  if (cls.startsWith("inset-y-")) {
    const insetKey = cls.substring(8);
    const insetValue = INSET_SCALE[insetKey];
    if (insetValue !== undefined) {
      return { top: insetValue, bottom: insetValue };
    }
  }

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
