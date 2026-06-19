import { adminApi } from "@/lib/admin-api";
import StatsCard from "@/components/admin/StatsCard";
import GrowthChart from "@/components/admin/charts/GrowthChart";
import CoursesBarChart from "@/components/admin/charts/CoursesBarChart";
import CategoryDonut from "@/components/admin/charts/CategoryDonut";

export default async function OverviewPage() {
  const [overview, growth, daily] = await Promise.all([
    adminApi.overview().catch(() => null),
    adminApi.growth().catch(() => null),
    adminApi.coursesDaily().catch(() => null),
  ]);

  const o = overview || {};

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Live platform metrics from database</p>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatsCard title="Total Users" value={o.totalUsers ?? "—"} change={`+${o.newThisMonth ?? 0} this month`} changeType="up" subtitle="Extension installs" iconBg="bg-purple-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" className="w-5 h-5"><circle cx="9" cy="7" r="4" /><path d="M2 21a7 7 0 0 1 14 0" /></svg>} />
        <StatsCard title="Courses Generated" value={o.totalCourses ?? "—"} change={`+${o.newThisMonth ?? 0} this month`} changeType="up" subtitle="All time total" iconBg="bg-blue-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" className="w-5 h-5"><path d="M12 3L2 8l10 5 10-5-10-5z" /><path d="M2 13l10 5 10-5" /></svg>} />
        <StatsCard title="Active Today" value={o.activeToday ?? "—"} change={`${o.activeThisWeek ?? 0} this week`} changeType="up" subtitle="Unique sessions" iconBg="bg-emerald-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" className="w-5 h-5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" /></svg>} />
        <StatsCard title="DAU / MAU" value={o.dauMau != null ? `${o.dauMau}%` : "—"} change="Stickiness ratio" changeType="neutral" subtitle="Daily vs monthly active" iconBg="bg-amber-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" /></svg>} />
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatsCard title="New This Week" value={o.newThisWeek ?? "—"} changeType="up" change="registered users" iconBg="bg-purple-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" className="w-5 h-5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>} />
        <StatsCard title="Active This Week" value={o.activeThisWeek ?? "—"} changeType="up" change="unique users" iconBg="bg-blue-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" className="w-5 h-5"><path d="M3 3v18h18" strokeLinecap="round" /><path d="M7 16l4-4 4 4 4-8" strokeLinecap="round" strokeLinejoin="round" /></svg>} />
        <StatsCard title="Quiz Pass Rate" value={o.quizPassRate != null ? `${o.quizPassRate}%` : "—"} changeType="up" change="from quiz results" iconBg="bg-emerald-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>} />
        <StatsCard title="Active This Month" value={o.activeThisMonth ?? "—"} changeType="neutral" change="monthly active users" iconBg="bg-amber-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>} />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-slate-900 font-semibold text-base">User Growth</h2>
              <p className="text-slate-400 text-xs mt-0.5">New users per month — live from DB</p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-600 font-semibold px-3 py-1 rounded-full border border-emerald-200">Live</span>
          </div>
          <GrowthChart data={growth?.data} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-slate-900 font-semibold text-base">Top Categories</h2>
            <p className="text-slate-400 text-xs mt-0.5">Videos being studied</p>
          </div>
          <CategoryDonut />
        </div>
      </div>

      <div className="mt-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-slate-900 font-semibold text-base">Courses Generated Per Day</h2>
            <p className="text-slate-400 text-xs mt-0.5">Last 14 days — live from DB</p>
          </div>
          <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-3 py-1 rounded-full border border-blue-200">
            {o.totalCourses ?? 0} total
          </span>
        </div>
        <CoursesBarChart data={daily?.daily} />
      </div>
    </div>
  );
}
