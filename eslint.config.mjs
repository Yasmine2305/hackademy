/**
 * ESLint : repère les erreurs et les mauvaises pratiques avant l'exécution
 * (variables inutilisées, hooks React mal utilisés, imports oubliés…).
 * Lancer : npm run lint
 */
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['**/node_modules/**', 'client/dist/**', 'server/data/**', 'docs/**', 'test-results/**'] },
  js.configs.recommended,

  // Frontend React
  {
    files: ['client/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: '18.3' } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off', // projet en JavaScript, pas en TypeScript
      'react/no-unescaped-entities': 'off', // apostrophes françaises dans le texte
    },
  },
  {
    files: ['client/vite.config.js'],
    languageOptions: { globals: globals.node },
  },

  // Tests multi-navigateurs (Playwright) et fichiers de configuration
  {
    files: ['e2e/**/*.mjs', '*.mjs'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.node, ...globals.browser } },
  },

  // Backend Node.js
  {
    files: ['server/**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: globals.node },
  },
];
