const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/components/icon.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@expo/vector-icons',
              message: "Use Icon from '@/components/icon' so the app keeps a single icon set.",
            },
          ],
          patterns: [
            {
              group: ['@expo/vector-icons/*'],
              message: "Use Icon from '@/components/icon' so the app keeps a single icon set.",
            },
          ],
        },
      ],
    },
  },
]);
