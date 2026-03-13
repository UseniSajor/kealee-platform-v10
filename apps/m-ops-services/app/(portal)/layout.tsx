import Link from "next/link";
import { headers } from "next/headers";

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const path = headers().get("x-next-url") || "";

  const links = [
    { href: "/portal", label: "Dashboard" },
    { href: "/portal/my-projects", label: "Projects" },
    { href: "/portal/site-tools", label: "Site tools" },
    { href: "/portal/service-requests", label: "Requests" },
    { href: "/portal/weekly-reports", label: "Reports" },
    { href: "/portal/team", label: "Team" },
    { href: "/portal/billing", label: "Billing" },
    { href: "/portal/settings", label: "Settings" },
    { href: "/contractor/leads",   label: "My Leads" },
    { href: "/contractor/profile", label: "My Profile" },
  ] as const;

  function isActive(href: string) {
    if (!path) return false;
    return path === href || (href !== "/portal" && path.startsWith(href));
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        {/* Desktop sidebar */}
        <aside className="hidden w-72 shrink-0 border-r border-black/10 bg-white px-4 py-5 md:block">
          <div className="text-sm font-black tracking-tight text-zinc-950">GC Portal</div>
          <div className="mt-1 text-xs text-zinc-600">Mobile-first ops for project teams</div>

          <nav className="mt-5 grid gap-2">
            {links.map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={[
                    "rounded-xl px-3 py-2.5 text-sm font-black transition",
                    active
                      ? "bg-sky-50 text-sky-700 border border-sky-200"
                      : "text-zinc-900 hover:bg-zinc-50 border border-transparent",
                  ].join(" ")}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* PM Software CTA */}
          <a
            href={process.env.NEXT_PUBLIC_PM_URL || "/"}
            className="mt-6 flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-800 hover:bg-sky-100 transition"
          >
            <div>
              <div className="font-black text-sky-900">Open PM Software &rarr;</div>
              <div className="mt-1">
                Schedule, budget, RFIs, submittals, daily logs, and more.
              </div>
            </div>
          </a>

          <div className="mt-4 rounded-2xl border border-black/10 bg-zinc-50 p-4 text-xs text-zinc-700">
            <div className="font-black text-zinc-900">Site mode</div>
            <div className="mt-1">
              Optimized for gloves, quick actions, and offline use.
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="w-full px-4 py-5 pb-24 md:px-8 md:py-8 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-[760px] grid-cols-5 gap-1 px-2 py-2">
          {(
            [
              { href: "/portal", label: "Home" },
              { href: "/portal/site-tools", label: "Site" },
              { href: "/portal/service-requests", label: "Requests" },
              { href: "/portal/weekly-reports", label: "Reports" },
              { href: "/portal/settings", label: "Settings" },
            ] as const
          ).map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={[
                  "flex h-12 flex-col items-center justify-center rounded-xl text-[11px] font-black",
                  active ? "bg-sky-50 text-sky-700" : "text-zinc-800 hover:bg-zinc-50",
                ].join(" ")}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

