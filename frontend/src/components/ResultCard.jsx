import { actionStyle, dec, riskScore } from "../lib/format";

const MESSAGES = {
  BLOCK: "Blocage recommandé",
  VERIFY: "Vérification requise",
  PASS: "Transaction autorisée",
};

export default function ResultCard({ result }) {
  if (!result) {
    return <p className="py-6 text-sm text-soft">Remplissez le formulaire pour obtenir une analyse en temps réel.</p>;
  }
  const s = actionStyle(result.action);
  return (
    <div className="space-y-4">
      <div className={`rounded-xl px-5 py-4 ${s.pill}`}>
        <p className="text-sm font-medium">{MESSAGES[result.action]}</p>
        <p className="mt-1 text-3xl font-semibold">
          {riskScore(result.fraud_probability)} <span className="text-sm font-normal opacity-70">/ 1 ({result.score} / 1000)</span>
        </p>
        <p className="mt-1 text-xs opacity-80">Analysée en {dec(result.detection_ms, 0)} ms. Transaction enregistrée sous le n°{result.id}.</p>
      </div>
      {result.factors?.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-soft">Facteurs déterminants</p>
          <ul className="space-y-1.5 text-sm">
            {result.factors.map((f) => (
              <li key={f.feature} className="flex justify-between gap-3">
                <span>{f.feature}</span>
                <span className={f.direction === "hausse" ? "text-danger" : "text-ok"}>
                  {f.direction === "hausse" ? "pousse vers la fraude" : "pousse vers le normal"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-soft">
        Le score est un indice de suspicion entre 0 et 1, pas une probabilité. La décision se base sur les seuils réglés dans Paramètres.
      </p>
    </div>
  );
}
