import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@kealee/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const projectCount = await prisma.project.count();
    const projects = await prisma.project.findMany({
      take: 5,
      select: { id: true, name: true, status: true, address: true }
    });
    
    // Check if there are any users
    const userCount = await prisma.user?.count() ?? 0;
    const users = await prisma.user?.findMany({
      take: 5,
      select: { id: true, email: true }
    }) ?? [];

    return NextResponse.json({
      success: true,
      projectCount,
      projects,
      userCount,
      users,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack }, { status: 200 });
  }
}
