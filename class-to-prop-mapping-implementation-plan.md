# Class-to-Prop Mapping: Implementation Plan

## 1) Goal

Implement Babel-time transformation of `className` into component props for configured third-party/custom components that do not rely on React Native `style`.

Example target behavior:

- `<Icon className="text-red-500 size-6" />`
- transforms to:
  - `<Icon color="#fb2c36" size={24} />`

## 2) Finalized Product Decisions

These are locked based on clarified requirements:

1. Use `mapping` only (no `styleToProp` alias).
2. No `stroke-*` support in v1.
3. `size-*` may map to scalar props (extract from parsed width/height).
4. Modifier parity in v1 for:
   - `dark:` / `light:` / `scheme:`
   - `ios:` / `android:` / `web:`
   - `rtl:` / `ltr:`
   Excluded in v1:
   - state modifiers (`active:`, `hover:`, `focus:`, `disabled:`)
   - `placeholder:`
   - runtime dimension classes (`w-screen`, `h-screen`)
5. Add build-time warnings for ignored/unknown classes on mapped components.
6. Explicit JSX props win over mapped values (with warning when mapping is skipped).
7. Init-only theme references use flattened keys:
   - `__twConfig.theme.colors["gray-100"]`
8. `text-brand` with light/dark variants requires explicit scheme modifiers (e.g. `scheme:text-brand`).

## 3) API Shape

Add a new Babel plugin option:

```ts
type ComponentClassToPropRule = {
  importFrom: string;
  components: string[]; // e.g. ["Icon"] or ["*"]
  mapping: Record<string, string>; // targetProp -> class pattern
};

type PluginOptions = {
  // existing options...
  componentClassToPropMapping?: ComponentClassToPropRule[];
};
```

Pattern rules in v1:

- Single `*` wildcard required at end (prefix matching), e.g.:
  - `text-*`
  - `size-*`
  - `opacity-*`
- Each pattern must resolve to at most one class token in a given `className`.
- If multiple tokens match the same pattern, last match wins + warning.

## 4) Transformation Semantics

For JSX elements matching a configured mapping rule:

1. Read `className` tokens.
2. Split base + supported modifiers.
3. For each `mapping[prop] = pattern`, find matching class tokens.
4. Parse matched token with existing parser (`parseClass`) and extract value for `prop`.
5. Generate prop AST:
   - literal value
   - or conditional expression for modifiers
   - or `__twConfig` reference when available and `configProvider` is enabled
6. If explicit JSX prop already exists, keep explicit prop and skip mapped assignment (warning in dev).
7. Remove `className` attribute.
8. Ignore non-mapped tokens (warning in dev).

No `StyleSheet.create` emission is required for these mapped classes.

## 5) Architecture Changes

## 5.1 Plugin option + state plumbing

Files:

- `src/babel/plugin/state.ts`
- `src/babel/plugin.ts`

Changes:

- Extend `PluginOptions` with `componentClassToPropMapping`.
- Add normalized mapping structures to `PluginState`.
- Validate malformed rules and invalid patterns with actionable warnings.

Acceptance:

- Plugin loads mapping rules without affecting existing transforms when option is absent.

## 5.2 Component matching by import source

Files:

- `src/babel/utils/componentSupport.ts` (or new `src/babel/utils/componentMatcher.ts`)
- `src/babel/plugin/visitors/className.ts`

Changes:

- Resolve JSX element identity against import source + component name:
  - direct imports
  - aliased imports
  - namespace imports (`import * as Icons from ...`)
- Match against mapping rules (`importFrom`, `components`).

Acceptance:

- Correct rule selection for exact names and `components: ["*"]`.

## 5.3 Class pattern matching + value extraction

Files:

- New `src/babel/utils/classToPropMapping.ts`
- `src/parser/index.ts` (reuse parse APIs only; no parser rewrite required)

Changes:

- Implement token matcher for mapping patterns.
- Extract values from parsed style objects:
  - direct prop extraction (`color`, `opacity`, etc.)
  - `size-*` extractor: require parsed `width === height`, map scalar to target prop
- Handle unsupported extracts with warning + skip.

Acceptance:

- `text-red-500 -> color`
- `size-6 -> size={24}`
- unmappable classes are ignored safely.

