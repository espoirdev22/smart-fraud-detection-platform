import { ArrowDown, ArrowUp } from "lucide-react";
import { signed } from "../../lib/format";

const TONES = {
  blue: "bg-brand-soft text-brand",
  red: "bg-danger-soft text-danger",
};

/** goodWhenUp : true si une hausse est une bonne nouvelle (ex. volume total), false sinon. */
export default function KpiCard({ icon: Icon, tone = "blue", label, value, delta, goodWhenUp = false, deltaDigits = 1 }) {
  const hasDelta = delta !== null && delta !== undefined;
  const up = hasDelta && delta > 0;
  const flat = hasDelta && delta === 0;
  const good = flat ? true : up === goodWhenUp;
  const color = !hasDelta ? "text-soft" : flat ? "text-soft" : good ? "text-ok" : "text-danger";
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-card">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TONES[tone]}`}>
          <Icon size={19} />
        </span>
        <span className="text-[13px] text-ink/80 leading-tight">{label}</span>
      </div>
      <p className="mt-4 text-[28px] font-semibold tracking-tight text-ink">{value}</p>
      <div className="mt-2 text-xs">
        {hasDelta ? (
          <>
            <span className={`inline-flex items-center gap-1 font-medium ${color}`}>
              {!flat && (up ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
              {signed(delta, deltaDigits)}%
            </span>
            <p className="text-soft mt-0.5">vs période précédente</p>
          </>
        ) : (
          <p className="text-soft">Pas de données sur la période précédente</p>
        )}
      </div>
    </div>
  );
}

