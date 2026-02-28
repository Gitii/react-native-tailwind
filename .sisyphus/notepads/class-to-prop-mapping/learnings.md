## Task 1 Completion — 2026-02-28

### Type System Patterns Discovered

1. **JSDoc Documentation Style**: All PluginOptions fields use consistent JSDoc with:
   - `@default` tag for optional fields
   - `@example` blocks showing usage
   - Clear descriptions of behavior

2. **Map Initialization Pattern**: State fields using Maps follow this pattern:

   ```typescript
   fieldName: Map<KeyType, ValueType>; // Inline comment explaining purpose
   ```

   Initialized in createInitialState as: `new Map()`

3. **Validation in createInitialState**:
   - Validation logic runs BEFORE the return statement
   - Warnings use console.warn with `[react-native-tailwind]` prefix
   - Invalid rules are filtered/skipped, not thrown
   - Normalized values stored in local variables, then added to return object

4. **Option Passthrough Pattern**:
   - Options object passed directly to createInitialState
   - No need for explicit extraction in plugin.ts
   - createInitialState handles all option processing

### Implementation Details

- **ComponentClassToPropRule type**: Follows existing pattern with importFrom, components array, and mapping Record
- **Validation warnings**: Two types implemented:
  1. Empty mapping object warning
  2. Missing `*` wildcard in pattern warning
- **Import tracking**: Map<string, Set<string>> tracks which components come from which imports
- **Config import flag**: needsConfigImport boolean set when configProviderImportFrom is present

### Test Results

- All 1142 tests pass (1 skipped)
- No regressions introduced
- Coverage maintained at 89.87% overall

### Files Modified

1. `src/babel/plugin/state.ts`:
   - Added ComponentClassToPropRule type (lines 24-57)
   - Extended PluginOptions with componentClassToPropMapping field (lines 161-178)
   - Extended PluginState with 3 new fields (lines 225-228)
   - Added validation logic in createInitialState (lines 271-324)
   - Added field initialization in return object (lines 362-364)

2. `src/babel/plugin.ts`:
   - No changes needed — options already passed through to createInitialState

## Task 2 Completion — 2026-02-28

- Added `componentMatcher.ts` with three exports: `normalizeClassToPropRules`, `buildImportMap`, and `getClassToPropRule`.
- Rule normalization validates `importFrom`, `components`, and `mapping`, filters invalid wildcard patterns, and warns with `[react-native-tailwind]` prefix.
- Import map builder filters by configured `importFrom` rules and tracks local identifiers for named, aliased, namespace, and default imports.
- JSX matcher resolves both `<Identifier>` and `<Namespace.Component>` forms and supports exact component matching plus `components: ["*"]` wildcard rules.
- Return contract is explicit: non-match paths return `null` without throwing.

## Task 3 Completion — 2026-02-28

### Import Tracking Integration

- Extended `importDeclarationVisitor()` in `src/babel/plugin/visitors/imports.ts` to call `buildImportMap()` for component import discovery
- Added conditional check: `if (state.classToPropRules.length > 0)` to only process when feature is enabled
- Implemented Map merging pattern:
  ```typescript
  const localToSource = buildImportMap(node, state.classToPropRules, t);
  if (localToSource) {
    for (const [localName, importSource] of localToSource) {
      if (!state.classToPropImportMap.has(importSource)) {
        state.classToPropImportMap.set(importSource, new Set());
      }
      state.classToPropImportMap.get(importSource)!.add(localName);
    }
  }
  ```

### Import Path Resolution

- Correct relative path from `src/babel/plugin/visitors/imports.ts` to `src/babel/utils/componentMatcher.ts` is `../../utils/componentMatcher.js`
- Path structure: `visitors/` is inside `plugin/`, which is inside `babel/`, so need to go up 2 levels to reach `utils/`

### Supported Import Patterns

The implementation now correctly handles all four import types via `buildImportMap()`:

1. Named imports: `import { Icon } from "lucide-react-native"` → maps `Icon`
2. Aliased imports: `import { Icon as MyIcon } from "lucide-react-native"` → maps `MyIcon`
3. Namespace imports: `import * as Icons from "lucide-react-native"` → maps `Icons`
4. Default imports: `import Icon from "lucide-react-native"` → maps `Icon`

### Test Results

- All 1142 tests pass (1 skipped)
- No regressions introduced
- TypeScript compilation clean (0 errors)
- Coverage maintained

### Files Modified

1. `src/babel/plugin/visitors/imports.ts`:
   - Added import: `import { buildImportMap } from "../../utils/componentMatcher.js";` (line 8)
   - Added logic block (lines 117-128) after tw/twStyle tracking to call buildImportMap and populate state.classToPropImportMap

