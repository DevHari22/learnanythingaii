import StatsCard from "@/components/admin/StatsCard";

const ERROR_LOG = [
  { user: "rahul@gmail.com", error: "NO_TRANSCRIPT", video: "Python for Beginners", time: "2 min ago" },
  { user: "emily.j@outlook.com", error: "API_ERROR", video: "React Tutorial", time: "14 min ago" },
  { user: "priya.nair@yahoo.com", error: "NO_TRANSCRIPT", video: "Data Science Course", time: "31 min ago" },
  { user: "carlos@gmail.com", error: "CONNECTION_FAILED", video: "Node.js Crash Course", time: "1 hr ago" },
  { user: "tom.w@gmail.com", error: "NO_TRANSCRIPT", video: "Machine Learning", time: "2 hrs ago" },
  { user: "liuwei@qq.com", error: "API_ERROR", video: "UI/UX Design", time: "3 hrs ago" },
  { user: "aisha.p@gmail.com", error: "NO_TRANSCRIPT", video: "Digital Marketing", time: "5 hrs ago" },
];

const ERROR_STYLE: Record<string, string> = {
  NO_TRANSCRIPT: "bg-amber-50 text-amber-700 border border-amber-200",
  API_ERROR: "bg-red-50 text-red-700 border border-red-200",
  CONNECTION_FAILED: "bg-slate-100 text-slate-600 border border-slate-200",
  MOCK_DATA: "bg-blue-50 text-blue-700 border border-blue-200",
};

export default function ErrorsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Errors & Diagnostics</h1>
        <p className="text-slate-500 text-sm mt-1">Platform health monitoring and failure analysis</p>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatsCard title="Error Rate" value="8.3%" change="-2.1% vs last month" changeType="up" iconBg="bg-red-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" /></svg>} />
        <StatsCard title="Errors Today" value="14" change="vs 21 yesterday" changeType="up" iconBg="bg-amber-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" className="w-5 h-5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3" strokeLinecap="round" /></svg>} />
        <StatsCard title="No Transcript" value="4.8%" change="most common error" changeType="neutral" iconBg="bg-amber-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" className="w-5 h-5"><path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" /></svg>} />
        <StatsCard title="Mock Data Rate" value="6.2%" change="-1.8% vs last month" changeType="up" iconBg="bg-slate-100"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 12h6M9 15h4" strokeLinecap="round" /></svg>} />
      </div>

      <div className="grid grid-cols-3 gap-5 mb-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-slate-900 font-semibold text-base mb-6">Error Breakdown</h2>
          <div className="space-y-4">
            {[
              { label: "NO_TRANSCRIPT", count: 91, pct: 57, color: "bg-amber-400" },
              { label: "API_ERROR", count: 44, pct: 28, color: "bg-red-400" },
              { label: "CONNECTION_FAILED", count: 16, pct: 10, color: "bg-slate-400" },
              { label: "OTHER", count: 8, pct: 5, color: "bg-blue-400" },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-600 font-medium">{item.label}</span>
                  <span className="text-slate-400">{item.count} ({item.pct}%)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-slate-900 font-semibold text-base mb-6">Error Rate Over Time (Daily)</h2>
          <div className="flex items-end gap-2 h-32">
            {[8.1, 7.9, 9.2, 10.1, 8.7, 8.4, 7.8, 9.3, 8.9, 8.1, 7.6, 8.2, 8.0, 8.3].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-slate-400">{v}%</span>
                <div
                  className="w-full bg-red-400 rounded-t-sm"
                  style={{ height: `${(v / 12) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>Jun 6</span>
            <span>Jun 19</span>
          </div>
        </div>
      </div>

      {/* Error log */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-slate-900 font-semibold text-base">Recent Errors</h2>
            <p className="text-slate-400 text-xs mt-0.5">Last 24 hours</p>
          </div>
          <span className="text-xs bg-red-50 text-red-600 font-semibold px-3 py-1 rounded-full border border-red-200">
            14 errors today
          </span>
        </div>
        <div className="space-y-2">
          {ERROR_LOG.map((e, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-50">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" className="w-4 h-4">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{e.video}</p>
                <p className="text-xs text-slate-400">{e.user}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ERROR_STYLE[e.error] || "bg-slate-100 text-slate-600"}`}>
                {e.error}
              </span>
              <span className="text-xs text-slate-400 w-20 text-right flex-shrink-0">{e.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
