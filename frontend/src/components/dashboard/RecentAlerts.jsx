import { Bell, ChevronRight } from "lucide-react";
import { fcfa, timeAgo } from "../../lib/format";
import { Empty, Panel, RiskPill, StatusPill } from "../ui/Common";

export default function RecentAlerts({ alerts, openCount, onSelect, onSeeAll }) {
  return (
    <Panel
      className="h-full"
      bodyClass="p-3 pt-2"
      title={
        <>
          Alertes récentes
          <span className="rounded-full bg-danger px-2 py-0.5 text-[11px] font-semibold text-white">{openCount}</span>
        </>
      }
      right={
        <button onClick={onSeeAll} className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-brand">
          Voir tout <ChevronRight size={12} />
        </button>
      }
    >
      {alerts.length === 0 ? (
        <Empty>Aucune alerte ouverte.</Empty>
      ) : (
        <ul>
          {alerts.map((a) => (
            <li key={a.id} className="border-b border-line/70 last:border-0">
              <button onClick={() => onSelect(a.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-3.5 text-left hover:bg-canvas">
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap gap-2">
                    <RiskPill prob={a.fraud_probability} action={a.action} />
                    <StatusPill action={a.action} />
                  </div>
                  <p className="text-[13px] font-medium">{a.phone || "Numéro non renseigné"}</p>
                  <p className="text-xs text-soft">{fcfa(a.amount)} • {a.type}</p>
                  <p className="text-xs text-soft">{timeAgo(a.created_at)}</p>
                </div>
                <ChevronRight size={15} className="text-soft" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        onClick={onSeeAll}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-brand/20 bg-brand-soft/60 py-2.5 text-xs font-medium text-brand"
      >
        <Bell size={14} /> Voir toutes les alertes
      </button>
    </Panel>
  );
}
