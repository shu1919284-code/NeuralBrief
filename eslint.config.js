import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // ─── Global ignores ────────────────────────────────────────────────────────
  {
    ignores: [
      'dist/**',
      'server/dist/**',
      'build/**',
      'coverage/**',
      'node_modules/**',
      'server/node_modules/**',
      '*.config.js',        // ignore this file from self-linting
      'public/**',
    ],
  },

  // ─── Base JS recommended rules ─────────────────────────────────────────────
  js.configs.recommended,

  // ─── TypeScript source files ───────────────────────────────────────────────
  {
    files: ['src/**/*.{ts,tsx}', 'server/src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: ['./tsconfig.json', './server/tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      import: importPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
        },
      },
    },
    rules: {
      // ── TypeScript ──────────────────────────────────────────────────────────
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],

      // ── React ───────────────────────────────────────────────────────────────
      'react/react-in-jsx-scope': 'off',       // not needed with React 17+ JSX transform
      'react/prop-types': 'off',               // TypeScript handles prop typing
      'react/jsx-no-target-blank': 'error',
      'react/no-array-index-key': 'warn',
      'react/self-closing-comp': 'error',
      'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],

      // ── React Hooks ─────────────────────────────────────────────────────────
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ── Import order ────────────────────────────────────────────────────────
      'import/order': [
        'error',
        {
          groups: [
            'builtin',      // Node built-ins (path, fs, etc.)
            'external',     // npm packages
            'internal',     // path aliases (@/components, @/lib, etc.)
            'parent',       // ../something
            'sibling',      // ./something
            'index',        // ./
            'type',         // type imports
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['type'],
        },
      ],
      'import/no-duplicates': 'error',
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',

      // ── General JavaScript quality ──────────────────────────────────────────
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'no-shadow': 'off',                       // replaced by TS version
      '@typescript-eslint/no-shadow': 'error',
      'no-return-await': 'off',                 // replaced by TS version
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],
      'object-shorthand': ['error', 'always'],
      'no-useless-rename': 'error',
      'no-param-reassign': ['error', { props: false }],
      'curly': ['error', 'all'],
      'no-else-return': ['error', { allowElseIf: false }],
    },
  },

  // ─── Test files — relaxed rules ────────────────────────────────────────────
  {
    files: ['**/*.{test,spec}.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
];
