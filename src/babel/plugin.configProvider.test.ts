/**
 * End-to-End Integration Tests for configProvider
 *
 * Tests the FULL pipeline: option parsing → ref resolution → emission → import injection
 * Uses snapshot testing for full transform output regression detection.
 */

import { describe, expect, it, vi } from "vitest";
import {
    transform as baseTransform,
    transformWithConfig as baseTransformWithConfig,
} from "../../test/helpers/babelTransform.js";
import * as configLoader from "./config-loader.js";

const TEST_FILE = { filename: "/mock/project/src/test.tsx" };

function transform(
    code: string,
    options?: Parameters<typeof baseTransform>[1],
    includeJsx = false,
): string {
    return baseTransform(code, options, includeJsx, TEST_FILE.filename);
}

function transformWithConfig(
    code: string,
    configProviderImportFrom: string,
    options?: Parameters<typeof baseTransformWithConfig>[2],
): string {
    return baseTransformWithConfig(
        code,
        configProviderImportFrom,
        options,
        TEST_FILE.filename,
    );
}

vi.mock("./config-loader.js", async () => {
    const actual =
        await vi.importActual<typeof import("./config-loader.js")>(
            "./config-loader.js",
        );
    return {
        ...actual,
        findTailwindConfig: vi.fn(() => "/mock/project/tailwind.config.ts"),
    };
});

vi.mock("./utils/configModuleGenerator.js", async () => {
    const actual = await vi.importActual<
        typeof import("./utils/configModuleGenerator.js")
    >("./utils/configModuleGenerator.js");
    return {
        ...actual,
        writeConfigModule: vi.fn(), // Don't actually write files in tests
    };
});

// ─── Basic configProvider transforms ──────────────────────────────────────────

describe("configProvider E2E - basic transforms", () => {
    it("transforms className with color and spacing config refs", () => {
        const input = `
      import { View } from 'react-native';
      export default function App() {
        return <View className="bg-blue-500 p-4" />;
      }
    `;

        const output = transformWithConfig(input, "./my-provider");

        // Config refs for theme-derived values
        expect(output).toContain('__twConfig.theme.colors["blue-500"]');
        expect(output).toContain('__twConfig.theme.spacing["4"]');

        // Import injection
        expect(output).toContain("import { __twConfig }");
        expect(output).toContain(".generated.tailwind.config");
        expect(output).not.toContain("./my-provider");

        // StyleSheet.create still present
        expect(output).toContain("StyleSheet.create");

        // Snapshot full output
        expect(output).toMatchSnapshot();
    });

    it("transforms className with fontSize config refs", () => {
        const input = `
      import { Text } from 'react-native';
      export function Heading() {
        return <Text className="text-2xl font-bold" />;
      }
    `;

        const output = transformWithConfig(input, "./theme");

        // fontSize should be a config ref
        expect(output).toContain("__twConfig.theme.fontSize");

        expect(output).toMatchSnapshot();
    });

    it("transforms className with fontFamily config refs", () => {
        const input = `
      import { Text } from 'react-native';
      export function Label() {
        return <Text className="font-sans" />;
      }
    `;

        const output = transformWithConfig(input, "./theme");

        // fontFamily should be a config ref
        expect(output).toContain("__twConfig.theme.fontFamily");

        expect(output).toMatchSnapshot();
    });

    it("transforms border color config refs", () => {
        const input = `
      import { View } from 'react-native';
      export function Card() {
        return <View className="border border-red-500" />;
      }
    `;

        const output = transformWithConfig(input, "./theme");

        expect(output).toContain('__twConfig.theme.colors["red-500"]');
        expect(output).toMatchSnapshot();
    });
});

// ─── Mixed refs and literals ──────────────────────────────────────────────────

