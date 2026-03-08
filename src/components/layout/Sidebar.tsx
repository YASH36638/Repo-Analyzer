import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Search, LayoutDashboard, GitBranch, FileCode, Network, BookOpen, Settings, Terminal } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/scan', icon: Search, label: 'New Scan' },
  { to: '/results', icon: FileCode, label: 'Results' },
  { to: '/dependencies', icon: Network, label: 'Dependencies' },
  { to: '/diagrams', icon: GitBranch, label: 'Diagrams' },
  { to: '/docs', icon: BookOpen, label: 'Documentation' },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card flex flex-col">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center glow-green">
          <Terminal className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground">RepoAnalyzer</h1>
          <p className="text-[10px] text-muted-foreground font-mono">v1.0.0</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary glow-green'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
