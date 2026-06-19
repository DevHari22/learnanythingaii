import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSessionToken, SESSION_COOKIE } from "@/lib/admin-auth";
import Sidebar from "@/components/admin/Sidebar";

export const metadata = { title: "Admin Dashboard — LearnAnythingAI" };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!validateSessionToken(token)) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen">{children}</main>
    </div>
  );
}
