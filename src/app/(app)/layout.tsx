import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar userName={user.name} role={user.role} />
        <main className="flex-1 px-8 py-7">
          <div className="mx-auto w-full max-w-[1200px] space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
