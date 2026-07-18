import type { FieldReport, SensorReading, Sensor } from '../lib/types';

interface Props {
  fieldReports: FieldReport[];
  readings: SensorReading[];
  sensors: Sensor[];
}

function BarChart({ data, maxVal, color }: { data: { label: string; value: number }[]; maxVal: number; color: string }) {
  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.map(d => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-slate-500">{d.value || ''}</span>
          <div
            className="w-full rounded-t-sm transition-all duration-500"
            style={{ height: `${maxVal ? (d.value / maxVal) * 80 : 0}px`, backgroundColor: color, minHeight: d.value > 0 ? 4 : 0 }}
          />
          <span className="text-[10px] text-slate-400 text-center leading-tight">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics({ fieldReports, readings, sensors }: Props) {
  const resolved   = fieldReports.filter(r => r.status === 'resolved').length;
  const unresolved = fieldReports.filter(r => r.status === 'unresolved').length;
  const resolutionRate = fieldReports.length
    ? Math.round((resolved / fieldReports.length) * 100)
    : 0;
  const triggeredReadings = readings.filter(r => r.triggered).length;

  // Build a local-timezone date string to avoid UTC shift mismatches
  function localDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // Incident trend — last 30 days, using created_at (submission date)
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dateStr = localDateStr(d);
    return {
      label: d.getDate() === 1 || i === 0 || i === 29
        ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        : String(d.getDate()),
      value: fieldReports.filter(r => (r.created_at ?? '').replace(' ', 'T').slice(0, 10) === dateStr).length,
    };
  });
  const maxDay = Math.max(...days.map(d => d.value), 1);

  // Reports by urgency level
  const urgencyMap: Record<string, number> = {};
  for (const r of fieldReports) {
    const label = r.urgency?.urgency_level ?? `#${r.urgency_id}`;
    urgencyMap[label] = (urgencyMap[label] ?? 0) + 1;
  }
  const byUrgency = Object.entries(urgencyMap).map(([label, value]) => ({ label: label.split(' ')[0], value }));
  const maxUrg = Math.max(...byUrgency.map(d => d.value), 1);

  // Sensor alert trend — last 30 days
  const alertDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dateStr = localDateStr(d);
    return {
      label: d.getDate() === 1 || i === 0 || i === 29
        ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        : String(d.getDate()),
      value: readings.filter(r => r.triggered && (r.recorded_at ?? '').replace(' ', 'T').slice(0, 10) === dateStr).length,
    };
  });
  const maxAlertDay = Math.max(...alertDays.map(d => d.value), 1);

  // Status breakdown for sensors
  const onlineSensors  = sensors.filter(s => s.status === 'online').length;
  const alertSensors   = sensors.filter(s => s.status === 'alert').length;
  const offlineSensors = sensors.filter(s => s.status === 'offline').length;

  return (
    <div className="p-6 space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Field Reports', value: fieldReports.length,    sub: 'All time' },
          { label: 'Resolved',            value: resolved,               sub: `${unresolved} still unresolved` },
          { label: 'Resolution Rate',     value: `${resolutionRate}%`,   sub: 'of all reports' },
          { label: 'Sensor Alerts',       value: triggeredReadings,      sub: 'triggered readings' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{k.label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{k.value}</p>
            <p className="text-xs text-slate-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Incident trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-1">Incident Trend (30 Days)</h2>
          <p className="text-xs text-slate-400 mb-4">Daily field report volume</p>
          <BarChart data={days} maxVal={maxDay} color="#3b82f6" />
        </div>

        {/* By urgency */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-1">Reports by Urgency</h2>
          <p className="text-xs text-slate-400 mb-4">Urgency level breakdown</p>
          {byUrgency.length > 0
            ? <BarChart data={byUrgency} maxVal={maxUrg} color="#0ea5e9" />
            : <p className="text-xs text-slate-400 text-center py-10">No reports yet</p>
          }
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Sensor alert trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-1">Sensor Alert Trend (30 Days)</h2>
          <p className="text-xs text-slate-400 mb-4">Daily triggered readings</p>
          <BarChart data={alertDays} maxVal={maxAlertDay} color="#ef4444" />
        </div>

        {/* Sensor health */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-1">Sensor Health</h2>
          <p className="text-xs text-slate-400 mb-4">Current status breakdown</p>
          <div className="space-y-3">
            {[
              { label: 'Online',  value: onlineSensors,  total: sensors.length, color: 'bg-emerald-500' },
              { label: 'Alert',   value: alertSensors,   total: sensors.length, color: 'bg-red-500' },
              { label: 'Offline', value: offlineSensors, total: sensors.length, color: 'bg-slate-300' },
            ].map(row => (
              <div key={row.label}>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>{row.label}</span>
                  <span className="font-semibold">{row.value} / {row.total}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${row.color} transition-all duration-500`}
                    style={{ width: `${row.total ? (row.value / row.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
