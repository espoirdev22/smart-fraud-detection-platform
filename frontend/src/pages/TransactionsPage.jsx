import { useEffect, useState } from "react";
import useFetch from "../hooks/useFetch";
import { searchTransactions } from "../services/api";
import { TX_TYPES } from "../lib/format";
import { Empty, ErrorBanner, Panel, Spinner, inputClass } from "../components/ui/Common";
import Pager from "../components/ui/Pager";
import TransactionForm from "../components/TransactionForm";
import ResultCard from "../components/ResultCard";
import TransactionRows from "../components/dashboard/TransactionRows";
import TransactionDrawer from "../components/dashboard/TransactionDrawer";

const LIMIT = 15;

export default function TransactionsPage({ query, refreshKey, onChanged }) {
  const [q, setQ] = useState(query || "");
  const [action, setAction] = useState("");
  const [type, setType] = useState("");
  const [handled, setHandled] = useState("");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => { setQ(query || ""); setOffset(0); }, [query]);

  const { data, error, loading, reload } = useFetch(
    () => searchTransactions({ q: q || undefined, action: action || undefined, type: type || undefined,
      handled: handled === "" ? undefined : handled === "yes", limit: LIMIT, offset }),
    [q, action, type, handled, offset, refreshKey]
  );

  const filter = (setter) => (e) => { setter(e.target.value); setOffset(0); };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-ink/70">Analysez une transaction et consultez tout l'historique.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Analyser une transaction">
          <TransactionForm onResult={(r) => { setResult(r); onChanged(); }} />
        </Panel>
        <Panel title="Résultat de l'analyse"><ResultCard result={result} /></Panel>
      </div>

      <Panel title="Historique" bodyClass="pt-3">
        <div className="grid gap-3 px-5 pb-3 sm:grid-cols-2 lg:grid-cols-4">
          <input value={q} onChange={filter(setQ)} placeholder="Numéro, ville, type, n°" className={inputClass} />
          <select value={action} onChange={filter(setAction)} className={inputClass}>
            <option value="">Tous les statuts</option>
            <option value="BLOCK">Fraude probable</option>
            <option value="VERIFY">À vérifier</option>
            <option value="PASS">Sain</option>
          </select>
          <select value={type} onChange={filter(setType)} className={inputClass}>
            <option value="">Tous les types</option>
            {TX_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select value={handled} onChange={filter(setHandled)} className={inputClass}>
            <option value="">Traitées ou non</option>
            <option value="no">Non traitées</option>
            <option value="yes">Traitées</option>
          </select>
        </div>
        <div className="px-5"><ErrorBanner message={error} onRetry={reload} /></div>
        {loading && !data ? <Spinner /> : data && (data.items.length === 0 ? <Empty>Aucune transaction ne correspond.</Empty> : (
          <>
            <TransactionRows items={data.items} onSelect={setSelected} selectedId={selected} />
            <Pager offset={offset} limit={LIMIT} total={data.total} onChange={setOffset} />
          </>
        ))}
      </Panel>
      <TransactionDrawer id={selected} onClose={() => setSelected(null)} onChanged={onChanged} />
    </div>
  );
}
