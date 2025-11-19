import { transformSync } from "@babel/core";
import { describe, expect, it } from "vitest";
import babelPlugin, { type PluginOptions } from "./index.js";

/**
 * Helper to transform code with the Babel plugin
 */
function transform(code: string, options?: PluginOptions, includeJsx = false) {
  const presets = includeJsx ? ["@babel/preset-react"] : [];

  const result = transformSync(code, {
    presets,
    plugins: [[babelPlugin, options]],
    filename: "test.tsx",
    configFile: false,
    babelrc: false,
  });

  return result?.code ?? "";
}

describe("Babel plugin - tw template tag transformation", () => {
  it("should transform simple tw template literal", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';
      const styles = tw\`bg-blue-500 m-4\`;
    `;

    const output = transform(input);

    // Should have StyleSheet import (either ESM or CommonJS)
    expect(output).toMatch(/import.*StyleSheet.*from "react-native"|require\("react-native"\)/);
    expect(output).toContain("StyleSheet");

    // Should have _twStyles definition
    expect(output).toContain("_twStyles");
    expect(output).toContain("StyleSheet.create");

    // Should transform tw call to object with style property
    expect(output).toContain("style:");
    expect(output).toContain("_twStyles._bg_blue_500_m_4");

    // Should remove tw import
    expect(output).not.toContain("from '@mgcrea/react-native-tailwind'");
  });

  it("should transform tw with state modifiers", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';
      const styles = tw\`bg-blue-500 active:bg-blue-700 disabled:bg-gray-300\`;
    `;

    const output = transform(input);

    // Should have base style
    expect(output).toContain("style:");
    expect(output).toContain("_bg_blue_500");

    // Should have activeStyle
    expect(output).toContain("activeStyle:");
    expect(output).toContain("_active_bg_blue_700");

    // Should have disabledStyle
    expect(output).toContain("disabledStyle:");
    expect(output).toContain("_disabled_bg_gray_300");

    // Should create StyleSheet with all styles
    expect(output).toContain("backgroundColor:");
  });

  it("should inject StyleSheet.create after imports", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';
      import { View } from 'react-native';

      const styles = tw\`m-4\`;
    `;

    const output = transform(input);

    // Find the position of imports and StyleSheet.create
    const viewImportPos = output.indexOf('require("react-native")');
    const styleSheetCreatePos = output.indexOf("_twStyles");

    // StyleSheet.create should come after imports
    expect(styleSheetCreatePos).toBeGreaterThan(viewImportPos);
  });

  it("should handle tw in object literals", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';

      const sizeVariants = {
        sm: {
          container: tw\`h-9 px-3\`,
          text: tw\`text-sm\`,
        },
      };
    `;

    const output = transform(input);

    // Should define _twStyles before object literal
    const twStylesPos = output.indexOf("_twStyles");
    const sizeVariantsPos = output.indexOf("sizeVariants");

    expect(twStylesPos).toBeGreaterThan(0);
    expect(twStylesPos).toBeLessThan(sizeVariantsPos);

    // Should have both styles
    expect(output).toContain("_h_9_px_3");
    expect(output).toContain("_text_sm");
  });

  it("should handle empty tw template literal", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';
      const styles = tw\`\`;
    `;

    const output = transform(input);

    // Should replace with empty style object
    expect(output).toContain("style:");
    expect(output).toContain("{}");
  });

  it("should preserve other imports from the same package", () => {
    const input = `
      import { tw, TwStyle, COLORS } from '@mgcrea/react-native-tailwind';
      const styles = tw\`m-4\`;
    `;

    const output = transform(input);

    // Should remove tw but keep other imports
    expect(output).not.toContain('"tw"');
    expect(output).toContain("TwStyle");
    expect(output).toContain("COLORS");
  });

  it("should handle renamed tw import", () => {
    const input = `
      import { tw as customTw } from '@mgcrea/react-native-tailwind';
      const styles = customTw\`m-4 p-2\`;
    `;

    const output = transform(input);

    // Should still transform the renamed import
    expect(output).toContain("_twStyles");
    expect(output).toContain("_m_4_p_2");
    expect(output).not.toContain("customTw");
  });

  it("should handle multiple tw calls", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';
      const style1 = tw\`bg-red-500\`;
      const style2 = tw\`bg-blue-500\`;
      const style3 = tw\`bg-green-500\`;
    `;

    const output = transform(input);

    // Should have all three styles in StyleSheet
    expect(output).toContain("_bg_red_500");
    expect(output).toContain("_bg_blue_500");
    expect(output).toContain("_bg_green_500");

    // Should have StyleSheet.create with all styles
    expect(output).toContain("StyleSheet.create");
  });

  it("should use custom stylesIdentifier option", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';
      const styles = tw\`m-4\`;
    `;

    const output = transform(input, { stylesIdentifier: "myStyles" });

    // Should use custom identifier
    expect(output).toContain("myStyles");
    expect(output).toContain("myStyles._m_4");
    expect(output).not.toContain("_twStyles");
  });
});

describe("Babel plugin - twStyle function transformation", () => {
  it("should transform twStyle function call", () => {
    const input = `
      import { twStyle } from '@mgcrea/react-native-tailwind';
      const styles = twStyle('bg-blue-500 m-4');
    `;

    const output = transform(input);

    // Should transform to object with style property
    expect(output).toContain("style:");
    expect(output).toContain("_twStyles._bg_blue_500_m_4");
  });

  it("should transform twStyle with modifiers", () => {
    const input = `
      import { twStyle } from '@mgcrea/react-native-tailwind';
      const styles = twStyle('bg-blue-500 active:bg-blue-700');
    `;

    const output = transform(input);

    expect(output).toContain("style:");
    expect(output).toContain("activeStyle:");
  });

  it("should handle empty twStyle call", () => {
    const input = `
      import { twStyle } from '@mgcrea/react-native-tailwind';
      const styles = twStyle('');
    `;

    const output = transform(input);

    // Should replace with undefined
    expect(output).toContain("undefined");
  });
});

// Note: JSX tests require @babel/preset-react
describe("Babel plugin - className transformation (existing behavior)", () => {
  it("should still transform className props", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="m-4 p-2 bg-blue-500" />;
      }
    `;

    const output = transform(input, undefined, true); // Enable JSX

    // Should have StyleSheet
    expect(output).toContain("StyleSheet.create");
    expect(output).toContain("_twStyles");

    // Should replace className with style
    expect(output).not.toContain("className");
    expect(output).toContain("style:");
  });

  it("should work with both tw and className in same file", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';
      import { View } from 'react-native';

      const styles = tw\`bg-red-500\`;

      export function Component() {
        return <View className="m-4 p-2" />;
      }
    `;

    const output = transform(input, undefined, true); // Enable JSX

    // Should have both styles in StyleSheet
    expect(output).toContain("_bg_red_500");
    expect(output).toContain("_m_4_p_2");
  });
});
