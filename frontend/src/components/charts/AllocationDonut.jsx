import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { mpBudget } from "../../data/mockData";

export function AllocationDonut({ budget, height = 240 }) {
  const spent = budget?.spent !== undefined ? budget.spent : budget?.spent_cr !== undefined ? budget.spent_cr : mpBudget.spent;
  const committed = budget?.committed !== undefined ? budget.committed : budget?.committed_cr !== undefined ? budget.committed_cr : mpBudget.committed;
  const available = budget?.available !== undefined ? budget.available : budget?.available_cr !== undefined ? budget.available_cr : mpBudget.available;
  const total = Number((spent + committed + available).toFixed(1)) || 5.0;

  const spentPercent = budget?.spentPercent !== undefined ? budget.spentPercent : Math.round((spent / total) * 100);
  const committedPercent = budget?.committedPercent !== undefined ? budget.committedPercent : Math.round((committed / total) * 100);
  const availablePercent = budget?.availablePercent !== undefined ? budget.availablePercent : Math.round((available / total) * 100);

  const data = [
    { name: "Spent (Disbursed)", value: spent, color: "#10b981", percent: spentPercent },
    { name: "Committed (Sanctioned)", value: committed, color: "#0ea5e9", percent: committedPercent },
    { name: "Available Balance", value: available, color: "#f59e0b", percent: availablePercent },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-full sm:w-1/2" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs shadow-xl">
                      <p className="font-semibold text-slate-200">{item.name}</p>
                      <p className="mt-1 font-mono text-white">
                        ₹{item.value} Cr ({item.percent}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={data}
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={4}
              dataKey="value"
              stroke="#0e1524"
              strokeWidth={3}
            >
              {data.map((entry, index) => (
                <Cell key={`donut-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Centre text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Fund
          </span>
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
            ₹{total.toFixed(1)} Cr
          </span>
          <span className="text-[10px] text-slate-400">FY 2025-26</span>
        </div>
      </div>

      {/* Legend & Breakdown */}
      <div className="w-full sm:w-1/2 space-y-3">
        {data.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/40 p-2.5 text-xs"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium text-slate-300">{item.name}</span>
            </div>
            <div className="text-right font-mono">
              <span className="font-bold text-white">₹{item.value.toFixed(2)} Cr</span>
              <span className="ml-1 text-[11px] text-slate-400">({item.percent}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
