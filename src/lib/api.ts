// src/lib/api.ts
const BASE_URL = import.meta.env.VITE_API_URL || 'http://172.18.8.21:8000/api';

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  zones:   { list: () => request('/zones'),            create: (d: any) => request('/zones', { method: 'POST', body: JSON.stringify(d) }),
             update: (id: string, d: any) => request(`/zones/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
             remove: (id: string) => request(`/zones/${id}`, { method: 'DELETE' }) },

  sensors: { list: (params?: string) => request(`/sensors${params || ''}`),
             create: (d: any) => request('/sensors', { method: 'POST', body: JSON.stringify(d) }),
             update: (id: string, d: any) => request(`/sensors/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
             remove: (id: string) => request(`/sensors/${id}`, { method: 'DELETE' }) },

  // New sighting reports (report_id, zone_id, urgency_id, ...)
  reports: { list: (params?: string) => request(`/reports${params || ''}`),
             create: (d: any) => request('/reports', { method: 'POST', body: JSON.stringify(d) }),
             update: (id: number, d: any) => request(`/reports/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
             remove: (id: number) => request(`/reports/${id}`, { method: 'DELETE' }) },

  urgencies: { list: () => request('/urgencies'),
             create: (d: any) => request('/urgencies', { method: 'POST', body: JSON.stringify(d) }) },

  // Old incident/sensor-alert reports, moved from /reports to /live-reports
  liveReports: { list: (params?: string) => request(`/live-reports${params || ''}`),
             create: (d: any) => request('/live-reports', { method: 'POST', body: JSON.stringify(d) }),
             update: (id: string, d: any) => request(`/live-reports/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
             remove: (id: string) => request(`/live-reports/${id}`, { method: 'DELETE' }) },

  readings:{ list: (params?: string) => request(`/sensor-readings${params || ''}`),
             create: (d: any) => request('/sensor-readings', { method: 'POST', body: JSON.stringify(d) }) },
};