/* eslint-disable @typescript-eslint/no-empty-function */
import { transformSync } from "@babel/core";
import { describe, expect, it, vi } from "vitest";
import babelPlugin, { type PluginOptions } from "./plugin.js";

/**
 * Helper to transform code with the Babel plugin
 */
function transform(code: string, options?: PluginOptions, includeJsx = false) {
  const presets = includeJsx
    ? ["@babel/preset-react", ["@babel/preset-typescript", { isTSX: true, allExtensions: true }]]
    : [];

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

describe("Babel plugin - color scheme modifier transformation", () => {
  it("should transform dark: modifier to conditional expression", () => {
    const input = `
      import React from 'react';
      import { View } from 'react-native';

      export function Component() {
        return (
          <View className="bg-white dark:bg-gray-900" />
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Should import useColorScheme
    expect(output).toContain("useColorScheme");
    expect(output).toMatch(/import.*useColorScheme.*from ['"]react-native['"]/);

    // Should inject colorScheme hook in component
    expect(output).toContain("_twColorScheme");
    expect(output).toContain("useColorScheme()");

    // Should have base bg-white style
    expect(output).toContain("_bg_white");

    // Should have dark:bg-gray-900 style
    expect(output).toContain("_dark_bg_gray_900");

    // Should generate conditional: _twColorScheme === 'dark' && ...
    expect(output).toMatch(/_twColorScheme\s*===\s*['"]dark['"]/);
  });

  it("should support both dark: and light: modifiers", () => {
    const input = `
      import React from 'react';
      import { View } from 'react-native';

      export function Component() {
        return (
          <View className="bg-gray-100 dark:bg-gray-900 light:bg-white" />
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Should have all three styles
    expect(output).toContain("_bg_gray_100");
    expect(output).toContain("_dark_bg_gray_900");
    expect(output).toContain("_light_bg_white");

    // Should have both conditionals
    expect(output).toMatch(/_twColorScheme\s*===\s*['"]dark['"]/);
    expect(output).toMatch(/_twColorScheme\s*===\s*['"]light['"]/);
  });

  it("should inject hook once for multiple elements with color scheme modifiers", () => {
    const input = `
      import React from 'react';
      import { View, Text } from 'react-native';

      export function Component() {
        return (
          <>
            <View className="dark:bg-gray-900" />
            <Text className="dark:text-white" />
            <View className="light:bg-white" />
          </>
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Count occurrences of useColorScheme() call - should be exactly 1
    const hookCallMatches = output.match(/=\s*useColorScheme\(\)/g);
    expect(hookCallMatches).toHaveLength(1);

    // Should have color scheme variable
    expect(output).toContain("_twColorScheme");
  });

  it("should work with color scheme and platform modifiers together", () => {
    const input = `
      import React from 'react';
      import { View } from 'react-native';

      export function Component() {
        return (
          <View className="p-4 ios:p-6 dark:bg-gray-900" />
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Should have Platform import
    expect(output).toContain("Platform");

    // Should have useColorScheme import
    expect(output).toContain("useColorScheme");

    // Should have Platform.select for ios:
    expect(output).toContain("Platform.select");
    expect(output).toContain("_ios_p_6");

    // Should have color scheme conditional for dark:
    expect(output).toMatch(/_twColorScheme\s*===\s*['"]dark['"]/);
    expect(output).toContain("_dark_bg_gray_900");
  });

  it("should only add useColorScheme import once when needed", () => {
    const input = `
      import React from 'react';
      import { View } from 'react-native';

      export function Component() {
        return (
          <>
            <View className="dark:bg-black" />
            <View className="light:bg-white" />
          </>
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Count useColorScheme imports
    const importMatches = output.match(/import.*useColorScheme.*from ['"]react-native['"]/g);
    expect(importMatches).toHaveLength(1);
  });

  it("should merge with existing useColorScheme import", () => {
    const input = `
      import React from 'react';
      import { View, useColorScheme } from 'react-native';

      export function Component() {
        return <View className="dark:bg-gray-900" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should still use useColorScheme
    expect(output).toContain("useColorScheme");

    // Should inject hook call
    expect(output).toContain("_twColorScheme");
    expect(output).toContain("useColorScheme()");
  });

  it("should work with concise arrow functions", () => {
    const input = `
      import React from 'react';
      import { View } from 'react-native';

      const Component = () => <View className="dark:bg-gray-900" />;
    `;

    const output = transform(input, undefined, true);

    // Should inject useColorScheme import
    expect(output).toContain("useColorScheme");

    // Should convert concise arrow to block statement and inject hook
    expect(output).toContain("_twColorScheme");
    expect(output).toContain("useColorScheme()");
    expect(output).toContain("return");

    // Should have the style
    expect(output).toContain("_dark_bg_gray_900");
    expect(output).toMatch(/_twColorScheme\s*===\s*['"]dark['"]/);
  });

  it("should inject hook at component level when dark: used in nested callback", () => {
    const input = `
      import React from 'react';
      import { View } from 'react-native';

      export function Component() {
        const items = [1, 2, 3];
        return (
          <View>
            {items.map(item => (
              <View key={item} className="dark:bg-gray-900" />
            ))}
          </View>
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Should inject hook at Component level (not in map callback)
    expect(output).toContain("_twColorScheme");
    expect(output).toContain("useColorScheme()");

    // Hook should be injected in Component function, not in map callback
    // Count occurrences - should be exactly 1 at Component level
    const hookCallMatches = output.match(/=\s*useColorScheme\(\)/g);
    expect(hookCallMatches).toHaveLength(1);

    // Should still generate conditional expression
    expect(output).toContain("_dark_bg_gray_900");
    expect(output).toMatch(/_twColorScheme\s*===\s*['"]dark['"]/);
  });

  it("should handle dynamic expressions with dark:/light: modifiers", () => {
    const input = `
      import React from 'react';
      import { View } from 'react-native';

      export function Component({ isActive }) {
        return (
          <View className={\`p-4 \${isActive ? "dark:bg-blue-500" : "dark:bg-gray-900"}\`} />
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Should inject useColorScheme
    expect(output).toContain("useColorScheme");
    expect(output).toContain("_twColorScheme");

    // Should have both dark styles
    expect(output).toContain("_dark_bg_blue_500");
    expect(output).toContain("_dark_bg_gray_900");

    // Should have conditional expressions for color scheme
    expect(output).toMatch(/_twColorScheme\s*===\s*['"]dark['"]/);
  });

  it("should handle dynamic expressions with platform modifiers", () => {
    const input = `
      import React from 'react';
      import { View } from 'react-native';

      export function Component({ isLarge }) {
        return (
          <View className={\`p-4 \${isLarge ? "ios:p-8" : "ios:p-6"}\`} />
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Should inject Platform import
    expect(output).toContain("Platform");

    // Should have both ios styles
    expect(output).toContain("_ios_p_8");
    expect(output).toContain("_ios_p_6");

    // Should have Platform.select
    expect(output).toContain("Platform.select");
  });

  it("should skip color scheme modifiers when used outside component scope", () => {
    // Suppress console.warn for this test
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const input = `
      import React from 'react';
      import { View } from 'react-native';

      // Class component - no function component scope
      class MyComponent extends React.Component {
        render() {
          return <View className="p-4 dark:bg-gray-900" />;
        }
      }
    `;

    const output = transform(input, undefined, true);

    // Should warn about invalid context
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("dark:/light: modifiers require a function component scope"),
    );

    // Should NOT inject useColorScheme import (no valid component scope)
    expect(output).not.toContain("useColorScheme");

    // Should NOT have _twColorScheme variable reference (would cause ReferenceError)
    expect(output).not.toContain("_twColorScheme");

    // Should NOT have dark: style conditional (skipped due to no component scope)
    expect(output).not.toContain("_dark_bg_gray_900");

    // Should still transform base classes (p-4)
    expect(output).toContain("_p_4");

    consoleWarnSpy.mockRestore();
  });
});

describe("Babel plugin - custom color scheme hook import", () => {
  it("should use custom import source for color scheme hook", () => {
    const input = `
      import React from 'react';
      import { View } from 'react-native';

      export function Component() {
        return <View className="dark:bg-gray-900" />;
      }
    `;

    const output = transform(
      input,
      {
        colorScheme: {
          importFrom: "@/hooks/useColorScheme",
          importName: "useColorScheme",
        },
      },
      true,
    );

    // Should import from custom source
    expect(output).toContain('from "@/hooks/useColorScheme"');
    expect(output).not.toContain('useColorScheme } from "react-native"');

    // Should inject hook call
    expect(output).toContain("_twColorScheme = useColorScheme()");

    // Should have conditional styling
    expect(output).toMatch(/_twColorScheme\s*===\s*['"]dark['"]/);
  });

  it("should use custom hook name", () => {
    const input = `
      import React from 'react';
      import { View } from 'react-native';

      export function Component() {
        return <View className="dark:bg-gray-900" />;
      }
    `;

    const output = transform(
      input,
      {
        colorScheme: {
          importFrom: "@react-navigation/native",
          importName: "useTheme",
        },
      },
      true,
    );

    // Should import useTheme from React Navigation
    expect(output).toContain('from "@react-navigation/native"');
    expect(output).toContain("useTheme");

    // Should call useTheme hook
    expect(output).toContain("_twColorScheme = useTheme()");

    // Should have conditional styling
    expect(output).toMatch(/_twColorScheme\s*===\s*['"]dark['"]/);
  });

  it("should merge custom hook with existing import from same source", () => {
    const input = `
      import React from 'react';
      import { View, Text } from 'react-native';
      import { useNavigation } from '@react-navigation/native';

      export function Component() {
        const navigation = useNavigation();
        return (
          <View className="dark:bg-gray-900">
            <Text onPress={() => navigation.navigate('Home')}>Go Home</Text>
          </View>
        );
      }
    `;

    const output = transform(
      input,
      {
        colorScheme: {
          importFrom: "@react-navigation/native",
          importName: "useTheme",
        },
      },
      true,
    );

    // Should merge with existing import (both useNavigation and useTheme in same import)
    expect(output).toMatch(
      /import\s+\{\s*useNavigation[^}]*useTheme[^}]*\}\s+from\s+['"]@react-navigation\/native['"]/,
    );
    expect(output).toContain("useNavigation()");
    expect(output).toContain("useTheme()");

    // Should only have one import from that source
    const importCount = (output.match(/@react-navigation\/native/g) ?? []).length;
    expect(importCount).toBe(1);
  });

  it("should not duplicate custom hook if already imported", () => {
    const input = `
      import React from 'react';
      import { View } from 'react-native';
      import { useColorScheme } from '@/hooks/useColorScheme';

      export function Component() {
        return <View className="dark:bg-gray-900" />;
      }
    `;

    const output = transform(
      input,
      {
        colorScheme: {
          importFrom: "@/hooks/useColorScheme",
          importName: "useColorScheme",
        },
      },
      true,
    );

    // Should not add duplicate import
    const importMatches = output.match(/import.*useColorScheme.*from ['"]@\/hooks\/useColorScheme['"]/g);
    expect(importMatches).toHaveLength(1);

    // Should still inject hook call
    expect(output).toContain("_twColorScheme = useColorScheme()");
  });

  it("should use react-native by default when no custom config provided", () => {
    const input = `
      import React from 'react';
      import { View } from 'react-native';

      export function Component() {
        return <View className="dark:bg-gray-900" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should use default react-native import (can be single or double quotes)
    expect(output).toMatch(/useColorScheme\s*}\s*from\s+['"]react-native['"]/);
    expect(output).not.toContain("@/hooks");
    expect(output).not.toContain("@react-navigation");

    // Should inject hook call with default name
    expect(output).toContain("_twColorScheme = useColorScheme()");
  });

  it("should create separate import when only type-only import exists", () => {
    const input = `
      import React from 'react';
      import { View } from 'react-native';
      import type { NavigationProp } from '@react-navigation/native';

      export function Component() {
        return <View className="dark:bg-gray-900" />;
      }
    `;

    const output = transform(
      input,
      {
        colorScheme: {
          importFrom: "@react-navigation/native",
          importName: "useTheme",
        },
      },
      true,
    );

    // TypeScript preset strips type-only imports, but the important thing is:
    // 1. useTheme hook is imported (not skipped thinking it was already imported)
    // 2. Hook is correctly called in the component
    expect(output).toMatch(/import\s+\{\s*useTheme\s*\}\s+from\s+['"]@react-navigation\/native['"]/);
    expect(output).toContain("_twColorScheme = useTheme()");
  });

  it("should use aliased identifier when hook is already imported with alias", () => {
    const input = `
      import React from 'react';
      import { View, Text } from 'react-native';
      import { useTheme as navTheme } from '@react-navigation/native';

      export function Component() {
        const theme = navTheme();
        return (
          <View className="dark:bg-gray-900">
            <Text>{theme.dark ? 'Dark' : 'Light'}</Text>
          </View>
        );
      }
    `;

    const output = transform(
      input,
      {
        colorScheme: {
          importFrom: "@react-navigation/native",
          importName: "useTheme",
        },
      },
      true,
    );

    // Should not add duplicate import
    const importMatches = output.match(
      /import\s+\{[^}]*useTheme[^}]*\}\s+from\s+['"]@react-navigation\/native['"]/g,
    );
    expect(importMatches).toHaveLength(1);

    // Should still have the aliased import
    expect(output).toMatch(/useTheme\s+as\s+navTheme/);

    // Should call the aliased name (navTheme), not the export name (useTheme)
    // Both the user's code and our injected hook should use navTheme
    expect(output).toContain("_twColorScheme = navTheme()");
    expect(output).not.toContain("_twColorScheme = useTheme()");
  });

  it("should not treat type-only imports as having the hook", () => {
    const input = `
      import React from 'react';
      import { View } from 'react-native';
      import type { useColorScheme } from 'react-native';

      export function Component() {
        return <View className="dark:bg-gray-900" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should add a VALUE import for useColorScheme (type import doesn't count)
    expect(output).toMatch(/import\s+\{[^}]*useColorScheme[^}]*\}\s+from\s+['"]react-native['"]/);

    // Should inject the hook
    expect(output).toContain("_twColorScheme = useColorScheme()");

    // Should have both type-only and value imports in output
    // (TypeScript preset keeps type imports for type checking)
    const colorSchemeMatches = output.match(/useColorScheme/g);
    expect(colorSchemeMatches).toBeTruthy();
    if (colorSchemeMatches) {
      expect(colorSchemeMatches.length).toBeGreaterThanOrEqual(2); // At least in import and hook call
    }
  });

  it("should handle both type-only and aliased imports together", () => {
    const input = `
      import React from 'react';
      import { View, Text } from 'react-native';
      import type { Theme } from '@react-navigation/native';
      import { useTheme as getNavTheme } from '@react-navigation/native';

      export function Component() {
        const theme = getNavTheme();
        return (
          <View className="dark:bg-gray-900">
            <Text>{theme.dark ? 'Dark Mode' : 'Light Mode'}</Text>
          </View>
        );
      }
    `;

    const output = transform(
      input,
      {
        colorScheme: {
          importFrom: "@react-navigation/native",
          importName: "useTheme",
        },
      },
      true,
    );

    // TypeScript preset strips type-only imports
    // The important thing is: should not add duplicate import, and should use aliased name
    expect(output).toMatch(
      /import\s+\{[^}]*useTheme\s+as\s+getNavTheme[^}]*\}\s+from\s+['"]@react-navigation\/native['"]/,
    );

    // Should not add duplicate import - useTheme should only appear in the aliased import
    const useThemeImports = output.match(
      /import\s+\{[^}]*useTheme[^}]*\}\s+from\s+['"]@react-navigation\/native['"]/g,
    );
    expect(useThemeImports).toHaveLength(1);

    // Should call the aliased name for both user code and our injected hook
    expect(output).toContain("_twColorScheme = getNavTheme()");
    expect(output).not.toContain("_twColorScheme = useTheme()");
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

describe("Babel plugin - scheme: modifier", () => {
  it.skip("should expand scheme: modifier into dark: and light: modifiers", () => {
    // Note: This test requires tailwind.config.js with custom colors defined
    // The scheme: modifier expands to dark: and light: modifiers which require
    // the color variants to exist in customColors (e.g., systemGray-dark, systemGray-light)
    //
    // Integration test should be done in a real project with tailwind.config.js
    const input = `
      import { View } from 'react-native';

      function MyComponent() {
        return <View className="scheme:text-systemGray" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should generate both dark and light variants
    expect(output).toContain("_dark_text_systemGray_dark");
    expect(output).toContain("_light_text_systemGray_light");

    // Should inject useColorScheme hook
    expect(output).toContain("useColorScheme");
    expect(output).toContain("_twColorScheme");

    // Should have conditional expressions
    expect(output).toContain("_twColorScheme === 'dark'");
    expect(output).toContain("_twColorScheme === 'light'");
  });
});

describe("Babel plugin - color scheme modifiers in tw/twStyle", () => {
  it("should transform tw with dark: modifier inside component", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';

      function MyComponent() {
        const styles = tw\`bg-white dark:bg-gray-900\`;
        return null;
      }
    `;

    const output = transform(input);

    // Should inject useColorScheme hook
    expect(output).toContain("useColorScheme");
    expect(output).toContain("_twColorScheme");

    // Should generate style array with conditionals
    expect(output).toContain("style: [");
    expect(output).toContain('_twColorScheme === "dark"');
    expect(output).toContain("_twStyles._dark_bg_gray_900");
    expect(output).toContain("_twStyles._bg_white");

    // Should have StyleSheet.create
    expect(output).toContain("StyleSheet.create");
  });

  it("should transform twStyle with light: modifier inside component", () => {
    const input = `
      import { twStyle } from '@mgcrea/react-native-tailwind';

      export const MyComponent = () => {
        const buttonStyles = twStyle('text-gray-900 light:text-gray-100');
        return null;
      };
    `;

    const output = transform(input);

    // Should inject useColorScheme hook
    expect(output).toContain("useColorScheme");
    expect(output).toContain("_twColorScheme");

    // Should generate style array with conditionals
    expect(output).toContain("style: [");
    expect(output).toContain('_twColorScheme === "light"');
    expect(output).toContain("_twStyles._light_text_gray_100");
    expect(output).toContain("_twStyles._text_gray_900");
  });

  it("should transform tw with both dark: and light: modifiers", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';

      function MyComponent() {
        const styles = tw\`bg-blue-500 dark:bg-blue-900 light:bg-blue-100\`;
        return null;
      }
    `;

    const output = transform(input);

    // Should have both conditionals
    expect(output).toContain('_twColorScheme === "dark"');
    expect(output).toContain('_twColorScheme === "light"');
    expect(output).toContain("_twStyles._dark_bg_blue_900");
    expect(output).toContain("_twStyles._light_bg_blue_100");
    expect(output).toContain("_twStyles._bg_blue_500");
  });

  it("should combine color scheme modifiers with state modifiers", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';

      function MyComponent() {
        const styles = tw\`bg-white dark:bg-gray-900 active:bg-blue-500\`;
        return null;
      }
    `;

    const output = transform(input);

    // Should have color scheme conditionals in style array
    expect(output).toContain("style: [");
    expect(output).toContain('_twColorScheme === "dark"');

    // Should have activeStyle property (separate from color scheme)
    expect(output).toContain("activeStyle:");
    expect(output).toContain("_twStyles._active_bg_blue_500");
  });

  it("should warn if tw with color scheme modifiers used outside component", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';

      const globalStyles = tw\`bg-white dark:bg-gray-900\`;
    `;

    const output = transform(input);

    // Should warn about usage outside component
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Color scheme modifiers (dark:, light:) in tw/twStyle calls"),
    );

    // Should not inject hook (no component scope)
    expect(output).not.toContain("useColorScheme");

    // Should still generate styles but without runtime conditionals
    expect(output).toContain("_twStyles");

    consoleWarnSpy.mockRestore();
  });

  it("should handle tw with only dark: modifier (no base class)", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';

      function MyComponent() {
        const styles = tw\`dark:bg-gray-900\`;
        return null;
      }
    `;

    const output = transform(input);

    // Should still generate style array
    expect(output).toContain("style: [");
    expect(output).toContain('_twColorScheme === "dark"');
    expect(output).toContain("_twStyles._dark_bg_gray_900");
  });

  it("should work with custom color scheme hook import", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';
      import { useTheme } from '@react-navigation/native';

      function MyComponent() {
        const styles = tw\`bg-white dark:bg-gray-900\`;
        return null;
      }
    `;

    const options: PluginOptions = {
      colorScheme: {
        importFrom: "@react-navigation/native",
        importName: "useTheme",
      },
    };

    const output = transform(input, options);

    // Should use existing import (not duplicate)
    const themeImportCount = (output.match(/useTheme/g) ?? []).length;
    // Should appear in import statement and hook call
    expect(themeImportCount).toBeGreaterThanOrEqual(2);

    // Should call the custom hook
    expect(output).toContain("useTheme()");
  });

  it("should generate both style array and darkStyle/lightStyle properties", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';

      function MyComponent() {
        const styles = tw\`bg-white dark:bg-gray-900 light:bg-gray-50\`;
        return null;
      }
    `;

    const output = transform(input);

    // Should have runtime conditional in style array
    expect(output).toContain("style: [");
    expect(output).toContain('_twColorScheme === "dark"');
    expect(output).toContain('_twColorScheme === "light"');

    // Should ALSO have darkStyle and lightStyle properties for manual access
    expect(output).toContain("darkStyle:");
    expect(output).toContain("lightStyle:");
    expect(output).toContain("_twStyles._dark_bg_gray_900");
    expect(output).toContain("_twStyles._light_bg_gray_50");
  });

  it("should allow accessing raw color values from darkStyle/lightStyle", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';

      function MyComponent() {
        const btnStyles = tw\`bg-blue-500 dark:bg-blue-900\`;
        // User can access raw hex for Reanimated
        const darkBgColor = btnStyles.darkStyle?.backgroundColor;
        return null;
      }
    `;

    const output = transform(input);

    // Should have darkStyle property available
    expect(output).toContain("darkStyle:");
    expect(output).toContain("_twStyles._dark_bg_blue_900");

    // The actual usage line should be preserved (TypeScript/Babel doesn't remove it)
    expect(output).toContain("btnStyles.darkStyle");
  });

  // Platform modifier tests for tw/twStyle
  it("should transform tw with ios: modifier", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';

      function MyComponent() {
        const styles = tw\`bg-white ios:p-6\`;
        return null;
      }
    `;

    const output = transform(input);

    // Should add Platform import
    expect(output).toContain("Platform");
    expect(output).toContain('from "react-native"');

    // Should generate style array with Platform.select()
    expect(output).toContain("style: [");
    expect(output).toContain("Platform.select");
    expect(output).toContain("ios:");
    expect(output).toContain("_twStyles._ios_p_6");
    expect(output).toContain("_twStyles._bg_white");

    // Should have StyleSheet.create
    expect(output).toContain("StyleSheet.create");
  });

  it("should transform twStyle with android: modifier", () => {
    const input = `
      import { twStyle } from '@mgcrea/react-native-tailwind';

      export const MyComponent = () => {
        const buttonStyles = twStyle('bg-blue-500 android:p-8');
        return null;
      };
    `;

    const output = transform(input);

    // Should add Platform import
    expect(output).toContain("Platform");

    // Should generate style array with Platform.select()
    expect(output).toContain("style: [");
    expect(output).toContain("Platform.select");
    expect(output).toContain("android:");
    expect(output).toContain("_twStyles._android_p_8");
    expect(output).toContain("_twStyles._bg_blue_500");
  });

  it("should transform tw with multiple platform modifiers", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';

      function MyComponent() {
        const styles = tw\`bg-white ios:p-6 android:p-8 web:p-4\`;
        return null;
      }
    `;

    const output = transform(input);

    // Should generate Platform.select() with all platforms
    expect(output).toContain("Platform.select");
    expect(output).toContain("ios:");
    expect(output).toContain("android:");
    expect(output).toContain("web:");
    expect(output).toContain("_twStyles._ios_p_6");
    expect(output).toContain("_twStyles._android_p_8");
    expect(output).toContain("_twStyles._web_p_4");
  });

  it("should combine platform modifiers with color-scheme modifiers", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';

      function MyComponent() {
        const styles = tw\`bg-white ios:p-6 dark:bg-gray-900\`;
        return null;
      }
    `;

    const output = transform(input);

    // Should have both Platform and useColorScheme
    expect(output).toContain("Platform");
    expect(output).toContain("useColorScheme");
    expect(output).toContain("_twColorScheme");

    // Should have both conditionals in style array
    expect(output).toContain("Platform.select");
    expect(output).toContain('_twColorScheme === "dark"');
  });

  it("should generate iosStyle/androidStyle/webStyle properties for manual access", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';

      function MyComponent() {
        const styles = tw\`bg-white ios:p-6 android:p-8 web:p-4\`;
        return null;
      }
    `;

    const output = transform(input);

    // Should have separate platform style properties
    expect(output).toContain("iosStyle:");
    expect(output).toContain("_twStyles._ios_p_6");
    expect(output).toContain("androidStyle:");
    expect(output).toContain("_twStyles._android_p_8");
    expect(output).toContain("webStyle:");
    expect(output).toContain("_twStyles._web_p_4");

    // Should also have runtime Platform.select() in style array
    expect(output).toContain("Platform.select");
  });

  it("should work with only platform modifiers (no base class)", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';

      function MyComponent() {
        const styles = tw\`ios:p-6 android:p-8\`;
        return null;
      }
    `;

    const output = transform(input);

    // Should generate Platform.select() even without base classes
    expect(output).toContain("Platform.select");
    expect(output).toContain("_twStyles._ios_p_6");
    expect(output).toContain("_twStyles._android_p_8");
  });

  it("should allow accessing platform-specific styles manually", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';

      function MyComponent() {
        const btnStyles = tw\`bg-blue-500 ios:p-6\`;
        const iosPadding = btnStyles.iosStyle;
        return null;
      }
    `;

    const output = transform(input);

    // Should have iosStyle property available
    expect(output).toContain("iosStyle:");
    expect(output).toContain("_twStyles._ios_p_6");

    // The actual usage line should be preserved
    expect(output).toContain("btnStyles.iosStyle");
  });

  it("should combine state modifiers with platform modifiers", () => {
    const input = `
      import { tw } from '@mgcrea/react-native-tailwind';

      function MyComponent() {
        const styles = tw\`bg-white active:bg-blue-500 ios:p-6\`;
        return null;
      }
    `;

    const output = transform(input);

    // Should have both activeStyle and platform modifiers
    expect(output).toContain("activeStyle:");
    expect(output).toContain("_twStyles._active_bg_blue_500");
    expect(output).toContain("Platform.select");
    expect(output).toContain("_twStyles._ios_p_6");
  });
});
