function StatCard({ label, value, colorClass = "text-text" }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4 flex-1">
      <p className="text-muted text-xs uppercase tracking-wide">{label}</p>
      <p className={`font-mono text-2xl mt-1 ${colorClass}`}>{value}</p>
    </div>
  );
}

function StatsChart({ stats }) {
  const normalCount = stats.total - stats.fraudCount;
  const maxValue = Math.max(stats.total, 1);
  const normalPercent = (normalCount / maxValue) * 100;
  const fraudPercent = (stats.fraudCount / maxValue) * 100;

  return (
    <div className="space-y-4">
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

      {stats.total > 0 && (
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-muted text-xs uppercase tracking-wide mb-3">
            Repartition
          </p>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs text-muted mb-1">
                <span>Normal</span>
                <span>{normalCount}</span>
              </div>
              <div className="w-full bg-bg rounded h-3 overflow-hidden">
                <div
                  className="bg-safe h-full rounded transition-all"
                  style={{ width: `${normalPercent}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted mb-1">
                <span>Fraude</span>
                <span>{stats.fraudCount}</span>
              </div>
              <div className="w-full bg-bg rounded h-3 overflow-hidden">
                <div
                  className="bg-alert h-full rounded transition-all"
                  style={{ width: `${fraudPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatsChart;