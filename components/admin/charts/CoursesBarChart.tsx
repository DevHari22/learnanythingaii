"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const FALLBACK = [{ day: "No data", courses: 0 }];

export default function CoursesBarChart({ data }: { data?: { day: string; courses: number }[] }) {
  const chartData = data && data.length > 0 ? data : FALLBACK;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={20}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "#1e293b", border: "none", borderRadius: 12, color: "#f8fafc", fontSize: 13 }}
          cursor={{ fill: "#f1f5f9" }}
          formatter={(v) => [v, "Courses"]}
        />
        <Bar dataKey="courses" fill="#7c3aed" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
