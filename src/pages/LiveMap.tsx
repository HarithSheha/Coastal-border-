import { useState, useEffect } from 'react';
import { MapPin, Navigation, List, Loader2 } from 'lucide-react';
import type { Zone, Sensor, FieldReport } from '../lib/types';
import { api } from '../lib/api';

export interface MapTarget {
  lat: string;
  lng: string;
  label: string;
}

interface Props {
  zones: Zone[];
  sensors: Sensor[];
  mapTarget?: MapTarget | null;
  onMapTargetConsumed?: () => void;
}

const DEFAULT: MapTarget = { lat: '-6.7700', lng: '39.2038', label: 'Zanzibar Coast Overview' };

function embedUrl(lat: string, lng: string) {
  return `https://maps.google.com/maps?q=${lat},${lng}&z=15&t=m&output=embed`;
}

export default function LiveMap({ mapTarget, onMapTargetConsumed }: Props) {
  const [fieldReports, setFieldReports] = useState<FieldReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MapTarget>(DEFAULT);

  useEffect(() => {
    api.reports.list()
      .then((d: FieldReport[]) => setFieldReports(d ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // When parent pushes a target (from Reports page), jump to it
  useEffect(() => {
    if (mapTarget) {
      setSelected(mapTarget);
      onMapTargetConsumed?.();
    }
  }, [mapTarget, onMapTargetConsumed]);

  // Deduplicate by coordinates
  const locations: MapTarget[] = [];
  const seen = new Set<string>();
  for (const r of fieldReports) {
    if (!r.latitude || !r.longitude) continue;
    const key = `${r.latitude},${r.longitude}`;
    if (seen.has(key)) continue;
    seen.add(key);
    locations.push({
      lat: String(r.latitude),
      lng: String(r.longitude),
      label: r.address,
    });
  }

  const isActive = (loc: MapTarget) =>
    loc.lat === selected.lat && loc.lng === selected.lng;

  return (
    <div className="flex h-full">

      {/* ── Embedded Google Map ── */}
      <div className="flex-1 relative bg-slate-200">
        <iframe
          key={`${selected.lat},${selected.lng}`}
          src={embedUrl(selected.lat, selected.lng)}
          className="w-full h-full border-0"
          title="Google Maps"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />

        {/* Floating current-location badge */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-md px-4 py-2.5 flex items-center gap-2.5 border border-slate-200 max-w-xs">
          <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <MapPin size={14} className="text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{selected.label}</p>
            <p className="text-[11px] text-slate-500 font-mono">{Number(selected.lat).toFixed(5)}, {Number(selected.lng).toFixed(5)}</p>
          </div>
        </div>
      </div>

      {/* ── Right panel: locations list ── */}
      <div className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0">

        <div className="px-4 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-0.5">
            <List size={14} className="text-slate-400" />
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Report Locations
            </h3>
            {!loading && (
              <span className="ml-auto text-[11px] text-slate-400 font-medium">{locations.length}</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">Click any location to view on map</p>
        </div>

        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-400">
              <Loader2 size={14} className="animate-spin" />
              Loading locations…
            </div>
          )}

          {!loading && locations.length === 0 && (
            <div className="py-10 text-center text-xs text-slate-400">
              <MapPin size={24} className="mx-auto mb-2 text-slate-300" />
              No field report locations found
            </div>
          )}

          {locations.map((loc, i) => (
            <button
              key={i}
              onClick={() => setSelected(loc)}
              className={`w-full text-left px-4 py-3 border-b border-slate-50 transition-colors group ${
                isActive(loc)
                  ? 'bg-blue-50 border-l-2 border-l-blue-500'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                  isActive(loc) ? 'bg-blue-500' : 'bg-slate-100 group-hover:bg-blue-100'
                }`}>
                  <MapPin size={10} className={isActive(loc) ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">{loc.label}</p>
                  <p className="text-[10px] text-blue-500 font-mono mt-0.5">
                    {Number(loc.lat).toFixed(5)}, {Number(loc.lng).toFixed(5)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Reset button */}
        <div className="p-3 border-t border-slate-100 shrink-0">
          <button
            onClick={() => setSelected(DEFAULT)}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Navigation size={12} />
            Reset to overview
          </button>
        </div>
      </div>

    </div>
  );
}
