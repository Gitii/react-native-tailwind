import { provideConfig } from './task-3-provider.js';

const originalConfig = {
  theme: {
    colors: {
  "blue": {
    "500": "#3B82F6"
  },
  "white": "#FFFFFF"
},
    spacing: {
  "4": 16
},
    fontFamily: {
  "sans": "System"
},
    fontSize: {
  "xl": 20
},
  },
};

const _provided = provideConfig(originalConfig);

function _flattenColors(colors, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(colors)) {
    if (typeof value === 'object' && value !== null) {
      Object.assign(result, _flattenColors(value, prefix ? `${prefix}-${key}` : key));
    } else {
      result[prefix ? `${prefix}-${key}` : key] = value;
    }
  }
  return result;
}

export const __twConfig = {
  theme: {
    colors: _flattenColors(_provided.theme.colors),
    spacing: _provided.theme.spacing,
    fontFamily: _provided.theme.fontFamily,
    fontSize: _provided.theme.fontSize,
  },
};
