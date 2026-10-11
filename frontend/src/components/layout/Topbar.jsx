import { useEffect, useState } from "react";
import { Bell, ChevronDown, Menu, Search } from "lucide-react";

const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";

export default function Topbar({ user, alertCount, onSearch, onBell, onMenu, initialQuery = "" }) {
  const [q, setQ] = useState(initialQuery);
  useEffect(() => setQ(initialQuery), [initialQuery]);

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-white px-4 py-3 print:hidden lg:px-6">
      <button className="lg:hidden" onClick={onMenu} aria-label="Ouvrir le menu">
        <Menu size={22} />
      </button>
      <form
        className="relative max-w-[480px] flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch(q.trim());
        }}
      >
        <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-soft" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une transaction, un numéro, un utilisateur..."
          className="w-full rounded-lg border border-line bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-soft focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </form>
      <div className="ml-auto flex items-center gap-5">
        <button onClick={onBell} className="relative" aria-label="Alertes">
          <Bell size={21} className="text-ink" />
          {alertCount > 0 && (
            <span className="absolute -right-2 -top-2 min-w-[18px] rounded-full bg-danger px-1 text-center text-[10px] font-semibold leading-[18px] text-white">
              {alertCount > 99 ? "99+" : alertCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">
            {initials(user?.name)}
          </span>
          <div className="hidden text-left leading-tight sm:block">
            <p className="text-sm font-medium">{user?.name || "—"}</p>
            <p className="text-xs text-soft">{user?.role || ""}</p>
          </div>
          <ChevronDown size={16} className="hidden text-soft sm:block" />
        </div>
      </div>
    </header>
  );
}
