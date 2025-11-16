/**
 * GEDCOM Importer Service
 *
 * Takes parsed GEDCOM data and imports it into the database
 * using Prisma, creating all necessary relationships.
 */

import { prisma } from '@/lib/prisma';
import type {
  GedcomParseResult,
  GedcomImportResult,
  ParsedIndividual,
  ParsedFamily,
  ParsedEvent,
  ParsedRelationship,
} from './types';

export class GedcomImporter {
  private projectId: string;
  private gedcomIdToDbIdMap: Map<string, string> = new Map();
  private errors: string[] = [];

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  /**
   * Import parsed GEDCOM data into the database
   */
  async import(parseResult: GedcomParseResult): Promise<GedcomImportResult> {
    try {
      // Use a transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Step 1: Import individuals
        await this.importIndividuals(tx, parseResult.individuals);

        // Step 2: Import families
        await this.importFamilies(tx, parseResult.families);

        // Step 3: Import events
        await this.importEvents(tx, parseResult.events);

        // Step 4: Import relationships
        await this.importRelationships(tx, parseResult.relationships);

        // Step 5: Update project statistics
        await this.updateProjectStats(tx, parseResult.stats);

        return {
          individualsCreated: parseResult.individuals.length,
          familiesCreated: parseResult.families.length,
          eventsCreated: parseResult.events.length,
          relationshipsCreated: parseResult.relationships.length,
          dateRangeStart: parseResult.stats.dateRangeStart,
          dateRangeEnd: parseResult.stats.dateRangeEnd,
        };
      });

      return {
        success: true,
        projectId: this.projectId,
        stats: result,
        errors: this.errors,
      };
    } catch (error) {
      console.error('Error importing GEDCOM data:', error);
      return {
        success: false,
        projectId: this.projectId,
        stats: {
          individualsCreated: 0,
          familiesCreated: 0,
          eventsCreated: 0,
          relationshipsCreated: 0,
          dateRangeStart: null,
          dateRangeEnd: null,
        },
        errors: [
          ...this.errors,
          `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  /**
   * Import individuals into the database
   */
  private async importIndividuals(tx: any, individuals: ParsedIndividual[]) {
    for (const individual of individuals) {
      try {
        const created = await tx.individual.create({
          data: {
            projectId: this.projectId,
            gedcomId: individual.gedcomId,
            givenName: individual.givenName,
            surname: individual.surname,
            fullName: individual.fullName,
            gender: individual.gender,
            birthDate: individual.birthDate,
            birthPlace: individual.birthPlace,
            deathDate: individual.deathDate,
            deathPlace: individual.deathPlace,
            occupation: individual.occupation,
            notes: individual.notes,
            photoUrl: individual.photoUrl,
            otherFacts: individual.otherFacts,
          },
        });

        // Map GEDCOM ID to database ID for later relationship creation
        this.gedcomIdToDbIdMap.set(individual.gedcomId, created.id);
      } catch (error) {
        this.errors.push(
          `Failed to import individual ${individual.gedcomId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  }

  /**
   * Import families into the database
   */
  private async importFamilies(tx: any, families: ParsedFamily[]) {
    for (const family of families) {
      try {
        // Get database IDs for husband and wife
        const husbandId = family.husbandGedcomId
          ? this.gedcomIdToDbIdMap.get(family.husbandGedcomId)
          : null;
        const wifeId = family.wifeGedcomId
          ? this.gedcomIdToDbIdMap.get(family.wifeGedcomId)
          : null;

        // Create family with spouse relationships
        const created = await tx.family.create({
          data: {
            projectId: this.projectId,
            gedcomId: family.gedcomId,
            husbandId: husbandId || undefined,
            wifeId: wifeId || undefined,
            marriageDate: family.marriageDate,
            marriagePlace: family.marriagePlace,
          },
        });

        // Connect children to this family
        for (const childGedcomId of family.childrenGedcomIds) {
          const childId = this.gedcomIdToDbIdMap.get(childGedcomId);
          if (childId) {
            await tx.individual.update({
              where: { id: childId },
              data: {
                familiesAsChild: {
                  connect: { id: created.id },
                },
              },
            });
          }
        }
      } catch (error) {
        this.errors.push(
          `Failed to import family ${family.gedcomId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  }

  /**
   * Import events into the database
   */
  private async importEvents(tx: any, events: ParsedEvent[]) {
    for (const event of events) {
      try {
        const individualId = this.gedcomIdToDbIdMap.get(
          event.individualGedcomId
        );
        if (!individualId) {
          this.errors.push(
            `Cannot create event: individual ${event.individualGedcomId} not found`
          );
          continue;
        }

        await tx.event.create({
          data: {
            projectId: this.projectId,
            individualId,
            type: event.type,
            date: event.date,
            place: event.place,
            description: event.description,
            latitude: event.latitude,
            longitude: event.longitude,
          },
        });
      } catch (error) {
        this.errors.push(
          `Failed to import event for ${event.individualGedcomId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  }

  /**
   * Import explicit parent-child relationships
   */
  private async importRelationships(
    tx: any,
    relationships: ParsedRelationship[]
  ) {
    for (const relationship of relationships) {
      try {
        const parentId = this.gedcomIdToDbIdMap.get(
          relationship.parentGedcomId
        );
        const childId = this.gedcomIdToDbIdMap.get(relationship.childGedcomId);

        if (!parentId || !childId) {
          this.errors.push(
            `Cannot create relationship: parent ${relationship.parentGedcomId} or child ${relationship.childGedcomId} not found`
          );
          continue;
        }

        await tx.relationship.create({
          data: {
            projectId: this.projectId,
            type: relationship.type,
            parentId,
            childId,
          },
        });
      } catch (error) {
        this.errors.push(
          `Failed to import relationship ${relationship.parentGedcomId} -> ${relationship.childGedcomId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  }

  /**
   * Update project with statistics from the import
   */
  private async updateProjectStats(tx: any, stats: any) {
    try {
      await tx.project.update({
        where: { id: this.projectId },
        data: {
          dateRangeStart: stats.dateRangeStart,
          dateRangeEnd: stats.dateRangeEnd,
          stats: {
            individualCount: stats.individualCount,
            familyCount: stats.familyCount,
            eventCount: stats.eventCount,
            locations: stats.locations,
          },
        },
      });
    } catch (error) {
      this.errors.push(
        `Failed to update project stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/**
 * Convenience function to parse and import a GEDCOM file in one step
 */
export async function importGedcomFile(
  projectId: string,
  buffer: ArrayBuffer,
  onProgress?: (progress: number, message: string) => void
): Promise<GedcomImportResult> {
  const { parseGedcomFile } = await import('./parser');

  // Parse the file
  const parseResult = await parseGedcomFile(buffer, { onProgress });

  // Import into database
  const importer = new GedcomImporter(projectId);
  const importResult = await importer.import(parseResult);

  return importResult;
}
