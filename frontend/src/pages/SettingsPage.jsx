import { useEffect, useState } from "react";
import useFetch from "../hooks/useFetch";
import { API_BASE_URL, getSettings, getSystemStatus, saveThresholds } from "../services/api";
import { fmtDateTime } from "../lib/format";
import { Button, ErrorBanner, Panel, Pill, Spinner, inputClass } from "../components/ui/Common";

export default function SettingsPage({ canEdit }) {
  const { data, error, loading, reload } = useFetch(getSettings, []);
  const status = useFetch(getSystemStatus, []);
  const [verify, setVerify] = useState("0.5");
  const [block, setBlock] = useState("0.93");
  const [msg, setMsg] = useState({ ok: "", err: "" });

  useEffect(() => {
    if (data) { setVerify(String(data.thresholds.verify)); setBlock(String(data.thresholds.block)); }
  }, [data]);

  const save = async (e) => {
    e.preventDefault();
    setMsg({ ok: "", err: "" });
    try {
      await saveThresholds({ verify: Number(verify), block: Number(block) });
      setMsg({ ok: "Seuils enregistrés. Ils s'appliquent aux prochaines analyses.", err: "" });
      reload();
    } catch (err) {
      setMsg({ ok: "", err: err.message });
    }
  };

  const s = status.data;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">Paramètres</h1>
        <p className="text-sm text-ink/70">Réglages de la décision et état du système.</p>
      </div>
      <ErrorBanner message={error} onRetry={reload} />
      {loading && !data ? <Spinner /> : data && (
        <Panel title="Seuils de décision">
          <form onSubmit={save} className="grid max-w-xl gap-4">
            <label className="text-sm">
              Seuil de vérification (à vérifier à partir de)
              <input className={`${inputClass} mt-1`} type="number" step="0.01" min="0" max="1" value={verify} disabled={!canEdit} onChange={(e) => setVerify(e.target.value)} />
            </label>
            <label className="text-sm">
              Seuil de blocage (fraude probable à partir de)
              <input className={`${inputClass} mt-1`} type="number" step="0.01" min="0" max="1" value={block} disabled={!canEdit} onChange={(e) => setBlock(e.target.value)} />
            </label>
            <p className="text-xs text-soft">
              Ces seuils s'appliquent à la probabilité brute du modèle (0 à 1), pas au score affiché. Valeurs d'origine : vérification {data.defaults.verify}, blocage {data.defaults.block}
              (seuil choisi pour minimiser le coût des erreurs). Le score affiché utilise une température de {data.score_temperature}.
            </p>
            {!canEdit && <p className="text-xs text-warn">Seuls les superviseurs et les administrateurs peuvent modifier les seuils.</p>}
            {msg.ok && <p className="text-sm text-ok">{msg.ok}</p>}
            {msg.err && <p className="text-sm text-danger">{msg.err}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={!canEdit}>Enregistrer</Button>
              <Button type="button" variant="ghost" disabled={!canEdit} onClick={() => { setVerify(String(data.defaults.verify)); setBlock(String(data.defaults.block)); }}>
                Valeurs d'origine
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel title="État du système">
        {status.loading && !s ? <Spinner /> : s ? (
          <ul className="space-y-2 text-sm">
            <Row k="Base de données"><Pill className={s.database ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger"}>{s.database ? "Connectée" : "Injoignable"}</Pill></Row>
            <Row k="Modèle"><Pill className={s.model ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger"}>{s.model ? "Fichier présent" : "Fichier introuvable"}</Pill></Row>
            <Row k="Dernière transaction">{s.last_transaction_at ? fmtDateTime(s.last_transaction_at) : "Aucune"}</Row>
            <Row k="Version de l'API">{s.api_version}</Row>
            <Row k="Adresse de l'API">{API_BASE_URL}</Row>
            <Row k="Supervision">
              <a className="text-brand underline" href="http://localhost:3001" target="_blank" rel="noreferrer">Grafana</a>{" · "}
              <a className="text-brand underline" href="http://localhost:9091" target="_blank" rel="noreferrer">Prometheus</a>
            </Row>
          </ul>
        ) : <ErrorBanner message={status.error} onRetry={status.reload} />}
      </Panel>
    </div>
  );
}

const Row = ({ k, children }) => (
  <li className="flex justify-between gap-4 border-b border-line/70 py-2 last:border-0">
    <span className="text-soft">{k}</span><span className="text-right font-medium">{children}</span>
  </li>
);
