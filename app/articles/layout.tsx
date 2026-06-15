import type { ReactNode } from "react";
import { generateSEOMetadata } from "@/lib/seo";

// Metadata for the /articles index. The index page is a client component, and
// individual /articles/[slug] pages export their own metadata which overrides
// this for those routes.
export const metadata = generateSEOMetadata({
  title: "Time & Timezone Guides — ClockMath Articles",
  description:
    "Browse every ClockMath guide: calculator tutorials, timezone playbooks, and productivity tips to master time across work and life.",
  path: "/articles",
});

export default function ArticlesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
