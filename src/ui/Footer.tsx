import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div className="container max-w-7xl mx-auto px-6 py-6 text-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-slate-500 dark:text-slate-400 font-medium">© {new Date().getFullYear()} OpsCenter</p>
        <nav aria-label="Footer" className="flex items-center gap-6 text-slate-600 dark:text-slate-300">
          <a className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors focus-ring rounded-md px-2 py-1" href="#status">Status</a>
          <a className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors focus-ring rounded-md px-2 py-1" href="#docs">Docs</a>
          <a className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors focus-ring rounded-md px-2 py-1" href="#privacy">Privacy</a>
        </nav>
      </div>
    </footer>
  );
}


