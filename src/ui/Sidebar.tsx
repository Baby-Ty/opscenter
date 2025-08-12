import { Link, NavLink } from 'react-router-dom';
import { LayoutDashboard, GitPullRequest, ShieldAlert, BrainCog, AlertTriangle, BookOpenCheck } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/rfc', label: 'Change Requests', icon: GitPullRequest },
  { to: '/risks', label: 'Risk Register', icon: ShieldAlert },
  { to: '/rca', label: 'Root Cause', icon: BrainCog },
  { to: '/ic-caution', label: 'IC Caution', icon: AlertTriangle },
  { to: '/knowledge-capture', label: 'Knowledge Capture', icon: BookOpenCheck },
];

export default function Sidebar() {
  return (
    <aside className="border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <nav aria-label="Primary" className="px-4 py-6 md:px-4">
        <ul className="grid grid-cols-2 md:block gap-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl focus-ring transition-all duration-200 text-sm font-medium group ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`h-4 w-4 transition-transform duration-200 ${!isActive ? 'group-hover:scale-110' : ''}`} />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}


