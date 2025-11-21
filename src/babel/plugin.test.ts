/* eslint-disable @typescript-eslint/no-empty-function */
import { transformSync } from "@babel/core";
import { describe, expect, it, vi } from "vitest";
import babelPlugin, { type PluginOptions } from "./plugin.js";

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

  it("should merge className with function-based style prop", () => {
    const input = `
      import { TextInput } from 'react-native';
      export function Component() {
        return (
          <TextInput
            className="border border-gray-300 bg-gray-100"
            style={({ focused, disabled }) => [
              baseStyles,
              focused && focusedStyles,
            ]}
          />
        );
      }
    `;

    const output = transform(input, undefined, true); // Enable JSX

    // Should have StyleSheet with className styles
    expect(output).toContain("StyleSheet.create");
    // Style keys are sorted alphabetically: bg-gray-100 comes before border
    expect(output).toContain("_bg_gray_100_border_border_gray_300");

    // Should create a wrapper function that merges both
    // The wrapper should call the original function and merge results
    expect(output).toContain("_state");
    expect(output).toContain("_twStyles._bg_gray_100_border_border_gray_300");

    // Should not have className in output
    expect(output).not.toContain("className");

    // Should have a function that accepts state and returns an array
    expect(output).toMatch(/_state\s*=>/);
  });

  it("should merge dynamic className with function-based style prop", () => {
    const input = `
      import { TextInput } from 'react-native';
      export function Component({ isError }) {
        return (
          <TextInput
            className={\`border \${isError ? 'border-red-500' : 'border-gray-300'}\`}
            style={({ focused }) => [
              baseStyles,
              focused && focusedStyles,
            ]}
          />
        );
      }
    `;

    const output = transform(input, undefined, true); // Enable JSX

    // Should have StyleSheet with both className styles
    expect(output).toContain("StyleSheet.create");
    expect(output).toContain("_border");
    expect(output).toContain("_border_red_500");
    expect(output).toContain("_border_gray_300");

    // Should create a wrapper function that merges dynamic styles with function result
    expect(output).toContain("_state");

    // Should not have className in output
    expect(output).not.toContain("className");
  });
});

