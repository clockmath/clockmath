// node --import ./tests/alias.mjs — lets `node --test` load lib modules that
// import with the `@/` alias (lib/holidays.ts, markets.ts, timesheet.ts…).
// Oct 2026 review: those modules had no tests because Node couldn't resolve
// `@/lib/x`; tests themselves still import with relative paths.
import { register } from 'node:module';

register('./alias-hooks.mjs', import.meta.url);
