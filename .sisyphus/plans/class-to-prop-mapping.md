# Class-to-Prop Mapping Feature

## TL;DR

> **Quick Summary**: Add Babel-time transformation of `className` into individual component props for configured third-party components (e.g., Lucide icons) that don't accept a `style` prop. Instead of generating `StyleSheet.create`, extract values from class tokens and set them directly as component props (e.g., `className="text-red-500 size-6"` → `color="#fb2c36" size={24}`).
> 
> **Deliverables**:
> - New `componentClassToPropMapping` plugin option with type-safe config
> - Import-source-based component matcher (tracks imports → resolves JSX identities)
> - Class pattern matching + value extraction pipeline
> - Modifier expression generation for mapped props (dark:/light:, ios:/android:, rtl:/ltr:)
> - Init-only (`configProvider`) reference support for mapped props
> - className visitor integration with early branch for mapped components
> - Build-time warnings for unknown classes, explicit prop conflicts, unsupported modifiers
> - Comprehensive test suite covering all paths
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Task 1 → Task 2 → Task 3/4 → Task 5 → Task 6 → Task 7/8 → Task 9 → Task 10 → F1-F4

---

## Context

### Original Request
Implement the class-to-prop mapping feature as described in `feature-class-to-prop-mapping.md` and `class-to-prop-mapping-implementation-plan.md`. Transform `className` props on configured components into individual component props at Babel compile time.

### Interview Summary
**Key Discussions**:
- Feature proposal and implementation plan were pre-written and comprehensive
- All product decisions locked (mapping-only naming, no stroke-* v1, modifier parity for dark/light/platform/directional)

**Research Findings**:
- Plugin uses Babel visitor pattern: Program → ImportDeclaration → JSXAttribute → Program.exit
- className visitor (689 lines) handles static/dynamic classNames with modifier support
- Parser pipeline: `parseClass()` tries parsers in order → returns `StyleObject`
- NO existing infrastructure for component-level import tracking — needs building from scratch
- `componentSupport.ts` has hardcoded component-to-modifier mapping — separate concern, don't extend
- `configRefResolver.ts` can be reused for init-only mode config reference resolution
- Test infra: Vitest 4.0.18 with `transform()` helper, assertion + snapshot patterns

### Self-Analysis (Metis timed out)
**Identified Gaps** (addressed in plan):
- Edge case: Multiple class tokens matching same mapping pattern → last-match-wins + warning (per impl plan)
- Edge case: className with mix of mapped AND unmapped-but-valid Tailwind classes → unmapped classes get warning + ignored
- Edge case: Dynamic className expressions on mapped components → not supported in v1, emit warning
- Edge case: Namespace imports (`import * as Icons from "lucide-react-native"`) + member access (`<Icons.Home>`) → must handle
- Edge case: Re-exports and barrel files → match against configured `importFrom` only, no deep resolution
- Guardrail: `size-*` extraction must verify `width === height` in parsed StyleObject before emitting scalar
- Guardrail: `__twConfig` import injection must work even when `styleRegistry` is empty (no `StyleSheet.create`)

---

## Work Objectives

### Core Objective
Enable Babel-time transformation of `className` props into individual component props for configured third-party/custom components, with full modifier parity (dark/light, platform, directional) and init-only theme support.

### Concrete Deliverables
- `src/babel/plugin/state.ts` — Extended `PluginOptions` and `PluginState` types
- `src/babel/utils/componentMatcher.ts` — New module for import-source-based component matching
- `src/babel/utils/classToPropMapping.ts` — New module for class pattern matching, value extraction, and prop AST generation
- `src/babel/plugin/visitors/imports.ts` — Extended to track component imports
- `src/babel/plugin/visitors/className.ts` — Early branch for mapped component path
- `src/babel/plugin/visitors/program.ts` — Updated for `__twConfig` import when no StyleSheet needed
- `src/babel/utils/componentMatcher.test.ts` — New unit tests
- `src/babel/utils/classToPropMapping.test.ts` — New unit tests
- `src/babel/plugin/visitors/className.test.ts` — Extended with mapping test cases

### Definition of Done
- [ ] `vitest --run` passes with 0 failures including all new tests
- [ ] `tsc --noEmit` produces 0 errors
- [ ] `eslint src/` produces 0 errors
- [ ] Configured components transform `className` into mapped props
- [ ] Supported modifiers (dark:/light:/scheme:, ios:/android:/web:, rtl:/ltr:) work with mapped props
- [ ] configProvider refs work with flattened keys for mapped props
- [ ] Warnings emitted for ignored/unknown classes and explicit-prop conflicts
- [ ] Existing test suite remains green (zero regressions)

### Must Have
- Prefix wildcard pattern matching (`text-*`, `size-*`, `opacity-*`)
- Value extraction from parsed StyleObject (color string, numeric size)
- Import-source-based component identification (supports direct, aliased, namespace imports)
- Wildcard component matching (`components: ["*"]`)
- Explicit JSX prop precedence over mapped values
- Build-time warnings (dev-only) for all edge cases
- `className` attribute removal after mapping
- No `StyleSheet.create` emission for mapped-only files

### Must NOT Have (Guardrails)
- No `stroke-*` support in v1
- No state modifiers (`active:`, `hover:`, `focus:`, `disabled:`) on mapped props
- No `placeholder:` modifier on mapped props
- No runtime dimension classes (`w-screen`, `h-screen`) on mapped props
- No dynamic className expression support on mapped components (warn + skip)
- No `styleToProp` alias — use `mapping` only
- No deep import resolution beyond configured `importFrom` string match
- No modification to existing className→style transformation path (zero regressions)
- No over-abstraction of existing utilities — create new focused modules

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest 4.0.18)
- **Automated tests**: YES (Tests-after — implementation then tests)
- **Framework**: Vitest with `transform()` / `transformWithConfig()` test helpers
- **Test command**: `npm run spec` (runs `vitest --run --coverage`)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Babel transforms**: Use Bash (`vitest --run`) — Run test suite, assert pass counts
- **Type checking**: Use Bash (`npx tsc --noEmit`) — Assert zero errors
- **Linting**: Use Bash (`npx eslint src/`) — Assert zero errors
- **Manual transform verification**: Use Bash (node one-liner) — Transform sample code, verify output

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — types, options, matchers):
├── Task 1: Plugin option types + state plumbing [quick]
├── Task 2: Component matcher module [deep]
└── Task 3: Import tracking extension [quick]

Wave 2 (Core — mapping pipeline + visitor integration):
├── Task 4: Class pattern matching + value extraction [deep]
├── Task 5: Modifier expression generation for mapped props [deep]
└── Task 6: className visitor integration [deep]

Wave 3 (Advanced — configProvider + warnings + tests):
├── Task 7: Init-only (configProvider) references [unspecified-high]
├── Task 8: Program.exit updates [quick]
├── Task 9: Warnings behavior [quick]
└── Task 10: Component matcher tests [unspecified-high]

Wave 4 (Tests + Integration):
├── Task 11: classToPropMapping unit tests [unspecified-high]
├── Task 12: className visitor integration tests (static mapping) [unspecified-high]
├── Task 13: className visitor integration tests (modifiers) [unspecified-high]
└── Task 14: className visitor integration tests (configProvider) [unspecified-high]

