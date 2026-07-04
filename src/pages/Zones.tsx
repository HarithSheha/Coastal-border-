import { useState } from 'react';
import { Plus, X, Shield, AlertTriangle } from 'lucide-react';
import type { Zone, ZoneType, ZoneStatus } from '../lib/types';
import { zoneStatusBadge, zoneTypeLabel, formatDateTime } from '../lib/utils';
import { api } from '../lib/api';
import { usePagination } from '../lib/usePagination';
import Pagination from '../components/Pagination';

interface Props {
  zones: Zone[];
  onUpdate: () => void;
}

const ZONE_TYPES: ZoneType[] = ['restricted', 'danger', 'caution', 'checkpoint'];
const ZONE_STATUSES: ZoneStatus[] = ['active', 'inactive', 'breach'];

const typeColors: Record<ZoneType, string> = {
  restricted: 'bg-red-100 text-red-700',
  danger: 'bg-red-200 text-red-900',
  caution: 'bg-amber-100 text-amber-700',
  checkpoint: 'bg-blue-100 text-blue-700',
};

const defaultForm = {
  name: '',
  description: '',
  type: 'restricted' as ZoneType,
  status: 'active' as ZoneStatus,
};

export default function Zones({ zones, onUpdate }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Zone | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const { page, setPage, totalPages, pageItems } = usePagination(zones, 6); // 3 rows x 2 cols

  async function addZone() {
    if (!form.name.trim()) return;
    setSaving(true);
    await api.zones.create(form);
    setSaving(false);
    setShowAdd(false);
    setForm(defaultForm);
    onUpdate();
  }

  async function updateZoneStatus(id: string, status: ZoneStatus) {
    await api.zones.update(id, { status });
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
    onUpdate();
  }

  return (
    <div className="flex h-full">
      {/* List */}
      <div className={`flex flex-col ${selected ? 'w-[60%]' : 'w-full'} transition-all duration-200`}>
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-800">{zones.length} Restricted Zones</h2>
            {zones.filter(z => z.status === 'breach').length > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                <AlertTriangle size={11} /> {zones.filter(z => z.status === 'breach').length} breach{zones.filter(z => z.status === 'breach').length > 1 ? 'es' : ''}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-slate-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Plus size={15} /> Add Zone
          </button>
        </div>

        {/* Zone cards */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            {pageItems.map(z => (
              <button
                key={z.id}
                onClick={() => setSelected(selected?.id === z.id ? null : z)}
                className={`text-left bg-white rounded-xl border p-4 hover:shadow-md transition-all ${
                  selected?.id === z.id ? 'border-blue-400 ring-2 ring-blue-100' :
                  z.status === 'breach' ? 'border-red-300' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900 text-sm truncate">{z.name}</p>
                      {z.status === 'breach' && <AlertTriangle size={14} className="text-red-600 shrink-0 ml-1 animate-pulse" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[z.type]}`}>{zoneTypeLabel[z.type]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${zoneStatusBadge[z.status]}`}>{z.status}</span>
                    </div>
                    {z.description && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{z.description}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="flex-1 border-l border-slate-200 bg-white overflow-auto">
          <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Zone Detail</h2>
            <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <X size={15} />
            </button>
          </div>
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
                <Shield size={20} className="text-slate-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-base">{selected.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[selected.type]}`}>{zoneTypeLabel[selected.type]}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${zoneStatusBadge[selected.status]}`}>{selected.status}</span>
                </div>
              </div>
            </div>

            {selected.description && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-700 leading-relaxed">{selected.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-400">Created</p>
                <p className="text-slate-800 font-medium mt-0.5">
                  {formatDateTime(selected.created_at)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Update Status</p>
              <div className="grid grid-cols-3 gap-2">
                {ZONE_STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => updateZoneStatus(selected.id, s)}
                    className={`py-2 rounded-lg text-xs font-medium border transition-all ${selected.status === s ? zoneStatusBadge[s] + ' ring-2 ring-offset-1 ring-blue-400' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add zone modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-900">Add Restricted Zone</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <Field label="Zone Name">
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. West Perimeter" className="input-field" />
              </Field>
              <Field label="Description">
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe the zone permissions or details..." className="input-field resize-none" />
              </Field>
              <Field label="Type">
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ZoneType }))} className="input-field">
                  {ZONE_TYPES.map(t => <option key={t} value={t}>{zoneTypeLabel[t]}</option>)}
                </select>
              </Field>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button
                onClick={addZone}
                disabled={saving || !form.name.trim()}
                className="flex-1 py-2.5 text-sm bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Zone'}
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