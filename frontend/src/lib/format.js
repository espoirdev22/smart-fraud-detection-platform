const TZ = "Africa/Dakar";

export const nf = (n) => (n === null || n === undefined ? "—" : new Intl.NumberFormat("fr-FR").format(Math.round(n)));

export const dec = (n, digits = 1) =>
  n === null || n === undefined
    ? "—"
    : new Intl.NumberFormat("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);

export const signed = (n, digits = 1) => (n > 0 ? "+" : "") + dec(n, digits);

export const fcfa = (n) => `${nf(n)} FCFA`;

const parts = (iso, opts) => new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, ...opts }).format(new Date(iso));

export const fmtDateTime = (iso) =>
  iso ? parts(iso, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "") : "—";

export const fmtDateTimeSec = (iso) =>
  iso
    ? parts(iso, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }).replace(",", "")
    : "—";

export const fmtDay = (isoDate) => {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
};

export const fmtDayShort = (isoDate) => {
  const [, m, d] = isoDate.split("-");
  return `${d}/${m}`;
};

export const timeAgo = (iso) => {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "À l'instant";
  if (s < 3600) return `Il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `Il y a ${Math.floor(s / 3600)} h`;
  return `Il y a ${Math.floor(s / 86400)} j`;
};

export const toIsoDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const defaultRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);
  return { start: toIsoDate(start), end: toIsoDate(end) };
};

export const riskScore = (p) => (p === null || p === undefined ? "—" : p.toFixed(2));

export const ACTION_STYLE = {
  BLOCK: { label: "Fraude probable", pill: "bg-danger-soft text-danger", badge: "bg-danger text-white", dot: "bg-danger" },
  VERIFY: { label: "À vérifier", pill: "bg-warn-soft text-orange", badge: "bg-orange text-white", dot: "bg-orange" },
  PASS: { label: "Sain", pill: "bg-ok-soft text-ok", badge: "bg-ok text-white", dot: "bg-ok" },
};

export const actionStyle = (a) => ACTION_STYLE[a] || ACTION_STYLE.PASS;

export const TX_TYPES = ["TRANSFER", "CASH_OUT", "DEBIT", "PAYMENT", "CASH_IN"];
