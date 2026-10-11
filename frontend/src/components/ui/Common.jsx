import { AlertTriangle, Loader2 } from "lucide-react";
import { actionStyle, riskScore } from "../../lib/format";

export function Panel({ title, right, children, className = "", bodyClass = "p-5" }) {
  return (
    <section className={`bg-white border border-line rounded-xl shadow-card ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between gap-2 px-5 pt-4">
          <h2 className="text-[15px] font-semibold text-ink flex items-center gap-2 whitespace-nowrap">{title}</h2>
          {right}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

export function Pill({ children, className = "" }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>{children}</span>;
}

export function RiskPill({ prob, action }) {
  const s = actionStyle(action);
  return <Pill className={s.pill}>Risque {riskScore(prob)}</Pill>;
}

export function StatusPill({ action, className = "" }) {
  const s = actionStyle(action);
  return <Pill className={`${s.pill} ${className}`}>{s.label}</Pill>;
}

export function ScoreBadge({ prob, action }) {
  const s = actionStyle(action);
  return (
    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold ${s.badge}`}>
      {riskScore(prob)}
    </span>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
      <AlertTriangle size={16} />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="font-medium underline">
          Réessayer
        </button>
      )}
    </div>
  );
}

export function Spinner({ label = "Chargement..." }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-soft">
      <Loader2 size={16} className="animate-spin" /> {label}
    </div>
  );
}

export function Empty({ children }) {
  return <p className="py-8 text-center text-sm text-soft">{children}</p>;
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    ghost: "border border-line bg-white text-ink hover:bg-canvas",
    danger: "bg-danger text-white hover:opacity-90",
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-soft focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand";
