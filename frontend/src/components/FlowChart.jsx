import {
    ComposedChart,
    Area,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
  } from "recharts";
  
  function FlowChart({ history }) {
    const data = [...history]
      .sort((a, b) => a.id - b.id)
      .slice(-30)
      .map((t, i) => ({
        n: i + 1,
        score: Math.round(t.fraud_probability * 1000),
        seuil: 500,
      }));
  
    if (data.length < 2) {
      return (
        <p className="text-muted text-sm">
          Fais au moins deux predictions pour voir la courbe.
        </p>
      );
    }
  
    return (
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="n" stroke="#9AA2AE" fontSize={11} />
          <YAxis domain={[0, 1000]} stroke="#9AA2AE" fontSize={11} />
          <Tooltip
            contentStyle={{
              background: "#1E2128",
              border: "1px solid #30343D",
              borderRadius: 8,
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            name="Score"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#scoreFill)"
          />
          <Line
            type="monotone"
            dataKey="seuil"
            name="Seuil de verification"
            stroke="#3DA35D"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }
  
  export default FlowChart;