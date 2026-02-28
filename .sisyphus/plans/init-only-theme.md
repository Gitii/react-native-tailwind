# Init-Only Theme: Babel Plugin Config Provider

## TL;DR

> **Quick Summary**: Add `configProvider` option to the Babel plugin so that theme-derived style values reference a shared config object (`__twConfig`) via MemberExpressions instead of inlined literals. Values resolve once at module creation time, enabling one-time runtime customization (e.g., Android dynamic wallpaper colors) while keeping `StyleSheet.create` performance.
>
> **Deliverables**:
> - `configProvider: { importFrom, importName }` plugin option
> - Generated `.generated.tailwind.config.js` module (physical file next to tailwind.config)
> - Config-ref AST emission for theme-derived values (colors, spacing, fontFamily, fontSize)
> - `__twConfig` import injection into transformed modules
> - Dark/light mode modifier support with config refs
> - Full backward compatibility when `configProvider` absent
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Task 1 → Task 5 → Task 8 → Task 10 → Task 12 → F1-F4

---

## Context

### Original Request
Implement "init-only theme resolution" for the Babel plugin, as described in `feature-init-only-theme.md`. When a `configProvider` is specified, style values reference a runtime config object rather than being inlined as build-time literals. The config resolves once during module creation.

### Interview Summary
**Key Discussions**:
- **Config module**: Physical `.generated.tailwind.config.js` file generated to disk next to `tailwind.config.*`
- **Config path structure**: Nested config passed to provider (familiar Tailwind structure: `{ blue: { 500: "#3B82F6" } }`), provider output flattened internally for runtime refs (`__twConfig.theme.colors["blue-500"]`)
- **Parser scope**: All theme-dependent parsers migrated (7 of 9 receive customTheme inputs)
- **Test strategy**: TDD (test-first) with Vitest
- **Dark/light mode**: Included in v1 scope
- **Backward compatibility**: No behavior change when `configProvider` is absent

**Research Findings**:
- Current pipeline: `extractCustomTheme()` → parsers → `StyleObject { prop: literal }` → `styleRegistry` → `injectStylesAtTop()` → AST literals wrapped in `StyleSheet.create()`
- `injectStylesAtTop()` in `styleInjection.ts:481-544` is the SINGLE point where `StyleObject` values become AST nodes
- Only 4 CustomTheme categories are user-configurable: colors, fontFamily, fontSize, spacing
- Built-in scales (borderRadius, fontWeight, shadows, etc.) are hardcoded, NOT theme-derived
- Parsers that receive customTheme inputs: colors, spacing, typography, borders (colors), shadows (colors), sizing (spacing), layout (spacing), transforms (spacing). Parsers with NO customTheme input: outline, aspectRatio
- Computed values (opacity-modified colors, negated spacing) cannot be simple config refs

### Metis Review
**Identified Gaps** (addressed):
- **Architecture approach**: Metis recommended emission-layer approach over IR — modify only `injectStylesAtTop()` and add a class-name-based config ref resolver, keeping parsers and `StyleObject` type completely unchanged. Adopted.
- **Parser scope correction**: Only 7 of 9 parsers receive customTheme inputs. `parseOutline` and `parseAspectRatio` are called without custom theme args. Scoped accordingly.
- **Computed values**: Opacity-modified colors (`bg-blue-500/50`), negated spacing (`-m-4`), degree strings (`rotate-45`), percentage values (`w-1/3`) stay as inlined literals. Only direct theme lookups become config refs.
- **Value collision risk**: Reverse value lookup is unreliable (multiple keys → same value). Resolved by using forward tracking via class-name analysis at registration time.
- **Nested type incompatibility**: `shadowOffset: { width, height }` and `transform: [...]` can't be simple MemberExpressions. These are built-in presets and stay as literals.
- **Dynamic className expressions**: Handled automatically since they flow through the same `injectStylesAtTop()` emission point.

---

## Work Objectives

### Core Objective
Enable one-time runtime theme customization by making the Babel plugin emit `__twConfig` references instead of literal values for theme-derived styles, behind a new `configProvider` option.

### Concrete Deliverables
- `configProvider` option in `PluginOptions` type and plugin initialization
- `resolveConfigRefs()` utility — maps class names to config paths
- `configRefRegistry` in `PluginState` — tracks which style properties have config refs
- Modified `injectStylesAtTop()` — emits `MemberExpression` AST nodes for config-ref properties
- `__twConfig` import injection in `programExit()`
- Config module generator — writes `.generated.tailwind.config.js` to disk
- TDD test coverage for all new code paths
- All existing tests continue to pass

### Definition of Done
- [x] `vitest run` passes with zero failures (existing + new tests)
- [x] `tsc --noEmit` passes with zero type errors
- [x] `eslint src/` passes with zero errors
- [x] Transform output with `configProvider` contains `__twConfig.theme.*` MemberExpressions
- [x] Transform output WITHOUT `configProvider` is identical to current behavior
- [x] Generated config file exists and is importable
- [x] Dark/light mode modifiers work with config refs

### Must Have
- `configProvider: { importFrom: string; importName?: string }` option
- Config refs for all theme-derived values from 4 categories: colors, spacing, fontFamily, fontSize
- Physical `.generated.tailwind.config.js` file with provider invocation
- `__twConfig` import injection into transformed modules
- Backward compatibility: zero changes when `configProvider` absent
- TDD: tests written before implementation for each task

### Must NOT Have (Guardrails)
- **NO changes to `StyleObject` type** in `types/core.ts` — this type is used across 15+ files
- **NO changes to parser return types** — parsers continue returning `StyleObject | null`
- **NO modifications to `dynamicProcessing.ts`** — config refs work through shared emission path
- **NO modifications to modifier processing logic** — modifiers wrap styles regardless of value source
- **NO runtime reactivity** — values resolve once at module init, never change after
- **NO runtime shape validation** — provider contract is documentation-based in v1
- **NO config refs for arbitrary values** — `bg-[#ff0000]`, `p-[16px]` always stay as literals
- **NO config refs for computed values** — opacity-modified colors, negated spacing, percentage strings stay literal
- **NO config refs for built-in scale values** — borderRadius, fontWeight, shadowOffset, lineHeight stay literal
- **NO excessive JSDoc comments or abstraction layers** — follow existing codebase style

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest 4.0.18, colocated tests, snapshot support)
- **Automated tests**: TDD (test-first)
- **Framework**: Vitest
- **Each task**: RED (write failing test) → GREEN (minimal implementation) → REFACTOR

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Babel transforms**: Use `transform()` helper — assert output strings contain/exclude expected patterns
- **File generation**: Use Bash (ls, cat) — verify file exists and contains expected content
- **Type checking**: Use Bash (`npx tsc --noEmit`) — verify no type errors
- **Test suite**: Use Bash (`npx vitest run`) — verify all tests pass

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — 4 parallel tasks):
├── Task 1: Plugin options extension (configProvider in PluginOptions + PluginState) [quick]
├── Task 2: Config ref resolver utility (class name → property → config path) [deep]
├── Task 3: Config module generator (write .generated.tailwind.config.js) [deep]
└── Task 4: Test helper extension (configProvider support in transform()) [quick]

