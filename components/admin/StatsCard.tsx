interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  iconBg?: string;
  subtitle?: string;
}

export default function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  iconBg = "bg-purple-100",
  subtitle,
}: StatsCardProps) {
  const changeColor =
    changeType === "up" ? "text-emerald-600" : changeType === "down" ? "text-red-500" : "text-slate-500";
  const changeIcon =
    changeType === "up" ? "↑" : changeType === "down" ? "↓" : "";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <div className={`${iconBg} p-2.5 rounded-xl`}>{icon}</div>
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
        {subtitle && <p className="text-slate-400 text-xs mt-1">{subtitle}</p>}
      </div>
      {change && (
        <p className={`text-xs font-semibold ${changeColor}`}>
          {changeIcon} {change}
        </p>
      )}
    </div>
  );
}
