import { useCallback, useEffect, useState } from "react";
import useHashRoute from "./hooks/useHashRoute";
import { defaultRange } from "./lib/format";
import { getAlertCount, getCurrentUser, getSystemStatus, setUnauthorizedHandler } from "./services/api";
import { clearToken, getToken } from "./lib/auth";
import { canSee, isSupervisor } from "./lib/roles";
import { Empty, Panel, Spinner } from "./components/ui/Common";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import AlertsPage from "./pages/AlertsPage";
import ModelsPage from "./pages/ModelsPage";
import ReportsPage from "./pages/ReportsPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";

function Console({ user, onUserChanged, onLogout }) {
  const { path, params, navigate } = useHashRoute();
  const [range, setRange] = useState(defaultRange);
  const [refreshKey, setRefreshKey] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [status, setStatus] = useState(null);
  const [refreshedAt, setRefreshedAt] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const refreshShell = useCallback(() => {
    getAlertCount().then((r) => setAlertCount(r.open)).catch(() => {});
    getSystemStatus().then((s) => { setStatus(s); setRefreshedAt(new Date().toISOString()); }).catch(() => setStatus({ operational: false }));
  }, []);

  useEffect(() => { refreshShell(); }, [refreshKey, refreshShell]);
  useEffect(() => {
    const id = setInterval(() => setRefreshKey((k) => k + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const changed = useCallback(() => setRefreshKey((k) => k + 1), []);

  const page = (() => {
    if (!canSee(user?.role, path)) {
      return (
        <Panel title="Accès réservé">
          <Empty>Cette page est réservée aux superviseurs et aux administrateurs. Votre rôle : {user?.role}.</Empty>
        </Panel>
      );
    }
    switch (path) {
      case "/transactions": return <TransactionsPage query={params.q} refreshKey={refreshKey} onChanged={changed} />;
      case "/alerts": return <AlertsPage refreshKey={refreshKey} onChanged={changed} />;
      case "/models": return <ModelsPage refreshKey={refreshKey} />;
      case "/reports": return <ReportsPage range={range} onRange={setRange} refreshKey={refreshKey} />;
      case "/users": return <UsersPage me={user} onUsersChanged={onUserChanged} />;
      case "/settings": return <SettingsPage canEdit={isSupervisor(user?.role)} />;
      default: return <DashboardPage range={range} onRange={setRange} refreshKey={refreshKey} onChanged={changed} navigate={navigate} />;
    }
  })();

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar role={user?.role} current={path} onNavigate={(p) => navigate(p)} alertCount={alertCount} status={status}
        refreshedAt={refreshedAt} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-[244px]">
        <Topbar user={user} alertCount={alertCount} initialQuery={path === "/transactions" ? params.q || "" : ""}
          onSearch={(q) => navigate("/transactions", { q })} onBell={() => navigate("/alerts")} onMenu={() => setMenuOpen(true)} onLogout={onLogout} />
        <main className="px-4 py-5 lg:px-6">{page}</main>
      </div>
    </div>
  );
}


/** Porte d'entree : sans badge valide on affiche la page de connexion, sinon la console. */
export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(() => !!getToken());
  const [notice, setNotice] = useState("");

  const logout = useCallback((message = "") => {
    clearToken();
    setUser(null);
    setNotice(typeof message === "string" ? message : "");
    window.location.hash = "/";
  }, []);

  // Le serveur refuse un badge (expire, desactive...) : retour a la page de connexion.
  useEffect(() => { setUnauthorizedHandler(() => logout("Votre session a expiré, reconnectez-vous.")); }, [logout]);

  // Au chargement : si un badge est deja la, on verifie qu'il est encore bon.
  useEffect(() => {
    if (!getToken()) return;
    getCurrentUser().then(setUser).catch(() => {}).finally(() => setChecking(false));
  }, []);

  if (checking) return <div className="flex min-h-screen items-center justify-center bg-canvas"><Spinner label="Connexion..." /></div>;
  if (!user) return <LoginPage notice={notice} onLoggedIn={(u) => { setNotice(""); setUser(u); }} />;
  return <Console user={user} onUserChanged={() => getCurrentUser().then(setUser).catch(() => {})} onLogout={() => logout()} />;
}
