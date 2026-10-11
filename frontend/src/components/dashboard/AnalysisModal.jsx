import { X } from "lucide-react";
import { actionStyle, dec, fmtDateTimeSec, nf, riskScore } from "../../lib/format";

const L = ({ k, v }) => (
  <div className="flex justify-between gap-4 border-b border-line/70 py-2 text-sm last:border-0">
    <span className="text-soft">{k}</span>
    <span className="text-right font-medium text-ink">{v}</span>
  </div>
);

export default function AnalysisModal({ t, onClose }) {
  const style = actionStyle(t.action);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Analyse détaillée n°{t.id}</h2>
          <button onClick={onClose} aria-label="Fermer"><X size={20} /></button>
        </div>

        <div className={`mb-5 rounded-lg px-4 py-3 text-sm ${style.pill}`}>
          Décision : <strong>{style.label}</strong>. Score de risque {riskScore(t.fraud_probability)} (échelle 0 à 1), soit {t.score} sur 1000.
          Seuils actuels : vérification à partir de {dec(t.thresholds.verify, 2)}, blocage à partir de {dec(t.thresholds.block, 2)} (probabilité brute du modèle).
        </div>

        <h3 className="mb-2 text-sm font-semibold">Ce qui a pesé dans la décision</h3>
        <ul className="mb-5 space-y-3">
          {t.factors.map((f) => (
            <li key={f.feature} className="text-xs">
              <div className="mb-1 flex justify-between">
                <span className="text-ink">{f.feature}</span>
                <span className="text-soft">
                  {f.direction === "hausse" ? "pousse vers la fraude" : "pousse vers le normal"} · poids {dec(f.share, 2)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-canvas">
                <div className={`h-2 rounded-full ${f.direction === "hausse" ? "bg-danger" : "bg-ok"}`} style={{ width: `${Math.min(100, f.share * 100)}%` }} />
              </div>
            </li>
          ))}
          {t.factors.length === 0 && <li className="text-xs text-soft">Aucune explication enregistrée.</li>}
        </ul>
        <p className="mb-5 text-xs text-soft">
          Le poids est la part de l'effet total de ce facteur dans le calcul SHAP du modèle (la somme sur toutes les variables vaut 1).
        </p>

        <h3 className="mb-1 text-sm font-semibold">Données de la transaction</h3>
        <L k="Date" v={fmtDateTimeSec(t.created_at)} />
        <L k="Type" v={t.type} />
        <L k="Montant" v={`${nf(t.amount)} FCFA`} />
        <L k="Solde émetteur" v={`${nf(t.old_balance_orig)} → ${nf(t.new_balance_orig)}`} />
        <L k="Solde destinataire" v={`${nf(t.old_balance_dest)} → ${nf(t.new_balance_dest)}`} />
        <L k="Temps d'analyse" v={t.detection_ms != null ? `${dec(t.detection_ms, 0)} ms` : "—"} />
        <L k="Origine" v={t.source === "replay" ? "Transaction PaySim rejouée (téléphone, ville et date simulés)" : "Saisie via l'application"} />
        {t.handled && <L k="Traitée le" v={fmtDateTimeSec(t.handled_at)} />}
      </div>
    </div>
  );
}
