import library from '@repo/eslint-config/library.js';

export default [
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
  ...library,
  {
    files: ['test/**/*.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
];
