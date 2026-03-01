#!/usr/bin/env node --experimental-strip-types

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { transformSync } from "@babel/core";

const require = createRequire(import.meta.url);

type JsonObject = Record<string, unknown>;
type JsxMode = "auto" | "on" | "off";

interface CliArgs {
    inputFile: string | null;
    outFile: string | null;
    optionsFile: string | null;
    optionsJson: string | null;
    cwd: string;
    jsxMode: JsxMode;
    help: boolean;
}

function printHelp(): void {
    process.stdout.write(
        [
            "Usage:",
            "  inspect-transform.ts <input-file> [options]",
            "",
            "Options:",
            "  --out <file>          Write transformed output to file instead of stdout",
            "  --options <file>      Path to JSON file with plugin options",
            "  --options-json <json> Inline JSON string with plugin options",
            "  --cwd <dir>           Working directory for resolution (default: process.cwd())",
            "  --jsx                 Force JSX presets on",
            "  --no-jsx              Force JSX presets off",
            "  --help                Show this help message",
            "",
        ].join("\n"),
    );
}

function fail(message: string): never {
    throw new Error(message);
}

function parseJsonObject(raw: string, sourceLabel: string): JsonObject {
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        fail(`Failed to parse JSON from ${sourceLabel}: ${detail}`);
    }

    if (
        parsed === null ||
        Array.isArray(parsed) ||
        typeof parsed !== "object"
    ) {
        fail(`Expected a JSON object in ${sourceLabel}.`);
    }

    return parsed as JsonObject;
}

function parseArgs(argv: string[]): CliArgs {
    const args: CliArgs = {
        inputFile: null,
        outFile: null,
        optionsFile: null,
        optionsJson: null,
        cwd: process.cwd(),
        jsxMode: "auto",
        help: false,
    };

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];

        if (token === "--") {
            continue;
        }

        if (token === "--help") {
            args.help = true;
            continue;
        }

        if (token === "--out") {
            index += 1;
            const value = argv[index];
            if (!value) {
                fail("Missing value for --out.");
            }
            args.outFile = value;
            continue;
        }

        if (token === "--options") {
            index += 1;
            const value = argv[index];
            if (!value) {
                fail("Missing value for --options.");
            }
            args.optionsFile = value;
            continue;
        }

        if (token === "--options-json") {
            index += 1;
            const value = argv[index];
            if (!value) {
                fail("Missing value for --options-json.");
            }
            args.optionsJson = value;
            continue;
        }

        if (token === "--cwd") {
            index += 1;
            const value = argv[index];
            if (!value) {
                fail("Missing value for --cwd.");
            }
            args.cwd = value;
            continue;
        }

        if (token === "--jsx") {
            args.jsxMode = "on";
            continue;
        }

        if (token === "--no-jsx") {
            args.jsxMode = "off";
            continue;
        }

        if (token.startsWith("--")) {
            fail(`Unknown option: ${token}`);
        }

        if (args.inputFile !== null) {
            fail(`Unexpected positional argument: ${token}`);
        }

        args.inputFile = token;
    }

    return args;
}

function shouldEnableJsx(inputFileAbs: string, jsxMode: JsxMode): boolean {
    if (jsxMode === "on") {
        return true;
    }

    if (jsxMode === "off") {
        return false;
    }

    const ext = path.extname(inputFileAbs).toLowerCase();
    return ext === ".tsx" || ext === ".jsx";
}

function loadPluginOptions(
    cwdAbs: string,
    optionsFile: string | null,
    optionsJson: string | null,
): JsonObject {
    const fromFile = optionsFile
        ? parseJsonObject(
              fs.readFileSync(path.resolve(cwdAbs, optionsFile), "utf8"),
              `--options file (${path.resolve(cwdAbs, optionsFile)})`,
          )
        : {};

    const fromInline = optionsJson
        ? parseJsonObject(optionsJson, "--options-json")
        : {};

    return { ...fromFile, ...fromInline };
}

function run(): void {
    const args = parseArgs(process.argv.slice(2));

    if (args.help) {
        printHelp();
        return;
    }

    if (!args.inputFile) {
        printHelp();
        fail("Missing required input file.");
    }

    const cwdAbs = path.resolve(args.cwd);
    const inputAbs = path.resolve(cwdAbs, args.inputFile);
    const outputAbs = args.outFile ? path.resolve(cwdAbs, args.outFile) : null;
    const enableJsx = shouldEnableJsx(inputAbs, args.jsxMode);
    const pluginOptions = loadPluginOptions(
        cwdAbs,
        args.optionsFile,
        args.optionsJson,
    );

    const source = fs.readFileSync(inputAbs, "utf8");

    let babelPlugin: unknown;
    try {
        babelPlugin = require("../dist/babel/index.cjs").default;
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        fail(
            `Failed to load ../dist/babel/index.cjs. Run pnpm build first. ${detail}`,
        );
    }

    const result = transformSync(source, {
        filename: inputAbs,
        configFile: false,
        babelrc: false,
        cwd: cwdAbs,
        root: cwdAbs,
        presets: enableJsx
            ? [
                  "@babel/preset-react",
                  [
                      "@babel/preset-typescript",
                      { isTSX: true, allExtensions: true },
                  ],
              ]
            : undefined,
        plugins: [[babelPlugin as never, pluginOptions]],
    });

    if (!result || typeof result.code !== "string") {
        fail("Babel transform produced no output.");
    }

    if (outputAbs) {
        fs.writeFileSync(outputAbs, result.code, "utf8");
        return;
    }

    process.stdout.write(result.code);
}

try {
    run();
} catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    process.stderr.write(`inspect-transform: ${detail}\n`);
    process.exit(1);
}
