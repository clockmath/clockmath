import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found — ClockMath",
  robots: { index: false, follow: true },
};

const links = [
  { href: "/", label: "Time Calculator", desc: "Time between two times" },
  { href: "/tools/timezone/", label: "Timezone Converter", desc: "Convert across timezones" },
  { href: "/tools/countdown/", label: "Countdown Timer", desc: "Count down to any date" },
  { href: "/tools/timesheet/", label: "Timesheet", desc: "Add up your work hours" },
];

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4 py-12">
      <div className="w-full max-w-lg text-center bg-card/70 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-border/50 dark:border-slate-700/50">
        <div className="text-6xl font-extrabold tracking-tight">
          <span className="text-emerald-600 dark:text-emerald-400">4</span>
          <span className="text-blue-600 dark:text-blue-400">0</span>
          <span className="text-emerald-600 dark:text-emerald-400">4</span>
        </div>
        <h1 className="mt-3 text-xl font-bold text-foreground dark:text-slate-100">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground dark:text-slate-400">
          That page doesn&apos;t exist or may have moved. Try one of our free tools:
        </p>

        <div className="mt-6 grid gap-2 sm:grid-cols-2 text-left">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-xl border border-border/50 dark:border-slate-700/50 bg-background/60 dark:bg-slate-900/40 px-4 py-3 hover:border-primary/50 hover:bg-muted/50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <span className="block font-medium text-foreground dark:text-slate-100">{l.label}</span>
              <span className="block text-xs text-muted-foreground">{l.desc}</span>
            </Link>
          ))}
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
        >
          Back to ClockMath
        </Link>
      </div>
    </div>
  );
}