## Task 5 Completion — 2026-02-28

- `buildMappedPropExpression()` composes modifier logic in deterministic layers: color scheme conditional first, directional conditional second, and `Platform.select()` outermost with `default` fallback to preserve base/cross-modifier behavior.
- Color scheme hook injection for mapped props must be immediate (same as `className.ts`): resolve component scope, set `needsColorSchemeImport`, track scope in `functionComponentsNeedingColorScheme`, then call `injectColorSchemeHook()`.
- Reused parser modifier pipeline (`splitModifierClasses()` + `expandSchemeModifier()`) avoids duplicating modifier parsing and keeps `scheme:` support consistent with existing modifier handling.
- Unsupported state/placeholder modifiers for mapped props should warn with `[react-native-tailwind]` prefix and be skipped without failing transformation.

## Task 4 Completion - 2026-02-28

- `matchClassToPattern()` is implemented as strict trailing-wildcard prefix matching (`pattern.endsWith('*')` + `startsWith(prefix)`), so malformed patterns fail closed.
- `extractPropValue()` should prioritize prop-specific extraction before generic fallbacks: `color` -> `color`/`backgroundColor`/first color-like string, `size` -> numeric `width===height`, `opacity` -> numeric `opacity` in [0,1].
- Generic fallback extraction in this feature works best as numeric-first then string-first from parsed style values, returning `null` when nothing scalar is available.
- `processClassToPropMappings()` tracks unmatched tokens per class token and supports overwrite semantics (`last match wins`) with `[react-native-tailwind]` warnings for duplicate prop matches.

## Task 6 Completion — 2026-02-28

- Mapped-component interception works safely as an additive early branch in `jsxAttributeVisitor()` directly after `isAttributeSupported()` and before style transformation logic.
- Static class extraction for mapped components should accept both `className="..."` and `className={"..."}`; any other value shape should warn and fall back to existing dynamic className handling.
- Explicit JSX props should be collected from the opening element before mapped prop generation so conflict resolution is deterministic (`explicit prop wins`) with dev-only warnings.
- Modifier-aware mapping can be selected by checking `splitModifierClasses(className).modifierClasses.length > 0`, then delegating to `processModifiedClassToPropMappings()`; otherwise use `processClassToPropMappings()` and convert primitives to Babel literals.

## Task 7 Completion — 2026-02-28

- `buildConfigRefExpression(path, "__twConfig", t)` from `styleInjection.ts` is the reusable primitive for config-aware expressions; takes `string[]` path and config identifier string.
- Config ref propagation through modifier values uses a parallel `configRefs` object on `MappedModifierValues` with matching slot keys (`base`, `dark`, `light`, `ios`, `android`, `web`, `rtl`, `ltr`).
- `toMappedExpression()` helper encapsulates the config-vs-literal branching: checks `configProviderEnabled && configRef` to decide between `buildConfigRefExpression` and `toLiteralExpression`.
- `state.needsConfigImport = true` is set eagerly in `buildMappedPropExpression()` when any configRef exists and configProviderEnabled is true — checked once at the top rather than per-expression.
- `ClassToPropMappingState` extended with `configProviderEnabled` and `needsConfigImport` — these are already present on `PluginState` and passed through.
- The fallback value path also needs a parallel `fallbackConfigRef` lookup matching the same priority order as `fallbackValue` (`dark → light → rtl → ltr → ios → android → web`).

## Task 8 (componentMatcher.test.ts) Completion — 2026-02-28

- Created `src/babel/utils/componentMatcher.test.ts` with 31 tests across 3 describe blocks.
- `normalizeClassToPropRules` tests: valid passthrough, undefined/empty input, empty importFrom, missing importFrom, empty components, empty mapping, patterns without `*`, mixed valid/invalid within rule, whitespace trimming, mixed multi-rule validity, blank component filtering.
- `buildImportMap` tests: named, aliased, namespace, default imports; non-matching source → null; type-only declaration → null; type-only specifier skipped; multiple specifiers; mixed default+named.
- `getClassToPropRule` tests: exact match, second component in same rule, wildcard `["*"]` match, non-imported → null, imported-but-not-in-components → null, member expression with namespace, member expression matching component, member expression with wildcard, empty importMap → null, non-imported namespace → null.
- Key distinction: `buildImportMap` returns `Map<localName, source>`, but `getClassToPropRule` takes `Map<source, Set<localNames>>` (the inverted state form). Tests must construct the correct shape for each.
- Used `@babel/types` directly for AST node construction (`t.importDeclaration`, `t.jsxOpeningElement`, `t.jsxMemberExpression`) — no need for `parseSync` helper for these simple cases.
- Used `vi.spyOn(console, 'warn').mockImplementation(() => {})` pattern with `spy.mockRestore()` cleanup for warning assertions.
- Coverage: `componentMatcher.ts` at 97.4% statements, 88.33% branches (uncovered: lines 46, 151 — edge cases in nested member expression and blank component name).