## 5.4 Modifier expression generation for mapped props

Files:

- New `src/babel/utils/classToPropMapping.ts`
- Reuse existing modifier helpers from:
  - `src/babel/utils/platformModifierProcessing.ts`
  - `src/babel/utils/colorSchemeModifierProcessing.ts`
  - `src/babel/utils/directionalModifierProcessing.ts`
  - `src/parser/modifiers.ts`

Changes:

- Build prop expressions for supported modifiers:
  - platform: `Platform.select(...)`
  - color scheme: `_twColorScheme === "dark" ? ...`
  - directional: `_twIsRTL ? ...`
- Reuse existing import/hook flags in plugin state.

Acceptance:

- Same modifier behavior model as current className style transform, but for prop values.

## 5.5 Init-only (`configProvider`) references for mapped props

Files:

- `src/babel/utils/classToPropMapping.ts`
- `src/babel/plugin/visitors/program.ts`
- `src/babel/plugin/state.ts`
- reuse `buildConfigRefExpression` from `src/babel/utils/styleInjection.ts`

Changes:

- Resolve config refs from matched class token + extracted style key.
- Emit flattened references:
  - `__twConfig.theme.colors["red-500"]`
  - `__twConfig.theme.spacing["6"]`
- Add `needsConfigImport` boolean to state so `__twConfig` import is injected even without `styleRegistry` entries.

Acceptance:

- Mapped props use config refs when deterministic and available.
- `__twConfig` import is injected correctly even if no `StyleSheet.create` output exists in file.

## 5.6 className visitor integration

Files:

- `src/babel/plugin/visitors/className.ts`

Changes:

- Add an early branch:
  - if JSX element matches class-to-prop rule, execute mapping path and return.
  - else keep current style transformation path unchanged.

Acceptance:

- No regressions for existing style-based className flow.

## 5.7 Warnings behavior

Files:

- `src/babel/plugin/visitors/className.ts`
- `src/babel/utils/classToPropMapping.ts`

Warnings (dev-only):

- class token ignored because no mapping pattern matched.
- class token unknown/unparseable.
- explicit prop overrides mapped prop.
- unsupported modifier encountered in mapped path.

Acceptance:

- warnings are informative and non-fatal.

## 6) Test Plan

## 6.1 Unit tests: mapped static classes

File:

- `src/babel/plugin/visitors/className.test.ts`

Add cases:

- `text-red-500 -> color`
- `size-6 -> size={24}`
- multiple mapped props in one className
- explicit prop precedence
- ignored class warning

## 6.2 Unit tests: modifiers on mapped props

File:

- `src/babel/plugin/visitors/className.test.ts`

Add cases:

- `dark:` / `light:` / `scheme:`
- `ios:` / `android:` / `web:`
- `rtl:` / `ltr:`
- excluded modifiers produce warnings and are ignored

## 6.3 Unit tests: configProvider with mapped props

Files:

- `src/babel/plugin/visitors/className.test.ts`
- `src/babel/plugin.configProvider.test.ts`

Add cases:

- config refs in mapped props with flattened keys
- `__twConfig` import when no `StyleSheet.create` output is needed

## 6.4 Unit tests: component import matching

File:

- new `src/babel/utils/componentMatcher.test.ts` (or equivalent)

Add cases:

- direct import
- alias import
- namespace member usage
- wildcard components

## 7) Documentation Plan

Files:

- `docs/src/content/docs/advanced/babel-configuration.md`
- `README.md`
- `feature-class-to-prop-mapping.md` (update decisions and examples)

Updates:

- new option reference and examples
- supported/unsupported modifiers in v1
- warning behavior
- flattened config ref examples

## 8) Delivery Phases

Phase 1: option/state plumbing + component matcher + static mapping path  
Phase 2: modifier expressions + import/hook wiring  
Phase 3: configProvider refs for mapped props  
Phase 4: tests, docs, and warning polish

## 9) Done Criteria

Feature is done when:

- configured components transform `className` into mapped props
- supported modifiers work with mapped props
- configProvider refs work with flattened keys
- warnings are emitted for ignored/unknown classes and explicit-prop conflicts
- existing test suite remains green and new coverage is added for mapped behavior
