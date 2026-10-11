function TransactionTable({ history }) {
  if (history.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg shadow-card p-6">
        <h2 className="font-mono text-sm text-muted uppercase tracking-wide mb-2">
          Historique
        </h2>
        <p className="text-muted text-sm">Aucune transaction analysee pour l'instant.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg shadow-card p-6">
      <h2 className="font-mono text-sm text-muted uppercase tracking-wide mb-4">
        Historique ({history.length})
      </h2>

      <div className="space-y-2">
        {history.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between border-b border-border pb-2 text-sm"
          >
            <span className="font-mono text-muted w-12">{item.id}</span>
            <span className="font-mono text-muted w-24">{item.type}</span>
            <span className="font-mono">{item.amount.toLocaleString()}</span>
            <span
              className={
                item.is_fraud ? "text-alert font-mono" : "text-muted font-mono"
              }
            >
              {Math.round(item.fraud_probability * 1000)}%
            </span>
            <span className={item.is_fraud ? "text-alert" : "text-safe"}>
              {item.is_fraud ? "Fraude" : "Normal"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TransactionTable;