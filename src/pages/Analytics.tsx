import type { Report } from '../lib/types';
import { reportTypeLabel } from '../lib/utils';
import type { ReportType } from '../lib/types';

interface Props {
  reports: Report[];
}

function BarChart({ data, maxVal, color }: { data: { label: string; value: number }[]; maxVal: number; color: string }) {
  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.map(d => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-slate-500">{d.value}</span>
          <div
            className="w-full rounded-t-sm transition-all duration-500"
            style={{ height: `${maxVal ? (d.value / maxVal) * 80 : 0}px`, backgroundColor: color, minHeight: d.value > 0 ? 4 : 0 }}
          />
          <span className="text-xs text-slate-400 text-center leading-tight" style={{ fontSize: 10 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics({ reports }: Props) {
  const byType = (['intrusion', 'vandalism', 'suspicious', 'environmental', 'sensor_alert', 'other'] as ReportType[]).map(t => ({
    label: reportTypeLabel[t].split(' ')[0],
    value: reports.filter(r => r.type === t).length,
  }));
  const maxType = Math.max(...byType.map(d => d.value), 1);

  // Trend: last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      value: reports.filter(r => {
        const rd = new Date(r.created_at);
        return rd.toDateString() === d.toDateString();
      }).length,
    };
  });
  const maxDay = Math.max(...days.map(d => d.value), 1);

  return (
    <div className="p-6 space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Reports', value: reports.length, sub: 'All time' },
          { label: 'Resolution Rate', value: `${reports.length ? Math.round((reports.filter(r => r.status === 'resolved').length / reports.length) * 100) : 0}%`, sub: 'Resolved' },
          { label: 'Critical Incidents', value: reports.filter(r => r.severity === 'critical').length, sub: 'Require action' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{k.label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{k.value}</p>
            <p className="text-xs text-slate-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Trend chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-1">Incident Trend (7 Days)</h2>
          <p className="text-xs text-slate-400 mb-4">Daily report volume</p>
          <BarChart data={days} maxVal={maxDay} color="#3b82f6" />
        </div>

        {/* By type */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-1">Reports by Type</h2>
          <p className="text-xs text-slate-400 mb-4">Incident category breakdown</p>
          <BarChart data={byType} maxVal={maxType} color="#0ea5e9" />
        </div>
      </div>
    </div>
  );
}