Wave FINAL (Independent review, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Full test suite verification (unspecified-high)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 2/3 → Task 4/5 → Task 6 → Task 7/8/9 → Task 10-14 → F1-F4
Parallel Speedup: ~55% faster than sequential
Max Concurrent: 3 (Waves 1, 2, 3)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 2, 3, 4, 5, 6, 7 | 1 |
| 2 | 1 | 6, 10 | 1 |
| 3 | 1 | 6 | 1 |
| 4 | 1 | 6, 11 | 2 |
| 5 | 1 | 6, 11 | 2 |
| 6 | 2, 3, 4, 5 | 7, 8, 9, 12, 13 | 2 |
| 7 | 6 | 14 | 3 |
| 8 | 6 | — | 3 |
| 9 | 6 | — | 3 |
| 10 | 2 | — | 3 |
| 11 | 4, 5 | — | 4 |
| 12 | 6 | — | 4 |
| 13 | 6 | — | 4 |
| 14 | 7 | — | 4 |
| F1-F4 | ALL | — | FINAL |

### Agent Dispatch Summary

- **Wave 1**: 3 tasks — T1 → `quick`, T2 → `deep`, T3 → `quick`
- **Wave 2**: 3 tasks — T4 → `deep`, T5 → `deep`, T6 → `deep`
- **Wave 3**: 4 tasks — T7 → `unspecified-high`, T8 → `quick`, T9 → `quick`, T10 → `unspecified-high`
- **Wave 4**: 4 tasks — T11-T14 → `unspecified-high`
- **FINAL**: 4 tasks — F1 → `oracle`, F2-F3 → `unspecified-high`, F4 → `deep`

---

## TODOs


- [x] 1. Plugin option types + state plumbing

  **What to do**:
  - Extend `PluginOptions` in `src/babel/plugin/state.ts` with the new `componentClassToPropMapping` option:
    ```typescript
    type ComponentClassToPropRule = {
      importFrom: string;
      components: string[];  // e.g. ["Icon"] or ["*"]
      mapping: Record<string, string>;  // targetProp -> class pattern (e.g. { color: "text-*", size: "size-*" })
    };
    componentClassToPropMapping?: ComponentClassToPropRule[];
    ```
  - Extend `PluginState` with normalized mapping structures:
    - `classToPropRules: ComponentClassToPropRule[]` (validated and normalized from options)
    - `classToPropImportMap: Map<string, Set<string>>` (importSource → Set of local component names, populated by imports visitor)
    - `needsConfigImport: boolean` (track whether `__twConfig` import is needed even without StyleSheet.create)
  - In `createInitialState()`, validate and normalize the rules:
    - Warn on empty `mapping` objects
    - Warn on patterns without `*` wildcard
    - Store normalized rules in state
  - In `src/babel/plugin.ts`, pass the new option through to `createInitialState()`

  **Must NOT do**:
  - Do not add `styleToProp` alias — `mapping` only
  - Do not modify existing PluginOptions fields
  - Do not add state modifiers support to the type

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Straightforward type extension + state initialization — small, focused changes to 2 files
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed — no git operations in this task

  **Parallelization**:
  - **Can Run In Parallel**: NO (foundation for all other tasks)
  - **Parallel Group**: Wave 1 (start first)
  - **Blocks**: Tasks 2, 3, 4, 5, 6, 7
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `src/babel/plugin/state.ts:27-124` — Existing PluginOptions type definition with JSDoc patterns
  - `src/babel/plugin/state.ts:129-170` — Existing PluginState type with all tracked fields
  - `src/babel/plugin/state.ts:187-249` — createInitialState() function showing initialization pattern, validation, theme merging
  - `src/babel/plugin.ts:28-46` — How options are destructured and defaults applied before passing to createInitialState

  **API/Type References**:
  - `class-to-prop-mapping-implementation-plan.md:38-48` — The exact API shape for ComponentClassToPropRule and PluginOptions extension

  **WHY Each Reference Matters**:
  - `state.ts:27-124`: Copy the JSDoc documentation style and option nesting pattern for the new option
  - `state.ts:129-170`: See how existing boolean flags (needsPlatformImport, etc.) and Maps are structured — follow same pattern for new fields
  - `state.ts:187-249`: See how options are validated, defaults applied, and initial state built — add new initialization logic here
  - `plugin.ts:28-46`: See how options like configProvider are extracted with defaults — replicate for componentClassToPropMapping

  **Acceptance Criteria**:
  - [ ] `npx tsc --noEmit` — 0 errors (types compile)
  - [ ] `npm run spec` — all existing tests pass (zero regressions)
  - [ ] `PluginOptions` type includes `componentClassToPropMapping?: ComponentClassToPropRule[]`
  - [ ] `PluginState` type includes `classToPropRules`, `classToPropImportMap`, `needsConfigImport`
  - [ ] `createInitialState()` initializes new fields correctly

  **QA Scenarios:**

  ```
  Scenario: Plugin loads with componentClassToPropMapping option
    Tool: Bash (vitest)
    Preconditions: Plugin compiled successfully
    Steps:
      1. Run `npx tsc --noEmit` from project root
      2. Verify exit code 0
    Expected Result: Zero type errors, exit code 0
    Failure Indicators: Non-zero exit code, type errors in state.ts or plugin.ts
    Evidence: .sisyphus/evidence/task-1-types-compile.txt

  Scenario: Existing tests unaffected by new option types
    Tool: Bash (vitest)
    Preconditions: No other tasks applied yet
    Steps:
      1. Run `npm run spec`
      2. Count test results
    Expected Result: All existing tests pass, 0 failures
    Failure Indicators: Any test failure mentioning state.ts or plugin.ts
    Evidence: .sisyphus/evidence/task-1-existing-tests.txt
  ```

  **Commit**: YES (groups with Tasks 2, 3)
  - Message: `feat(babel): add componentClassToPropMapping option types and state plumbing`
  - Files: `src/babel/plugin/state.ts`, `src/babel/plugin.ts`
  - Pre-commit: `npx tsc --noEmit && npm run spec`

- [x] 2. Component matcher module

  **What to do**:
  - Create new `src/babel/utils/componentMatcher.ts` module
  - Implement `normalizeClassToPropRules()` function:
    - Takes raw `ComponentClassToPropRule[]` from options
    - Validates each rule (importFrom non-empty, components non-empty, mapping non-empty)
    - Returns validated rules array
  - Implement `buildImportMap()` function:
    - Called during ImportDeclaration visitor
    - Takes an import declaration node + the normalized rules
    - If the import source matches any rule's `importFrom`:
      - For each ImportSpecifier: map local name → import source
      - For ImportNamespaceSpecifier (`import * as Icons`): store namespace name → import source
    - Returns updates to `classToPropImportMap`
  - Implement `getClassToPropRule()` function:
    - Takes a JSXOpeningElement + state's `classToPropImportMap` + `classToPropRules`
    - Resolves JSX element identity:
      - Simple identifier `<Icon>` → look up local name in import map
      - Member expression `<Icons.Home>` → look up namespace in import map, check component name
    - Matches against rules:
      - Check if import source matches rule's `importFrom`
      - Check if component name matches rule's `components` (exact match or `"*"` wildcard)
    - Returns the matching `ComponentClassToPropRule` or `null`
  - Handle aliased imports: `import { Icon as MyIcon } from "lucide-react-native"` → track `MyIcon` → `lucide-react-native`

  **Must NOT do**:
  - Do not modify existing `componentSupport.ts` — this is a separate concern (state modifiers vs prop mapping)
  - Do not resolve transitive re-exports
  - Do not handle dynamic imports

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Requires understanding Babel AST node types for imports (ImportSpecifier, ImportDefaultSpecifier, ImportNamespaceSpecifier) and JSX element resolution
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed — no git operations

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 3, after Task 1)
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 6, 10
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/babel/plugin/visitors/imports.ts:13-116` — Existing import tracking pattern: how ImportDeclaration visitor checks source values, iterates specifiers, tracks local identifiers with aliasing support
  - `src/babel/utils/componentSupport.ts:12-51` — How JSXOpeningElement is inspected: extracting component name from JSXIdentifier and JSXMemberExpression nodes
  - `src/babel/utils/attributeMatchers.ts:20-41` — Glob pattern matching pattern (wildcard `*` → regex) — reuse for `components: ["*"]` matching

  **API/Type References**:
  - `src/babel/plugin/state.ts` — `PluginState` type (from Task 1) with `classToPropRules`, `classToPropImportMap`
  - `class-to-prop-mapping-implementation-plan.md:99-114` — Component matching requirements: direct imports, aliased imports, namespace imports, wildcard components

  **WHY Each Reference Matters**:
  - `imports.ts`: Copy the pattern of iterating `node.specifiers`, checking `t.isImportSpecifier(spec)`, and tracking `spec.local.name` — this is the exact Babel API needed
  - `componentSupport.ts:12-51`: Copy the JSX element name extraction logic (`t.isJSXIdentifier(name)`, `t.isJSXMemberExpression(name)`) — extend for import-source-based matching
  - `attributeMatchers.ts`: Reference for wildcard matching pattern — `components: ["*"]` means "all components from this source"

  **Acceptance Criteria**:
  - [ ] `npx tsc --noEmit` — 0 errors
  - [ ] Module exports `normalizeClassToPropRules`, `buildImportMap`, `getClassToPropRule`
  - [ ] Direct imports correctly identified: `import { Icon } from "lucide-react-native"` → matches rule
  - [ ] Aliased imports correctly identified: `import { Icon as MyIcon } from "lucide-react-native"` → matches rule
  - [ ] Namespace imports correctly identified: `import * as Icons from "lucide-react-native"` + `<Icons.Home>` → matches rule
  - [ ] Wildcard components (`["*"]`) match all components from configured source
  - [ ] Non-matching components return `null`

  **QA Scenarios:**

  ```
  Scenario: Direct import component matching
    Tool: Bash (vitest)
    Preconditions: componentMatcher.ts module exists with exported functions
    Steps:
      1. Run `npx tsc --noEmit`
      2. Verify module compiles without errors
    Expected Result: Zero type errors
    Failure Indicators: Type errors in componentMatcher.ts
    Evidence: .sisyphus/evidence/task-2-types-compile.txt

  Scenario: Module exports correct API surface
    Tool: Bash (node)
    Preconditions: Module compiled
    Steps:
      1. Check file exists at src/babel/utils/componentMatcher.ts
      2. Grep for exported function signatures: normalizeClassToPropRules, buildImportMap, getClassToPropRule
    Expected Result: All 3 functions are exported
    Failure Indicators: Missing exports
    Evidence: .sisyphus/evidence/task-2-exports.txt
  ```

  **Commit**: YES (groups with Tasks 1, 3)
  - Message: `feat(babel): add import-source-based component matcher for class-to-prop mapping`
  - Files: `src/babel/utils/componentMatcher.ts`
  - Pre-commit: `npx tsc --noEmit`

- [x] 3. Import tracking extension

  **What to do**:
  - Extend `src/babel/plugin/visitors/imports.ts` to call the component matcher's `buildImportMap()` during import tracking
  - In `importDeclarationVisitor()`, after existing import tracking logic:
    - Check if `state.classToPropRules.length > 0` (feature enabled)
    - If yes, call `buildImportMap(path.node, state.classToPropRules)` to check if this import matches any rule
    - Update `state.classToPropImportMap` with discovered component mappings
  - Handle all import types:
    - `import { Icon } from "lucide-react-native"` → map `Icon` → `lucide-react-native`
    - `import { Icon as MyIcon } from "lucide-react-native"` → map `MyIcon` → `lucide-react-native`
    - `import * as Icons from "lucide-react-native"` → map `Icons` (namespace) → `lucide-react-native`
    - `import Icon from "lucide-react-native"` → map `Icon` (default) → `lucide-react-native`

  **Must NOT do**:
  - Do not modify existing import tracking logic for react-native, color scheme, or tw/twStyle
  - Do not remove or reorder existing checks

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small, focused addition to existing visitor — append new logic after existing checks
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 2, after Task 1)
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 6
  - **Blocked By**: Task 1 (needs state types), Task 2 (needs buildImportMap function)

  **References**:

  **Pattern References**:
  - `src/babel/plugin/visitors/imports.ts:13-116` — The exact function to extend. Add new logic at the END (after line 115, before closing brace)
  - `src/babel/plugin/visitors/imports.ts:82-99` — Pattern for checking import source value and iterating specifiers — replicate for componentClassToPropMapping sources

  **API/Type References**:
  - `src/babel/utils/componentMatcher.ts` — `buildImportMap()` function from Task 2
  - `src/babel/plugin/state.ts` — `classToPropImportMap` field from Task 1

  **WHY Each Reference Matters**:
  - `imports.ts:13-116`: This IS the file to modify — understand the full flow before appending
  - `imports.ts:82-99`: Copy this exact pattern of `node.source.value === targetSource` + specifier iteration for each rule's `importFrom`

  **Acceptance Criteria**:
  - [ ] `npx tsc --noEmit` — 0 errors
  - [ ] `npm run spec` — all existing tests pass (zero regressions)
  - [ ] Import visitor correctly populates `classToPropImportMap` for configured sources

  **QA Scenarios:**

  ```
  Scenario: Existing import tracking unaffected
    Tool: Bash (vitest)
    Preconditions: imports.ts modified
    Steps:
      1. Run `npm run spec`
      2. Check for regressions in imports.test.ts
    Expected Result: All existing import tests pass
    Failure Indicators: Any failure in imports.test.ts
    Evidence: .sisyphus/evidence/task-3-existing-tests.txt
  ```

  **Commit**: YES (groups with Tasks 1, 2)
  - Message: `feat(babel): extend import tracking for componentClassToPropMapping`
  - Files: `src/babel/plugin/visitors/imports.ts`
  - Pre-commit: `npx tsc --noEmit && npm run spec`

- [x] 4. Class pattern matching + value extraction

  **What to do**:
  - Create new `src/babel/utils/classToPropMapping.ts` module
  - Implement `matchClassToPattern()` function:
    - Takes a class token (e.g., `text-red-500`) and a mapping pattern (e.g., `text-*`)
    - Returns `true` if the class matches the pattern (prefix matching with trailing `*`)
  - Implement `extractPropValue()` function:
    - Takes a matched class token + the target prop name + customTheme
    - Calls existing `parseClass(classToken, customTheme)` to get StyleObject
    - Extracts the appropriate value based on target prop:
      - `color` prop: Extract from `color`, `backgroundColor`, or first color-like value in StyleObject
      - `size` prop: Extract from StyleObject where `width === height` (both must be equal numeric values), return the scalar
      - `opacity` prop: Extract from `opacity` field (numeric 0-1)
      - Generic numeric: Extract first numeric value from StyleObject
      - Generic string: Extract first string value from StyleObject
    - Returns `{ value: string | number, configRef?: string[] }` or `null` if extraction fails
  - Implement `resolveConfigRefForProp()` function:
    - Takes the same matched class token + target prop
    - Uses existing `resolveConfigRefs()` from `configRefResolver.ts` to find config path
    - Returns the config reference path (e.g., `["theme", "colors", "red-500"]`) or `null`
  - Implement `processClassToPropMappings()` orchestrator function:
    - Takes: className string, mapping rules (from matched ComponentClassToPropRule), customTheme, state
    - Splits className into tokens
    - For each token, tries each mapping pattern
    - Extracts values and builds result: `Map<string, { value: string | number, configRef?: string[] }>`
    - Tracks unmatched tokens for warning generation
    - If multiple tokens match same pattern, last match wins + warning
    - Returns `{ mappedProps: Map, unmatchedClasses: string[] }`

  **Must NOT do**:
  - Do not rewrite or modify the parser (`src/parser/`) — reuse `parseClass()` as-is
  - Do not support `stroke-*` pattern in v1
  - Do not handle modifier parsing here — that's Task 5

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core algorithmic logic — pattern matching, value extraction from StyleObject, config ref resolution. Requires understanding parseClass() return shapes.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 5)
  - **Parallel Group**: Wave 2 (with Tasks 5, 6)
  - **Blocks**: Tasks 6, 11
  - **Blocked By**: Task 1 (needs types)

  **References**:

  **Pattern References**:
  - `src/parser/index.ts:35-84` — `parseClass()` API — input is single class string, output is StyleObject. This is the core parsing engine to call for value extraction
  - `src/parser/colors.ts:15-177` — How color parsing works internally. For `text-red-500`, parseColor returns `{ color: "#fb2c36" }`. Understanding this helps map StyleObject keys to prop values
  - `src/parser/sizing.ts:1-45` — SIZE_SCALE lookup table. For `size-6`, parseSizing returns `{ width: 24, height: 24 }`. The size-* extractor must verify width === height
  - `src/babel/utils/configRefResolver.ts:61-120` — `resolveConfigRefs()` function — takes className + fullTheme, returns Map of style property → config path. Reuse directly for init-only mode

  **API/Type References**:
  - `src/types/core.ts` — `StyleObject` type definition: `{ [key: string]: string | number | ShadowOffsetStyle | TransformStyle[] }`
  - `class-to-prop-mapping-implementation-plan.md:117-135` — Class pattern matching requirements and value extraction rules

  **WHY Each Reference Matters**:
  - `parser/index.ts:35-84`: Must understand parseClass() returns a flat object like `{ color: "#fb2c36" }` or `{ width: 24, height: 24 }` — extraction logic reads specific keys
  - `parser/colors.ts`: Understand that `text-*` classes produce `{ color: value }`, `bg-*` produce `{ backgroundColor: value }` — need to map StyleObject keys back to prop values
  - `parser/sizing.ts`: SIZE_SCALE shows `6` maps to `24`. For size-* extraction, must verify both width and height are equal numeric values
  - `configRefResolver.ts:61-120`: This is the function to call for init-only mode — returns the exact config path needed for `__twConfig.theme.colors["red-500"]`

  **Acceptance Criteria**:
  - [ ] `npx tsc --noEmit` — 0 errors
  - [ ] `text-red-500` with `text-*` pattern extracts `{ value: "#fb2c36" }`
  - [ ] `size-6` with `size-*` pattern extracts `{ value: 24 }`
  - [ ] `opacity-50` with `opacity-*` pattern extracts `{ value: 0.5 }`
  - [ ] Multiple tokens matching same pattern → last match wins
  - [ ] Unmatched tokens collected in `unmatchedClasses` array
  - [ ] Config refs resolved correctly for each matched class

  **QA Scenarios:**

  ```
  Scenario: Module compiles and exports correct API
    Tool: Bash (tsc)
    Preconditions: classToPropMapping.ts created
    Steps:
      1. Run `npx tsc --noEmit`
      2. Grep for exported functions: matchClassToPattern, extractPropValue, processClassToPropMappings
    Expected Result: Zero type errors, all functions exported
    Failure Indicators: Type errors or missing exports
    Evidence: .sisyphus/evidence/task-4-types-compile.txt

  Scenario: Existing tests unaffected
    Tool: Bash (vitest)
    Preconditions: New module added, no other changes
    Steps:
      1. Run `npm run spec`
    Expected Result: All existing tests pass
    Failure Indicators: Any test regression
    Evidence: .sisyphus/evidence/task-4-existing-tests.txt
  ```

  **Commit**: YES (groups with Tasks 5, 6)
  - Message: `feat(babel): implement class pattern matching and value extraction for prop mapping`
  - Files: `src/babel/utils/classToPropMapping.ts`
  - Pre-commit: `npx tsc --noEmit`

- [x] 5. Modifier expression generation for mapped props

  **What to do**:
  - Add modifier handling to `src/babel/utils/classToPropMapping.ts`
  - Implement `buildMappedPropExpression()` function that generates Babel AST for a single mapped prop value:
    - **No modifiers**: Return literal expression (`t.stringLiteral("#fb2c36")` or `t.numericLiteral(24)`)
    - **Color scheme modifiers (dark:/light:)**: Return conditional expression:
      `_twColorScheme === "dark" ? darkValue : lightValue`
      Reuse `state.colorSchemeVariableName` for the variable name
    - **Platform modifiers (ios:/android:/web:)**: Return `Platform.select({...})` expression
      Set `state.needsPlatformImport = true`
    - **Directional modifiers (rtl:/ltr:)**: Return conditional expression:
      `_twIsRTL ? rtlValue : ltrValue`
      Set `state.needsI18nManagerImport = true`
    - **Combined modifiers**: Nest conditional expressions (e.g., platform + color scheme)
  - Implement `processModifiedClassToPropMappings()` function:
    - Takes: full className string with modifiers, mapping rules, state, t (Babel types)
    - Calls `splitModifierClasses()` from parser to separate base and modifier classes
    - Calls `expandSchemeModifier()` for scheme: modifier expansion
    - Groups modifier classes by target prop
    - For each target prop with modifiers:
      - Extract base value (if any)
      - Extract modifier-specific values
      - Build conditional expression tree
    - Returns: `Map<string, BabelTypes.Expression>` (prop name → AST expression)
  - Track function component scope for color scheme hook injection (reuse `findComponentScope()` from `componentScope.ts`)
  - Set `state.needsColorSchemeImport = true` when color scheme modifiers are used
  - Call `injectColorSchemeHook()` immediately for React Compiler compatibility (follow existing pattern from className.ts)

  **Must NOT do**:
  - Do not support state modifiers (active:, hover:, focus:, disabled:) — warn + skip
  - Do not support placeholder: modifier
  - Do not duplicate modifier processing logic — reuse existing type guards and expansion utilities
  - Do not modify existing modifier processing utilities

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex AST generation with conditional expressions, Platform.select, hook injection. Requires deep understanding of Babel types API and existing modifier patterns.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 4)
  - **Parallel Group**: Wave 2 (with Tasks 4, 6)
  - **Blocks**: Tasks 6, 11
  - **Blocked By**: Task 1 (needs types)

  **References**:

  **Pattern References**:
  - `src/babel/utils/colorSchemeModifierProcessing.ts:56-118` — How color scheme conditionals are generated: grouping by modifier, building `===` comparisons, creating logical AND expressions. Adapt this pattern for prop values instead of style references
  - `src/babel/utils/platformModifierProcessing.ts:52-109` — How Platform.select() is generated: grouping by platform, building ObjectExpression. Adapt for prop values
  - `src/babel/utils/directionalModifierProcessing.ts:56-117` — How RTL conditionals are generated: `_twIsRTL` unary expression. Adapt for prop values
  - `src/babel/plugin/visitors/className.ts:102-120` — How modifiers are separated by type (platform, colorScheme, directional, state) and how scheme: is expanded — replicate this splitting logic
  - `src/babel/plugin/visitors/className.ts:164-188` — How color scheme hook injection is triggered: finding component scope, adding to state set, calling injectColorSchemeHook()

  **API/Type References**:
  - `src/parser/modifiers.ts` — `splitModifierClasses()`, `expandSchemeModifier()`, modifier type guards
  - `src/babel/utils/styleInjection.ts:164-232` — `injectColorSchemeHook()` function signature and usage
  - `src/babel/plugin/componentScope.ts:72-87` — `findComponentScope()` for locating function component scope

  **WHY Each Reference Matters**:
  - `colorSchemeModifierProcessing.ts`: The exact conditional pattern to adapt. Instead of `_twColorScheme === 'dark' && styles.key`, generate `_twColorScheme === 'dark' ? darkPropValue : lightPropValue`
  - `platformModifierProcessing.ts`: The Platform.select() pattern to adapt. Instead of style references, use literal prop values
  - `className.ts:102-120`: Must replicate this exact modifier splitting logic for the mapped prop path
  - `className.ts:164-188`: Critical for React Compiler compatibility — hook injection must happen immediately, not deferred

  **Acceptance Criteria**:
  - [ ] `npx tsc --noEmit` — 0 errors
  - [ ] Color scheme modifiers generate `_twColorScheme === "dark" ? ... : ...` expressions
  - [ ] Platform modifiers generate `Platform.select({...})` expressions
  - [ ] Directional modifiers generate `_twIsRTL ? ... : ...` expressions
  - [ ] State modifiers on mapped components produce warning + skip
  - [ ] Hook injection flags set correctly (needsColorSchemeImport, needsPlatformImport, needsI18nManagerImport)

  **QA Scenarios:**

  ```
  Scenario: Module compiles with modifier generation code
    Tool: Bash (tsc)
    Preconditions: classToPropMapping.ts extended with modifier code
    Steps:
      1. Run `npx tsc --noEmit`
    Expected Result: Zero type errors
    Failure Indicators: Type errors in modifier expression building
    Evidence: .sisyphus/evidence/task-5-types-compile.txt
  ```

  **Commit**: YES (groups with Tasks 4, 6)
  - Message: `feat(babel): implement modifier expression generation for class-to-prop mapping`
  - Files: `src/babel/utils/classToPropMapping.ts`
  - Pre-commit: `npx tsc --noEmit`

- [x] 6. className visitor integration

  **What to do**:
  - In `src/babel/plugin/visitors/className.ts`, add an early branch at the TOP of `jsxAttributeVisitor()` (after attribute support check, before the `processStaticClassName` inner function):
    - Get the JSXOpeningElement from `path.parent`
    - Call `getClassToPropRule(jsxOpeningElement, state.classToPropImportMap, state.classToPropRules)` from componentMatcher
    - If a matching rule is found:
      - Extract className value (static string only in v1; warn + skip for dynamic expressions)
      - Check for explicit JSX props that conflict with mapped props — if explicit prop exists, skip that mapping (warn in dev)
      - Call `processModifiedClassToPropMappings()` from classToPropMapping (if modifiers present) or `processClassToPropMappings()` (if no modifiers)
      - For each mapped prop, generate JSX attribute: `t.jsxAttribute(t.jsxIdentifier(propName), valueExpression)`
      - Add generated attributes to the JSX opening element
      - Remove the `className` attribute from the element
      - Set `state.hasClassNames = true` (to trigger import injection in program.exit)
      - Return early (do NOT fall through to normal style transformation)
    - If no rule matches, continue with existing className → style flow (zero changes to existing path)
  - Handle the `className` value types:
    - `StringLiteral`: Process directly
    - `JSXExpressionContainer` wrapping `StringLiteral`: Unwrap and process
    - Any other dynamic expression: Warn that dynamic className is not supported for mapped components, skip

  **Must NOT do**:
  - Do not modify ANY existing code paths — the early branch must be additive only
  - Do not change the function signature of `jsxAttributeVisitor`
  - Do not modify how existing className → style transformation works
  - Do not support dynamic className expressions on mapped components

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Integration point — must understand the full 689-line visitor, add code at the correct location without breaking anything. Requires careful AST manipulation for adding JSX attributes.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 2, 3, 4, 5)
  - **Parallel Group**: Wave 2 (sequential after Tasks 2-5 complete)
  - **Blocks**: Tasks 7, 8, 9, 12, 13
  - **Blocked By**: Tasks 2, 3, 4, 5

  **References**:

  **Pattern References**:
  - `src/babel/plugin/visitors/className.ts:63-81` — Entry point of `jsxAttributeVisitor()` — the attribute name check and early returns. Insert the new branch AFTER line 80 (after `isAttributeSupported` check)
  - `src/babel/plugin/visitors/className.ts:90-610` — `processStaticClassName` inner function — understand the full flow to know what the early branch must bypass
  - `src/babel/plugin/visitors/className.ts:612-618` — Static string handling at the bottom — the point where `processStaticClassName(value.value)` is called. The new branch must intercept BEFORE this
  - `src/babel/utils/styleTransforms.ts` — How JSX attributes are manipulated (replaceWithStyleAttribute, mergeStyleAttribute) — reference for adding JSX attributes to opening element

  **API/Type References**:
  - `src/babel/utils/componentMatcher.ts` — `getClassToPropRule()` from Task 2
  - `src/babel/utils/classToPropMapping.ts` — `processClassToPropMappings()` and `processModifiedClassToPropMappings()` from Tasks 4, 5

  **WHY Each Reference Matters**:
  - `className.ts:63-81`: This is WHERE to insert the new branch. Must be after attribute support check but before any processing
  - `className.ts:90-610`: Must NOT be reached for mapped components — the early return prevents this entire existing flow from executing
  - `styleTransforms.ts`: Reference for how JSX attributes are added/modified on elements using Babel types API

  **Acceptance Criteria**:
  - [ ] `npx tsc --noEmit` — 0 errors
  - [ ] `npm run spec` — all existing tests pass (CRITICAL — zero regressions)
  - [ ] Mapped components: className removed, individual props added
  - [ ] Non-mapped components: existing className → style flow unchanged
  - [ ] Explicit JSX props take precedence over mapped values
  - [ ] Dynamic className on mapped components produces warning

  **QA Scenarios:**

  ```
  Scenario: Basic static class-to-prop mapping works end-to-end
    Tool: Bash (node)
    Preconditions: All Wave 1 + Wave 2 tasks applied
    Steps:
      1. Create a test transform using the transform() helper:
         Input: `import { Icon } from 'lucide-react-native'; export function C() { return <Icon className="text-red-500 size-6" />; }`
         Options: `{ componentClassToPropMapping: [{ importFrom: 'lucide-react-native', components: ['*'], mapping: { color: 'text-*', size: 'size-*' } }] }`
      2. Verify output contains `color:` with hex value
      3. Verify output contains `size:` with numeric value
      4. Verify output does NOT contain `className`
      5. Verify output does NOT contain `StyleSheet.create` (no style needed for this component)
    Expected Result: `<Icon color="#fb2c36" size={24} />` (or equivalent AST output)
    Failure Indicators: className still present, StyleSheet.create generated, missing props
    Evidence: .sisyphus/evidence/task-6-basic-mapping.txt

  Scenario: Existing className-to-style flow unaffected
    Tool: Bash (vitest)
    Preconditions: className.ts modified with early branch
    Steps:
      1. Run `npm run spec`
      2. Check that ALL existing className.test.ts tests pass
    Expected Result: Zero regressions in existing tests
    Failure Indicators: Any existing test failure
    Evidence: .sisyphus/evidence/task-6-no-regression.txt

  Scenario: Explicit prop precedence
    Tool: Bash (node)
    Preconditions: Wave 1 + 2 complete
    Steps:
      1. Transform: `<Icon color="blue" className="text-red-500" />` with mapping config
      2. Verify output keeps `color: "blue"` (explicit prop wins)
      3. Verify output does NOT have a second color prop
    Expected Result: Explicit prop preserved, mapped value skipped
    Failure Indicators: Duplicate color prop or explicit prop overridden
    Evidence: .sisyphus/evidence/task-6-explicit-precedence.txt
  ```

  **Commit**: YES (groups with Tasks 4, 5)
  - Message: `feat(babel): integrate class-to-prop mapping in className visitor`
  - Files: `src/babel/plugin/visitors/className.ts`
  - Pre-commit: `npx tsc --noEmit && npm run spec`

- [x] 7. Init-only (configProvider) references for mapped props

  **What to do**:
  - In `src/babel/utils/classToPropMapping.ts`, extend value generation to support config references:
    - When `state.configProviderEnabled` is `true`, instead of emitting literal values, emit `__twConfig` member expressions
    - Use existing `buildConfigRefExpression()` from `src/babel/utils/styleInjection.ts` to build `__twConfig.theme.colors["red-500"]`
    - Use existing `resolveConfigRefs()` from `configRefResolver.ts` to resolve class tokens to config paths
    - For flattened keys: `text-red-500` → `__twConfig.theme.colors["red-500"]`
    - For size: `size-6` → `__twConfig.theme.spacing["6"]`
  - Conditional expressions with config refs:
    - `dark:text-red-500 light:text-blue-500` → `_twColorScheme === "dark" ? __twConfig.theme.colors["red-500"] : __twConfig.theme.colors["blue-500"]`
  - Set `state.needsConfigImport = true` when config refs are used in mapped props (even if no StyleSheet.create is emitted)

  **Must NOT do**:
  - Do not modify `buildConfigRefExpression()` or `resolveConfigRefs()` — reuse as-is
  - Do not modify the config module generator

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requires integration with config provider pipeline and understanding of config ref resolution
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8, 9)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 14
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `src/babel/utils/styleInjection.ts:489-504` — `buildConfigRefExpression()` — builds `__twConfig.theme.colors["blue-500"]` member expression from path array. Use directly for mapped prop config refs
  - `src/babel/utils/configRefResolver.ts:61-120` — `resolveConfigRefs()` — takes className string + fullTheme, returns Map of property → config path. Call this to determine config ref for each mapped class token
  - `src/babel/utils/styleInjection.ts:579-648` — `injectStylesAtTop()` — shows how config refs are used in StyleSheet.create generation — adapt the config ref lookup pattern for prop values

  **API/Type References**:
  - `src/babel/plugin/state.ts` — `configProviderEnabled`, `configRefRegistry`, `generatedConfigPath` fields
  - `class-to-prop-mapping-implementation-plan.md:160-181` — Init-only requirements for mapped props

  **WHY Each Reference Matters**:
  - `buildConfigRefExpression()`: Use directly — it handles computed property access for keys with `-` or digits automatically
  - `resolveConfigRefs()`: Call for each class token to get the config path, then pass to `buildConfigRefExpression()`
  - `injectStylesAtTop()`: Shows the existing pattern of checking `configRefRegistry?.get(key)` to decide between literal vs config ref values

  **Acceptance Criteria**:
  - [ ] `npx tsc --noEmit` — 0 errors
  - [ ] With configProvider enabled, mapped props use `__twConfig` references instead of literal values
  - [ ] `state.needsConfigImport` set to `true` when config refs are used

  **QA Scenarios:**

  ```
  Scenario: Config refs generated for mapped props
    Tool: Bash (node)
    Preconditions: configProvider option enabled with importFrom
    Steps:
      1. Transform with configProvider: `<Icon className="text-red-500" />` with mapping config
      2. Verify output contains `__twConfig.theme.colors["red-500"]` instead of literal `"#fb2c36"`
    Expected Result: Config ref expression in output instead of literal value
    Failure Indicators: Literal value instead of config ref
    Evidence: .sisyphus/evidence/task-7-config-refs.txt
  ```

  **Commit**: YES (groups with Tasks 8, 9)
  - Message: `feat(babel): add configProvider support for class-to-prop mapping`
  - Files: `src/babel/utils/classToPropMapping.ts`
  - Pre-commit: `npx tsc --noEmit`

- [x] 8. Program.exit updates for class-to-prop mapping

  **What to do**:
  - In `src/babel/plugin/visitors/program.ts`, update `programExit()` to handle the case where class-to-prop mapping was used but no `StyleSheet.create` is needed:
    - Update the early return check (lines 46-53): Include `state.needsConfigImport` in the condition so program.exit still runs when only mapped props need `__twConfig`
    - Add: If `state.needsConfigImport` is `true` AND `state.configProviderEnabled`, inject `__twConfig` import via `addConfigImport()` even when `state.styleRegistry.size === 0`
  - Ensure existing injection logic (StyleSheet, Platform, colorScheme, I18nManager, windowDimensions hooks) still works correctly

  **Must NOT do**:
  - Do not modify existing import injection logic
  - Do not change the order of operations in programExit()

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small, targeted change to 2-3 conditionals in program.ts
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 7, 9)
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `src/babel/plugin/visitors/program.ts:35-130` — Full `programExit()` function. Lines 46-53 have the early return check. Lines 124-129 have the config import injection. Both need updates.

  **API/Type References**:
  - `src/babel/plugin/state.ts` — `needsConfigImport` boolean from Task 1
  - `src/babel/utils/styleInjection.ts:516-573` — `addConfigImport()` function

  **WHY Each Reference Matters**:
  - `program.ts:46-53`: The early return must include `!state.needsConfigImport` so it doesn't skip config import injection for mapped-only files
  - `program.ts:124-129`: Must also check `state.needsConfigImport` (not just `configRefRegistry.size > 0`) to inject `__twConfig` for mapped props

  **Acceptance Criteria**:
  - [ ] `npx tsc --noEmit` — 0 errors
  - [ ] `npm run spec` — all existing tests pass
  - [ ] `__twConfig` import injected in files that ONLY use class-to-prop mapping (no StyleSheet.create)
  - [ ] Files with both styles and mapped props still work correctly

  **QA Scenarios:**

  ```
  Scenario: Config import injected without StyleSheet.create
    Tool: Bash (node)
    Preconditions: Tasks 1-7 applied
    Steps:
      1. Transform a file with ONLY mapped components (no regular className usage)
      2. Verify output contains `__twConfig` import
      3. Verify output does NOT contain `StyleSheet.create`
    Expected Result: __twConfig imported, no StyleSheet.create
    Failure Indicators: Missing __twConfig import or unexpected StyleSheet.create
    Evidence: .sisyphus/evidence/task-8-config-only.txt
  ```

  **Commit**: YES (groups with Tasks 7, 9)
  - Message: `feat(babel): update program.exit for class-to-prop mapping config imports`
  - Files: `src/babel/plugin/visitors/program.ts`
  - Pre-commit: `npx tsc --noEmit && npm run spec`

- [x] 9. Warnings behavior

  **What to do**:
  - Ensure all warning paths are implemented in `src/babel/utils/classToPropMapping.ts` and `src/babel/plugin/visitors/className.ts`:
    - **Unmatched class token**: When a class token in className doesn't match any mapping pattern → `console.warn("[react-native-tailwind] Class \"${token}\" on ${componentName} has no matching mapping pattern and was ignored.")`
    - **Unknown/unparseable class**: When `parseClass()` returns empty `{}` for a matched token → `console.warn("[react-native-tailwind] Unknown class \"${token}\" could not be parsed.")`
    - **Explicit prop override**: When a mapped prop conflicts with an existing explicit prop → `console.warn("[react-native-tailwind] Explicit prop \"${propName}\" overrides className mapping on ${componentName}.")`
    - **Unsupported modifier**: When state modifiers (active:, hover:, etc.) are used on mapped components → `console.warn("[react-native-tailwind] State modifier \"${modifier}:\" is not supported for class-to-prop mapping.")`
    - **Dynamic className**: When className is a non-string expression on mapped component → `console.warn("[react-native-tailwind] Dynamic className is not supported for class-to-prop mapping.")`
    - **Multiple matches**: When multiple tokens match the same pattern → `console.warn("[react-native-tailwind] Multiple classes match pattern \"${pattern}\" for prop \"${prop}\". Using last match.")`
  - All warnings must be wrapped in `if (process.env.NODE_ENV !== "production")` guard (matching existing pattern)
  - Warnings must include file location: `state.file.opts.filename ?? "unknown"`

  **Must NOT do**:
  - Do not make warnings fatal (no `throw`)
  - Do not add warnings to non-dev builds

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Adding console.warn calls at specific locations — pattern already established throughout codebase
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 7, 8)
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `src/babel/plugin/visitors/className.ts:147-152` — Existing warning pattern: `if (process.env.NODE_ENV !== "production") { console.warn(\`[react-native-tailwind] ...\`); }` with filename inclusion
  - `src/babel/plugin/visitors/className.ts:419-424` — Another warning example showing how modifiers + component names are included in messages

  **WHY Each Reference Matters**:
  - Copy the exact warning format: prefix, message structure, filename inclusion, dev-only guard

  **Acceptance Criteria**:
  - [ ] `npx tsc --noEmit` — 0 errors
  - [ ] All 6 warning paths implemented with dev-only guards
  - [ ] Warnings include `[react-native-tailwind]` prefix and filename

  **QA Scenarios:**

  ```
  Scenario: Warnings produced for unmatched classes
    Tool: Bash (node)
    Preconditions: Tasks 1-6 applied, NODE_ENV=development
    Steps:
      1. Transform: `<Icon className="text-red-500 flex-row" />` with mapping config (no pattern for flex-row)
      2. Capture console.warn output
    Expected Result: Warning about "flex-row" having no matching pattern
    Failure Indicators: No warning produced or wrong message format
    Evidence: .sisyphus/evidence/task-9-unmatched-warning.txt
  ```

  **Commit**: YES (groups with Tasks 7, 8)
  - Message: `feat(babel): add build-time warnings for class-to-prop mapping edge cases`
  - Files: `src/babel/utils/classToPropMapping.ts`, `src/babel/plugin/visitors/className.ts`
  - Pre-commit: `npx tsc --noEmit`

- [ ] 10. Component matcher unit tests

  **What to do**:
  - Create `src/babel/utils/componentMatcher.test.ts`
  - Test `normalizeClassToPropRules()`:
    - Valid rules pass through correctly
    - Empty mapping warns and is handled
    - Missing `importFrom` warns
  - Test `buildImportMap()`:
    - Direct import: `import { Icon } from "lucide-react-native"` → maps `Icon`
    - Aliased import: `import { Icon as MyIcon } from "lucide-react-native"` → maps `MyIcon`
    - Namespace import: `import * as Icons from "lucide-react-native"` → maps `Icons` namespace
    - Default import: `import Icon from "lucide-react-native"` → maps `Icon`
    - Non-matching source: `import { View } from "react-native"` → no mapping
  - Test `getClassToPropRule()`:
    - Matching component with exact name returns rule
    - Wildcard `["*"]` matches any component from source
    - Non-matching component returns `null`
    - Member expression `<Icons.Home>` matches namespace import
  - Use vitest import pattern matching className.test.ts

  **Must NOT do**:
  - Do not modify the component matcher implementation

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Comprehensive test coverage for a new module — needs careful test case design
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 7, 8, 9)
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `src/babel/utils/componentSupport.test.ts` — Test pattern for utility functions: import vi/describe/expect/it, test pure functions with Babel AST node mocks
  - `src/babel/utils/attributeMatchers.test.ts` — Test pattern for matcher functions — shows how to test pattern matching logic
  - `class-to-prop-mapping-implementation-plan.md:258-268` — Required test cases for component import matching

  **WHY Each Reference Matters**:
  - `componentSupport.test.ts`: Shows how to create mock Babel AST nodes for testing without full transform
  - `attributeMatchers.test.ts`: Shows the assertion pattern for matcher functions (exact match, pattern match, no match)

  **Acceptance Criteria**:
  - [ ] `npm run spec` — all tests pass including new componentMatcher tests
  - [ ] Direct, aliased, namespace, and default imports tested
  - [ ] Wildcard and exact component matching tested
  - [ ] Non-matching cases tested

  **QA Scenarios:**

  ```
  Scenario: All component matcher tests pass
    Tool: Bash (vitest)
    Preconditions: componentMatcher.test.ts created
    Steps:
      1. Run `npx vitest --run src/babel/utils/componentMatcher.test.ts`
    Expected Result: All tests pass, 0 failures
    Failure Indicators: Any test failure
    Evidence: .sisyphus/evidence/task-10-matcher-tests.txt
  ```

  **Commit**: YES (groups with Tasks 11-14)
  - Message: `test(babel): add unit tests for component matcher`
  - Files: `src/babel/utils/componentMatcher.test.ts`
  - Pre-commit: `npm run spec`

- [ ] 11. classToPropMapping unit tests

  **What to do**:
  - Create `src/babel/utils/classToPropMapping.test.ts`
  - Test `matchClassToPattern()`:
    - `text-red-500` matches `text-*` → true
    - `size-6` matches `size-*` → true
    - `bg-blue-500` does NOT match `text-*` → false
    - `text-red-500` does NOT match `size-*` → false
    - Pattern without wildcard → exact match only
  - Test `extractPropValue()`:
    - `text-red-500` for `color` prop → `{ value: "#fb2c36" }`
    - `size-6` for `size` prop → `{ value: 24 }`
    - `opacity-50` for `opacity` prop → `{ value: 0.5 }`
    - Custom theme colors: `text-primary` with custom theme → correct hex
    - Unknown class returns `null`
  - Test `processClassToPropMappings()`:
    - Multiple classes map to different props correctly
    - Unmatched classes collected in `unmatchedClasses`
    - Multiple matches on same pattern → last match wins
  - Test modifier expression generation:
    - `dark:text-red-500 light:text-blue-500` → conditional expression
    - `ios:text-red-500 android:text-blue-500` → Platform.select
    - State modifiers → skipped with warning

  **Must NOT do**:
  - Do not modify the implementation code

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Comprehensive test coverage for core mapping logic with both unit and integration patterns
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 12, 13, 14)
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: Tasks 4, 5

  **References**:

  **Pattern References**:
  - `src/babel/utils/configRefResolver.test.ts` — Test pattern for utility functions that resolve values from theme data — shows how to set up theme fixtures and test mappings
  - `src/parser/colors.test.ts` — Test pattern for parser functions — shows assertion style for parsed values

  **WHY Each Reference Matters**:
  - `configRefResolver.test.ts`: Shows how to create test fixtures for theme data and test resolution logic
  - `colors.test.ts`: Shows assertion patterns for color parsing results — `expect(result).toEqual({ color: "#fb2c36" })`

  **Acceptance Criteria**:
  - [ ] `npm run spec` — all tests pass including new classToPropMapping tests
  - [ ] Pattern matching, value extraction, and multi-class processing tested
  - [ ] Modifier expression generation tested

  **QA Scenarios:**

  ```
  Scenario: All classToPropMapping tests pass
    Tool: Bash (vitest)
    Preconditions: classToPropMapping.test.ts created
    Steps:
      1. Run `npx vitest --run src/babel/utils/classToPropMapping.test.ts`
    Expected Result: All tests pass, 0 failures
    Failure Indicators: Any test failure
    Evidence: .sisyphus/evidence/task-11-mapping-tests.txt
  ```

  **Commit**: YES (groups with Tasks 10, 12, 13, 14)
  - Message: `test(babel): add unit tests for classToPropMapping utilities`
  - Files: `src/babel/utils/classToPropMapping.test.ts`
  - Pre-commit: `npm run spec`

