import { useState } from "react";
import { predictTransaction } from "../services/api";

function TransactionForm({ onResult }) {
  const [form, setForm] = useState({
    type: "TRANSFER",
    amount: "",
    oldbalanceOrg: "",
    newbalanceOrig: "",
    oldbalanceDest: "",
    newbalanceDest: "",
    step: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");

    const numericFields = [
      "amount", "oldbalanceOrg", "newbalanceOrig",
      "oldbalanceDest", "newbalanceDest",
    ];

    for (const field of numericFields) {
      const value = form[field];
      if (value === "" || isNaN(Number(value)) || Number(value) < 0) {
        setError(`Le champ "${field}" doit etre un nombre valide et positif.`);
        return;
      }
    }

    setLoading(true);
    const payload = {
      ...form,
      amount: parseFloat(form.amount),
      oldbalanceOrg: parseFloat(form.oldbalanceOrg),
      newbalanceOrig: parseFloat(form.newbalanceOrig),
      oldbalanceDest: parseFloat(form.oldbalanceDest),
      newbalanceDest: parseFloat(form.newbalanceDest),
      step: parseInt(form.step) || 1,
    };
    const result = await predictTransaction(payload);
    onResult(result, payload);
    setLoading(false);
  };

  const fields = [
    { name: "amount", label: "Montant" },
    { name: "oldbalanceOrg", label: "Solde emetteur avant" },
    { name: "newbalanceOrig", label: "Solde emetteur apres" },
    { name: "oldbalanceDest", label: "Solde destinataire avant" },
    { name: "newbalanceDest", label: "Solde destinataire apres" },
  ];

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <h2 className="font-mono text-sm text-muted uppercase tracking-wide mb-4">
        Simuler une transaction
      </h2>

      <div className="space-y-3">
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full bg-bg border border-border rounded px-3 py-2 text-text font-mono text-sm"
        >
          <option value="TRANSFER">TRANSFER</option>
          <option value="CASH_OUT">CASH_OUT</option>
          <option value="PAYMENT">PAYMENT</option>
          <option value="CASH_IN">CASH_IN</option>
          <option value="DEBIT">DEBIT</option>
        </select>

        {fields.map((field) => (
          <div key={field.name}>
            <label className="text-muted text-xs">{field.label}</label>
            <input
              type="number"
              name={field.name}
              value={form[field.name]}
              onChange={handleChange}
              placeholder="0"
              className="w-full bg-bg border border-border rounded px-3 py-2 text-text font-mono text-sm mt-1"
            />
          </div>
        ))}

        {error && (
          <p className="text-alert text-xs">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-alert text-bg font-mono text-sm font-semibold rounded px-3 py-2.5 mt-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Analyse en cours..." : "Analyser la transaction"}
        </button>
      </div>
    </div>
  );
}

export default TransactionForm;