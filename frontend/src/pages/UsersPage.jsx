import { useState } from "react";
import { UserPlus } from "lucide-react";
import useFetch from "../hooks/useFetch";
import { createUser, getUsers, updateUser } from "../services/api";
import { fmtDateTime } from "../lib/format";
import { Button, ErrorBanner, Panel, Pill, Spinner, inputClass } from "../components/ui/Common";

const ROLES = ["Analyste Fraude", "Superviseur", "Administrateur"];

export default function UsersPage({ me, onUsersChanged }) {
  const isAdmin = me?.role === "Administrateur";
  const { data, error, loading, reload } = useFetch(getUsers, []);
  const [form, setForm] = useState({ name: "", email: "", role: ROLES[0], password: "" });
  const [formError, setFormError] = useState("");

  const run = async (fn) => {
    setFormError("");
    try {
      await fn();
      reload();
      onUsersChanged?.();
    } catch (e) {
      setFormError(e.message);
    }
  };

  const add = (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return setFormError("Saisissez un nom.");
    if (!form.email.trim()) return setFormError("L'email sert d'identifiant de connexion, il est obligatoire.");
    if (form.password.length < 8) return setFormError("Le mot de passe doit faire au moins 8 caractères.");
    run(async () => {
      await createUser(form);
      setForm({ name: "", email: "", role: ROLES[0], password: "" });
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">Utilisateurs</h1>
        <p className="text-sm text-ink/70">
          Comptes autorisés à se connecter. Seul un administrateur peut créer ou modifier un compte.
        </p>
      </div>
      <ErrorBanner message={error || formError} onRetry={reload} />

      {isAdmin && <Panel title="Ajouter un utilisateur">
        <form onSubmit={add} className="grid gap-3 md:grid-cols-[1.1fr_1.1fr_1fr_1fr_auto]">
          <input className={inputClass} placeholder="Nom complet" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={inputClass} placeholder="Email (identifiant)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className={inputClass} type="password" autoComplete="new-password" placeholder="Mot de passe (8 car. min.)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
          <Button type="submit"><UserPlus size={15} /> Ajouter</Button>
        </form>
      </Panel>}

      <Panel bodyClass="p-0">
        {loading && !data ? <Spinner /> : data && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead><tr className="border-b border-line bg-canvas/60 text-xs">
                <th className="px-5 py-3 font-medium">Nom</th><th className="px-3 py-3 font-medium">Email</th>
                <th className="px-3 py-3 font-medium">Rôle</th><th className="px-3 py-3 font-medium">Créé le</th>
                <th className="px-5 py-3 font-medium">Statut</th></tr></thead>
              <tbody>
                {data.map((u) => (
                  <tr key={u.id} className="border-b border-line/70 last:border-0">
                    <td className="px-5 py-3 font-medium">{u.name}</td>
                    <td className="px-3 py-3 text-soft">{u.email || "—"}</td>
                    <td className="px-3 py-3">
                      <select value={u.role} disabled={!isAdmin || u.id === me?.id} onChange={(e) => run(() => updateUser(u.id, { role: e.target.value }))}
                        className="rounded-md border border-line bg-white px-2 py-1 text-xs disabled:opacity-60">
                        {ROLES.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-3 text-xs text-soft">{fmtDateTime(u.created_at)}</td>
                    <td className="px-5 py-3">
                      <button disabled={!isAdmin || u.id === me?.id} onClick={() => run(() => updateUser(u.id, { active: !u.active }))} className="disabled:cursor-default">
                        <Pill className={u.active ? "bg-ok-soft text-ok" : "bg-canvas text-soft"}>{u.active ? "Actif" : "Désactivé"}</Pill>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