- [ ] 12. className visitor integration tests — static mapping

  **What to do**:
  - Add new `describe("className visitor - class-to-prop mapping", ...)` block in `src/babel/plugin/visitors/className.test.ts`
  - Use the `transform()` helper with `componentClassToPropMapping` option
  - Test cases:
    - **Basic mapping**: `<Icon className="text-red-500 size-6" />` → `color="#fb2c36" size={24}`, no className, no StyleSheet.create
    - **Multiple mapped props**: `<Icon className="text-blue-500 size-4 opacity-75" />` → 3 individual props
    - **Explicit prop precedence**: `<Icon color="blue" className="text-red-500" />` → keeps `color="blue"`, warning produced
    - **Unmapped classes ignored**: `<Icon className="text-red-500 flex-row" />` → `color` prop set, `flex-row` ignored, warning produced
    - **Non-matching component**: `<View className="text-red-500" />` (no rule for View) → normal style transform
    - **Aliased import**: `import { Icon as MyIcon } from "lucide-react-native"` + `<MyIcon className="text-red-500" />`
    - **Namespace import**: `import * as Icons from "lucide-react-native"` + `<Icons.Home className="text-red-500" />`
    - **Wildcard components**: `components: ["*"]` matches all from source
    - **Dynamic className warning**: `<Icon className={dynamicVar} />` on mapped component → warning
    - **Custom theme colors**: `text-primary` with custom theme → correct hex

  **Must NOT do**:
  - Do not modify existing test cases in className.test.ts
  - Do not change the test file structure

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integration tests requiring full Babel transform pipeline — must craft input/output assertions carefully
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 11, 13, 14)
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `src/babel/plugin/visitors/className.test.ts:25-97` — Existing test patterns: how to import transform(), set up input code strings with JSX, call transform with options, assert output contents
  - `test/helpers/babelTransform.ts:28-47` — `transform()` function signature: `transform(code, options, includeJsx, filename)` — pass `componentClassToPropMapping` via options parameter

  **WHY Each Reference Matters**:
  - `className.test.ts:25-97`: Copy this exact pattern for new test cases — input code with JSX imports, transform() call with includeJsx=true, expect().toContain/not.toContain assertions
  - `babelTransform.ts`: Need to pass `componentClassToPropMapping` option correctly

  **Acceptance Criteria**:
  - [ ] `npm run spec` — all tests pass (new + existing)
  - [ ] 10+ test cases covering basic mapping, precedence, imports, warnings
  - [ ] Zero regressions in existing className.test.ts tests

  **QA Scenarios:**

  ```
  Scenario: All static mapping integration tests pass
    Tool: Bash (vitest)
    Preconditions: New describe block added to className.test.ts
    Steps:
      1. Run `npx vitest --run src/babel/plugin/visitors/className.test.ts`
    Expected Result: All tests pass including new + existing
    Failure Indicators: Any test failure
    Evidence: .sisyphus/evidence/task-12-static-mapping-tests.txt
  ```

  **Commit**: YES (groups with Tasks 10, 11, 13, 14)
  - Message: `test(babel): add integration tests for static class-to-prop mapping`
  - Files: `src/babel/plugin/visitors/className.test.ts`
  - Pre-commit: `npm run spec`

