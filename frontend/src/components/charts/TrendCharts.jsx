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
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey={data[0]?.quarter ? "quarter" : "month"}
            tick={{ fill: "#5B6470", fontSize: 11 }}
            axisLine={{ stroke: "#D9DDE3" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#5B6470", fontSize: 11 }}
            axisLine={{ stroke: "#D9DDE3" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderColor: "#D9DDE3",
              borderRadius: "0.375rem",
              fontSize: "12px",
              color: "#17202A",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px", color: "#5B6470" }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="utilisation"
            name="Utilisation %"
            stroke="#16A34A"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#16A34A" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="completion"
            name="Completion %"
            stroke="#2563EB"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#2563EB" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="alerts"
            name="Anomaly Alerts"
            stroke="#DC2626"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 3, fill: "#DC2626" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
