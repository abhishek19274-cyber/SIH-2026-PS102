import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function TrendChart({ data, height = 240 }) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey={data[0]?.quarter ? "quarter" : "month"}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={{ stroke: "#334155" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={{ stroke: "#334155" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0e1524",
              borderColor: "#334155",
              borderRadius: "0.5rem",
              fontSize: "12px",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="utilisation"
            name="Utilisation %"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#10b981" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="completion"
            name="Completion %"
            stroke="#0ea5e9"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#0ea5e9" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="alerts"
            name="Anomaly Alerts"
            stroke="#f43f5e"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 3, fill: "#f43f5e" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
