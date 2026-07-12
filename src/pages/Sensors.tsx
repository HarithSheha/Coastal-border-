import { useEffect, useState } from 'react';
import {
  Plus, X, Thermometer, Camera, Activity, Wind, Flame, Radio,
  AlertTriangle, Wifi, WifiOff, Battery, Clock, Trash2, TrendingUp,
} from 'lucide-react';
import type { Sensor, Zone, SensorType, SensorStatus, SensorReading } from '../lib/types';
import { sensorStatusBadge, sensorTypeLabel, formatRelativeTime, formatDateTime } from '../lib/utils';
import { api } from '../lib/api';
import { usePagination } from '../lib/usePagination';
import Pagination from '../components/Pagination';

interface Props {
  sensors: Sensor[];
  zones: Zone[];
  onUpdate: () => void;
}

const SENSOR_TYPES: SensorType[] = ['motion', 'thermal', 'camera', 'vibration', 'gas', 'smoke'];
const SENSOR_STATUSES: SensorStatus[] = ['online', 'offline', 'alert'];

const typeIcon = (type: SensorType) => {
  const cls = 'w-4 h-4';
  switch (type) {
    case 'thermal':   return <Thermometer className={cls} />;
    case 'camera':    return <Camera className={cls} />;
    case 'vibration': return <Activity className={cls} />;
    case 'gas':       return <Wind className={cls} />;
    case 'smoke':     return <Flame className={cls} />;
    default:          return <Radio className={cls} />;
  }
};

const statusIcon = (status: SensorStatus) => {
  switch (status) {
    case 'online':  return <Wifi size={14} className="text-emerald-500" />;
    case 'offline': return <WifiOff size={14} className="text-slate-400" />;
    case 'alert':   return <AlertTriangle size={14} className="text-red-500" />;
    default:        return <Radio size={14} className="text-slate-400" />;
  }
};

/** Mini sparkline bar chart for readings */
function ReadingsChart({ readings }: { readings: SensorReading[] }) {
  if (readings.length === 0) return null;
  const vals = readings.map(r => r.value);
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals, 0);
  const range = max - min || 1;
  const bars = [...readings].reverse().slice(0, 20);

  return (
    <div className="flex items-end gap-0.5 h-10 w-full">
      {bars.map((r, i) => {
        const pct = ((r.value - min) / range) * 100;
        return (
          <div
            key={i}
            title={`${r.value} ${r.unit}`}
            className={`flex-1 rounded-sm min-w-[4px] transition-all ${r.triggered ? 'bg-red-400' : 'bg-blue-400'}`}
            style={{ height: `${Math.max(pct, 8)}%` }}
          />
        );
      })}
    </div>
  );
}

