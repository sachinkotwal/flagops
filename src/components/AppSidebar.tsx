'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, LayoutDashboard, Users, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';

const navItems = [
  { href: '/',         label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users',    label: 'Users',     icon: Users },
  { href: '/settings', label: 'Settings',  icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="fixed top-0 left-0 h-screen w-56 flex flex-col glass border-r border-border/20 z-50">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-20 border-b border-border/10 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight leading-none">FlagOps</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5 leading-none">Governance</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div className="px-3 pb-5 shrink-0">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-all"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </aside>
  );
}
