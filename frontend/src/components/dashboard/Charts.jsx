import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dec, fmtDay, fmtDayShort, nf, TX_TYPES } from "../../lib/format";
import { Panel, Empty } from "../ui/Common";

const compact = (v) => (v >= 1000 ? `${Math.round(v / 100) / 10}K`.replace(".0", "").replace(".", ",") : String(v));

export function EvolutionChart({ series }) {
  const empty = !series.some((d) => d.total > 0);
  return (
    <Panel title="Évolution des transactions et des fraudes" className="h-full">
      <div className="mb-2 flex gap-5 text-xs text-ink">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-brand" /> Transactions totales</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-danger" /> Fraudes détectées</span>
      </div>
      {empty ? (
        <Empty>Aucune transaction sur cette période.</Empty>
      ) : (
        <div className="h-[165px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1D4ED8" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#E8EDF5" vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmtDayShort} tick={{ fontSize: 11, fill: "#6B7A90" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tickFormatter={compact} tick={{ fontSize: 11, fill: "#6B7A90" }} axisLine={false} tickLine={false} />
              <Tooltip
                labelFormatter={fmtDay}
                formatter={(v, name) => [nf(v), name === "total" ? "Transactions totales" : "Fraudes détectées"]}
              />
              <Area type="monotone" dataKey="total" stroke="#1D4ED8" strokeWidth={2} fill="url(#gTotal)" dot={{ r: 3, fill: "#1D4ED8" }} />
              <Area type="monotone" dataKey="fraud" stroke="#E5383B" strokeWidth={2} fill="none" dot={{ r: 3, fill: "#E5383B" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

export function RiskDonut({ distribution, total }) {
  return (
    <Panel title="Répartition des risques" className="h-full">
      {total === 0 ? (
        <Empty>Aucune donnée sur cette période.</Empty>
      ) : (
        <div className="flex items-center gap-3">
          <div className="relative h-[135px] w-[135px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribution} dataKey="count" innerRadius={42} outerRadius={65} paddingAngle={1} stroke="#fff" strokeWidth={2}>
                  {distribution.map((b) => <Cell key={b.label} fill={b.color} />)}
                </Pie>
                <Tooltip formatter={(v, n, p) => [`${nf(v)} (${dec(p.payload.percent)}%)`, p.payload.label]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-semibold">{nf(total)}</span>
              <span className="text-[10px] leading-tight text-soft">transactions<br />analysées</span>
            </div>
          </div>
          <ul className="w-full space-y-2 text-[11px]">
            {distribution.map((b) => (
              <li key={b.label} className="flex items-center gap-2">
                <i className="h-2 w-2 rounded-full" style={{ background: b.color }} />
                <span className="flex-1 whitespace-nowrap text-ink">{b.label} <span className="text-soft">({b.range})</span></span>
                <span className="font-medium text-ink">{dec(b.percent)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

export function FraudTypes({ types }) {
  const known = Object.fromEntries(types.map((t) => [t.type, t]));
  const rows = TX_TYPES.map((t) => known[t] || { type: t, count: 0, percent: 0 }).sort((a, b) => b.percent - a.percent);
  const empty = types.length === 0;
  return (
    <Panel title="Types de fraude" className="h-full">
      {empty ? (
        <Empty>Aucune transaction suspecte sur cette période.</Empty>
      ) : (
        <ul className="space-y-3.5">
          {rows.map((r, i) => (
            <li key={r.type} className="flex items-center gap-3 text-xs">
              <span className="w-[72px] text-ink">{r.type}</span>
              <div className="h-3 flex-1 rounded-sm bg-brand-soft/70">
                <div className="h-3 rounded-sm" style={{ width: `${r.percent}%`, background: i === 0 ? "#0B3EA8" : "#3B82F6" }} />
              </div>
              <span className="w-11 text-right font-medium text-ink">{dec(r.percent)}%</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
