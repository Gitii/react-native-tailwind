# Fix Config Pipeline — Wire Up Generated Config Module

## TL;DR

> **Quick Summary**: Restore the 3-layer config provider architecture by wiring up the already-built `generateConfigModule()`/`writeConfigModule()` pipeline in `plugin.ts`, fixing the import path in `program.ts`, and updating all tests + snapshots to reflect the correct generated-file import path.
>
> **Deliverables**:
>
> - `plugin.ts` calls `findTailwindConfig()` → `generateConfigModule()` → `writeConfigModule()` → populates `state.generatedConfigPath`
> - `program.ts:126` uses `state.generatedConfigPath` (not `state.configProviderImportFrom`)
> - All 29 configProvider E2E tests pass with generated-file import paths
> - All snapshot tests updated
> - Docs reverted to show generated-file architecture
>
> **Estimated Effort**: Short (3-5 focused tasks)
> **Parallel Execution**: YES — 2 waves + final verification
> **Critical Path**: Task 1 (test infra) → Task 2 (wire pipeline) → Task 3 (fix program.ts) → Task 4 (update snapshots/E2E) → Task 5 (docs) → F1-F4 (verification)

---

## Context

### Original Request

Restore the 3-layer config provider architecture that was bypassed during Task 8 of the init-only-theme plan. The generated config file pipeline exists (built in Task 3) but was never wired into the plugin lifecycle. A subagent in Task 8 changed `state.generatedConfigPath` → `state.configProviderImportFrom` in `program.ts:126`, bypassing the generated file entirely.

### Interview Summary

**Key Discussions**:

