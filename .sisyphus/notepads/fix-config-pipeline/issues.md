# Issues & Gotchas — Fix Config Pipeline

## Known Issues

### Root Cause (from research)

- **Task 8 of init-only-theme**: Changed `state.generatedConfigPath` → `state.configProviderImportFrom` in `program.ts:126`
- **Impact**: Bypassed the entire generated config module pipeline
- **Fix**: Revert to use `generatedConfigPath` with non-empty guard

### Dead Code

- `generateConfigModule()`, `writeConfigModule()`, `getConfigModulePath()` — built per spec but never called from production
- `state.generatedConfigPath` — declared but never populated
- `state.configProviderImportName` — set but never used (should be passed to `generateConfigModule()`)

---

## QA Run — Task 5 Findings (2026-02-28)

### 2 Failing Tests in tw.test.ts
- `tw.test.ts:774` — "should register config refs for tw template with configProvider"
- `tw.test.ts:794` — "should register config refs for twStyle with configProvider"
- **Root cause**: Tests at lines 780 and 800 pass `configProvider: { importFrom: "./provider" }` (OLD API)
- Tests assert `expect(output).toContain("./provider")` — but after rename, imports come from `.generated.tailwind.config` not `./provider`
- These tests were NOT updated when `configProviderImportFrom` was renamed to `configGeneratedPath`
- **Fix needed**: Update these 2 tests to use the new option shape and assert `.generated.tailwind.config` import path

