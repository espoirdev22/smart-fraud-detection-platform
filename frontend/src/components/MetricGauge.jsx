function MetricGauge({ label, value, color }) {
    const radius = 42;
    const circumference = Math.PI * radius;
    const filled = circumference * value;
  
    return (
      <div className="flex flex-col items-center">
        <svg width="120" height="70" viewBox="0 0 100 58">
          <path
            d="M 8 50 A 42 42 0 0 1 92 50"
            fill="none"
            stroke="#30343D"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 8 50 A 42 42 0 0 1 92 50"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
          />
          <text
            x="50"
            y="46"
            textAnchor="middle"
            fill="#F5F6F7"
            fontSize="16"
            fontFamily="monospace"
          >
            {(value * 100).toFixed(1)}%
          </text>
        </svg>
        <p className="text-muted text-xs mt-1">{label}</p>
      </div>
    );
  }
  
  export default MetricGauge;