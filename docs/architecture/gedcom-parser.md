# GEDCOM Parser Module Documentation

This document describes the GEDCOM parser implementation for StoryTree.

## Overview

The GEDCOM parser module is responsible for parsing GEDCOM (.ged) files and importing genealogical data into the StoryTree database. It handles:

- Parsing GEDCOM 5.5/5.5.1/5.5.5 files
- Extracting individuals, families, events, and relationships
- Normalizing data for the database
- Providing progress updates for large files
- Error handling and validation

## Architecture

The module is organized into three main components:

```
lib/gedcom/
├── types.ts      - TypeScript type definitions
├── parser.ts     - GEDCOM file parsing logic
├── importer.ts   - Database import logic
└── index.ts      - Public API exports
```

## Components

### 1. Types (`types.ts`)

Defines TypeScript interfaces for all data structures:

- **ParsedIndividual** - Individual person data from GEDCOM
- **ParsedFamily** - Family unit (spouses and children)
- **ParsedEvent** - Life events (birth, death, marriage, etc.)
- **ParsedRelationship** - Explicit parent-child relationships
- **GedcomParseResult** - Complete parse output with statistics
- **GedcomImportResult** - Import result with success/error info
- **GedcomParserOptions** - Configuration options for parsing

### 2. Parser (`parser.ts`)

Handles the actual GEDCOM file parsing using the `read-gedcom` library.

#### Main Function: `parseGedcomFile()`

```typescript
async function parseGedcomFile(
  buffer: ArrayBuffer,
  options?: GedcomParserOptions
): Promise<GedcomParseResult>
```

**Process:**
1. Reads GEDCOM file from buffer
2. Extracts individuals with names, dates, places, and events
3. Extracts families with spouse and children relationships
4. Extracts life events (birth, death, residence, occupation, immigration)
5. Builds explicit parent-child relationships
6. Computes statistics (date ranges, location lists, counts)

**Features:**
- Progress callbacks for UI updates
- Tolerant parsing (handles malformed data)
- Supports multiple GEDCOM versions (5.5, 5.5.1, 5.5.5)
- Automatic character encoding detection
- Date normalization and year extraction

#### Helper Functions

- `parseIndividual()` - Extracts person data from GEDCOM individual record
- `parseFamily()` - Extracts family data from GEDCOM family record
- `parseEvents()` - Extracts all events for an individual
- `buildRelationships()` - Creates explicit parent-child relationship records
- `computeStats()` - Calculates project statistics
- `extractYear()` - Extracts 4-digit year from GEDCOM date strings

### 3. Importer (`importer.ts`)

Handles database import using Prisma transactions.

#### Main Class: `GedcomImporter`

```typescript
class GedcomImporter {
  constructor(projectId: string)
  async import(parseResult: GedcomParseResult): Promise<GedcomImportResult>
}
```

**Import Process:**
1. Creates all individuals first (to get database IDs)
2. Creates families with spouse relationships
3. Connects children to families
4. Creates all events linked to individuals
5. Creates explicit parent-child relationship records
6. Updates project with statistics

**Features:**
- Atomic transactions (all-or-nothing import)
- Error collection (continues on individual record failures)
- GEDCOM ID to database ID mapping
- Comprehensive error reporting

#### Convenience Function: `importGedcomFile()`

```typescript
async function importGedcomFile(
  projectId: string,
  buffer: ArrayBuffer,
  onProgress?: (progress: number, message: string) => void
): Promise<GedcomImportResult>
```

Combines parsing and importing in one step.

## API Endpoint

**Endpoint:** `POST /api/projects/[projectId]/import-gedcom`

**Authentication:** Required (JWT/session)

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (GEDCOM .ged file)

**Response:**
```json
{
  "success": true,
  "message": "GEDCOM file imported successfully",
  "stats": {
    "individualsCreated": 150,
    "familiesCreated": 75,
    "eventsCreated": 450,
    "relationshipsCreated": 200,
    "dateRangeStart": 1850,
    "dateRangeEnd": 2020
  },
  "errors": [] // Optional array of non-fatal errors
}
```

**Validation:**
- File must be .ged extension
- Maximum file size: 20MB (configurable via `MAX_FILE_SIZE_MB` env var)
- User must own the project

