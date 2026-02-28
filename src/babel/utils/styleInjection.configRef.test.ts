import type { NodePath } from "@babel/core";
import { transformSync } from "@babel/core";
import type * as BabelTypes from "@babel/types";
import { describe, expect, it } from "vitest";
import type { StyleObject } from "../../types/core";
import { injectStylesAtTop } from "./styleInjection";

function emitInjectedStyles(
  styleRegistry: Map<string, StyleObject>,
  configRefRegistry?: Map<string, Map<string, string[]>>,
): string {
  const result = transformSync("import { View } from 'react-native'; const value = 1;", {
    configFile: false,
    babelrc: false,
    plugins: [
      ({ types: t }) => ({
        visitor: {
          Program(path: NodePath<BabelTypes.Program>) {
            injectStylesAtTop(
              path,
              styleRegistry,
              "_twStyles",
              t as typeof BabelTypes,
              configRefRegistry,
              "__twConfig",
            );
          },
        },
      }),
    ],
  });

  return result?.code ?? "";
}

describe("injectStylesAtTop config refs", () => {
  it("emits MemberExpression when config ref exists for a property", () => {
    const styleRegistry = new Map<string, StyleObject>([["_bg_blue_500", { backgroundColor: "#3B82F6" }]]);
    const configRefRegistry = new Map<string, Map<string, string[]>>([
      ["_bg_blue_500", new Map([["backgroundColor", ["theme", "colors", "blue-500"]]])],
    ]);

    const output = emitInjectedStyles(styleRegistry, configRefRegistry);

    expect(output).toContain('backgroundColor: __twConfig.theme.colors["blue-500"]');
    expect(output).not.toContain('backgroundColor: "#3B82F6"');
  });

  it("emits literal when no config ref exists", () => {
    const styleRegistry = new Map<string, StyleObject>([["_bg_blue_500", { backgroundColor: "#3B82F6" }]]);

    const output = emitInjectedStyles(styleRegistry);

    expect(output).toContain('backgroundColor: "#3B82F6"');
  });

  it("handles mixed styles with refs and literals", () => {
    const styleRegistry = new Map<string, StyleObject>([
      ["_bg_blue_500_p_4", { backgroundColor: "#3B82F6", padding: 16 }],
    ]);
    const configRefRegistry = new Map<string, Map<string, string[]>>([
      ["_bg_blue_500_p_4", new Map([["backgroundColor", ["theme", "colors", "blue-500"]]])],
    ]);

    const output = emitInjectedStyles(styleRegistry, configRefRegistry);

    expect(output).toContain('backgroundColor: __twConfig.theme.colors["blue-500"]');
    expect(output).toContain("padding: 16");
  });

  it("keeps nested types as valueToNode output even when refs exist", () => {
    const styleRegistry = new Map<string, StyleObject>([
      ["_shadow", { shadowOffset: { width: 0, height: 2 } }],
    ]);
    const configRefRegistry = new Map<string, Map<string, string[]>>([
      ["_shadow", new Map([["shadowOffset", ["theme", "spacing", "2"]]])],
    ]);

    const output = emitInjectedStyles(styleRegistry, configRefRegistry);

    expect(output).toContain("shadowOffset: {");
    expect(output).toContain("width: 0");
    expect(output).toContain("height: 2");
    expect(output).not.toContain("shadowOffset: __twConfig");
  });

  it("uses computed access for dash-containing config keys", () => {
    const styleRegistry = new Map<string, StyleObject>([["_bg_blue_500", { backgroundColor: "#3B82F6" }]]);
    const configRefRegistry = new Map<string, Map<string, string[]>>([
      ["_bg_blue_500", new Map([["backgroundColor", ["theme", "colors", "blue-500"]]])],
    ]);

    const output = emitInjectedStyles(styleRegistry, configRefRegistry);

    expect(output).toContain('colors["blue-500"]');
  });
});