describe("configProvider E2E - mixed refs and literals", () => {
    it("uses config refs for theme values and literals for built-in scales", () => {
        const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="bg-blue-500 p-4 rounded-lg" />;
      }
    `;

        const output = transformWithConfig(input, "./my-provider");

        // Theme-derived: config refs
        expect(output).toContain('__twConfig.theme.colors["blue-500"]');
        expect(output).toContain('__twConfig.theme.spacing["4"]');

        // Built-in scale (borderRadius): literal
        // rounded-lg = borderRadius: 8
        expect(output).toMatch(/borderRadius:\s*8/);

        expect(output).toMatchSnapshot();
    });

    it("keeps arbitrary values as literals", () => {
        const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="bg-[#ff0000] w-[123px]" />;
      }
    `;

        const output = transformWithConfig(input, "./my-provider");

        // Arbitrary values remain literals
        expect(output).toContain('"#ff0000"');
        // Should NOT have config refs for arbitrary values
        expect(output).not.toContain("__twConfig.theme.colors");

        expect(output).toMatchSnapshot();
    });

    it("keeps opacity-modified values as literals", () => {
        const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="bg-blue-500/50" />;
      }
    `;

        const output = transformWithConfig(input, "./my-provider");

        // Opacity-modified: stays literal
        expect(output).not.toContain("__twConfig.theme.colors");

        expect(output).toMatchSnapshot();
    });

    it("keeps non-theme properties as literals", () => {
        const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="rounded-lg flex-1 overflow-hidden" />;
      }
    `;

        const output = transformWithConfig(input, "./my-provider");

        // Non-theme properties: no config refs at all
        expect(output).not.toContain("__twConfig");

        expect(output).toMatchSnapshot();
    });
});

// ─── Dark/light mode modifiers ──────────────────────────────────────────────

