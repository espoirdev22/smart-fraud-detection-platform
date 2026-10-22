import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import useFetch from "../hooks/useFetch";
import { downloadReportCsv, getReport } from "../services/api";
import { dec, fcfa, fmtDay, fmtDayShort, nf } from "../lib/format";
import { Button, Empty, ErrorBanner, Panel, Spinner } from "../components/ui/Common";
import DateRangePicker from "../components/dashboard/DateRangePicker";

export default function ReportsPage({ range, onRange, refreshKey }) {
  const [exportError, setExportError] = useState("");
  const exportCsv = () => { setExportError(""); downloadReportCsv(range).catch((e) => setExportError(e.message)); };
  const { data, error, loading, reload } = useFetch(() => getReport(range), [range.start, range.end, refreshKey]);
  const t = data?.totals;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">Rapports</h1>
          <p className="text-sm text-ink/70">Synthèse de la période du {fmtDay(range.start)} au {fmtDay(range.end)}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <DateRangePicker range={range} onChange={onRange} />
          <Button variant="ghost" onClick={exportCsv}><Download size={15} /> Exporter en CSV</Button>
          <Button variant="ghost" onClick={() => window.print()}><Printer size={15} /> Imprimer / PDF</Button>
        </div>
      </div>
      <ErrorBanner message={error || exportError} onRetry={reload} />
      {loading && !data ? <Spinner /> : data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Transactions analysées" value={nf(t.total)} />
            <Stat label="Suspectes" value={`${nf(t.suspicious)} (${dec(t.fraud_rate, 2)}%)`} />
            <Stat label="Montant total" value={fcfa(data.amount_total)} />
            <Stat label="Montant suspect" value={fcfa(data.amount_flagged)} />
          </div>

          <Panel title="Activité par jour">
            {t.total === 0 ? <Empty>Aucune transaction sur cette période.</Empty> : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.by_day} margin={{ left: -10 }}>
                    <CartesianGrid stroke="#E8EDF5" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={fmtDayShort} tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={fmtDay} />
                    <Legend />
                    <Bar dataKey="total" name="Transactions" fill="#1D4ED8" />
                    <Bar dataKey="fraud" name="Suspectes" fill="#E5383B" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Par type de transaction" bodyClass="p-0 pt-3">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-y border-line bg-canvas/60 text-xs">
                  <th className="px-5 py-3 font-medium">Type</th><th className="px-3 py-3 font-medium">Total</th>
                  <th className="px-3 py-3 font-medium">Suspectes</th><th className="px-3 py-3 font-medium">Bloquées</th>
                  <th className="px-5 py-3 font-medium">Montant suspect</th></tr></thead>
                <tbody>
                  {data.by_type.map((r) => (
                    <tr key={r.type} className="border-b border-line/70 last:border-0">
                      <td className="px-5 py-3 font-medium">{r.type}</td><td className="px-3 py-3">{nf(r.count)}</td>
                      <td className="px-3 py-3">{nf(r.suspicious)}</td><td className="px-3 py-3">{nf(r.blocked)}</td>
                      <td className="px-5 py-3">{fcfa(r.amount_suspicious)}</td>
                    </tr>
                  ))}
                  {data.by_type.length === 0 && <tr><td colSpan={5}><Empty>Aucune donnée.</Empty></td></tr>}
                </tbody>
              </table>
            </Panel>
            <Panel title="Numéros les plus alertés" bodyClass="p-0 pt-3">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-y border-line bg-canvas/60 text-xs">
                  <th className="px-5 py-3 font-medium">Numéro</th><th className="px-3 py-3 font-medium">Alertes</th>
                  <th className="px-5 py-3 font-medium">Score max</th></tr></thead>
                <tbody>
                  {data.top_phones.map((r) => (
                    <tr key={r.phone} className="border-b border-line/70 last:border-0">
                      <td className="px-5 py-3">{r.phone}</td><td className="px-3 py-3">{r.alerts}</td><td className="px-5 py-3">{dec(r.max_score, 2)}</td>
                    </tr>
                  ))}
                  {data.top_phones.length === 0 && <tr><td colSpan={3}><Empty>Aucune alerte avec numéro sur cette période.</Empty></td></tr>}
                </tbody>
              </table>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

const Stat = ({ label, value }) => (
  <div className="rounded-xl border border-line bg-white p-5 shadow-card">
    <p className="text-sm text-soft">{label}</p>
    <p className="mt-2 text-xl font-semibold">{value}</p>
  </div>
);
