import { Bell, RefreshCw, LogOut } from 'lucide-react';
import type { Page } from './Sidebar';

const titles: Record<Page, string> = {
  dashboard:   'Overview',
  reports:     'Reports',
  liveReports: 'Live Reports',
  map:         'Live Map',
  analytics:   'Analytics',
  sensors:     'Sensor Management',
  zones:       'Restricted Zones',
};

interface Props {
  page: Page;
  criticalCount: number;
  onRefresh: () => void;
  refreshing: boolean;
  onLogout: () => void;
}

export default function Header({ page, criticalCount, onRefresh, refreshing, onLogout }: Props) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <h1 className="text-slate-900 font-semibold text-base">{titles[page]}</h1>

      <div className="flex items-center gap-1">
        <button
          onClick={onRefresh}
          title="Refresh"
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>

        <button
          title="Notifications"
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <Bell size={16} />
          {criticalCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600" />
          )}
        </button>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <button
          onClick={onLogout}
          title="Sign out"
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
        >
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </header>
  );
}
