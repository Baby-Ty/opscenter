import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function App() {
  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto] bg-slate-50/50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <div className="grid grid-cols-1 md:grid-cols-[17rem_1fr] gap-px bg-slate-200/50 dark:bg-slate-800/50">
        <Sidebar />
        <main id="content" className="bg-slate-50/50 dark:bg-slate-950 px-6 py-8">
          <div className="container max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}


