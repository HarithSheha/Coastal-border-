import { useEffect, useState, useCallback, useRef } from 'react';
import {
  X, MapPin, Zap, Activity, RefreshCw, Filter, ChevronDown, Eye,
  AlertTriangle, TrendingUp, Radio,
} from 'lucide-react';
import type { SensorReading, SensorType } from '../lib/types';
import { formatDateTime, formatRelativeTime, sensorTypeLabel } from '../lib/utils';
import { api } from '../lib/api';
import { usePagination } from '../lib/usePagination';
import Pagination from '../components/Pagination';

const REFRESH_INTERVAL = 10;

const sensorTypeIcon: Record<SensorType, string> = {
  motion: '🔵', thermal: '🔴', camera: '📷',
  vibration: '🟡', gas: '🟠', smoke: '⚫',
};

const statusDot: Record<string, string> = {
  online: 'bg-emerald-500', offline: 'bg-slate-400',
  alert: 'bg-red-500 animate-pulse', maintenance: 'bg-amber-400',
};

export default function LiveReports() {
  const [readings, setReadings]     = useState<SensorReading[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected]     = useState<SensorReading | null>(null);
  const [triggeredOnly, setTriggeredOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<SensorType | ''>('');
  const [countdown, setCountdown]   = useState(REFRESH_INTERVAL);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchReadings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await api.readings.list('');
      if (Array.isArray(data)) { setReadings(data); setLastUpdated(new Date()); }
    } catch { /* stale data */ } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
      setCountdown(REFRESH_INTERVAL);
    }
  }, []);

  useEffect(() => {
    fetchReadings();
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { fetchReadings(true); return REFRESH_INTERVAL; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchReadings]);

  /* analytics */
  const alertCount   = readings.filter(r => r.triggered).length;
  const normalCount  = readings.length - alertCount;
  const uniqueSensors = new Set(readings.map(r => r.sensor_id)).size;
  const lastDetection = readings.find(r => r.triggered);

  const filtered = readings.filter(r => {
    if (triggeredOnly && !r.triggered) return false;
    if (typeFilter && r.sensor?.type !== typeFilter) return false;
    return true;
  });

  const { page, setPage, totalPages, pageItems } = usePagination(filtered, 12);
  useEffect(() => { setPage(1); }, [triggeredOnly, typeFilter, setPage]);

  const TYPES: SensorType[] = ['motion', 'thermal', 'camera', 'vibration', 'gas', 'smoke'];

  return (
    <div className="flex flex-col h-full">

      {/* ── Analytics cards ── */}
      <div className="px-6 pt-5 pb-3 grid grid-cols-4 gap-4 bg-slate-50 border-b border-slate-200">
        <StatCard
          icon={<Radio size={18} />}
          label="Total Readings" value={readings.length} sub="sensor data points"
          color="text-blue-600" bg="bg-blue-50"
        />
        <StatCard
          icon={<Zap size={18} />}
          label="Alert Detections" value={alertCount} sub={alertCount > 0 ? 'require attention' : 'all clear'}
          color="text-red-600" bg="bg-red-50"
          highlight={alertCount > 0}
        />
        <StatCard
          icon={<Activity size={18} />}
          label="Normal Readings" value={normalCount} sub="no threshold breach"
          color="text-emerald-600" bg="bg-emerald-50"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Sensors Reporting" value={uniqueSensors} sub={lastDetection ? `last alert ${formatRelativeTime(lastDetection.recorded_at)}` : 'no alerts yet'}
          color="text-amber-600" bg="bg-amber-50"
        />
      </div>

      <div className="flex flex-1 min-h-0">
        {/* ── Feed panel ── */}
        <div className={`flex flex-col ${selected ? 'w-[55%]' : 'w-full'} transition-all duration-200`}>

          {/* Header / filters */}
          <div className="px-6 py-3 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <h1 className="text-sm font-semibold text-slate-800">Live Detection Feed</h1>
                </div>
                {alertCount > 0 && (
                  <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {alertCount} ALERT{alertCount !== 1 ? 'S' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {lastUpdated && (
                  <span className="text-xs text-slate-400">
                    Updated {formatRelativeTime(lastUpdated.toISOString())} · refresh in {countdown}s
                  </span>
                )}
                <button onClick={() => fetchReadings(true)} disabled={refreshing}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors ${refreshing ? 'opacity-50' : ''}`}>
                  <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={13} className="text-slate-400" />
              <button onClick={() => setTriggeredOnly(v => !v)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${triggeredOnly ? 'bg-red-600 text-white border-red-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <Zap size={12} /> Alerts Only
              </button>
              <div className="relative">
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as SensorType | '')}
                  className={`appearance-none pl-3 pr-7 py-1.5 text-xs border rounded-lg focus:outline-none cursor-pointer ${typeFilter ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}>
                  <option value="">All Sensor Types</option>
                  {TYPES.map(t => <option key={t} value={t}>{sensorTypeLabel[t]}</option>)}
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {(triggeredOnly || typeFilter) && (
                <button onClick={() => { setTriggeredOnly(false); setTypeFilter(''); }} className="text-xs text-slate-400 hover:text-slate-700">Clear</button>
              )}
              <span className="ml-auto text-xs text-slate-400">{filtered.length} reading{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-40 gap-3 text-slate-400">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                Loading sensor data…
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900">
                    <tr>
                      <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Sensor</th>
                      <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Zone</th>
                      <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Reading</th>
                      <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Detection</th>
                      <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Time</th>
                      <th className="px-4 py-3.5 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pageItems.map((r, i) => (
                      <tr key={r.id}
                        className={`group transition-colors border-l-4 ${r.triggered ? 'border-l-red-500' : 'border-l-transparent'} ${
                          selected?.id === r.id ? 'bg-blue-50/70'
                          : r.triggered         ? 'bg-red-50/40'
                          : i % 2 === 0         ? 'bg-white'
                          :                       'bg-slate-50/50'
                        }`}>

                        {/* Sensor */}
                        <td className="pl-4 pr-3 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-base leading-none">{r.sensor ? sensorTypeIcon[r.sensor.type] : '●'}</span>
                            <div className="min-w-0">
                              <p className={`text-xs font-semibold truncate ${r.triggered ? 'text-red-800' : 'text-slate-800'}`}>
                                {r.sensor?.name ?? 'Unknown Sensor'}
                              </p>
                              <p className="text-[11px] text-slate-400 capitalize">
                                {r.sensor ? sensorTypeLabel[r.sensor.type] : '—'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Zone */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 text-xs text-slate-600">
                            <MapPin size={11} className="text-slate-400 shrink-0" />
                            <span className="truncate max-w-[110px]">{r.sensor?.zone?.name ?? '—'}</span>
                          </div>
                        </td>

                        {/* Reading */}
                        <td className="px-4 py-3.5">
                          <span className={`font-mono text-xs font-bold ${r.triggered ? 'text-red-700' : 'text-slate-800'}`}>
                            {r.value} <span className="font-normal text-slate-400">{r.unit}</span>
                          </span>
                        </td>

                        {/* Sensor status */}
                        <td className="px-4 py-3.5">
                          {r.sensor ? (
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[r.sensor.status] ?? 'bg-slate-400'}`} />
                              <span className="text-xs text-slate-600 capitalize">{r.sensor.status}</span>
                            </div>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </td>

                        {/* Alert badge */}
                        <td className="px-4 py-3.5">
                          {r.triggered ? (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 border border-red-200 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                              <Zap size={10} /> ALERT
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Normal
                            </span>
                          )}
                        </td>

                        {/* Time */}
                        <td className="px-4 py-3.5 text-xs text-slate-400 font-mono whitespace-nowrap">
                          {formatRelativeTime(r.recorded_at)}
                        </td>

                        {/* Eye button */}
                        <td className="px-3 py-3.5 text-right pr-4">
                          <button
                            onClick={() => setSelected(r)}
                            title="View details"
                            className="inline-flex w-7 h-7 items-center justify-center rounded-full text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && !loading && (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                          {readings.length === 0 ? 'No sensor readings in the database yet.' : 'No readings match your filters.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
              </div>
            )}
          </div>
        </div>

        {/* ── Detail panel ── */}
        {selected && (
          <div className="flex-1 border-l border-slate-200 bg-white overflow-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-800">Detection Detail</h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-5">

              {/* Alert banner */}
              {selected.triggered && (
                <div className="flex items-center gap-3 bg-red-600 text-white rounded-xl px-4 py-3">
                  <AlertTriangle size={18} />
                  <div>
                    <p className="font-semibold text-sm">Alert Threshold Triggered</p>
                    <p className="text-xs text-red-100">This reading exceeded the sensor detection threshold</p>
                  </div>
                </div>
              )}

              {/* Reading value */}
              <div className="bg-slate-50 rounded-xl p-5 text-center">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Recorded Value</p>
                <p className={`text-5xl font-bold ${selected.triggered ? 'text-red-600' : 'text-slate-800'}`}>
                  {selected.value}
                </p>
                <p className="text-base text-slate-500 mt-1 font-medium">{selected.unit}</p>
                <p className="text-xs text-slate-400 mt-2">{formatDateTime(selected.recorded_at)}</p>
              </div>

              {/* Sensor info card */}
              {selected.sensor && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Sensor Information</p>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
                      <span className="text-2xl leading-none">{sensorTypeIcon[selected.sensor.type]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm">{selected.sensor.name}</p>
                        <p className="text-xs text-slate-400 capitalize">{sensorTypeLabel[selected.sensor.type]} Sensor</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${statusDot[selected.sensor.status] ?? 'bg-slate-400'}`} />
                        <span className="text-xs text-slate-600 capitalize">{selected.sensor.status}</span>
                      </div>
                    </div>

                    {/* Battery + Zone */}
                    <div className="grid grid-cols-2 divide-x divide-slate-100">
                      <div className="px-4 py-3">
                        <p className="text-[11px] text-slate-400 mb-1.5">Battery Level</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${selected.sensor.battery_level > 50 ? 'bg-emerald-500' : selected.sensor.battery_level > 20 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${selected.sensor.battery_level}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-8 text-right">{selected.sensor.battery_level}%</span>
                        </div>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-[11px] text-slate-400 mb-1.5">Zone</p>
                        <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <MapPin size={11} className="text-slate-400" />
                          {selected.sensor.zone?.name ?? '—'}
                        </p>
                      </div>
                    </div>

                    {/* Last ping */}
                    <div className="px-4 py-3 border-t border-slate-100">
                      <p className="text-[11px] text-slate-400">Last Ping</p>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">
                        {formatRelativeTime(selected.sensor.last_ping)} &nbsp;·&nbsp; {formatDateTime(selected.sensor.last_ping)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent readings from same sensor */}
              {(() => {
                const siblings = readings.filter(r => r.sensor_id === selected.sensor_id && r.id !== selected.id).slice(0, 6);
                if (siblings.length === 0) return null;
                return (
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Recent Readings — {selected.sensor?.name ?? 'this sensor'}
                    </p>
                    <div className="space-y-2">
                      {siblings.map(s => (
                        <button key={s.id} onClick={() => setSelected(s)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${s.triggered ? 'bg-red-50 border-red-100 hover:bg-red-100' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}>
                          <span className={`font-mono text-sm font-bold ${s.triggered ? 'text-red-700' : 'text-slate-800'}`}>
                            {s.value} <span className="text-xs font-normal text-slate-400">{s.unit}</span>
                          </span>
                          {s.triggered && (
                            <span className="flex items-center gap-0.5 text-[10px] text-red-600 font-bold">
                              <Zap size={9} /> ALERT
                            </span>
                          )}
                          <span className="ml-auto text-[11px] text-slate-400 font-mono">{formatRelativeTime(s.recorded_at)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, bg, highlight }: {
  icon: React.ReactNode; label: string; value: number; sub: string;
  color: string; bg: string; highlight?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border px-4 py-4 flex items-start gap-3 shadow-sm ${highlight ? 'border-red-200' : 'border-slate-200'}`}>
      <div className={`w-9 h-9 rounded-lg ${bg} ${color} flex items-center justify-center shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">{label}</p>
        <p className={`text-2xl font-bold leading-tight ${highlight ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
