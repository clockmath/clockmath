import type React from "react";
import { GeistMono, GeistSans } from "./fonts";
import "./globals.css";
import { Metadata, Viewport } from "next";
import Analytics from "@/components/Analytics";
import ClarityAnalytics from "@/components/ClarityAnalytics";
import ConsentBanner from "@/components/ConsentBanner";
import WebVitals from "@/components/WebVitals";
import NotOnEmbed from "@/components/NotOnEmbed";

  

export const metadata: Metadata = {
  metadataBase: new URL("https://clockmath.com"),
  title: "Time Duration Calculator & Hours Calculator — ClockMath",
  // Nov 2026: Google answers "how many hours is 9 to 5:30" in its own box, so
  // the snippet leads with a worked answer plus what that box leaves out
  // (dates, overnight, decimal hours for payroll, totals). The title stays:
  // the Oct 17 retitles cost Bing rankings. 157 characters.
  description:
    "How many hours between two times or dates, overnight shifts included. 9 AM to 5:30 PM is 8 h 30 min, or 8.5 decimal hours for payroll. Add up several shifts.",
  generator: "Next.js",
  alternates: {
    canonical: "https://clockmath.com/",
  },
  openGraph: {
    title: "ClockMath — Time Between Two Times",
    description:
      "Quickly compute elapsed time between two times. Handles crossing midnight; shows HH:MM:SS, minutes, and decimal hours.",
    type: "website",
    url: "https://clockmath.com/",
    siteName: "ClockMath",
    images: [
      {
        url: "/og-v4.png?v=3",            // becomes https://clockmath.com/og-v4.png?v=3
        width: 1200,
        height: 630,
        alt: "ClockMath — Time Between Two Times",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-v4.png?v=3"],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1216" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {/* Apply the saved/system theme, and classic view if chosen, before
            paint to avoid a flash of the wrong look. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('clockmath-darkmode');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='true'||(s===null&&m)){document.documentElement.classList.add('dark');}if(localStorage.getItem('clockmath-classic')==='true'){document.documentElement.classList.add('classic');}}catch(e){}})();`,
          }}
        />
        <NotOnEmbed>
          <Analytics />
          <ClarityAnalytics />
          <WebVitals />
        </NotOnEmbed>
        {children}
        <NotOnEmbed>
          <ConsentBanner />
        </NotOnEmbed>
      </body>
    </html>
  );
}