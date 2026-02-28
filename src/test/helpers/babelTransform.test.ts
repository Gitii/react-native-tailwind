/**
 * Tests for the babelTransform helper
 * Verifies that the transform() helper correctly passes options through to the plugin
 */

import { describe, expect, it, vi } from "vitest";
import { transform, transformWithConfig } from "../../../test/helpers/babelTransform.js";

vi.mock("../../babel/config-loader.js", async () => {
  const actual = await vi.importActual<typeof import("../../babel/config-loader.js")>(
    "../../babel/config-loader.js",
  );
  return {
    ...actual,
    findTailwindConfig: vi.fn(() => "/mock/project/tailwind.config.ts"),
  };
});

vi.mock("../../babel/utils/configModuleGenerator.js", async () => {
  const actual = await vi.importActual<typeof import("../../babel/utils/configModuleGenerator.js")>(
    "../../babel/utils/configModuleGenerator.js",
  );
  return {
    ...actual,
    writeConfigModule: vi.fn(),
  };
});

describe("babelTransform helper", () => {
  it("should transform code without options", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="m-4 p-2 bg-blue-500" />;
      }
    `;

    const output = transform(input, undefined, true);

    expect(output).toBeTruthy();
    expect(output).toContain("StyleSheet.create");
  });

  it("should transform code with configProvider option", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="m-4 p-2 bg-blue-500" />;
      }
    `;

    const output = transform(input, { configProvider: { importFrom: "./my-provider" } }, true);

    expect(output).toBeTruthy();
    expect(output).toContain("StyleSheet.create");
    // Should not contain error text
    expect(output).not.toContain("Error");
  });

  it("should maintain backward compatibility - transform with undefined options", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="m-4" />;
      }
    `;

    const output1 = transform(input, undefined, true);
    const output2 = transform(input, {}, true);

    // Both should produce valid output
    expect(output1).toBeTruthy();
    expect(output2).toBeTruthy();
    expect(output1).toContain("StyleSheet.create");
    expect(output2).toContain("StyleSheet.create");
  });

  it("should work with configProvider and other options combined", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="m-4 dark:bg-gray-900" />;
      }
    `;

    const output = transform(
      input,
      {
        configProvider: { importFrom: "./provider" },
        colorScheme: { importFrom: "react-native", importName: "useColorScheme" },
      },
      true,
    );

    expect(output).toBeTruthy();
    expect(output).toContain("StyleSheet.create");
  });
  it("should provide convenience wrapper transformWithConfig", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="m-4 p-2 bg-blue-500" />;
      }
    `;

    const output = transformWithConfig(input, "./my-provider");

    expect(output).toBeTruthy();
    expect(output).toContain("StyleSheet.create");
  });

  it("transformWithConfig should accept additional options", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="m-4 dark:bg-gray-900" />;
      }
    `;

    const output = transformWithConfig(input, "./provider", {
      colorScheme: { importFrom: "react-native", importName: "useColorScheme" },
    });

    expect(output).toBeTruthy();
    expect(output).toContain("StyleSheet.create");
  });
});
