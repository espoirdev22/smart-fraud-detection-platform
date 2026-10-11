import { Bell, CreditCard, Cpu, FileText, LayoutDashboard, Settings, ShieldCheck, Users, X } from "lucide-react";
import { fmtDateTime } from "../../lib/format";

export const NAV = [
  { path: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { path: "/transactions", label: "Transactions", icon: CreditCard },
  { path: "/alerts", label: "Alertes", icon: Bell, badge: true },
  { path: "/models", label: "Modèles & IA", icon: Cpu },
  { path: "/reports", label: "Rapports", icon: FileText },
  { path: "/users", label: "Utilisateurs", icon: Users },
  { path: "/settings", label: "Paramètres", icon: Settings },
];

export default function Sidebar({ current, onNavigate, alertCount, status, refreshedAt, open, onClose }) {
  const ok = status?.operational;
  const known = status !== null && status !== undefined;
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden print:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[244px] flex-col bg-gradient-to-b from-navy-950 to-navy-800 text-white transition-transform print:hidden lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <ShieldCheck size={34} strokeWidth={1.6} className="text-white" />
            <div className="leading-tight">
              <p className="text-lg font-semibold">FraudGuard</p>
              <p className="text-xs text-white/70">Mobile Money</p>
            </div>
          </div>
          <button className="lg:hidden" onClick={onClose} aria-label="Fermer le menu">
            <X size={20} />
          </button>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-4">
          {NAV.map(({ path, label, icon: Icon, badge }) => {
            const active = current === path;
            return (
              <button
                key={path}
                onClick={() => {
                  onNavigate(path);
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[14px] transition ${
                  active ? "bg-brand font-medium text-white" : "text-white/85 hover:bg-white/10"
                }`}
              >
                <Icon size={19} />
                <span className="flex-1">{label}</span>
                {badge && alertCount > 0 && (
                  <span className="min-w-[22px] rounded-full bg-danger px-1.5 py-0.5 text-center text-[11px] font-semibold">
                    {alertCount > 99 ? "99+" : alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="m-4 rounded-xl border border-white/20 bg-white/5 p-4 text-xs">
          <p className="flex items-center gap-2 font-medium">
            <span className={`h-2.5 w-2.5 rounded-full ${!known ? "bg-white/40" : ok ? "bg-emerald-400" : "bg-danger"}`} />
            <span className={!known ? "text-white/70" : ok ? "text-emerald-300" : "text-red-300"}>
              {!known ? "Vérification..." : ok ? "Système opérationnel" : "Système dégradé"}
            </span>
          </p>
          <p className="mt-3 text-white/70">Dernière mise à jour</p>
          <p className="mt-1 text-white/90">{refreshedAt ? fmtDateTime(refreshedAt) : "—"}</p>
        </div>
      </aside>
    </>
  );
}
