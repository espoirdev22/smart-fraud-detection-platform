import { useState } from "react";
import { ArrowRight, Check, MapPin, Phone, RotateCcw, Wallet, X } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import { getTransaction, handleTransaction } from "../../services/api";
import { dec, fcfa, fmtDateTimeSec } from "../../lib/format";
import { ErrorBanner, Panel, RiskPill, Spinner, StatusPill } from "../ui/Common";
import AnalysisModal from "./AnalysisModal";

function historyText(t) {
  if (!t.phone) return "Numéro non renseigné";
  const h = t.phone_history;
  if (h.flagged > 0) return `Client suspect (${h.flagged} alerte${h.flagged > 1 ? "s" : ""} antérieure${h.flagged > 1 ? "s" : ""})`;
  return h.total > 0 ? `Aucune alerte antérieure (${h.total} transaction${h.total > 1 ? "s" : ""})` : "Premier passage de ce numéro";
}

export default function DetailPanel({ id, onClose, onChanged }) {
  const { data: t, error, loading, reload } = useFetch(() => getTransaction(id), [id]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [analysis, setAnalysis] = useState(false);

  const toggleHandled = async () => {
    setBusy(true);
    setActionError("");
    try {
      await handleTransaction(t.id, !t.handled);
      reload();
      onChanged?.();
    } catch (e) {
      setActionError(e.message);
    }
    setBusy(false);
  };

  return (
    <Panel
      title="Détail de la transaction"
      className="h-full"
      bodyClass="p-0"
      right={
        <button onClick={onClose} aria-label="Fermer" className="text-soft hover:text-ink">
          <X size={18} />
        </button>
      }
    >
      {loading && !t ? (
        <Spinner />
      ) : error && !t ? (
        <div className="p-5"><ErrorBanner message={error} onRetry={reload} /></div>
      ) : t ? (
        <div>
          <div className="flex flex-wrap gap-2 px-5 pt-4 pb-3">
            <RiskPill prob={t.fraud_probability} action={t.action} />
            <StatusPill action={t.action} />
          </div>

          <div className="space-y-4 border-b border-line px-5 pb-4 text-sm">
            <Row icon={Phone} title={t.phone || "Numéro non renseigné"} sub={historyText(t)} />
            <Row icon={Wallet} title={fcfa(t.amount)} sub={<>{t.type}<br />{fmtDateTimeSec(t.created_at)}</>} />
            <Row icon={MapPin} title={t.location || "Non renseignée"} sub="Localisation saisie" />
          </div>

          <div className="px-5 py-4">
            <h3 className="mb-3 text-sm font-semibold">Facteurs de risque</h3>
            {t.factors.length === 0 ? (
              <p className="text-xs text-soft">Explication indisponible pour cette transaction.</p>
            ) : (
              <ul className="space-y-2.5 text-xs">
                {t.factors.slice(0, 4).map((f) => (
                  <li key={f.feature} className="flex items-start gap-2">
                    <i className={`mt-1 h-2 w-2 shrink-0 rounded-full ${f.direction === "hausse" ? "bg-danger" : "bg-ok"}`} />
                    <span className="flex-1 text-ink">
                      {f.feature}{" "}
                      <span className="text-soft">({f.direction === "hausse" ? "pousse vers la fraude" : "pousse vers le normal"})</span>
                    </span>
                    <span className={`font-medium ${f.direction === "hausse" ? "text-danger" : "text-ok"}`}>{dec(f.share, 2)}</span>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => setAnalysis(true)} className="mt-4 flex items-center gap-1.5 text-xs font-medium text-brand">
              Voir l'analyse détaillée <ArrowRight size={13} />
            </button>
          </div>

          <div className="border-t border-line p-4">
            {actionError && <div className="mb-3"><ErrorBanner message={actionError} /></div>}
            {!t.is_fraud_predicted ? (
              <p className="text-center text-xs text-soft">Transaction saine : aucune action requise.</p>
            ) : t.handled ? (
              <button
                onClick={toggleHandled}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-line py-3 text-sm font-medium text-ink hover:bg-canvas disabled:opacity-50"
              >
                <RotateCcw size={15} /> Alerte traitée : rouvrir
              </button>
            ) : (
              <button
                onClick={toggleHandled}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
              >
                <Check size={16} /> Marquer comme traité
              </button>
            )}
          </div>
          {analysis && <AnalysisModal t={t} onClose={() => setAnalysis(false)} />}
        </div>
      ) : null}
    </Panel>
  );
}

function Row({ icon: Icon, title, sub }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={18} className="mt-0.5 text-brand" />
      <div>
        <p className="font-medium text-ink">{title}</p>
        <p className="text-xs leading-relaxed text-soft">{sub}</p>
      </div>
    </div>
  );
}
