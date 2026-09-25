import { requireUser } from "@/lib/auth";
import { Sidebar, Topbar } from "@/components/shell-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen bg-sap-bg">
      <Sidebar userName={user.name} role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-6 py-6">
          <div className="mx-auto w-full max-w-[1240px] space-y-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