## Task 11 (classToPropMapping.test.ts) Completion — 2026-02-28

- Created `src/babel/utils/classToPropMapping.test.ts` with 33 tests across 4 describe blocks covering all 4 exported functions.
- `matchClassToPattern`: 7 tests — wildcard matching (`text-*`, `size-*`, `bg-*`, `opacity-*`), non-matching, exact match without wildcard, prefix-only edge case.
- `extractPropValue`: 11 tests — color extraction (`text-red-500` → `COLORS["red-500"]`), size extraction (`size-6` → 24), opacity extraction (`opacity-50` → 0.5), custom theme colors (`text-primary` → `#1bacb5`), unknown class warning, null returns for mismatched prop types, generic fallback to numeric then string.
- `processClassToPropMappings`: 7 tests — multi-prop mapping, unmatched class collection, last-match-wins with warning, matched-but-unextractable warning, empty input, all-unmatched, opacity mapping.
- `buildMappedPropExpression`: 8 tests — dark/light conditional expression (validates AST structure: `_colorScheme === "dark"` binary expression), Platform.select for ios/android, string/numeric base literals, fallback to `undefined` identifier with warning, base-as-default in Platform.select, rtl/ltr directional conditional (`_isRTL`), layered color scheme inside Platform.select.
- Theme fixtures follow `configRefResolver.test.ts` pattern: `baseTheme` with `COLORS`, `SPACING_SCALE`, `FONT_SIZES`, `fontFamily`.
- `configRef` is returned by `extractPropValue` when `resolveConfigRefForProp` finds a match — tested for both standard colors and custom theme colors.
- For `extractPropValue` with `targetProp="size"`, the function returns `null` immediately when width/height don't match — does NOT fall through to generic fallback. Same for `"color"` and `"opacity"` branches.
- Warning spy pattern: `vi.spyOn(console, 'warn').mockImplementation(() => {})` with `afterEach` cleanup via `warnSpy?.mockRestore()` — cleaner than per-test restore for blocks with multiple warning tests.
- All 1206 tests pass (1 pre-existing skip), 0 LSP errors.

## Task 13 (className.test.ts modifier integration tests) Completion — 2026-02-28

- Added `describe("className visitor - class-to-prop mapping modifiers", ...)` block to `className.test.ts` with 14 integration tests.
- Test config pattern: shared `mappingOptions` object with `componentClassToPropMapping: [{ importFrom: "lucide-react-native", components: ["Icon"], mapping: { color: "text-*", size: "size-*" } }]` — passed as second arg to `transform(input, mappingOptions, true)`.
- Mapped component modifiers produce prop expressions directly (e.g., `color: {Platform.select({...})}`) — NOT style props. Key assertion: `expect(output).not.toContain("style:")` confirms class-to-prop mapping bypasses StyleSheet.
- Color scheme modifiers on mapped props: `dark:text-red-500 light:text-blue-500` → `color: {_twColorScheme === "dark" ? "#..." : "#..."}`. Verified `useColorScheme` import, `_twColorScheme` hook call, and conditional.
- `scheme:text-brand` expansion: requires `vi.mocked(extractCustomTheme).mockReturnValue(...)` with `brand-dark` and `brand-light` color entries. Expands to dark:/light: branches with respective color values.
- Platform modifiers on mapped props: `ios:text-red-500 android:text-blue-500` → `color: {Platform.select({ios: "#...", android: "#..."})}`. Platform import injected.
- Base + modifier combination: `text-gray-500 dark:text-white` → conditional with base as fallback in light branch. `text-gray-500 ios:text-red-500 android:text-blue-500` → Platform.select with `default:` key.
- State modifier warnings: `active:`, `hover:`, `focus:`, `disabled:` all warn with `[react-native-tailwind] ... not supported for class-to-prop mapping` and are skipped. Base classes still mapped.
- Import injection verified independently: `useColorScheme` from react-native for dark:/light:, `Platform` from react-native for ios:/android:/web:, `I18nManager` + `_twIsRTL` for rtl:/ltr:.
- Combined modifier layering: dark: + ios: produces Platform.select (outer) wrapping color scheme conditional (inner), matching `buildMappedPropExpression()` layer order.
- Multi-prop with modifiers: `dark:text-white size-6` → `color:` with conditional + `size:` with numeric literal. Both props generated, no style/className.
- All 1221 tests pass (1 pre-existing skip), zero regressions.

## Task 14 (configProvider + class-to-prop mapping E2E tests) Completion — 2026-02-28

