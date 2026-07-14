import { useEffect, useState, useCallback } from 'react';
import {
  Search, X, MapPin, Phone, Clock, ChevronDown,
  Eye, Plus, Trash2, AlertTriangle, Users, Calendar,
  ExternalLink, Filter, FileText, Camera,
} from 'lucide-react';
import type { FieldReport, Zone, Urgency } from '../lib/types';
import { formatDateTime, formatRelativeTime } from '../lib/utils';
import { api } from '../lib/api';
import { usePagination } from '../lib/usePagination';
import Pagination from '../components/Pagination';

interface Props { zones: Zone[] }

/* ── helpers ── */
const BACKEND = (import.meta.env.VITE_API_URL as string || 'http://localhost:8000/api').replace(/\/api$/, '');

function photoUrl(photo: string | null): string {
  if (!photo) return '';
  if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
  return `${BACKEND}/storage/${photo}`;
}

function readableDate(dateStr: string): { day: string; rest: string } {
  if (!dateStr) return { day: '—', rest: '' };
  // Normalise MySQL "YYYY-MM-DD HH:MM:SS" → ISO "YYYY-MM-DDTHH:MM:SS"
  const iso = dateStr.replace(' ', 'T');
  // If there's no time component, append midnight so we stay in local time
  const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
  if (isNaN(d.getTime())) return { day: dateStr, rest: '' };
  const day  = d.toLocaleDateString('en-GB', { weekday: 'short' });
  const rest = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return { day, rest };
}

const urgencyColor = (level: string) => {
  const l = (level ?? '').toLowerCase();
  if (l.includes('critical') || l.includes('extreme')) return 'bg-red-100 text-red-700 border border-red-200';
  if (l.includes('high'))                              return 'bg-orange-100 text-orange-700 border border-orange-200';
  if (l.includes('medium') || l.includes('moderate')) return 'bg-amber-100 text-amber-700 border border-amber-200';
  if (l.includes('low') || l.includes('minor'))       return 'bg-green-100 text-green-700 border border-green-200';
  return 'bg-slate-100 text-slate-600 border border-slate-200';
};

const urgencyDot = (level: string) => {
  const l = (level ?? '').toLowerCase();
  if (l.includes('critical') || l.includes('extreme')) return 'bg-red-500';
  if (l.includes('high'))    return 'bg-orange-500';
  if (l.includes('medium'))  return 'bg-amber-500';
  return 'bg-green-500';
};

const emptyForm = {
  date:             new Date().toISOString().slice(0, 10),
  latitude:         '',
  longitude:        '',
  address:          '',
  zone_id:          '',
  color:            '',
  number_of_people: '',
  description:      '',
  photo:            '',
  name:             '',
  phone:            '',
  urgency_id:       '',
};

