import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function VelocityChart({ data, height = 240 }) {
  return (
    <div className="w-full space-y-3" style={{ minHeight: height }}>
      {/* Velocity Pipeline Stages */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {data.map((stage, idx) => (
          <div
            key={stage.stage}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 text-center relative overflow-hidden"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Stage {idx + 1}
            </div>
            <div className="mt-1 text-xs font-bold text-slate-200 truncate">
              {stage.stage}
            </div>
            <div className="mt-1 text-sm font-bold text-sky-400 font-mono">
              Day {stage.days}
            </div>
            <div className="mt-1 text-[11px] text-amber-400 font-medium">
              +{stage.predictedUnspent}% unspent risk
            </div>
            {stage.dwellDays > 0 && (
              <div className="mt-1 text-[10px] text-slate-500">
                dwell: {stage.dwellDays}d
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chart visualization */}
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fundGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="unspentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="stage"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              axisLine={{ stroke: "#334155" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              axisLine={{ stroke: "#334155" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0e1524",
                borderColor: "#334155",
                borderRadius: "0.5rem",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              name="Active Capital Reaching Stage (%)"
              stroke="#0ea5e9"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#fundGradient)"
            />
            <Area
              type="monotone"
              dataKey="predictedUnspent"
              name="Predicted Unspent Accumulation (%)"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="3 3"
              fillOpacity={1}
              fill="url(#unspentGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
