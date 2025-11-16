/**
 * GEDCOM Parser Service
 *
 * Parses GEDCOM files using the read-gedcom library and extracts
 * individuals, families, events, and relationships into our data model.
 */

import { readGedcom } from 'read-gedcom';
import type {
  ParsedIndividual,
  ParsedFamily,
  ParsedEvent,
  ParsedRelationship,
  GedcomParseResult,
  GedcomParserOptions,
  GedcomParseError,
} from './types';

/**
 * Parse a GEDCOM file from a buffer
 */
export async function parseGedcomFile(
  buffer: ArrayBuffer,
  options: GedcomParserOptions = {}
): Promise<GedcomParseResult> {
  try {
    const { onProgress, maxIndividuals } = options;

    onProgress?.(0, 'Reading GEDCOM file...');

    // Parse the GEDCOM file using read-gedcom
    const gedcom = await readGedcom(buffer);

    onProgress?.(10, 'Extracting individuals...');

    // Extract individuals
    const individuals: ParsedIndividual[] = [];
    const individualRecords = gedcom.getIndividualRecord();

    let processedCount = 0;
    for (const individual of individualRecords) {
      if (maxIndividuals && processedCount >= maxIndividuals) {
        break;
      }

      const parsedIndividual = parseIndividual(individual);
      if (parsedIndividual) {
        individuals.push(parsedIndividual);
      }

      processedCount++;
      if (processedCount % 100 === 0) {
        const progress = 10 + (processedCount / individualRecords.length) * 30;
        onProgress?.(progress, `Processed ${processedCount} individuals...`);
      }
    }

    onProgress?.(40, 'Extracting families...');

    // Extract families
    const families: ParsedFamily[] = [];
    const familyRecords = gedcom.getFamilyRecord();

    for (const family of familyRecords) {
      const parsedFamily = parseFamily(family);
      if (parsedFamily) {
        families.push(parsedFamily);
      }
    }

    onProgress?.(60, 'Extracting events...');

    // Extract events from individuals
    const events: ParsedEvent[] = [];
    for (const individual of individualRecords) {
      const individualEvents = parseEvents(individual);
      events.push(...individualEvents);
    }

    onProgress?.(80, 'Building relationships...');

    // Build explicit parent-child relationships
    const relationships = buildRelationships(families);

    onProgress?.(90, 'Computing statistics...');

    // Compute statistics
    const stats = computeStats(individuals, families, events);

    onProgress?.(100, 'Parse complete!');

    return {
      individuals,
      families,
      events,
      relationships,
      stats,
    };
  } catch (error) {
    throw new Error(`Failed to parse GEDCOM file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse an individual record from GEDCOM
 */
function parseIndividual(individual: any): ParsedIndividual | null {
  try {
    const gedcomId = individual.pointer?.toString() || '';
    if (!gedcomId) return null;

    // Extract name
    const nameNode = individual.getName()?.[0];
    const givenName = nameNode?.getGiven()?.value()?.[0] || null;
    const surname = nameNode?.getSurname()?.value()?.[0] || null;
    const fullName = nameNode?.value()?.[0] || null;

    // Extract gender
    const gender = individual.getSex()?.value()?.[0] || null;

    // Extract birth information
    const birthNode = individual.getBirth()?.[0];
    const birthDate = birthNode?.getDate()?.value()?.[0] || null;
    const birthPlace = birthNode?.getPlace()?.value()?.[0] || null;

    // Extract death information
    const deathNode = individual.getDeath()?.[0];
    const deathDate = deathNode?.getDate()?.value()?.[0] || null;
    const deathPlace = deathNode?.getPlace()?.value()?.[0] || null;

    // Extract occupation
    const occupation = individual.getOccupation()?.value()?.[0] || null;

    // Extract notes
    const noteNodes = individual.getNote();
    const notes = noteNodes
      ?.map((n: any) => n.value()?.[0])
      .filter(Boolean)
      .join('\n') || null;

    // Extract other facts as JSON
    const otherFacts: Record<string, unknown> = {};

    // Store any additional tags that we might want later
    const residence = individual.getResidence()?.[0];
    if (residence) {
      otherFacts.residence = {
        date: residence.getDate()?.value()?.[0],
        place: residence.getPlace()?.value()?.[0],
      };
    }

    return {
      gedcomId,
      givenName,
      surname,
      fullName,
      gender,
      birthDate,
      birthPlace,
      deathDate,
      deathPlace,
      occupation,
      notes,
      photoUrl: null, // Will be populated from user uploads later
      otherFacts,
    };
  } catch (error) {
    console.error('Error parsing individual:', error);
    return null;
  }
}

/**
 * Parse a family record from GEDCOM
 */
function parseFamily(family: any): ParsedFamily | null {
  try {
    const gedcomId = family.pointer?.toString() || '';
    if (!gedcomId) return null;

    // Extract husband and wife
    const husbandNode = family.getHusband()?.[0];
    const wifeNode = family.getWife()?.[0];

    const husbandGedcomId = husbandNode?.value()?.[0] || null;
    const wifeGedcomId = wifeNode?.value()?.[0] || null;

    // Extract children
    const childNodes = family.getChild();
    const childrenGedcomIds = childNodes
      ?.map((c: any) => c.value()?.[0])
      .filter(Boolean) || [];

    // Extract marriage information
    const marriageNode = family.getMarriage()?.[0];
    const marriageDate = marriageNode?.getDate()?.value()?.[0] || null;
    const marriagePlace = marriageNode?.getPlace()?.value()?.[0] || null;

    return {
      gedcomId,
      husbandGedcomId,
      wifeGedcomId,
      childrenGedcomIds,
      marriageDate,
      marriagePlace,
    };
  } catch (error) {
    console.error('Error parsing family:', error);
    return null;
  }
}

/**
 * Parse events from an individual record
 */
function parseEvents(individual: any): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  const gedcomId = individual.pointer?.toString() || '';
  if (!gedcomId) return events;

  try {
    // Birth event
    const birthNode = individual.getBirth()?.[0];
    if (birthNode) {
      events.push({
        individualGedcomId: gedcomId,
        type: 'birth',
        date: birthNode.getDate()?.value()?.[0] || null,
        place: birthNode.getPlace()?.value()?.[0] || null,
        description: null,
        latitude: null,
        longitude: null,
      });
    }

    // Death event
    const deathNode = individual.getDeath()?.[0];
    if (deathNode) {
      events.push({
        individualGedcomId: gedcomId,
        type: 'death',
        date: deathNode.getDate()?.value()?.[0] || null,
        place: deathNode.getPlace()?.value()?.[0] || null,
        description: null,
        latitude: null,
        longitude: null,
      });
    }

    // Residence events
    const residenceNodes = individual.getResidence();
    residenceNodes?.forEach((residence: any) => {
      events.push({
        individualGedcomId: gedcomId,
        type: 'residence',
        date: residence.getDate()?.value()?.[0] || null,
        place: residence.getPlace()?.value()?.[0] || null,
        description: null,
        latitude: null,
        longitude: null,
      });
    });

    // Occupation events
    const occupationNodes = individual.getOccupation();
    occupationNodes?.forEach((occupation: any) => {
      events.push({
        individualGedcomId: gedcomId,
        type: 'occupation',
        date: occupation.getDate()?.value()?.[0] || null,
        place: occupation.getPlace()?.value()?.[0] || null,
        description: occupation.value()?.[0] || null,
        latitude: null,
        longitude: null,
      });
    });

    // Immigration events
    const immigrationNodes = individual.getImmigration?.();
    immigrationNodes?.forEach((immigration: any) => {
      events.push({
        individualGedcomId: gedcomId,
        type: 'immigration',
        date: immigration.getDate()?.value()?.[0] || null,
        place: immigration.getPlace()?.value()?.[0] || null,
        description: null,
        latitude: null,
        longitude: null,
      });
    });
  } catch (error) {
    console.error('Error parsing events for individual:', gedcomId, error);
  }

  return events;
}

/**
 * Build explicit parent-child relationships from families
 */
function buildRelationships(families: ParsedFamily[]): ParsedRelationship[] {
  const relationships: ParsedRelationship[] = [];

  for (const family of families) {
    const { husbandGedcomId, wifeGedcomId, childrenGedcomIds } = family;

    // Create relationships from father to children
    if (husbandGedcomId) {
      for (const childId of childrenGedcomIds) {
        relationships.push({
          type: 'parent-child',
          parentGedcomId: husbandGedcomId,
          childGedcomId: childId,
        });
      }
    }

    // Create relationships from mother to children
    if (wifeGedcomId) {
      for (const childId of childrenGedcomIds) {
        relationships.push({
          type: 'parent-child',
          parentGedcomId: wifeGedcomId,
          childGedcomId: childId,
        });
      }
    }
  }

  return relationships;
}

/**
 * Compute statistics from parsed data
 */
function computeStats(
  individuals: ParsedIndividual[],
  families: ParsedFamily[],
  events: ParsedEvent[]
) {
  // Extract years from dates
  const years: number[] = [];
  const locations = new Set<string>();

  // Process birth and death dates
  for (const individual of individuals) {
    if (individual.birthDate) {
      const year = extractYear(individual.birthDate);
      if (year) years.push(year);
    }
    if (individual.deathDate) {
      const year = extractYear(individual.deathDate);
      if (year) years.push(year);
    }
    if (individual.birthPlace) locations.add(individual.birthPlace);
    if (individual.deathPlace) locations.add(individual.deathPlace);
  }

  // Process event dates and places
  for (const event of events) {
    if (event.date) {
      const year = extractYear(event.date);
      if (year) years.push(year);
    }
    if (event.place) locations.add(event.place);
  }

  const dateRangeStart = years.length > 0 ? Math.min(...years) : null;
  const dateRangeEnd = years.length > 0 ? Math.max(...years) : null;

  return {
    individualCount: individuals.length,
    familyCount: families.length,
    eventCount: events.length,
    dateRangeStart,
    dateRangeEnd,
    locations: Array.from(locations).slice(0, 100), // Limit to top 100 locations
  };
}

/**
 * Extract a 4-digit year from a GEDCOM date string
 */
function extractYear(dateString: string): number | null {
  // GEDCOM dates can be in various formats:
  // "1 JAN 1900", "JAN 1900", "1900", "ABT 1900", "BEF 1900", etc.
  const yearMatch = dateString.match(/\b(\d{4})\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    // Sanity check: year should be between 1000 and current year + 10
    if (year >= 1000 && year <= new Date().getFullYear() + 10) {
      return year;
    }
  }
  return null;
}
