/* eslint-disable @typescript-eslint/prefer-regexp-exec */
import React, { type ComponentClass, type FunctionComponent } from "react";
import { ViewProps, ViewStyle } from "react-native";

export const createTailwindViewComponent = <P extends ViewProps>(
  component: FunctionComponent<P> | ComponentClass<P>,
): FunctionComponent<P & { className?: string }> => {
  // Placeholder function for creating a Tailwind component
  return function wrapper(props: P & { className?: string }) {
    const { className = "", style, ...restProps } = props;
    const styleObj: ViewStyle = Object.assign({}, style) as ViewStyle;
    console.log({ className });
    if (/\s?m-(\d+)\s?/.test(className)) {
      const match = className.match(/\s?m-(\d+)\s?/);
      styleObj.margin = Number(match?.[1]) * 4; // Example conversion
    }
    if (/\s?p-(\d+)\s?/.test(className)) {
      const match = className.match(/\s?p-(\d+)\s?/);
      styleObj.padding = Number(match?.[1]) * 4; // Example conversion
    }
    // Here you would normally process the className to apply Tailwind styles
    console.log({ styleObj });
    return React.createElement(component, { ...restProps, style: styleObj } as P);
  };
};