Wave 2 (Core Pipeline — 4 parallel tasks, depends on Wave 1):
├── Task 5: AST emission for config refs (modify injectStylesAtTop) [deep]
├── Task 6: __twConfig import injection (modify programExit) [unspecified-high]
├── Task 7: Config ref registration in className visitor [unspecified-high]
└── Task 8: Config ref registration in tw visitor [quick]

Wave 3 (Integration + Dark Mode — 3 parallel tasks, depends on Wave 2):
├── Task 9: Dark/light mode with config refs [deep]
├── Task 10: End-to-end integration tests (full transform snapshots) [unspecified-high]
└── Task 11: Existing test regression + build verification [quick]

Wave FINAL (Verification — 4 parallel, depends on ALL):
├── Task F1: Plan compliance audit [oracle]
├── Task F2: Code quality review [unspecified-high]
├── Task F3: Real QA [unspecified-high]
└── Task F4: Scope fidelity check [deep]

Critical Path: Task 1 → Task 5 → Task 7 → Task 9 → Task 10 → F1-F4
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 4 (Waves 1, 2, FINAL)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | — | 5, 6, 7, 8 |
| 2 | — | 7, 8 |
| 3 | — | 6, 10 |
| 4 | — | 5, 7, 8, 9, 10 |
| 5 | 1, 4 | 7, 8, 9, 10 |
| 6 | 1, 3 | 9, 10 |
| 7 | 1, 2, 4, 5 | 9, 10 |
| 8 | 1, 2, 4, 5 | 10 |
| 9 | 5, 6, 7 | 10 |
| 10 | ALL 1-9 | 11, F1-F4 |
| 11 | 10 | F1-F4 |
| F1-F4 | ALL | — |

### Agent Dispatch Summary

- **Wave 1**: **4** — T1 → `quick`, T2 → `deep`, T3 → `deep`, T4 → `quick`
- **Wave 2**: **4** — T5 → `deep`, T6 → `unspecified-high`, T7 → `unspecified-high`, T8 → `quick`
- **Wave 3**: **3** — T9 → `deep`, T10 → `unspecified-high`, T11 → `quick`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.
> **TDD: Each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR.**

