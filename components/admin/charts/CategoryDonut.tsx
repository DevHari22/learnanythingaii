"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const data = [
  { name: "Programming", value: 38, color: "#7c3aed" },
  { name: "Data Science", value: 22, color: "#2563eb" },
  { name: "Design", value: 15, color: "#0891b2" },
  { name: "Marketing", value: 12, color: "#059669" },
  { name: "Other", value: 13, color: "#94a3b8" },
];

export default function CategoryDonut() {
  return (
    <>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#1e293b", border: "none", borderRadius: 12, color: "#f8fafc", fontSize: 13 }}
            formatter={(v) => [`${v}%`, ""]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2 mt-2">
        {data.map(item => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <span className="text-slate-600">{item.name}</span>
            </div>
            <span className="font-semibold text-slate-700">{item.value}%</span>
          </div>
        ))}
      </div>
    </>
  );
}
