import globals from 'globals';
import eslintJs from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    // JavaScript files
    files: ['**/*.js', '**/*.mjs'],
    ignores: ['node_modules/**'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      ...eslintJs.configs.recommended.rules, // Apply eslint:recommended rules
      'no-console': 'warn',
      'no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'none',
          caughtErrors: 'none',
        },
      ],
    },
  },
  {
    // Typescript files
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['node_modules/**'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 6,
        sourceType: 'module',
        ecmaFeatures: {},
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      ...eslintJs.configs.recommended.rules, // Apply eslint:recommended rules
      ...tseslint.configs.eslintRecommended.rules, // Apply typescript eslintRecommended rules
      ...tseslint.configs.recommended.rules, // Apply typescript recommended rules

      // Base ESLint rules
      'array-bracket-spacing': ['warn', 'never'],
      'arrow-parens': ['warn', 'always'],
      'comma-spacing': 'warn',
      'eol-last': 'error',
      'indent': ['warn', 2, { SwitchCase: 1 }],
      'keyword-spacing': ['error', { before: true, after: true }],
      'no-console': 'warn',
      'no-control-regex': 'off',
      'no-prototype-builtins': 'off',
      'no-shadow': 'warn',
      'no-undef': 'off',
      'no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'none',
          caughtErrors: 'none',
        },
      ],
      'no-useless-escape': 'off',
      'object-curly-spacing': ['warn', 'always'],
      'prefer-const': ['error', { destructuring: 'all' }],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
      'space-before-function-paren': ['error', {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always',
      }],

      // TypeScript-specific rules from @typescript-eslint
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        { 'ts-ignore': 'allow-with-description' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'accessor',
          format: ['camelCase', 'PascalCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'class',
          format: ['PascalCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'classProperty',
          modifiers: ['static', 'readonly'],
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase'],
          leadingUnderscore: 'forbid',
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'interface',
          format: ['PascalCase'],
          leadingUnderscore: 'forbid',
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
      ],
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'none',
          caughtErrors: 'none',
        },
      ],
      '@typescript-eslint/no-use-before-define': 'off',
    },
  },
];
