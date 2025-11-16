/**
 * GEDCOM Parser Types
 *
 * Defines TypeScript interfaces for GEDCOM data structures
 * and the mapping to our Prisma database models.
 */

export interface ParsedIndividual {
  gedcomId: string;
  givenName: string | null;
  surname: string | null;
  fullName: string | null;
  gender: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  deathDate: string | null;
  deathPlace: string | null;
  occupation: string | null;
  notes: string | null;
  photoUrl: string | null;
  otherFacts: Record<string, unknown>;
}

export interface ParsedFamily {
  gedcomId: string;
  husbandGedcomId: string | null;
  wifeGedcomId: string | null;
  childrenGedcomIds: string[];
  marriageDate: string | null;
  marriagePlace: string | null;
}

export interface ParsedEvent {
  individualGedcomId: string;
  type: string;
  date: string | null;
  place: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface ParsedRelationship {
  type: 'parent-child';
  parentGedcomId: string;
  childGedcomId: string;
}

export interface GedcomParseResult {
  individuals: ParsedIndividual[];
  families: ParsedFamily[];
  events: ParsedEvent[];
  relationships: ParsedRelationship[];
  stats: {
    individualCount: number;
    familyCount: number;
    eventCount: number;
    dateRangeStart: number | null;
    dateRangeEnd: number | null;
    locations: string[];
  };
}

export interface GedcomImportResult {
  success: boolean;
  projectId: string;
  stats: {
    individualsCreated: number;
    familiesCreated: number;
    eventsCreated: number;
    relationshipsCreated: number;
    dateRangeStart: number | null;
    dateRangeEnd: number | null;
  };
  errors: string[];
}

export interface GedcomParserOptions {
  /**
   * Whether to extract geocoding information from places
   * (requires additional API calls)
   */
  extractGeocoordinates?: boolean;

  /**
   * Maximum number of individuals to parse (for testing/limits)
   */
  maxIndividuals?: number;

  /**
   * Progress callback for large files
   */
  onProgress?: (progress: number, message: string) => void;
}

export class GedcomParseError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'GedcomParseError';
  }
}
