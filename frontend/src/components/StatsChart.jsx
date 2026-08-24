function StatCard({ label, value, colorClass = "text-text" }) {
    return (
      <div className="bg-surface border border-border rounded-lg p-4 flex-1">
        <p className="text-muted text-xs uppercase tracking-wide">{label}</p>
        <p className={`font-mono text-2xl mt-1 ${colorClass}`}>{value}</p>
      </div>
    );
  }
  
  function StatsChart({ stats }) {
    return (
      <div className="flex gap-4">
        <StatCard label="Transactions analysees" value={stats.total} />
        <StatCard
          label="Fraudes detectees"
          value={stats.fraudCount}
          colorClass="text-alert"
        />
        <StatCard
          label="Taux de fraude"
          value={`${stats.fraudRate.toFixed(1)}%`}
          colorClass="text-alert"
        />
      </div>
    );
  }
  
  export default StatsChart;