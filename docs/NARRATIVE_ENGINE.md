# StoryTree Narrative Engine

## Overview

The StoryTree Narrative Engine transforms genealogical data (family tree records) into short, documentary-style stories in the tone of a Ken Burns film: warm, reflective, respectful, historically grounded, and written in clear, accessible English.

The engine uses **Claude (Anthropic)** to generate narratives that are:
- Written in the **third person**
- Grounded in actual genealogical data
- Enhanced with historical context
- Respectful and dignified
- Formatted as structured JSON for easy display

## Features

### Core Capabilities

1. **AI-Powered Narrative Generation**
   - Generates documentary-style stories from genealogical data
   - Uses Claude Sonnet 4.5 for high-quality, contextual narratives
   - Automatically formats output as structured JSON

2. **Data-Driven Storytelling**
   - Integrates birth/death records, census data, marriage records, and events
   - Includes spouse and family information
   - Adds relevant historical context based on time period and location

3. **Flexible Generation Preferences**
   - Control story length (300-1000 words)
   - Adjust detail level (short, medium, long)
   - Choose whether to include spouse information

4. **Multiple Generation Modes**
   - Generate for a single individual
   - Batch generate for an entire project
   - Retrieve, update, or delete existing narratives

## API Endpoints

### Generate Narrative (Single)

Generate a narrative for one individual.

**Endpoint:** `POST /api/narratives/generate`

**Request Body:**
```json
{
  "individualId": "clx123abc...",
  "generationPrefs": {
    "max_words": 700,
    "detail_level": "medium",
    "include_spouse": true
  },
  "saveToDatabase": true
}
```

**Response:**
```json
{
  "success": true,
  "narrative": {
    "episode_id": "episode_joshua_brown_monroe_township_1826_1896",
    "title": "Joshua and Nancy on the Hills of Monroe Township",
    "summary": "Joshua Brown lived his entire life in Monroe Township, Harrison County, Ohio...",
    "time_span": {
      "start_year": 1826,
      "end_year": 1896
    },
    "primary_locations": ["Monroe Township, Harrison County, Ohio, USA"],
    "main_people": [
      {
        "id": "p_joshua_c_brown",
        "name": "Joshua Brown",
        "role": "main subject"
      },
      {
        "id": "p_nancy_chaney",
        "name": "Nancy Chaney",
        "role": "spouse"
      }
    ],
    "sections": {
      "early_life": "Joshua Brown was born in 1826...",
      "work_and_daily_life": "The 1870 census lists Joshua as a farmer...",
      "family_and_home": "In 1849, Joshua married Nancy Chaney...",
      "historical_context": "Joshua lived through the Civil War era..."
    },
    "sources_used": [
      "Birth record, 1826 (Monroe Township, Harrison County, Ohio)",
      "Marriage record, 1849 (Harrison County, Ohio)",
      "U.S. Federal Census, 1870 (Monroe Township, Harrison County, Ohio)",
      "Historical context: Ohio in the 1800s; U.S. Civil War (1861–1865)"
    ],
    "word_count_approx": 650
  },
  "savedToDatabase": true
}
```

### Batch Generate Narratives

Generate narratives for multiple individuals in a project.

**Endpoint:** `POST /api/narratives/batch`

**Request Body:**
```json
{
  "projectId": "clx456def...",
  "individualIds": ["id1", "id2", "id3"],
  "generationPrefs": {
    "max_words": 600,
    "detail_level": "medium",
    "include_spouse": true
  }
}
```

**Note:** If `individualIds` is omitted, narratives will be generated for ALL individuals in the project.

**Response:**
```json
{
  "success": true,
  "total": 3,
  "succeeded": 2,
  "failed": 1,
  "results": [
    {
      "individualId": "id1",
      "success": true,
      "narrative": { /* full narrative output */ },
      "error": null
    },
    {
      "individualId": "id2",
      "success": false,
      "narrative": null,
      "error": "Insufficient data for narrative generation"
    }
  ]
}
```

### Retrieve Narrative

Get an existing narrative for an individual.

**Endpoint:** `GET /api/narratives/[individualId]`

**Response:**
```json
{
  "success": true,
  "narrative": {
    "id": "clx789ghi...",
    "individualId": "clx123abc...",
    "projectId": "clx456def...",
    "title": "Joshua and Nancy on the Hills of Monroe Township",
    "content": { /* full narrative content */ },
    "isEdited": false,
    "isGenerated": true,
    "generatedAt": "2025-11-16T12:00:00.000Z",
    "createdAt": "2025-11-16T12:00:00.000Z",
    "updatedAt": "2025-11-16T12:00:00.000Z"
  }
}
```

### Update Narrative

Edit an existing narrative (user modifications).

**Endpoint:** `PUT /api/narratives/[individualId]`

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": {
    "sections": {
      "early_life": "Modified early life section..."
    }
  }
}
```

### Delete Narrative

Remove a narrative.

**Endpoint:** `DELETE /api/narratives/[individualId]`

**Response:**
```json
{
  "success": true,
  "message": "Narrative deleted successfully"
}
```

## Architecture

### Core Components

1. **Narrative Engine Service** (`lib/narrative-engine.ts`)
   - Main Claude API integration
   - System prompt configuration
   - Response validation

2. **Narrative Helpers** (`lib/narrative-helpers.ts`)
   - Transforms database models to narrative input format
   - Fetches related genealogical data
   - Provides historical context

3. **Type Definitions** (`types/narrative-engine.types.ts`)
   - Input/output type safety
   - Structured narrative format

4. **API Routes** (`app/api/narratives/`)
   - RESTful endpoints for narrative operations
   - Authentication and authorization
   - Database persistence

### Data Flow

```
User Request
    ↓
