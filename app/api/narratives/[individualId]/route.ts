import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/narratives/[individualId]
 *
 * Retrieve the narrative for a specific individual
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { individualId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { individualId } = params;

    // Fetch the narrative
    const narrative = await prisma.narrative.findUnique({
      where: { individualId },
      include: {
        individual: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!narrative) {
      return NextResponse.json(
        { error: 'Narrative not found' },
        { status: 404 }
      );
    }

    // Check if the user owns the project
    if (narrative.individual.project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to view this narrative' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      narrative: {
        id: narrative.id,
        individualId: narrative.individualId,
        projectId: narrative.projectId,
        title: narrative.title,
        content: narrative.content,
        isEdited: narrative.isEdited,
        isGenerated: narrative.isGenerated,
        generatedAt: narrative.generatedAt,
        createdAt: narrative.createdAt,
        updatedAt: narrative.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching narrative:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        error: 'Failed to fetch narrative',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/narratives/[individualId]
 *
 * Update an existing narrative (for user edits)
 *
 * Request body:
 * {
 *   "title": "string",
 *   "content": NarrativeEngineOutput
 * }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { individualId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { individualId } = params;
    const body = await req.json();
    const { title, content } = body;

    // Fetch the narrative to check permissions
    const existingNarrative = await prisma.narrative.findUnique({
      where: { individualId },
      include: {
        individual: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!existingNarrative) {
      return NextResponse.json(
        { error: 'Narrative not found' },
        { status: 404 }
      );
    }

    // Check if the user owns the project
    if (existingNarrative.individual.project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this narrative' },
        { status: 403 }
      );
    }

    // Update the narrative and mark it as edited
    const updatedNarrative = await prisma.narrative.update({
      where: { individualId },
      data: {
        title: title || existingNarrative.title,
        content: content || existingNarrative.content,
        isEdited: true,
      },
    });

    return NextResponse.json({
      success: true,
      narrative: {
        id: updatedNarrative.id,
        individualId: updatedNarrative.individualId,
        projectId: updatedNarrative.projectId,
        title: updatedNarrative.title,
        content: updatedNarrative.content,
        isEdited: updatedNarrative.isEdited,
        isGenerated: updatedNarrative.isGenerated,
        generatedAt: updatedNarrative.generatedAt,
        updatedAt: updatedNarrative.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating narrative:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        error: 'Failed to update narrative',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/narratives/[individualId]
 *
 * Delete a narrative
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { individualId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { individualId } = params;

    // Fetch the narrative to check permissions
    const narrative = await prisma.narrative.findUnique({
      where: { individualId },
      include: {
        individual: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!narrative) {
      return NextResponse.json(
        { error: 'Narrative not found' },
        { status: 404 }
      );
    }

    // Check if the user owns the project
    if (narrative.individual.project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this narrative' },
        { status: 403 }
      );
    }

    // Delete the narrative
    await prisma.narrative.delete({
      where: { individualId },
    });

    return NextResponse.json({
      success: true,
      message: 'Narrative deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting narrative:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        error: 'Failed to delete narrative',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
