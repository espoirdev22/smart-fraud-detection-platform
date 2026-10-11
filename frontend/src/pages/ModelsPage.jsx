import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import useFetch from "../hooks/useFetch";
import { getModels } from "../services/api";
import { dec, fmtDateTime, nf } from "../lib/format";
import { ErrorBanner, Panel, Pill, Spinner } from "../components/ui/Common";

const METRICS = [["precision", "Précision"], ["recall", "Rappel"], ["f1", "F1"], ["roc_auc", "ROC-AUC"]];
const pct = (v) => (v == null ? "—" : `${dec(v * 100, 2)}%`);

export default function ModelsPage({ refreshKey }) {
  const { data, error, loading, reload } = useFetch(getModels, [refreshKey]);
  const chart = data?.runs.map((r, i) => ({ name: `${r.name} #${data.runs.length - i}`, ...r.metrics })) || [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">Modèles & IA</h1>
        <p className="text-sm text-ink/70">Résultats des entraînements suivis dans MLflow et activité du modèle en production.</p>
      </div>
      <ErrorBanner message={error} onRetry={reload} />
      {loading && !data ? <Spinner /> : data && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Panel title="Modèle en production">
              <p className="text-2xl font-semibold capitalize">{data.active_model.name}</p>
              <p className="mt-1 text-xs text-soft">Fichier : {data.active_model.path}</p>
              <p className="mt-2"><Pill className={data.active_model.file_present ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger"}>
                {data.active_model.file_present ? "Modèle chargé" : "Fichier du modèle introuvable"}</Pill></p>
              <p className="mt-3 text-xs text-soft">Température d'affichage du score : {data.active_model.score_temperature}</p>
            </Panel>
            <Panel title="Décisions rendues">
              <p className="text-2xl font-semibold">{nf(data.production.predictions)}</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li className="flex justify-between"><span>Autorisées</span><b>{nf(data.production.by_action.PASS)}</b></li>
                <li className="flex justify-between"><span>À vérifier</span><b>{nf(data.production.by_action.VERIFY)}</b></li>
                <li className="flex justify-between"><span>Bloquées</span><b>{nf(data.production.by_action.BLOCK)}</b></li>
              </ul>
            </Panel>
            <Panel title="Temps d'analyse moyen">
              <p className="text-2xl font-semibold">{data.production.avg_detection_ms == null ? "—" : `${dec(data.production.avg_detection_ms, 0)} ms`}</p>
              <p className="mt-2 text-xs text-soft">Mesuré à chaque appel de /predict (modèle et explication SHAP).</p>
            </Panel>
          </div>

          {!data.mlflow_available ? (
            <Panel title="Entraînements MLflow">
              <p className="text-sm text-soft">
                La base MLflow n'est pas accessible depuis le backend. Montez le fichier dans le conteneur
                (<code>./ml/mlruns.db:/app/mlflow/mlruns.db:ro</code>) ou définissez MLFLOW_DB_PATH.
              </p>
            </Panel>
          ) : (
            <>
              <Panel title={`Entraînements terminés (expérience ${data.experiment})`} bodyClass="p-0 pt-3">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead>
                      <tr className="border-y border-line bg-canvas/60 text-xs">
                        <th className="px-5 py-3 font-medium">Modèle</th>
                        {METRICS.map(([, l]) => <th key={l} className="px-3 py-3 font-medium">{l}</th>)}
                        <th className="px-3 py-3 font-medium">Paramètres</th>
                        <th className="px-5 py-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.runs.map((r) => (
                        <tr key={r.run_id} className="border-b border-line/70 last:border-0">
                          <td className="px-5 py-3 font-medium capitalize">
                            {r.name.replace("_", " ")} {r.active && <Pill className="ml-2 bg-brand-soft text-brand">actif</Pill>}
                          </td>
                          {METRICS.map(([k]) => <td key={k} className="px-3 py-3">{pct(r.metrics[k])}</td>)}
                          <td className="px-3 py-3 text-xs text-soft">{Object.entries(r.params).map(([k, v]) => `${k}=${v}`).join(", ")}</td>
                          <td className="whitespace-nowrap px-5 py-3 text-xs text-soft">{fmtDateTime(r.started_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
              <Panel title="Comparaison des métriques">
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chart} margin={{ left: -10 }}>
                      <CartesianGrid stroke="#E8EDF5" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => pct(v)} />
                      <Legend />
                      <Bar dataKey="precision" name="Précision" fill="#93C5FD" />
                      <Bar dataKey="recall" name="Rappel" fill="#3B82F6" />
                      <Bar dataKey="f1" name="F1" fill="#1D4ED8" />
                      <Bar dataKey="roc_auc" name="ROC-AUC" fill="#0A2250" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </>
          )}
        </>
      )}
    </div>
  );
}
