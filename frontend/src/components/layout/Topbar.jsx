import { useEffect, useState } from "react";
import { Bell, Menu, Search } from "lucide-react";
import UserMenu from "./UserMenu";

export default function Topbar({ user, alertCount, onSearch, onBell, onMenu, onLogout, initialQuery = "" }) {
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
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
