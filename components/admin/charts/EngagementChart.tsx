"use client";

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

const FALLBACK = [
  { week: "W1", quizzes: 0, users: 0 },
];

export default function EngagementChart({ data }: { data?: { week: string; quizzes: number; users: number }[] }) {
  const chartData = data && data.length > 0 ? data : FALLBACK;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "#1e293b", border: "none", borderRadius: 12, color: "#f8fafc", fontSize: 13 }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
        <Line type="monotone" dataKey="quizzes" stroke="#7c3aed" strokeWidth={2} dot={false} name="Quizzes" />
        <Line type="monotone" dataKey="users" stroke="#059669" strokeWidth={2} dot={false} name="Active Users" />
      </LineChart>
    </ResponsiveContainer>
  );
}
