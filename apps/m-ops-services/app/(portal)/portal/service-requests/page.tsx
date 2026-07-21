"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { api } from "@/lib/api";
import { getPrimaryOrgId } from "@/lib/auth";
import type { GCServiceRequest } from "@/components/portal/ServiceRequestWizard";

function formatRelative(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function StatusPill({ status }: { status: GCServiceRequest["status"] }) {
  const styles =
    status === "Completed"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "In Progress"
        ? "bg-sky-50 text-sky-700 border-sky-200"
        : status === "Assigned"
          ? "bg-amber-50 text-amber-800 border-amber-200"
          : "bg-zinc-50 text-zinc-700 border-zinc-200";
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black",
        styles,
      ].join(" ")}
    >
      {status}
    </span>
  );
}

export default function ServiceRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<GCServiceRequest[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const active = useMemo(
    () => requests.find((r) => r.id === activeId) || null,
    [activeId, requests]
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listServiceRequests();
      
      // Map backend format to frontend format
      const mappedRequests: GCServiceRequest[] = (data.serviceRequests || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description || null,
        category: r.category as GCServiceRequest["category"],
        priority: (r.priority === 'urgent' ? 'Urgent' : 'Normal') as GCServiceRequest["priority"],
        status: (
          r.status === 'completed' ? 'Completed' :
          r.status === 'in_progress' ? 'In Progress' :
          r.status === 'assigned' ? 'Assigned' :
          'Submitted'
        ) as GCServiceRequest["status"],
        projectId: (r as any).projectId || null,
        projectName: (r as any).projectName || null,
        createdAt: r.createdAt || new Date().toISOString(),
        assignedPm: (r as any).assignedTo ? {
          name: (r as any).assignedToName || 'Assigned PM',
          email: (r as any).assignedToEmail,
        } : null,
        timeSpentMinutes: (r as any).timeSpentMinutes || 0,
        attachments: (r as any).attachments || [],
        thread: (r as any).thread || [],
        satisfaction: (r as any).satisfaction || null,
      }));
      
      setRequests(mappedRequests);
      if (!activeId && mappedRequests[0]?.id) setActiveId(mappedRequests[0].id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendMessage() {
    if (!active) return;
    if (message.trim().length < 2) return;
    const text = message.trim();
    setMessage("");
    try {
      await api.addServiceRequestMessage(active.id, text);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send message");
    }
  }

  async function setSatisfaction(rating: number) {
    if (!active) return;
    try {
      await api.setServiceRequestSatisfaction(active.id, rating);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to set satisfaction");
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Service requests</h1>
          <p className="mt-2 text-sm text-zinc-700">
            Submit ops requests to the Kealee PM team and track status, time, and communication.
          </p>
        </div>
        <Link
          href="/portal/service-requests/new"
          className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-black text-[var(--primary-foreground)] shadow-sm hover:opacity-95"
        >
          Submit Service Request
        </Link>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-black/10 bg-white p-5 text-sm text-zinc-700 shadow-sm">
          Loading…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900 shadow-sm">
          {error}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-lg font-black tracking-tight">Your requests</h2>
              <button
                type="button"
                onClick={load}
                className="text-sm font-extrabold text-[color:var(--primary)] hover:underline"
              >
                Refresh
              </button>
            </div>

            {requests.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-700">
                No requests yet. Submit your first request and we’ll route it to a PM.
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                {requests.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setActiveId(r.id)}
                    className={[
                      "rounded-2xl border p-4 text-left shadow-sm transition",
                      activeId === r.id
                        ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/15"
                        : "border-black/10 hover:bg-zinc-50",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-zinc-950">{r.title}</div>
                        <div className="mt-1 text-sm text-zinc-700">
                          {r.category}
                          {r.projectName ? ` • ${r.projectName}` : ""}
                        </div>
                      </div>
                      <StatusPill status={r.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
                      <span>
                        <span className="font-bold text-zinc-700">Priority:</span> {r.priority}
                      </span>
                      <span>
                        <span className="font-bold text-zinc-700">Created:</span> {formatRelative(r.createdAt)}
                      </span>
                      <span>
                        <span className="font-bold text-zinc-700">Time spent:</span>{" "}
                        {r.timeSpentMinutes ?? 0}m
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black tracking-tight">Tracking</h2>
              {!active ? (
                <p className="mt-2 text-sm text-zinc-700">Select a request to view details.</p>
              ) : (
                <div className="mt-3 space-y-4">
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-extrabold text-zinc-900">Status</div>
                      <StatusPill status={active.status} />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-extrabold text-zinc-900">Assigned PM</div>
                      <div className="text-zinc-700">
                        {active.assignedPm?.name || "Unassigned"}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-extrabold text-zinc-900">Time spent</div>
                      <div className="text-zinc-700">{active.timeSpentMinutes ?? 0} minutes</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                    <div className="text-sm font-black text-zinc-950">Communication thread</div>
                    <div className="mt-3 space-y-3">
                      {active.thread?.length ? (
                        active.thread.map((m) => (
                          <div key={m.id} className="rounded-xl bg-white p-3 shadow-sm">
                            <div className="text-xs font-bold text-zinc-600">
                              {m.from || "System"} • {formatRelative(m.at)}
                            </div>
                            <div className="mt-1 text-sm text-zinc-800">
                              {m.message || ""}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-zinc-700">No messages yet.</div>
                      )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <input
                        className="h-10 flex-1 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Add a note for the PM team…"
                      />
                      <button
                        type="button"
                        onClick={sendMessage}
                        className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95"
                      >
                        Send
                      </button>
                    </div>
                  </div>

                  {active.status === "Completed" ? (
                    <div className="rounded-2xl border border-black/10 bg-white p-4">
                      <div className="text-sm font-black text-zinc-950">
                        Satisfaction rating
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setSatisfaction(n)}
                            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-zinc-600">
                        Rating is stored on the request for reporting/quality.
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="text-sm font-black text-zinc-950">SLA</div>
              <div className="mt-1 text-sm text-zinc-700">
                Package B: 40 service hours/month • Urgent: 2 hours • Normal: 24 hours
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

