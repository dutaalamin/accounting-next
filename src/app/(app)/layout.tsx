import { requireUser } from "@/lib/auth";
import { ShellBar } from "@/components/shell-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-sap-bg">
      <ShellBar userName={user.name} role={user.role} />
      <main className="px-4 py-4 md:px-6 md:py-5">
        <div className="mx-auto w-full max-w-[1320px] space-y-4">{children}</div>
      </main>
    </div>
  );
}
