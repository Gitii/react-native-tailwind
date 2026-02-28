# Architectural Decisions — Fix Config Pipeline

## Decision Log

### [2026-02-28] TDD Approach

- **Decision**: RED → GREEN → REFACTOR
- **Rationale**: Task 1 writes failing tests, Tasks 2-3 make them pass
- **Impact**: Tests intentionally FAIL after Task 1 — this is expected

### [2026-02-28] Dedup Set Placement

- **Decision**: Plugin closure scope (NOT per-file)
- **Rationale**: Set needs to persist across ALL files in compilation
- **Impact**: `generatedConfigPaths` declared before `return { ... }` in plugin factory

### [2026-02-28] Null Guard for findTailwindConfig

- **Decision**: Warn and skip generation if null
- **Rationale**: Config provider requires tailwind.config.\* to exist
- **Impact**: `state.generatedConfigPath` stays as `""`, no import injection

---
