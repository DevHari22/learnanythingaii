import { adminApi } from "@/lib/admin-api";
import StatsCard from "@/components/admin/StatsCard";
import CoursesBarChart from "@/components/admin/charts/CoursesBarChart";

export default async function CoursesPage() {
  const [daily, overview] = await Promise.all([
    adminApi.coursesDaily().catch(() => null),
    adminApi.overview().catch(() => null),
  ]);

  const o = overview || {};
  const topVideos: any[] = daily?.topVideos || [];
  const dailyData: any[] = daily?.daily || [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
          <p className="text-slate-500 text-sm mt-1">Generated course analytics and video breakdown — live from DB</p>
        </div>
        <span className="text-xs bg-emerald-50 text-emerald-600 font-semibold px-3 py-1.5 rounded-xl border border-emerald-200">
          Live Data
        </span>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatsCard title="Total Generated" value={o.totalCourses ?? "—"} change={`+${o.newThisMonth ?? 0} this month`} changeType="up" iconBg="bg-purple-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" className="w-5 h-5"><path d="M12 3L2 8l10 5 10-5-10-5z" /><path d="M2 13l10 5 10-5" /></svg>} />
        <StatsCard title="Total Users" value={o.totalUsers ?? "—"} change="registered accounts" changeType="neutral" iconBg="bg-blue-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" className="w-5 h-5"><circle cx="9" cy="7" r="4" /><path d="M2 21a7 7 0 0 1 14 0" /></svg>} />
        <StatsCard title="Active Today" value={o.activeToday ?? "—"} change="generating courses" changeType="up" iconBg="bg-emerald-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" className="w-5 h-5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" /></svg>} />
        <StatsCard title="Top Videos" value={topVideos.length} change="unique videos studied" changeType="neutral" iconBg="bg-amber-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" className="w-5 h-5"><polygon points="5 3 19 12 5 21 5 3" /></svg>} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-slate-900 font-semibold text-base">Courses Per Day</h2>
            <p className="text-slate-400 text-xs mt-0.5">Last 14 days — live from DB</p>
          </div>
          <span className="text-xs bg-purple-50 text-purple-600 font-semibold px-3 py-1 rounded-full border border-purple-200">
            {dailyData.reduce((s: number, d: any) => s + (d.courses || 0), 0)} in 14 days
          </span>
        </div>
        <CoursesBarChart data={dailyData} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-slate-900 font-semibold text-base mb-1">Most Generated Videos</h2>
        <p className="text-slate-400 text-xs mb-6">Top YouTube videos users are studying — live from DB</p>
        {topVideos.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 mx-auto mb-3 text-slate-200">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <p className="font-medium">No courses yet</p>
            <p className="text-sm mt-1">Videos will appear here once users generate courses</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topVideos.map((v: any, i: number) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <span className="text-slate-300 font-bold text-lg w-6 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{v.title || "Untitled"}</p>
                  {v.url && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{v.url}</p>
                  )}
                </div>
                <span className="text-sm font-bold text-purple-600 w-16 text-right">{v.count}×</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