describe("Babel plugin - placeholder: modifier transformation", () => {
  it("should transform placeholder:text-{color} to placeholderTextColor prop", () => {
    const input = `
      import { TextInput } from 'react-native';
      export function Component() {
        return (
          <TextInput
            className="border-2 placeholder:text-gray-400"
            placeholder="Email"
          />
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Should have placeholderTextColor prop with correct hex value (from custom palette)
    expect(output).toContain('placeholderTextColor: "#99a1af"');

    // Should still have style for border-2
    expect(output).toContain("StyleSheet.create");
    expect(output).toContain("_border_2");

    // Should not have className in output
    expect(output).not.toContain("className");
  });

  it("should support placeholder colors with opacity", () => {
    const input = `
      import { TextInput } from 'react-native';
      export function Component() {
        return <TextInput className="placeholder:text-red-500/50" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should have 8-digit hex with alpha channel (custom palette red-500, uppercased)
    expect(output).toContain('placeholderTextColor: "#FB2C3680"');
  });

  it("should support arbitrary placeholder colors", () => {
    const input = `
      import { TextInput } from 'react-native';
      export function Component() {
        return <TextInput className="placeholder:text-[#ff0000]" />;
      }
    `;

    const output = transform(input, undefined, true);

    expect(output).toContain('placeholderTextColor: "#ff0000"');
  });

  it("should combine placeholder: with other modifiers", () => {
    const input = `
      import { TextInput } from 'react-native';
      export function Component() {
        return (
          <TextInput
            className="border-2 focus:border-blue-500 placeholder:text-gray-400"
            placeholder="Email"
          />
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Should have placeholderTextColor prop (custom palette gray-400)
    expect(output).toContain('placeholderTextColor: "#99a1af"');

    // Should have focus: modifier handling (style function)
    expect(output).toContain("focused");
    expect(output).toMatch(/style[\s\S]*=>/); // Style function

    // Should not have className
    expect(output).not.toContain("className");
  });

  it("should handle multiple placeholder: classes (last wins)", () => {
    const input = `
      import { TextInput } from 'react-native';
      export function Component() {
        return (
          <TextInput className="placeholder:text-red-500 placeholder:text-blue-500" />
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Blue should win (last color, custom palette blue-500)
    expect(output).toContain('placeholderTextColor: "#2b7fff"');
  });

  it("should ignore non-text utilities in placeholder: modifier", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const input = `
      import { TextInput } from 'react-native';
      export function Component() {
        return (
          <TextInput className="placeholder:font-bold placeholder:text-gray-400" />
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Should still have the valid text color (custom palette gray-400)
    expect(output).toContain('placeholderTextColor: "#99a1af"');

    // Should not have font-bold anywhere
    expect(output).not.toContain("fontWeight");

    consoleSpy.mockRestore();
  });

  it.skip("should work with custom colors", () => {
    // Note: This test would require setting up a tailwind.config file
    // For now, we'll skip custom color testing in Babel tests
    // Custom colors are tested in the parser tests
  });

  it("should not transform placeholder: on non-TextInput elements", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="placeholder:text-gray-400" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should not have placeholderTextColor prop (View doesn't support it)
    expect(output).not.toContain("placeholderTextColor");

    // Should warn about unsupported modifier
    // (The warning happens because View doesn't support any modifiers)

    consoleSpy.mockRestore();
  });
});

describe("Babel plugin - platform modifier transformation", () => {
  it("should transform platform modifiers to Platform.select()", () => {
    const input = `
      import React from 'react';
      import { View } from 'react-native';

      export function Component() {
        return (
          <View className="p-4 ios:p-6 android:p-8" />
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Should import Platform from react-native
    expect(output).toContain("Platform");
    expect(output).toMatch(/import.*Platform.*from ['"]react-native['"]/);

    // Should generate Platform.select()
    expect(output).toContain("Platform.select");

    // Should have base padding style
    expect(output).toContain("_p_4");

    // Should have iOS and Android specific styles
    expect(output).toContain("_ios_p_6");
    expect(output).toContain("_android_p_8");

    // Should have correct style values in StyleSheet.create
    expect(output).toMatch(/padding:\s*16/); // p-4
    expect(output).toMatch(/padding:\s*24/); // p-6 (ios)
    expect(output).toMatch(/padding:\s*32/); // p-8 (android)
  });

  it("should support multiple platform modifiers on same element", () => {
    const input = `
      import React from 'react';
      import { View } from 'react-native';

      export function Component() {
        return (
          <View className="bg-white ios:bg-blue-50 android:bg-green-50 p-4 ios:p-6 android:p-8" />
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Should have Platform import
    expect(output).toContain("Platform");

    // Should have base styles (combined key)
    expect(output).toContain("_bg_white_p_4");

    // Should have iOS specific styles (combined key for multiple ios: modifiers)
    expect(output).toContain("_ios_bg_blue_50_p_6");

    // Should have Android specific styles (combined key for multiple android: modifiers)
    expect(output).toContain("_android_bg_green_50_p_8");

    // Should contain Platform.select with both platforms
    expect(output).toMatch(/Platform\.select\s*\(\s*\{[\s\S]*ios:/);
    expect(output).toMatch(/Platform\.select\s*\(\s*\{[\s\S]*android:/);
  });

  it("should support web platform modifier", () => {
    const input = `
      import React from 'react';
      import { View } from 'react-native';

      export function Component() {
        return (
          <View className="p-4 web:p-2" />
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Should have Platform.select with web
    expect(output).toContain("Platform.select");
    expect(output).toContain("web:");
    expect(output).toContain("_web_p_2");
  });

  it("should work with platform modifiers on all components", () => {
    const input = `
      import React from 'react';
      import { View, Text, ScrollView } from 'react-native';

      export function Component() {
        return (
          <View className="ios:bg-blue-500 android:bg-green-500">
            <Text className="ios:text-lg android:text-xl">Platform text</Text>
            <ScrollView contentContainerClassName="ios:p-4 android:p-8" />
          </View>
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Should work on View - check for Platform.select separately (not checking style= format)
    expect(output).toContain("Platform.select");

    // Should work on Text
    expect(output).toContain("_ios_text_lg");
    expect(output).toContain("_android_text_xl");

    // Should work on ScrollView contentContainerStyle
    expect(output).toContain("contentContainerStyle");
  });

  it("should combine platform modifiers with state modifiers", () => {
    const input = `
      import React from 'react';
      import { Pressable, Text } from 'react-native';

      export function Component() {
        return (
          <Pressable className="bg-blue-500 active:bg-blue-700 ios:shadow-md android:shadow-sm p-4">
            <Text className="text-white">Button</Text>
          </Pressable>
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Should have Platform.select for platform modifiers
    expect(output).toContain("Platform.select");
    expect(output).toContain("_ios_shadow_md");
    expect(output).toContain("_android_shadow_sm");

    // Should have state modifier function for active
    expect(output).toMatch(/\(\s*\{\s*pressed\s*\}\s*\)\s*=>/);
    expect(output).toContain("pressed");
    expect(output).toContain("_active_bg_blue_700");

    // Should have base styles
    expect(output).toContain("_bg_blue_500");
    expect(output).toContain("_p_4");
  });

  it("should handle platform-specific colors", () => {
    const input = `
      import React from 'react';
      import { View, Text } from 'react-native';

      export function Component() {
        return (
          <View className="bg-gray-100 ios:bg-blue-50 android:bg-green-50">
            <Text className="text-gray-900 ios:text-blue-900 android:text-green-900">
              Platform colors
            </Text>
          </View>
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Should have color values in StyleSheet
    expect(output).toMatch(/#[0-9A-F]{6}/i); // Hex color format

    // Should have platform-specific color classes
    expect(output).toContain("_ios_text_blue_900");
    expect(output).toContain("_android_text_green_900");
  });

  it("should only add Platform import once when needed", () => {
    const input = `
      import React from 'react';
      import { View } from 'react-native';

      export function Component() {
        return (
          <>
            <View className="ios:p-4" />
            <View className="android:p-8" />
            <View className="ios:bg-blue-500" />
          </>
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Should have Platform import
    expect(output).toContain("Platform");

    // Count how many times Platform is imported (should be once)
    const platformImports = output.match(/import.*Platform.*from ['"]react-native['"]/g);
    expect(platformImports).toHaveLength(1);
  });

  it("should merge with existing Platform import", () => {
    const input = `
      import React from 'react';
      import { View, Platform } from 'react-native';

      export function Component() {
        return <View className="ios:p-4 android:p-8" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should still use Platform.select
    expect(output).toContain("Platform.select");

    // Should not duplicate Platform import - Platform appears in import and Platform.select calls
    expect(output).toMatch(/Platform.*react-native/);
  });

  it("should handle platform modifiers without base classes", () => {
    const input = `
      import React from 'react';
      import { View } from 'react-native';

      export function Component() {
        return <View className="ios:p-6 android:p-8" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should only have Platform.select, no base style
    expect(output).toContain("Platform.select");
    expect(output).toContain("_ios_p_6");
    expect(output).toContain("_android_p_8");

    // Should not have generic padding without platform prefix
    // Check that non-platform-prefixed style keys don't exist
    expect(output).not.toMatch(/(?<!_ios|_android|_web)_p_4:/);
    expect(output).not.toMatch(/(?<!_ios|_android|_web)_p_6:/);
    expect(output).not.toMatch(/(?<!_ios|_android|_web)_p_8:/);
  });
});

describe("Babel plugin - import injection", () => {
  it("should not add StyleSheet import to files without className usage", () => {
    const input = `
      import { View, Text } from 'react-native';

      function MyComponent() {
        return <View><Text>Hello</Text></View>;
      }
    `;

    const output = transform(input, undefined, true);

    // Should not mutate the import by adding StyleSheet
    // Count occurrences of "StyleSheet" in output
    const styleSheetCount = (output.match(/StyleSheet/g) ?? []).length;
    expect(styleSheetCount).toBe(0);

    // Should not have _twStyles definition
    expect(output).not.toContain("_twStyles");
    expect(output).not.toContain("StyleSheet.create");

    // Original imports should remain unchanged
    expect(output).toContain("View");
    expect(output).toContain("Text");
  });

  it("should add StyleSheet import only when className is used", () => {
    const input = `
      import { View } from 'react-native';

      function MyComponent() {
        return <View className="m-4 p-2" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should have StyleSheet import (both single and double quotes)
    expect(output).toMatch(/import.*StyleSheet.*from ['"]react-native['"]|require\(['"]react-native['"]\)/);

    // Should have _twStyles definition
    expect(output).toContain("_twStyles");
    expect(output).toContain("StyleSheet.create");
  });

  it("should add Platform import only when platform modifiers are used", () => {
    const input = `
      import { View } from 'react-native';

      function MyComponent() {
        return <View className="ios:m-4 android:m-2" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should have Platform import
    expect(output).toContain("Platform");

    // Should have StyleSheet import too
    expect(output).toContain("StyleSheet");

    // Should use Platform.select
    expect(output).toContain("Platform.select");
  });

  it("should not add Platform import without platform modifiers", () => {
    const input = `
      import { View } from 'react-native';

      function MyComponent() {
        return <View className="m-4 p-2" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should not have Platform import
    const platformCount = (output.match(/Platform/g) ?? []).length;
    expect(platformCount).toBe(0);

    // Should still have StyleSheet
    expect(output).toContain("StyleSheet");
  });
});
