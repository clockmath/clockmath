import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import globals from 'globals';

// `next lint` is deprecated (removed in Next 16), so lint runs through the
// ESLint CLI. eslint-config-next 15 only ships the old config format;
// FlatCompat translates it.
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const eslintConfig = [
  {
    ignores: [
      '.next/', 'out/', '.vercel/', 'drafts/', 'next-env.d.ts',
      // Plain Node (CommonJS) scripts, never linted by `next lint`. The
      // worker files are linted on their own below; their tests are Node.
      'scripts/*',
      '!scripts/worker/',
      'scripts/worker/*.test.js',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript')
    .map((c) => ({ ...c, ignores: [...(c.ignores ?? []), 'scripts/worker/**'] })),
  // Oct 2026 review: the worker (headers, CSP, APIs, redirects) reached
  // production unlinted. The files are script fragments pasted one after
  // another into the built _worker.js, so top-level names are shared between
  // them and look unused within one file: only catch mistakes inside a file.
  {
    files: ['scripts/worker/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { ...globals.serviceworker, __cmQuiz: 'readonly' },
    },
    rules: {
      'no-unused-vars': ['error', { vars: 'local', args: 'none', caughtErrors: 'none' }],
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-unreachable': 'error',
      'no-self-assign': 'error',
      'no-cond-assign': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'use-isnan': 'error',
      'valid-typeof': 'error',
      'no-fallthrough': 'error',
      eqeqeq: ['error', 'smart'],
    },
  },
];

export default eslintConfig;
