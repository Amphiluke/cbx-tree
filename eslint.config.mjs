import {defineConfig} from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';

export default defineConfig([
  {
    files: [
      'src/**/*.{js,mjs,cjs}',
      'eslint.config.mjs',
      'rollup.config.mjs',
      'vite.config.mjs',
    ],
    languageOptions: {
      ecmaVersion: 2025,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      js,
      '@stylistic': stylistic,
    },
    extends: ['js/recommended'],
    rules: {
      'no-var': 'error',
      'object-shorthand': ['error', 'always', {'ignoreConstructors': true}],
      '@stylistic/comma-dangle': ['error', {'arrays': 'always-multiline',  'objects': 'always-multiline'}],
      '@stylistic/indent': ['error', 2, {SwitchCase: 1}],
      '@stylistic/no-extra-semi': 'error',
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/semi': 'error',
    },
  },
]);
