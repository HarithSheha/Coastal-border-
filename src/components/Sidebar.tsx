import { LayoutDashboard, FileText, Map, BarChart3, Shield, Radio, AlertTriangle, Activity } from 'lucide-react';

export type Page = 'dashboard' | 'reports' | 'liveReports' | 'map' | 'analytics' | 'sensors' | 'zones';

interface Props {
  current: Page;
  onChange: (p: Page) => void;
  alertCount: number;
}

const nav: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',   label: 'Dashboard',          icon: <LayoutDashboard size={18} /> },
  { id: 'reports',     label: 'Reports',              icon: <FileText size={18} /> },
  { id: 'liveReports', label: 'Live Reports',         icon: <Activity size={18} /> },
  { id: 'map',         label: 'Live Map',             icon: <Map size={18} /> },
  { id: 'analytics',   label: 'Analytics',            icon: <BarChart3 size={18} /> },
  { id: 'sensors',     label: 'Sensors',              icon: <Radio size={18} /> },
  { id: 'zones',       label: 'Restricted Zones',     icon: <Shield size={18} /> },
];

export default function Sidebar({ current, onChange, alertCount }: Props) {
  return (
    <aside className="w-60 min-h-screen bg-slate-900 flex flex-col">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
            <AlertTriangle size={16} className="text-white" />
          </div>
          <div>
            <p className="text-yellow-400 font-bold text-sm leading-tight">SecureZone</p>
            <p className="text-slate-400 text-xs">Staff Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              current === id
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <span className={current === id ? 'text-red-400' : ''}>{icon}</span>
            <span>{label}</span>
            {id === 'liveReports' && alertCount > 0 && (
              <span className="ml-auto bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {alertCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400">System Online</span>
        </div>
      </div>
    </aside>
  );
}
