"use client";

import { useEffect, useMemo, useState } from "react";

export type GCPainPoint =
  | "Permit delays"
  | "Subcontractor coordination"
  | "Change order management"
  | "Client communications"
  | "Billing/invoicing"
  | "Schedule tracking";

export type GCProjectType = "Residential" | "Commercial" | "Renovation" | "New Build";

export type GCCommunicationPreference =
  | "Email"
  | "Text/SMS"
  | "Phone call"
  | "Slack/Teams"
  | "In-app portal";

export type GCOnboardingResponse = {
  createdAt: string;
  section1_currentOperations: {
    opsAdminPeopleCount: number | null;
    currentSoftware: string;
    painPointsRanked: GCPainPoint[];
  };
  section2_projectPortfolio: {
    activeProjects: number | null;
    averageProjectDurationWeeks: number | null;
    typicalProjectValueRange: string;
    projectTypes: GCProjectType[];
  };
  section3_teamStructure: {
    teamInvites: Array<{ name?: string; email: string; roleHint?: string }>;
    decisionMakingProcess: string;
    communicationPreferences: GCCommunicationPreference[];
    communicationNotes: string;
  };
  section4_goals: {
    successIn3Months: string;
    keyMetricsToImprove: string[];
    preferredCommunicationStyle: string;
  };
};

const STORAGE_KEY = "kealee:gc-onboarding:v1";

const PAIN_POINTS: GCPainPoint[] = [
  "Permit delays",
  "Subcontractor coordination",
  "Change order management",
  "Client communications",
  "Billing/invoicing",
  "Schedule tracking",
];

const PROJECT_TYPES: GCProjectType[] = ["Residential", "Commercial", "Renovation", "New Build"];

const COMM_PREFS: GCCommunicationPreference[] = ["Email", "Text/SMS", "Phone call", "Slack/Teams", "In-app portal"];

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] font-black text-zinc-700">
      {children}
    </span>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div>
        <div className="text-lg font-black tracking-tight">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-zinc-700">{subtitle}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function parseInviteLines(raw: string) {
  // Supported formats:
  // - email@domain.com
  // - Name <email@domain.com>
  // - Name, email@domain.com, Role
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const invites: Array<{ name?: string; email: string; roleHint?: string }> = [];
  for (const line of lines) {
    const angle = line.match(/^(.*)<([^>]+)>$/);
    if (angle) {
      const name = angle[1].trim().replace(/["']/g, "");
      const email = angle[2].trim();
      if (email.includes("@")) invites.push({ name: name || undefined, email });
      continue;
    }

    const parts = line.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2 && parts[1].includes("@")) {
      invites.push({ name: parts[0] || undefined, email: parts[1], roleHint: parts[2] || undefined });
      continue;
    }

    if (line.includes("@")) invites.push({ email: line });
  }
  return invites;
}

