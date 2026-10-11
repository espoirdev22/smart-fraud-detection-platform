import { ChevronRight } from "lucide-react";
import { fmtDateTime, nf } from "../../lib/format";
import { ScoreBadge, StatusPill } from "../ui/Common";
import TypeIcon from "./TypeIcon";

/** Tableau de transactions partage par le tableau de bord, la page Transactions et la page Alertes. */
export default function TransactionRows({ items, onSelect, selectedId }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-left text-[11.5px]">
        <thead>
          <tr className="border-y border-line bg-canvas/60 text-[11px] text-ink">
            <th className="pl-3 pr-1.5 py-2.5 font-medium whitespace-nowrap">Date / Heure</th>
            <th className="px-1.5 py-2.5 font-medium whitespace-nowrap">Numéro de téléphone</th>
            <th className="px-1.5 py-2.5 font-medium whitespace-nowrap">Type</th>
            <th className="px-1.5 py-2.5 font-medium">Montant (FCFA)</th>
            <th className="px-1.5 py-2.5 font-medium">Score de risque</th>
            <th className="px-1.5 py-2.5 font-medium whitespace-nowrap">Statut</th>
            <th className="px-1.5 py-2.5 font-medium whitespace-nowrap">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id} className={`border-b border-line/70 last:border-0 ${selectedId === t.id ? "bg-brand-soft/40" : ""}`}>
              <td className="whitespace-nowrap pl-3 pr-1.5 py-2.5 text-ink/80">{fmtDateTime(t.created_at)}</td>
              <td className="whitespace-nowrap px-1.5 py-2.5">{t.phone || <span className="text-soft">Non renseigné</span>}</td>
              <td className="px-1.5 py-2.5">
                <span className="flex items-center gap-1.5">
                  <TypeIcon type={t.type} flagged={t.is_fraud_predicted} />
                  {t.type}
                </span>
              </td>
              <td className="whitespace-nowrap px-1.5 py-2.5">{nf(t.amount)}</td>
              <td className="px-1.5 py-2.5"><ScoreBadge prob={t.fraud_probability} action={t.action} /></td>
              <td className="px-1.5 py-2.5">
                <span className="flex items-center gap-2">
                  <StatusPill action={t.action} className="!px-2 !text-[11px]" />
                  {t.handled && <span className="text-[11px] text-soft">traité</span>}
                </span>
              </td>
              <td className="px-1.5 py-2.5">
                <button
                  onClick={() => onSelect(t.id)}
                  className="inline-flex items-center gap-2 rounded-md border border-line px-2.5 py-1 text-[11px] hover:bg-canvas"
                >
                  Voir <ChevronRight size={13} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

