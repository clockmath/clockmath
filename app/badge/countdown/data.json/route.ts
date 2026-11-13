import { badgeEntries } from '@/lib/badges';

// The image badges' table (lib/badges.ts), written into the static export as
// out/badge/countdown/data.json at build time, with the same build day as
// the pages. scripts/build-worker.js reads it into _worker.js, which draws
// /badge/countdown/<slug>.svg from it; the file itself is not used at runtime.
export const dynamic = 'force-static';

export function GET() {
  return Response.json(badgeEntries());
}
