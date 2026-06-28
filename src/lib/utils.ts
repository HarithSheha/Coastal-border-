import type { ReportSeverity, ReportStatus, ReportType, SensorStatus, SensorType, ZoneStatus, ZoneType } from './types';

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export const severityColors: Record<ReportSeverity, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export const severityDot: Record<ReportSeverity, string> = {
  low: 'bg-slate-400',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  critical: 'bg-red-600',
};

export const statusColors: Record<ReportStatus, string> = {
  open: 'bg-red-50 text-red-700 border border-red-200',
  investigating: 'bg-blue-50 text-blue-700 border border-blue-200',
  resolved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  dismissed: 'bg-slate-50 text-slate-500 border border-slate-200',
};

export const sensorStatusColors: Record<SensorStatus, string> = {
  online: 'text-emerald-600',
  offline: 'text-slate-400',
  alert: 'text-red-600',
  maintenance: 'text-amber-600',
};

export const sensorStatusBadge: Record<SensorStatus, string> = {
  online: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  offline: 'bg-slate-100 text-slate-500 border border-slate-200',
  alert: 'bg-red-50 text-red-700 border border-red-200',
  maintenance: 'bg-amber-50 text-amber-700 border border-amber-200',
};

export const zoneStatusBadge: Record<ZoneStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  inactive: 'bg-slate-100 text-slate-500 border border-slate-200',
  breach: 'bg-red-50 text-red-700 border border-red-200',
};

export const zoneTypeLabel: Record<ZoneType, string> = {
  restricted: 'Restricted',
  danger: 'Danger',
  caution: 'Caution',
  checkpoint: 'Checkpoint',
};

export const sensorTypeLabel: Record<SensorType, string> = {
  motion: 'Motion',
  thermal: 'Thermal',
  camera: 'Camera',
  vibration: 'Vibration',
  gas: 'Gas',
  smoke: 'Smoke',
};

export const reportTypeLabel: Record<ReportType, string> = {
  intrusion: 'Intrusion',
  vandalism: 'Vandalism',
  suspicious: 'Suspicious Activity',
  environmental: 'Environmental',
  sensor_alert: 'Sensor Alert',
  other: 'Other',
};