- Verification tasks must be **as strict as possible** (user's explicit request)
- TDD approach: write failing tests first, then wire pipeline, then verify all pass
- Vitest 4.0.18 already in place — no test infra setup needed
- Previous plan (init-only-theme) is 100% complete, 1142 tests passing

**Research Findings**:

- **Dead code confirmed**: `generateConfigModule()`, `writeConfigModule()`, `getConfigModulePath()`, `unflattenColors()` — all built per spec in Task 3, never called from production
- **`state.generatedConfigPath`** — declared in state.ts:169, initialized to `""`, never populated
- **`state.configProviderImportName`** — set but never used (should be passed to `generateConfigModule()`)
- **Plugin lifecycle**: State is per-file, options are per-compilation closures. `Program.enter()` is the correct hook for file generation
- **`addConfigImport()`** expects ABSOLUTE path, computes relative automatically, strips `.js` extension
- **`findTailwindConfig()`** is cached — safe to call per-file

### Metis Review

**Identified Gaps** (all addressed):

- `findTailwindConfig()` returning `null` with `configProviderEnabled` → guard with warning added to spec
- Test filenames use relative paths → spec requires absolute paths for deterministic relative path computation
- ~20+ snapshots will break → spec includes snapshot update task
- Parallel Babel workers writing same file → `writeConfigModule()` idempotency check is sufficient; plugin-level dedup Set adds extra safety
- `configProviderImportName` unused → now passed to `generateConfigModule()` as designed
- Duplicate `FullResolvedTheme` type → explicitly deferred (MUST NOT consolidate)

---

## Work Objectives

### Core Objective

Wire the existing `configModuleGenerator.ts` functions into the Babel plugin lifecycle so that:

1. A `.generated.tailwind.config.js` file is produced next to the user's `tailwind.config.*`
2. Components import `__twConfig` from that generated file (not directly from the user's provider)

### Concrete Deliverables

- Modified `src/babel/plugin.ts` — ~15 lines added in `Program.enter()` after state initialization
- Modified `src/babel/plugin/visitors/program.ts` — 1 line changed + 1 guard line added at line 126
- Updated `src/babel/plugin.configProvider.test.ts` — All 29 tests with mocked `findTailwindConfig` and absolute filenames
- Updated `src/babel/plugin/visitors/program.test.ts` — Import injection tests
- Updated `test/snapshots/babel/plugin.configProvider.test.ts.snap` — All snapshots regenerated
- Reverted `feature-init-only-theme.md` and `init-only-theme-implementation-plan.md` to generated-file architecture

### Definition of Done

- [ ] `bun run test` — all tests pass (1142+ tests, 0 failures)
- [ ] `bun run build` — clean build, no errors
- [ ] `bun run typecheck` — no TypeScript errors
- [ ] `bun run lint` — no ESLint errors
- [ ] Components in test output import from `.generated.tailwind.config` path, NOT from user's provider module
- [ ] `state.generatedConfigPath` is populated with absolute path in every configProvider-enabled file
- [ ] `findTailwindConfig()` returning `null` logs warning and skips generation (no crash)

### Must Have

- Plugin-level `generatedConfigPaths` Set for deduplication in `plugin.ts`
- `findTailwindConfig()` call in `Program.enter()` after state initialization
- Guard: `findTailwindConfig()` returns `null` + `configProviderEnabled` → warn + skip
- `getConfigModulePath()` → `generateConfigModule()` → `writeConfigModule()` → `state.generatedConfigPath = genPath`
- `program.ts:126` uses `state.generatedConfigPath` with non-empty guard
- All configProvider E2E tests mock `findTailwindConfig` for deterministic paths
- Test filenames set to absolute paths for stable relative path computation

### Must NOT Have (Guardrails)

- **NO changes** to `configProvider` option schema
- **NO modifications** to `configModuleGenerator.ts`, `configRefResolver.ts`, or any parser files
- **NO consolidation** of duplicate `FullResolvedTheme` type
- **NO refactoring** of `extractCustomTheme()` signature
- **NO new features** beyond wiring the existing pipeline
- **NO changes** to ref resolution or AST emission logic
- **NO `as any`** casts, `@ts-ignore`, or empty catch blocks
- **NO console.log** in production code (only `console.warn` for the null-config guard)

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.
> Acceptance criteria requiring "user manually tests/confirms" are FORBIDDEN.

### Test Decision

- **Infrastructure exists**: YES (Vitest 4.0.18)
- **Automated tests**: TDD — write/update failing tests first, then implement, then verify pass
- **Framework**: Vitest (`bun run test`)
- **If TDD**: Each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy

Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Unit/Integration Tests**: Use Bash (`bun run test {file}`) — Run specific test suites, assert pass counts
- **Build Verification**: Use Bash (`bun run build && bun run typecheck && bun run lint`) — Assert clean output
- **Snapshot Verification**: Use Grep — Search snapshot files for correct import paths
- **File Generation**: Use Bash (`ls`, `cat`) — Verify generated files exist with correct content

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — test infrastructure + docs):
├── Task 1: Update test infrastructure (mocks, filenames, failing tests) [deep]
└── Task 5: Revert docs to generated-file architecture [quick]

Wave 2 (After Wave 1 — implementation, SEQUENTIAL):
├── Task 2: Wire generation pipeline in plugin.ts (depends: 1) [deep]
├── Task 3: Fix program.ts:126 import path (depends: 2) [quick]
└── Task 4: Update snapshots and E2E assertions (depends: 3) [unspecified-high]

Wave FINAL (After ALL tasks — independent review, 4 parallel):
├── Task F1: Plan compliance audit [oracle]
├── Task F2: Code quality review [unspecified-high]
├── Task F3: Real QA — full test suite + snapshot inspection [unspecified-high]
└── Task F4: Scope fidelity check [deep]

Critical Path: Task 1 → Task 2 → Task 3 → Task 4 → F1-F4
Parallel Speedup: ~30% (Wave 1 parallelism + Final wave parallelism)
Max Concurrent: 4 (Final wave)
```

### Dependency Matrix

| Task | Depends On | Blocks  | Wave  |
| ---- | ---------- | ------- | ----- |
| 1    | —          | 2, 3, 4 | 1     |
| 5    | —          | —       | 1     |
| 2    | 1          | 3       | 2     |
| 3    | 2          | 4       | 2     |
| 4    | 3          | F1-F4   | 2     |
| F1   | 4, 5       | —       | FINAL |
| F2   | 4, 5       | —       | FINAL |
| F3   | 4, 5       | —       | FINAL |
| F4   | 4, 5       | —       | FINAL |

### Agent Dispatch Summary

- **Wave 1**: **2 tasks** — T1 → `deep`, T5 → `quick`
- **Wave 2**: **3 tasks** (sequential) — T2 → `deep`, T3 → `quick`, T4 → `unspecified-high`
- **Wave FINAL**: **4 tasks** (parallel) — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Update Test Infrastructure — Mock `findTailwindConfig`, Fix Filenames, Write Failing Tests

  **What to do**:
  - **Mock `findTailwindConfig`** in `plugin.configProvider.test.ts`:
    - At the top of the test file, add `vi.mock("../config-loader", ...)` that mocks `findTailwindConfig` to return a deterministic absolute path like `/mock/project/tailwind.config.ts`
    - This ensures `getConfigModulePath()` returns a predictable path like `/mock/project/.generated.tailwind.config.js`
    - The mock must still allow the real `extractCustomTheme()` to work (it calls `findTailwindConfig` internally) — use `vi.importActual` for all other exports
  - **Fix test filenames to absolute paths**:
    - In `plugin.configProvider.test.ts`, update the `filename` option in all `transformSync` calls from relative (`"test.tsx"`) to absolute (`"/mock/project/src/test.tsx"`)
    - This makes the relative path computation in `addConfigImport()` deterministic: `../../.generated.tailwind.config` (from `/mock/project/src/test.tsx` to `/mock/project/.generated.tailwind.config.js`)
  - **Update program.test.ts**:
    - In `programExit` tests that test config import injection, ensure `state.generatedConfigPath` is set (not `state.configProviderImportFrom`) to an absolute path
    - Mock or set `state.file.opts.filename` to an absolute path for deterministic relative computation
  - **Write/update test assertions** (these should FAIL after this task, before Task 2-3):
    - Assert that transformed output imports `__twConfig` from a path containing `.generated.tailwind.config`, NOT from the user's provider module path
    - Assert `state.generatedConfigPath` would be populated (program.test.ts level)
  - **Important**: After this task, configProvider tests WILL FAIL — this is expected (RED phase of TDD). They fail because `plugin.ts` doesn't yet wire the pipeline and `program.ts` still uses `configProviderImportFrom`.

  **Must NOT do**:
  - Modify `configModuleGenerator.ts` or `configRefResolver.ts`
  - Change the `configProvider` option schema
  - Add new test files — only update existing ones

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Test infrastructure changes require understanding of Vitest mocking, Babel transform test patterns, and the full import path computation chain. Multiple files need coordinated changes.
  - **Skills**: []
    - No special skills needed — pure TypeScript/Vitest work
  - **Skills Evaluated but Omitted**:
    - `playwright`: No browser testing involved
    - `git-master`: No git operations in this task

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 5)
  - **Parallel Group**: Wave 1 (with Task 5)
  - **Blocks**: Tasks 2, 3, 4
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL — executor has NO interview context):

  **Pattern References** (existing code to follow):
  - `src/babel/plugin.configProvider.test.ts` — The main E2E test file with 29 tests. All `transformSync` calls use `filename: "test.tsx"` → change to absolute. All assertions check output code → update to expect `.generated.tailwind.config` import path
  - `src/babel/plugin/visitors/program.test.ts` — Unit tests for `programExit()`. The `addConfigImport` calls need `state.generatedConfigPath` instead of `state.configProviderImportFrom`
  - `test/helpers/babelTransform.ts` — Shared test helper. Check if `filename` is passed through — may need to accept absolute path option

  **API/Type References** (contracts to implement against):
  - `src/babel/plugin/state.ts:169` — `generatedConfigPath: string` field (initialized to `""`)
  - `src/babel/plugin/state.ts:167` — `configProviderImportName: string` field (set but never used — will be used after Task 2)
  - `src/babel/config-loader.ts` — `findTailwindConfig()` function signature: `(dir: string) => string | null`
  - `src/babel/utils/configModuleGenerator.ts:49` — `getConfigModulePath(tailwindConfigPath: string) => string` — returns absolute path to `.generated.tailwind.config.js`

  **Test References** (testing patterns to follow):
  - `src/babel/plugin.configProvider.test.ts:describe("configProvider option")` — Current test structure. Each test calls `transformSync` with configProvider options and asserts on the output code string
  - `src/babel/plugin.test.ts` — Non-configProvider tests for comparison of test patterns and mocking approaches

  **External References**:
  - Vitest mocking: `vi.mock()`, `vi.importActual()` — https://vitest.dev/api/vi.html#vi-mock

  **WHY Each Reference Matters**:
  - `plugin.configProvider.test.ts`: This is THE file being modified — contains all 29 E2E tests that need mock + filename + assertion updates
  - `program.test.ts`: Unit-level tests that verify import injection uses the correct state field
  - `babelTransform.ts`: Shared helper — need to check if filename passthrough works with absolute paths
  - `state.ts`: Defines the exact field names and types the tests must reference
  - `config-loader.ts`: The function being mocked — need exact signature for mock implementation
  - `configModuleGenerator.ts:49`: `getConfigModulePath` return value is what tests assert against

  **Acceptance Criteria**:

  **TDD Phase — RED (tests should FAIL):**
  - [ ] `vi.mock` for `findTailwindConfig` is set up in `plugin.configProvider.test.ts`
  - [ ] All `transformSync` calls use absolute filename like `/mock/project/src/test.tsx`
  - [ ] Test assertions check for `.generated.tailwind.config` in import paths
  - [ ] `bun run test src/babel/plugin.configProvider.test.ts` — tests FAIL (expected: they reference generated path but plugin doesn't produce it yet)
  - [ ] `bun run typecheck` — PASSES (no type errors in test changes)

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Verify vi.mock is correctly set up for findTailwindConfig
    Tool: Bash (grep)
    Preconditions: Task 1 changes applied to plugin.configProvider.test.ts
    Steps:
      1. grep -n "vi.mock.*config-loader" src/babel/plugin.configProvider.test.ts
      2. Assert: at least 1 match found
      3. grep -n "findTailwindConfig" src/babel/plugin.configProvider.test.ts
      4. Assert: mock returns deterministic path like "/mock/project/tailwind.config.ts"
    Expected Result: vi.mock call present, mock returns absolute path
    Failure Indicators: No vi.mock found, or mock returns relative path
    Evidence: .sisyphus/evidence/task-1-mock-setup.txt

  Scenario: Verify all test filenames are absolute paths
    Tool: Bash (grep)
    Preconditions: Task 1 changes applied
    Steps:
      1. grep -n 'filename:' src/babel/plugin.configProvider.test.ts
      2. Assert: ALL filename values start with "/" (absolute path)
      3. Assert: ZERO occurrences of 'filename: "test.tsx"' (old relative pattern)
    Expected Result: Every filename is absolute (e.g., /mock/project/src/test.tsx)
    Failure Indicators: Any relative filename like "test.tsx" or "./test.tsx"
    Evidence: .sisyphus/evidence/task-1-absolute-filenames.txt

  Scenario: Verify tests FAIL (RED phase — expected failure)
    Tool: Bash
    Preconditions: Task 1 changes applied, Tasks 2-3 NOT yet applied
    Steps:
      1. bun run test src/babel/plugin.configProvider.test.ts 2>&1 || true
      2. Assert: exit code is non-zero (tests fail)
      3. Assert: output contains "FAIL" or failure count > 0
      4. Assert: failures relate to import path mismatch (expected .generated.tailwind.config but got provider path)
    Expected Result: Tests fail because plugin doesn't produce generated config path yet
    Failure Indicators: Tests pass (would mean assertions aren't checking for generated path)
    Evidence: .sisyphus/evidence/task-1-red-phase.txt

  Scenario: Verify TypeScript compiles cleanly
    Tool: Bash
    Preconditions: Task 1 changes applied
    Steps:
      1. bun run typecheck
      2. Assert: exit code 0
    Expected Result: No type errors
    Failure Indicators: Type errors in test files
    Evidence: .sisyphus/evidence/task-1-typecheck.txt
  ```

  **Evidence to Capture:**
  - [ ] task-1-mock-setup.txt — grep output showing vi.mock presence
  - [ ] task-1-absolute-filenames.txt — grep output showing all filenames are absolute
  - [ ] task-1-red-phase.txt — test runner output showing expected failures
  - [ ] task-1-typecheck.txt — typecheck output showing clean compilation

  **Commit**: YES
  - Message: `test(configProvider): update test infra with mocked findTailwindConfig and absolute filenames`
  - Files: `src/babel/plugin.configProvider.test.ts`, `src/babel/plugin/visitors/program.test.ts`, `test/helpers/babelTransform.ts`
  - Pre-commit: `bun run typecheck`

- [x] 2. Wire Generation Pipeline in `plugin.ts` Program.enter()

  **What to do**:
  - **Add imports** at the top of `plugin.ts`:
    - `import { findTailwindConfig } from "./config-loader";`
    - `import { generateConfigModule, writeConfigModule, getConfigModulePath } from "./utils/configModuleGenerator";`
    - `import { dirname } from "node:path";`
  - **Add plugin-level dedup Set** in the plugin factory closure (before the `return { ... }` object):
    - `const generatedConfigPaths = new Set<string>();`
  - **Add generation pipeline** in `Program.enter()` visitor, AFTER the `Object.assign(state, initialState)` line (after line ~64):
    ```typescript
    if (state.configProviderEnabled) {
      const tailwindConfigPath = findTailwindConfig(dirname(state.file.opts.filename ?? ""));
      if (tailwindConfigPath) {
        const genPath = getConfigModulePath(tailwindConfigPath);
        if (!generatedConfigPaths.has(genPath)) {
          const content = generateConfigModule(
            state.fullResolvedTheme,
            state.configProviderImportFrom,
            state.configProviderImportName,
          );
          writeConfigModule(genPath, content);
          generatedConfigPaths.add(genPath);
        }
        state.generatedConfigPath = genPath;
      } else {
        console.warn(
          "[react-native-tailwind] No tailwind.config.* found. Config provider feature requires a tailwind config file.",
        );
      }
    }
    ```
  - **Important**: `fullResolvedTheme` is already built by `createInitialState()` at this point. The generation uses the merged theme (built-in defaults + user's custom theme) to produce the flat config object.
  - **After this task**: The generated file IS being produced, but `program.ts` still reads from `configProviderImportFrom`. Tests may still fail until Task 3.

  **Must NOT do**:
  - Modify `configModuleGenerator.ts` — import and call only
  - Modify `config-loader.ts` — import and call only
  - Change any other visitor files
  - Add any test code (that's Task 1 and Task 4)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Requires understanding plugin lifecycle, state flow, and correct insertion point. Must get the dedup Set placement right (closure scope, not per-file).
  - **Skills**: []
    - No special skills needed — pure TypeScript plugin wiring
  - **Skills Evaluated but Omitted**:
    - `git-master`: No git operations in this task

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequential after Task 1)
  - **Parallel Group**: Wave 2 (sequential)
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References** (CRITICAL — executor has NO interview context):

  **Pattern References** (existing code to follow):
  - `src/babel/plugin.ts:40-70` — The `Program.enter()` visitor. Line ~57 has `const initialState = createInitialState(...)`. Line ~64 has `Object.assign(state, initialState)`. The NEW code goes AFTER line 64, before the closing `}` of Program.enter.
  - `src/babel/plugin.ts:30-38` — Existing imports. Add new imports here following the same style (relative paths, named imports).
  - `src/babel/plugin.ts:~25` — The plugin factory function scope. The `generatedConfigPaths` Set goes here, at the same level as other closure variables.

  **API/Type References** (contracts to implement against):
  - `src/babel/utils/configModuleGenerator.ts:53` — `generateConfigModule(theme: FullResolvedTheme, providerImportFrom: string, providerImportName: string): string` — Returns generated JS source code
  - `src/babel/utils/configModuleGenerator.ts:99` — `writeConfigModule(outputPath: string, content: string): void` — Writes file, skips if content unchanged
  - `src/babel/utils/configModuleGenerator.ts:49` — `getConfigModulePath(tailwindConfigPath: string): string` — Returns absolute path: `{dir}/.generated.tailwind.config.js`
  - `src/babel/config-loader.ts` — `findTailwindConfig(dir: string): string | null` — Cached lookup, returns absolute path or null
  - `src/babel/plugin/state.ts:169` — `generatedConfigPath: string` — Set this to the absolute path returned by `getConfigModulePath()`
  - `src/babel/plugin/state.ts:165` — `configProviderEnabled: boolean` — Guard condition
  - `src/babel/plugin/state.ts:166` — `configProviderImportFrom: string` — Pass to `generateConfigModule()` as `providerImportFrom`
  - `src/babel/plugin/state.ts:167` — `configProviderImportName: string` — Pass to `generateConfigModule()` as `providerImportName`
  - `src/babel/plugin/state.ts:170-171` — `fullResolvedTheme: FullResolvedTheme` — Pass to `generateConfigModule()` as first arg

  **External References**:
  - `node:path` — `dirname()` — Extract directory from filename for `findTailwindConfig()` call

  **WHY Each Reference Matters**:
  - `plugin.ts:40-70`: Exact insertion point — wrong placement breaks the entire pipeline
  - `plugin.ts:30-38`: Import style must match existing code for consistency
  - `plugin.ts:~25`: Dedup Set MUST be in closure scope (shared across files), NOT in Program.enter (per-file)
  - `configModuleGenerator.ts`: Function signatures — arguments must match exactly
  - `config-loader.ts`: Return type `string | null` — MUST guard against null
  - `state.ts`: Field names must be exact — typos will silently fail

  **Acceptance Criteria**:

  **Implementation Checks:**
  - [ ] `plugin.ts` imports `findTailwindConfig`, `generateConfigModule`, `writeConfigModule`, `getConfigModulePath`, `dirname`
  - [ ] `generatedConfigPaths` Set declared in plugin closure scope (NOT inside Program.enter)
  - [ ] Generation pipeline added AFTER `Object.assign(state, initialState)` in Program.enter
  - [ ] `state.generatedConfigPath` is set to `genPath` when `findTailwindConfig` returns non-null
  - [ ] Warning logged when `findTailwindConfig` returns null and `configProviderEnabled` is true
  - [ ] `bun run typecheck` — PASSES

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Verify imports added correctly to plugin.ts
    Tool: Bash (grep)
    Preconditions: Task 2 changes applied to plugin.ts
    Steps:
      1. grep -n "findTailwindConfig" src/babel/plugin.ts
      2. Assert: import line found AND usage in Program.enter found (2+ matches)
      3. grep -n "generateConfigModule" src/babel/plugin.ts
      4. Assert: import line found AND usage found (2+ matches)
      5. grep -n "writeConfigModule" src/babel/plugin.ts
      6. Assert: import line found AND usage found (2+ matches)
      7. grep -n "getConfigModulePath" src/babel/plugin.ts
      8. Assert: import line found AND usage found (2+ matches)
      9. grep -n "dirname" src/babel/plugin.ts
      10. Assert: import from "node:path" found
    Expected Result: All 5 imports present with both import and usage lines
    Failure Indicators: Missing import or missing usage
    Evidence: .sisyphus/evidence/task-2-imports.txt

  Scenario: Verify dedup Set is in closure scope (not per-file)
    Tool: Bash (grep with context)
    Preconditions: Task 2 changes applied
    Steps:
      1. grep -n -B5 -A2 "generatedConfigPaths" src/babel/plugin.ts
      2. Assert: Set declaration is OUTSIDE Program.enter (line number < Program.enter line number)
      3. Assert: Set is used inside Program.enter (`.has()` and `.add()` calls)
    Expected Result: Set declared in closure, used in visitor
    Failure Indicators: Set declared inside Program.enter (would reset per-file)
    Evidence: .sisyphus/evidence/task-2-dedup-set.txt

  Scenario: Verify null guard for findTailwindConfig
    Tool: Bash (grep)
    Preconditions: Task 2 changes applied
    Steps:
      1. grep -n "console.warn" src/babel/plugin.ts
      2. Assert: warning message contains "No tailwind.config"
      3. grep -n "tailwindConfigPath" src/babel/plugin.ts
      4. Assert: null check present (if block or guard clause)
    Expected Result: Null guard present with descriptive warning
    Failure Indicators: No null check, or crash on null
    Evidence: .sisyphus/evidence/task-2-null-guard.txt

  Scenario: Verify state.generatedConfigPath is set
    Tool: Bash (grep)
    Preconditions: Task 2 changes applied
    Steps:
      1. grep -n "state.generatedConfigPath" src/babel/plugin.ts
      2. Assert: assignment line found (= genPath or similar)
      3. Assert: assignment is inside the non-null branch of findTailwindConfig check
    Expected Result: generatedConfigPath populated with absolute path from getConfigModulePath
    Failure Indicators: Field never set, or set unconditionally (no null guard)
    Evidence: .sisyphus/evidence/task-2-state-assignment.txt

  Scenario: Verify TypeScript compiles cleanly
    Tool: Bash
    Preconditions: Task 2 changes applied
    Steps:
      1. bun run typecheck
      2. Assert: exit code 0
    Expected Result: No type errors
    Failure Indicators: Type errors in plugin.ts (wrong argument types to generateConfigModule, etc.)
    Evidence: .sisyphus/evidence/task-2-typecheck.txt
  ```

  **Evidence to Capture:**
  - [ ] task-2-imports.txt — grep output showing all imports and usages
  - [ ] task-2-dedup-set.txt — grep output showing Set in closure scope
  - [ ] task-2-null-guard.txt — grep output showing null guard and warning
  - [ ] task-2-state-assignment.txt — grep output showing generatedConfigPath assignment
  - [ ] task-2-typecheck.txt — typecheck output

  **Commit**: YES
  - Message: `feat(plugin): wire generateConfigModule pipeline in Program.enter()`
  - Files: `src/babel/plugin.ts`
  - Pre-commit: `bun run typecheck`

- [x] 3. Fix `program.ts:126` — Use `generatedConfigPath` Instead of `configProviderImportFrom`

  **What to do**:
  - **Change the import injection line** in `src/babel/plugin/visitors/program.ts` at line ~126:
    - Current (BROKEN):
      ```typescript
      addConfigImport(path, state.configProviderImportFrom, state.file.opts.filename ?? "", t);
      ```
    - Fixed:
      ```typescript
      if (state.generatedConfigPath) {
        addConfigImport(path, state.generatedConfigPath, state.file.opts.filename ?? "", t);
      }
      ```
  - **Why the guard**: If `findTailwindConfig()` returned null in `plugin.ts`, `generatedConfigPath` stays as `""`. The guard prevents injecting an import with an empty path.
  - **This is a 2-line change** (add `if` guard + change field name). Nothing else in this file should be touched.
  - **After this task**: The full pipeline is wired. Tests from Task 1 should now PASS (GREEN phase).

  **Must NOT do**:
  - Modify any other line in `program.ts` beyond the import injection block (~line 124-128)
  - Add fallback logic (e.g., "if no generatedConfigPath, use configProviderImportFrom") — if generated path is empty, we skip the import entirely
  - Touch `configModuleGenerator.ts` or `configRefResolver.ts`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single 2-line change in one file. Extremely focused scope.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `git-master`: Trivial change, no git complexity

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequential after Task 2)
  - **Parallel Group**: Wave 2 (sequential)
  - **Blocks**: Task 4
  - **Blocked By**: Task 2

  **References** (CRITICAL — executor has NO interview context):

  **Pattern References** (existing code to follow):
  - `src/babel/plugin/visitors/program.ts:120-130` — The `programExit()` function. Line ~124-126 is the config import injection block. This is the ONLY code to modify.
  - `src/babel/plugin/visitors/program.ts:4-10` — Imports. `addConfigImport` is already imported from `../utils/styleInjection`.

  **API/Type References** (contracts to implement against):
  - `src/babel/utils/styleInjection.ts:addConfigImport()` — Signature: `(path, configModulePath: string, filename: string, t)`. The `configModulePath` parameter expects an ABSOLUTE path. It computes the relative path internally.
  - `src/babel/plugin/state.ts:169` — `generatedConfigPath: string` — This is the field to use (absolute path to `.generated.tailwind.config.js`)
  - `src/babel/plugin/state.ts:166` — `configProviderImportFrom: string` — This is the field to STOP using (user's provider module path)

  **WHY Each Reference Matters**:
  - `program.ts:120-130`: The exact location of the bug. Line 126 currently uses the wrong state field.
  - `styleInjection.ts`: Understanding that the parameter expects absolute path confirms `generatedConfigPath` is the right replacement.
  - `state.ts`: Confirms both field names exist and their semantics.

  **Acceptance Criteria**:

  **Implementation Checks:**
  - [ ] `program.ts:~126` uses `state.generatedConfigPath` (not `state.configProviderImportFrom`)
  - [ ] Guard `if (state.generatedConfigPath)` wraps the `addConfigImport` call
  - [ ] No other changes in `program.ts`
  - [ ] `bun run typecheck` — PASSES

  **TDD Phase — GREEN (tests should PASS):**
  - [ ] `bun run test src/babel/plugin.configProvider.test.ts` — tests now PASS (import paths match generated config)
  - [ ] `bun run test src/babel/plugin/visitors/program.test.ts` — PASSES

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Verify program.ts uses generatedConfigPath
    Tool: Bash (grep)
    Preconditions: Task 3 changes applied to program.ts
    Steps:
      1. grep -n "generatedConfigPath" src/babel/plugin/visitors/program.ts
      2. Assert: at least 1 match on the addConfigImport line
      3. grep -n "configProviderImportFrom" src/babel/plugin/visitors/program.ts
      4. Assert: ZERO matches (old field no longer used for import injection)
    Expected Result: generatedConfigPath used, configProviderImportFrom removed from import injection
    Failure Indicators: configProviderImportFrom still present on the addConfigImport line
    Evidence: .sisyphus/evidence/task-3-field-change.txt

  Scenario: Verify guard clause present
    Tool: Bash (grep with context)
    Preconditions: Task 3 changes applied
    Steps:
      1. grep -n -B2 -A2 "addConfigImport" src/babel/plugin/visitors/program.ts
      2. Assert: `if (state.generatedConfigPath)` appears before the addConfigImport call
    Expected Result: Guard prevents empty path import injection
    Failure Indicators: No guard, or guard uses wrong condition
    Evidence: .sisyphus/evidence/task-3-guard-clause.txt

  Scenario: Verify configProvider tests now PASS (GREEN phase)
    Tool: Bash
    Preconditions: Tasks 1, 2, and 3 all applied
    Steps:
      1. bun run test src/babel/plugin.configProvider.test.ts
      2. Assert: exit code 0
      3. Assert: all tests pass (0 failures)
    Expected Result: All 29 configProvider E2E tests pass
    Failure Indicators: Any test failure (import path mismatch, snapshot mismatch)
    Evidence: .sisyphus/evidence/task-3-green-phase.txt

  Scenario: Verify program.ts unit tests pass
    Tool: Bash
    Preconditions: Tasks 1 and 3 applied
    Steps:
      1. bun run test src/babel/plugin/visitors/program.test.ts
      2. Assert: exit code 0
    Expected Result: All program.ts tests pass
    Failure Indicators: Failures related to config import injection
    Evidence: .sisyphus/evidence/task-3-program-tests.txt
  ```

  **Evidence to Capture:**
  - [ ] task-3-field-change.txt — grep output showing field name change
  - [ ] task-3-guard-clause.txt — grep output showing guard clause
  - [ ] task-3-green-phase.txt — test runner output showing all configProvider tests pass
  - [ ] task-3-program-tests.txt — program.ts test output

  **Commit**: YES
  - Message: `fix(program): use generatedConfigPath instead of configProviderImportFrom for imports`
  - Files: `src/babel/plugin/visitors/program.ts`
  - Pre-commit: `bun run typecheck`

- [x] 4. Update All Snapshots and E2E Assertions for Generated Config Path

  **What to do**:
  - **Run the full test suite** with `--update` flag to regenerate snapshots:
    - `bun run test --update` or `bun run test -u` (Vitest snapshot update)
    - This regenerates `test/snapshots/babel/plugin.configProvider.test.ts.snap` with the new import paths
  - **Manually verify** the updated snapshots contain correct paths:
    - All `__twConfig` imports should reference a relative path to `.generated.tailwind.config` (e.g., `../../.generated.tailwind.config`)
    - ZERO references to the user's provider module path in import statements
  - **Update any hardcoded assertions** in `plugin.configProvider.test.ts` that don't use snapshots:
    - String assertions like `expect(output).toContain("import ... from ...")` — update the expected import path
  - **Run the FULL test suite** after updates:
    - `bun run test` — ALL 1142+ tests must pass
    - Not just configProvider tests — other tests must not regress
  - **Verify no stale snapshots remain**:
    - `bun run test --reporter verbose` — check for "obsolete snapshots" warnings

  **Must NOT do**:
  - Modify production code (`plugin.ts`, `program.ts`, etc.)
  - Change test logic — only update expected values and snapshots
  - Delete snapshot entries (only update them)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requires running test suite, updating snapshots, manually verifying paths in snapshot files, and running full regression. Moderate complexity, multiple files.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: No browser testing
    - `git-master`: Standard commit, no complexity

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequential after Task 3)
  - **Parallel Group**: Wave 2 (sequential)
  - **Blocks**: F1-F4
  - **Blocked By**: Task 3

  **References** (CRITICAL — executor has NO interview context):

  **Pattern References** (existing code to follow):
  - `test/snapshots/babel/plugin.configProvider.test.ts.snap` — The snapshot file to be regenerated. Currently contains import paths pointing to user's provider module → should change to `.generated.tailwind.config` relative path
  - `src/babel/plugin.configProvider.test.ts` — All 29 E2E tests. Some use `toMatchSnapshot()`, some use `toContain()` or `toMatch()` string assertions. Both types need correct expected paths.

  **API/Type References**:
  - `src/babel/utils/configModuleGenerator.ts:49` — `getConfigModulePath()` — returns `{dir}/.generated.tailwind.config.js`. The relative path from `/mock/project/src/test.tsx` to `/mock/project/.generated.tailwind.config.js` would be `../.generated.tailwind.config` (no `.js` extension, stripped by `addConfigImport`)

  **WHY Each Reference Matters**:
  - `*.snap`: This is the primary file being regenerated — all snapshot comparisons live here
  - `plugin.configProvider.test.ts`: Contains both snapshot-based and string-based assertions that need updating
  - `getConfigModulePath()`: Determines the exact path that appears in snapshots

  **Acceptance Criteria**:

  **Full Regression:**
  - [ ] `bun run test` — ALL tests pass (1142+ tests, 0 failures)
  - [ ] Zero "obsolete snapshots" warnings
  - [ ] Zero stale snapshot entries

  **Snapshot Content:**
  - [ ] ALL snapshot `__twConfig` imports reference `.generated.tailwind.config` in their path
  - [ ] ZERO snapshot entries contain import from user's provider module path

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Verify all tests pass after snapshot update
    Tool: Bash
    Preconditions: Tasks 1-3 applied, snapshots regenerated
    Steps:
      1. bun run test
      2. Assert: exit code 0
      3. Assert: test count >= 1142
      4. Assert: 0 failures
      5. Assert: no "obsolete snapshot" warnings in output
    Expected Result: Full green test suite with no warnings
    Failure Indicators: Any failure, reduced test count, stale snapshot warnings
    Evidence: .sisyphus/evidence/task-4-full-suite.txt

  Scenario: Verify snapshot content references generated config path
    Tool: Bash (grep)
    Preconditions: Snapshots regenerated
    Steps:
      1. grep -c "generated.tailwind.config" test/snapshots/babel/plugin.configProvider.test.ts.snap
      2. Assert: count > 0 (generated path present in snapshots)
      3. grep -c "configProviderImportFrom\|from.*themeProvider" test/snapshots/babel/plugin.configProvider.test.ts.snap || true
      4. Assert: count = 0 (no direct provider imports in snapshots)
    Expected Result: All snapshot imports use generated config path
    Failure Indicators: Provider module path found in snapshots, or generated path missing
    Evidence: .sisyphus/evidence/task-4-snapshot-content.txt

  Scenario: Verify no direct provider imports in test output
    Tool: Bash (grep)
    Preconditions: All tasks applied
    Steps:
      1. grep -rn "__twConfig.*from.*themeProvider" src/babel/plugin.configProvider.test.ts || true
      2. Assert: ZERO matches in test assertions for direct provider imports
      3. grep -rn "__twConfig.*from.*generated" src/babel/plugin.configProvider.test.ts
      4. Assert: matches found (assertions check for generated path)
    Expected Result: All test assertions expect generated config path
    Failure Indicators: Any assertion still expects direct provider import
    Evidence: .sisyphus/evidence/task-4-assertion-paths.txt

  Scenario: Verify build and types still clean
    Tool: Bash
    Preconditions: All tasks applied
    Steps:
      1. bun run build
      2. Assert: exit code 0
      3. bun run typecheck
      4. Assert: exit code 0
      5. bun run lint
      6. Assert: exit code 0
    Expected Result: Clean build, types, and lint
    Failure Indicators: Any error in build, typecheck, or lint
    Evidence: .sisyphus/evidence/task-4-build-clean.txt
  ```

  **Evidence to Capture:**
  - [ ] task-4-full-suite.txt — full test suite output (all 1142+ tests)
  - [ ] task-4-snapshot-content.txt — grep output verifying snapshot import paths
  - [ ] task-4-assertion-paths.txt — grep output verifying test assertion paths
  - [ ] task-4-build-clean.txt — build + typecheck + lint output

  **Commit**: YES
  - Message: `test(configProvider): update snapshots and E2E assertions for generated config path`
  - Files: `src/babel/plugin.configProvider.test.ts`, `test/snapshots/babel/plugin.configProvider.test.ts.snap`, `src/babel/plugin/visitors/program.test.ts`
  - Pre-commit: `bun run test`

- [x] 5. Revert Docs to Generated-File Architecture

  **What to do**:
  - **Revert `feature-init-only-theme.md`** to describe the 3-layer architecture:
    - User's provider module → Generated `.generated.tailwind.config.js` file → Component imports
    - Find sections that describe "components import directly from provider" and change to "components import from generated config file"
    - Ensure the architecture diagram shows the generated file as the intermediary
  - **Revert `init-only-theme-implementation-plan.md`** similarly:
    - Find references to direct provider imports and update to generated file imports
    - Update any code examples showing direct provider imports
  - **Important**: These docs were incorrectly updated in a previous session to match the broken implementation. We're restoring them to the originally intended architecture.
  - **Use `git log` and `git diff` to find the original correct content** if needed — the docs were correct before Task 8's commit.

  **Must NOT do**:
  - Change any source code
  - Add new documentation files
  - Modify any test files

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Documentation text changes only. Find-and-replace style edits in 2 markdown files.
  - **Skills**: [`git-master`]
    - `git-master`: May need to check git history to find the original correct doc content before Task 8 changed it
  - **Skills Evaluated but Omitted**:
    - `playwright`: No browser work

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 1)
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: None (F1-F4 depend on all tasks, including this)
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL — executor has NO interview context):

  **Pattern References**:
  - `feature-init-only-theme.md` — The feature proposal document. Contains architecture description, diagrams, and code examples. Find sections mentioning provider imports and update to generated file.
  - `init-only-theme-implementation-plan.md` — The implementation plan. Contains technical details about how the pipeline works. Update to match the 3-layer architecture.

  **Git History References**:
  - Commit `b5de6d0` (Task 8) — This is when docs were incorrectly updated. Use `git diff b5de6d0~1 b5de6d0 -- feature-init-only-theme.md` to see what was changed and revert those specific changes.
  - Commit `22c412c` (Task 6) — Contains the correct architecture description (before Task 8 changed it).

  **Architecture to Restore**:
  - Layer 1: User's provider module (`configProvider: { importFrom: "./themeProvider", ... }`)
  - Layer 2: Generated file (`.generated.tailwind.config.js`) — imports provider, calls `provideConfig()`, `_flattenColors()`, exports `__twConfig`
  - Layer 3: Component files import `__twConfig` from the generated file (NOT from user's provider)

  **WHY Each Reference Matters**:
  - `feature-init-only-theme.md`: User-facing proposal must accurately describe what the plugin does
  - `init-only-theme-implementation-plan.md`: Technical reference must match actual implementation
  - Git history: Provides the exact diff to revert

  **Acceptance Criteria**:
  - [ ] `feature-init-only-theme.md` describes 3-layer architecture with generated file
  - [ ] `init-only-theme-implementation-plan.md` describes 3-layer architecture with generated file
  - [ ] ZERO references to "components import directly from provider" in either doc
  - [ ] Architecture diagrams show `.generated.tailwind.config.js` as intermediary

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Verify docs reference generated file architecture
    Tool: Bash (grep)
    Preconditions: Task 5 changes applied to both docs
    Steps:
      1. grep -c "generated.tailwind.config\|\.generated" feature-init-only-theme.md
      2. Assert: count > 0 (generated file mentioned)
      3. grep -c "generated.tailwind.config\|\.generated" init-only-theme-implementation-plan.md
      4. Assert: count > 0 (generated file mentioned)
      5. grep -ic "import.*directly.*from.*provider" feature-init-only-theme.md || true
      6. Assert: count = 0 (no direct provider import language)
    Expected Result: Docs describe generated file as intermediary
    Failure Indicators: Missing generated file references, or direct provider import language remains
    Evidence: .sisyphus/evidence/task-5-docs-content.txt

  Scenario: Verify 3-layer architecture is described
    Tool: Bash (grep)
    Preconditions: Task 5 changes applied
    Steps:
      1. grep -c "3.layer\|three.layer\|Layer 1\|Layer 2\|Layer 3" feature-init-only-theme.md || true
      2. Assert: architecture layers are mentioned or diagrammed
    Expected Result: Clear 3-layer architecture description
    Failure Indicators: Flat 2-layer description (provider → components)
    Evidence: .sisyphus/evidence/task-5-architecture.txt
  ```

  **Evidence to Capture:**
  - [ ] task-5-docs-content.txt — grep output showing generated file references
  - [ ] task-5-architecture.txt — grep output showing 3-layer architecture

  **Commit**: YES
  - Message: `docs: revert proposal and plan to generated-file architecture`
  - Files: `feature-init-only-theme.md`, `init-only-theme-implementation-plan.md`
  - Pre-commit: —

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [x] F1. **Plan Compliance Audit** — `oracle`
      Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.
      Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
      Run `bun run typecheck` + `bun run lint` + `bun run test`. Review all changed files (plugin.ts, program.ts, test files) for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names.
      Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real QA — Full Test Suite + Snapshot Inspection** — `unspecified-high` (+ `playwright` skill if needed)
      Start from clean state. Run `bun run test` and verify ALL pass. Then: grep ALL snapshot files for `configProviderImportFrom` — must find ZERO occurrences (all should reference generated path). Grep for `__twConfig` imports — all must point to `.generated.tailwind.config` not user's provider module. Run `bun run build` clean. Save terminal output as evidence.
      Output: `Tests [N/N pass] | Snapshots [CLEAN/N stale] | Build [PASS/FAIL] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
      For each task: read "What to do", read actual git diff (`git diff HEAD~N`). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance: configModuleGenerator.ts NOT modified, configRefResolver.ts NOT modified, no parser files modified, configProvider option schema unchanged. Flag unaccounted changes.
      Output: `Tasks [N/N compliant] | Forbidden Files [CLEAN/N touched] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Task | Commit Message                                                                                  | Files                                                                                                                                             | Pre-commit Check    |
| ---- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| 1    | `test(configProvider): update test infra with mocked findTailwindConfig and absolute filenames` | `src/babel/plugin.configProvider.test.ts`, `src/babel/plugin/visitors/program.test.ts`, `test/helpers/babelTransform.ts`                          | `bun run typecheck` |
| 2    | `feat(plugin): wire generateConfigModule pipeline in Program.enter()`                           | `src/babel/plugin.ts`                                                                                                                             | `bun run typecheck` |
| 3    | `fix(program): use generatedConfigPath instead of configProviderImportFrom for imports`         | `src/babel/plugin/visitors/program.ts`                                                                                                            | `bun run typecheck` |
| 4    | `test(configProvider): update snapshots and E2E assertions for generated config path`           | `src/babel/plugin.configProvider.test.ts`, `test/snapshots/babel/plugin.configProvider.test.ts.snap`, `src/babel/plugin/visitors/program.test.ts` | `bun run test`      |
| 5    | `docs: revert proposal and plan to generated-file architecture`                                 | `feature-init-only-theme.md`, `init-only-theme-implementation-plan.md`                                                                            | —                   |

---

## Success Criteria

### Verification Commands

```bash
bun run test          # Expected: 1142+ tests pass, 0 failures
bun run build         # Expected: clean build, exit code 0
bun run typecheck     # Expected: no errors
bun run lint          # Expected: no errors
```

### Final Checklist

- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass (1142+)
- [ ] All snapshots updated — no stale snapshots
- [ ] Zero occurrences of `configProviderImportFrom` in program.ts import injection
- [ ] `generatedConfigPath` populated for every configProvider-enabled file
- [ ] `.generated.tailwind.config.js` file would be produced next to user's tailwind.config.\*
- [ ] Docs show 3-layer architecture (not direct import)
