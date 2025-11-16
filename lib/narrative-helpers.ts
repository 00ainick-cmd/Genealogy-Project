import { PrismaClient } from '@prisma/client';
import {
  NarrativeEngineInput,
  NarrativeEngineRelatedPerson,
  NarrativeEngineEvent,
  NarrativeEngineHistoricalContext,
  NarrativeEngineGenerationPrefs,
} from '@/types/narrative-engine.types';

/**
 * Transform database Individual and related data into NarrativeEngineInput format
 */
export async function prepareNarrativeInput(
  prisma: PrismaClient,
  individualId: string,
  generationPrefs?: NarrativeEngineGenerationPrefs
): Promise<NarrativeEngineInput> {
  // Fetch the individual with all related data
  const individual = await prisma.individual.findUnique({
    where: { id: individualId },
    include: {
      project: true,
      events: true,
      familiesAsSpouse: {
        include: {
          husband: true,
          wife: true,
          children: true,
        },
      },
      familiesAsChild: {
        include: {
          husband: true,
          wife: true,
        },
      },
    },
  });

  if (!individual) {
    throw new Error(`Individual with id ${individualId} not found`);
  }

  // Extract related people (spouse, parents, children)
  const relatedPeople: NarrativeEngineRelatedPerson[] = [];

  // Add spouse(s) from families
  for (const family of individual.familiesAsSpouse) {
    const spouse =
      individual.gender === 'M' ? family.wife : family.husband;

    if (spouse) {
      relatedPeople.push({
        id: spouse.id,
        relationship_to_person: 'spouse',
        given_name: spouse.givenName || undefined,
        surname: spouse.surname || undefined,
        marriage_date: family.marriageDate || undefined,
        marriage_place: family.marriagePlace || undefined,
        children_count_estimate: family.children.length || undefined,
      });
    }
  }

  // Add parents from familiesAsChild
  for (const family of individual.familiesAsChild) {
    if (family.husband) {
      relatedPeople.push({
        id: family.husband.id,
        relationship_to_person: 'parent',
        given_name: family.husband.givenName || undefined,
        surname: family.husband.surname || undefined,
      });
    }

    if (family.wife) {
      relatedPeople.push({
        id: family.wife.id,
        relationship_to_person: 'parent',
        given_name: family.wife.givenName || undefined,
        surname: family.wife.surname || undefined,
      });
    }
  }

  // Transform events
  const events: NarrativeEngineEvent[] = individual.events.map((event) => ({
    id: event.id,
    type: event.type,
    person_id: event.individualId,
    date: event.date || undefined,
    place: event.place || undefined,
    description: event.description || undefined,
  }));

  // Add birth event if not already in events
  if (individual.birthDate && !events.some((e) => e.type === 'birth')) {
    events.push({
      id: `birth_${individual.id}`,
      type: 'birth',
      person_id: individual.id,
      date: individual.birthDate,
      place: individual.birthPlace || undefined,
    });
  }

  // Add death event if not already in events
  if (individual.deathDate && !events.some((e) => e.type === 'death')) {
    events.push({
      id: `death_${individual.id}`,
      type: 'death',
      person_id: individual.id,
      date: individual.deathDate,
      place: individual.deathPlace || undefined,
    });
  }

  // Add marriage events
  for (const family of individual.familiesAsSpouse) {
    if (family.marriageDate) {
      const spouse =
        individual.gender === 'M' ? family.wife : family.husband;

      events.push({
        id: `marriage_${family.id}`,
        type: 'marriage',
        person_id: individual.id,
        other_person_id: spouse?.id,
        date: family.marriageDate,
        place: family.marriagePlace || undefined,
      });
    }
  }

  // Get historical context (you'll implement this later based on dates and places)
  const historicalContext = await getHistoricalContext(
    individual.birthDate,
    individual.deathDate,
    individual.birthPlace
  );

  // Calculate date range from project stats if available
  let projectDateRange;
  if (individual.project.stats) {
    const stats = individual.project.stats as any;
    if (stats.dateRange) {
      projectDateRange = {
        start_year: stats.dateRange.earliest
          ? parseInt(stats.dateRange.earliest.substring(0, 4))
          : undefined,
        end_year: stats.dateRange.latest
          ? parseInt(stats.dateRange.latest.substring(0, 4))
          : undefined,
      };
    }
  }

  // Build the input object
  const input: NarrativeEngineInput = {
    project: {
      id: individual.project.id,
      title: individual.project.name,
      date_range: projectDateRange,
      primary_region: individual.birthPlace || undefined,
    },
    person: {
      id: individual.id,
      given_name: individual.givenName || undefined,
      surname: individual.surname || undefined,
      gender: individual.gender || undefined,
      birth_date: individual.birthDate || undefined,
      birth_place: individual.birthPlace || undefined,
      death_date: individual.deathDate || undefined,
      death_place: individual.deathPlace || undefined,
      occupation: individual.occupation || undefined,
      notes: individual.notes || undefined,
    },
    related_people: relatedPeople.length > 0 ? relatedPeople : undefined,
    events: events.length > 0 ? events : undefined,
    historical_context:
      historicalContext.length > 0 ? historicalContext : undefined,
    generation_prefs: generationPrefs || {
      max_words: 700,
      detail_level: 'medium',
      include_spouse: true,
    },
  };

  return input;
}

