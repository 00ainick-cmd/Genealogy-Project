/**
 * GEDCOM Import API Endpoint
 *
 * POST /api/projects/[projectId]/import-gedcom
 *
 * Uploads and imports a GEDCOM file into a project.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { importGedcomFile } from '@/lib/gedcom';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10) * 1024 * 1024; // Default 20MB

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId } = params;

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.ged')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only .ged files are accepted' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || '20'}MB` },
        { status: 400 }
      );
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Import the GEDCOM file
    const result = await importGedcomFile(
      projectId,
      arrayBuffer,
      (progress, message) => {
        // In a production app, this could send progress updates via WebSocket or Server-Sent Events
        console.log(`Import progress: ${progress}% - ${message}`);
      }
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Import failed',
          details: result.errors,
        },
        { status: 500 }
      );
    }

    // Update project with GEDCOM filename
    await prisma.project.update({
      where: { id: projectId },
      data: { gedcomFile: file.name },
    });

    return NextResponse.json({
      success: true,
      message: 'GEDCOM file imported successfully',
      stats: result.stats,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error('Error in GEDCOM import endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
