import { useEffect, useRef, useState } from "react";
import { ChevronDown, KeyRound, LogOut, X } from "lucide-react";
import { changePassword } from "../../services/api";
import { Button, inputClass } from "../ui/Common";

const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";

function PasswordModal({ onClose }) {
  const [form, setForm] = useState({ current: "", next: "", again: "" });
  const [msg, setMsg] = useState({ ok: "", err: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.next.length < 8) return setMsg({ ok: "", err: "Le nouveau mot de passe doit faire au moins 8 caractères." });
    if (form.next !== form.again) return setMsg({ ok: "", err: "Les deux nouveaux mots de passe ne sont pas identiques." });
    setBusy(true);
    try {
      await changePassword(form.current, form.next);
      setMsg({ ok: "Mot de passe modifié.", err: "" });
      setForm({ current: "", next: "", again: "" });
    } catch (err) {
      setMsg({ ok: "", err: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Changer mon mot de passe</h2>
          <button type="button" onClick={onClose} aria-label="Fermer"><X size={20} /></button>
        </div>
        <input className={inputClass} type="password" autoComplete="current-password" placeholder="Mot de passe actuel"
          value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} required />
        <input className={inputClass} type="password" autoComplete="new-password" placeholder="Nouveau mot de passe (8 caractères minimum)"
          value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} required />
        <input className={inputClass} type="password" autoComplete="new-password" placeholder="Répéter le nouveau mot de passe"
          value={form.again} onChange={(e) => setForm({ ...form, again: e.target.value })} required />
        {msg.ok && <p className="text-sm text-ok">{msg.ok}</p>}
        {msg.err && <p className="text-sm text-danger">{msg.err}</p>}
        <Button type="submit" disabled={busy} className="w-full">Enregistrer</Button>
      </form>
    </div>
  );
}

export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative" ref={box}>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-3" aria-haspopup="menu" aria-expanded={open}>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">
          {initials(user?.name)}
        </span>
        <div className="hidden text-left leading-tight sm:block">
          <p className="text-sm font-medium">{user?.name || "..."}</p>
          <p className="text-xs text-soft">{user?.role || ""}</p>
        </div>
        <ChevronDown size={16} className="hidden text-soft sm:block" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-2 w-56 rounded-lg border border-line bg-white py-1 shadow-lg">
          <p className="truncate px-4 py-2 text-xs text-soft">{user?.email}</p>
          <button role="menuitem" className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-canvas"
            onClick={() => { setOpen(false); setPwd(true); }}>
            <KeyRound size={15} /> Changer mon mot de passe
          </button>
          <button role="menuitem" className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-danger hover:bg-canvas"
            onClick={onLogout}>
            <LogOut size={15} /> Se déconnecter
          </button>
        </div>
      )}
      {pwd && <PasswordModal onClose={() => setPwd(false)} />}
    </div>
  );
}
