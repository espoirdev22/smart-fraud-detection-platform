function getStatus(score) {
    if (score >= 630) return { label: "Bloque", color: "text-alert" };
    return { label: "A verifier", color: "text-warn" };
  }
  
  function AlertsTable({ history }) {
    const alerts = [...history]
      .map((t) => ({ ...t, score: Math.round(t.fraud_probability * 1000) }))
      .filter((t) => t.score >= 500)
      .sort((a, b) => b.id - a.id)
      .slice(0, 6);
  
    if (alerts.length === 0) {
      return <p className="text-muted text-sm">Aucune alerte pour le moment.</p>;
    }
  
    return (
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted text-left">
            <th className="pb-2 font-normal">N°</th>
            <th className="pb-2 font-normal">Type</th>
            <th className="pb-2 font-normal">Score</th>
            <th className="pb-2 font-normal">Statut</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((a) => {
            const status = getStatus(a.score);
            return (
              <tr key={a.id} className="border-t border-border">
                <td className="py-2 font-mono text-muted">{a.id}</td>
                <td className="py-2 font-mono">{a.type}</td>
                <td className="py-2 font-mono text-alert">{a.score}</td>
                <td className={`py-2 ${status.color}`}>{status.label}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
  
  export default AlertsTable;