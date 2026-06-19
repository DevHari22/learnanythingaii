"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const FALLBACK = [
  { month: "Jan", users: 0 },
  { month: "Feb", users: 0 },
  { month: "Mar", users: 0 },
];

export default function GrowthChart({ data }: { data?: { month: string; users: number }[] }) {
  const chartData = data && data.length > 0 ? data : FALLBACK;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "#1e293b", border: "none", borderRadius: 12, color: "#f8fafc", fontSize: 13 }}
          cursor={{ stroke: "#7c3aed", strokeWidth: 1, strokeDasharray: "4 4" }}
          formatter={(v) => [v, "Users"]}
        />
        <Area
          type="monotone"
          dataKey="users"
          stroke="#7c3aed"
          strokeWidth={2.5}
          fill="url(#userGrad)"
          dot={{ r: 4, fill: "#7c3aed", strokeWidth: 0 }}
          activeDot={{ r: 6, fill: "#7c3aed", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
