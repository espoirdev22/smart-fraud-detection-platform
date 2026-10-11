import { useState } from "react";
import { Loader2 } from "lucide-react";
import { predictTransaction } from "../services/api";
import { Button, inputClass } from "./ui/Common";

const CITIES = ["Dakar", "Thiès", "Saint-Louis", "Touba", "Kaolack", "Ziguinchor", "Mbour", "Diourbel", "Louga", "Tambacounda"];
const PHONE_RE = /^\+?[0-9 ]{8,20}$/;

const SCENARIOS = [
  { label: "Cas de fraude typique", values: { type: "TRANSFER", amount: "250000", oldbalanceOrg: "250000", oldbalanceDest: "0" } },
  { label: "Transaction normale", values: { type: "PAYMENT", amount: "5000", oldbalanceOrg: "50000", oldbalanceDest: "0" } },
];

const empty = { type: "TRANSFER", phone: "+221 ", city: "Dakar", amount: "", oldbalanceOrg: "", oldbalanceDest: "0" };

export default function TransactionForm({ onResult }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const showDest = form.type === "TRANSFER";

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const num = (v) => (v === "" ? NaN : Number(v));

  const submit = async (e) => {
    e.preventDefault();
    if (!PHONE_RE.test(form.phone.trim())) return setError("Numéro de téléphone invalide (ex. +221 77 123 45 67).");
    const amount = num(form.amount);
    const oldbalanceOrg = num(form.oldbalanceOrg);
    const oldbalanceDest = showDest ? num(form.oldbalanceDest) : 0;
    if (!(amount > 0)) return setError("Le montant doit être un nombre positif.");
    if (!(oldbalanceOrg >= 0)) return setError("Le solde émetteur doit être un nombre valide.");
    if (!(oldbalanceDest >= 0)) return setError("Le solde destinataire doit être un nombre valide.");
    if (amount > oldbalanceOrg) return setError("Le montant ne peut pas dépasser le solde disponible avant transaction.");

    const payload = {
      type: form.type,
      amount,
      oldbalanceOrg,
      newbalanceOrig: oldbalanceOrg - amount,
      oldbalanceDest,
      newbalanceDest: oldbalanceDest + amount,
      step: 1,
      phone: form.phone.trim(),
      location: `${form.city}, Sénégal`,
    };
    setLoading(true);
    try {
      onResult(await predictTransaction(payload), payload);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => (
          <button
            type="button"
            key={s.label}
            onClick={() => { setForm({ ...form, ...s.values }); setError(""); }}
            className="rounded-full border border-line px-3 py-1.5 text-xs text-ink hover:bg-canvas"
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Type de transaction">
          <select name="type" value={form.type} onChange={change} className={inputClass}>
            {["TRANSFER", "CASH_OUT", "PAYMENT", "CASH_IN", "DEBIT"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Numéro de téléphone">
          <input name="phone" value={form.phone} onChange={change} placeholder="+221 77 123 45 67" className={inputClass} />
        </Field>
        <Field label="Ville">
          <select name="city" value={form.city} onChange={change} className={inputClass}>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Montant (FCFA)">
          <input type="number" name="amount" value={form.amount} onChange={change} placeholder="0" className={inputClass} />
        </Field>
        <Field label="Solde émetteur avant (FCFA)">
          <input type="number" name="oldbalanceOrg" value={form.oldbalanceOrg} onChange={change} placeholder="0" className={inputClass} />
        </Field>
        {showDest && (
          <Field label="Solde destinataire avant (FCFA)">
            <input type="number" name="oldbalanceDest" value={form.oldbalanceDest} onChange={change} placeholder="0" className={inputClass} />
          </Field>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full py-2.5">
        {loading ? <><Loader2 size={16} className="animate-spin" /> Analyse en cours...</> : "Analyser la transaction"}
      </Button>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-xs text-soft">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
