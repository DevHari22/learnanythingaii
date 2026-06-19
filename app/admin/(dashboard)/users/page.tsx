import { adminApi } from "@/lib/admin-api";
import StatsCard from "@/components/admin/StatsCard";

export default async function UsersPage() {
  const [usersData, overview] = await Promise.all([
    adminApi.users().catch(() => null),
    adminApi.overview().catch(() => null),
  ]);

  const users: any[] = usersData?.users || [];
  const o = overview || {};
  const activeCount = users.filter((u: any) => u.status === "active").length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-500 text-sm mt-1">All registered beta users — live from DB</p>
        </div>
        <span className="text-xs bg-emerald-50 text-emerald-600 font-semibold px-3 py-1.5 rounded-xl border border-emerald-200">
          Live Data
        </span>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatsCard title="Total Users" value={usersData?.total ?? "—"} change={`+${o.newThisWeek ?? 0} this week`} changeType="up" iconBg="bg-purple-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" className="w-5 h-5"><circle cx="9" cy="7" r="4" /><path d="M2 21a7 7 0 0 1 14 0" /></svg>} />
        <StatsCard title="Active Today" value={o.activeToday ?? "—"} change="unique sessions today" changeType="neutral" iconBg="bg-emerald-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>} />
        <StatsCard title="New This Week" value={o.newThisWeek ?? "—"} change="registered users" changeType="up" iconBg="bg-blue-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" className="w-5 h-5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>} />
        <StatsCard title="Active (7d)" value={activeCount} change="returned in last 7 days" changeType="neutral" iconBg="bg-amber-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500">{users.length} users loaded</p>
        </div>
        {users.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mx-auto mb-3 text-slate-200">
              <circle cx="9" cy="7" r="4" /><path d="M2 21a7 7 0 0 1 14 0" />
            </svg>
            <p className="font-medium">No users yet</p>
            <p className="text-sm mt-1">Users will appear here once they sign up</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["User", "Courses", "Sessions", "Last Active", "Status"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u: any, i: number) => (
                <tr key={u.email} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {u.picture ? (
                        <img src={u.picture} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {(u.name || u.email).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{u.courses}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{u.sessions}</td>
                  <td className="px-6 py-4 text-xs text-slate-400">{u.lastActive}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      u.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-slate-300"}`} />
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-6 py-4 border-t border-slate-100 text-sm text-slate-400">
          Showing {users.length} users
        </div>
      </div>
    </div>
  );
}
