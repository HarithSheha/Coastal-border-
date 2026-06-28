import { useState, useEffect, useCallback } from 'react';
import Sidebar, { type Page } from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import LiveMap from './pages/LiveMap';
import Analytics from './pages/Analytics';
import Sensors from './pages/Sensors';
import Zones from './pages/Zones';
import { supabase } from './lib/supabase';
import type { Report, Sensor, Zone } from './lib/types';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [reports, setReports] = useState<Report[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const [reportRes, sensorRes, zoneRes] = await Promise.all([
      supabase
        .from('reports')
        .select('*, zones(*), sensors(*)')
        .order('created_at', { ascending: false }),
      supabase
        .from('sensors')
        .select('*, zones(*)')
        .order('created_at', { ascending: true }),
      supabase
        .from('zones')
        .select('*')
        .order('created_at', { ascending: true }),
    ]);
    if (reportRes.data) setReports(reportRes.data as Report[]);
    if (sensorRes.data) setSensors(sensorRes.data as Sensor[]);
    if (zoneRes.data) setZones(zoneRes.data as Zone[]);
    setLoading(false);
    if (isRefresh) setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const openAlertCount = reports.filter(r => r.status === 'open').length;
  const criticalCount = reports.filter(r => r.severity === 'critical' && r.status === 'open').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm mt-3">Loading SecureZone Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar current={page} onChange={setPage} alertCount={openAlertCount} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header page={page} criticalCount={criticalCount} onRefresh={() => fetchData(true)} refreshing={refreshing} />
        <main className="flex-1 overflow-auto">
          {page === 'dashboard' && (
            <Dashboard reports={reports} sensors={sensors} zones={zones} onNavigate={(p) => setPage(p)} />
          )}
          {page === 'reports' && (
            <Reports reports={reports} onUpdate={() => fetchData()} />
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
