# Feature proposal: Class to prop mapping

## Motivation

Right now, class name prop is converted at build time to style sheet and set on the component.
This works well for anything that accepts a `style` prop. If fact, this is a requirement even for custom components that want to use `className` prop. However, there are some components that don't accept `style` prop, but instead have their own props for styling. For example, `Lucide` `Icon` components have `color`, `size`, etc. props. In this case, we can't use `className` prop to style the component.

It would be great to add support for these non-standard components by allowing developers to specify a mapping from class names to props. This way, we can still use the `className` prop to style these components without having to change their API.

## Example

```jsx
import { Icon } from 'lucide-react';

const MyComponent = () => {
  return (
    <Icon
      name="home"
      className="text-primary"
    />
  );
};

const MyOtherComponent = () => {
  return (
    <Icon
      name="home"
      className="text-red-500 size-6"
    />
  );
};

const MyOtherOtherComponent = () => {
  return (
    <Icon
      name="home"
      className="text-brand"
    />
  );
};
```

```js
export default {
  theme: {
    extend: {
      colors: {
        primary: "#1d4ed8",
        secondary: "#9333ea",
        brand: {
          light: "#f0f9ff",
          DEFAULT: "#0284c7",
          dark: "#0c4a6e",
        },
      },
    },
  },
};
```

is transformed to:

```jsx
// some jsx file
import { Icon } from 'lucide-react';

const MyComponent = () => {
  return (
    <Icon
      name="home"
      color="1d4ed8" // could also be __twConfig.theme.colors.primary when using "init-only" theme
    />
  );
};

const MyOtherComponent = () => {
  return (
    <Icon
      name="home"
      color={"#fb2c36"} // could also be __twConfig.theme.colors.red[500] when using "init-only" theme
      size={24}  // ...
    />
  );
};

const MyOtherOtherComponent = () => {
  const _twColorScheme = useColorScheme();

  return (
    <Icon
      name="home"
      color={_twColorScheme === "dark" ? "#0c4a6e" : "#f0f9ff"} // could also be __twConfig.theme.colors.brand.light/.dark when using "init-only" theme
    />
  );
};
```

This can be achieved by defining a mapping from class names to props, for example:

```js
// babel.config.js
module.exports = {
  plugins: [
    [
      "@mgcrea/react-native-tailwind/babel",
      {
        componentClassToPropMapping: [
            {
                importFrom: "lucide-react-native",
                components: ["*"],
                mapping: {
                    // [target property]: "class name pattern"
                    color: "color-*",
                    size: "size-*",
                    borderWidth: "stroke-*",
                    opacity: "opacity-*",
                },
            },
        ],
      },
    ],
  ],
};
```

## Remarks

- Feature parity with `className` prop is a requirement. Light and dark mode support is possible because the underlying logic is already there. Instead of generating a style sheet, we can generate a prop object and set it on the component.
- Unknown classes should be ignored and not cause any errors.
- "init-only" theme must also be supported (instead of literal values, reference the config value directly), e.g. `color: __twConfig.theme.colors.gray[100]`
- All class name patterns must match exactly one tailwind class.

## Open questions

- Is it possible to generate a warning at build time if an unknown tailwind class is used?
