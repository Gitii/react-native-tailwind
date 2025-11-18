/**
 * Layout utilities (flexbox, positioning, display)
 */

import type { StyleObject } from "../types";

/**
 * Parse layout classes
 */
export function parseLayout(cls: string): StyleObject | null {
  // Display: flex
  if (cls === "flex") {
    return { display: "flex" };
  }

  if (cls === "hidden") {
    return { display: "none" };
  }

  // Flex direction
  if (cls === "flex-row") {
    return { flexDirection: "row" };
  }

  if (cls === "flex-row-reverse") {
    return { flexDirection: "row-reverse" };
  }

  if (cls === "flex-col") {
    return { flexDirection: "column" };
  }

  if (cls === "flex-col-reverse") {
    return { flexDirection: "column-reverse" };
  }

  // Flex wrap
  if (cls === "flex-wrap") {
    return { flexWrap: "wrap" };
  }

  if (cls === "flex-wrap-reverse") {
    return { flexWrap: "wrap-reverse" };
  }

  if (cls === "flex-nowrap") {
    return { flexWrap: "nowrap" };
  }

  // Flex grow/shrink
  if (cls === "flex-1") {
    return { flex: 1 };
  }

  if (cls === "flex-auto") {
    return { flex: 1 };
  }

  if (cls === "flex-none") {
    return { flex: 0 };
  }

  // Flex grow
  if (cls === "grow") {
    return { flexGrow: 1 };
  }

  if (cls === "grow-0") {
    return { flexGrow: 0 };
  }

  // Flex shrink
  if (cls === "shrink") {
    return { flexShrink: 1 };
  }

  if (cls === "shrink-0") {
    return { flexShrink: 0 };
  }

  // Justify content
  if (cls === "justify-start") {
    return { justifyContent: "flex-start" };
  }

  if (cls === "justify-end") {
    return { justifyContent: "flex-end" };
  }

  if (cls === "justify-center") {
    return { justifyContent: "center" };
  }

  if (cls === "justify-between") {
    return { justifyContent: "space-between" };
  }

  if (cls === "justify-around") {
    return { justifyContent: "space-around" };
  }

  if (cls === "justify-evenly") {
    return { justifyContent: "space-evenly" };
  }

  // Align items
  if (cls === "items-start") {
    return { alignItems: "flex-start" };
  }

  if (cls === "items-end") {
    return { alignItems: "flex-end" };
  }

  if (cls === "items-center") {
    return { alignItems: "center" };
  }

  if (cls === "items-baseline") {
    return { alignItems: "baseline" };
  }

  if (cls === "items-stretch") {
    return { alignItems: "stretch" };
  }

  // Align self
  if (cls === "self-auto") {
    return { alignSelf: "auto" };
  }

  if (cls === "self-start") {
    return { alignSelf: "flex-start" };
  }

  if (cls === "self-end") {
    return { alignSelf: "flex-end" };
  }

  if (cls === "self-center") {
    return { alignSelf: "center" };
  }

  if (cls === "self-stretch") {
    return { alignSelf: "stretch" };
  }

  if (cls === "self-baseline") {
    return { alignSelf: "baseline" };
  }

  // Align content
  if (cls === "content-start") {
    return { alignContent: "flex-start" };
  }

  if (cls === "content-end") {
    return { alignContent: "flex-end" };
  }

  if (cls === "content-center") {
    return { alignContent: "center" };
  }

  if (cls === "content-between") {
    return { alignContent: "space-between" };
  }

  if (cls === "content-around") {
    return { alignContent: "space-around" };
  }

  if (cls === "content-stretch") {
    return { alignContent: "stretch" };
  }

  // Position
  if (cls === "absolute") {
    return { position: "absolute" };
  }

  if (cls === "relative") {
    return { position: "relative" };
  }

  // Overflow
  if (cls === "overflow-hidden") {
    return { overflow: "hidden" };
  }

  if (cls === "overflow-visible") {
    return { overflow: "visible" };
  }

  if (cls === "overflow-scroll") {
    return { overflow: "scroll" };
  }

  return null;
}
