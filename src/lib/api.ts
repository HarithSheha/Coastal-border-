const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getToken(): string | null {
  return localStorage.getItem('cbs_token');
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request('/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    logout: () =>
      request('/logout', { method: 'POST' }),
    me: () =>
      request('/me'),
  },

  zones: {
    list:   ()                        => request('/zones'),
    create: (d: any)                  => request('/zones',       { method: 'POST',   body: JSON.stringify(d) }),
    update: (id: string, d: any)      => request(`/zones/${id}`, { method: 'PUT',    body: JSON.stringify(d) }),
    remove: (id: string)              => request(`/zones/${id}`, { method: 'DELETE' }),
  },

  sensors: {
    list:   (params?: string)         => request(`/sensors${params || ''}`),
    create: (d: any)                  => request('/sensors',        { method: 'POST',   body: JSON.stringify(d) }),
    update: (id: string, d: any)      => request(`/sensors/${id}`,  { method: 'PUT',    body: JSON.stringify(d) }),
    remove: (id: string)              => request(`/sensors/${id}`,  { method: 'DELETE' }),
  },

  reports: {
    list:   (params?: string)         => request(`/reports${params || ''}`),
    create: (d: any)                  => request('/reports',        { method: 'POST',   body: JSON.stringify(d) }),
    update: (id: number, d: any)      => request(`/reports/${id}`,  { method: 'PUT',    body: JSON.stringify(d) }),
    remove: (id: number)              => request(`/reports/${id}`,  { method: 'DELETE' }),
  },

  urgencies: {
    list:   ()                        => request('/urgencies'),
    create: (d: any)                  => request('/urgencies', { method: 'POST', body: JSON.stringify(d) }),
  },

  liveReports: {
    list:   (params?: string)         => request(`/live-reports${params || ''}`),
    create: (d: any)                  => request('/live-reports',        { method: 'POST',   body: JSON.stringify(d) }),
    update: (id: string, d: any)      => request(`/live-reports/${id}`,  { method: 'PUT',    body: JSON.stringify(d) }),
    remove: (id: string)              => request(`/live-reports/${id}`,   { method: 'DELETE' }),
  },

  readings: {
    list:   (params?: string)         => request(`/sensor-readings${params || ''}`),
    create: (d: any)                  => request('/sensor-readings', { method: 'POST', body: JSON.stringify(d) }),
  },

  uploadPhoto: async (file: File): Promise<{ filename: string; url: string }> => {
    const token = getToken();
    const form  = new FormData();
    form.append('photo', file);
    const res = await fetch(`${BASE_URL}/upload-photo`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: form,
    });
    if (!res.ok) throw new Error(`Upload failed ${res.status}`);
    return res.json();
  },
};
