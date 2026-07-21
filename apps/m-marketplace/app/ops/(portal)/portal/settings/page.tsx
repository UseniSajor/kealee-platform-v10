export default function SettingsPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold text-zinc-950">Settings</h1>
      <p className="text-sm text-zinc-600 mt-1">Manage your account, notifications, and subscription.</p>

      <div className="mt-6 grid gap-4">
        {/* Profile */}
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <h2 className="font-bold text-zinc-900">Profile</h2>
          <p className="text-sm text-zinc-600 mt-1">Your account information and company details.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-zinc-700">Full Name</label>
              <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm" placeholder="Your name" />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700">Email</label>
              <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm" placeholder="you@company.com" type="email" />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700">Company</label>
              <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm" placeholder="Your company" />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700">Phone</label>
              <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm" placeholder="+1 (555) 000-0000" />
            </div>
          </div>
          <button className="mt-4 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-zinc-800 transition">
            Save Changes
          </button>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <h2 className="font-bold text-zinc-900">Notifications</h2>
          <p className="text-sm text-zinc-600 mt-1">Choose how you receive updates about your projects.</p>
          <div className="mt-4 space-y-3">
            {[
              { label: "Email notifications", desc: "Receive email updates for project activity" },
              { label: "SMS alerts", desc: "Get text messages for critical updates" },
              { label: "Daily digest", desc: "Summary of all activity sent each morning" },
              { label: "Weekly reports", desc: "Automated weekly project reports" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-black/5 bg-zinc-50 p-3">
                <div>
                  <div className="text-sm font-bold text-zinc-900">{item.label}</div>
                  <div className="text-xs text-zinc-600">{item.desc}</div>
                </div>
                <div className="h-6 w-10 rounded-full bg-sky-500 p-0.5 cursor-pointer">
                  <div className="h-5 w-5 rounded-full bg-white shadow-sm translate-x-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription */}
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <h2 className="font-bold text-zinc-900">Subscription</h2>
          <p className="text-sm text-zinc-600 mt-1">Your current plan and billing information.</p>
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-sky-900">Performance Plan</div>
                <div className="text-xs text-sky-700">$199/month · Up to 10 projects</div>
              </div>
              <span className="rounded-full bg-sky-600 px-3 py-1 text-xs font-bold text-white">Active</span>
            </div>
          </div>
          <div className="mt-3 flex gap-3">
            <button className="rounded-xl border border-black/10 px-4 py-2 text-sm font-bold text-zinc-900 hover:bg-zinc-50 transition">
              Change Plan
            </button>
            <button className="rounded-xl border border-black/10 px-4 py-2 text-sm font-bold text-zinc-900 hover:bg-zinc-50 transition">
              Billing History
            </button>
          </div>
        </div>

        {/* PM Software Link */}
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-center">
          <h3 className="font-bold text-sky-900">PM Software Settings</h3>
          <p className="text-sm text-sky-700 mt-1">
            Manage your PM software preferences, team roles, and project configuration.
          </p>
          <a
            href={process.env.NEXT_PUBLIC_PM_URL ? `${process.env.NEXT_PUBLIC_PM_URL}/settings` : "/settings"}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-700 transition"
          >
            Open PM Settings &rarr;
          </a>
        </div>
      </div>
    </section>
  );
}

