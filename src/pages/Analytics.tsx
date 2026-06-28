import type { Report, Sensor } from '../lib/types';
import { reportTypeLabel, severityColors } from '../lib/utils';
import type { ReportSeverity, ReportType } from '../lib/types';

interface Props {
  reports: Report[];
  sensors: Sensor[];
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

function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="w-24 h-24 rounded-full bg-slate-100" />;

  let cumulativeAngle = -90;
  const radius = 40;
  const cx = 50;
  const cy = 50;

  const paths = slices.map(slice => {
    const pct = slice.value / total;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + pct * 360;
    cumulativeAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArc = pct > 0.5 ? 1 : 0;
    const d = pct >= 1
      ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius} Z`
      : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return { ...slice, d, pct };
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-24 h-24">
        {paths.map(p => <path key={p.label} d={p.d} fill={p.color} />)}
        <circle cx={cx} cy={cy} r={22} fill="white" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fill="#64748b">{total}</text>
      </svg>
      <div className="space-y-1.5">
        {slices.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-slate-600">{s.label}</span>
            <span className="text-slate-400 ml-1">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Analytics({ reports, sensors }: Props) {
  const bySeverity = (['critical', 'high', 'medium', 'low'] as ReportSeverity[]).map(s => ({
    label: s.charAt(0).toUpperCase() + s.slice(1),
    value: reports.filter(r => r.severity === s).length,
    color: s === 'critical' ? '#dc2626' : s === 'high' ? '#ea580c' : s === 'medium' ? '#d97706' : '#94a3b8',
  }));

  const byStatus = [
    { label: 'Open', value: reports.filter(r => r.status === 'open').length, color: '#dc2626' },
    { label: 'Investigating', value: reports.filter(r => r.status === 'investigating').length, color: '#2563eb' },
    { label: 'Resolved', value: reports.filter(r => r.status === 'resolved').length, color: '#059669' },
    { label: 'Dismissed', value: reports.filter(r => r.status === 'dismissed').length, color: '#94a3b8' },
  ];

  const byType = (['intrusion', 'vandalism', 'suspicious', 'environmental', 'sensor_alert', 'other'] as ReportType[]).map(t => ({
    label: reportTypeLabel[t].split(' ')[0],
    value: reports.filter(r => r.type === t).length,
  }));
  const maxType = Math.max(...byType.map(d => d.value), 1);

  const bySource = [
    { label: 'Mobile', value: reports.filter(r => r.source === 'mobile').length, color: '#0ea5e9' },
    { label: 'Sensor', value: reports.filter(r => r.source === 'sensor').length, color: '#8b5cf6' },
    { label: 'Manual', value: reports.filter(r => r.source === 'manual').length, color: '#64748b' },
  ];

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

  const sensorStats = [
    { label: 'Online', value: sensors.filter(s => s.status === 'online').length, color: '#059669' },
    { label: 'Alert', value: sensors.filter(s => s.status === 'alert').length, color: '#dc2626' },
    { label: 'Maintenance', value: sensors.filter(s => s.status === 'maintenance').length, color: '#d97706' },
    { label: 'Offline', value: sensors.filter(s => s.status === 'offline').length, color: '#94a3b8' },
  ];

  const avgBattery = sensors.length ? Math.round(sensors.reduce((s, x) => s + x.battery_level, 0) / sensors.length) : 0;

  return (
    <div className="p-6 space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: reports.length, sub: 'All time' },
          { label: 'Resolution Rate', value: `${reports.length ? Math.round((reports.filter(r => r.status === 'resolved').length / reports.length) * 100) : 0}%`, sub: 'Resolved' },
          { label: 'Critical Incidents', value: reports.filter(r => r.severity === 'critical').length, sub: 'Require action' },
          { label: 'Avg Sensor Battery', value: `${avgBattery}%`, sub: `${sensors.length} sensors` },
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
