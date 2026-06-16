import Link from 'next/link';
import ToolsNavigation from '@/components/ToolsNavigation';

interface PageChromeProps {
  children: React.ReactNode;
  currentTool: 'calculator' | 'timezone' | 'countdown' | 'articles';
  className?: string;
  onToggleTheme?: () => void;
  isDarkMode?: boolean;
}

export default function PageChrome({ currentTool, children, className = '', onToggleTheme, isDarkMode }: PageChromeProps) {
  return (
    <div className={`relative min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/20 ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(5,150,105,0.12),transparent_55%)] dark:bg-[radial-gradient(circle_at_50%_120%,rgba(5,150,105,0.18),transparent_55%)]" />
      <main className="relative max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-2 sm:gap-3 mb-6">
            {/* Persistent brand — anchors identity and links home */}
            <Link
              href="/"
              aria-label="ClockMath home"
              className="shrink-0 flex items-center gap-2 rounded-xl transition-opacity hover:opacity-90"
            >
              <span className="grid place-items-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 border border-slate-700 dark:border-slate-600 shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400"
                >
                  <circle cx="12" cy="12" r="9" strokeWidth={2} />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7v5l3 2" />
                </svg>
              </span>
              <span className="hidden md:block text-lg font-bold leading-none">
                <span className="text-emerald-600 dark:text-emerald-400">Clock</span>
                <span className="text-blue-600 dark:text-blue-400">Math</span>
              </span>
            </Link>
            <div className="flex-1 min-w-0">
              <ToolsNavigation currentTool={currentTool} />
            </div>
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm text-foreground dark:text-slate-200 rounded-xl hover:bg-card dark:hover:bg-slate-700 transition-all duration-200 shadow-lg border border-border/50 dark:border-slate-700/50"
                title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
              >
                {isDarkMode ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span className="hidden sm:inline">Light Mode</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                    <span className="hidden sm:inline">Dark Mode</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
