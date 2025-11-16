// Narrative Engine Input Types

export interface NarrativeEngineProject {
  id: string;
  title: string;
  date_range?: {
    start_year?: number;
    end_year?: number;
  };
  primary_region?: string;
}

export interface NarrativeEnginePerson {
  id: string;
  given_name?: string;
  surname?: string;
  gender?: string;
  birth_date?: string;
  birth_place?: string;
  death_date?: string;
  death_place?: string;
  occupation?: string;
  notes?: string;
}

export interface NarrativeEngineRelatedPerson {
  id: string;
  relationship_to_person: string; // 'spouse', 'parent', 'child', 'sibling'
  given_name?: string;
  surname?: string;
  marriage_date?: string;
  marriage_place?: string;
  children_count_estimate?: number;
}

export interface NarrativeEngineEvent {
  id: string;
  type: string; // 'birth', 'death', 'marriage', 'census', 'immigration', 'residence', 'occupation'
  person_id: string;
  other_person_id?: string;
  date?: string;
  year?: number;
  place?: string;
  occupation?: string;
  household_size?: number;
  description?: string;
}

export interface NarrativeEngineHistoricalContext {
  region_key: string;
  start_year: number;
  end_year: number;
  summary: string;
}

export interface NarrativeEngineGenerationPrefs {
  max_words?: number;
  detail_level?: 'short' | 'medium' | 'long';
  include_spouse?: boolean;
}

export interface NarrativeEngineInput {
  project: NarrativeEngineProject;
  person: NarrativeEnginePerson;
  related_people?: NarrativeEngineRelatedPerson[];
  events?: NarrativeEngineEvent[];
  historical_context?: NarrativeEngineHistoricalContext[];
  generation_prefs?: NarrativeEngineGenerationPrefs;
}

// Narrative Engine Output Types

export interface NarrativeEngineTimeSpan {
  start_year: number | null;
  end_year: number | null;
}

export interface NarrativeEngineMainPerson {
  id: string;
  name: string;
  role: string; // 'main subject', 'spouse', 'child', 'sibling'
}

export interface NarrativeEngineSections {
  early_life: string;
  work_and_daily_life: string;
  family_and_home: string;
  historical_context: string;
}

export interface NarrativeEngineOutput {
  episode_id: string;
  title: string;
  summary: string;
  time_span: NarrativeEngineTimeSpan;
  primary_locations: string[];
  main_people: NarrativeEngineMainPerson[];
  sections: NarrativeEngineSections;
  sources_used: string[];
  word_count_approx: number;
}
