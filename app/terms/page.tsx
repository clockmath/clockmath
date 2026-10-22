/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import StationChrome from "@/components/station/StationChrome";
import SiteFooter from "@/components/SiteFooter";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | ClockMath",
  description: "Terms of Service for ClockMath.com — free time duration and timezone calculators. Learn about usage rights, limitations, and legal information.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://clockmath.com/terms",
  },
  openGraph: {
    title: "Terms of Service | ClockMath",
    description: "Terms of Service for ClockMath.com — free time duration and timezone calculators.",
    type: "website",
    url: "https://clockmath.com/terms",
    siteName: "ClockMath",
  },
  twitter: {
    card: "summary",
  },
};

export default function TermsPage() {
  return (
    <StationChrome currentTool="terms">
      <div className="st-intro">
        <h1 className="st-h1">Terms of Service</h1>
        <p className="st-lede">ClockMath.com</p>
      </div>

        {/* Content */}
        <div className="st-article article-prose">
          <div>
            <p className="text-sm text-muted-foreground dark:text-slate-400 mb-6">
              <strong>Effective Date:</strong> January 15, 2025
            </p>

            <p className="mb-6">
              Welcome to ClockMath.com ("we," "our," or "us"). By using this website, you agree to the following Terms of Service. Please read them carefully.
            </p>

            <hr className="my-6 border-border/50 dark:border-slate-700/50" />

            <h2 className="text-2xl font-semibold mb-4">1. Use of the Site</h2>
            <p className="mb-4">
              ClockMath.com provides free online tools and content, including:
            </p>
            <ul className="mb-4">
              <li>Calculators for time durations and the difference between two times</li>
              <li>A timezone converter for comparing times across locations</li>
              <li>Educational articles about time management and related topics</li>
            </ul>
            <ul className="mb-6">
              <li>You may use the site for personal or professional purposes.</li>
              <li>You agree not to misuse the site or attempt to interfere with its functionality.</li>
            </ul>

            <hr className="my-6 border-border/50 dark:border-slate-700/50" />

            <h2 className="text-2xl font-semibold mb-4">2. No Warranties</h2>
            <p className="mb-4">
              This website and its content are provided "as is" without warranties of any kind, either express or implied.
            </p>
            <ul className="mb-6">
              <li>We make no guarantees regarding accuracy, availability, or fitness for a particular purpose.</li>
              <li>While we strive to provide accurate results, our tools and content should not be relied upon for legal, medical, financial, or critical decision-making purposes.</li>
            </ul>

            <hr className="my-6 border-border/50 dark:border-slate-700/50" />

            <h2 className="text-2xl font-semibold mb-4">3. Limitation of Liability</h2>
            <p className="mb-4">
              To the fullest extent permitted by law, ClockMath.com and its operators are not liable for any damages or losses arising from the use of this site, including but not limited to:
            </p>
            <ul className="mb-6">
              <li>Errors or inaccuracies in calculations</li>
              <li>Downtime, bugs, or interruptions in service</li>
              <li>Third-party links or content accessed through the site</li>
            </ul>

            <hr className="my-6 border-border/50 dark:border-slate-700/50" />

            <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
            <p className="mb-4">
              All content on ClockMath.com (text, layout, design) is owned by ClockMath or its content providers.
            </p>
            <ul className="mb-6">
              <li>You may not copy, reproduce, or distribute site content without permission, except for personal use.</li>
            </ul>

            <hr className="my-6 border-border/50 dark:border-slate-700/50" />

            <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
            <p className="mb-4">
              ClockMath.com uses Google Analytics and Google Search Console to analyze traffic. By using the site, you acknowledge that your usage data may be collected in accordance with our{" "}
              <Link href="/privacy" className="text-primary hover:text-primary/80 underline">
                Privacy Policy
              </Link>.
            </p>
            <p className="mb-6">
              If you are in the EEA, UK, or Switzerland, analytics cookies are
              only set after you consent via our cookie banner. You can review or
              change your choice at any time from the Privacy Policy page.
            </p>

            <hr className="my-6 border-border/50 dark:border-slate-700/50" />

            <h2 className="text-2xl font-semibold mb-4">6. Changes to These Terms</h2>
            <p className="mb-6">
              We may update these Terms of Service from time to time. Continued use of the site after changes are posted means you accept the revised terms.
            </p>

            <hr className="my-6 border-border/50 dark:border-slate-700/50" />

            <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
            <p className="mb-6">
              If you have questions about these Terms, please contact us at{" "}
              <a 
                href="mailto:hello@clockmath.com" 
                className="text-primary hover:text-primary/80 underline"
              >
                hello@clockmath.com
              </a>.
            </p>
          </div>
        </div>

        <div style={{ marginTop: 56 }}>
          <SiteFooter />
        </div>
    </StationChrome>
  );
}
