import { Bell, RefreshCw } from 'lucide-react';
import type { Page } from './Sidebar';

const titles: Record<Page, string> = {
  dashboard: 'Overview',
  reports: 'Incident Reports',
  map: 'Live Reports',
  analytics: 'Analytics',
  sensors: 'Sensor Management',
  zones: 'Restricted Zones',
};

interface Props {
  page: Page;
  criticalCount: number;
  onRefresh: () => void;
  refreshing: boolean;
}

export default function Header({ page, criticalCount, onRefresh, refreshing }: Props) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <h1 className="text-slate-900 font-semibold text-base">{titles[page]}</h1>
      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <Bell size={16} />
          {criticalCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600" />
          )}
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-semibold">
            
          </div>
          <span className="text-sm text-slate-700 font-medium"></span>
        </div>
      </div>
    </header>
  );
}
