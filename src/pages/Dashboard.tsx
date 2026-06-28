import { AlertTriangle, FileText, Radio, Shield, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import type { Report, Sensor, Zone } from '../lib/types';
import { formatRelativeTime, severityColors, statusColors, severityDot } from '../lib/utils';

interface Props {
  reports: Report[];
  sensors: Sensor[];
  zones: Zone[];
  onNavigate: (page: 'reports' | 'sensors' | 'zones' | 'map') => void;
}

export default function Dashboard({ reports, sensors, zones, onNavigate }: Props) {
  const openReports = reports.filter(r => r.status === 'open').length;
  const criticalReports = reports.filter(r => r.severity === 'critical').length;
  const alertSensors = sensors.filter(s => s.status === 'alert').length;
  const offlineSensors = sensors.filter(s => s.status === 'offline').length;
  const breachZones = zones.filter(z => z.status === 'breach').length;
  const recentReports = [...reports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);

  const stats = [
    {
      label: 'Open Incidents',
      value: openReports,
      sub: `${criticalReports} critical`,
      icon: <FileText size={20} />,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100',
    },
    {
      label: 'Active Sensors',
      value: sensors.filter(s => s.status === 'online').length,
      sub: `${alertSensors} alerting · ${offlineSensors} offline`,
      icon: <Radio size={20} />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Restricted Zones',
      value: zones.filter(z => z.status === 'active').length,
      sub: `${breachZones} breach detected`,
      icon: <Shield size={20} />,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Total Reports ',
      value: reports.length,
      sub: `${reports.filter(r => r.source === 'sensor').length} from sensors`,
      icon: <TrendingUp size={20} />,
      color: 'text-slate-600',
      bg: 'bg-slate-50',
      border: 'border-slate-100',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Alert banner for critical */}
      {criticalReports > 0 && (
        <div className="bg-red-600 text-white rounded-xl px-5 py-3.5 flex items-center gap-3">
          <AlertTriangle size={18} className="shrink-0" />
          <span className="text-sm font-medium">
            {criticalReports} critical incident{criticalReports > 1 ? 's' : ''} require immediate attention
          </span>
          <button
            onClick={() => onNavigate('reports')}
            className="ml-auto text-xs bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-lg font-medium"
          >
            View All
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className={`bg-white rounded-xl border ${s.border} p-5`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${s.bg} ${s.color} flex items-center justify-center`}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Recent activity */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-800">Recent Incidents</h2>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              View all <ChevronRight size={13} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentReports.map(r => (
              <div key={r.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${severityDot[r.severity]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{r.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>{r.reporter_name}</span>
                    <span>·</span>
                    <span>{formatRelativeTime(r.created_at)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColors[r.severity]}`}>
                    {r.severity}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[r.status]}`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone status */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-800">Zone Status</h2>
            </div>
            <button
              onClick={() => onNavigate('zones')}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              Manage <ChevronRight size={13} />
            </button>
          </div>
          <div className="p-4 space-y-2.5">
            {zones.map(z => (
              <div key={z.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: z.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{z.name}</p>
                  <p className="text-xs text-slate-500">{z.type}</p>
                </div>
                <span className={`text-xs font-semibold ${z.status === 'breach' ? 'text-red-600' : z.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {z.status === 'breach' ? '● BREACH' : z.status === 'active' ? '● OK' : '○ OFF'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sensor quick view */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-800">Sensor Overview</h2>
          </div>
          <button
            onClick={() => onNavigate('sensors')}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
          >
            Manage <ChevronRight size={13} />
          </button>
        </div>
        <div className="p-4 grid grid-cols-4 gap-3">
          {sensors.map(s => (
            <div
              key={s.id}
              className={`p-3 rounded-lg border ${s.status === 'alert' ? 'border-red-200 bg-red-50' : s.status === 'offline' ? 'border-slate-200 bg-slate-50' : 'border-slate-100 bg-white'}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`w-2 h-2 rounded-full ${s.status === 'online' ? 'bg-emerald-500' : s.status === 'alert' ? 'bg-red-500 animate-pulse' : s.status === 'maintenance' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                <span className="text-xs text-slate-400">{s.battery_level}%</span>
              </div>
              <p className="text-xs font-medium text-slate-800 truncate">{s.name}</p>
              <p className="text-xs text-slate-500 capitalize">{s.type}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
