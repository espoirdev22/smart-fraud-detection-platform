function RepartitionBars({ stats }) {
    const normalCount = stats.total - stats.fraudCount;
    const maxValue = Math.max(stats.total, 1);
    const normalPercent = (normalCount / maxValue) * 100;
    const fraudPercent = (stats.fraudCount / maxValue) * 100;
  
    return (
      <div className="space-y-4">
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
    );
  }
  
  export default RepartitionBars;