import { useState } from "react";

function AnomalyList({ history }) {
  const [flagged, setFlagged] = useState([]);

  const top = [...history]
    .map((t) => ({ ...t, score: Math.round(t.fraud_probability * 1000) }))
    .filter((t) => t.score >= 500)
    .sort((a, b) => b.score - a.score || b.id - a.id)
    .slice(0, 3);

  const toggleFlag = (id) => {
    setFlagged((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (top.length === 0) {
    return <p className="text-muted text-sm">Aucune anomalie detectee.</p>;
  }

  return (
    <ul className="space-y-3">
      {top.map((t) => (
        <li
          key={t.id}
          className="flex items-center justify-between border-l-2 border-alert pl-3"
        >
          <div>
            <p className="font-mono text-sm">
              N° {t.id} · {t.type}
            </p>
            <p className="text-muted text-xs">
              Montant {t.amount.toLocaleString()} · Score{" "}
              <span className="text-alert">{t.score}</span>
            </p>
          </div>
          <button
            onClick={() => toggleFlag(t.id)}
            className={`text-xs font-mono rounded px-3 py-1 ${
              flagged.includes(t.id)
                ? "bg-alert text-bg"
                : "bg-border text-muted"
            }`}
          >
            {flagged.includes(t.id) ? "Signale" : "Signaler"}
          </button>
        </li>
      ))}
    </ul>
  );
}

export default AnomalyList;