import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import useFetch from "../hooks/useFetch";
import { getAlerts, handleTransaction } from "../services/api";
import { fcfa, fmtDateTime, timeAgo } from "../lib/format";
import { Empty, ErrorBanner, Panel, RiskPill, Spinner, StatusPill } from "../components/ui/Common";
import Pager from "../components/ui/Pager";
import TransactionDrawer from "../components/dashboard/TransactionDrawer";

const LIMIT = 10;
const TABS = [["open", "Ouvertes"], ["handled", "Traitées"], ["all", "Toutes"]];

export default function AlertsPage({ refreshKey, onChanged }) {
  const [status, setStatus] = useState("open");
  const [action, setAction] = useState("");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(null);
  const [rowError, setRowError] = useState("");

  const { data, error, loading, reload } = useFetch(
    () => getAlerts({ status, action: action || undefined, limit: LIMIT, offset }),
    [status, action, offset, refreshKey]
  );

  const treat = async (a) => {
    setRowError("");
    try {
      await handleTransaction(a.id, !a.handled);
      onChanged();
    } catch (e) {
      setRowError(e.message);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">Alertes</h1>
        <p className="text-sm text-ink/70">
          Transactions jugées suspectes par le modèle. Marquer une alerte comme traitée signifie que l'analyste l'a examinée et écartée : elle compte alors comme faux positif.
        </p>
      </div>

      <Panel bodyClass="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
          <div className="flex gap-1 rounded-lg bg-canvas p-1">
            {TABS.map(([k, label]) => (
              <button key={k} onClick={() => { setStatus(k); setOffset(0); }}
                className={`rounded-md px-3 py-1.5 text-sm ${status === k ? "bg-white font-medium shadow-card" : "text-soft"}`}>
                {label}{k === "open" && data ? ` (${data.open_count})` : ""}
              </button>
            ))}
          </div>
          <select value={action} onChange={(e) => { setAction(e.target.value); setOffset(0); }}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
            <option value="">Tous les niveaux</option>
            <option value="BLOCK">Fraude probable</option>
            <option value="VERIFY">À vérifier</option>
          </select>
        </div>
        <div className="px-5 pt-3"><ErrorBanner message={error || rowError} onRetry={reload} /></div>
        {loading && !data ? <Spinner /> : data && (data.items.length === 0 ? <Empty>Aucune alerte dans cette vue.</Empty> : (
          <ul>
            {data.items.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-4 border-b border-line/70 px-5 py-4 last:border-0">
                <div className="min-w-[200px] flex-1 space-y-1.5">
                  <div className="flex flex-wrap gap-2"><RiskPill prob={a.fraud_probability} action={a.action} /><StatusPill action={a.action} /></div>
                  <p className="text-sm font-medium">{a.phone || "Numéro non renseigné"}</p>
                  <p className="text-xs text-soft">{fcfa(a.amount)} • {a.type} • {a.location || "Lieu non renseigné"}</p>
                  <p className="text-xs text-soft">{timeAgo(a.created_at)} ({fmtDateTime(a.created_at)})</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelected(a.id)} className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-xs hover:bg-canvas">
                    Voir <ChevronRight size={13} />
                  </button>
                  <button onClick={() => treat(a)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${a.handled ? "border border-line text-ink hover:bg-canvas" : "bg-brand text-white hover:bg-brand-dark"}`}>
                    <Check size={13} /> {a.handled ? "Rouvrir" : "Marquer comme traité"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ))}
        {data && <Pager offset={offset} limit={LIMIT} total={data.total} onChange={setOffset} />}
      </Panel>
      <TransactionDrawer id={selected} onClose={() => setSelected(null)} onChanged={onChanged} />
    </div>
  );
}