describe("configProvider E2E - dark/light mode modifiers", () => {
    it("transforms dark: modifier with config refs and conditional structure", () => {
        const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="bg-white dark:bg-gray-900" />;
      }
    `;

        const output = transformWithConfig(input, "./my-provider");

        // Config refs for both base and dark styles
        expect(output).toMatch(
            /__twConfig\.theme\.colors(?:\.white|\["white"\])/,
        );
        expect(output).toContain('__twConfig.theme.colors["gray-900"]');

        // Conditional structure preserved
        expect(output).toMatch(/_twColorScheme\s*===\s*['"]dark['"]/);
        expect(output).toContain("useColorScheme");
        expect(output).toContain("useColorScheme()");

        // Import injection
        expect(output).toContain("import { __twConfig }");

        expect(output).toMatchSnapshot();
    });

    it("transforms light: modifier with config refs", () => {
        const input = `
      import { Text } from 'react-native';
      export function Component() {
        return <Text className="text-gray-900 light:text-white" />;
      }
    `;

        const output = transformWithConfig(input, "./my-provider");

        // Config refs for both base and light styles
        expect(output).toContain('__twConfig.theme.colors["gray-900"]');
        expect(output).toMatch(
            /__twConfig\.theme\.colors(?:\.white|\["white"\])/,
        );

        // Conditional structure
        expect(output).toMatch(/_twColorScheme\s*===\s*['"]light['"]/);

        expect(output).toMatchSnapshot();
    });

    it("transforms combined dark: and light: modifiers", () => {
        const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="dark:bg-gray-900 light:bg-white" />;
      }
    `;

        const output = transformWithConfig(input, "./my-provider");

        // Both dark and light conditionals
        expect(output).toMatch(/_twColorScheme\s*===\s*['"]dark['"]/);
        expect(output).toMatch(/_twColorScheme\s*===\s*['"]light['"]/);

        // Config refs for both
        expect(output).toContain('__twConfig.theme.colors["gray-900"]');
        expect(output).toMatch(
            /__twConfig\.theme\.colors(?:\.white|\["white"\])/,
        );

        // Single useColorScheme hook
        const hookMatches =
            output.match(/_twColorScheme\s*=\s*useColorScheme\(\)/g) ?? [];
        expect(hookMatches.length).toBe(1);

        expect(output).toMatchSnapshot();
    });

    it("transforms scheme: modifier with config refs in both branches", () => {
        const extractCustomThemeSpy = vi
            .spyOn(configLoader, "extractCustomTheme")
            .mockReturnValue({
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

            // Config refs for both dark and light scheme branches
            expect(output).toContain('__twConfig.theme.colors["primary-dark"]');
            expect(output).toContain(
                '__twConfig.theme.colors["primary-light"]',
            );

            // Conditional structure
            expect(output).toMatch(/_twColorScheme\s*===\s*['"]dark['"]/);
            expect(output).toMatch(/_twColorScheme\s*===\s*['"]light['"]/);

            expect(output).toMatchSnapshot();
        } finally {
            extractCustomThemeSpy.mockRestore();
        }
    });
});

// ─── Platform modifiers ──────────────────────────────────────────────────────

describe("configProvider E2E - platform modifiers", () => {
    it("transforms ios: modifier with config refs", () => {
        const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="p-4 ios:p-6" />;
      }
    `;

        const output = transformWithConfig(input, "./my-provider");

        // Config refs for spacing
        expect(output).toContain('__twConfig.theme.spacing["4"]');
        expect(output).toContain('__twConfig.theme.spacing["6"]');

        // Platform.select structure preserved
        expect(output).toContain("Platform.select");

        expect(output).toMatchSnapshot();
    });

    it("transforms android: modifier with config refs", () => {
        const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="bg-blue-500 android:bg-green-500" />;
      }
    `;

        const output = transformWithConfig(input, "./my-provider");

        // Config refs for both colors
        expect(output).toContain('__twConfig.theme.colors["blue-500"]');
        expect(output).toContain('__twConfig.theme.colors["green-500"]');

        // Platform.select
        expect(output).toContain("Platform.select");

        expect(output).toMatchSnapshot();
    });

    it("transforms combined ios: and android: modifiers with config refs", () => {
        const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="ios:p-4 android:p-2" />;
      }
    `;

        const output = transformWithConfig(input, "./my-provider");

        // Both platform config refs
        expect(output).toContain("__twConfig.theme.spacing");
        expect(output).toContain("Platform.select");

        expect(output).toMatchSnapshot();
    });
});

// ─── tw`` template literals ──────────────────────────────────────────────────

describe("configProvider E2E - tw template literals", () => {
    it("transforms tw`` with config refs", () => {
        const input = `
      import { tw } from '@mgcrea/react-native-tailwind';
      const styles = tw\`bg-blue-500 p-4\`;
    `;

        const output = transform(input, {
            configProvider: { importFrom: "./my-provider" },
        });

        // Config refs
        expect(output).toContain('__twConfig.theme.colors["blue-500"]');
        expect(output).toContain('__twConfig.theme.spacing["4"]');

        // Import injection
        expect(output).toContain("__twConfig");
        expect(output).toContain(".generated.tailwind.config");
        expect(output).not.toContain("./my-provider");

        // StyleSheet.create
        expect(output).toContain("StyleSheet.create");

        expect(output).toMatchSnapshot();
    });

    it("transforms twStyle() with config refs", () => {
        const input = `
      import { twStyle } from '@mgcrea/react-native-tailwind';
      const styles = twStyle('bg-red-500 m-2');
    `;

        const output = transform(input, {
            configProvider: { importFrom: "./my-provider" },
        });

        // Config refs
        expect(output).toContain('__twConfig.theme.colors["red-500"]');
        expect(output).toContain('__twConfig.theme.spacing["2"]');

        expect(output).toMatchSnapshot();
    });

    it("transforms tw`` with state modifiers and config refs", () => {
        const input = `
      import { tw } from '@mgcrea/react-native-tailwind';
      const styles = tw\`bg-blue-500 active:bg-blue-700\`;
    `;

        const output = transform(input, {
            configProvider: { importFrom: "./my-provider" },
        });

        // Config refs for both base and active styles
        expect(output).toContain('__twConfig.theme.colors["blue-500"]');
        expect(output).toContain('__twConfig.theme.colors["blue-700"]');

        expect(output).toMatchSnapshot();
    });
});

// ─── Multiple components in same file ────────────────────────────────────────

describe("configProvider E2E - multiple components", () => {
    it("transforms multiple className attributes in same file", () => {
        const input = `
      import { View, Text } from 'react-native';
      export function Header() {
        return (
          <View className="bg-blue-500 p-4">
            <Text className="text-white text-lg" />
          </View>
        );
      }
    `;

        const output = transformWithConfig(input, "./my-provider");

        // Config refs from both elements
        expect(output).toContain('__twConfig.theme.colors["blue-500"]');
        expect(output).toContain('__twConfig.theme.spacing["4"]');
        expect(output).toMatch(
            /__twConfig\.theme\.colors(?:\.white|\["white"\])/,
        );
        expect(output).toContain("__twConfig.theme.fontSize");

        // Single __twConfig import
        const importMatches =
            output.match(/import\s*\{\s*__twConfig\s*\}/g) ?? [];
        expect(importMatches.length).toBe(1);

        expect(output).toMatchSnapshot();
    });

    it("transforms multiple separate components in same file", () => {
        const input = `
      import { View, Text } from 'react-native';

      export function ComponentA() {
        return <View className="bg-red-500 m-2" />;
      }

      export function ComponentB() {
        return <Text className="text-green-500 p-4" />;
      }
    `;

        const output = transformWithConfig(input, "./theme");

        // Config refs from both components
        expect(output).toContain('__twConfig.theme.colors["red-500"]');
        expect(output).toContain('__twConfig.theme.spacing["2"]');
        expect(output).toContain('__twConfig.theme.colors["green-500"]');
        expect(output).toContain('__twConfig.theme.spacing["4"]');

        // Single import
        const importMatches =
            output.match(/import\s*\{\s*__twConfig\s*\}/g) ?? [];
        expect(importMatches.length).toBe(1);

        expect(output).toMatchSnapshot();
    });

    it("transforms mixed className and tw`` in same file", () => {
        const input = `
      import { tw } from '@mgcrea/react-native-tailwind';
      import { View, Text } from 'react-native';

      const cardStyle = tw\`bg-gray-100 p-4\`;

      export function Card() {
        return (
          <View style={cardStyle.style}>
            <Text className="text-blue-500 text-lg" />
          </View>
        );
      }
    `;

        const output = transform(
            input,
            { configProvider: { importFrom: "./my-provider" } },
            true,
        );

        // Config refs from both tw and className
        expect(output).toContain('__twConfig.theme.colors["gray-100"]');
        expect(output).toContain('__twConfig.theme.spacing["4"]');
        expect(output).toContain('__twConfig.theme.colors["blue-500"]');
        expect(output).toContain("__twConfig.theme.fontSize");

        // Single __twConfig import
        const importMatches =
            output.match(/import\s*\{\s*__twConfig\s*\}/g) ?? [];
        expect(importMatches.length).toBe(1);

        expect(output).toMatchSnapshot();
    });
});

// ─── Negative cases ──────────────────────────────────────────────────────────

describe("configProvider E2E - negative cases", () => {
    it("does not inject __twConfig when configProvider is disabled", () => {
        const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="bg-blue-500 p-4" />;
      }
    `;

        const output = transform(input, undefined, true);

        // No config refs or import
        expect(output).not.toContain("__twConfig");
        expect(output).toContain("StyleSheet.create");

        expect(output).toMatchSnapshot();
    });

    it("does not inject __twConfig when no theme-resolvable classes are used", () => {
        const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="rounded-lg flex-1 overflow-hidden" />;
      }
    `;

        const output = transformWithConfig(input, "./my-provider");

        // No config refs because no theme-derived values
        expect(output).not.toContain("__twConfig");

        expect(output).toMatchSnapshot();
    });

    it("does not inject __twConfig for tw when configProvider is disabled", () => {
        const input = `
      import { tw } from '@mgcrea/react-native-tailwind';
      const styles = tw\`bg-blue-500 p-4\`;
    `;

        const output = transform(input);

        // No config refs
        expect(output).not.toContain("__twConfig");
        expect(output).toContain("StyleSheet.create");

        expect(output).toMatchSnapshot();
    });
});

// ─── Config import path ──────────────────────────────────────────────────────

describe("configProvider E2E - import path generation", () => {
    it("generates correct import path from configProvider.importFrom", () => {
        const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="bg-blue-500" />;
      }
    `;

        const output = transformWithConfig(input, "./my-custom-provider");

        expect(output).toContain(".generated.tailwind.config");
        expect(output).not.toContain("./my-custom-provider");
        expect(output).toContain("import { __twConfig }");

        expect(output).toMatchSnapshot();
    });

    it("uses __twConfig as the default import name", () => {
        const input = `
      import { View } from 'react-native';
      export function Component() {
        return <View className="bg-blue-500" />;
      }
    `;

        const output = transformWithConfig(input, "./provider");

        // Default import name is __twConfig
        expect(output).toContain("__twConfig");

        // Config refs use __twConfig prefix
        expect(output).toContain("__twConfig.theme.colors");

        expect(output).toMatchSnapshot();
    });
});

// ─── Complex real-world scenarios ────────────────────────────────────────────

describe("configProvider E2E - real-world scenarios", () => {
    it("transforms a complete card component with multiple theme categories", () => {
        const input = `
      import { View, Text } from 'react-native';

      export function Card({ title, body }) {
        return (
          <View className="bg-white p-4 m-2 border border-gray-200">
            <Text className="text-lg font-bold text-gray-900">{title}</Text>
            <Text className="text-sm text-gray-500 mt-2">{body}</Text>
          </View>
        );
      }
    `;

        const output = transformWithConfig(input, "./my-theme");

        // Colors
        expect(output).toMatch(
            /__twConfig\.theme\.colors(?:\.white|\["white"\])/,
        );
        expect(output).toContain('__twConfig.theme.colors["gray-200"]');
        expect(output).toContain('__twConfig.theme.colors["gray-900"]');
        expect(output).toContain('__twConfig.theme.colors["gray-500"]');

        // Spacing
        expect(output).toContain('__twConfig.theme.spacing["4"]');
        expect(output).toContain('__twConfig.theme.spacing["2"]');

        // Font size
        expect(output).toContain("__twConfig.theme.fontSize");

        // StyleSheet.create
        expect(output).toContain("StyleSheet.create");

        expect(output).toMatchSnapshot();
    });

    it("transforms a theme-aware component with dark mode and platform modifiers", () => {
        const input = `
      import { View, Text } from 'react-native';

      export function ThemedCard() {
        return (
          <View className="bg-white dark:bg-gray-900 p-4 ios:p-6">
            <Text className="text-gray-900 dark:text-white text-lg" />
          </View>
        );
      }
    `;

        const output = transformWithConfig(input, "./my-provider");

        // Base colors
        expect(output).toMatch(
            /__twConfig\.theme\.colors(?:\.white|\["white"\])/,
        );
        expect(output).toContain('__twConfig.theme.colors["gray-900"]');

        // Dark mode colors
        expect(output).toMatch(/_twColorScheme\s*===\s*['"]dark['"]/);

        // Platform modifiers
        expect(output).toContain("Platform.select");

        // Spacing
        expect(output).toContain("__twConfig.theme.spacing");

        // Font size
        expect(output).toContain("__twConfig.theme.fontSize");

        // Hooks
        expect(output).toContain("useColorScheme");

        expect(output).toMatchSnapshot();
    });

    it("transforms conditional className (ternary) with literal values", () => {
        const input = `
      import { View } from 'react-native';

      export function Button({ isActive }) {
        return (
          <View className={isActive ? "bg-blue-500 p-4" : "bg-gray-200 p-4"} />
        );
      }
    `;

        const output = transformWithConfig(input, "./provider");

        // Conditional className (ternary) uses literal values — config refs are not emitted
        // for ternary-branched className expressions since they follow a different code path
        expect(output).toContain("StyleSheet.create");
        expect(output).toContain("_bg_blue_500_p_4");
        expect(output).toContain("_bg_gray_200_p_4");
        expect(output).toContain("isActive");

        expect(output).toMatchSnapshot();
    });
});

// ─── Class-to-prop mapping with configProvider ─────────────────────────────────

describe("configProvider E2E - class-to-prop mapping", () => {
    const ICON_MAPPING_OPTIONS = {
        componentClassToPropMapping: [
            {
                importFrom: "lucide-react-native",
                components: ["Icon"],
                mapping: { color: "text-*", size: "size-*" },
            },
        ],
    };

    it("does not inject __twConfig when mapping is configured but no mapped classes are used", () => {
        const input = `
      import { Icon } from 'lucide-react-native';
      export default function App() {
        return <Icon />;
      }
    `;

        const output = transformWithConfig(
            input,
            "./my-provider",
            ICON_MAPPING_OPTIONS,
        );

        // No className/tw usage in this file, so no config import should be emitted
        expect(output).not.toContain("__twConfig");
        expect(output).not.toContain(".generated.tailwind.config");

        expect(output).toMatchSnapshot();
    });

    it("transforms mapped color prop to config ref (non-modifier path)", () => {
        const input = `
      import { Icon } from 'lucide-react-native';
      export default function App() {
        return <Icon className="text-red-500" />;
      }
    `;

        const output = transformWithConfig(
            input,
            "./my-provider",
            ICON_MAPPING_OPTIONS,
        );

        // className should be removed and replaced with color prop using config ref
        expect(output).not.toContain("className");
        expect(output).toContain("color");
        expect(output).toContain('__twConfig.theme.colors["red-500"]');

        // Should inject __twConfig import
        expect(output).toContain("import { __twConfig }");

        // No StyleSheet.create — only mapped props
        expect(output).not.toContain("StyleSheet.create");

        expect(output).toMatchSnapshot();
    });

    it("transforms mapped size prop to literal (no config ref available for spacing)", () => {
        const input = `
      import { Icon } from 'lucide-react-native';
      export default function App() {
        return <Icon className="size-6" />;
      }
    `;

        const output = transformWithConfig(
            input,
            "./my-provider",
            ICON_MAPPING_OPTIONS,
        );

        // className should be removed and replaced with size prop
        expect(output).not.toContain("className");
        expect(output).toContain("size");

        // size-6 resolves to literal 24 because resolveConfigRefs does not
        // produce config ref paths for spacing classes — config refs are used
        // only when deterministic and available (per spec)
        expect(output).not.toContain("StyleSheet.create");

        expect(output).toMatchSnapshot();
    });

    it("transforms dark/light modifier mapped props with config refs", () => {
        const input = `
      import { Icon } from 'lucide-react-native';
      export default function App() {
        return <Icon className="dark:text-red-500 light:text-blue-500" />;
      }
    `;

        const output = transformWithConfig(
            input,
            "./my-provider",
            ICON_MAPPING_OPTIONS,
        );

        // Modifier-based mapped props use config refs when configProvider is enabled
        expect(output).toContain('__twConfig.theme.colors["red-500"]');
        expect(output).toContain('__twConfig.theme.colors["blue-500"]');

        // Should have ternary conditional: dark check with light as fallback
        // dark:X light:Y → _twColorScheme === "dark" ? X : Y
        expect(output).toMatch(/_twColorScheme\s*===\s*['"]dark['"]/);
        expect(output).toMatch(
            /\?\s*__twConfig\.theme\.colors\["red-500"\]\s*:\s*__twConfig\.theme\.colors\["blue-500"\]/,
        );

        // Should inject __twConfig import
        expect(output).toContain("import { __twConfig }");

        // Should inject useColorScheme hook
        expect(output).toContain("useColorScheme");
        expect(output).toContain("useColorScheme()");

        expect(output).toMatchSnapshot();
    });

    it("injects __twConfig import for modifier mapped props even without StyleSheet.create", () => {
        const input = `
      import { Icon } from 'lucide-react-native';
      export default function App() {
        return <Icon className="dark:text-red-500" />;
      }
    `;

        const output = transformWithConfig(
            input,
            "./my-provider",
            ICON_MAPPING_OPTIONS,
        );

        // Config ref import should be present
        expect(output).toContain("import { __twConfig }");
        expect(output).toContain(".generated.tailwind.config");

        // Config ref for the mapped color prop
        expect(output).toContain('__twConfig.theme.colors["red-500"]');

        // No StyleSheet.create — only mapped props, no regular className styles
        expect(output).not.toContain("StyleSheet.create");

        expect(output).toMatchSnapshot();
    });

    it("transforms mixed regular className and modifier mapped props with configProvider", () => {
        const input = `
      import { View } from 'react-native';
      import { Icon } from 'lucide-react-native';
      export default function App() {
        return (
          <View className="bg-blue-500 p-4">
            <Icon className="dark:text-red-500 light:text-blue-500" />
          </View>
        );
      }
    `;

        const output = transformWithConfig(
            input,
            "./my-provider",
            ICON_MAPPING_OPTIONS,
        );

        // Regular className → StyleSheet.create with config refs
        expect(output).toContain('__twConfig.theme.colors["blue-500"]');
        expect(output).toContain('__twConfig.theme.spacing["4"]');
        expect(output).toContain("StyleSheet.create");

        // Mapped props → config refs in conditional
        expect(output).toContain('__twConfig.theme.colors["red-500"]');

        // Single __twConfig import for entire file
        const importMatches =
            output.match(/import\s*\{\s*__twConfig\s*\}/g) ?? [];
        expect(importMatches.length).toBe(1);

        expect(output).toMatchSnapshot();
    });

    it("transforms platform modifier mapped props with config refs", () => {
        const input = `
      import { Icon } from 'lucide-react-native';
      export default function App() {
        return <Icon className="ios:text-red-500 android:text-blue-500" />;
      }
    `;

        const output = transformWithConfig(
            input,
            "./my-provider",
            ICON_MAPPING_OPTIONS,
        );

        // Platform-modified mapped props use config refs
        expect(output).toContain('__twConfig.theme.colors["red-500"]');
        expect(output).toContain('__twConfig.theme.colors["blue-500"]');

        // Should have Platform.select structure
        expect(output).toContain("Platform.select");

        // Should inject __twConfig import
        expect(output).toContain("import { __twConfig }");

        expect(output).toMatchSnapshot();
    });
});
