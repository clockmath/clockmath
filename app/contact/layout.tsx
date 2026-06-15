import type { ReactNode } from "react";
import { generateSEOMetadata } from "@/lib/seo";

// Metadata lives in this server-component layout because the contact page
// itself is a client component ("use client") and can't export metadata.
export const metadata = generateSEOMetadata({
  title: "Contact ClockMath — Questions & Feedback",
  description:
    "Get in touch with the ClockMath team. Send questions, feedback, or feature requests for our free time duration and timezone calculators.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
