import { signOut } from "@/auth";
import { auth } from "@/auth";
import { AppNavTabs } from "@/components/app-nav-tabs";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Account";

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
          {/* Logo */}
          <span
            className="shrink-0 text-base font-bold tracking-tight"
            style={{ color: "var(--brand-teal)" }}
          >
            RoleReady
          </span>

          {/* Nav tabs */}
          <div className="flex-1">
            <AppNavTabs />
          </div>

          {/* User + sign out */}
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:block">{firstName}</span>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Page content */}
      {children}
    </div>
  );
}
