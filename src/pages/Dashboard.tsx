import { FileText, Radio, Shield, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import type { FieldReport, SensorReading, Sensor, Zone } from '../lib/types';
import { formatRelativeTime } from '../lib/utils';
import { usePagination } from '../lib/usePagination';
import Pagination from '../components/Pagination';

interface Props {
  fieldReports: FieldReport[];
  readings: SensorReading[];
  sensors: Sensor[];
  zones: Zone[];
  onNavigate: (page: 'reports' | 'liveReports' | 'sensors' | 'zones' | 'map') => void;
}

const urgencyDot = (level: string) => {
  const l = (level ?? '').toLowerCase();
  if (l.includes('critical') || l.includes('extreme')) return 'bg-red-500';
  if (l.includes('high'))    return 'bg-orange-500';
  if (l.includes('medium'))  return 'bg-amber-500';
  return 'bg-green-500';
};

export default function Dashboard({ fieldReports, readings, sensors, zones, onNavigate }: Props) {
  const unresolvedReports  = fieldReports.filter(r => r.status === 'unresolved').length;
  const alertSensors       = sensors.filter(s => s.status === 'alert').length;
  const offlineSensors     = sensors.filter(s => s.status === 'offline').length;
  const breachZones        = zones.filter(z => z.status === 'breach').length;
  const activeAlerts       = readings.filter(r => r.triggered && r.status === 'unresolved').length;

  const sortedReports  = [...fieldReports].sort((a, b) => b.report_id - a.report_id);
  const recentIncidents = usePagination(sortedReports, 5);
  const zoneStatusList  = usePagination(zones, 5);
  const sensorOverview  = usePagination(sensors, 8);

  const stats = [
    {
      label: 'Field Reports',
      value: fieldReports.length,
      sub: `${unresolvedReports} unresolved`,
      icon: <FileText size={20} />,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Sensor Alerts',
      value: activeAlerts,
      sub: `${readings.filter(r => r.triggered).length} total triggered`,
      icon: <AlertTriangle size={20} />,
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
      label: 'Monitored Zones',
      value: zones.filter(z => z.status === 'active').length,
      sub: `${breachZones} breach detected`,
      icon: <Shield size={20} />,
      color: 'text-slate-600',
      bg: 'bg-slate-50',
      border: 'border-slate-100',
    },
  ];

  return (
    <div className="p-6 space-y-6">
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
        {/* Recent field reports */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-800">Recent Field Reports</h2>
            </div>
            <button onClick={() => onNavigate('reports')}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
              View all <ChevronRight size={13} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentIncidents.pageItems.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No reports yet.</p>
            ) : recentIncidents.pageItems.map(r => {
              const urg = r.urgency?.urgency_level ?? `Urgency #${r.urgency_id}`;
              return (
                <div key={r.report_id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${urgencyDot(urg)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{r.address}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{r.name}</span>
                      <span>·</span>
                      <span>{formatRelativeTime(r.created_at)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 capitalize">
                      {urg}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={recentIncidents.page} totalPages={recentIncidents.totalPages} onChange={recentIncidents.setPage} />
        </div>

        {/* Zone status */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-800">Zone Status</h2>
            </div>
            <button onClick={() => onNavigate('zones')}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
              Manage <ChevronRight size={13} />
            </button>
          </div>
          <div className="p-4 space-y-2.5">
            {zoneStatusList.pageItems.map(z => (
              <div key={z.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: z.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{z.name}</p>
                  <p className="text-xs text-slate-500">{z.type}</p>
                </div>
                <span className={`text-xs font-semibold ${
                  z.status === 'breach' ? 'text-red-600' :
                  z.status === 'active' ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  {z.status === 'breach' ? '● BREACH' : z.status === 'active' ? '● OK' : '○ OFF'}
                </span>
              </div>
            ))}
          </div>
          <Pagination page={zoneStatusList.page} totalPages={zoneStatusList.totalPages} onChange={zoneStatusList.setPage} />
        </div>
      </div>

      {/* Sensor overview */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-800">Sensor Overview</h2>
          </div>
          <button onClick={() => onNavigate('sensors')}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
            Manage <ChevronRight size={13} />
          </button>
        </div>
        <div className="p-4 grid grid-cols-4 gap-3">
          {sensorOverview.pageItems.map(s => (
            <div key={s.id}
              className={`p-3 rounded-lg border ${
                s.status === 'alert'   ? 'border-red-200 bg-red-50' :
                s.status === 'offline' ? 'border-slate-200 bg-slate-50' :
                'border-slate-100 bg-white'
              }`}>
              <div className="mb-1.5">
                <span className={`w-2 h-2 rounded-full inline-block ${
                  s.status === 'online' ? 'bg-emerald-500' :
                  s.status === 'alert'  ? 'bg-red-500 animate-pulse' :
                  'bg-slate-300'
                }`} />
              </div>
              <p className="text-xs font-medium text-slate-800 truncate">{s.name}</p>
              <p className="text-xs text-slate-500 capitalize">{s.type}</p>
            </div>
          ))}
          {sensors.length === 0 && (
            <p className="col-span-4 text-xs text-slate-400 text-center py-6">No sensors registered.</p>
          )}
        </div>
        <Pagination page={sensorOverview.page} totalPages={sensorOverview.totalPages} onChange={sensorOverview.setPage} />
      </div>
    </div>
  );
}
