import { useState, useEffect, useCallback } from 'react';
import Sidebar, { type Page } from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import LiveReports from './pages/LiveReports';
import LiveMap from './pages/LiveMap';
import Analytics from './pages/Analytics';
import Sensors from './pages/Sensors';
import Zones from './pages/Zones';
import LoginPage, { type AuthUser } from './pages/LoginPage';
import { api } from './lib/api';
import type { Report, Sensor, Zone } from './lib/types';

function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('cbs_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [page, setPage] = useState<Page>('dashboard');
  const [reports, setReports] = useState<Report[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [zones, setZones]     = useState<Zone[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [reportData, sensorData, zoneData] = await Promise.all([
        api.liveReports.list(),
        api.sensors.list(),
        api.zones.list(),
      ]);
      if (reportData) setReports(reportData);
      if (sensorData) setSensors(sensorData);
      if (zoneData)   setZones(zoneData);
      setError(null);
    } catch {
      setError('Cannot connect to the backend. Make sure the Laravel server is running on http://localhost:8000');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData, user]);

  const handleLogin = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    setLoading(true);
    setError(null);
  };

  const handleLogout = async () => {
    try { await api.auth.logout(); } catch { /* ignore */ }
    localStorage.removeItem('cbs_token');
    localStorage.removeItem('cbs_user');
    setUser(null);
    setReports([]);
    setSensors([]);
    setZones([]);
    setLoading(true);
    setError(null);
  };

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const openAlertCount = reports.filter(r => r.status === 'open').length;
  const criticalCount  = reports.filter(r => r.severity === 'critical' && r.status === 'open').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm mt-3">Loading SecureZone Dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-white text-lg font-semibold mb-2">Backend Unreachable</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <code className="block bg-slate-800 text-green-400 text-xs px-4 py-3 rounded-lg mb-6">
            php artisan serve
          </code>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setLoading(true); setError(null); fetchData(); }}
              className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-6 py-2.5 rounded-lg transition-colors"
            >
              Retry Connection
            </button>
            <button
              onClick={handleLogout}
              className="bg-slate-700 hover:bg-slate-600 text-white text-sm px-6 py-2.5 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar current={page} onChange={setPage} alertCount={openAlertCount} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header page={page} criticalCount={criticalCount} onRefresh={() => fetchData(true)} refreshing={refreshing} onLogout={handleLogout} />

        <main className="flex-1 overflow-auto">
          {page === 'dashboard' && (
            <Dashboard reports={reports} sensors={sensors} zones={zones} onNavigate={(p) => setPage(p)} />
          )}
          {page === 'reports' && (
            <Reports zones={zones} />
          )}
          {page === 'liveReports' && (
            <LiveReports />
          )}
          {page === 'map' && (
            <LiveMap zones={zones} sensors={sensors} reports={reports} />
          )}
          {page === 'analytics' && (
            <Analytics reports={reports} sensors={sensors} />
          )}
          {page === 'sensors' && (
            <Sensors sensors={sensors} zones={zones} onUpdate={() => fetchData()} />
          )}
          {page === 'zones' && (
            <Zones zones={zones} onUpdate={() => fetchData()} />
          )}
        </main>
      </div>
    </div>
  );
}
