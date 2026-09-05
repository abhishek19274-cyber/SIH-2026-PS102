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
    return <div className="p-4 text-xs text-[#7A838E]">No SHAP attribution data available.</div>;
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
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "#5B6470", fontSize: 11 }}
            axisLine={{ stroke: "#D9DDE3" }}
            tickLine={false}
            tickFormatter={(v) => (v > 0 ? `+${v}` : `${v}`)}
          />
          <YAxis
            type="category"
            dataKey="feature"
            width={180}
            tick={{ fill: "#17202A", fontSize: 11 }}
            axisLine={{ stroke: "#D9DDE3" }}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="rounded border border-[#D9DDE3] bg-white p-2 text-xs shadow-md">
                    <p className="font-semibold text-[#17202A]">{item.feature}</p>
                    <p
                      className={`mt-1 font-mono font-bold ${
                        item.value >= 0 ? "text-red-600" : "text-emerald-700"
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
          <ReferenceLine x={0} stroke="#9CA3AF" strokeWidth={1} />
          <Bar dataKey="value" radius={[0, 2, 2, 0]}>
            {formattedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.value >= 0 ? "#DC2626" : "#16A34A"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
