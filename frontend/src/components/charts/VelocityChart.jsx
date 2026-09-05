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
            className="rounded border border-[#D9DDE3] bg-[#F0F2F5] p-2.5 text-center relative overflow-hidden"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A838E]">
              Stage {idx + 1}
            </div>
            <div className="mt-1 text-xs font-bold text-[#17202A] truncate">
              {stage.stage}
            </div>
            <div className="mt-1 text-sm font-bold text-[#2563EB] font-mono">
              Day {stage.days}
            </div>
            <div className="mt-1 text-[11px] text-[#D97706] font-semibold">
              +{stage.predictedUnspent}% unspent risk
            </div>
            {stage.dwellDays > 0 && (
              <div className="mt-1 text-[10px] text-[#5B6470]">
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
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="unspentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D97706" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="stage"
              tick={{ fill: "#5B6470", fontSize: 10 }}
              axisLine={{ stroke: "#D9DDE3" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#5B6470", fontSize: 10 }}
              axisLine={{ stroke: "#D9DDE3" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderColor: "#D9DDE3",
                borderRadius: "0.375rem",
                color: "#17202A",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              name="Active Capital Reaching Stage (%)"
              stroke="#2563EB"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#fundGradient)"
            />
            <Area
              type="monotone"
              dataKey="predictedUnspent"
              name="Predicted Unspent Accumulation (%)"
              stroke="#D97706"
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