## Usage Example

### Frontend (React/Next.js)

```typescript
async function uploadGedcom(projectId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api/projects/${projectId}/import-gedcom`, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();

  if (result.success) {
    console.log(`Imported ${result.stats.individualsCreated} individuals`);
  } else {
    console.error('Import failed:', result.errors);
  }
}
```

### Backend (Direct Usage)

```typescript
import { importGedcomFile } from '@/lib/gedcom';

const buffer = await readFile('family.ged');
const result = await importGedcomFile(
  projectId,
  buffer,
  (progress, message) => {
    console.log(`${progress}%: ${message}`);
  }
);
```

## Data Mapping

### GEDCOM → Database

| GEDCOM Tag | Database Model | Field(s) |
|------------|----------------|----------|
| INDI | Individual | All person data |
| NAME | Individual | givenName, surname, fullName |
| SEX | Individual | gender |
| BIRT | Individual + Event | birthDate, birthPlace + birth event |
| DEAT | Individual + Event | deathDate, deathPlace + death event |
| OCCU | Individual + Event | occupation + occupation event |
| RESI | Event | residence event |
| IMMI | Event | immigration event |
| FAM | Family | Family record |
| HUSB | Family | husbandId |
| WIFE | Family | wifeId |
| CHIL | Family + Relationship | children array + parent-child relationships |
| MARR | Family | marriageDate, marriagePlace |

### Date Handling

GEDCOM dates are stored as strings in various formats:
- Full dates: "1 JAN 1900"
- Month/Year: "JAN 1900"
- Year only: "1900"
- Approximate: "ABT 1900", "BEF 1900", "AFT 1900"

The parser extracts 4-digit years for timeline statistics while preserving original date strings for display.

## Error Handling

The parser uses a tolerant approach:

1. **Parse Errors**: Invalid records are logged but don't stop the import
2. **Missing References**: If a family references a non-existent individual, the error is logged
3. **Duplicate GEDCOM IDs**: First occurrence wins, duplicates are logged
4. **Invalid Data**: Null/empty values are stored as-is

All errors are collected and returned in the import result for user review.

## Performance

The parser is optimized for files up to 100,000 individuals:

- **Streaming**: Uses read-gedcom's efficient parsing
- **Batching**: Database writes use Prisma transactions
- **Progress**: Provides progress updates every 100 individuals
- **Memory**: Processes data in chunks to avoid memory issues

For files larger than 100,000 individuals, consider:
- Increasing server memory
- Implementing batch processing
- Using background jobs

## Testing

Test files should include:

1. **Small files** (< 100 individuals) - Unit tests
2. **Medium files** (100-1,000 individuals) - Integration tests
3. **Large files** (> 1,000 individuals) - Performance tests
4. **Malformed files** - Error handling tests

Place test GEDCOM files in: `tests/fixtures/gedcom/`

## Limitations

Current limitations (MVP):

1. **Geocoding**: Location coordinates are not extracted (requires external API)
2. **Media**: OBJE (media objects) are not imported
3. **Sources**: SOUR (sources/citations) are not imported
4. **Notes**: Only inline notes are captured, not NOTE references
5. **Custom Tags**: Custom GEDCOM tags are ignored

These features are planned for future iterations.

## Future Enhancements

Planned improvements:

1. **Geocoding Integration**: Add Mapbox/Google Maps API for location coordinates
2. **Media Import**: Support for photos and documents
3. **Source Tracking**: Import source citations for research validation
4. **GEDCOM Export**: Generate GEDCOM files from database
5. **Background Jobs**: Use job queue for large file imports
6. **WebSocket Progress**: Real-time progress updates to frontend
7. **Validation**: Pre-import validation with detailed error report

## Dependencies

- **read-gedcom** (v0.3.2) - GEDCOM parsing library
  - Zero dependencies
  - TypeScript support
  - Tolerant parsing
  - Multi-encoding support

## References

- [GEDCOM 5.5.5 Specification](https://www.gedcom.org/gedcom.html)
- [read-gedcom Documentation](https://github.com/arbre-app/read-gedcom)
- [StoryTree System Architecture](./system-architecture-v0.1.md)
- [Database Setup Guide](./database-setup.md)
