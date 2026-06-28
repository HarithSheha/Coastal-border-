import { useState } from 'react';
import { Radio, Shield, AlertTriangle, Wifi, WifiOff, Thermometer, Camera, Activity, Wind, Flame, Clock, Inbox } from 'lucide-react';
import type { Report, Sensor, Zone } from '../lib/types';
import { formatRelativeTime, sensorStatusBadge, zoneStatusBadge, severityColors } from '../lib/utils';

interface Props {
  zones: Zone[];
  sensors: Sensor[];
  reports: Report[];
}

const sensorStatusIcon = (status: string) => {
  if (status === 'online') return <Wifi size={12} className="text-emerald-500" />;
  if (status === 'offline') return <WifiOff size={12} className="text-slate-400" />;
  if (status === 'alert') return <AlertTriangle size={12} className="text-red-500" />;
  return <Radio size={12} className="text-amber-500" />;
};

export default function LiveMap({ zones, sensors, reports }: Props) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Sorted list of all active incoming reports
  const allReports = [...reports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const activeAlerts = sensors.filter(s => s.status === 'alert');

  return (
    <div className="flex h-full gap-0 bg-slate-50">
      
      {/* Reports Display Dashboard (Replaced the Map Area) */}
      <div className="flex-1 p-6 flex flex-col h-full overflow-hidden">
        <div className="px-6 py-4 bg-white border border-b-0 border-slate-200 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox size={16} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-800">Incident Reports Log ({allReports.length})</h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Monitoring Live Stream</span>
          </div>
        </div>

        <div className="flex-1 bg-white border border-slate-200 rounded-b-2xl p-6 overflow-auto">
          {allReports.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
              <Inbox size={32} className="stroke-1 mb-2 text-slate-300" />
              <p className="text-sm">No incidents or events recorded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allReports.map(r => {
                const isSelected = selectedReport?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedReport(isSelected ? null : r)}
                    className={`text-left p-5 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-blue-400 bg-blue-50/50 ring-2 ring-blue-100' 
                        : 'border-slate-200 bg-slate-50/30 hover:bg-slate-50 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-white ${severityColors[r.severity]}`}>
                            {r.severity}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock size={11} /> {formatRelativeTime(r.created_at)}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-900 text-sm">{r.title}</h4>
                      </div>
                    </div>
                    
                    {/* Collapsed Description Snippet */}
                    {!isSelected && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {r.description}
                      </p>
                    )}

                    {/* Extended Description view when clicked */}
                    {isSelected && (
                      <div className="mt-4 pt-3 border-t border-slate-200/60 animate-fadeIn">
                        <p className="text-xs text-slate-700 font-medium uppercase tracking-wide text-slate-400 mb-1">Details</p>
                        <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                          {r.description}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Metric Monitoring Panel */}
      <div className="w-72 flex flex-col border-l border-slate-200 bg-white overflow-auto h-full shrink-0">
        {/* Active alerts */}
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Active System Alerts</h3>
          {activeAlerts.length === 0 ? (
            <p className="text-xs text-slate-400">All equipment scanning clear</p>
          ) : (
            <div className="space-y-2">
              {activeAlerts.map(s => (
                <div key={s.id} className="flex items-center gap-2 p-2.5 bg-red-50 rounded-lg border border-red-100">
                  <AlertTriangle size={13} className="text-red-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-red-800 truncate">{s.name}</p>
                    <p className="text-xs text-red-500 capitalize">{s.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zone status */}
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Zone Status</h3>
          <div className="space-y-2">
            {zones.map(z => (
              <div key={z.id} className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: z.color || '#cbd5e1' }} />
                <span className="text-xs text-slate-700 flex-1 truncate">{z.name}</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${zoneStatusBadge[z.status]}`}>{z.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sensor statuses */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Hardware Status</h3>
          <div className="space-y-2">
            {sensors.map(s => (
              <div key={s.id} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-50">
                {sensorStatusIcon(s.status)}
                <span className="text-xs text-slate-600 flex-1 truncate">{s.name}</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${sensorStatusBadge[s.status]}`}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}