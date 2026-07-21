"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getPrimaryOrgId } from "@/lib/auth";

type GCTeamRole =
  | "Owner/Principal"
  | "Project Manager"
  | "Superintendent"
  | "Office Admin"
  | "Client";

type TeamMemberStatus = "Active" | "Invited" | "Suspended";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: GCTeamRole;
  status: TeamMemberStatus;
  projectAccess: string[]; // project IDs
  invitedAt?: string;
  lastLoginAt?: string | null;
};

type AuditEventType =
  | "invite_sent"
  | "invite_resent"
  | "member_added"
  | "member_removed"
  | "role_changed"
  | "project_access_changed"
  | "status_changed"
  | "login";

type AuditEvent = {
  id: string;
  at: string; // ISO
  actor: string; // "GC Owner" (stub)
  type: AuditEventType;
  details: string;
};

type PermissionKey =
  | "submit_service_requests"
  | "view_financials"
  | "upload_documents"
  | "approve_payments";

type PermissionMatrix = Record<GCTeamRole, Record<PermissionKey, boolean>>;

const STORAGE_KEY = "kealee:gc-team";

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Pill({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "good" | "warn" | "bad";
  children: React.ReactNode;
}) {
  const cls =
    tone === "good"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : tone === "warn"
        ? "bg-amber-50 text-amber-900 border-amber-200"
        : tone === "bad"
          ? "bg-red-50 text-red-800 border-red-200"
          : "bg-white text-zinc-700 border-black/10";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${cls}`}>
      {children}
    </span>
  );
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-black/10 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-black/10 p-5">
          <div>
            <div className="text-lg font-black tracking-tight">{title}</div>
            <div className="mt-1 text-sm text-zinc-600">
              Manage your organization team members.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
          >
            Close
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function roleTone(role: GCTeamRole) {
  if (role === "Owner/Principal") return "good";
  if (role === "Client") return "neutral";
  return "warn";
}

function statusTone(status: TeamMemberStatus) {
  if (status === "Active") return "good";
  if (status === "Invited") return "warn";
  return "bad";
}

function defaultPermissions(): PermissionMatrix {
  return {
    "Owner/Principal": {
      submit_service_requests: true,
      view_financials: true,
      upload_documents: true,
      approve_payments: true,
    },
    "Project Manager": {
      submit_service_requests: true,
      view_financials: true,
      upload_documents: true,
      approve_payments: false,
    },
    Superintendent: {
      submit_service_requests: true,
      view_financials: false,
      upload_documents: true,
      approve_payments: false,
    },
    "Office Admin": {
      submit_service_requests: false,
      view_financials: true,
      upload_documents: true,
      approve_payments: true,
    },
    Client: {
      submit_service_requests: false,
      view_financials: false,
      upload_documents: false,
      approve_payments: false,
    },
  };
}

function describePermission(key: PermissionKey) {
  switch (key) {
    case "submit_service_requests":
      return "Submit service requests";
    case "view_financials":
      return "View financials";
    case "upload_documents":
      return "Upload documents";
    case "approve_payments":
      return "Approve payments";
  }
}

function checkboxIcon(value: boolean) {
  return value ? "✓" : "—";
}

// Map backend roleKey to display role name
const ROLE_KEY_TO_DISPLAY: Record<string, GCTeamRole> = {
  ADMIN: "Owner/Principal",
  OWNER: "Owner/Principal",
  PM: "Project Manager",
  PROJECT_MANAGER: "Project Manager",
  SUPERINTENDENT: "Superintendent",
  OFFICE_ADMIN: "Office Admin",
  CLIENT: "Client",
  MEMBER: "Project Manager", // default mapping
};

const DISPLAY_TO_ROLE_KEY: Record<GCTeamRole, string> = {
  "Owner/Principal": "ADMIN",
  "Project Manager": "PM",
  Superintendent: "SUPERINTENDENT",
  "Office Admin": "OFFICE_ADMIN",
  Client: "CLIENT",
};

function mapApiMemberToTeamMember(apiMember: any): TeamMember {
  const user = apiMember.user || {};
  const roleKey = apiMember.roleKey || "MEMBER";
  const displayRole = ROLE_KEY_TO_DISPLAY[roleKey] || "Project Manager";
  const userStatus = user.status || "ACTIVE";

  let status: TeamMemberStatus = "Active";
  if (userStatus === "INVITED" || userStatus === "PENDING") status = "Invited";
  else if (userStatus === "SUSPENDED" || userStatus === "INACTIVE") status = "Suspended";

  return {
    id: apiMember.userId || apiMember.id,
    name: user.name || user.email?.split("@")[0] || "Unknown",
    email: user.email || "",
    role: displayRole,
    status,
    projectAccess: [], // Project access is managed locally until backend supports it
    invitedAt: apiMember.joinedAt || undefined,
    lastLoginAt: user.lastLoginAt || null,
  };
}

export default function TeamPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectsFromApi, setProjectsFromApi] = useState<{ id: string; name: string }[]>([]);

  const [permissions] = useState<PermissionMatrix>(defaultPermissions());

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<GCTeamRole>("Project Manager");
  const [inviteProjects, setInviteProjects] = useState<string[]>([]);

  const projects = useMemo(
    () => projectsFromApi.length > 0
      ? projectsFromApi
      : [
          { id: "p1", name: "123 Main St Remodel" },
          { id: "p2", name: "Oak Ridge Custom Build" },
          { id: "p3", name: "Downtown Tenant Improvement" },
        ],
    [projectsFromApi]
  );

  function pushAudit(type: AuditEventType, details: string) {
    const e: AuditEvent = {
      id: `ae_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      at: new Date().toISOString(),
      actor: "GC Owner",
      type,
      details,
    };
    setAudit((prev) => [e, ...prev]);
  }

  // Load localStorage fallback data (audit + project access overlays)
  function loadLocalStorage(): { members: TeamMember[]; audit: AuditEvent[] } | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { members?: TeamMember[]; audit?: AuditEvent[] };
        return {
          members: Array.isArray(parsed.members) ? parsed.members : [],
          audit: Array.isArray(parsed.audit) ? parsed.audit : [],
        };
      }
    } catch {
      // ignore
    }
    return null;
  }

  // Seed demo data for fully-offline / no-org scenario
  function seedDemoData() {
    const seededMembers: TeamMember[] = [
      {
        id: "tm_owner",
        name: "Tim Chamberlain",
        email: "owner@acmegc.com",
        role: "Owner/Principal",
        status: "Active",
        projectAccess: projects.map((p) => p.id),
        lastLoginAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      },
      {
        id: "tm_pm",
        name: "Amanda PM",
        email: "pm@acmegc.com",
        role: "Project Manager",
        status: "Active",
        projectAccess: ["p1", "p3"],
        lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      {
        id: "tm_client",
        name: "Client Stakeholder",
        email: "client@example.com",
        role: "Client",
        status: "Invited",
        projectAccess: ["p1"],
        invitedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        lastLoginAt: null,
      },
    ];
    const seededAudit: AuditEvent[] = [
      {
        id: "ae_seed_1",
        at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        actor: "GC Owner",
        type: "invite_sent",
        details: "Invited client@example.com as Client (project: 123 Main St Remodel).",
      },
      {
        id: "ae_seed_2",
        at: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
        actor: "GC Owner",
        type: "login",
        details: "Login from Chrome on Windows (demo entry).",
      },
    ];
    setMembers(seededMembers);
    setAudit(seededAudit);
  }

  // Fetch members from API and merge with local project-access overlays
  const loadMembersFromApi = useCallback(async (oid: string) => {
    try {
      const result = await api.getOrgMembers(oid);
      const apiMembers = (result.members || []).map(mapApiMemberToTeamMember);

      // Merge localStorage project-access overlays onto API members
      const local = loadLocalStorage();
      if (local && local.members.length > 0) {
        for (const am of apiMembers) {
          const localMatch = local.members.find(
            (lm) => lm.id === am.id || lm.email === am.email
          );
          if (localMatch && localMatch.projectAccess.length > 0) {
            am.projectAccess = localMatch.projectAccess;
          }
        }
      }

      setMembers(apiMembers);
      setApiConnected(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Primary data load: API first, localStorage fallback, demo seed last resort
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);

      // 1. Resolve org
      const resolvedOrgId = await getPrimaryOrgId();
      if (cancelled) return;

      if (resolvedOrgId) {
        setOrgId(resolvedOrgId);

        // Load projects
        try {
          const result = await api.getProjects({ orgId: resolvedOrgId });
          if (!cancelled) {
            const mapped = (result.projects || []).map((p: any) => ({
              id: p.id,
              name: p.name || "Unnamed Project",
            }));
            if (mapped.length > 0) setProjectsFromApi(mapped);
          }
        } catch {
          // Fall back to default projects
        }

        // 2. Try API members
        const apiOk = await loadMembersFromApi(resolvedOrgId);
        if (cancelled) return;

        if (!apiOk) {
          // 3. Fall back to localStorage
          const local = loadLocalStorage();
          if (local && local.members.length > 0) {
            setMembers(local.members);
            setAudit(local.audit);
          } else {
            seedDemoData();
          }
        } else {
          // Load audit from localStorage (audit is always local for now)
          const local = loadLocalStorage();
          if (local && local.audit.length > 0) {
            setAudit(local.audit);
          }
        }
      } else {
        // No org -- pure localStorage / demo mode
        const local = loadLocalStorage();
        if (local && local.members.length > 0) {
          setMembers(local.members);
          setAudit(local.audit);
        } else {
          seedDemoData();
        }
      }

      if (!cancelled) setLoading(false);
    }

    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to localStorage as cache / fallback
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ members, audit }));
    } catch {
      // ignore
    }
  }, [members, audit]);

  const permissionKeys: PermissionKey[] = useMemo(
    () => [
      "submit_service_requests",
      "view_financials",
      "upload_documents",
      "approve_payments",
    ],
    []
  );

  function toggleInviteProject(projectId: string) {
    setInviteProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  }

  function resetInvite() {
    setInviteEmail("");
    setInviteName("");
    setInviteRole("Project Manager");
    setInviteProjects([]);
  }

  async function sendInvite() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      // eslint-disable-next-line no-alert
      alert("Enter a valid email.");
      return;
    }
    const name = inviteName.trim() || email.split("@")[0];
    const roleKey = DISPLAY_TO_ROLE_KEY[inviteRole] || "PM";
    const access =
      inviteRole === "Owner/Principal" ? projects.map((p) => p.id) : inviteProjects;

    // Try API first (backend addMember requires userId -- for now, we pass email as userId
    // and the backend will need an invite-by-email flow; fall back to localStorage)
    let addedViaApi = false;
    if (orgId && apiConnected) {
      try {
        // The backend POST /orgs/:id/members expects { userId, roleKey }.
        // True email-based invite requires a separate invite endpoint.
        // For now, try the API call -- it will succeed if userId matches an existing user ID.
        await api.addOrgMember(orgId, { userId: email, roleKey });
        addedViaApi = true;
        // Reload from API to get fresh data
        await loadMembersFromApi(orgId);
      } catch {
        // API call failed (e.g. user not found by email) -- fall back to local
        addedViaApi = false;
      }
    }

    if (!addedViaApi) {
      // localStorage fallback: add member locally
      const id = `tm_${Date.now()}`;
      const invitedAt = new Date().toISOString();
      const nextMember: TeamMember = {
        id,
        name,
        email,
        role: inviteRole,
        status: "Invited",
        invitedAt,
        projectAccess: access,
        lastLoginAt: null,
      };
      setMembers((prev) => [nextMember, ...prev]);
    }

    const projNames =
      access.length === 0
        ? "no projects"
        : access
            .map((pid) => projects.find((p) => p.id === pid)?.name || pid)
            .join(", ");

    pushAudit(
      "invite_sent",
      `Invited ${email} as ${inviteRole} (${projNames}).${addedViaApi ? "" : " Saved locally (email invite is stubbed)."}`
    );
    setInviteOpen(false);
    resetInvite();
  }

  function resendInvite(member: TeamMember) {
    pushAudit("invite_resent", `Resent invitation to ${member.email} (stub).`);
    // eslint-disable-next-line no-alert
    alert("Invite resend is stubbed (wire to email worker).");
  }

  async function removeMember(memberId: string) {
    const m = members.find((x) => x.id === memberId);

    // Try API first
    if (orgId && apiConnected && m) {
      try {
        await api.removeOrgMember(orgId, m.id);
        // Reload from API
        await loadMembersFromApi(orgId);
        pushAudit("member_removed", `Removed ${m.email || memberId} from team.`);
        return;
      } catch {
        // Fall through to local removal
      }
    }

    // localStorage fallback
    setMembers((prev) => prev.filter((x) => x.id !== memberId));
    pushAudit("member_removed", `Removed ${m?.email || memberId} from team.`);
  }

  async function changeRole(memberId: string, role: GCTeamRole) {
    const roleKey = DISPLAY_TO_ROLE_KEY[role] || "PM";

    // Try API first
    if (orgId && apiConnected) {
      try {
        await api.updateOrgMemberRole(orgId, memberId, roleKey);
        // Reload from API
        await loadMembersFromApi(orgId);
        pushAudit("role_changed", `Changed role for ${memberId} to ${role}.`);
        return;
      } catch {
        // Fall through to local update
      }
    }

    // localStorage fallback
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;
        const nextAccess = role === "Owner/Principal" ? projects.map((p) => p.id) : m.projectAccess;
        return { ...m, role, projectAccess: nextAccess };
      })
    );
    pushAudit("role_changed", `Changed role for ${memberId} to ${role}.`);
  }

  function setProjectAccess(memberId: string, projectId: string, allowed: boolean) {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;
        const has = m.projectAccess.includes(projectId);
        if (allowed && !has) return { ...m, projectAccess: [...m.projectAccess, projectId] };
        if (!allowed && has) return { ...m, projectAccess: m.projectAccess.filter((id) => id !== projectId) };
        return m;
      })
    );
    pushAudit("project_access_changed", `Updated project access for ${memberId} (${projectId}).`);
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Team</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-700">
            Invite teammates, assign roles and project access, and review permissions and audit history.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/portal"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
          >
            Back to dashboard
          </Link>
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95"
          >
            Invite member
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight">Team members</h2>
                <p className="mt-1 text-sm text-zinc-700">
                  Manage roles and project access.{apiConnected ? "" : " (Offline mode — changes saved locally.)"}
                </p>
                {loading ? (
                  <div className="mt-2 text-xs text-zinc-500">Loading team data...</div>
                ) : null}
              </div>
              <Pill>{members.length} members</Pill>
            </div>

            <div className="mt-4 overflow-auto">
              <table className="min-w-[920px] w-full border-collapse">
                <thead>
                  <tr className="text-left text-xs font-black text-zinc-600">
                    <th className="border-b border-black/10 pb-2 pr-3">Member</th>
                    <th className="border-b border-black/10 pb-2 pr-3">Role</th>
                    <th className="border-b border-black/10 pb-2 pr-3">Status</th>
                    <th className="border-b border-black/10 pb-2 pr-3">Project access</th>
                    <th className="border-b border-black/10 pb-2 pr-3">Last login</th>
                    <th className="border-b border-black/10 pb-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="text-sm text-zinc-800 align-top">
                      <td className="border-b border-black/5 py-3 pr-3">
                        <div className="font-black text-zinc-950">{m.name}</div>
                        <div className="text-xs text-zinc-600">{m.email}</div>
                      </td>
                      <td className="border-b border-black/5 py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <Pill tone={roleTone(m.role)}>{m.role}</Pill>
                        </div>
                        <div className="mt-2">
                          <label className="text-xs font-black text-zinc-700">
                            Change role
                            <select
                              className="mt-2 h-9 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-black text-zinc-900 outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                              value={m.role}
                              onChange={(e) => changeRole(m.id, e.target.value as GCTeamRole)}
                              disabled={m.role === "Owner/Principal"}
                            >
                              {(
                                [
                                  "Owner/Principal",
                                  "Project Manager",
                                  "Superintendent",
                                  "Office Admin",
                                  "Client",
                                ] as const
                              ).map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </label>
                          {m.role === "Owner/Principal" ? (
                            <div className="mt-1 text-[11px] text-zinc-500">
                              Owner/Principal role cannot be changed.
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="border-b border-black/5 py-3 pr-3">
                        <Pill tone={statusTone(m.status)}>{m.status}</Pill>
                        {m.status === "Invited" ? (
                          <div className="mt-2 text-xs text-zinc-600">
                            Invited: {formatDateTime(m.invitedAt)}
                          </div>
                        ) : null}
                      </td>
                      <td className="border-b border-black/5 py-3 pr-3">
                        {m.role === "Owner/Principal" ? (
                          <div className="text-sm text-zinc-700">
                            Full access (all projects)
                          </div>
                        ) : (
                          <div className="grid gap-2">
                            {projects.map((p) => {
                              const allowed = m.projectAccess.includes(p.id);
                              return (
                                <label key={p.id} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={allowed}
                                    onChange={(e) => setProjectAccess(m.id, p.id, e.target.checked)}
                                  />
                                  <span className="text-sm">{p.name}</span>
                                </label>
                              );
                            })}
                            <div className="text-[11px] text-zinc-500">
                              Project access drives visibility in project views and reports (wire next).
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="border-b border-black/5 py-3 pr-3">
                        <div className="text-sm text-zinc-700">{formatDateTime(m.lastLoginAt)}</div>
                      </td>
                      <td className="border-b border-black/5 py-3 pr-3">
                        <div className="flex flex-wrap gap-2">
                          {m.status === "Invited" ? (
                            <button
                              type="button"
                              onClick={() => resendInvite(m)}
                              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-black text-zinc-900 hover:bg-zinc-50"
                            >
                              Resend invite
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => removeMember(m.id)}
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-800 hover:bg-red-100"
                            disabled={m.role === "Owner/Principal"}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black tracking-tight">Permission matrix</h2>
            <p className="mt-1 text-sm text-zinc-700">
              Default permissions by role. This is informational in the MVP; enforcement is wired in backend/auth.
            </p>

            <div className="mt-4 overflow-auto">
              <table className="min-w-[860px] w-full border-collapse">
                <thead>
                  <tr className="text-left text-xs font-black text-zinc-600">
                    <th className="border-b border-black/10 pb-2 pr-3">Permission</th>
                    {(
                      [
                        "Owner/Principal",
                        "Project Manager",
                        "Superintendent",
                        "Office Admin",
                        "Client",
                      ] as const
                    ).map((role) => (
                      <th key={role} className="border-b border-black/10 pb-2 pr-3">
                        {role}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissionKeys.map((k) => (
                    <tr key={k} className="text-sm text-zinc-800">
                      <td className="border-b border-black/5 py-2 pr-3 font-black text-zinc-900">
                        {describePermission(k)}
                      </td>
                      {(
                        [
                          "Owner/Principal",
                          "Project Manager",
                          "Superintendent",
                          "Office Admin",
                          "Client",
                        ] as const
                      ).map((role) => (
                        <td key={role} className="border-b border-black/5 py-2 pr-3">
                          <span className="font-black">{checkboxIcon(permissions[role][k])}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black tracking-tight">Invite flow</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700">
              <li>Email invitation (stubbed; wire to worker email queue)</li>
              <li>Role selection</li>
              <li>Project access assignment</li>
              <li>Welcome email with onboarding (stubbed)</li>
            </ul>
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="mt-4 w-full rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95"
            >
              Invite a teammate
            </button>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-black tracking-tight">Audit log</h2>
              <Pill>{audit.length} events</Pill>
            </div>
            <p className="mt-1 text-sm text-zinc-700">
              Tracks invitations, role/access changes, and login history (demo).
            </p>

            <div className="mt-4 space-y-3">
              {audit.length ? (
                audit.slice(0, 20).map((e) => (
                  <div key={e.id} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                    <div className="text-xs font-bold text-zinc-600">
                      {e.actor} • {formatDateTime(e.at)} •{" "}
                      <span className="font-black text-zinc-700">{e.type}</span>
                    </div>
                    <div className="mt-1 text-sm text-zinc-800">{e.details}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-zinc-700">No audit events yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal open={inviteOpen} title="Invite team member" onClose={() => setInviteOpen(false)}>
        <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-4">
            <label className="text-xs font-black text-zinc-700">
              Email invitation
              <input
                className="mt-2 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </label>
            <label className="text-xs font-black text-zinc-700">
              Name (optional)
              <input
                className="mt-2 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Jane Doe"
              />
            </label>
            <label className="text-xs font-black text-zinc-700">
              Role
              <select
                className="mt-2 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-black text-zinc-900 outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as GCTeamRole)}
              >
                {(
                  [
                    "Owner/Principal",
                    "Project Manager",
                    "Superintendent",
                    "Office Admin",
                    "Client",
                  ] as const
                ).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <div className="text-sm font-black text-zinc-950">Welcome email</div>
              <div className="mt-2 text-sm text-zinc-700">
                A welcome email with onboarding steps will be sent automatically (stubbed).
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <div className="text-sm font-black text-zinc-950">Project access assignment</div>
              <div className="mt-2 text-sm text-zinc-700">
                Choose which projects this person can access.
              </div>
              <div className="mt-3 grid gap-2">
                {projects.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm text-zinc-800">
                    <input
                      type="checkbox"
                      checked={inviteRole === "Owner/Principal" ? true : inviteProjects.includes(p.id)}
                      disabled={inviteRole === "Owner/Principal"}
                      onChange={() => toggleInviteProject(p.id)}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
              {inviteRole === "Owner/Principal" ? (
                <div className="mt-2 text-[11px] text-zinc-500">
                  Owner/Principal gets access to all projects.
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="text-sm font-black text-zinc-950">Permissions preview</div>
              <div className="mt-2 grid gap-1 text-sm text-zinc-800">
                {permissionKeys.map((k) => (
                  <div key={k} className="flex items-center justify-between">
                    <span>{describePermission(k)}</span>
                    <span className="font-black">{checkboxIcon(permissions[inviteRole][k])}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={sendInvite}
                  className="flex-1 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95"
                >
                  Send invite
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInviteOpen(false);
                    resetInvite();
                  }}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-zinc-900 hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </section>
  );
}

