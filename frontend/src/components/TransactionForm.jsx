import { useState } from "react";
import { predictTransaction } from "../services/api";

function TransactionForm({ onResult }) {
  const [form, setForm] = useState({
    type: "TRANSFER",
    amount: "",
    oldbalanceOrg: "",
    oldbalanceDest: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");

    const numericFields = ["amount", "oldbalanceOrg", "oldbalanceDest"];

    for (const field of numericFields) {
      const value = form[field];
      if (value === "" || isNaN(Number(value)) || Number(value) < 0) {
        setError(`Le champ "${field}" doit etre un nombre valide et positif.`);
        return;
      }
    }

    const amount = parseFloat(form.amount);
    const oldbalanceOrg = parseFloat(form.oldbalanceOrg);
    const oldbalanceDest = parseFloat(form.oldbalanceDest);

    if (amount > oldbalanceOrg) {
      setError("Le montant ne peut pas depasser le solde disponible avant transaction.");
      return;
    }

    setLoading(true);
    const payload = {
      type: form.type,
      amount,
      oldbalanceOrg,
      newbalanceOrig: oldbalanceOrg - amount,
      oldbalanceDest,
      newbalanceDest: oldbalanceDest + amount,
      step: 1,
    };

    try {
      const result = await predictTransaction(payload);
      onResult(result, payload);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const fields = [
    { name: "amount", label: "Montant" },
    { name: "oldbalanceOrg", label: "Solde emetteur avant" },
    { name: "oldbalanceDest", label: "Solde destinataire avant" },
  ];

  const scenarios = [
    {
      label: "Cas de fraude typique",
      values: {
        type: "TRANSFER",
        amount: "250000",
        oldbalanceOrg: "250000",
        oldbalanceDest: "0",
      },
    },
    {
      label: "Transaction normale",
      values: {
        type: "PAYMENT",
        amount: "5000",
        oldbalanceOrg: "50000",
        oldbalanceDest: "0",
      },
    },
  ];

  const loadScenario = (values) => {
    setForm({ ...form, ...values });
    setError("");
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <h2 className="font-mono text-sm text-muted uppercase tracking-wide mb-4">
        Simuler une transaction
      </h2>
      <div className="flex gap-2 mb-2">
        {scenarios.map((scenario) => (
          <button
            key={scenario.label}
            onClick={() => loadScenario(scenario.values)}
            className="flex-1 bg-border text-muted text-xs font-mono rounded px-2 py-2 hover:bg-opacity-70 transition"
          >
            {scenario.label}
          </button>
        ))}
      </div>
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

        {error && <p className="text-alert text-xs">{error}</p>}

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