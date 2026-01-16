import { NextResponse } from "next/server";
import { prisma } from "@kealee/database";

export async function GET() {
  try {
    // NOTE: Until auth/org context is wired, we return demo projects.
    // This data is used by the service request wizard (Step 2: project selection).
    const demoOrg = await prisma.org.upsert({
      where: { slug: "demo-gc" },
      update: {},
      create: { name: "Acme Construction LLC", slug: "demo-gc", status: "ACTIVE" },
      select: { id: true, name: true },
    });

    const demoUser = await prisma.user.upsert({
      where: { email: "demo-gc@kealee.local" },
      update: { name: "Demo GC User" },
      create: { email: "demo-gc@kealee.local", name: "Demo GC User", status: "ACTIVE" },
      select: { id: true },
    });

    // Ensure some demo projects exist
    const existing = await prisma.project.findMany({
      where: { orgId: demoOrg.id },
      select: { id: true },
      take: 1,
    });

    if (existing.length === 0) {
      await prisma.project.createMany({
        data: [
          {
            name: "123 Main St Remodel",
            ownerId: demoUser.id,
            orgId: demoOrg.id,
          },
          {
            name: "Oak Ridge Custom Build",
            ownerId: demoUser.id,
            orgId: demoOrg.id,
          },
          {
            name: "Downtown Tenant Improvement",
            ownerId: demoUser.id,
            orgId: demoOrg.id,
          },
        ],
      });
    }

    const projects = await prisma.project.findMany({
      where: { orgId: demoOrg.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    });

    return NextResponse.json({
      ok: true,
      data: projects.map((p) => ({ id: p.id, name: p.name })),
    });
  } catch (e: unknown) {
    // Fallback: still allow UI to function without DB.
    return NextResponse.json({
      ok: true,
      data: [
        { id: "p1", name: "123 Main St Remodel" },
        { id: "p2", name: "Oak Ridge Custom Build" },
        { id: "p3", name: "Downtown Tenant Improvement" },
      ],
      message: e instanceof Error ? e.message : "DB unavailable; returned demo projects",
    });
  }
}

