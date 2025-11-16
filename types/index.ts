// Project types
export interface ProjectStats {
  totalIndividuals: number;
  totalFamilies: number;
  dateRange: {
    earliest: string;
    latest: string;
  };
  topSurnames: Array<{ surname: string; count: number }>;
  topLocations: Array<{ location: string; count: number }>;
  generations: number;
}

// GEDCOM parsing types
export interface GedcomIndividual {
  id: string;
  givenName?: string;
  surname?: string;
  fullName?: string;
  gender?: string;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  occupation?: string;
  events: GedcomEvent[];
}

export interface GedcomFamily {
  id: string;
  husbandId?: string;
  wifeId?: string;
  childrenIds: string[];
  marriageDate?: string;
  marriagePlace?: string;
}

export interface GedcomEvent {
  type: string;
  date?: string;
  place?: string;
  description?: string;
}

export interface ParsedGedcom {
  individuals: GedcomIndividual[];
  families: GedcomFamily[];
}

// Narrative types
export interface NarrativeContent {
  earlyLife?: string;
  workAndDailyLife?: string;
  familyAndHome?: string;
  historicalContext?: string;
  personalMemories?: string;
}

export interface NarrativeSection {
  title: string;
  content: string;
}

// Tree visualization types
export interface TreeNode {
  id: string;
  data: {
    individualId: string;
    name: string;
    lifespan?: string;
    gender?: string;
    hasNarrative: boolean;
  };
  position: { x: number; y: number };
  type?: string;
}

export interface TreeEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

// Timeline types
export interface TimelineEvent {
  id: string;
  type: 'birth' | 'death' | 'marriage' | 'immigration' | 'residence' | 'occupation' | 'narrative';
  date: string;
  title: string;
  description?: string;
  individualId?: string;
  individualName?: string;
  location?: string;
}

// Map types
export interface MapLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  events: Array<{
    type: string;
    date?: string;
    individualId: string;
    individualName: string;
  }>;
}

// Historical context types
export interface HistoricalContext {
  timePeriod: string;
  region: string;
  majorEvents: string[];
  commonOccupations: string[];
  economicContext: string;
  culturalNotes: string;
}