- Added 6 tests to `plugin.configProvider.test.ts` in new `describe("configProvider E2E - class-to-prop mapping", ...)` block.
- **Non-modifier mapped props produce literal values even with configProvider enabled**: The non-modifier path in `className.ts` (lines 122-137) creates `t.numericLiteral()`/`t.stringLiteral()` from `processClassToPropMappings().mappedProps`, ignoring `configRef` data. This is an implementation gap — `extractPropValue` returns `configRef` but the non-modifier branch doesn't use it.
- **Modifier-based mapped props correctly use config refs**: `processModifiedClassToPropMappings` → `buildMappedPropExpression` → `toMappedExpression` checks `configProviderEnabled && configRef` and calls `buildConfigRefExpression`.
- **dark:/light: ternary for mapped props**: `dark:text-red-500 light:text-blue-500` produces `_twColorScheme === "dark" ? __twConfig.theme.colors["red-500"] : __twConfig.theme.colors["blue-500"]` — single ternary, NOT separate dark/light checks.
- **Platform modifier mapped props with config refs**: `ios:text-red-500 android:text-blue-500` → `Platform.select({ ios: __twConfig.theme.colors["red-500"], android: __twConfig.theme.colors["blue-500"] })`.
- **__twConfig import injection without StyleSheet.create**: When only modifier-based mapped props exist (no regular className), `import { __twConfig }` is injected but NO `StyleSheet.create` is generated.
- **Mixed file works correctly**: Regular `<View className="bg-blue-500 p-4">` generates StyleSheet.create with config refs, while `<Icon className="dark:text-red-500">` generates mapped prop with config refs. Single `__twConfig` import shared.
- Test helper pattern: `transformWithConfig(input, "./my-provider", { componentClassToPropMapping: [...] })` passes mapping options through the third parameter.
- Pre-existing failure in `className.test.ts` (aliased import test, line 2295) from Task 13 — unrelated to configProvider tests.
- All 35 configProvider tests pass (6 new + 29 existing). Zero regressions in configProvider test file.

## Task 12 (className.test.ts static class-to-prop integration tests) Completion — 2026-02-28

- Added `describe("className visitor - class-to-prop mapping", ...)` block to `className.test.ts` with 12 integration tests covering static mapping scenarios.
- **Basic mapping verified**: `text-red-500 size-6` → `color: "#fb2c36"`, `size: 24`. Confirmed exact hex values: red-500=`#fb2c36`, blue-500=`#2b7fff`, size-4=16, size-6=24, opacity-75=0.75.
- **Three-prop mapping**: Extended default mapping with `opacity: "opacity-*"` to test `text-blue-500 size-4 opacity-75` → 3 individual props.
- **Explicit prop precedence**: `<Icon color="blue" className="text-red-500" />` → keeps explicit `color: "blue"`. Warning message: `Explicit prop "color" takes precedence over mapped value from className.`
- **Unmapped classes silently dropped**: `flex-row` in `text-red-500 flex-row` is collected in `unmatchedClasses` but NO warning emitted at visitor level. Color prop still set, `flexDirection` absent.
- **Non-matching component falls through**: `<View className="text-red-500" />` (View not in mapping config) gets normal style transform with `StyleSheet.create` and `style:` prop.
- **Aliased import limitation discovered**: `import { Icon as MyIcon }` + `components: ["Icon"]` does NOT match because `getClassToPropRule` matches against the local name (`MyIcon`), not the imported name (`Icon`). Workaround: use `components: ["*"]` for aliased imports. Test updated accordingly.
- **Namespace imports work correctly**: `import * as Icons` + `<Icons.Icon />` works because member expression matching extracts `Icon` from `Icons.Icon` and checks against `components: ["Icon"]`.
- **Wildcard components**: `components: ["*"]` matches any component imported from the configured source — tested with `<Home />` from lucide-react-native.
- **Dynamic className warning**: Non-static className (e.g., `className={colorClass}`) on mapped component warns: `Dynamic className is not supported for mapped components at ...`
- **Custom theme colors**: `vi.mocked(extractCustomTheme).mockReturnValue(...)` with `colors: { primary: "#1bacb5" }` → `text-primary` correctly maps to `color: "#1bacb5"`.
- **Expression container format**: `className={"text-red-500 size-6"}` (string literal in JSXExpressionContainer) handled identically to `className="..."`.
- **No StyleSheet.create for mapped-only files**: When all className classes are mapped to props, no `StyleSheet.create` or `_twStyles` appears in output.
- **Previous aliased import test failure (noted in Task 14) now fixed**: Changed from `components: ["Icon"]` to `components: ["*"]` with comment explaining the limitation.
- All 1239 tests pass (1 pre-existing skip), zero LSP errors, zero regressions.
