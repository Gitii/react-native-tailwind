# Init-Only Theme: Implementation Plan

## 1) Goal

Implement **init-only theme resolution** for Babel-transformed styles so theme-dependent values are looked up during module initialization (via generated config), instead of being inlined as build-time literals.

This preserves the current performance model (static `StyleSheet.create`) while allowing one-time runtime customization through a `configProvider`.

---

## 2) Scope

### In scope (v1)

- New Babel plugin option:
  - `configProvider.importFrom`
  - `configProvider.importName` (default: `provideConfig`)
- Generation and use of a **shared resolved config module** (`__twConfig`) consumed by transformed files.
- Emitting theme-backed style values as config path expressions when possible.
- Support for provider import forms:
  - package/module specifier
  - TS alias
  - absolute filesystem path
- Build-time warnings for likely provider contract issues (no strict runtime validation in v1).

### Out of scope (v1)

- Reactive runtime theme switching after module initialization.
- Hard runtime shape validation with thrown errors.
- New theming API beyond `configProvider`.

---

## 3) Design Principles

- **No behavior change by default**: if `configProvider` is absent, current literal emission remains unchanged.
- **Minimal invasive changes**: add an intermediate representation for style values rather than rewriting full parser architecture.
- **Keep parser correctness first**: never replace literals with references unless the mapping is deterministic.
- **Fail-soft for compatibility**: emit warnings and fall back to literals when references cannot be produced safely.

---

## 4) Architecture Changes

## 4.1 Plugin options and state

### Files

- `src/babel/plugin/state.ts`
- `src/babel/plugin.ts`

### Changes

- Extend plugin options with `configProvider`.
- Normalize and validate options at plugin init.
- Store feature flags/state needed by program exit injection.
- Emit build-time warnings for invalid/incomplete provider settings.

### Acceptance

- Plugin accepts `configProvider` without breaking existing option parsing.
- Invalid input produces actionable warning text.

---

## 4.2 Style value intermediate representation (IR)

### Files

- `src/types/core.ts`
- `src/parser/index.ts`

### Changes

- Introduce style value IR that supports:
  - literal value (existing path)
  - config reference descriptor (e.g. theme path metadata)
- Propagate IR through style object assembly.

### Acceptance

- Existing tests still pass when IR is not used.
- IR can represent both literal and reference values without ambiguity.

---

## 4.3 Parser emission of theme references

### Files (initial wave)

- `src/parser/colors.ts`
- `src/parser/spacing.ts`
- `src/parser/typography.ts`
- `src/parser/layout.ts`
- `src/parser/sizing.ts`
- `src/parser/borders.ts`
- `src/parser/shadows.ts`
- `src/parser/outline.ts`
- `src/parser/transforms.ts`

### Changes

- Where values are theme-derived and deterministically mappable, emit config-ref IR.
- Keep literals for arbitrary values and unsupported/non-deterministic cases.
- Ensure modifiers (platform/dark/directional/etc.) keep existing semantics.

### Acceptance

- Theme-derived classes produce ref IR where safe.
- Arbitrary-value classes remain literal and unchanged.

---

## 4.4 AST style injection supporting expressions

### Files

- `src/babel/utils/styleInjection.ts`

### Changes

- Extend style AST emitter to handle config-ref IR by generating MemberExpression/Computed paths against `__twConfig`.
- Preserve existing literal-to-AST behavior for non-ref values.

### Acceptance

- Generated styles can include both literals and `__twConfig` lookups in the same object.
- No regressions in current literal-only transforms.

---

## 4.5 Generated config module and import wiring

### Files

- `src/babel/plugin/visitors/program.ts`
- `src/babel/plugin/visitors/imports.ts`
- `src/babel/config-loader.ts`

### Changes

- Create/resolve a shared generated module containing:
  - `originalConfig` payload
  - provider import (`importFrom`/`importName`)
  - exported resolved config (`__twConfig = provideConfig(originalConfig)`)
- Inject `__twConfig` import into transformed modules using config-ref emission.
- Add build-time warnings for suspicious provider wiring and config assumptions.

### Acceptance

- Transformed modules compile with provider import forms in scope.
- `__twConfig` is referenced only when feature is enabled.

---

## 4.6 Config materialization and mapping stability

### Files

- `src/babel/config-loader.ts`
- `src/utils/flattenColors.ts` (if needed)

### Changes

- Ensure stable mapping between parser token resolution and emitted config paths.
- Preserve enough structure to generate deterministic path references.
- Keep cache semantics compatible with current loader behavior.

### Acceptance

- Same class token maps to same config path across builds with same config.
- No cache-induced incorrect outputs in test scenarios.

---

## 5) Testing Plan

## 5.1 Unit tests (transform)

### Files

- `src/babel/plugin/visitors/className.test.ts`
- `src/babel/plugin/visitors/tw.test.ts`
- `src/babel/plugin/visitors/program.test.ts`
- `src/babel/plugin/visitors/imports.test.ts`

### Add cases

- `configProvider` enabled: generated style contains `__twConfig` path expressions.
- Mixed class values: reference + literal coexistence.
- Import wiring for module specifier / TS alias / absolute path.
- Disabled feature path remains unchanged.

## 5.2 Unit tests (config loader)

### File

- `src/babel/config-loader.test.ts`

### Add cases

- Provider option normalization warnings.
- Stable config materialization for reference emission.

## 5.3 Integration-style assertions

### File

- `test/helpers/babelTransform.ts` (via consuming tests)

### Add cases

- End-to-end transformed source snapshots for representative components.

## 5.4 Manual verification

- Build/test package and confirm no regression in existing snapshots.
- Smoke-check transformed output in a RN/Metro app with each supported import mode.

---

## 6) Rollout Strategy

### Phase 1 — Foundation

- Option plumbing + IR + emitter support (no parser migration yet).
- Keep all outputs literal until migration flags are ready.

### Phase 2 — Reference migration

- Incrementally migrate parser modules to config-ref IR (start with colors/spacing/typography).
- Add targeted tests for each migrated domain.

### Phase 3 — Provider integration

- Generate/import shared config module.
- Enable full feature path behind presence of `configProvider`.

### Phase 4 — Stabilization

- Expand migration coverage to remaining theme-driven modules.
- Harden warnings, docs, and edge-case handling.

---

## 7) Risks and Mitigations

- **Risk: non-deterministic token-to-path mapping**
  - Mitigation: only emit references when mapping is explicit; otherwise literal fallback.
- **Risk: provider returns incompatible shape**
  - Mitigation: clear build-time warnings + docs contract.
- **Risk: bundler resolution differences (alias/absolute path)**
  - Mitigation: test each supported import mode with transform snapshots and sample app smoke tests.
- **Risk: regression in modifier behavior**
  - Mitigation: preserve modifier pipeline; add focused regression tests.

---

## 8) Deliverables

- Babel plugin support for `configProvider`.
- Config-ref capable style emission.
- Shared generated config module wiring.
- Updated tests covering feature and regressions.
- Documentation updates for usage, constraints, and migration notes.

---

## 9) Completion Criteria

Feature is complete when all are true:

- Existing test suite passes.
- New tests pass for enabled and disabled paths.
- Generated code uses `__twConfig` references for supported theme-derived values.
- Non-theme/arbitrary values remain literal.
- Documentation reflects final API and limitations.

---

## 10) Proposal Cross-Reference

For rationale and examples only, see: `feature-init-only-theme.md`.
This implementation plan is the execution source of truth.
