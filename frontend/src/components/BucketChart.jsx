import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
  } from "recharts";
  
  const TRANCHES = [
    { label: "0-200", min: 0, max: 200 },
    { label: "200-400", min: 200, max: 400 },
    { label: "400-600", min: 400, max: 600 },
    { label: "600-800", min: 600, max: 800 },
    { label: "800-1000", min: 800, max: 1001 },
  ];
  
  function BucketChart({ history }) {
    const scores = history.map((t) => Math.round(t.fraud_probability * 1000));
  
    const data = TRANCHES.map((t) => ({
      tranche: t.label,
      total: scores.filter((s) => s >= t.min && s < t.max).length,
    }));
  
    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="tranche" stroke="#9AA2AE" fontSize={11} />
          <YAxis allowDecimals={false} stroke="#9AA2AE" fontSize={11} />
          <Tooltip
            contentStyle={{
              background: "#1E2128",
              border: "1px solid #30343D",
              borderRadius: 8,
            }}
          />
          <Bar dataKey="total" name="Transactions" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  
  export default BucketChart;