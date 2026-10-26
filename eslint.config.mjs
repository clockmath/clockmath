import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

// `next lint` is deprecated (removed in Next 16), so lint runs through the
// ESLint CLI. eslint-config-next 15 only ships the old config format;
// FlatCompat translates it.
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const eslintConfig = [
  {
    ignores: [
      '.next/', 'out/', '.vercel/', 'drafts/', 'next-env.d.ts',
      // Plain Node (CommonJS) scripts, never linted by `next lint`. The worker
      // files are pasted into the built worker, so their exports look unused;
      // each has its own test instead.
      'scripts/',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];

export default eslintConfig;
