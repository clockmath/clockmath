// Resolve hook for tests/alias.mjs: `@/x/y` → <repo>/x/y.ts (or .tsx), as
// tsconfig's paths do for Next.
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const isFile = (url) => {
  try {
    return statSync(fileURLToPath(url)).isFile();
  } catch {
    return false;
  }
};

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) {
    for (const ext of ['', '.ts', '.tsx']) {
      const url = new URL(specifier.slice(2) + ext, root);
      if (isFile(url)) return next(url.href, context);
    }
  }
  return next(specifier, context);
}