function uniqStrings(items: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of items.map((x) => x.trim()).filter(Boolean)) {
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

export function GCOnboarding({
  onSubmit,
}: {
  onSubmit?: (data: GCOnboardingResponse) => Promise<void> | void;
}) {
  // Section 1
  const [opsAdminPeopleCount, setOpsAdminPeopleCount] = useState<number | null>(2);
  const [currentSoftware, setCurrentSoftware] = useState("");
  const [painPointSelected, setPainPointSelected] = useState<Record<GCPainPoint, boolean>>(() =>
    Object.fromEntries(PAIN_POINTS.map((p) => [p, false])) as Record<GCPainPoint, boolean>
  );
  const [painPointsRanked, setPainPointsRanked] = useState<GCPainPoint[]>([]);

  // Section 2
  const [activeProjects, setActiveProjects] = useState<number | null>(3);
  const [avgDurationWeeks, setAvgDurationWeeks] = useState<number | null>(12);
  const [projectValueRange, setProjectValueRange] = useState<string>("$250k-$750k");
  const [projectTypes, setProjectTypes] = useState<Record<GCProjectType, boolean>>(() =>
    Object.fromEntries(PROJECT_TYPES.map((t) => [t, false])) as Record<GCProjectType, boolean>
  );

  // Section 3
  const [teamInvitesRaw, setTeamInvitesRaw] = useState("");
  const [decisionMaking, setDecisionMaking] = useState("");
  const [commPrefs, setCommPrefs] = useState<Record<GCCommunicationPreference, boolean>>(() =>
    Object.fromEntries(COMM_PREFS.map((c) => [c, false])) as Record<GCCommunicationPreference, boolean>
  );
  const [commNotes, setCommNotes] = useState("");

  // Section 4
  const [success3Months, setSuccess3Months] = useState("");
  const [metricsRaw, setMetricsRaw] = useState("");
  const [preferredStyle, setPreferredStyle] = useState("");

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Load prior answers (MVP localStorage)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as GCOnboardingResponse;

      setOpsAdminPeopleCount(parsed.section1_currentOperations.opsAdminPeopleCount);
      setCurrentSoftware(parsed.section1_currentOperations.currentSoftware || "");

      const selected: Record<GCPainPoint, boolean> = Object.fromEntries(PAIN_POINTS.map((p) => [p, false])) as any;
      for (const p of parsed.section1_currentOperations.painPointsRanked || []) selected[p] = true;
      setPainPointSelected(selected);
      setPainPointsRanked(parsed.section1_currentOperations.painPointsRanked || []);

      setActiveProjects(parsed.section2_projectPortfolio.activeProjects);
      setAvgDurationWeeks(parsed.section2_projectPortfolio.averageProjectDurationWeeks);
      setProjectValueRange(parsed.section2_projectPortfolio.typicalProjectValueRange || "");
      const pt: Record<GCProjectType, boolean> = Object.fromEntries(PROJECT_TYPES.map((t) => [t, false])) as any;
      for (const t of parsed.section2_projectPortfolio.projectTypes || []) pt[t] = true;
      setProjectTypes(pt);

      setTeamInvitesRaw(
        (parsed.section3_teamStructure.teamInvites || [])
          .map((i) => (i.name ? `${i.name} <${i.email}>` : i.email))
          .join("\n")
      );
      setDecisionMaking(parsed.section3_teamStructure.decisionMakingProcess || "");
      const cp: Record<GCCommunicationPreference, boolean> = Object.fromEntries(COMM_PREFS.map((c) => [c, false])) as any;
      for (const c of parsed.section3_teamStructure.communicationPreferences || []) cp[c] = true;
      setCommPrefs(cp);
      setCommNotes(parsed.section3_teamStructure.communicationNotes || "");

      setSuccess3Months(parsed.section4_goals.successIn3Months || "");
      setMetricsRaw((parsed.section4_goals.keyMetricsToImprove || []).join("\n"));
      setPreferredStyle(parsed.section4_goals.preferredCommunicationStyle || "");

      setSavedAt(parsed.createdAt || null);
    } catch {
      // ignore
    }
  }, []);

  // Keep ranked pain points in sync with selected checkbox set
  useEffect(() => {
    setPainPointsRanked((prev) => {
      const selected = PAIN_POINTS.filter((p) => painPointSelected[p]);
      // Keep prior ordering for those still selected, append newly selected.
      const kept = prev.filter((p) => selected.includes(p));
      const missing = selected.filter((p) => !kept.includes(p));
      return [...kept, ...missing];
    });
  }, [painPointSelected]);

  const painPointsValid = painPointsRanked.length >= 1;
  const goalsValid = success3Months.trim().length >= 10;

  const response: GCOnboardingResponse = useMemo(() => {
    const teamInvites = parseInviteLines(teamInvitesRaw);
    const projectTypesSelected = PROJECT_TYPES.filter((t) => projectTypes[t]);
    const commSelected = COMM_PREFS.filter((c) => commPrefs[c]);
    const metrics = uniqStrings(metricsRaw.split("\n"));

    return {
      createdAt: new Date().toISOString(),
      section1_currentOperations: {
        opsAdminPeopleCount,
        currentSoftware: currentSoftware.trim(),
        painPointsRanked,
      },
      section2_projectPortfolio: {
        activeProjects,
        averageProjectDurationWeeks: avgDurationWeeks,
        typicalProjectValueRange: projectValueRange.trim(),
        projectTypes: projectTypesSelected,
      },
      section3_teamStructure: {
        teamInvites,
        decisionMakingProcess: decisionMaking.trim(),
        communicationPreferences: commSelected,
        communicationNotes: commNotes.trim(),
      },
      section4_goals: {
        successIn3Months: success3Months.trim(),
        keyMetricsToImprove: metrics,
        preferredCommunicationStyle: preferredStyle.trim(),
      },
    };
  }, [
    opsAdminPeopleCount,
    currentSoftware,
    painPointsRanked,
    activeProjects,
    avgDurationWeeks,
    projectValueRange,
    projectTypes,
    teamInvitesRaw,
    decisionMaking,
    commPrefs,
    commNotes,
    success3Months,
    metricsRaw,
    preferredStyle,
  ]);

  function movePainPoint(index: number, dir: -1 | 1) {
    setPainPointsRanked((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[j];
      next[j] = tmp;
      return next;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!painPointsValid) {
      // eslint-disable-next-line no-alert
      alert("Please select and rank at least one pain point.");
      return;
    }
    if (!goalsValid) {
      // eslint-disable-next-line no-alert
      alert('Please describe what success looks like in 3 months (at least 10 characters).');
      return;
    }

    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(response));
      setSavedAt(new Date().toISOString());
      await onSubmit?.(response);
      // eslint-disable-next-line no-alert
      alert("Onboarding saved. This data can now be used to tailor setup and reporting.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-tight">GC onboarding questionnaire</h2>
          <p className="mt-2 max-w-3xl text-sm text-zinc-700">
            These answers help Kealee PMs understand your operations, create initial service requests, set up project templates, and customize weekly reporting.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill>Informs PMs</Pill>
            <Pill>Creates initial requests</Pill>
            <Pill>Templates + reporting setup</Pill>
            {savedAt ? <Pill>Last saved: {new Date(savedAt).toLocaleString()}</Pill> : null}
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save onboarding"}
        </button>
      </div>

      <SectionCard
        title="Section 1: Current operations"
        subtitle="Tell us how you currently run ops/admin and what hurts the most."
      >
        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-zinc-900">How many people handle operations/admin?</span>
            <input
              className="h-10 rounded-xl border border-black/10 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
              type="number"
              min={0}
              value={opsAdminPeopleCount ?? ""}
              onChange={(e) => setOpsAdminPeopleCount(e.target.value === "" ? null : Number(e.target.value))}
              placeholder="e.g. 2"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-zinc-900">What software do you currently use?</span>
            <input
              className="h-10 rounded-xl border border-black/10 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
              value={currentSoftware}
              onChange={(e) => setCurrentSoftware(e.target.value)}
              placeholder="Buildertrend, Procore, QuickBooks, Google Drive…"
            />
          </label>

          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
            <div className="text-sm font-black text-zinc-950">Biggest pain points (select and rank)</div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {PAIN_POINTS.map((p) => (
                <label key={p} className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={painPointSelected[p]}
                    onChange={(e) => setPainPointSelected((prev) => ({ ...prev, [p]: e.target.checked }))}
                  />
                  <span className="text-sm font-bold text-zinc-800">{p}</span>
                </label>
              ))}
            </div>

            <div className="mt-4">
              <div className="text-xs font-black text-zinc-700">Ranking (top = highest impact)</div>
              {painPointsRanked.length ? (
                <div className="mt-2 grid gap-2">
                  {painPointsRanked.map((p, idx) => (
                    <div key={p} className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-3 py-2">
                      <div className="min-w-0">
                        <div className="text-sm font-black text-zinc-950">
                          {idx + 1}. {p}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => movePainPoint(idx, -1)}
                          className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-black text-zinc-900 hover:bg-zinc-50"
                          disabled={idx === 0}
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          onClick={() => movePainPoint(idx, 1)}
                          className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-black text-zinc-900 hover:bg-zinc-50"
                          disabled={idx === painPointsRanked.length - 1}
                        >
                          Down
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-2 text-sm text-zinc-700">Select at least one pain point to start ranking.</div>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Section 2: Project portfolio"
        subtitle="This helps us size coverage, templates, and reporting."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-zinc-900">Number of active projects</span>
            <input
              className="h-10 rounded-xl border border-black/10 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
              type="number"
              min={0}
              value={activeProjects ?? ""}
              onChange={(e) => setActiveProjects(e.target.value === "" ? null : Number(e.target.value))}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-zinc-900">Average project duration (weeks)</span>
            <input
              className="h-10 rounded-xl border border-black/10 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
              type="number"
              min={0}
              value={avgDurationWeeks ?? ""}
              onChange={(e) => setAvgDurationWeeks(e.target.value === "" ? null : Number(e.target.value))}
            />
          </label>

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-extrabold text-zinc-900">Typical project value range</span>
            <input
              className="h-10 rounded-xl border border-black/10 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
              value={projectValueRange}
              onChange={(e) => setProjectValueRange(e.target.value)}
              placeholder="$100k-$250k, $250k-$750k, $750k-$2M, $2M+"
            />
          </label>

          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 md:col-span-2">
            <div className="text-sm font-black text-zinc-950">Project types</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {PROJECT_TYPES.map((t) => (
                <label key={t} className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={projectTypes[t]}
                    onChange={(e) => setProjectTypes((prev) => ({ ...prev, [t]: e.target.checked }))}
                  />
                  <span className="text-sm font-bold text-zinc-800">{t}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Section 3: Team structure"
        subtitle="Who should we work with and how should we communicate?"
      >
        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-zinc-900">Key team members to invite (one per line)</span>
            <textarea
              className="min-h-[120px] rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
              value={teamInvitesRaw}
              onChange={(e) => setTeamInvitesRaw(e.target.value)}
              placeholder={"Jane <jane@acmegc.com>\nops@acmegc.com\nMike, mike@acmegc.com, Superintendent"}
            />
            <div className="text-xs text-zinc-600">
              Parsed invites: <span className="font-black text-zinc-800">{parseInviteLines(teamInvitesRaw).length}</span>
            </div>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-zinc-900">Decision-making process</span>
            <textarea
              className="min-h-[92px] rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
              value={decisionMaking}
              onChange={(e) => setDecisionMaking(e.target.value)}
              placeholder="e.g. PM proposes, Owner approves changes over $5k, Superintendent signs off schedule..."
            />
          </label>

          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
            <div className="text-sm font-black text-zinc-950">Communication preferences</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {COMM_PREFS.map((c) => (
                <label key={c} className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={commPrefs[c]}
                    onChange={(e) => setCommPrefs((prev) => ({ ...prev, [c]: e.target.checked }))}
                  />
                  <span className="text-sm font-bold text-zinc-800">{c}</span>
                </label>
              ))}
            </div>
            <label className="mt-3 grid gap-2">
              <span className="text-xs font-black text-zinc-700">Notes (hours, cadence, who to CC, etc.)</span>
              <textarea
                className="min-h-[92px] rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                value={commNotes}
                onChange={(e) => setCommNotes(e.target.value)}
                placeholder="e.g. daily text check-in 7–8am, weekly call Fridays, CC office admin on invoices..."
              />
            </label>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Section 4: Goals with Kealee"
        subtitle="This drives initial service requests, templates, and what shows up in weekly reports."
      >
        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-zinc-900">What does success look like in 3 months?</span>
            <textarea
              className="min-h-[110px] rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
              value={success3Months}
              onChange={(e) => setSuccess3Months(e.target.value)}
              placeholder="e.g. permits are predictable, subs are scheduled 2 weeks ahead, change orders are controlled, weekly reports are client-ready..."
            />
            {!goalsValid ? <div className="text-xs text-amber-700">Please add a bit more detail.</div> : null}
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-zinc-900">Key metrics you want to improve (one per line)</span>
            <textarea
              className="min-h-[92px] rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
              value={metricsRaw}
              onChange={(e) => setMetricsRaw(e.target.value)}
              placeholder={"Inspection pass rate\nDays lost to permit delays\nChange order cycle time\nClient response time"}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-zinc-900">Preferred communication style</span>
            <input
              className="h-10 rounded-xl border border-black/10 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
              value={preferredStyle}
              onChange={(e) => setPreferredStyle(e.target.value)}
              placeholder="Direct/brief, proactive, detail-heavy, weekly executive summary, etc."
            />
          </label>
        </div>
      </SectionCard>

      <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-700">
        <div className="text-sm font-black text-zinc-900">What we do with this data</div>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Create initial service requests (permits, scheduling, vendor coordination, etc.)</li>
          <li>Set up project templates and checklists tailored to your workflow</li>
          <li>Customize weekly reports (executive summary + action items + risk/issue focus)</li>
        </ul>
      </div>
    </form>
  );
}

