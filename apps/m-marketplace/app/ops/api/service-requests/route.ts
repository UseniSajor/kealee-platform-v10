import { NextResponse } from "next/server";
import { prisma } from "@kealee/database";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function GET() {
  try {
    const demoOrg = await prisma.org.upsert({
      where: { slug: "demo-gc" },
      update: {},
      create: { name: "Acme Construction LLC", slug: "demo-gc", status: "ACTIVE" },
      select: { id: true },
    });

    const requests = await prisma.serviceRequest.findMany({
      where: { orgId: demoOrg.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        status: true,
        category: true,
        createdAt: true,
        metadata: true,
      },
    });

    return NextResponse.json({
      ok: true,
      data: requests.map((r) => {
        const meta = asRecord(r.metadata);
        const assignedPm = asRecord(meta.assignedPm);
        return {
          id: r.id,
          title: r.title,
          description: r.description,
          priority: r.priority === "urgent" ? "Urgent" : "Normal",
          status:
            r.status === "assigned"
              ? "Assigned"
              : r.status === "in_progress"
                ? "In Progress"
                : r.status === "completed"
                  ? "Completed"
                  : "Submitted",
          category: r.category,
          createdAt: r.createdAt.toISOString(),
          projectId: typeof meta.projectId === "string" ? meta.projectId : null,
          projectName: typeof meta.projectName === "string" ? meta.projectName : null,
          assignedPm:
            Object.keys(assignedPm).length > 0
              ? {
                  name: typeof assignedPm.name === "string" ? assignedPm.name : "Assigned PM",
                  email: typeof assignedPm.email === "string" ? assignedPm.email : undefined,
                }
              : null,
          timeSpentMinutes:
            typeof meta.timeSpentMinutes === "number" ? meta.timeSpentMinutes : 0,
          attachments: asArray(meta.attachments),
          thread: asArray(meta.thread),
          satisfaction: typeof meta.satisfaction === "number" ? meta.satisfaction : null,
        };
      }),
    });
  } catch (e: unknown) {
    return NextResponse.json({
      ok: true,
      data: [],
      message: e instanceof Error ? e.message : "DB unavailable",
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      category: string;
      priority: "Urgent" | "Normal";
      projectId?: string;
      title: string;
      description?: string;
      attachments?: Array<{ name: string; size: number; type: string }>;
      packageName?: string;
    };

    const demoOrg = await prisma.org.upsert({
      where: { slug: "demo-gc" },
      update: {},
      create: { name: "Acme Construction LLC", slug: "demo-gc", status: "ACTIVE" },
      select: { id: true, name: true },
    });

    const project = body.projectId
      ? await prisma.project.findUnique({
          where: { id: body.projectId },
          select: { id: true, name: true },
        })
      : null;

    const created = await prisma.serviceRequest.create({
      data: {
        orgId: demoOrg.id,
        title: body.title,
        description: body.description || "",
        priority: body.priority === "Urgent" ? "urgent" : "normal",
        status: "submitted",
        category: body.category,
        metadata: {
          packageName: body.packageName || "Package B",
          projectId: project?.id ?? body.projectId ?? null,
          projectName: project?.name ?? null,
          assignedPm: null,
          timeSpentMinutes: 0,
          attachments: body.attachments || [],
          thread: [
            {
              id: "m1",
              at: new Date().toISOString(),
              from: "System",
              message:
                "Request submitted. A Kealee PM will be assigned shortly.",
            },
          ],
          satisfaction: null,
        },
      },
      select: { id: true, createdAt: true },
    });

    // Integration with os-pm (MVP): create a linked Task record for Kealee PMs.
    // In later stages, os-pm can pull Tasks and update status/time spent.
    await prisma.task.create({
      data: {
        serviceRequestId: created.id,
        pmId: "unassigned",
        title: `[GC] ${body.title}`,
        description: body.description || "",
        status: "pending",
        priority: body.priority === "Urgent" ? "urgent" : "medium",
      },
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          id: created.id,
          title: body.title,
          description: body.description || "",
          priority: body.priority,
          status: "Submitted",
          category: body.category,
          createdAt: created.createdAt.toISOString(),
          projectId: project?.id ?? body.projectId ?? null,
          projectName: project?.name ?? null,
          assignedPm: null,
          timeSpentMinutes: 0,
          attachments: body.attachments || [],
        },
      },
      { status: 201 }
    );
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Failed to create request" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as
      | { action: "addMessage"; requestId: string; message: string }
      | { action: "setStatus"; requestId: string; status: "Submitted" | "Assigned" | "In Progress" | "Completed" }
      | { action: "setTimeSpent"; requestId: string; minutes: number }
      | { action: "setSatisfaction"; requestId: string; rating: number };

    const existing = await prisma.serviceRequest.findUnique({
      where: { id: body.requestId },
      select: { id: true, metadata: true },
    });
    if (!existing) {
      return NextResponse.json({ ok: false, message: "Request not found" }, { status: 404 });
    }

    const meta = asRecord(existing.metadata);

    if (body.action === "addMessage") {
      const thread = asArray<Record<string, unknown>>(meta.thread);
      thread.unshift({
        id: `m_${Date.now()}`,
        at: new Date().toISOString(),
        from: "GC",
        message: body.message,
      });
      await prisma.serviceRequest.update({
        where: { id: body.requestId },
        data: { metadata: { ...meta, thread } },
      });
    }

    if (body.action === "setTimeSpent") {
      await prisma.serviceRequest.update({
        where: { id: body.requestId },
        data: { metadata: { ...meta, timeSpentMinutes: Math.max(0, body.minutes) } },
      });
    }

    if (body.action === "setSatisfaction") {
      const rating = Math.max(1, Math.min(5, body.rating));
      await prisma.serviceRequest.update({
        where: { id: body.requestId },
        data: { metadata: { ...meta, satisfaction: rating } },
      });
    }

    if (body.action === "setStatus") {
      const status =
        body.status === "Assigned"
          ? "assigned"
          : body.status === "In Progress"
            ? "in_progress"
            : body.status === "Completed"
              ? "completed"
              : "submitted";
      await prisma.serviceRequest.update({
        where: { id: body.requestId },
        data: { status },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Failed to update request" },
      { status: 500 }
    );
  }
}

