/**
 * Border utilities (border width, radius, style)
 */

import type { StyleObject } from "../types";

/**
 * Parse border classes
 */
export function parseBorder(cls: string): StyleObject | null {
  // Border width
  if (cls === "border") {
    return { borderWidth: 1 };
  }

  if (cls === "border-0") {
    return { borderWidth: 0 };
  }

  if (cls === "border-2") {
    return { borderWidth: 2 };
  }

  if (cls === "border-4") {
    return { borderWidth: 4 };
  }

  if (cls === "border-8") {
    return { borderWidth: 8 };
  }

  // Border top width
  if (cls === "border-t") {
    return { borderTopWidth: 1 };
  }

  if (cls === "border-t-0") {
    return { borderTopWidth: 0 };
  }

  if (cls === "border-t-2") {
    return { borderTopWidth: 2 };
  }

  if (cls === "border-t-4") {
    return { borderTopWidth: 4 };
  }

  // Border right width
  if (cls === "border-r") {
    return { borderRightWidth: 1 };
  }

  if (cls === "border-r-0") {
    return { borderRightWidth: 0 };
  }

  if (cls === "border-r-2") {
    return { borderRightWidth: 2 };
  }

  if (cls === "border-r-4") {
    return { borderRightWidth: 4 };
  }

  // Border bottom width
  if (cls === "border-b") {
    return { borderBottomWidth: 1 };
  }

  if (cls === "border-b-0") {
    return { borderBottomWidth: 0 };
  }

  if (cls === "border-b-2") {
    return { borderBottomWidth: 2 };
  }

  if (cls === "border-b-4") {
    return { borderBottomWidth: 4 };
  }

  // Border left width
  if (cls === "border-l") {
    return { borderLeftWidth: 1 };
  }

  if (cls === "border-l-0") {
    return { borderLeftWidth: 0 };
  }

  if (cls === "border-l-2") {
    return { borderLeftWidth: 2 };
  }

  if (cls === "border-l-4") {
    return { borderLeftWidth: 4 };
  }

  // Border radius
  if (cls === "rounded-none") {
    return { borderRadius: 0 };
  }

  if (cls === "rounded-sm") {
    return { borderRadius: 2 };
  }

  if (cls === "rounded") {
    return { borderRadius: 4 };
  }

  if (cls === "rounded-md") {
    return { borderRadius: 6 };
  }

  if (cls === "rounded-lg") {
    return { borderRadius: 8 };
  }

  if (cls === "rounded-xl") {
    return { borderRadius: 12 };
  }

  if (cls === "rounded-2xl") {
    return { borderRadius: 16 };
  }

  if (cls === "rounded-3xl") {
    return { borderRadius: 24 };
  }

  if (cls === "rounded-full") {
    return { borderRadius: 9999 };
  }

  // Border top radius
  if (cls === "rounded-t-none") {
    return { borderTopLeftRadius: 0, borderTopRightRadius: 0 };
  }

  if (cls === "rounded-t") {
    return { borderTopLeftRadius: 4, borderTopRightRadius: 4 };
  }

  if (cls === "rounded-t-lg") {
    return { borderTopLeftRadius: 8, borderTopRightRadius: 8 };
  }

  // Border right radius
  if (cls === "rounded-r-none") {
    return { borderTopRightRadius: 0, borderBottomRightRadius: 0 };
  }

  if (cls === "rounded-r") {
    return { borderTopRightRadius: 4, borderBottomRightRadius: 4 };
  }

  if (cls === "rounded-r-lg") {
    return { borderTopRightRadius: 8, borderBottomRightRadius: 8 };
  }

  // Border bottom radius
  if (cls === "rounded-b-none") {
    return { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 };
  }

  if (cls === "rounded-b") {
    return { borderBottomLeftRadius: 4, borderBottomRightRadius: 4 };
  }

  if (cls === "rounded-b-lg") {
    return { borderBottomLeftRadius: 8, borderBottomRightRadius: 8 };
  }

  // Border left radius
  if (cls === "rounded-l-none") {
    return { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 };
  }

  if (cls === "rounded-l") {
    return { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 };
  }

  if (cls === "rounded-l-lg") {
    return { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 };
  }

  // Border style
  if (cls === "border-solid") {
    return { borderStyle: "solid" };
  }

  if (cls === "border-dotted") {
    return { borderStyle: "dotted" };
  }

  if (cls === "border-dashed") {
    return { borderStyle: "dashed" };
  }

  return null;
}
