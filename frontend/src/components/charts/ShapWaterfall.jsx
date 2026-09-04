import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

export function ShapWaterfall({ data = [], height = 220 }) {
  if (!data || data.length === 0) {
    return <div className="p-4 text-xs text-slate-500">No SHAP attribution data available.</div>;
  }

  const formattedData = data.map((d) => {
    const val = Number(d.impact !== undefined ? d.impact : d.value !== undefined ? d.value : 0);
    return {
      feature: d.feature || d.description || "Factor",
      value: val,
      impact: val >= 0 ? "Increases Risk" : "Lowers Risk",
    };
  });

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          layout="vertical"
          margin={{ top: 10, right: 24, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={{ stroke: "#334155" }}
            tickLine={false}
            tickFormatter={(v) => (v > 0 ? `+${v}` : `${v}`)}
          />
          <YAxis
            type="category"
            dataKey="feature"
            width={180}
            tick={{ fill: "#cbd5e1", fontSize: 11 }}
            axisLine={{ stroke: "#334155" }}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-xs shadow-xl">
                    <p className="font-semibold text-slate-200">{item.feature}</p>
                    <p
                      className={`mt-1 font-mono font-medium ${
                        item.value >= 0 ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      SHAP: {item.value >= 0 ? `+${item.value}` : item.value} ({item.impact})
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine x={0} stroke="#64748b" strokeWidth={1.5} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {formattedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.value >= 0 ? "#f43f5e" : "#10b981"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