- [ ] 13. className visitor integration tests — modifiers on mapped props

  **What to do**:
  - Add new `describe("className visitor - class-to-prop mapping modifiers", ...)` block in `src/babel/plugin/visitors/className.test.ts`
  - Test cases:
    - **dark:/light: modifiers**: `<Icon className="dark:text-red-500 light:text-blue-500" />` → conditional expression with `_twColorScheme`
    - **scheme: modifier**: `<Icon className="scheme:text-brand" />` with custom colors having brand-dark/brand-light → expanded to dark:/light:
    - **ios:/android: modifiers**: `<Icon className="ios:text-red-500 android:text-blue-500" />` → Platform.select expression
    - **rtl:/ltr: modifiers**: `<Icon className="rtl:text-red-500 ltr:text-blue-500" />` → I18nManager conditional
    - **web: modifier**: `<Icon className="web:text-green-500" />` → Platform.select with web key
    - **Base + modifiers**: `<Icon className="text-gray-500 dark:text-white" />` → conditional with base value as default
    - **State modifier warning**: `<Icon className="active:text-red-500" />` → warning, no active modifier applied
    - **Color scheme hook injection**: Verify `useColorScheme` import and hook call added when dark:/light: used
    - **Platform import injection**: Verify Platform import added when ios:/android: used
    - **I18nManager import injection**: Verify I18nManager import added when rtl:/ltr: used

  **Must NOT do**:
  - Do not modify existing test cases

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Complex test assertions for generated conditional expressions, Platform.select, and hook injection
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 11, 12, 14)
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `src/babel/plugin/visitors/className.test.ts` (search for `dark:` tests) — Existing modifier test patterns: how dark:/light: assertions are structured, what to expect in output
  - `src/babel/plugin/visitors/className.test.ts` (search for `Platform.select`) — Platform modifier test patterns

  **WHY Each Reference Matters**:
  - Existing modifier tests show the exact assertion patterns: `expect(output).toMatch(/_twColorScheme/)`, `expect(output).toContain("Platform.select")`, `expect(output).toContain("useColorScheme")`

  **Acceptance Criteria**:
  - [ ] `npm run spec` — all tests pass (new + existing)
  - [ ] 10+ test cases covering all modifier types on mapped props
  - [ ] Hook injection verified in tests

  **QA Scenarios:**

  ```
  Scenario: All modifier integration tests pass
    Tool: Bash (vitest)
    Preconditions: New describe block added to className.test.ts
    Steps:
      1. Run `npx vitest --run src/babel/plugin/visitors/className.test.ts`
    Expected Result: All tests pass including new + existing
    Failure Indicators: Any test failure
    Evidence: .sisyphus/evidence/task-13-modifier-tests.txt
  ```

  **Commit**: YES (groups with Tasks 10, 11, 12, 14)
  - Message: `test(babel): add integration tests for modifier support in class-to-prop mapping`
  - Files: `src/babel/plugin/visitors/className.test.ts`
  - Pre-commit: `npm run spec`