API Endpoint (with auth)
    ↓
Fetch Individual + Related Data (Prisma)
    ↓
Transform to NarrativeEngineInput (narrative-helpers.ts)
    ↓
Generate Narrative (Claude API via narrative-engine.ts)
    ↓
Validate & Parse JSON Response
    ↓
Save to Database (optional)
    ↓
Return to User
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Required for narrative generation
ANTHROPIC_API_KEY="sk-ant-api03-..."
ENABLE_AI_GENERATION=true
```

Get your Anthropic API key from: https://console.anthropic.com/

### Feature Toggle

The narrative engine respects the `ENABLE_AI_GENERATION` flag. If set to `false` or if `ANTHROPIC_API_KEY` is missing, API endpoints will return a 503 error.

## Generation Preferences

### Detail Level

- **short**: ~300-400 words total
- **medium**: ~500-700 words total (default)
- **long**: ~800-1000 words total

### Other Options

- `max_words`: Override the maximum word count (default based on detail_level)
- `include_spouse`: Include spouse information in the narrative (default: `true`)

## Historical Context

The engine automatically adds relevant historical context based on:

1. **Time Period**: Birth year → Death year
2. **Location**: Birth place and other event locations

### Currently Supported Historical Events

- **Westward Expansion** (1800-1890)
- **U.S. Civil War** (1861-1865)
- **Industrial Revolution** (1870-1920)
- **World War I** (1914-1918)
- **Great Depression** (1929-1939)
- **World War II** (1939-1945)

### Extending Historical Context

To add more historical events, edit the `getHistoricalContext()` function in `lib/narrative-helpers.ts`:

```typescript
// Add your custom historical context
if (birthYear && deathYear && birthYear <= 1918 && deathYear >= 1914) {
  context.push({
    region_key: 'your_event_key',
    start_year: 1914,
    end_year: 1918,
    summary: 'Your historical context description...',
  });
}
```

## Narrative Structure

Each generated narrative includes:

### Metadata
- `episode_id`: Unique slug identifier
- `title`: Documentary-style episode title
- `summary`: 2-4 sentence teaser
- `time_span`: Year range covered
- `primary_locations`: Key places mentioned
- `main_people`: Subject and key related individuals

### Content Sections

1. **Early Life**: Birth, upbringing, early environment
2. **Work and Daily Life**: Occupations, routines, economic reality
3. **Family and Home**: Household composition, marriages, children
4. **Historical Context**: Major events and how they shaped the person's world

### Sources
- Lists all genealogical records and historical context used

## Style Guidelines

The narrative engine follows these principles:

1. **Third-Person Voice**: Always "Joshua lived..." never "You lived..."
2. **Documentary Tone**: Ken Burns-style warmth and reflection
3. **Grounded in Data**: No invented specifics beyond what's in the data
4. **Respectful**: Dignified treatment of real people and ancestors
5. **Accessible Language**: Clear English, no genealogical jargon
6. **Appropriate Speculation**: Uses phrases like "Daily life would have involved..." when inferring from context

## Database Storage

Narratives are stored in the `Narrative` table:

```prisma
model Narrative {
  id           String     @id @default(cuid())
  individualId String     @unique
  projectId    String
  title        String?
  content      Json       // Full NarrativeEngineOutput
  isEdited     Boolean    @default(false)
  isGenerated  Boolean    @default(false)
  generatedAt  DateTime?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}
```

- `content`: Stores the full JSON output from the narrative engine
- `isGenerated`: Indicates AI-generated content
- `isEdited`: Flag for user modifications
- `generatedAt`: Timestamp of generation

## Error Handling

### Common Errors

1. **401 Unauthorized**: User not logged in
2. **403 Forbidden**: User doesn't own the project
3. **404 Not Found**: Individual or narrative doesn't exist
4. **503 Service Unavailable**: AI generation not enabled or API key missing
5. **500 Internal Server Error**: API failure or invalid response

### Validation

The engine validates:
- Required fields in narrative output
- JSON structure from Claude
- Database relationships
- User permissions

## Testing

### Manual Testing

You can test the narrative engine using curl or Postman:

```bash
# Generate a narrative
curl -X POST http://localhost:3000/api/narratives/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "individualId": "YOUR_INDIVIDUAL_ID",
    "generationPrefs": {
      "detail_level": "medium"
    }
  }'
```

### Future Enhancements

- [ ] Support for photo/image descriptions in narratives
- [ ] Multi-generational family narratives (chapters)
- [ ] Custom historical context database
- [ ] Tone/style customization (beyond Ken Burns)
- [ ] Multiple language support
- [ ] Integration with timeline and map visualizations

## Troubleshooting

### Issue: "AI generation is not enabled"

**Solution**: Ensure both environment variables are set:
```bash
ANTHROPIC_API_KEY="sk-ant-api03-..."
ENABLE_AI_GENERATION=true
```

### Issue: "Claude API returned invalid JSON response"

**Possible causes**:
- Rate limiting from Anthropic
- Malformed input data
- API key issues

**Solution**: Check server logs for the actual response from Claude, verify API key is valid.

### Issue: Narratives are too generic

**Solution**:
- Add more detailed event records (census, occupation, residence)
- Include notes on individuals with family stories or traditions
- Ensure dates and places are as specific as possible

### Issue: Rate limiting on batch generation

**Solution**: The batch endpoint includes a 1-second delay between requests. For larger batches, consider:
- Breaking into smaller batches
- Increasing the delay in `app/api/narratives/batch/route.ts`
- Upgrading your Anthropic API tier

## License

Part of the StoryTree project. See main LICENSE file.
