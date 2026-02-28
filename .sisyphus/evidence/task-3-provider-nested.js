export function provideConfig(config) {
  if (!config.theme.colors.blue || !config.theme.colors.blue['500']) {
    throw new Error('missing nested blue.500');
  }
  return {
    theme: {
      ...config.theme,
      colors: {
        ...config.theme.colors,
        green: { 500: '#22C55E' },
      },
    },
  };
}