- [ ] 14. className visitor integration tests — configProvider with mapped props

  **What to do**:
  - Add test cases in `src/babel/plugin.configProvider.test.ts` OR in `src/babel/plugin/visitors/className.test.ts` (whichever is more appropriate based on existing test organization)
  - Use `transformWithConfig()` helper for configProvider tests
  - Test cases:
    - **Config ref for color**: `<Icon className="text-red-500" />` with configProvider → `color: __twConfig.theme.colors["red-500"]`
    - **Config ref for size**: `<Icon className="size-6" />` with configProvider → `size: __twConfig.theme.spacing["6"]`
    - **Config ref with modifiers**: `<Icon className="dark:text-red-500 light:text-blue-500" />` with configProvider → conditional with config refs
    - **__twConfig import injection**: Verify `__twConfig` import present in output, even without StyleSheet.create
    - **Mixed file**: File with both regular className and mapped className with configProvider → both work correctly

  **Must NOT do**:
  - Do not modify existing configProvider tests

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Tests requiring configProvider setup and verification of config ref expressions
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 11, 12, 13)
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: Task 7

  **References**:

  **Pattern References**:
  - `src/babel/plugin.configProvider.test.ts` — Existing configProvider test patterns: how `transformWithConfig()` is called, vi.mock setup for config-loader, snapshot assertions for `__twConfig` references
  - `test/helpers/babelTransform.ts:63-78` — `transformWithConfig()` helper signature

  **WHY Each Reference Matters**:
  - `plugin.configProvider.test.ts`: Must replicate the exact vi.mock setup and transformWithConfig usage for consistency

  **Acceptance Criteria**:
  - [ ] `npm run spec` — all tests pass (new + existing)
  - [ ] Config ref expressions verified in mapped prop output
  - [ ] __twConfig import injection verified

  **QA Scenarios:**

  ```
  Scenario: All configProvider mapping tests pass
    Tool: Bash (vitest)
    Preconditions: configProvider test cases added
    Steps:
      1. Run `npm run spec`
    Expected Result: All tests pass including new configProvider mapping tests
    Failure Indicators: Any test failure
    Evidence: .sisyphus/evidence/task-14-config-provider-tests.txt
  ```

  **Commit**: YES (groups with Tasks 10, 11, 12, 13)
  - Message: `test(babel): add configProvider integration tests for class-to-prop mapping`
  - Files: `src/babel/plugin.configProvider.test.ts` or `src/babel/plugin/visitors/className.test.ts`
  - Pre-commit: `npm run spec`

