import { useEffect, useState } from 'react';
import { Search, Filter, X, MapPin, User, Clock, Image, ChevronDown, Eye } from 'lucide-react';
import type { Report, ReportSeverity, ReportSource, ReportStatus, ReportType } from '../lib/types';
import {
  formatDateTime, formatRelativeTime,
  severityColors, statusColors, reportTypeLabel, severityDot
} from '../lib/utils';
import { api } from '../lib/api';
import { usePagination } from '../lib/usePagination';
import Pagination from '../components/Pagination';

interface Props {
  reports: Report[];
  onUpdate: () => void;
}

const SEVERITIES: ReportSeverity[] = ['low', 'medium', 'high', 'critical'];
const STATUSES: ReportStatus[] = ['open', 'investigating', 'resolved', 'dismissed'];
const TYPES: ReportType[] = ['intrusion', 'vandalism', 'suspicious', 'environmental', 'sensor_alert', 'other'];

const SAMPLE_IMAGES = [
  'https://images.pexels.com/photos/877971/pexels-photo-877971.jpeg?w=800',
  'https://images.pexels.com/photos/1108701/pexels-photo-1108701.jpeg?w=800',
  'https://images.pexels.com/photos/2399840/pexels-photo-2399840.jpeg?w=800',
];

const severityBorder: Record<ReportSeverity, string> = {
  low: 'border-l-slate-400',
  medium: 'border-l-amber-500',
  high: 'border-l-orange-500',
  critical: 'border-l-red-600',
};

const sourceColor: Record<ReportSource, string> = {
  sensor: 'text-blue-600',
  mobile: 'text-emerald-600',
  manual: 'text-slate-500',
};

export default function Reports({ reports, onUpdate }: Props) {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<ReportSeverity | ''>('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<ReportType | ''>('');
  const [selected, setSelected] = useState<Report | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = reports.filter(r => {
    const q = search.toLowerCase();
    if (q && !r.title.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q) && !r.reporter_name.toLowerCase().includes(q)) return false;
    if (severityFilter && r.severity !== severityFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (typeFilter && r.type !== typeFilter) return false;
    return true;
  });

  const { page, setPage, totalPages, pageItems } = usePagination(filtered, 5);

  useEffect(() => {
    setPage(1);
  }, [search, severityFilter, statusFilter, typeFilter, setPage]);

  async function updateStatus(id: string, status: ReportStatus) {
    setUpdatingId(id);
await api.liveReports.update(id, { status });
    setUpdatingId(null);
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
    onUpdate();
  }

  const clearFilters = () => {
    setSeverityFilter('');
    setStatusFilter('');
    setTypeFilter('');
    setSearch('');
  };

  const hasFilters = !!(search || severityFilter || statusFilter || typeFilter);

  return (
    <div className="flex h-full">
      {/* List panel */}
      <div className={`flex flex-col ${selected ? 'w-[55%]' : 'w-full'} transition-all duration-200`}>
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search reports, reporter, description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 px-3 py-2 border border-slate-200 rounded-lg">
                <X size={13} /> Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-slate-400" />
            <Select value={severityFilter} onChange={v => setSeverityFilter(v as ReportSeverity | '')} placeholder="Severity" options={SEVERITIES} />
            <Select value={statusFilter} onChange={v => setStatusFilter(v as ReportStatus | '')} placeholder="Status" options={STATUSES} />
            <Select value={typeFilter} onChange={v => setTypeFilter(v as ReportType | '')} placeholder="Type" options={TYPES} labels={reportTypeLabel} />
            <span className="ml-auto text-xs text-slate-400">{filtered.length} results</span>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900">
                <tr>
                  <th className="text-left px-6 py-3.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Incident</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Severity</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Source</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3.5 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageItems.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`group cursor-pointer transition-colors border-l-4 ${severityBorder[r.severity]} ${
                      selected?.id === r.id
                        ? 'bg-blue-50/70'
                        : i % 2 === 0
                        ? 'bg-white hover:bg-slate-50'
                        : 'bg-slate-50/60 hover:bg-slate-100/70'
                    }`}
                    onClick={() => setSelected(r)}
                  >
                    <td className="pl-5 pr-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold flex items-center justify-center shrink-0 uppercase">
                          {r.reporter_name.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 leading-tight truncate">{r.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <User size={10} /> {r.reporter_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">{reportTypeLabel[r.type]}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${severityColors[r.severity]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${severityDot[r.severity]}`} />
                        {r.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold capitalize ${sourceColor[r.source]}`}>
                        {r.source}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 font-mono whitespace-nowrap">{formatRelativeTime(r.created_at)}</td>
                    <td className="px-4 py-3.5 text-right pr-5">
                      <span className="inline-flex w-7 h-7 items-center justify-center rounded-full text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
                        <Eye size={14} />
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">No reports match your filters</td>
                  </tr>
                )}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="flex-1 border-l border-slate-200 bg-white overflow-auto">
          <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Report Detail</h2>
            <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <X size={15} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Image viewer */}
            {(selected.image_url || selected.severity === 'critical' || selected.severity === 'high') && (
              <div className="rounded-xl overflow-hidden bg-slate-900 aspect-video relative">
                <img
                  src={selected.image_url || SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)]}
                  alt="Incident"
                  className="w-full h-full object-cover opacity-90"
                  onError={e => { (e.target as HTMLImageElement).src = SAMPLE_IMAGES[0]; }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
                  <div className="flex items-center gap-1.5 text-white/80 text-xs">
                    <Image size={12} />
                    <span>Incident Photo</span>
                  </div>
                </div>
              </div>
            )}

            {/* Title & badges */}
            <div>
              <h3 className="font-semibold text-slate-900">{selected.title}</h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${severityColors[selected.severity]}`}>
                  {selected.severity}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[selected.status]}`}>
                  {selected.status}
                </span>
                <span className="text-xs text-slate-500 capitalize bg-slate-100 px-2.5 py-1 rounded-full">
                  {selected.source}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-700 leading-relaxed">{selected.description || 'No description provided.'}</p>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <MetaRow icon={<User size={13} />} label="Reporter" value={selected.reporter_name} />
              <MetaRow icon={<Clock size={13} />} label="Reported" value={formatDateTime(selected.created_at)} />
              {selected.zones && <MetaRow icon={<MapPin size={13} />} label="Zone" value={selected.zones.name} />}
              <MetaRow icon={<Filter size={13} />} label="Type" value={reportTypeLabel[selected.type]} />
            </div>

            {/* Status update */}
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Update Status</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    disabled={updatingId === selected.id}
                    onClick={() => updateStatus(selected.id, s)}
                    className={`py-2 rounded-lg text-xs font-medium border transition-all ${selected.status === s ? statusColors[s] + ' ring-2 ring-offset-1 ring-blue-400' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
      <span className="text-slate-400 mt-0.5">{icon}</span>
      <div>
        <p className="text-slate-400 text-xs">{label}</p>
        <p className="text-slate-800 font-medium">{value}</p>
      </div>
    </div>
  );
}

function Select({ value, onChange, placeholder, options, labels }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`appearance-none pl-3 pr-7 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${value ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o} value={o}>{labels ? labels[o as keyof typeof labels] : o.charAt(0).toUpperCase() + o.slice(1)}</option>
        ))}
      </select>
      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}
