import { adminApi } from "@/lib/admin-api";
import StatsCard from "@/components/admin/StatsCard";

function heatColor(pct: number | null) {
  if (pct === null) return "bg-slate-50 text-slate-300";
  if (pct >= 70) return "bg-emerald-500 text-white";
  if (pct >= 55) return "bg-emerald-400 text-white";
  if (pct >= 40) return "bg-amber-400 text-white";
  if (pct >= 25) return "bg-orange-400 text-white";
  return "bg-red-400 text-white";
}

export default async function RetentionPage() {
  const data = await adminApi.retention().catch(() => null);
  const d = data || {};

  const day1 = d.day1 ?? null;
  const day7 = d.day7 ?? null;
  const day30 = d.day30 ?? null;
  const cohorts: any[] = d.cohorts || [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Retention</h1>
          <p className="text-slate-500 text-sm mt-1">User cohort retention — live from DB</p>
        </div>
        <span className="text-xs bg-emerald-50 text-emerald-600 font-semibold px-3 py-1.5 rounded-xl border border-emerald-200">
          Live Data
        </span>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatsCard title="Day-1 Retention" value={day1 != null ? `${day1}%` : "—"} change="returned next day" changeType="up" iconBg="bg-emerald-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" className="w-5 h-5"><path d="M3 3v18h18" strokeLinecap="round" /><path d="M7 16l4-4 4 4 4-8" strokeLinecap="round" strokeLinejoin="round" /></svg>} />
        <StatsCard title="Day-7 Retention" value={day7 != null ? `${day7}%` : "—"} change="returned after 7 days" changeType="up" iconBg="bg-blue-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" className="w-5 h-5"><path d="M3 3v18h18" strokeLinecap="round" /><path d="M7 16l4-4 4 4 4-8" strokeLinecap="round" strokeLinejoin="round" /></svg>} />
        <StatsCard title="Day-30 Retention" value={day30 != null ? `${day30}%` : "—"} change="returned after 30 days" changeType="up" iconBg="bg-purple-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" className="w-5 h-5"><path d="M3 3v18h18" strokeLinecap="round" /><path d="M7 16l4-4 4 4 4-8" strokeLinecap="round" strokeLinejoin="round" /></svg>} />
        <StatsCard title="Cohorts Tracked" value={cohorts.length} change="monthly cohorts" changeType="neutral" iconBg="bg-amber-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" /></svg>} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
        <h2 className="text-slate-900 font-semibold text-base mb-1">Retention Rates — Live</h2>
        <p className="text-slate-400 text-xs mb-6">% of users who returned after signing up</p>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: "Day-1 Retention", value: day1, desc: "Came back the next day", color: "emerald" },
            { label: "Day-7 Retention", value: day7, desc: "Active 7 days after signup", color: "blue" },
            { label: "Day-30 Retention", value: day30, desc: "Active 30 days after signup", color: "purple" },
          ].map(item => (
            <div key={item.label} className={`p-6 rounded-2xl bg-${item.color}-50 text-center`}>
              <p className={`text-5xl font-bold text-${item.color}-600 mb-2`}>
                {item.value != null ? `${item.value}%` : "—"}
              </p>
              <p className="text-sm font-semibold text-slate-700">{item.label}</p>
              <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
        <h2 className="text-slate-900 font-semibold text-base mb-1">User Cohorts</h2>
        <p className="text-slate-400 text-xs mb-6">Users signed up per month — live from DB</p>
        {cohorts.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="font-medium">No cohort data yet</p>
            <p className="text-sm mt-1">Cohorts will appear as users register over time</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 pr-6">Cohort</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">Users Joined</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">Size</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((row: any) => (
                  <tr key={row.cohort} className="border-t border-slate-50">
                    <td className="pr-6 py-3 text-sm font-semibold text-slate-700">{row.cohort}</td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-slate-800">{row.users}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[120px]">
                          <div
                            className={`h-full rounded-full ${heatColor(Math.min(100, (row.users / Math.max(...cohorts.map((c: any) => c.users))) * 100))}`}
                            style={{ width: `${Math.min(100, (row.users / Math.max(...cohorts.map((c: any) => c.users))) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{row.users} users</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-slate-900 font-semibold text-base mb-6">Benchmark Comparison</h2>
        <div className="space-y-5">
          {[
            { metric: "Day-1 Retention", ours: day1, industry: 40 },
            { metric: "Day-7 Retention", ours: day7, industry: 20 },
            { metric: "Day-30 Retention", ours: day30, industry: 10 },
          ].map(item => (
            <div key={item.metric}>
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span className="font-medium text-slate-700">{item.metric}</span>
                <span>
                  <span className="text-purple-600 font-bold">{item.ours != null ? `${item.ours}%` : "—"}</span>
                  {" "}vs {item.industry}% industry avg
                </span>
              </div>
              <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="absolute h-full bg-slate-300 rounded-full" style={{ width: `${item.industry}%` }} />
                {item.ours != null && (
                  <div className="absolute h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(item.ours, 100)}%` }} />
                )}
              </div>
              {item.ours != null && item.ours > 0 && (
                <p className="text-xs text-emerald-600 font-semibold mt-1">
                  {Math.round(item.ours / item.industry * 10) / 10}× industry average
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
