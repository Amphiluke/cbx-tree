import {defineConfig} from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';
import stylisticJs from '@stylistic/eslint-plugin-js';

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
      '@stylistic/js': stylisticJs,
    },
    extends: ['js/recommended'],
    rules: {
      'no-var': 'error',
      'object-shorthand': ['error', 'always', {'ignoreConstructors': true}],
      '@stylistic/js/comma-dangle': ['error', {'arrays': 'always-multiline',  'objects': 'always-multiline'}],
      '@stylistic/js/indent': ['error', 2, {SwitchCase: 1}],
      '@stylistic/js/no-extra-semi': 'error',
      '@stylistic/js/quotes': ['error', 'single'],
      '@stylistic/js/semi': 'error',
    },
  },
]);
