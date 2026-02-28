/* eslint-disable @typescript-eslint/no-empty-function */
import { describe, expect, it, vi } from "vitest";
import { transform, transformWithConfig } from "../../../../test/helpers/babelTransform.js";
import { extractCustomTheme } from "../../config-loader.js";

vi.mock("../../config-loader.js", async () => {
  const actual = await vi.importActual<typeof import("../../config-loader.js")>("../../config-loader.js");
  return {
    ...actual,
    findTailwindConfig: vi.fn(() => "/mock/project/tailwind.config.ts"),
    extractCustomTheme: vi.fn(actual.extractCustomTheme),
  };
});

vi.mock("../../utils/configModuleGenerator.js", async () => {
  const actual = await vi.importActual<typeof import("../../utils/configModuleGenerator.js")>(
    "../../utils/configModuleGenerator.js",
  );
  return {
    ...actual,
    writeConfigModule: vi.fn(),
  };
});

describe("className visitor - basic transformation", () => {
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

  it("should preserve 'use client' directive when injecting StyleSheet.create", () => {
    const input = `
      'use client';
      import { View } from 'react-native';
      export function Component() {
        return <View className="m-4 p-2" />;
      }
    `;

    const output = transform(input, undefined, true);

    // 'use client' should be the first statement
    const lines = output.split("\n").filter((l: string) => l.trim());
    const useClientIndex = lines.findIndex(
      (l: string) => l.includes("'use client'") || l.includes('"use client"'),
    );
    expect(useClientIndex).toBe(0);

    // StyleSheet.create should be in the output
    expect(output).toContain("StyleSheet.create");
    expect(output).toContain("_twStyles");

    // Imports should come after 'use client', before StyleSheet.create
    const importIndex = lines.findIndex((l: string) => l.includes("import"));
    const styleSheetIndex = lines.findIndex((l: string) => l.includes("StyleSheet.create"));
    expect(importIndex).toBeGreaterThan(useClientIndex);
    expect(styleSheetIndex).toBeGreaterThan(importIndex);
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

  it('should transform className={"..."} (string literal in expression container)', () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className={"flex-row items-center justify-start"} />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should have StyleSheet
    expect(output).toContain("StyleSheet.create");
    expect(output).toContain("_twStyles");

    // Should replace className with style
    expect(output).not.toContain("className");
    expect(output).toContain("style:");

    // Should have the expected style keys
    expect(output).toContain("_flex_row_items_center_justify_start");
  });

  it('should transform className={"..."} with modifiers', () => {
    const input = `
      import { Pressable } from 'react-native';
      export function Component() {
        return <Pressable className={"bg-blue-500 active:bg-blue-700 p-4"} />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should have StyleSheet with both base and active styles
    expect(output).toContain("_bg_blue_500_p_4");
    expect(output).toContain("_active_bg_blue_700");

    // Should have style function for active modifier (Pressable uses 'pressed' parameter)
    expect(output).toMatch(/(pressed|_state)/);

    // Should not have className in output
    expect(output).not.toContain("className");
  });

  it('should transform className={"..."} with platform modifiers', () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className={"p-4 ios:p-6 android:p-8"} />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should have Platform import
    expect(output).toContain("Platform");
    expect(output).toMatch(/from ['"]react-native['"]/); // Match both single and double quotes

    // Should have Platform.select
    expect(output).toContain("Platform.select");

    // Should have platform-specific styles
    expect(output).toContain("_ios_p_6");
    expect(output).toContain("_android_p_8");

    // Should not have className in output
    expect(output).not.toContain("className");
  });

  it('should handle empty className={""}', () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className={""} />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should remove empty className attribute entirely
    expect(output).not.toContain("className");
    expect(output).not.toContain("style=");
  });
});

describe("className visitor - placeholder: modifier", () => {
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

describe("className visitor - platform modifiers", () => {
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

describe("className visitor - color scheme modifiers", () => {
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

describe("className visitor - custom color scheme hook", () => {
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
    expect(colorSchemeMatches?.length).toBeGreaterThanOrEqual(2); // At least in import and hook call
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

describe("className visitor - directional border colors", () => {
  it("should transform directional border colors with preset values", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="border-t-red-500 border-l-blue-500" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should have StyleSheet
    expect(output).toContain("StyleSheet.create");

    // Should generate styles with borderTopColor and borderLeftColor
    expect(output).toMatch(/borderTopColor[:\s]*['"]#[0-9A-F]{6}['"]/i);
    expect(output).toMatch(/borderLeftColor[:\s]*['"]#[0-9A-F]{6}['"]/i);

    // Should not have className in output
    expect(output).not.toContain("className");
  });

  it("should combine directional border width and color", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="border-l-2 border-l-red-500" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should have both borderLeftWidth and borderLeftColor in the StyleSheet
    expect(output).toMatch(/borderLeftWidth[:\s]*2/);
    expect(output).toMatch(/borderLeftColor[:\s]*['"]#[0-9A-F]{6}['"]/i);

    // Should not have className in output
    expect(output).not.toContain("className");
  });

  it("should support directional border colors with opacity", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="border-t-red-500/50 border-b-blue-500/80" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should have 8-digit hex colors with alpha channel
    expect(output).toMatch(/borderTopColor[:\s]*['"]#[0-9A-F]{8}['"]/i);
    expect(output).toMatch(/borderBottomColor[:\s]*['"]#[0-9A-F]{8}['"]/i);
  });

  it("should support directional border colors with arbitrary hex values", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="border-t-[#ff0000] border-r-[#abc]" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should have borderTopColor and borderRightColor
    expect(output).toMatch(/borderTopColor[:\s]*['"]#[0-9a-fA-F]{6}['"]/);
    expect(output).toMatch(/borderRightColor[:\s]*['"]#[0-9a-fA-F]{6}['"]/);
  });

  it("should support all four directional border colors", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return (
          <View className="border-t-red-500 border-r-blue-500 border-b-green-500 border-l-yellow-500" />
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Should have all four directional color properties
    expect(output).toMatch(/borderTopColor[:\s]*['"]#[0-9A-F]{6}['"]/i);
    expect(output).toMatch(/borderRightColor[:\s]*['"]#[0-9A-F]{6}['"]/i);
    expect(output).toMatch(/borderBottomColor[:\s]*['"]#[0-9A-F]{6}['"]/i);
    expect(output).toMatch(/borderLeftColor[:\s]*['"]#[0-9A-F]{6}['"]/i);
  });

  it("should combine directional widths, colors, and general border color", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return (
          <View className="border border-gray-300 border-l-4 border-l-blue-500" />
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Should have general border properties
    expect(output).toMatch(/borderWidth[:\s]*1/);
    expect(output).toMatch(/borderColor[:\s]*['"]#[0-9A-F]{6}['"]/i);

    // Should have directional left border properties
    expect(output).toMatch(/borderLeftWidth[:\s]*4/);
    expect(output).toMatch(/borderLeftColor[:\s]*['"]#[0-9A-F]{6}['"]/i);
  });

  it("should work with dynamic className containing directional border colors", () => {
    const input = `
      import { View } from 'react-native';
      export function Component({ isError }) {
        return (
          <View className={\`border-t-2 \${isError ? 'border-t-red-500' : 'border-t-gray-300'}\`} />
        );
      }
    `;

    const output = transform(input, undefined, true);

    // Should have StyleSheet with both color options
    expect(output).toContain("_border_t_2");
    expect(output).toContain("_border_t_red_500");
    expect(output).toContain("_border_t_gray_300");

    // Should have conditional expression with both styles
    expect(output).toMatch(/isError\s*\?\s*_twStyles\._border_t_red_500/);
  });
});

describe("className visitor - directional modifiers (RTL/LTR)", () => {
  it("should transform rtl: modifier and inject I18nManager import", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="rtl:mr-4" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should import I18nManager
    expect(output).toContain("I18nManager");

    // Should declare _twIsRTL variable
    expect(output).toContain("_twIsRTL");
    expect(output).toContain("I18nManager.isRTL");

    // Should have StyleSheet with rtl style
    expect(output).toContain("StyleSheet.create");
    expect(output).toContain("_rtl_mr_4");

    // Should have conditional for RTL
    expect(output).toMatch(/_twIsRTL\s*&&\s*_twStyles\._rtl_mr_4/);
  });

  it("should transform ltr: modifier with negated conditional", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="ltr:ml-4" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should import I18nManager
    expect(output).toContain("I18nManager");

    // Should have StyleSheet with ltr style
    expect(output).toContain("_ltr_ml_4");

    // Should have negated conditional for LTR (!_twIsRTL)
    expect(output).toMatch(/!\s*_twIsRTL\s*&&\s*_twStyles\._ltr_ml_4/);
  });

  it("should combine rtl: and ltr: modifiers", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="rtl:mr-4 ltr:ml-4" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should have both styles
    expect(output).toContain("_rtl_mr_4");
    expect(output).toContain("_ltr_ml_4");

    // Should have both conditionals
    expect(output).toMatch(/_twIsRTL\s*&&\s*_twStyles\._rtl_mr_4/);
    expect(output).toMatch(/!\s*_twIsRTL\s*&&\s*_twStyles\._ltr_ml_4/);
  });

  it("should combine directional modifiers with base classes", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="p-4 bg-white rtl:pr-8 ltr:pl-8" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should have base style
    expect(output).toContain("_bg_white_p_4");

    // Should have directional styles
    expect(output).toContain("_rtl_pr_8");
    expect(output).toContain("_ltr_pl_8");

    // Should generate an array with base and conditional styles
    expect(output).toMatch(/style:\s*\[/);
  });

  it("should combine directional modifiers with platform modifiers", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="p-4 ios:p-6 rtl:mr-4" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should have Platform import
    expect(output).toContain("Platform");

    // Should have I18nManager import
    expect(output).toContain("I18nManager");

    // Should have all styles
    expect(output).toContain("_p_4");
    expect(output).toContain("_ios_p_6");
    expect(output).toContain("_rtl_mr_4");

    // Should have Platform.select
    expect(output).toContain("Platform.select");

    // Should have RTL conditional
    expect(output).toMatch(/_twIsRTL\s*&&/);
  });

  it("should not add I18nManager import if already present", () => {
    const input = `
      import { View, I18nManager } from 'react-native';
      export function Component() {
        return <View className="rtl:mr-4" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should have only one I18nManager import (merged, not duplicated)
    const i18nMatches = output.match(/I18nManager/g);
    // Should have I18nManager in: import, variable declaration, and style usage
    expect(i18nMatches).toBeTruthy();
    // Should not have duplicate imports
    expect(output).not.toMatch(/import\s*\{[^}]*I18nManager[^}]*I18nManager[^}]*\}/);
  });

  it("should work with directional logical properties", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="rtl:ms-4 ltr:me-4" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should have logical property styles
    expect(output).toContain("_rtl_ms_4");
    expect(output).toContain("_ltr_me_4");

    // Should contain marginStart and marginEnd in the StyleSheet
    expect(output).toContain("marginStart");
    expect(output).toContain("marginEnd");
  });

  it("should combine directional modifiers with color scheme modifiers", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="bg-white dark:bg-gray-900 rtl:pr-4" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should have useColorScheme
    expect(output).toContain("useColorScheme");

    // Should have I18nManager
    expect(output).toContain("I18nManager");

    // Should have all styles
    expect(output).toContain("_bg_white");
    expect(output).toContain("_dark_bg_gray_900");
    expect(output).toContain("_rtl_pr_4");

    // Should have both conditionals
    expect(output).toMatch(/_twColorScheme\s*===\s*["']dark["']/);
    expect(output).toMatch(/_twIsRTL\s*&&/);
  });

  it("should handle aliased I18nManager import", () => {
    const input = `
      import { View, I18nManager as RTL } from 'react-native';
      export function Component() {
        // Use RTL somewhere so TypeScript doesn't strip the unused import
        const isRtl = RTL.isRTL;
        return <View className="rtl:mr-4" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should use the aliased identifier RTL.isRTL instead of I18nManager.isRTL
    expect(output).toContain("RTL.isRTL");
    // Should preserve the aliased import
    expect(output).toContain("I18nManager as RTL");
    // Should not add a separate I18nManager import without alias
    expect(output).not.toMatch(/I18nManager,|,\s*I18nManager\s*[,}]/);
  });

  it("should preserve 'use client' directive when injecting I18nManager variable", () => {
    const input = `
      'use client';
      import { View } from 'react-native';
      export function Component() {
        return <View className="rtl:mr-4" />;
      }
    `;

    const output = transform(input, undefined, true);

    // 'use client' should be the first statement
    const lines = output.split("\n").filter((l: string) => l.trim());
    const useClientIndex = lines.findIndex(
      (l: string) => l.includes("'use client'") || l.includes('"use client"'),
    );
    expect(useClientIndex).toBe(0);

    // I18nManager variable should come after imports, not before 'use client'
    expect(output).toContain("_twIsRTL");
    expect(output).toContain("I18nManager.isRTL");
  });

  it("should preserve 'use strict' directive when injecting I18nManager variable", () => {
    const input = `
      'use strict';
      import { View } from 'react-native';
      export function Component() {
        return <View className="rtl:mr-4" />;
      }
    `;

    const output = transform(input, undefined, true);

    // 'use strict' should be preserved at the top
    const lines = output.split("\n").filter((l: string) => l.trim());
    const useStrictIndex = lines.findIndex(
      (l: string) => l.includes("'use strict'") || l.includes('"use strict"'),
    );
    expect(useStrictIndex).toBe(0);

    // I18nManager variable should work correctly
    expect(output).toContain("_twIsRTL");
    expect(output).toContain("I18nManager.isRTL");
  });

  it("should expand text-start to directional modifiers", () => {
    const input = `
      import { Text } from 'react-native';
      export function Component() {
        return <Text className="text-start" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should have I18nManager import (text-start expands to ltr:/rtl: modifiers)
    expect(output).toContain("I18nManager");

    // Should have both ltr and rtl styles
    expect(output).toContain("_ltr_text_left");
    expect(output).toContain("_rtl_text_right");

    // Should have conditionals for both
    expect(output).toMatch(/_twIsRTL\s*&&/);
    expect(output).toMatch(/!\s*_twIsRTL\s*&&/);
  });

  it("should expand text-end to directional modifiers", () => {
    const input = `
      import { Text } from 'react-native';
      export function Component() {
        return <Text className="text-end" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Should have I18nManager import
    expect(output).toContain("I18nManager");

    // text-end expands to ltr:text-right rtl:text-left
    expect(output).toContain("_ltr_text_right");
    expect(output).toContain("_rtl_text_left");
  });
});

describe("className visitor - configProvider config refs", () => {
  it("should emit config refs for theme-derived color and spacing values", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="bg-blue-500 p-4" />;
      }
    `;

    const output = transformWithConfig(input, "./my-provider");

    // Should have config ref for color
    expect(output).toContain('__twConfig.theme.colors["blue-500"]');
    // Should have config ref for spacing
    expect(output).toContain('__twConfig.theme.spacing["4"]');
    // Should import __twConfig
    expect(output).toContain("__twConfig");
  });

  it("should emit config refs for dark: and preserve dark conditional structure", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="bg-white dark:bg-gray-900" />;
      }
    `;

    const output = transformWithConfig(input, "./my-provider");

    expect(output).toMatch(/__twConfig\.theme\.colors(?:\.white|\["white"\])/);
    expect(output).toContain('__twConfig.theme.colors["gray-900"]');
    expect(output).toMatch(/_twColorScheme\s*===\s*['"]dark['"]\s*&&\s*_twStyles\._dark_bg_gray_900/);
    expect(output).toContain("useColorScheme");
    expect(output).toContain("useColorScheme()");
  });

  it("should emit config refs for light: and preserve light conditional structure", () => {
    const input = `
      import { Text } from 'react-native';
      export function Component() {
        return <Text className="light:text-white" />;
      }
    `;

    const output = transformWithConfig(input, "./my-provider");

    expect(output).toMatch(/__twConfig\.theme\.colors(?:\.white|\["white"\])/);
    expect(output).toMatch(/_twColorScheme\s*===\s*['"]light['"]\s*&&\s*_twStyles\._light_text_white/);
    expect(output).toContain("useColorScheme");
    expect(output).toContain("useColorScheme()");
  });

  it("should emit config refs for scheme: expansions in both dark and light branches", () => {
    vi.mocked(extractCustomTheme).mockReturnValue({
      colors: {
        "primary-dark": "#111111",
        "primary-light": "#f8f8f8",
      },
      fontFamily: {},
      fontSize: {},
      spacing: {},
    });

    try {
      const input = `
        import { View } from 'react-native';
        export function Component() {
          return <View className="scheme:bg-primary" />;
        }
      `;

      const output = transformWithConfig(input, "./my-provider");

      expect(output).toContain('__twConfig.theme.colors["primary-dark"]');
      expect(output).toContain('__twConfig.theme.colors["primary-light"]');
      expect(output).toMatch(/_twColorScheme\s*===\s*['"]dark['"]\s*&&\s*_twStyles\._dark_bg_primary_dark/);
      expect(output).toMatch(/_twColorScheme\s*===\s*['"]light['"]\s*&&\s*_twStyles\._light_bg_primary_light/);
      expect(output).toContain("useColorScheme");
      expect(output).toContain("useColorScheme()");
    } finally {
      vi.mocked(extractCustomTheme).mockRestore();
    }
  });

  it("should keep arbitrary values as literals", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="bg-[#ff0000]" />;
      }
    `;

    const output = transformWithConfig(input, "./my-provider");

    // Arbitrary values should stay literal
    expect(output).toContain('"#ff0000"');
    // Should NOT have config ref for arbitrary values
    expect(output).not.toContain("__twConfig.theme.colors");
  });

  it("should keep opacity-modified values as literals", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="bg-blue-500/50" />;
      }
    `;

    const output = transformWithConfig(input, "./my-provider");

    // Opacity-modified values should stay literal (8-digit hex)
    expect(output).not.toContain("__twConfig.theme.colors");
  });

  it("should keep non-theme properties as literals", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="rounded-lg" />;
      }
    `;

    const output = transformWithConfig(input, "./my-provider");

    // borderRadius is not in the theme, should be literal
    expect(output).toContain("8");
    expect(output).not.toContain("__twConfig");
  });

  it("should not emit config refs when configProvider is not enabled", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="bg-blue-500 p-4" />;
      }
    `;

    const output = transform(input, undefined, true);

    // Without configProvider, should NOT have config refs
    expect(output).not.toContain("__twConfig");
  });
});

describe("className visitor - class-to-prop mapping modifiers", () => {
  const mappingOptions = {
    componentClassToPropMapping: [
      {
        importFrom: "lucide-react-native",
        components: ["Icon"],
        mapping: { color: "text-*", size: "size-*" },
      },
    ],
  };

  it("should transform dark:/light: modifiers to conditional expression on mapped prop", () => {
    const input = `
      import { Icon } from 'lucide-react-native';
      export function Component() {
        return <Icon className="dark:text-red-500 light:text-blue-500" />;
      }
    `;

    const output = transform(input, mappingOptions, true);

    // Should inject useColorScheme hook
    expect(output).toContain("useColorScheme");
    expect(output).toContain("_twColorScheme");
    expect(output).toContain("useColorScheme()");

    // Should have color prop with conditional expression
    expect(output).toContain("color:");
    expect(output).toMatch(/_twColorScheme\s*===\s*['"]dark['"]/);

    // Should NOT have className in output
    expect(output).not.toContain("className");

    // Should NOT have style prop (mapped to color prop instead)
    expect(output).not.toContain("style:");
  });

  it("should expand scheme: modifier to dark:/light: with custom color suffixes", () => {
    vi.mocked(extractCustomTheme).mockReturnValue({
      colors: {
        "brand-dark": "#1a1a2e",
        "brand-light": "#e0e0ff",
      },
      fontFamily: {},
      fontSize: {},
      spacing: {},
    });

    try {
      const input = `
        import { Icon } from 'lucide-react-native';
        export function Component() {
          return <Icon className="scheme:text-brand" />;
        }
      `;

      const output = transform(input, mappingOptions, true);

      // Should inject useColorScheme for scheme: expansion
      expect(output).toContain("useColorScheme");
      expect(output).toContain("_twColorScheme");

      // Should have conditional with dark/light branches
      expect(output).toMatch(/_twColorScheme\s*===\s*['"]dark['"]/);

      // Should have the expanded color values from custom theme
      expect(output).toContain("#1a1a2e"); // brand-dark
      expect(output).toContain("#e0e0ff"); // brand-light

      // Should have color prop, not style
      expect(output).toContain("color:");
      expect(output).not.toContain("className");
    } finally {
      vi.mocked(extractCustomTheme).mockRestore();
    }
  });

  it("should transform ios:/android: modifiers to Platform.select on mapped prop", () => {
    const input = `
      import { Icon } from 'lucide-react-native';
      export function Component() {
        return <Icon className="ios:text-red-500 android:text-blue-500" />;
      }
    `;

    const output = transform(input, mappingOptions, true);

    // Should import Platform
    expect(output).toContain("Platform");
    expect(output).toMatch(/import.*Platform.*from\s+['"]react-native['"]/);

    // Should have Platform.select as prop value
    expect(output).toContain("Platform.select");
    expect(output).toContain("color:");

    // Should have ios and android keys in Platform.select
    expect(output).toMatch(/ios:/);
    expect(output).toMatch(/android:/);

    // Should NOT have className or style
    expect(output).not.toContain("className");
    expect(output).not.toContain("style:");
  });

  it("should transform rtl:/ltr: modifiers to I18nManager conditional on mapped prop", () => {
    const input = `
      import { Icon } from 'lucide-react-native';
      export function Component() {
        return <Icon className="rtl:text-red-500 ltr:text-blue-500" />;
      }
    `;

    const output = transform(input, mappingOptions, true);

    // Should import I18nManager
    expect(output).toContain("I18nManager");

    // Should have color prop with I18nManager conditional
    expect(output).toContain("color:");
    expect(output).toContain("_twIsRTL");
    expect(output).toContain("I18nManager.isRTL");

    // Should NOT have className or style
    expect(output).not.toContain("className");
    expect(output).not.toContain("style:");
  });

  it("should transform web: modifier to Platform.select with web key on mapped prop", () => {
    const input = `
      import { Icon } from 'lucide-react-native';
      export function Component() {
        return <Icon className="web:text-green-500" />;
      }
    `;

    const output = transform(input, mappingOptions, true);

    // Should have Platform.select with web key
    expect(output).toContain("Platform.select");
    expect(output).toContain("web:");
    expect(output).toContain("color:");

    // Should NOT have className
    expect(output).not.toContain("className");
  });

  it("should combine base class with dark: modifier, using base as default", () => {
    const input = `
      import { Icon } from 'lucide-react-native';
      export function Component() {
        return <Icon className="text-gray-500 dark:text-white" />;
      }
    `;

    const output = transform(input, mappingOptions, true);

    // Should inject useColorScheme
    expect(output).toContain("useColorScheme");
    expect(output).toContain("_twColorScheme");

    // Should have color prop with conditional
    expect(output).toContain("color:");
    expect(output).toMatch(/_twColorScheme\s*===\s*['"]dark['"]/);

    // Base gray-500 value should be present as fallback (light branch)
    // The conditional is: _twColorScheme === "dark" ? darkValue : baseValue
    expect(output).toMatch(/#[0-9a-fA-F]{6}/); // Should have hex color values

    // Should NOT have className or style
    expect(output).not.toContain("className");
    expect(output).not.toContain("style:");
  });

  it("should combine base class with platform modifiers, base as default", () => {
    const input = `
      import { Icon } from 'lucide-react-native';
      export function Component() {
        return <Icon className="text-gray-500 ios:text-red-500 android:text-blue-500" />;
      }
    `;

    const output = transform(input, mappingOptions, true);

    // Should have Platform.select with default fallback
    expect(output).toContain("Platform.select");
    expect(output).toContain("color:");

    // Should have platform keys + default in Platform.select
    expect(output).toMatch(/ios:/);
    expect(output).toMatch(/android:/);
    expect(output).toMatch(/default:/);

    // Should NOT have className
    expect(output).not.toContain("className");
  });

  it("should warn and skip state modifiers (active:, hover:, etc.) on mapped props", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const input = `
      import { Icon } from 'lucide-react-native';
      export function Component() {
        return <Icon className="active:text-red-500" />;
      }
    `;

    const output = transform(input, mappingOptions, true);

    // Should warn about unsupported state modifier
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("active:"));
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("not supported for class-to-prop mapping"),
    );

    // Should NOT have active: style applied
    expect(output).not.toContain("pressed");
    expect(output).not.toContain("_state");

    // Should NOT have className
    expect(output).not.toContain("className");

    consoleSpy.mockRestore();
  });

  it("should warn and skip hover: modifier on mapped props", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const input = `
      import { Icon } from 'lucide-react-native';
      export function Component() {
        return <Icon className="text-gray-500 hover:text-blue-500" />;
      }
    `;

    const output = transform(input, mappingOptions, true);

    // Should warn about hover: modifier
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("hover:"));

    // Base class should still be mapped
    expect(output).toContain("color:");

    // Should NOT have hover state handling
    expect(output).not.toContain("hovered");

    consoleSpy.mockRestore();
  });

  it("should inject useColorScheme import when dark:/light: modifiers are used on mapped props", () => {
    const input = `
      import { Icon } from 'lucide-react-native';
      export function Component() {
        return <Icon className="dark:text-white" />;
      }
    `;

    const output = transform(input, mappingOptions, true);

    // Should have useColorScheme import from react-native
    expect(output).toMatch(/import.*useColorScheme.*from\s+['"]react-native['"]/);

    // Should inject hook call in component
    expect(output).toContain("_twColorScheme = useColorScheme()");
  });

  it("should inject Platform import when ios:/android:/web: modifiers are used on mapped props", () => {
    const input = `
      import { Icon } from 'lucide-react-native';
      export function Component() {
        return <Icon className="ios:text-red-500" />;
      }
    `;

    const output = transform(input, mappingOptions, true);

    // Should have Platform import from react-native
    expect(output).toContain("Platform");
    expect(output).toMatch(/import.*Platform.*from\s+['"]react-native['"]/);

    // Should have Platform.select in the prop value
    expect(output).toContain("Platform.select");
  });

  it("should inject I18nManager import when rtl:/ltr: modifiers are used on mapped props", () => {
    const input = `
      import { Icon } from 'lucide-react-native';
      export function Component() {
        return <Icon className="rtl:text-red-500" />;
      }
    `;

    const output = transform(input, mappingOptions, true);

    // Should import I18nManager from react-native
    expect(output).toContain("I18nManager");

    // Should declare _twIsRTL variable
    expect(output).toContain("_twIsRTL");
    expect(output).toContain("I18nManager.isRTL");
  });

  it("should handle combined color scheme + platform modifiers on mapped prop", () => {
    const input = `
      import { Icon } from 'lucide-react-native';
      export function Component() {
        return <Icon className="dark:text-white ios:text-red-500" />;
      }
    `;

    const output = transform(input, mappingOptions, true);

    // Should have both useColorScheme and Platform
    expect(output).toContain("useColorScheme");
    expect(output).toContain("Platform");

    // Should have Platform.select (outermost layer)
    expect(output).toContain("Platform.select");

    // Should have color scheme conditional (inner layer)
    expect(output).toMatch(/_twColorScheme\s*===\s*['"]dark['"]/);

    // Should have color prop
    expect(output).toContain("color:");
  });

  it("should map multiple props with modifiers simultaneously", () => {
    const input = `
      import { Icon } from 'lucide-react-native';
      export function Component() {
        return <Icon className="dark:text-white size-6" />;
      }
    `;

    const output = transform(input, mappingOptions, true);

    // Should have color prop with conditional
    expect(output).toContain("color:");
    expect(output).toContain("_twColorScheme");

    // Should have size prop as numeric literal
    expect(output).toContain("size:");

    // Should NOT have className or style
    expect(output).not.toContain("className");
    expect(output).not.toContain("style:");
  });

  it("should warn and skip focus: and disabled: modifiers on mapped props", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const input = `
      import { Icon } from 'lucide-react-native';
      export function Component() {
        return <Icon className="text-gray-500 focus:text-blue-500 disabled:text-gray-300" />;
      }
    `;

    const output = transform(input, mappingOptions, true);

    // Should warn about both unsupported state modifiers
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("focus:"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("disabled:"));

    // Base class should still be mapped
    expect(output).toContain("color:");

    consoleSpy.mockRestore();
  });
});

describe("className visitor - class-to-prop mapping", () => {
  const defaultMappingOptions = {
    componentClassToPropMapping: [
      {
        importFrom: "lucide-react-native",
        components: ["Icon"],
        mapping: { color: "text-*", size: "size-*" },
      },
    ],
  };

  it("should map text-* and size-* classes to color and size props", () => {
    const input = `
      import { Icon } from 'lucide-react-native';
      export function Component() {
        return <Icon className="text-red-500 size-6" />;
      }
    `;

    const output = transform(input, defaultMappingOptions, true);

    // Should have color and size props
    expect(output).toContain('color: "#fb2c36"');
    expect(output).toContain("size: 24");

    // Should NOT have className attribute
    expect(output).not.toContain("className");
  });

  it("should map three props simultaneously (color, size, opacity)", () => {
    const input = `
      import { Icon } from 'lucide-react-native';
      export function Component() {
        return <Icon className="text-blue-500 size-4 opacity-75" />;
      }
    `;

    const output = transform(
      input,
      {
        componentClassToPropMapping: [
          {
            importFrom: "lucide-react-native",
            components: ["Icon"],
            mapping: { color: "text-*", size: "size-*", opacity: "opacity-*" },
          },
        ],
      },
      true,
    );

    expect(output).toContain('color: "#2b7fff"');
    expect(output).toContain("size: 16");
    expect(output).toContain("opacity: 0.75");
    expect(output).not.toContain("className");
  });

  it("should let explicit JSX prop take precedence over mapped value", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const input = `
      import { Icon } from 'lucide-react-native';
      export function Component() {
        return <Icon color="blue" className="text-red-500" />;
      }
    `;

    const output = transform(input, defaultMappingOptions, true);

    // Explicit prop should win
    expect(output).toContain('color: "blue"');

    // Should warn about precedence
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Explicit prop "color" takes precedence'));

    // Should NOT have className
    expect(output).not.toContain("className");

    consoleSpy.mockRestore();
  });

  it("should handle unmapped classes without generating styles for them", () => {
    const input = `
      import { Icon } from 'lucide-react-native';
      export function Component() {
        return <Icon className="text-red-500 flex-row" />;
      }
    `;

    const output = transform(input, defaultMappingOptions, true);

    // color should be mapped from text-red-500
    expect(output).toContain('color: "#fb2c36"');

    // flex-row should NOT produce any style property
    expect(output).not.toContain("flexDirection");

    // Should NOT have className
    expect(output).not.toContain("className");
  });

  it("should apply normal style transform when component is not configured for mapping", () => {
    const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="text-red-500" />;
      }
    `;

    const output = transform(input, defaultMappingOptions, true);

    // View is NOT in the mapping config, so normal style transform applies
    expect(output).toContain("StyleSheet.create");
    expect(output).toContain("style:");

    // Should NOT have className
    expect(output).not.toContain("className");
  });

  it("should work with aliased imports (import { Icon as MyIcon })", () => {
    const input = `
      import { Icon as MyIcon } from 'lucide-react-native';
      export function Component() {
        return <MyIcon className="text-red-500 size-6" />;
      }
    `;

    // Aliased imports match via wildcard components: ["*"]
    // because getClassToPropRule matches against the local name (MyIcon),
    // not the imported name (Icon)
    const output = transform(
      input,
      {
        componentClassToPropMapping: [
          {
            importFrom: "lucide-react-native",
            components: ["*"],
            mapping: { color: "text-*", size: "size-*" },
          },
        ],
      },
      true,
    );

    expect(output).toContain('color: "#fb2c36"');
    expect(output).toContain("size: 24");
    expect(output).not.toContain("className");
  });

  it("should work with namespace imports (import * as Icons)", () => {
    const input = `
      import * as Icons from 'lucide-react-native';
      export function Component() {
        return <Icons.Icon className="text-red-500 size-6" />;
      }
    `;

    const output = transform(input, defaultMappingOptions, true);

    expect(output).toContain('color: "#fb2c36"');
    expect(output).toContain("size: 24");
    expect(output).not.toContain("className");
  });

  it("should match all components with wildcard components: ['*']", () => {
    const input = `
      import { Home } from 'lucide-react-native';
      export function Component() {
        return <Home className="text-blue-500 size-4" />;
      }
    `;

    const output = transform(
      input,
      {
        componentClassToPropMapping: [
          {
            importFrom: "lucide-react-native",
            components: ["*"],
            mapping: { color: "text-*", size: "size-*" },
          },
        ],
      },
      true,
    );

    expect(output).toContain('color: "#2b7fff"');
    expect(output).toContain("size: 16");
    expect(output).not.toContain("className");
  });

  it("should warn on dynamic className for mapped component", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const input = `
      import { Icon } from 'lucide-react-native';
      export function Component({ colorClass }) {
        return <Icon className={colorClass} />;
      }
    `;

    const output = transform(input, defaultMappingOptions, true);

    // Should warn about dynamic className on mapped component
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Dynamic className is not supported for mapped components"),
    );

    consoleSpy.mockRestore();
  });

  it("should map custom theme colors via text-primary", () => {
    vi.mocked(extractCustomTheme).mockReturnValue({
      colors: { primary: "#1bacb5" },
      fontFamily: {},
      fontSize: {},
      spacing: {},
    });

    try {
      const input = `
        import { Icon } from 'lucide-react-native';
        export function Component() {
          return <Icon className="text-primary" />;
        }
      `;

      const output = transform(input, defaultMappingOptions, true);

      expect(output).toContain('color: "#1bacb5"');
      expect(output).not.toContain("className");
    } finally {
      vi.mocked(extractCustomTheme).mockRestore();
    }
  });

  it('should handle className={"..."} expression container format', () => {
    const input = `
      import { Icon } from 'lucide-react-native';
      export function Component() {
        return <Icon className={"text-red-500 size-6"} />;
      }
    `;

    const output = transform(input, defaultMappingOptions, true);

    expect(output).toContain('color: "#fb2c36"');
    expect(output).toContain("size: 24");
    expect(output).not.toContain("className");
  });

  it("should not generate StyleSheet.create when only mapped props are used", () => {
    const input = `
      import { Icon } from 'lucide-react-native';
      export function Component() {
        return <Icon className="text-red-500 size-6" />;
      }
    `;

    const output = transform(input, defaultMappingOptions, true);

    // All classes mapped to props — no StyleSheet.create needed
    expect(output).not.toContain("StyleSheet.create");
    expect(output).not.toContain("_twStyles");

    // Should have props instead
    expect(output).toContain('color: "#fb2c36"');
    expect(output).toContain("size: 24");
  });
});
