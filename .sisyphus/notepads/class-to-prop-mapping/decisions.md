## 2026-02-28

- Added `ClassToPropMappingState` as a minimal state contract (`fullResolvedTheme`) so mapping logic stays decoupled from full plugin state while still resolving config refs.
- Kept `resolveConfigRefForProp()` prop-aware (`color`, `size`, `opacity`) with a generic fallback to either direct prop key match or first available ref path for extensibility.
- Added optional `path` parameter to `processModifiedClassToPropMappings()` so color-scheme hook injection can run immediately when caller has JSX path context, while preserving compatibility for call sites that only provide `(className, mappingRules, state, t)`.
- Standardized modifier expression building around nested Babel expressions with explicit state flags (`needsPlatformImport`, `needsColorSchemeImport`, `needsI18nManagerImport`) set at expression-construction time.
- Added class-to-prop integration in `jsxAttributeVisitor()` as a pre-processing branch (before existing style conversion) to keep the legacy className->style path unchanged for all non-matching components.
- Chose explicit precedence semantics where existing JSX attributes override mapped props, and mapped conflicts are skipped with dev warnings instead of replacing user-authored props.
