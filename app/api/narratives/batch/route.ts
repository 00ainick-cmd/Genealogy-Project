import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateNarrative, isAIGenerationEnabled } from '@/lib/narrative-engine';
import { prepareNarrativeInput } from '@/lib/narrative-helpers';
import { NarrativeEngineGenerationPrefs } from '@/types/narrative-engine.types';

/**
 * POST /api/narratives/batch
 *
 * Generate narratives for multiple individuals in a project
 *
 * Request body:
 * {
 *   "projectId": "string",
 *   "individualIds": ["id1", "id2", ...] (optional - if not provided, generates for all individuals),
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
 *   "total": number,
 *   "succeeded": number,
 *   "failed": number,
 *   "results": [
 *     {
 *       "individualId": "string",
 *       "success": boolean,
 *       "narrative": NarrativeEngineOutput | null,
 *       "error": string | null
 *     }
 *   ]
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
    const { projectId, individualIds, generationPrefs } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Verify the project exists and belongs to the user
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        individuals: {
          select: { id: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to access this project' },
        { status: 403 }
      );
    }

    // Determine which individuals to generate narratives for
    let targetIndividualIds: string[];
    if (individualIds && Array.isArray(individualIds)) {
      // Validate that all provided IDs belong to the project
      const projectIndividualIds = project.individuals.map((i) => i.id);
      targetIndividualIds = individualIds.filter((id) =>
        projectIndividualIds.includes(id)
      );

      if (targetIndividualIds.length !== individualIds.length) {
        return NextResponse.json(
          {
            error:
              'Some individual IDs do not belong to the specified project',
          },
          { status: 400 }
        );
      }
    } else {
      // Generate for all individuals in the project
      targetIndividualIds = project.individuals.map((i) => i.id);
    }

    // Generate narratives for each individual
    const results = [];
    let succeeded = 0;
    let failed = 0;

    for (const individualId of targetIndividualIds) {
      try {
        // Prepare the narrative input
        const narrativeInput = await prepareNarrativeInput(
          prisma,
          individualId,
          generationPrefs
        );

        // Generate the narrative
        const narrativeOutput = await generateNarrative(narrativeInput);

        // Save to database
        await prisma.narrative.upsert({
          where: { individualId },
          create: {
            individualId,
            projectId,
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
          },
        });

        results.push({
          individualId,
          success: true,
          narrative: narrativeOutput,
          error: null,
        });
        succeeded++;
      } catch (error) {
        console.error(
          `Error generating narrative for individual ${individualId}:`,
          error
        );

        results.push({
          individualId,
          success: false,
          narrative: null,
          error:
            error instanceof Error ? error.message : 'Unknown error occurred',
        });
        failed++;
      }

      // Add a small delay between API calls to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      success: true,
      total: targetIndividualIds.length,
      succeeded,
      failed,
      results,
    });
  } catch (error) {
    console.error('Error in batch narrative generation:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        error: 'Failed to generate narratives',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