---

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run test). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npx tsc --noEmit` + `npx eslint src/` + `npm run spec`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod (allow `console.warn` behind `NODE_ENV !== "production"`), commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Full Test Suite Verification** — `unspecified-high`
  Run `npm run spec` from clean state. Verify ALL new tests pass. Verify ALL existing tests still pass (zero regressions). Check coverage for new files. Run `npm run test` (lint + check + spec) end-to-end.
  Output: `New Tests [N pass] | Existing Tests [N pass/N regressed] | Coverage [new files %] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual files changed. Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files without reason. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- After Wave 1: `feat(babel): add componentClassToPropMapping option types and component matcher` — state.ts, componentMatcher.ts, imports.ts
- After Wave 2: `feat(babel): implement class-to-prop mapping pipeline and visitor integration` — classToPropMapping.ts, className.ts
- After Wave 3: `feat(babel): add configProvider support, program.exit updates, and warnings for class-to-prop mapping` — classToPropMapping.ts, program.ts, className.ts
- After Wave 4: `test(babel): add comprehensive tests for class-to-prop mapping feature` — *.test.ts files

---

## Success Criteria

### Verification Commands
```bash
npx tsc --noEmit          # Expected: 0 errors
npx eslint src/           # Expected: 0 errors  
npm run spec              # Expected: all tests pass, 0 failures
npm run test              # Expected: lint + check + spec all pass
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass (new + existing)
- [ ] Configured Lucide-style components transform className into individual props
- [ ] dark:/light:/scheme: modifiers generate conditional expressions for mapped props
- [ ] ios:/android:/web: modifiers generate Platform.select for mapped props
- [ ] rtl:/ltr: modifiers generate I18nManager conditionals for mapped props
- [ ] configProvider mode generates __twConfig references for mapped props
- [ ] Explicit JSX props take precedence over mapped className values
- [ ] Unknown/unmapped classes produce dev-only warnings
