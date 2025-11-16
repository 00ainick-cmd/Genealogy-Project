/**
 * Test script for narrative generation
 *
 * Usage:
 * 1. First seed test data: npm run seed
 * 2. Then run this script with an individual ID: npm run test-narrative <individualId>
 */

import { PrismaClient } from '@prisma/client';
import { generateNarrative, isAIGenerationEnabled } from '../lib/narrative-engine';
import { prepareNarrativeInput } from '../lib/narrative-helpers';

const prisma = new PrismaClient();

async function testNarrative() {
  try {
    // Check if AI generation is enabled
    if (!isAIGenerationEnabled()) {
      console.error('❌ AI generation is not enabled!');
      console.log('\nPlease set in your .env file:');
      console.log('  ANTHROPIC_API_KEY="your-api-key"');
      console.log('  ENABLE_AI_GENERATION=true');
      process.exit(1);
    }

    // Get individual ID from command line args
    const individualId = process.argv[2];

    if (!individualId) {
      console.error('❌ Please provide an individual ID');
      console.log('\nUsage: npm run test-narrative <individualId>');
      console.log('\nTo get an individual ID, first run: npm run seed');
      process.exit(1);
    }

    console.log('🔍 Fetching individual data...');

    // Check if individual exists
    const individual = await prisma.individual.findUnique({
      where: { id: individualId },
      include: { project: true },
    });

    if (!individual) {
      console.error(`❌ Individual with ID ${individualId} not found`);
      process.exit(1);
    }

    console.log(`✅ Found: ${individual.fullName || 'Unknown'}`);
    console.log(`   Born: ${individual.birthDate || 'Unknown'}`);
    console.log(`   Died: ${individual.deathDate || 'Unknown'}`);
    console.log('');

    console.log('📝 Preparing narrative input...');
    const narrativeInput = await prepareNarrativeInput(prisma, individualId, {
      detail_level: 'medium',
      max_words: 700,
      include_spouse: true,
    });

    console.log('✅ Input prepared');
    console.log(`   Events: ${narrativeInput.events?.length || 0}`);
    console.log(`   Related people: ${narrativeInput.related_people?.length || 0}`);
    console.log(`   Historical contexts: ${narrativeInput.historical_context?.length || 0}`);
    console.log('');

    console.log('🤖 Generating narrative with Claude AI...');
    console.log('   (This may take 10-30 seconds)');
    console.log('');

    const startTime = Date.now();
    const narrativeOutput = await generateNarrative(narrativeInput);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('✅ Narrative generated successfully!');
    console.log(`   Time: ${duration}s`);
    console.log('');

    // Display the narrative
    console.log('═'.repeat(70));
    console.log('📖 GENERATED NARRATIVE');
    console.log('═'.repeat(70));
    console.log('');
    console.log(`Title: ${narrativeOutput.title}`);
    console.log(`Episode ID: ${narrativeOutput.episode_id}`);
    console.log(`Time Span: ${narrativeOutput.time_span.start_year || '?'} - ${narrativeOutput.time_span.end_year || '?'}`);
    console.log(`Word Count: ~${narrativeOutput.word_count_approx} words`);
    console.log('');
    console.log('─'.repeat(70));
    console.log('SUMMARY');
    console.log('─'.repeat(70));
    console.log(narrativeOutput.summary);
    console.log('');
    console.log('─'.repeat(70));
    console.log('EARLY LIFE');
    console.log('─'.repeat(70));
    console.log(narrativeOutput.sections.early_life);
    console.log('');
    console.log('─'.repeat(70));
    console.log('WORK AND DAILY LIFE');
    console.log('─'.repeat(70));
    console.log(narrativeOutput.sections.work_and_daily_life);
    console.log('');
    console.log('─'.repeat(70));
    console.log('FAMILY AND HOME');
    console.log('─'.repeat(70));
    console.log(narrativeOutput.sections.family_and_home);
    console.log('');
    console.log('─'.repeat(70));
    console.log('HISTORICAL CONTEXT');
    console.log('─'.repeat(70));
    console.log(narrativeOutput.sections.historical_context);
    console.log('');
    console.log('─'.repeat(70));
    console.log('SOURCES USED');
    console.log('─'.repeat(70));
    narrativeOutput.sources_used.forEach((source, i) => {
      console.log(`${i + 1}. ${source}`);
    });
    console.log('');
    console.log('═'.repeat(70));

    // Save to database
    console.log('');
    console.log('💾 Saving to database...');

    await prisma.narrative.upsert({
      where: { individualId },
      create: {
        individualId,
        projectId: individual.projectId,
        title: narrativeOutput.title,
        content: narrativeOutput,
        isGenerated: true,
        generatedAt: new Date(),
      },
      update: {
        title: narrativeOutput.title,
        content: narrativeOutput,
        isGenerated: true,
        generatedAt: new Date(),
      },
    });

    console.log('✅ Narrative saved to database!');
    console.log('');
    console.log('🎉 Test completed successfully!');

  } catch (error) {
    console.error('');
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testNarrative();