/**
 * Get historical context based on dates and location
 * This is a placeholder - you can enhance this with a proper historical context database
 */
async function getHistoricalContext(
  birthDate?: string | null,
  deathDate?: string | null,
  birthPlace?: string | null
): Promise<NarrativeEngineHistoricalContext[]> {
  const context: NarrativeEngineHistoricalContext[] = [];

  if (!birthDate && !deathDate) {
    return context;
  }

  // Extract years
  const birthYear = birthDate ? parseInt(birthDate.substring(0, 4)) : null;
  const deathYear = deathDate ? parseInt(deathDate.substring(0, 4)) : null;

  // Determine region from birthPlace
  const region = birthPlace?.toLowerCase() || '';

  // Add relevant historical context based on time period and location
  // These are examples - you can expand this with a proper database

  // U.S. Civil War (1861-1865)
  if (
    birthYear &&
    deathYear &&
    birthYear <= 1865 &&
    deathYear >= 1861 &&
    (region.includes('usa') ||
      region.includes('united states') ||
      region.includes('ohio') ||
      region.includes('pennsylvania'))
  ) {
    context.push({
      region_key: 'us_civil_war',
      start_year: 1861,
      end_year: 1865,
      summary:
        'The American Civil War (1861-1865) deeply affected states like Ohio and Pennsylvania, which supplied many soldiers to the Union. The war brought economic changes, mobilization of local communities, and the end of slavery. Many families experienced the absence of men who served, while farms and businesses adapted to wartime demands.',
    });
  }

  // Great Depression (1929-1939)
  if (birthYear && deathYear && birthYear <= 1939 && deathYear >= 1929) {
    context.push({
      region_key: 'great_depression',
      start_year: 1929,
      end_year: 1939,
      summary:
        'The Great Depression (1929-1939) brought widespread economic hardship across the United States. Farmers faced falling crop prices and foreclosures, while urban workers struggled with unemployment rates reaching 25%. Communities rallied together, and government programs like the New Deal provided some relief through public works and social programs.',
    });
  }

  // Industrial Revolution in America (1870-1920)
  if (birthYear && deathYear && birthYear <= 1920 && deathYear >= 1870) {
    context.push({
      region_key: 'industrial_revolution',
      start_year: 1870,
      end_year: 1920,
      summary:
        'The Industrial Revolution transformed American life from 1870 to 1920. Rural communities saw young people migrate to cities for factory work. Railroads connected previously isolated regions, enabling new markets for farmers. Agricultural mechanization changed farming practices, while small-town life began to shift with the arrival of modern conveniences like electricity and automobiles.',
    });
  }

  // Westward Expansion (1800-1890)
  if (
    birthYear &&
    deathYear &&
    birthYear <= 1890 &&
    deathYear >= 1800 &&
    (region.includes('ohio') ||
      region.includes('indiana') ||
      region.includes('illinois') ||
      region.includes('iowa'))
  ) {
    context.push({
      region_key: 'westward_expansion',
      start_year: 1800,
      end_year: 1890,
      summary:
        'During the 1800s, states like Ohio transitioned from frontier territories to settled agricultural communities. Families cleared land, established farms, and built towns. The journey often began in eastern states like Pennsylvania, with settlers seeking affordable land and new opportunities. Life was characterized by hard physical labor, close-knit communities, and gradual improvements in infrastructure like roads and schools.',
    });
  }

  // World War I (1914-1918)
  if (birthYear && deathYear && birthYear <= 1918 && deathYear >= 1914) {
    context.push({
      region_key: 'world_war_i',
      start_year: 1914,
      end_year: 1918,
      summary:
        'World War I (1914-1918) brought American communities into a global conflict. Young men enlisted or were drafted, farms increased production to support the war effort, and families at home dealt with rationing and uncertainty. The war accelerated social changes, including women entering the workforce in greater numbers and the beginning of the Great Migration.',
    });
  }

  // World War II (1939-1945)
  if (birthYear && deathYear && birthYear <= 1945 && deathYear >= 1939) {
    context.push({
      region_key: 'world_war_ii',
      start_year: 1939,
      end_year: 1945,
      summary:
        'World War II (1939-1945) mobilized American society on an unprecedented scale. Millions of men and women served in the military, while those at home contributed through war production, rationing, and Victory Gardens. The war brought economic recovery from the Depression, transformed gender roles, and positioned the United States as a global superpower.',
    });
  }

  return context;
}

/**
 * Extract year from date string (handles various formats)
 */
function extractYear(dateStr?: string | null): number | null {
  if (!dateStr) return null;

  // Try to extract a 4-digit year
  const yearMatch = dateStr.match(/\b(1\d{3}|20\d{2})\b/);
  if (yearMatch) {
    return parseInt(yearMatch[1]);
  }

  return null;
}
