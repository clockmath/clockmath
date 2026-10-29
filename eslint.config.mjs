import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import globals from 'globals';

// Lint runs through the ESLint CLI (`next lint` is gone in Next 16, and
// `next build` no longer lints). eslint-config-next 16 ships flat configs;
// until Oct 2026 FlatCompat translated 15's old-format ones.

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
  ...[...nextVitals, ...nextTs]
    .map((c) => ({ ...c, ignores: [...(c.ignores ?? []), 'scripts/worker/**'] })),
  // Oct 2026 (Next 16 upgrade): eslint-config-next 16 brings the React
  // Compiler-era hook rules. 48 hits, none new behaviour: mostly the
  // read-browser-state-after-mount pattern the static export relies on for
  // hydration (set-state-in-effect, 36 in 24 files), plus refs read inside
  // event callbacks and a Date.now() fallback before mount. Warnings, so they
  // show without blocking deploys; reworking them is its own task (NOTES.md).
  {
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/use-memo': 'warn',
    },
  },
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
