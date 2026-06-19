const API = process.env.NEXT_PUBLIC_API_URL!;
const KEY = process.env.ADMIN_API_KEY!;

const headers = { "X-Admin-Key": KEY, "Content-Type": "application/json" };

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`Admin API ${path} → ${res.status}`);
  return res.json();
}

export const adminApi = {
  overview: () => get<any>("/api/admin/stats/overview"),
  growth: () => get<any>("/api/admin/stats/growth"),
  coursesDaily: () => get<any>("/api/admin/stats/courses-daily"),
  users: () => get<any>("/api/admin/stats/users"),
  engagement: () => get<any>("/api/admin/stats/engagement"),
  retention: () => get<any>("/api/admin/stats/retention"),
};