export default function Sensors({ sensors, zones, onUpdate }: Props) {
  const [showAdd, setShowAdd]     = useState(false);
  const [selected, setSelected]   = useState<Sensor | null>(null);
  const [form, setForm]           = useState({ name: '', zone_id: '', type: 'motion' as SensorType });
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [filter, setFilter]       = useState<SensorStatus | ''>('');

  const [readings, setReadings]         = useState<SensorReading[]>([]);
  const [loadingReadings, setLoadingReadings] = useState(false);

  const filtered = filter ? sensors.filter(s => s.status === filter) : sensors;
  const { page, setPage, totalPages, pageItems } = usePagination(filtered, 6);

  useEffect(() => { setPage(1); }, [filter, setPage]);

  // Fetch readings whenever the selected sensor changes
  useEffect(() => {
    if (!selected) { setReadings([]); return; }
    setLoadingReadings(true);
    api.readings.list(`?sensor_id=${selected.id}`)
      .then(data => setReadings(Array.isArray(data) ? data : []))
      .catch(() => setReadings([]))
      .finally(() => setLoadingReadings(false));
  }, [selected?.id]);

  async function addSensor() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.sensors.create({
        name:          form.name,
        zone_id:       form.zone_id || null,
        type:          form.type,
        status:        'online',
        battery_level: 100,
        last_ping:     new Date().toISOString(),
        metadata:      {},
      });
      setShowAdd(false);
      setForm({ name: '', zone_id: '', type: 'motion' });
      onUpdate();
    } catch (err) {
      console.error('Failed to add sensor:', err);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: SensorStatus) {
    try {
      await api.sensors.update(id, { status });
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
      onUpdate();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }

  async function deleteSensor(id: string) {
    if (!window.confirm('Delete this sensor permanently? All its readings will also be removed.')) return;
    setDeleting(true);
    try {
      await api.sensors.remove(id);
      setSelected(null);
      setReadings([]);
      onUpdate();
    } catch (err) {
      console.error('Failed to delete sensor:', err);
    } finally {
      setDeleting(false);
    }
  }

  const countByStatus = (s: SensorStatus) => sensors.filter(x => x.status === s).length;

  const triggeredCount = readings.filter(r => r.triggered).length;
  const latestReading  = readings[0];

  return (
    <div className="flex h-full">
      {/* ── Left: card grid ── */}
      <div className={`flex flex-col ${selected ? 'w-[60%]' : 'w-full'} transition-all duration-200`}>

        {/* Header / filters */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex gap-2">
            {(['', 'online', 'alert', 'offline'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s as SensorStatus | '')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                  filter === s
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s === '' ? `All (${sensors.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${countByStatus(s as SensorStatus)})`}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-slate-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Plus size={15} /> Add Sensor
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-3 gap-4">
            {pageItems.map(s => (
              <button
                key={s.id}
                onClick={() => setSelected(selected?.id === s.id ? null : s)}
                className={`text-left bg-white rounded-xl border p-4 hover:shadow-md transition-all ${
                  selected?.id === s.id ? 'border-blue-400 ring-2 ring-blue-100' :
                  s.status === 'alert'  ? 'border-red-200' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    s.status === 'alert'  ? 'bg-red-100 text-red-600' :
                    s.status === 'online' ? 'bg-emerald-100 text-emerald-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {typeIcon(s.type)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {statusIcon(s.status)}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sensorStatusBadge[s.status]}`}>
                      {s.status}
                    </span>
                  </div>
                </div>

                <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                <p className="text-xs text-slate-500 mt-0.5 capitalize">{sensorTypeLabel[s.type]}</p>
                {s.zones && (
                  <p className="text-xs text-slate-400 mt-1 truncate">Zone: {s.zones.name}</p>
                )}

                {/* Battery bar */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 flex-1">
                    <Battery size={12} className={
                      s.battery_level > 50 ? 'text-emerald-500' :
                      s.battery_level > 20 ? 'text-amber-500' : 'text-red-500'
                    } />
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          s.battery_level > 50 ? 'bg-emerald-500' :
                          s.battery_level > 20 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${s.battery_level}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 tabular-nums">{s.battery_level}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-2">
                  <Clock size={10} className="text-slate-300" />
                  <span className="text-xs text-slate-400">{formatRelativeTime(s.last_ping)}</span>
                </div>
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-20 text-slate-400 text-sm">No sensors found</div>
            )}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>

      {/* ── Right: detail panel ── */}
      {selected && (
        <div className="flex-1 border-l border-slate-200 bg-white overflow-auto">

          {/* Panel header */}
          <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
            <h2 className="text-sm font-semibold text-slate-800">Sensor Detail</h2>
            <div className="flex items-center gap-2">
              {/* Delete button */}
              <button
                onClick={() => deleteSensor(selected.id)}
                disabled={deleting}
                title="Delete sensor"
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors border border-red-200 hover:border-red-300 disabled:opacity-50"
              >
                <Trash2 size={13} />
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Sensor identity */}
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                selected.status === 'alert'  ? 'bg-red-100 text-red-600' :
                selected.status === 'online' ? 'bg-emerald-100 text-emerald-600' :
                'bg-slate-100 text-slate-500'
              }`}>
                <div className="w-7 h-7">{typeIcon(selected.type)}</div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-base">{selected.name}</h3>
                <p className="text-sm text-slate-500 capitalize">{sensorTypeLabel[selected.type]} Sensor</p>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Status',    value: selected.status,               icon: statusIcon(selected.status) },
                { label: 'Battery',   value: `${selected.battery_level}%`,  icon: <Battery size={13} /> },
                { label: 'Last Ping', value: formatRelativeTime(selected.last_ping), icon: <Clock size={13} /> },
                { label: 'Added',     value: formatDateTime(selected.created_at),    icon: <Clock size={13} /> },
              ].map(m => (
                <div key={m.label} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 mt-0.5">{m.icon}</span>
                  <div>
                    <p className="text-slate-400">{m.label}</p>
                    <p className="text-slate-800 font-medium capitalize">{m.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Zone */}
            {selected.zones && (
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Assigned Zone</p>
                <p className="text-sm font-medium text-slate-800">{selected.zones.name}</p>
                <p className="text-xs text-slate-500 capitalize">{selected.zones.type}</p>
              </div>
            )}

            {/* Change status */}
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Change Status</p>
              <div className="grid grid-cols-3 gap-2">
                {SENSOR_STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selected.id, s)}
                    className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                      selected.status === s
                        ? sensorStatusBadge[s] + ' ring-2 ring-offset-1 ring-blue-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Readings section ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-slate-500" />
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Sensor Readings</p>
                </div>
                {readings.length > 0 && (
                  <span className="text-xs text-slate-400">{readings.length} recorded</span>
                )}
              </div>

              {loadingReadings ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : readings.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl">
                  <TrendingUp size={22} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No readings recorded yet</p>
                </div>
              ) : (
                <>
                  {/* Summary chips */}
                  <div className="flex gap-2 mb-3">
                    {latestReading && (
                      <div className="flex-1 bg-blue-50 border border-blue-100 rounded-lg p-2.5">
                        <p className="text-xs text-blue-500 mb-0.5">Latest Reading</p>
                        <p className="text-sm font-bold text-blue-700 tabular-nums">
                          {latestReading.value} <span className="font-normal text-xs">{latestReading.unit}</span>
                        </p>
                        <p className="text-xs text-blue-400 mt-0.5">{formatRelativeTime(latestReading.recorded_at)}</p>
                      </div>
                    )}
                    {triggeredCount > 0 && (
                      <div className="flex-1 bg-red-50 border border-red-100 rounded-lg p-2.5">
                        <p className="text-xs text-red-500 mb-0.5">Triggered Alerts</p>
                        <p className="text-sm font-bold text-red-700 tabular-nums">{triggeredCount}</p>
                        <p className="text-xs text-red-400 mt-0.5">of {readings.length} readings</p>
                      </div>
                    )}
                  </div>

                  {/* Sparkline chart */}
                  <div className="bg-slate-50 rounded-xl p-3 mb-3">
                    <p className="text-xs text-slate-400 mb-2">Value history (latest → oldest, red = triggered)</p>
                    <ReadingsChart readings={readings} />
                  </div>

                  {/* Reading rows */}
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {readings.map(r => (
                      <div key={r.id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${r.triggered ? 'bg-red-50 border border-red-100' : 'bg-slate-50'}`}>
                        <div className="flex items-center gap-2">
                          {r.triggered && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
                          )}
                          <span className={`font-semibold tabular-nums ${r.triggered ? 'text-red-700' : 'text-slate-800'}`}>
                            {r.value}
                          </span>
                          <span className="text-slate-400">{r.unit}</span>
                          {r.triggered && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium">ALERT</span>
                          )}
                        </div>
                        <span className="text-slate-400 ml-2 flex-shrink-0">{formatRelativeTime(r.recorded_at)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add sensor modal ── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-900">Add New Sensor</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <Field label="Sensor Name">
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Motion Sensor N3"
                  className="input-field"
                />
              </Field>
              <Field label="Type">
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as SensorType }))} className="input-field">
                  {SENSOR_TYPES.map(t => <option key={t} value={t}>{sensorTypeLabel[t]}</option>)}
                </select>
              </Field>
              <Field label="Zone (optional)">
                <select value={form.zone_id} onChange={e => setForm(f => ({ ...f, zone_id: e.target.value }))} className="input-field">
                  <option value="">No zone</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </Field>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={addSensor}
                disabled={saving || !form.name.trim()}
                className="flex-1 py-2.5 text-sm bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Adding…' : 'Add Sensor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
