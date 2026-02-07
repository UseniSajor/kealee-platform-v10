import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/development-projects/[id]/documents - List documents for project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;
    const searchParams = request.nextUrl.searchParams;

    // Verify project exists
    const project = await prisma.developmentProject.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Optional filters
    const category = searchParams.get("category");
    const clientVisible = searchParams.get("clientVisible");

    const where: any = { projectId };
    if (category) where.category = category;
    if (clientVisible !== null && clientVisible !== undefined) {
      where.isClientVisible = clientVisible === "true";
    }

    const documents = await prisma.devDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Group by category for summary
    const byCategory = documents.reduce(
      (acc: Record<string, number>, doc) => {
        acc[doc.category] = (acc[doc.category] || 0) + 1;
        return acc;
      },
      {}
    );

    return NextResponse.json({
      documents,
      summary: {
        total: documents.length,
        byCategory,
        totalSizeMB: documents
          .filter((d) => d.fileSizeMB)
          .reduce((sum, d) => sum + Number(d.fileSizeMB), 0),
      },
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// POST /api/development-projects/[id]/documents - Create document record
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;
    const body = await request.json();

    // Verify project exists
    const project = await prisma.developmentProject.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (!body.name || !body.category || !body.fileUrl || !body.fileType || !body.uploadedBy) {
      return NextResponse.json(
        { error: "Missing required fields: name, category, fileUrl, fileType, uploadedBy" },
        { status: 400 }
      );
    }

    const document = await prisma.devDocument.create({
      data: {
        projectId,
        name: body.name,
        category: body.category,
        fileUrl: body.fileUrl,
        fileType: body.fileType,
        fileSizeMB: body.fileSizeMB,
        version: body.version || 1,
        description: body.description,
        uploadedBy: body.uploadedBy,
        isClientVisible: body.isClientVisible || false,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}

// DELETE /api/development-projects/[id]/documents - Remove document (requires documentId in query or body)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "Missing required query parameter: documentId" },
        { status: 400 }
      );
    }

    // Verify document belongs to project
    const existing = await prisma.devDocument.findFirst({
      where: { id: documentId, projectId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Document not found for this project" },
        { status: 404 }
      );
    }

    await prisma.devDocument.delete({
      where: { id: documentId },
    });

    return NextResponse.json({
      message: "Document deleted successfully",
      deletedId: documentId,
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
