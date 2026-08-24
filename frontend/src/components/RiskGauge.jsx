function RiskGauge({ percentage, colorClass }) {
    const radius = 80;
    const circumference = Math.PI * radius;
    const offset = circumference * (1 - percentage / 100);
  
    return (
      <svg width="200" height="110" viewBox="0 0 200 110">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#2A2F36"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          className={colorClass}
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
    );
  }
  
  export default RiskGauge;