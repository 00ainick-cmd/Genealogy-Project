import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateNarrative, isAIGenerationEnabled } from '@/lib/narrative-engine';
import { prepareNarrativeInput } from '@/lib/narrative-helpers';
import { NarrativeEngineGenerationPrefs } from '@/types/narrative-engine.types';

/**
 * POST /api/narratives/generate
 *
 * Generate a narrative for an individual using AI
 *
 * Request body:
 * {
 *   "individualId": "string",
 *   "generationPrefs": {
 *     "max_words": number (optional),
 *     "detail_level": "short" | "medium" | "long" (optional),
 *     "include_spouse": boolean (optional)
 *   }
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "narrative": NarrativeEngineOutput,
 *   "savedToDatabase": boolean
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Check if AI generation is enabled
    if (!isAIGenerationEnabled()) {
      return NextResponse.json(
        {
          error:
            'AI generation is not enabled. Please configure ANTHROPIC_API_KEY and set ENABLE_AI_GENERATION=true in your environment.',
        },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { individualId, generationPrefs, saveToDatabase = true } = body;

    if (!individualId) {
      return NextResponse.json(
        { error: 'individualId is required' },
        { status: 400 }
      );
    }

    // Verify the individual exists and belongs to a project owned by the user
    const individual = await prisma.individual.findUnique({
      where: { id: individualId },
      include: { project: true },
    });

    if (!individual) {
      return NextResponse.json(
        { error: 'Individual not found' },
        { status: 404 }
      );
    }

    if (individual.project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to generate a narrative for this individual' },
        { status: 403 }
      );
    }

    // Prepare the narrative input from database data
    const narrativeInput = await prepareNarrativeInput(
      prisma,
      individualId,
      generationPrefs
    );

    // Generate the narrative using Claude
    const narrativeOutput = await generateNarrative(narrativeInput);

    // Save to database if requested
    let savedToDatabase = false;
    if (saveToDatabase) {
      await prisma.narrative.upsert({
        where: { individualId },
        create: {
          individualId,
          projectId: individual.projectId,
          title: narrativeOutput.title,
          content: {
            episode_id: narrativeOutput.episode_id,
            summary: narrativeOutput.summary,
            time_span: narrativeOutput.time_span,
            primary_locations: narrativeOutput.primary_locations,
            main_people: narrativeOutput.main_people,
            sections: narrativeOutput.sections,
            sources_used: narrativeOutput.sources_used,
            word_count_approx: narrativeOutput.word_count_approx,
          },
          isGenerated: true,
          generatedAt: new Date(),
        },
        update: {
          title: narrativeOutput.title,
          content: {
            episode_id: narrativeOutput.episode_id,
            summary: narrativeOutput.summary,
            time_span: narrativeOutput.time_span,
            primary_locations: narrativeOutput.primary_locations,
            main_people: narrativeOutput.main_people,
            sections: narrativeOutput.sections,
            sources_used: narrativeOutput.sources_used,
            word_count_approx: narrativeOutput.word_count_approx,
          },
          isGenerated: true,
          generatedAt: new Date(),
          // Keep isEdited flag if it was previously edited
        },
      });
      savedToDatabase = true;
    }

    return NextResponse.json({
      success: true,
      narrative: narrativeOutput,
      savedToDatabase,
    });
  } catch (error) {
    console.error('Error generating narrative:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        error: 'Failed to generate narrative',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
