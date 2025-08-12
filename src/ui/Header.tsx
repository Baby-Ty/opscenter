import { Sun, Moon, LayoutGrid } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    const stored = localStorage.getItem('oc-theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('oc-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return { isDark, setIsDark } as const;
}

export default function Header() {
  const { isDark, setIsDark } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/60 dark:border-slate-700/60 glass dark:glass">
      <div className="w-full grid grid-cols-1 md:grid-cols-[17rem_1fr] items-center">
        {/* Left: Logo aligned above the sidebar */}
        <div className="px-4 py-4 md:px-4">
          <Link to="/" className="inline-flex items-center gap-3 focus-ring rounded-lg p-1">
            <div className="h-9 w-9 grid place-items-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg">
              OC
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              OpsCenter
            </span>
          </Link>
        </div>

        {/* Right: Actions aligned with main content width */}
        <div className="px-6 py-4">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-end gap-3">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 focus-ring shadow-sm hover:shadow"
              aria-label="Go to dashboard"
            >
              <LayoutGrid className="h-4 w-4" />
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => setIsDark((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 focus-ring shadow-sm hover:shadow"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}


