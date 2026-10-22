import { useState } from "react";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { login } from "../services/api";
import { inputClass } from "../components/ui/Common";

export default function LoginPage({ onLoggedIn, notice }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      onLoggedIn(await login(email.trim(), password));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-navy-950 to-navy-800 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <ShieldCheck size={44} strokeWidth={1.5} className="text-brand" />
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">FraudGuard</h1>
          <p className="text-sm text-soft">Connectez-vous pour accéder à la plateforme</p>
        </div>

        {notice && !error && <p className="mb-4 rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-dark">{notice}</p>}
        {error && <p role="alert" className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input className={`${inputClass} mt-1`} type="email" autoComplete="username" autoFocus required
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" />
          </label>
          <label className="block text-sm font-medium">
            Mot de passe
            <div className="relative mt-1">
              <input className={`${inputClass} pr-10`} type={show ? "text" : "password"} autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-soft">
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>
          <button type="submit" disabled={busy || !email || !password}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50">
            {busy && <Loader2 size={16} className="animate-spin" />} Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
