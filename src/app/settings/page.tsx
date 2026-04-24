import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { Logo } from "@/components/logo";
import { ProfileDropdown } from "@/components/profile-dropdown";
import {
  DisplayNameForm,
  AvatarColorPicker,
  NotificationsToggle,
  DeleteAccountButton,
} from "./settings-client";

type Props = { searchParams: Promise<{ success?: string; error?: string }> };

export default async function SettingsPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.email) redirect("/sign-in");

  const params = await searchParams;
  const user   = session.user;

  const displayName =
    user.name?.split(" ").filter(Boolean).slice(0, 2)
      .map((p, i) => (i === 0 ? p : p[0] + ".")).join(" ") || "User";
  const initials =
    user.name?.split(" ").filter(Boolean).slice(0, 2)
      .map((p) => p[0]?.toUpperCase()).join("") || "U";
  const provider = "Google"; // only Google OAuth for now

  async function handleSignOut() { "use server"; await signOut({ redirectTo: "/" }); }

  return (
    <div className="animate-page-in min-h-screen" style={{ backgroundColor: "#f1f4f8" }}>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-cyan-900/40 bg-[#071f3f]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3.5">
          <Logo />
          <ProfileDropdown displayName={displayName} initials={initials} signOutAction={handleSignOut} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-6 py-10 space-y-6">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-700 transition">
          ← Back to dashboard
        </Link>

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your account and preferences.</p>
        </div>

        {/* ── 1. Profile ── */}
        <Section title="Profile">
          <Field label="Display name" desc="Shown in the navigation bar.">
            <DisplayNameForm
              currentName={user.name ?? ""}
              success={params.success === "name"}
              error={params.error === "name"}
            />
          </Field>

          <Field label="Email" desc="Linked to your sign-in account.">
            <p className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500 select-all">
              {user.email}
            </p>
          </Field>

          <Field label="Avatar colour" desc="Colour of your initials badge in the nav.">
            <AvatarColorPicker initials={initials} />
          </Field>
        </Section>

        {/* ── 2. Account ── */}
        <Section title="Account">
          <Field label="Connected account" desc="You signed in using this provider.">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm">
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {provider}
              </span>
              <span className="text-xs text-slate-400">Password login not available</span>
            </div>
          </Field>

          <Field label="Delete account" desc="Permanently removes your account and all data. Cannot be undone.">
            <DeleteAccountButton />
          </Field>
        </Section>

        {/* ── 3. Preferences ── */}
        <Section title="Preferences">
          <Field label="Language" desc="Interface language.">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500">
              🇨🇦 English — more languages coming soon
            </div>
          </Field>

          <Field label="Practice reminders" desc="Get reminded if you haven't practised in 3 days.">
            <div className="flex items-center gap-3">
              <NotificationsToggle />
              <span className="text-sm text-slate-500">Email me if I haven&apos;t practised in 3 days</span>
            </div>
          </Field>
        </Section>

        {/* ── 4. Sign out ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-slate-700">Signed in as <span className="text-slate-900">{user.email}</span></p>
          <form action={handleSignOut}>
            <button
              type="submit"
              className="w-full rounded-xl border-2 border-red-200 bg-red-50 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 active:scale-[0.99]"
            >
              Sign out
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-500">{title}</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {children}
      </div>
    </div>
  );
}

// ── Field row ─────────────────────────────────────────────────────────────────

function Field({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 px-6 py-5 sm:grid-cols-[1fr_1.5fr]">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{desc}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}
