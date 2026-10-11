import { useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck, Timer, TriangleAlert, WalletCards } from "lucide-react";
import useFetch from "../hooks/useFetch";
import { getDashboard } from "../services/api";
import { dec, nf } from "../lib/format";
import KpiCard from "../components/ui/KpiCard";
import { ErrorBanner, Panel, Spinner } from "../components/ui/Common";
import DateRangePicker from "../components/dashboard/DateRangePicker";
import { EvolutionChart, FraudTypes, RiskDonut } from "../components/dashboard/Charts";
import RecentAlerts from "../components/dashboard/RecentAlerts";
import TransactionRows from "../components/dashboard/TransactionRows";
import DetailPanel from "../components/dashboard/DetailPanel";

export default function DashboardPage({ range, onRange, refreshKey, onChanged, navigate, onLoaded }) {
  const { data, error, loading, reload } = useFetch(() => getDashboard(range), [range.start, range.end, refreshKey]);
  const [selected, setSelected] = useState(undefined); // undefined = pas encore choisi, null = ferme

  useEffect(() => {
    if (data) onLoaded?.();
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Comme sur la maquette, le panneau s'ouvre par defaut sur l'alerte la plus recente.
  const defaultId = data ? (data.recent_alerts[0] || data.recent_transactions[0])?.id ?? null : null;
  const detailId = selected === undefined ? defaultId : selected;

  const k = data?.kpis;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-ink/70">Vue d'ensemble de la détection de fraude Mobile Money</p>
        </div>
        <DateRangePicker range={range} onChange={(r) => { onRange(r); setSelected(undefined); }} />
      </div>

      <ErrorBanner message={error} onRetry={reload} />
      {loading && !data ? <Spinner /> : null}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard icon={WalletCards} label="Total des transactions" value={nf(k.total.value)} delta={k.total.delta} goodWhenUp />
            <KpiCard icon={TriangleAlert} tone="red" label="Transactions suspectes" value={nf(k.suspicious.value)} delta={k.suspicious.delta} />
            <KpiCard icon={ShieldCheck} label="Taux de fraude" value={`${dec(k.fraud_rate.value, 2)}%`} delta={k.fraud_rate.delta} deltaDigits={2} />
            <KpiCard icon={ShieldAlert} label="Faux positifs" value={nf(k.false_positives.value)} delta={k.false_positives.delta} />
            <KpiCard icon={Timer} label="Temps de détection moyen" value={k.avg_detection_s.value == null ? "—" : `${dec(k.avg_detection_s.value, 2)} s`} delta={k.avg_detection_s.delta} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.3fr_1.1fr_0.95fr_0.95fr]">
            <EvolutionChart series={data.series} />
            <RiskDonut distribution={data.risk_distribution} total={data.risk_total} />
            <div className="md:col-span-2 xl:col-span-1"><FraudTypes types={data.fraud_types} /></div>
            <div className="md:col-span-2 xl:col-span-1 xl:col-start-4 xl:row-span-2 xl:row-start-1">
              <RecentAlerts
                alerts={data.recent_alerts}
                openCount={data.open_alerts}
                onSelect={setSelected}
                onSeeAll={() => navigate("/alerts")}
              />
            </div>

            <div className={`md:col-span-2 ${detailId ? "xl:col-span-2" : "xl:col-span-3"}`}>
              <Panel
                title="Transactions suspectes récentes"
                bodyClass="pt-3"
                right={
                  <button onClick={() => navigate("/transactions")} className="text-xs font-medium text-brand">
                    Voir toutes les transactions →
                  </button>
                }
              >
                {data.recent_transactions.length === 0 ? (
                  <p className="py-8 text-center text-sm text-soft">Aucune transaction sur cette période.</p>
                ) : (
                  <TransactionRows items={data.recent_transactions} onSelect={setSelected} selectedId={detailId} />
                )}
              </Panel>
            </div>
            {detailId && (
              <div className="md:col-span-2 xl:col-span-1">
                <DetailPanel id={detailId} onClose={() => setSelected(null)} onChanged={onChanged} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

