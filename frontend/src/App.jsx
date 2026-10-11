import { useCallback, useEffect, useState } from "react";
import useHashRoute from "./hooks/useHashRoute";
import { defaultRange } from "./lib/format";
import { getAlertCount, getCurrentUser, getSystemStatus } from "./services/api";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import AlertsPage from "./pages/AlertsPage";
import ModelsPage from "./pages/ModelsPage";
import ReportsPage from "./pages/ReportsPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  const { path, params, navigate } = useHashRoute();
  const [range, setRange] = useState(defaultRange);
  const [refreshKey, setRefreshKey] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(null);
  const [refreshedAt, setRefreshedAt] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const refreshShell = useCallback(() => {
    getAlertCount().then((r) => setAlertCount(r.open)).catch(() => {});
    getSystemStatus().then((s) => { setStatus(s); setRefreshedAt(new Date().toISOString()); }).catch(() => setStatus({ operational: false }));
  }, []);

  useEffect(() => { getCurrentUser().then(setUser).catch(() => {}); }, []);
  useEffect(() => { refreshShell(); }, [refreshKey, refreshShell]);
  useEffect(() => {
    const id = setInterval(() => setRefreshKey((k) => k + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const changed = useCallback(() => setRefreshKey((k) => k + 1), []);

  const page = (() => {
    switch (path) {
      case "/transactions": return <TransactionsPage query={params.q} refreshKey={refreshKey} onChanged={changed} />;
      case "/alerts": return <AlertsPage refreshKey={refreshKey} onChanged={changed} />;
      case "/models": return <ModelsPage refreshKey={refreshKey} />;
      case "/reports": return <ReportsPage range={range} onRange={setRange} refreshKey={refreshKey} />;
      case "/users": return <UsersPage onUsersChanged={() => getCurrentUser().then(setUser).catch(() => {})} />;
      case "/settings": return <SettingsPage />;
      default: return <DashboardPage range={range} onRange={setRange} refreshKey={refreshKey} onChanged={changed} navigate={navigate} />;
    }
  })();

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar current={path} onNavigate={(p) => navigate(p)} alertCount={alertCount} status={status}
        refreshedAt={refreshedAt} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-[244px]">
        <Topbar user={user} alertCount={alertCount} initialQuery={path === "/transactions" ? params.q || "" : ""}
          onSearch={(q) => navigate("/transactions", { q })} onBell={() => navigate("/alerts")} onMenu={() => setMenuOpen(true)} />
        <main className="px-4 py-5 lg:px-6">{page}</main>
      </div>
    </div>
  );
}