export default function Reports({ zones }: Props) {
  const [reports, setReports]       = useState<FieldReport[]>([]);
  const [urgencies, setUrgencies]   = useState<Urgency[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<FieldReport | null>(null);
  const [search, setSearch]         = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [urgFilter, setUrgFilter]   = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(emptyForm);
  const [photoFile, setPhotoFile]   = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);
  const [imgError, setImgError]     = useState(false);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function clearPhoto() { setPhotoFile(null); setPhotoPreview(null); setForm(f => ({ ...f, photo: '' })); }

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rData, uData] = await Promise.all([api.reports.list(), api.urgencies.list()]);
      if (Array.isArray(rData)) setReports(rData);
      if (Array.isArray(uData)) setUrgencies(uData);
    } catch { /* empty state */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* analytics */
  const todayStr      = new Date().toISOString().slice(0, 10);
  const totalToday    = reports.filter(r => (r.date ?? '').slice(0, 10) === todayStr).length;
  const withPhoto     = reports.filter(r => !!r.photo).length;
  const totalPeople   = reports.reduce((s, r) => s + (r.number_of_people || 0), 0);

  const filtered = reports.filter(r => {
    const q = search.toLowerCase();
    if (q && !r.address.toLowerCase().includes(q) && !r.name.toLowerCase().includes(q) && !(r.description ?? '').toLowerCase().includes(q)) return false;
    if (zoneFilter && r.zone_id !== zoneFilter) return false;
    if (urgFilter  && String(r.urgency_id) !== urgFilter) return false;
    return true;
  });

  const { page, setPage, totalPages, pageItems } = usePagination(filtered, 8);
  useEffect(() => { setPage(1); }, [search, zoneFilter, urgFilter, setPage]);

  async function deleteReport(id: number) {
    if (!window.confirm('Delete this report permanently?')) return;
    setDeleting(true);
    try { await api.reports.remove(id); setSelected(null); fetchAll(); }
    catch { /* ignore */ } finally { setDeleting(false); }
  }

  async function createReport() {
    if (!form.date)    { setFormError('Date is required.'); return; }
    if (!form.address) { setFormError('Address is required.'); return; }
    if (!form.name)    { setFormError('Reporter name is required.'); return; }
    if (!form.phone)   { setFormError('Reporter phone is required.'); return; }
    if (!form.zone_id) { setFormError('Zone is required.'); return; }
    if (!form.urgency_id) { setFormError('Urgency is required.'); return; }
    if (!form.latitude || !form.longitude) { setFormError('Latitude and Longitude are required.'); return; }
    if (!form.color)   { setFormError('Threat color/marker is required.'); return; }
    if (!form.number_of_people) { setFormError('Number of people is required.'); return; }
    setFormError(null);

    let photoFilename: string | null = form.photo.trim() || null;

    // Upload photo file first if user picked one
    if (photoFile) {
      setUploading(true);
      try {
        const result = await api.uploadPhoto(photoFile);
        photoFilename = result.filename;
      } catch {
        setFormError('Photo upload failed. Check the backend is running.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    setSaving(true);
    try {
      await api.reports.create({
        date: form.date, latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude),
        address: form.address.trim(), zone_id: form.zone_id, color: form.color.trim(),
        number_of_people: parseInt(form.number_of_people), description: form.description.trim() || null,
        photo: photoFilename, name: form.name.trim(), phone: form.phone.trim(),
        urgency_id: parseInt(form.urgency_id),
      });
      setShowCreate(false); setForm(emptyForm); setPhotoFile(null); setPhotoPreview(null); fetchAll();
    } catch { setFormError('Failed to save. Make sure the backend is running.'); }
    finally { setSaving(false); }
  }

  const clearFilters = () => { setSearch(''); setZoneFilter(''); setUrgFilter(''); };
  const hasFilters   = !!(search || zoneFilter || urgFilter);
  const urgLabel     = (r: FieldReport) => r.urgency?.urgency_level ?? `#${r.urgency_id}`;

  return (
    <div className="flex flex-col h-full">

      {/* ── Analytics cards ── */}
      <div className="px-6 pt-5 pb-3 grid grid-cols-4 gap-4 bg-slate-50 border-b border-slate-200">
        <StatCard icon={<FileText size={18} />} label="Total Reports" value={reports.length} sub="in database" color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={<Calendar size={18} />} label="Reported Today" value={totalToday} sub={new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={<Camera size={18} />}   label="With Photos"   value={withPhoto}  sub={`${reports.length - withPhoto} without`} color="text-violet-600" bg="bg-violet-50" />
        <StatCard icon={<Users size={18} />}    label="Total People"  value={totalPeople} sub="across all reports" color="text-amber-600" bg="bg-amber-50" />
      </div>

      <div className="flex flex-1 min-h-0">
        {/* ── List panel ── */}
        <div className={`flex flex-col ${selected ? 'w-[58%]' : 'w-full'} transition-all duration-200`}>

          {/* Toolbar */}
          <div className="px-6 py-3 border-b border-slate-200 bg-white space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search address, reporter, description…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
              {hasFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 px-3 py-2 border border-slate-200 rounded-lg">
                  <X size={13} /> Clear
                </button>
              )}
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-slate-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors whitespace-nowrap">
                <Plus size={15} /> New Report
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={13} className="text-slate-400" />
              <FilterSelect value={zoneFilter} onChange={setZoneFilter} placeholder="Zone"
                options={zones.map(z => ({ value: z.id, label: z.name }))} />
              <FilterSelect value={urgFilter} onChange={setUrgFilter} placeholder="Urgency"
                options={urgencies.map(u => ({ value: String(u.urgency_id), label: u.urgency_level }))} />
              <span className="ml-auto text-xs text-slate-400">{filtered.length} report{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-7 h-7 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900">
                    <tr>
                      <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider w-40">Date & Location</th>
                      <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Reporter</th>
                      <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Urgency</th>
                      <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Zone</th>
                      <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">People</th>
                      <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Photo</th>
                      <th className="px-4 py-3.5 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pageItems.map((r, i) => {
                      const { day, rest } = readableDate(r.date);
                      const pUrl = photoUrl(r.photo);
                      return (
                        <tr key={r.report_id} onClick={() => { setSelected(r); setImgError(false); }}
                          className={`group cursor-pointer transition-colors ${
                            selected?.report_id === r.report_id ? 'bg-blue-50/70'
                            : i % 2 === 0 ? 'bg-white hover:bg-slate-50'
                            : 'bg-slate-50/50 hover:bg-slate-100/70'
                          }`}>

                          {/* Date & Location */}
                          <td className="pl-5 pr-3 py-3.5">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase">{day}</span>
                              <span className="text-xs font-semibold text-slate-800">{rest}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 max-w-[180px] truncate">
                              <MapPin size={9} className="shrink-0" /> {r.address}
                            </p>
                          </td>

                          {/* Reporter */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-500 uppercase shrink-0">
                                {r.name.slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate">{r.name}</p>
                                <p className="text-[11px] text-slate-400 flex items-center gap-0.5">
                                  <Phone size={9} /> {r.phone}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Urgency — level text */}
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${urgencyColor(urgLabel(r))}`}>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${urgencyDot(urgLabel(r))}`} />
                              {urgLabel(r)}
                            </span>
                          </td>

                          {/* Zone */}
                          <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">{r.zone?.name ?? '—'}</td>

                          {/* People */}
                          <td className="px-4 py-3.5">
                            <span className="flex items-center gap-1 text-xs text-slate-700 font-semibold">
                              <Users size={12} className="text-slate-400" /> {r.number_of_people}
                            </span>
                          </td>

                          {/* Photo thumbnail */}
                          <td className="px-4 py-3.5">
                            {pUrl ? (
                              <img src={pUrl} alt="photo" className="w-10 h-10 rounded-lg object-cover border border-slate-200" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <span className="text-[11px] text-slate-300">—</span>
                            )}
                          </td>

                          {/* Eye */}
                          <td className="px-3 py-3.5 text-right pr-4">
                            <span className="inline-flex w-7 h-7 items-center justify-center rounded-full text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
                              <Eye size={14} />
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && !loading && (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                          {reports.length === 0 ? 'No field reports in the database yet.' : 'No reports match your filters.'}
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
        {selected && (() => {
          const { day, rest } = readableDate(selected.date);
          const pUrl = photoUrl(selected.photo);
          const urg  = urgLabel(selected);
          return (
            <div className="flex-1 border-l border-slate-200 bg-white overflow-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between z-10">
                <h2 className="text-sm font-semibold text-slate-800">Report Detail</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => deleteReport(selected.report_id)} disabled={deleting}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors border border-red-200 disabled:opacity-50">
                    <Trash2 size={13} />{deleting ? 'Deleting…' : 'Delete'}
                  </button>
                  <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">

                {/* ── Photo ── */}
                {pUrl && !imgError && (
                  <div className="rounded-xl overflow-hidden bg-slate-100 aspect-video relative group">
                    <img src={pUrl} alt="Incident photo" className="w-full h-full object-cover"
                      onError={() => setImgError(true)} />
                    <a href={pUrl} target="_blank" rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full transition-opacity">
                        Open full size
                      </span>
                    </a>
                  </div>
                )}
                {pUrl && imgError && (
                  <div className="rounded-xl bg-slate-100 border border-slate-200 px-5 py-6 text-center">
                    <Camera size={28} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-500 mb-1">Photo stored on server</p>
                    <p className="text-[11px] text-slate-400 font-mono break-all">{selected.photo}</p>
                    <p className="text-[11px] text-slate-400 mt-2">
                      File not found at <span className="font-mono">{pUrl}</span>
                    </p>
                  </div>
                )}
                {selected.photo && !pUrl && (
                  <div className="rounded-xl bg-slate-100 border border-slate-200 px-5 py-4 flex items-center gap-2">
                    <Camera size={16} className="text-slate-400 shrink-0" />
                    <span className="text-xs text-slate-500 font-mono break-all">{selected.photo}</span>
                  </div>
                )}

                {/* Urgency + Date */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold ${urgencyColor(urg)}`}>
                    <AlertTriangle size={11} />
                    {urg}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-3 py-1 rounded-full font-medium">
                    <Calendar size={11} />
                    <strong>{day}</strong>&nbsp;{rest}
                  </span>
                  <span className="text-xs text-slate-400">{formatRelativeTime(selected.created_at)}</span>
                </div>

                {/* Location */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Location</p>
                  <p className="text-sm font-semibold text-slate-800 leading-snug mb-2">{selected.address}</p>
                  <a href={`https://www.google.com/maps?q=${selected.latitude},${selected.longitude}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-mono">
                    <ExternalLink size={11} />
                    {selected.latitude}, {selected.longitude}
                  </a>
                </div>

                {/* Description */}
                {selected.description && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Description</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{selected.description}</p>
                  </div>
                )}

                {/* Reporter card */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Reporter</p>
                  </div>
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 uppercase shrink-0">
                      {selected.name.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{selected.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone size={11} /> {selected.phone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <MetaRow icon={<Users size={13} />}  label="People on Scene" value={String(selected.number_of_people)} />
                  <MetaRow
                    icon={<span className="w-3 h-3 rounded-full border border-white shadow inline-block" style={{ backgroundColor: selected.color }} />}
                    label="Threat Color" value={selected.color}
                  />
                  {selected.zone && <MetaRow icon={<MapPin size={13} />} label="Zone" value={selected.zone.name} />}
                  <MetaRow icon={<Clock size={13} />} label="Filed At" value={formatDateTime(selected.created_at)} />
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Create Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">New Field Report</h2>
              <button onClick={() => { setShowCreate(false); setForm(emptyForm); setFormError(null); clearPhoto(); }} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">
                  <AlertTriangle size={14} /> {formError}
                </div>
              )}
              <Field label="Date *"><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input-field" /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Latitude *"><input type="number" step="any" value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} placeholder="-1.2921" className="input-field" /></Field>
                <Field label="Longitude *"><input type="number" step="any" value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} placeholder="36.8219" className="input-field" /></Field>
              </div>
              <Field label="Address *"><input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="e.g. North Gate Perimeter" className="input-field" /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Zone *">
                  <select value={form.zone_id} onChange={e => setForm(f => ({ ...f, zone_id: e.target.value }))} className="input-field">
                    <option value="">— Select zone —</option>
                    {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </Field>
                <Field label="Urgency *">
                  <select value={form.urgency_id} onChange={e => setForm(f => ({ ...f, urgency_id: e.target.value }))} className="input-field">
                    <option value="">— Select urgency —</option>
                    {urgencies.map(u => <option key={u.urgency_id} value={String(u.urgency_id)}>{u.urgency_level}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Threat Color *"><input type="text" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="e.g. red, #ff0000" className="input-field" /></Field>
                <Field label="Number of People *"><input type="number" min="0" value={form.number_of_people} onChange={e => setForm(f => ({ ...f, number_of_people: e.target.value }))} placeholder="0" className="input-field" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Reporter Name *"><input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Officer Mwangi" className="input-field" /></Field>
                <Field label="Reporter Phone *"><input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+254 7xx xxx xxx" className="input-field" /></Field>
              </div>
              <Field label="Description (optional)"><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe the incident…" className="input-field resize-none" /></Field>
              {/* Photo picker */}
              <Field label="Photo (optional)">
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="Preview" className="w-full h-36 object-cover rounded-xl border border-slate-200" />
                    <button type="button" onClick={clearPhoto}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80">
                      <X size={12} />
                    </button>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">{photoFile?.name}</p>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors">
                    <Camera size={20} className="text-slate-400 mb-1" />
                    <span className="text-xs text-slate-500">Click to select a photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                  </label>
                )}
              </Field>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => { setShowCreate(false); setForm(emptyForm); setFormError(null); clearPhoto(); }}
                className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={createReport} disabled={saving || uploading}
                className="flex-1 py-2.5 text-sm bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50">
                {uploading ? 'Uploading photo…' : saving ? 'Saving…' : 'Save Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── sub-components ── */

function StatCard({ icon, label, value, sub, color, bg }: {
  icon: React.ReactNode; label: string; value: number; sub: string; color: string; bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-4 flex items-start gap-3 shadow-sm">
      <div className={`w-9 h-9 rounded-lg ${bg} ${color} flex items-center justify-center shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
      <span className="text-slate-400 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-slate-400 text-[11px]">{label}</p>
        <p className="text-slate-800 font-medium text-xs truncate">{value}</p>
      </div>
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

function FilterSelect({ value, onChange, placeholder, options }: {
  value: string; onChange: (v: string) => void; placeholder: string; options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className={`appearance-none pl-3 pr-7 py-1.5 text-xs border rounded-lg focus:outline-none cursor-pointer ${value ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}