- [x] 1. Plugin Options Extension — Add `configProvider` to PluginOptions and PluginState

  **What to do**:
  - RED: Write test in `src/babel/config-loader.test.ts` that verifies `configProvider` option is accepted without errors and stored in state. Write test that invalid `configProvider` (missing `importFrom`) produces a warning.
  - GREEN: Extend `PluginOptions` type in `src/babel/plugin/state.ts` with `configProvider?: { importFrom: string; importName?: string }`. Add to `PluginState`: `configProviderEnabled: boolean`, `configProviderImportFrom: string`, `configProviderImportName: string`, `configRefRegistry: Map<string, Map<string, string[]>>`, `generatedConfigPath: string`. Initialize these in `createInitialState()`. In `src/babel/plugin.ts`, extract and normalize `configProvider` options (default `importName` to `"provideConfig"`). Emit build-time warning for missing `importFrom`.
  - REFACTOR: Ensure code follows existing option normalization patterns (see `colorScheme` option pattern).

  **Must NOT do**:
  - Do NOT change `StyleObject` type or parser return types
  - Do NOT change any existing option parsing behavior

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small, well-scoped type extension and option plumbing
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `git-master`: No git operations needed during implementation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4)
  - **Blocks**: Tasks 5, 6, 7, 8
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `src/babel/plugin/state.ts:16-85` — `PluginOptions` type definition. Follow exact same pattern as `colorScheme` option (lines 50-84) for adding `configProvider`.
  - `src/babel/plugin/state.ts:90-124` — `PluginState` type definition. Add new fields following the same pattern as `colorSchemeImportSource` (line 99) and `colorSchemeHookName` (line 100).
  - `src/babel/plugin/state.ts:139-185` — `createInitialState()` function. Add initialization of new fields following existing pattern.
  - `src/babel/plugin.ts:21-34` — Plugin factory. Extract and normalize configProvider options here, same as `colorScheme` normalization at lines 26-28.

  **API/Type References**:
  - `src/types/config.ts` — Existing config type patterns.
  - `src/babel/config-loader.ts:12-27` — `TailwindConfig` type for reference on config shape.

  **Test References**:
  - `src/babel/config-loader.test.ts` — Existing config loader tests. Add new describe block for configProvider option validation.

  **WHY Each Reference Matters**:
  - `state.ts:16-85`: The `colorScheme` option at lines 50-84 is the EXACT structural template. `configProvider` follows identical pattern: optional nested object with `importFrom` and `importName`.
  - `state.ts:139-185`: `createInitialState` must initialize all new state fields with sensible defaults (false, empty string, empty Map).
  - `plugin.ts:21-34`: Option extraction happens here at plugin factory level, not inside visitors.

  **Acceptance Criteria**:
  - [ ] `vitest run src/babel/config-loader.test.ts` → new configProvider tests PASS
  - [ ] `tsc --noEmit` → 0 type errors
  - [ ] Plugin accepts `{ configProvider: { importFrom: './my-provider' } }` without error
  - [ ] Plugin accepts `{ configProvider: { importFrom: './my-provider', importName: 'myProvider' } }` without error
  - [ ] Missing `importFrom` produces warning containing `configProvider`
  - [ ] Absent `configProvider` option → all new state fields at default values

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: configProvider option accepted and stored in state
    Tool: Bash (vitest)
    Preconditions: Test file with configProvider option tests exists
    Steps:
      1. Run `npx vitest run src/babel/config-loader.test.ts`
      2. Assert exit code 0
      3. Assert output contains "configProvider" describe block passing
    Expected Result: All new tests pass alongside existing tests
    Failure Indicators: Non-zero exit code, "FAIL" in output
    Evidence: .sisyphus/evidence/task-1-option-accepted.txt

  Scenario: Backward compatibility — no configProvider
    Tool: Bash (vitest)
    Preconditions: None
    Steps:
      1. Run `npx vitest run` (full test suite)
      2. Assert exit code 0
      3. Assert no new failures compared to baseline
    Expected Result: ALL existing tests pass unchanged
    Failure Indicators: Any test that passed before now fails
    Evidence: .sisyphus/evidence/task-1-backward-compat.txt
  ```

  **Commit**: YES
  - Message: `feat(babel): add configProvider plugin option and state`
  - Files: `src/babel/plugin/state.ts`, `src/babel/plugin.ts`, `src/babel/config-loader.test.ts`
  - Pre-commit: `npx vitest run`

- [x] 2. Config Ref Resolver Utility — Map class names to config paths

  **What to do**:
  - RED: Create `src/babel/utils/configRefResolver.test.ts`. Write tests: `resolveConfigRefs("bg-blue-500", fullTheme)` returns `Map { "backgroundColor" → ["theme", "colors", "blue-500"] }`. Test `resolveConfigRefs("p-4", fullTheme)` returns `Map { "padding" → ["theme", "spacing", "4"] }`. Test `resolveConfigRefs("bg-[#ff0000]", fullTheme)` returns empty map (arbitrary value). Test `resolveConfigRefs("bg-blue-500/50", fullTheme)` returns empty map (computed value). Test `resolveConfigRefs("text-xl", fullTheme)` returns `Map { "fontSize" → ["theme", "fontSize", "xl"] }`. Test multi-class: `resolveConfigRefs("bg-blue-500 p-4", fullTheme)` returns both refs.
  - GREEN: Create `src/babel/utils/configRefResolver.ts`. Implement `resolveConfigRefs(className: string, fullTheme: FullResolvedTheme): Map<string, string[]>`. The function splits class names and recognizes patterns: `bg-X` → `colors["X"]`, `text-X` → `colors["X"]` (when X is a valid color key), `border-X` → `colors["X"]`, `p-X`/`m-X`/`gap-X` → `spacing["X"]`, `w-X`/`h-X` → `spacing["X"]` (when X is a spacing key), `text-X` → `fontSize["X"]` (when X is a fontSize key), `font-X` → `fontFamily["X"]` (when X is a fontFamily key). Also define `FullResolvedTheme` type that includes ALL known values (built-in defaults merged with custom theme) for each category. Skip: arbitrary values (`[...]`), opacity-modified colors (`X/N`), negated values (`-m-X`), non-theme values.
  - REFACTOR: Ensure function is pure with no side effects. Add JSDoc.

  **Must NOT do**:
  - Do NOT import or depend on any parser module — this is a standalone utility
  - Do NOT change any parser return types or interfaces
  - Do NOT handle built-in-only scales (borderRadius, fontWeight, etc.)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Requires understanding of all Tailwind class naming patterns and their property mappings. Needs to handle many class prefixes correctly.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4)
  - **Blocks**: Tasks 7, 8
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `src/parser/colors.ts:80-136` — Color class prefix patterns: `bg-` (line 80), `text-` (line 94), `border-` (line 107), `outline-` (line 120), directional `border-t-`/`border-r-`/etc. (line 139). Shows how class prefixes map to style properties.
  - `src/parser/spacing.ts:77-150` — Spacing class patterns: `m-`/`mx-`/`my-`/`mt-`/etc. (line 92), `p-`/`px-`/etc. (line 114), `gap-` (line 132). Shows direction → property mapping.
  - `src/parser/typography.ts` — Typography patterns: `text-X` for fontSize, `font-X` for fontFamily. Disambiguation between color and fontSize for `text-` prefix.
  - `src/parser/sizing.ts` — Sizing patterns: `w-X`/`h-X`/`min-w-X`/`max-w-X` using spacing values.
  - `src/parser/layout.ts` — Layout patterns: `gap-x-X`/`gap-y-X` using spacing.
  - `src/parser/transforms.ts` — Transform patterns: `translate-x-X`/`translate-y-X` using spacing.

  **API/Type References**:
  - `src/utils/colorUtils.ts:46-` — `COLORS` constant — the complete built-in color palette. Needed to build `FullResolvedTheme.colors`.
  - `src/parser/spacing.ts:8-44` — `SPACING_SCALE` constant — the complete built-in spacing scale. Needed for `FullResolvedTheme.spacing`.
  - `src/babel/config-loader.ts:146-151` — `CustomTheme` type — the user-configurable theme portion.

  **WHY Each Reference Matters**:
  - `colors.ts:80-136`: The resolver must recognize the EXACT same prefix patterns as the parser (bg-, text-, border-, outline-). If patterns drift, refs will be wrong.
  - `spacing.ts:77-150`: The resolver must understand directional suffixes (mx → marginHorizontal, pt → paddingTop). It needs the same direction → property mapping as the parser.
  - `COLORS` and `SPACING_SCALE`: The resolver needs to check if a lookup key EXISTS in the known values. If `bg-foobar` doesn't match any known color, it should NOT produce a config ref.

  **Acceptance Criteria**:
  - [ ] `vitest run src/babel/utils/configRefResolver.test.ts` → PASS
  - [ ] Single color class: `bg-blue-500` → `{ "backgroundColor": ["theme", "colors", "blue-500"] }`
  - [ ] Single spacing class: `p-4` → `{ "padding": ["theme", "spacing", "4"] }`
  - [ ] Typography: `text-xl` → `{ "fontSize": ["theme", "fontSize", "xl"] }`
  - [ ] Font family: `font-sans` → `{ "fontFamily": ["theme", "fontFamily", "sans"] }`
  - [ ] Arbitrary value: `bg-[#ff0000]` → empty map
  - [ ] Opacity-modified: `bg-blue-500/50` → empty map
  - [ ] Negated: `-m-4` → empty map
  - [ ] Multi-class: `bg-blue-500 p-4` → both refs present
  - [ ] Unknown class: `bg-nonexistent` → empty map (key not in known values)
  - [ ] Custom theme color: `bg-primary` (when `primary` in customTheme.colors) → ref present

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Config ref resolver produces correct mappings
    Tool: Bash (vitest)
    Preconditions: configRefResolver.test.ts exists with comprehensive tests
    Steps:
      1. Run `npx vitest run src/babel/utils/configRefResolver.test.ts`
      2. Assert exit code 0
    Expected Result: All resolver tests pass
    Failure Indicators: Non-zero exit code, failed assertion
    Evidence: .sisyphus/evidence/task-2-resolver-tests.txt

  Scenario: Resolver agrees with parser for representative classes
    Tool: Bash (vitest)
    Preconditions: Cross-validation tests comparing resolver output properties with parser output properties
    Steps:
      1. For classes ["bg-blue-500", "p-4", "text-xl", "font-sans", "w-8", "gap-2", "border-red-500"], run both parseClass and resolveConfigRefs
      2. Assert resolver's property keys match parser's output property keys
    Expected Result: Perfect agreement on property names for all theme-derived classes
    Failure Indicators: Property mismatch between resolver and parser
    Evidence: .sisyphus/evidence/task-2-resolver-parser-agreement.txt
  ```

  **Commit**: YES
  - Message: `feat(babel): add config ref resolver utility`
  - Files: `src/babel/utils/configRefResolver.ts`, `src/babel/utils/configRefResolver.test.ts`
  - Pre-commit: `npx vitest run src/babel/utils/configRefResolver.test.ts`

- [x] 3. Config Module Generator — Write `.generated.tailwind.config.js` to disk

  **What to do**:
  - RED: Create `src/babel/utils/configModuleGenerator.test.ts`. Write tests: `generateConfigModule(fullTheme, providerOptions)` returns string containing `import { provideConfig } from './my-provider'`. Test output contains `const originalConfig = { theme: { colors: { blue: { 500:` — nested Tailwind-familiar structure. Test output contains a `_flattenColors` helper function. Test output contains `export const __twConfig` with flattened output: `colors: _flattenColors(_provided.theme.colors)`. Test `writeConfigModule(outputPath, content)` writes file to disk. Test custom `importName` appears in output. Test that spacing/fontFamily/fontSize are passed through without flattening (only colors need flattening).
  - GREEN: Create `src/babel/utils/configModuleGenerator.ts`. Implement `generateConfigModule(fullTheme: FullResolvedTheme, providerImportFrom: string, providerImportName: string): string` — generates the JS source as a string. Implement `writeConfigModule(outputPath: string, content: string): void` — writes the file to disk (idempotent: only writes if content changed). Implement `getConfigModulePath(tailwindConfigPath: string): string` — returns path for generated file (same dir as tailwind.config, named `.generated.tailwind.config.js`). The generated module structure:
    ```js
    import { provideConfig } from '<importFrom>';
    const originalConfig = {
      theme: {
        colors: { gray: { 100: "#F3F4F6", 200: "#E5E7EB" }, blue: { 500: "#3B82F6" }, ... },  // NESTED Tailwind structure
        spacing: { 0: 0, 1: 4, 4: 16, ... },
        fontFamily: { sans: "System", ... },
        fontSize: { xs: 12, xl: 20, ... },
      },
    };
    const _provided = provideConfig(originalConfig);
    function _flattenColors(colors, prefix = "") {
      const result = {};
      for (const [key, value] of Object.entries(colors)) {
        if (typeof value === "object" && value !== null) {
          Object.assign(result, _flattenColors(value, prefix ? `${prefix}-${key}` : key));
        } else {
          result[prefix ? `${prefix}-${key}` : key] = value;
        }
      }
      return result;
    }
    export const __twConfig = {
      theme: {
        colors: _flattenColors(_provided.theme.colors),
        spacing: _provided.theme.spacing,
        fontFamily: _provided.theme.fontFamily,
        fontSize: _provided.theme.fontSize,
      },
    };
    ```
  - REFACTOR: Add .gitignore recommendation for `.generated.tailwind.config.js`.

  **Must NOT do**:
  - Do NOT include built-in-only scales (borderRadius, fontWeight, lineHeight) in generated config
  - Do NOT flatten the `originalConfig` — it MUST use nested Tailwind-familiar structure so the provider receives intuitive input
  - Do NOT add runtime validation of provider return shape
  - Do NOT flatten spacing/fontFamily/fontSize — only colors need the `_flattenColors` helper (spacing already uses flat keys like `"4"`, fontFamily uses flat keys like `"sans"`)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Needs careful string generation for a valid JS module with nested→flat conversion, correct import paths, and file I/O handling
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4)
  - **Blocks**: Tasks 6, 10
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `src/babel/config-loader.ts:86-108` — `findTailwindConfig(startDir)` — locates tailwind.config.* by traversing up. Use this to determine where to place the generated file.
  - `src/babel/config-loader.ts:157-279` — `extractCustomTheme(filename)` — shows how theme values are extracted. Study the nested→flat transformation it performs so the generator can produce the REVERSE: nested `originalConfig` from flat resolved values.

  **API/Type References**:
  - `src/utils/colorUtils.ts` — `COLORS` constant — all built-in color values. These need to be UN-FLATTENED back to nested structure for `originalConfig`.
  - `src/parser/spacing.ts:8-44` — `SPACING_SCALE` — all built-in spacing values (already flat, no nesting needed).
  - `src/babel/config-loader.ts:146-151` — `CustomTheme` type — custom overrides merged with defaults.

  **External References**:
  - Feature proposal: `feature-init-only-theme.md:72-104` — Example of generated config module structure.

  **WHY Each Reference Matters**:
  - `findTailwindConfig`: Generated file goes in the same directory. We compute the output path from the config path.
  - `extractCustomTheme`: Study its flattening logic to understand how to REVERSE it — `originalConfig` needs nested `{ blue: { 500: "#3B82F6" } }` instead of flat `{ "blue-500": "#3B82F6" }`.
  - `COLORS`: The color constant uses flat keys (`"blue-500"`). The generator must un-flatten these into nested Tailwind structure for `originalConfig`.
  - `SPACING_SCALE`: Already uses flat keys (`"4": 16`). No un-flattening needed — pass through directly.

  **Acceptance Criteria**:
  - [ ] `vitest run src/babel/utils/configModuleGenerator.test.ts` → PASS
  - [ ] Generated content contains `import { provideConfig } from './my-provider'`
  - [ ] Generated `originalConfig` uses NESTED color structure: `blue: { 500: "#3B82F6" }` (not flat `"blue-500"`)
  - [ ] Generated content contains `_flattenColors` helper function
  - [ ] Generated `__twConfig` exports flattened colors: `colors: _flattenColors(_provided.theme.colors)`
  - [ ] Spacing/fontFamily/fontSize are passed through directly (no flattening needed)
  - [ ] Custom theme colors override defaults in generated config (merged into nested structure)
  - [ ] Custom `importName` option is reflected in import statement
  - [ ] `writeConfigModule` writes file only when content changes (idempotent)

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Generated config module has correct nested structure
    Tool: Bash (vitest)
    Preconditions: configModuleGenerator.test.ts exists
    Steps:
      1. Run `npx vitest run src/babel/utils/configModuleGenerator.test.ts`
      2. Assert exit code 0
      3. Verify test assertions include: originalConfig has nested colors (blue.500, not "blue-500")
    Expected Result: All generator tests pass, nested structure verified
    Failure Indicators: Non-zero exit code, flat color keys in originalConfig
    Evidence: .sisyphus/evidence/task-3-generator-tests.txt

  Scenario: Generated file is valid JavaScript with _flattenColors
    Tool: Bash (node --check)
    Preconditions: A test that writes the generated file to a temp dir
    Steps:
      1. Generate config module content with test theme values
      2. Write to temp file
      3. Run `node --check <tempfile>` to verify syntax
      4. Verify the generated source contains `function _flattenColors`
    Expected Result: Exit code 0 (valid JS syntax) AND _flattenColors present
    Failure Indicators: SyntaxError in output, missing _flattenColors helper
    Evidence: .sisyphus/evidence/task-3-valid-js.txt

  Scenario: Provider receives nested config, runtime gets flat config
    Tool: Bash (node -e)
    Preconditions: Generated config module written to temp dir with a mock provider
    Steps:
      1. Create a mock provider that asserts `config.theme.colors.blue.500` exists (nested)
      2. Generate and write the config module
      3. Run `node -e "const c = require('./temp-config'); console.log(JSON.stringify(c.__twConfig))"` 
      4. Assert `__twConfig.theme.colors["blue-500"]` exists (flat) in output
    Expected Result: Provider gets nested structure, __twConfig exports flat keys
    Failure Indicators: Provider gets flat keys OR __twConfig exports nested keys
    Evidence: .sisyphus/evidence/task-3-nested-to-flat.txt
  ```

  **Commit**: YES
  - Message: `feat(babel): add config module generator with nested config → flat output`
  - Files: `src/babel/utils/configModuleGenerator.ts`, `src/babel/utils/configModuleGenerator.test.ts`
  - Pre-commit: `npx vitest run src/babel/utils/configModuleGenerator.test.ts`

- [x] 4. Test Helper Extension — Add configProvider support to transform()

  **What to do**:
  - RED: In existing test helper tests (or in the transform helper itself), verify that `transform(code, { configProvider: { importFrom: './my-provider' } }, true)` does not throw and produces output.
  - GREEN: The `transform()` helper in `test/helpers/babelTransform.ts` already passes `options` through to the plugin. Verify this works with `configProvider` option. If needed, add a convenience wrapper `transformWithConfig(code: string, configProviderImportFrom: string, options?: PluginOptions): string` that pre-fills the configProvider option.
  - REFACTOR: Add JSDoc and usage examples.

  **Must NOT do**:
  - Do NOT change the existing `transform()` function signature
  - Do NOT break any existing test that uses `transform()`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Minimal change — likely just adding a convenience wrapper
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3)
  - **Blocks**: Tasks 5, 7, 8, 9, 10
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `test/helpers/babelTransform.ts:1-25` — Current `transform()` helper. Options are passed directly to `babelPlugin`. `configProvider` option should flow through automatically.

  **Test References**:
  - `src/babel/plugin/visitors/className.test.ts:1-20` — How existing tests import and use `transform()`. New tests will follow same pattern.

  **WHY Each Reference Matters**:
  - `babelTransform.ts:1-25`: The helper already accepts `PluginOptions`. We need to verify (and possibly extend) that `configProvider` works through this path.

  **Acceptance Criteria**:
  - [ ] `transform(code, { configProvider: { importFrom: './p' } }, true)` produces non-empty output
  - [ ] Existing `transform(code, undefined, true)` still works identically
  - [ ] If wrapper added: `transformWithConfig(code, './p')` is equivalent to passing full options

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Transform helper works with configProvider
    Tool: Bash (vitest)
    Preconditions: Task 1 complete (configProvider option accepted)
    Steps:
      1. Create a minimal test that calls `transform('<View className="m-4" />', { configProvider: { importFrom: './p' } }, true)`
      2. Assert output is a non-empty string
      3. Assert output does not contain error text
    Expected Result: Transform produces valid output with configProvider option
    Failure Indicators: Empty string, thrown error
    Evidence: .sisyphus/evidence/task-4-helper-works.txt

  Scenario: Backward compatibility of transform helper
    Tool: Bash (vitest)
    Preconditions: None
    Steps:
      1. Run `npx vitest run` (full suite)
      2. Assert all existing tests still pass
    Expected Result: Zero regressions
    Failure Indicators: Any previously-passing test now fails
    Evidence: .sisyphus/evidence/task-4-backward-compat.txt
  ```

  **Commit**: YES (groups with Task 1)
  - Message: `test(babel): extend transform helper for configProvider`
  - Files: `test/helpers/babelTransform.ts`
  - Pre-commit: `npx vitest run`

- [x] 5. AST Emission for Config Refs — Modify `injectStylesAtTop()` to emit MemberExpressions

  **What to do**:
  - RED: Write tests in new file `src/babel/utils/styleInjection.configRef.test.ts`. Test that when `configRefRegistry` has a ref for a property, `injectStylesAtTop()` generates `__twConfig.theme.colors["blue-500"]` instead of `"#3B82F6"` in the output. Test that properties WITHOUT refs still emit literals. Test that mixed styles (some refs, some literals) produce correct output.
  - GREEN: Modify `injectStylesAtTop()` in `src/babel/utils/styleInjection.ts`. Add a new parameter `configRefRegistry?: Map<string, Map<string, string[]>>` and `configIdentifier?: string` (default `"__twConfig"`). In the property iteration loop (lines 491-501), before creating a literal node, check if the current `[key, styleProp]` has a ref in the registry. If yes, generate a `MemberExpression` chain: `t.memberExpression(t.identifier("__twConfig"), t.identifier("theme"))` → `t.memberExpression(prev, t.identifier(category))` → `t.memberExpression(prev, t.stringLiteral(key), true)` (computed for keys with dashes). If no ref, emit literal as before.
  - REFACTOR: Extract the MemberExpression chain builder into a helper function `buildConfigRefExpression(path: string[], t): BabelTypes.MemberExpression`.

  **Must NOT do**:
  - Do NOT change the function signature in a breaking way — new params must be optional
  - Do NOT handle nested types (ShadowOffsetStyle, TransformStyle[]) as config refs — they stay as `t.valueToNode()`
  - Do NOT modify `StyleObject` type

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core AST manipulation. Requires understanding of Babel types API (MemberExpression, computed property access) and careful handling of the existing emission logic.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8)
  - **Blocks**: Tasks 7, 8, 9, 10
  - **Blocked By**: Tasks 1, 4

  **References**:

  **Pattern References**:
  - `src/babel/utils/styleInjection.ts:481-544` — `injectStylesAtTop()` function. THIS IS THE FUNCTION TO MODIFY. Lines 491-501 are the value-to-AST-node conversion: `typeof value === 'number'` → `numericLiteral`, `typeof value === 'string'` → `stringLiteral`, else `valueToNode`. Add config-ref check BEFORE these branches.
  - `src/babel/utils/colorSchemeModifierProcessing.ts:92` — Existing MemberExpression generation pattern: `t.memberExpression(t.identifier(objectName), t.identifier(propName))`. Follow this pattern for `__twConfig.theme.X`.
  - `src/babel/utils/windowDimensionsProcessing.ts` — Existing pattern for generating `_twDimensions.width` MemberExpression. Similar chaining approach.

  **API/Type References**:
  - `@babel/types` MemberExpression API: `t.memberExpression(object, property, computed?)`. For keys with dashes like `"blue-500"`, use computed access: `t.memberExpression(obj, t.stringLiteral("blue-500"), true)`.

  **WHY Each Reference Matters**:
  - `styleInjection.ts:481-544`: This is the ONLY place values become AST nodes. The entire config-ref feature hinges on modifying this single function.
  - `colorSchemeModifierProcessing.ts:92`: Proves MemberExpression generation is an established pattern in this codebase. Follow exact style.

  **Acceptance Criteria**:
  - [ ] `vitest run src/babel/utils/styleInjection.configRef.test.ts` → PASS
  - [ ] Config-ref property emits `__twConfig.theme.colors["blue-500"]` (MemberExpression chain)
  - [ ] Non-ref property emits literal (`"#3B82F6"` or `16`) as before
  - [ ] Mixed style object: some properties refs, some literals — both correct
  - [ ] Nested types (shadowOffset, transform) always emit via `t.valueToNode()` even if ref exists
  - [ ] `tsc --noEmit` → 0 errors

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Config ref emission produces MemberExpression AST
    Tool: Bash (vitest)
    Preconditions: styleInjection.configRef.test.ts exists
    Steps:
      1. Run `npx vitest run src/babel/utils/styleInjection.configRef.test.ts`
      2. Assert exit code 0
    Expected Result: All AST emission tests pass
    Failure Indicators: Wrong AST node type, literal emitted instead of MemberExpression
    Evidence: .sisyphus/evidence/task-5-emission-tests.txt

  Scenario: Existing style injection unchanged when no refs
    Tool: Bash (vitest)
    Preconditions: None
    Steps:
      1. Run `npx vitest run` (full suite)
      2. Assert zero regressions
    Expected Result: All existing tests pass
    Failure Indicators: Any existing test fails
    Evidence: .sisyphus/evidence/task-5-no-regression.txt
  ```

  **Commit**: YES
  - Message: `feat(babel): emit config refs in StyleSheet.create`
  - Files: `src/babel/utils/styleInjection.ts`, `src/babel/utils/styleInjection.configRef.test.ts`
  - Pre-commit: `npx vitest run`

- [x] 6. __twConfig Import Injection — Inject import statement in programExit()

  **What to do**:
  - RED: Add tests in `src/babel/plugin/visitors/program.test.ts`. Test that when `configProviderEnabled` is true AND `configRefRegistry` has entries, `programExit()` adds `import { __twConfig } from '<generated-config-path>'` to the program body. Test that import is NOT added when configProvider is disabled. Test that import is NOT added when configRefRegistry is empty (no theme-derived values used). Test that import merges correctly when other imports exist.
  - GREEN: In `src/babel/plugin/visitors/program.ts`, add a new step in `programExit()` (after style injection, before return): if `state.configProviderEnabled && state.configRefRegistry.size > 0`, call a new function `addConfigImport(path, state.generatedConfigPath, t)`. Create this function in `styleInjection.ts` following the exact pattern of `addStyleSheetImport()` — but importing `__twConfig` from the generated config module path. Compute relative import path from current file to generated config using `path.relative(dirname(state.file.opts.filename), state.generatedConfigPath)`.
  - REFACTOR: Ensure import path uses posix separators for consistency.

  **Must NOT do**:
  - Do NOT inject import when configProvider is disabled
  - Do NOT inject import when no config refs were actually used
  - Do NOT change order of existing import/injection steps in programExit()

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Moderate complexity — path computation + AST import injection. Follows established pattern closely.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 7, 8)
  - **Blocks**: Tasks 9, 10
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - `src/babel/utils/styleInjection.ts:12-57` — `addStyleSheetImport()` — EXACT pattern to follow. Checks for existing import, adds specifier or creates new import declaration.
  - `src/babel/plugin/visitors/program.ts:34-116` — `programExit()` — where the new import injection call goes. Add after line 114 (style injection) and before the closing brace.

  **API/Type References**:
  - Node.js `path.relative()` and `path.dirname()` — for computing relative import path from source file to generated config.

  **WHY Each Reference Matters**:
  - `addStyleSheetImport()`: This is the battle-tested import injection pattern. The `addConfigImport` function should be structurally identical, just importing `__twConfig` from a different source.
  - `programExit()`: The injection order matters. Config import should be added last to avoid interfering with other import logic.

  **Acceptance Criteria**:
  - [ ] `vitest run src/babel/plugin/visitors/program.test.ts` → new tests PASS
  - [ ] Transform with configProvider: output contains `import { __twConfig }`
  - [ ] Transform WITHOUT configProvider: output does NOT contain `__twConfig`
  - [ ] Import path is correct relative path from source to generated config
  - [ ] No import added when no config refs used (e.g., all arbitrary values)

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: __twConfig import injected when configProvider enabled
    Tool: Bash (vitest)
    Preconditions: program.test.ts has new configProvider tests
    Steps:
      1. Run `npx vitest run src/babel/plugin/visitors/program.test.ts`
      2. Assert exit code 0
    Expected Result: Import injection tests pass
    Failure Indicators: Missing import in output, wrong import path
    Evidence: .sisyphus/evidence/task-6-import-injection.txt

  Scenario: No import when configProvider absent
    Tool: Bash (vitest)
    Preconditions: None
    Steps:
      1. Run transform without configProvider option
      2. Assert output does NOT contain "__twConfig"
    Expected Result: Zero mentions of __twConfig in output
    Failure Indicators: __twConfig appears in output without configProvider
    Evidence: .sisyphus/evidence/task-6-no-import-without-config.txt
  ```

  **Commit**: YES
  - Message: `feat(babel): inject __twConfig import when configProvider enabled`
  - Files: `src/babel/utils/styleInjection.ts`, `src/babel/plugin/visitors/program.ts`, `src/babel/plugin/visitors/program.test.ts`
  - Pre-commit: `npx vitest run`

- [x] 7. Config Ref Registration in className Visitor

  **What to do**:
  - RED: Add tests in `src/babel/plugin/visitors/className.test.ts`. Test that when configProvider is enabled, `transform('<View className="bg-blue-500 p-4" />', { configProvider: { importFrom: './p' } }, true)` output contains `__twConfig.theme.colors["blue-500"]` instead of `"#3B82F6"` and `__twConfig.theme.spacing["4"]` instead of `16`. Test that arbitrary values `bg-[#ff0000]` stay as literals. Test that opacity-modified `bg-blue-500/50` stays as literal. Test multi-class with mixed refs and literals.
  - GREEN: In `src/babel/plugin/visitors/className.ts`, at every site where `state.styleRegistry.set(styleKey, styleObject)` is called, add: if `state.configProviderEnabled`, call `resolveConfigRefs(originalClassName, state.fullResolvedTheme)` and store result in `state.configRefRegistry.set(styleKey, refs)`. Also in `createInitialState()` (already done in Task 1), build `fullResolvedTheme` by merging built-in defaults (COLORS, SPACING_SCALE, FONT_SIZE_MAP, FONT_FAMILY) with `customTheme` overrides. Pass `configRefRegistry` to `injectStylesAtTop()` call in `programExit()`.
  - REFACTOR: Extract the "register style + refs" pattern into a helper to avoid duplication across multiple registration sites.

  **Must NOT do**:
  - Do NOT change parser calls or parser return types
  - Do NOT change modifier processing logic
  - Do NOT change dynamic expression processing

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Touches the largest visitor file (671 lines). Must identify ALL `styleRegistry.set()` call sites and add ref registration at each without breaking existing behavior.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 8)
  - **Blocks**: Tasks 9, 10
  - **Blocked By**: Tasks 1, 2, 4, 5

  **References**:

  **Pattern References**:
  - `src/babel/plugin/visitors/className.ts` — Search for ALL occurrences of `state.styleRegistry.set(`. Each one needs a parallel `state.configRefRegistry.set()` call when configProvider is enabled.
  - `src/babel/utils/modifierProcessing.ts` — `processStaticClassNameWithModifiers()` — also registers styles in the registry. Check if refs need to be registered here too.
  - `src/babel/utils/colorSchemeModifierProcessing.ts` — Also registers modifier styles. Refs needed here for dark/light mode support.
  - `src/babel/utils/platformModifierProcessing.ts` — Also registers styles. May need ref registration.
  - `src/babel/utils/directionalModifierProcessing.ts` — Also registers styles.

  **API/Type References**:
  - `src/babel/utils/configRefResolver.ts` — The `resolveConfigRefs()` function from Task 2.
  - `src/babel/plugin/state.ts` — `configRefRegistry` field from Task 1.

  **WHY Each Reference Matters**:
  - `className.ts styleRegistry.set()`: Every style registration site is a potential config-ref registration site. Missing one means that style group won't get refs.
  - `modifierProcessing.ts`: State modifier styles (active:bg-blue-500) also go through styleRegistry. They need refs too for full coverage.
  - `colorSchemeModifierProcessing.ts`: Dark/light mode styles are critical — these are explicitly in scope for v1.

  **Acceptance Criteria**:
  - [ ] `vitest run src/babel/plugin/visitors/className.test.ts` → new configProvider tests PASS
  - [ ] `bg-blue-500` with configProvider → output contains `__twConfig.theme.colors["blue-500"]`
  - [ ] `p-4` with configProvider → output contains `__twConfig.theme.spacing["4"]`
  - [ ] `bg-[#ff0000]` with configProvider → output contains `"#ff0000"` (literal, NOT ref)
  - [ ] `bg-blue-500/50` with configProvider → output contains literal (NOT ref)
  - [ ] `rounded-lg` with configProvider → output contains `8` (literal, NOT ref — built-in scale)
  - [ ] ALL existing className tests still pass

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Full className transform with configProvider
    Tool: Bash (vitest)
    Preconditions: Tasks 1-5 complete
    Steps:
      1. Run `npx vitest run src/babel/plugin/visitors/className.test.ts`
      2. Assert exit code 0
      3. Check output contains new configProvider test suite passing
    Expected Result: Config ref values appear in transform output for theme-derived classes
    Failure Indicators: Literals appear where refs expected, or refs appear where literals expected
    Evidence: .sisyphus/evidence/task-7-classname-config-refs.txt

  Scenario: Existing className tests unchanged
    Tool: Bash (vitest)
    Preconditions: None
    Steps:
      1. Run existing className tests (without configProvider)
      2. Assert identical pass count to before changes
    Expected Result: Zero regressions in existing test suite
    Failure Indicators: Any existing test fails
    Evidence: .sisyphus/evidence/task-7-classname-no-regression.txt
  ```

  **Commit**: YES
  - Message: `feat(babel): register config refs in className visitor`
  - Files: `src/babel/plugin/visitors/className.ts`, `src/babel/plugin/visitors/className.test.ts`, `src/babel/plugin/visitors/program.ts`
  - Pre-commit: `npx vitest run`

- [x] 8. Config Ref Registration in tw Visitor

  **What to do**:
  - RED: Add tests in `src/babel/plugin/visitors/tw.test.ts`. Test that `tw\`bg-blue-500 p-4\`` with configProvider produces output containing `__twConfig.theme.colors["blue-500"]` and `__twConfig.theme.spacing["4"]`. Test that `twStyle("bg-blue-500")` also produces config refs.
  - GREEN: In `src/babel/plugin/visitors/tw.ts`, at every `state.styleRegistry.set()` call site, add config ref registration (same pattern as Task 7). Import `resolveConfigRefs` and call it with the class name string and `state.fullResolvedTheme`.
  - REFACTOR: If the "register style + refs" helper from Task 7 exists, reuse it here.

  **Must NOT do**:
  - Do NOT change how tw`` or twStyle() expressions are parsed
  - Do NOT change the existing style registration logic

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Follows exact same pattern as Task 7 but in a smaller file. Mechanical application of the same ref registration at styleRegistry.set() call sites.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7)
  - **Blocks**: Tasks 10
  - **Blocked By**: Tasks 1, 2, 4, 5

  **References**:

  **Pattern References**:
  - `src/babel/plugin/visitors/tw.ts` — Search for `state.styleRegistry.set(` occurrences. Apply same ref registration pattern as Task 7.
  - Task 7 implementation — Follow the exact same pattern for ref registration.

  **Acceptance Criteria**:
  - [ ] `vitest run src/babel/plugin/visitors/tw.test.ts` → new configProvider tests PASS
  - [ ] `tw\`bg-blue-500\`` with configProvider → output contains `__twConfig.theme.colors["blue-500"]`
  - [ ] ALL existing tw tests still pass

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: tw template with configProvider
    Tool: Bash (vitest)
    Preconditions: Tasks 1-5, 7 complete
    Steps:
      1. Run `npx vitest run src/babel/plugin/visitors/tw.test.ts`
      2. Assert exit code 0
    Expected Result: Config refs appear in tw transform output
    Failure Indicators: Literals where refs expected
    Evidence: .sisyphus/evidence/task-8-tw-config-refs.txt
  ```

  **Commit**: YES (groups with Task 7)
  - Message: `feat(babel): register config refs in tw visitor`
  - Files: `src/babel/plugin/visitors/tw.ts`, `src/babel/plugin/visitors/tw.test.ts`
  - Pre-commit: `npx vitest run`


- [x] 9. Dark/Light Mode with Config Refs

  **What to do**:
  - RED: Add tests in `src/babel/plugin/visitors/className.test.ts`. Test that `className="bg-white dark:bg-gray-900"` with configProvider produces output where BOTH the base style `bg-white` AND the dark modifier style `bg-gray-900` use config refs (`__twConfig.theme.colors["white"]` and `__twConfig.theme.colors["gray-900"]`). Test that the conditional expression structure (`_twColorScheme === 'dark' && ...`) is preserved. Test that `scheme:bg-primary` with configProvider correctly expands and uses refs.
  - GREEN: Verify that dark/light mode works with config refs. The modifier processing in `colorSchemeModifierProcessing.ts` registers modifier styles in `styleRegistry`. Since Task 7 adds ref registration at ALL `styleRegistry.set()` sites (including in modifier processing utilities), dark/light refs should work automatically. If any modifier processing utility directly registers styles without going through the sites covered in Task 7, add ref registration there too. Specifically check: `processColorSchemeModifiers()` in `colorSchemeModifierProcessing.ts`, `processPlatformModifiers()` in `platformModifierProcessing.ts`, `processStaticClassNameWithModifiers()` in `modifierProcessing.ts`, and `processDirectionalModifiers()` in `directionalModifierProcessing.ts`.
  - REFACTOR: Ensure all modifier processing paths are covered. Add missing ref registrations if found.

  **Must NOT do**:
  - Do NOT change modifier conditional logic (ternary expressions, `&&` chains)
  - Do NOT change how `useColorScheme` hook is injected
  - Do NOT add reactive theme switching (out of scope)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Requires tracing all code paths through modifier processing to ensure refs are registered at every styleRegistry.set() site. Multiple files to audit.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 10, 11)
  - **Blocks**: Tasks 10
  - **Blocked By**: Tasks 5, 6, 7

  **References**:

  **Pattern References**:
  - `src/babel/utils/colorSchemeModifierProcessing.ts` — `processColorSchemeModifiers()` function. Registers dark/light styles in `state.styleRegistry`. Check if refs are registered here.
  - `src/babel/utils/modifierProcessing.ts` — `processStaticClassNameWithModifiers()`. Registers modifier styles.
  - `src/babel/utils/platformModifierProcessing.ts` — `processPlatformModifiers()`. Registers platform styles.
  - `src/babel/utils/directionalModifierProcessing.ts` — `processDirectionalModifiers()`. Registers directional styles.
  - `src/babel/plugin/visitors/className.ts:95-107` — Scheme modifier expansion. Shows how `scheme:bg-primary` expands to `dark:bg-primary-dark` and `light:bg-primary-light`.

  **Acceptance Criteria**:
  - [ ] `dark:bg-gray-900` with configProvider → output contains `__twConfig.theme.colors["gray-900"]` inside dark conditional
  - [ ] `light:text-white` with configProvider → output contains config ref inside light conditional
  - [ ] `scheme:bg-primary` with configProvider → both dark and light expansions use config refs (when colors exist)
  - [ ] Conditional structure preserved: `_twColorScheme === 'dark' && _twStyles._key`
  - [ ] `useColorScheme` hook still injected correctly
  - [ ] ALL existing dark/light mode tests still pass

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Dark mode styles use config refs
    Tool: Bash (vitest)
    Preconditions: Tasks 1-7 complete
    Steps:
      1. Transform: `<View className="bg-white dark:bg-gray-900" />` with configProvider
      2. Assert output contains `__twConfig.theme.colors["gray-900"]`
      3. Assert output contains `_twColorScheme === "dark"`
      4. Assert output contains `__twConfig.theme.colors["white"]`
    Expected Result: Both base and dark styles use config refs, conditional structure intact
    Failure Indicators: Literals instead of refs, broken conditional
    Evidence: .sisyphus/evidence/task-9-dark-mode-refs.txt

  Scenario: Existing dark mode tests unchanged
    Tool: Bash (vitest)
    Preconditions: None
    Steps:
      1. Run `npx vitest run` filtering for dark/light/scheme tests
      2. Assert all pass
    Expected Result: Zero regressions in modifier tests
    Failure Indicators: Any dark/light/scheme test fails
    Evidence: .sisyphus/evidence/task-9-dark-mode-regression.txt
  ```

  **Commit**: YES
  - Message: `feat(babel): dark/light mode support with config refs`
  - Files: Modified modifier processing files (if any gaps found), `src/babel/plugin/visitors/className.test.ts`
  - Pre-commit: `npx vitest run`

- [x] 10. End-to-End Integration Tests

  **What to do**:
  - RED: Create `src/babel/plugin/visitors/className.configProvider.test.ts` (dedicated integration test file). Write comprehensive transform snapshot tests:
    - Simple component: `<View className="bg-blue-500 p-4" />` → full output snapshot with config refs
    - Mixed values: `<View className="bg-blue-500 rounded-lg" />` → color ref + literal borderRadius
    - Dynamic className: `<View className={isActive ? "bg-blue-500" : "bg-gray-200"} />` → both branches use refs
    - Dark mode: `<View className="bg-white dark:bg-gray-900" />` → refs in both base and conditional
    - Multiple components: file with 3+ components, all getting refs
    - tw template: `const styles = tw\`bg-blue-500 m-4\`` → refs in output
    - Arbitrary values mixed: `<View className="bg-blue-500 w-[100px]" />` → ref + literal
    - No-op test: same input WITHOUT configProvider → output matches current behavior exactly
  - GREEN: All tests should pass if Tasks 1-9 are correct. If any fail, this surfaces integration issues.
  - REFACTOR: Organize tests into clear describe blocks by feature area.

  **Must NOT do**:
  - Do NOT write implementation code — this is a pure test task
  - Do NOT modify any source files

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Comprehensive test writing requiring deep understanding of expected transform output for many scenarios.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 11)
  - **Blocks**: Task 11, F1-F4
  - **Blocked By**: ALL Tasks 1-9

  **References**:

  **Pattern References**:
  - `src/babel/plugin/visitors/className.test.ts:1-77` — Existing test patterns. Use same import/describe/it structure.
  - `test/helpers/babelTransform.ts` — `transform()` helper usage.

  **External References**:
  - `feature-init-only-theme.md:46-69` — Expected transform output from proposal. Use as reference for what the output should look like.

  **Acceptance Criteria**:
  - [ ] `vitest run src/babel/plugin/visitors/className.configProvider.test.ts` → ALL tests PASS
  - [ ] At least 8 distinct integration scenarios covered
  - [ ] No-op test confirms backward compatibility
  - [ ] Dynamic className + configProvider tested
  - [ ] Dark mode + configProvider tested
  - [ ] tw template + configProvider tested

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Full integration test suite passes
    Tool: Bash (vitest)
    Preconditions: All Tasks 1-9 complete
    Steps:
      1. Run `npx vitest run src/babel/plugin/visitors/className.configProvider.test.ts`
      2. Assert exit code 0
      3. Assert all describe blocks pass
    Expected Result: Complete integration coverage with zero failures
    Failure Indicators: Any test failure indicates an integration gap
    Evidence: .sisyphus/evidence/task-10-integration-tests.txt
  ```

  **Commit**: YES
  - Message: `test(babel): end-to-end configProvider integration tests`
  - Files: `src/babel/plugin/visitors/className.configProvider.test.ts`
  - Pre-commit: `npx vitest run`

- [x] 11. Existing Test Regression + Build Verification

  **What to do**:
  - Run the FULL test suite (`npx vitest run`) and verify ALL existing tests pass.
  - Run `npx tsc --noEmit` and verify zero type errors.
  - Run `npx eslint src/` and verify zero lint errors.
  - Run `npm run build` and verify the build succeeds.
  - Check that ALL existing snapshot files in `test/snapshots/` are unchanged (no accidental snapshot updates).
  - If any issues found, diagnose and fix. This task catches any regressions from Tasks 1-10.

  **Must NOT do**:
  - Do NOT update snapshots to hide regressions — fix the root cause instead
  - Do NOT skip any verification command

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure verification — running commands and checking output. No implementation.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 10)
  - **Blocks**: F1-F4
  - **Blocked By**: Task 10

  **References**:

  **Pattern References**:
  - `package.json:49-51` — Test and build scripts: `spec`, `test`, `build`.
  - `test/snapshots/parser/` — All existing snapshot files. Verify none were modified.

  **Acceptance Criteria**:
  - [ ] `npx vitest run` → 0 failures
  - [ ] `npx tsc --noEmit` → 0 errors
  - [ ] `npx eslint src/` → 0 errors
  - [ ] `npm run build` → exit code 0
  - [ ] `git diff test/snapshots/` → no changes (snapshots unchanged)

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Full verification suite
    Tool: Bash
    Preconditions: All Tasks 1-10 complete
    Steps:
      1. Run `npx vitest run` — assert 0 failures
      2. Run `npx tsc --noEmit` — assert 0 errors
      3. Run `npx eslint src/` — assert 0 errors
      4. Run `npm run build` — assert exit code 0
      5. Run `git diff test/snapshots/` — assert empty output
    Expected Result: All verification commands pass with clean output
    Failure Indicators: Any non-zero exit code, snapshot changes
    Evidence: .sisyphus/evidence/task-11-full-verification.txt
  ```

  **Commit**: YES (if fixes were needed)
  - Message: `fix(babel): address regression issues from configProvider feature`
  - Files: Any files that needed fixes
  - Pre-commit: `npx vitest run && npx tsc --noEmit`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + `eslint src/` + `vitest run`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp). Verify no changes to `StyleObject` type in `types/core.ts`.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real QA** — `unspecified-high`
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration: configProvider enabled end-to-end, dark mode + config refs, existing behavior unchanged. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance: StyleObject unchanged, parsers return types unchanged, dynamicProcessing.ts untouched, modifier processing untouched. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `feat(babel): add configProvider plugin option and state` — state.ts, plugin.ts
- **Wave 1**: `feat(babel): add config ref resolver utility` — configRefResolver.ts, configRefResolver.test.ts
- **Wave 1**: `feat(babel): add config module generator` — configModuleGenerator.ts, configModuleGenerator.test.ts
- **Wave 1**: `test(babel): extend transform helper for configProvider` — babelTransform.ts
- **Wave 2**: `feat(babel): emit config refs in StyleSheet.create` — styleInjection.ts, styleInjection.test.ts
- **Wave 2**: `feat(babel): inject __twConfig import` — program.ts, program.test.ts
- **Wave 2**: `feat(babel): register config refs in className/tw visitors` — className.ts, tw.ts, className.test.ts, tw.test.ts
- **Wave 3**: `feat(babel): dark/light mode with config refs` — className.test.ts
- **Wave 3**: `test(babel): end-to-end config provider integration tests` — integration tests
- **Wave 3**: `test(babel): verify existing test regression` — vitest run

---

## Success Criteria

### Verification Commands
```bash
npx vitest run                    # Expected: ALL tests pass (existing + new)
npx tsc --noEmit                  # Expected: 0 errors
npx eslint src/                   # Expected: 0 errors
```

### Final Checklist
- [x] `configProvider` option accepted and validated
- [x] `.generated.tailwind.config.js` created with correct content
- [x] Transform output contains `__twConfig.theme.*` MemberExpressions when enabled
- [x] Transform output unchanged when `configProvider` absent
- [x] Arbitrary values (`[#ff0000]`, `[16px]`) remain as literals
- [x] Computed values (opacity colors, negated spacing) remain as literals
- [x] Built-in scale values (borderRadius, fontWeight) remain as literals
- [x] Dark/light mode modifiers work with config refs
- [x] All existing snapshot tests unchanged
- [x] All "Must NOT Have" guardrails respected
