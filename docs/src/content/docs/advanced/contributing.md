---
title: Contributing
description: Development setup and contribution guidelines
---

Guide for contributing to React Native Tailwind.

## Project Setup

### Clone Repository

```bash
git clone https://github.com/mgcrea/react-native-tailwind.git
cd react-native-tailwind
pnpm install
```

### Build

```bash
pnpm build              # Full build
pnpm build:babel        # Compile TypeScript
pnpm build:babel-plugin # Bundle Babel plugin
pnpm build:types        # Generate type declarations
```

### Testing

```bash
pnpm test               # Run all tests
pnpm lint               # ESLint
pnpm check              # TypeScript type check
pnpm spec               # Jest tests
```

### Example App

```bash
pnpm dev                # Run example app
# or
cd example && npm run dev -- --reset-cache
```

## Architecture Overview

### Build System

The project uses a dual-build system:

1. **Main Package (ESM)**: `src/` → `dist/` via Babel
   - Compiled as ES modules
   - Excludes `src/babel/` directory

2. **Babel Plugin (CommonJS)**: `src/babel/` → `dist/babel/index.cjs` via esbuild
   - Must be CommonJS (Babel requirement)
   - Bundled into single self-contained file
   - Includes all parser code inline (~25KB)

### Key Directories

```
src/
├── babel/
│   ├── plugin.ts             # Main Babel plugin
│   ├── config-loader.ts      # Tailwind config discovery
│   └── utils/                # Utility functions
│       ├── attributeMatchers.ts
│       ├── componentSupport.ts
│       ├── dynamicProcessing.ts
│       ├── modifierProcessing.ts
│       ├── styleTransforms.ts
│       ├── styleInjection.ts
│       └── twProcessing.ts
├── parser/
│   ├── index.ts              # Parser orchestrator
│   ├── spacing.ts            # Spacing utilities
│   ├── colors.ts             # Color utilities
│   └── ...                   # Other parsers
├── utils/
│   └── styleKey.ts           # Style key generation
└── index.ts                  # Main export
```

## Making Changes

### Adding New Utility Classes

1. **Determine category**: Does it fit in an existing parser or need a new one?

2. **Edit/create parser** in `src/parser/`:

```typescript
export function parseYourCategory(cls: string): StyleObject | null {
  if (cls === 'your-class') {
    return { yourStyle: 'value' };
  }
  return null;
}
```

3. **Register parser** in `src/parser/index.ts`:

```typescript
import { parseYourCategory } from './your-category';

const parsers = [
  parseSpacing,
  parseColor,
  parseYourCategory,  // Add here
  // ...
];
```

4. **Export constants** (if applicable) in `src/index.ts`

5. **Add tests** in `src/parser/__tests__/your-category.test.ts`

6. **Rebuild**: `pnpm build`

### Modifying Babel Plugin

1. Edit `src/babel/plugin.ts` or utilities in `src/babel/utils/`
2. Run `pnpm build` (runs esbuild bundler)
3. Test in example app
4. Add/update tests

### Testing Changes

1. **Unit tests**:

```bash
pnpm spec
```

2. **Example app**:

```bash
cd example
npm run dev -- --reset-cache
```

3. **Type checking**:

```bash
pnpm check
```

4. **Linting**:

```bash
pnpm lint
```

## Pull Request Process

1. **Fork the repository**
2. **Create a feature branch**:

```bash
git checkout -b feature/your-feature-name
```

3. **Make your changes**
4. **Add tests** for new functionality
5. **Run all checks**:

```bash
pnpm test
```

6. **Commit your changes**:

```bash
git commit -m "feat: add your feature"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

7. **Push to your fork**:

```bash
git push origin feature/your-feature-name
```

8. **Create a Pull Request** on GitHub

## Code Style

- Use TypeScript for type safety
- Follow existing code patterns
- Add comments for complex logic
- Keep functions focused and small
- Use meaningful variable names

## Testing Guidelines

- Write tests for new features
- Ensure existing tests pass
- Test edge cases
- Use descriptive test names

Example:

```typescript
describe('parseSpacing', () => {
  it('should parse margin classes', () => {
    expect(parseSpacing('m-4')).toEqual({ margin: 16 });
  });

  it('should return null for invalid classes', () => {
    expect(parseSpacing('invalid')).toBeNull();
  });
});
```

## Documentation

- Update README.md for new features
- Add JSDoc comments for public APIs
- Include examples in documentation
- Update type definitions

## Getting Help

- **Questions**: Open a [Discussion](https://github.com/mgcrea/react-native-tailwind/discussions)
- **Bugs**: Open an [Issue](https://github.com/mgcrea/react-native-tailwind/issues)
- **Features**: Open an [Issue](https://github.com/mgcrea/react-native-tailwind/issues) with proposal

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Authors

- [Olivier Louvignes](https://github.com/mgcrea) - [@mgcrea](https://twitter.com/mgcrea)

Thank you for contributing! 🎉
