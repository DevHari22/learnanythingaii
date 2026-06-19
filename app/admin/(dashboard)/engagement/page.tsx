import { adminApi } from "@/lib/admin-api";
import StatsCard from "@/components/admin/StatsCard";
import EngagementChart from "@/components/admin/charts/EngagementChart";

export default async function EngagementPage() {
  const data = await adminApi.engagement().catch(() => null);
  const d = data || {};

  const weekly: any[] = d.weekly || [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Engagement</h1>
          <p className="text-slate-500 text-sm mt-1">How deeply users interact with generated courses — live from DB</p>
        </div>
        <span className="text-xs bg-emerald-50 text-emerald-600 font-semibold px-3 py-1.5 rounded-xl border border-emerald-200">
          Live Data
        </span>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatsCard title="Quiz Attempts" value={d.quizTotal ?? "—"} change="all time total" changeType="neutral" iconBg="bg-amber-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" /></svg>} />
        <StatsCard title="Lessons Completed" value={d.avgLessonsCompleted != null ? d.avgLessonsCompleted : "—"} change="avg per user" changeType="neutral" iconBg="bg-purple-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" className="w-5 h-5"><polyline points="9 11 12 14 22 4" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>} />
        <StatsCard title="Quiz Pass Rate" value={d.quizPassRate != null ? `${d.quizPassRate}%` : "—"} change="from quiz results" changeType="up" iconBg="bg-emerald-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>} />
        <StatsCard title="Avg Quiz Score" value={d.avgScore != null ? `${d.avgScore}%` : "—"} change="out of 100%" changeType="neutral" iconBg="bg-blue-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" className="w-5 h-5"><path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-slate-900 font-semibold text-base">Weekly Engagement Trend</h2>
            <p className="text-slate-400 text-xs mt-0.5">Quiz attempts and active users per week — live from DB</p>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-600 font-semibold px-3 py-1 rounded-full border border-emerald-200">Live</span>
        </div>
        {weekly.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
            No quiz data yet — will populate as users take quizzes
          </div>
        ) : (
          <EngagementChart data={weekly.map((w: any) => ({ week: w.week, quizzes: w.quizzes, users: w.users }))} />
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-slate-900 font-semibold text-base mb-6">Quiz Summary</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-6 bg-purple-50 rounded-2xl">
            <p className="text-4xl font-bold text-purple-600">{d.quizTotal ?? 0}</p>
            <p className="text-sm text-slate-500 mt-2">Total Attempts</p>
          </div>
          <div className="text-center p-6 bg-emerald-50 rounded-2xl">
            <p className="text-4xl font-bold text-emerald-600">{d.quizPassRate != null ? `${d.quizPassRate}%` : "—"}</p>
            <p className="text-sm text-slate-500 mt-2">Pass Rate</p>
          </div>
          <div className="text-center p-6 bg-blue-50 rounded-2xl">
            <p className="text-4xl font-bold text-blue-600">{d.avgLessonsCompleted ?? "—"}</p>
            <p className="text-sm text-slate-500 mt-2">Avg Lessons/User</p>
          </div>
        </div>
        {d.quizTotal === 0 || !d.quizTotal ? (
          <p className="text-center text-slate-400 text-sm mt-6">
            Quiz data will appear here once users start taking quizzes in their courses.
          </p>
        ) : null}
      </div>
    </div>
  );
}
