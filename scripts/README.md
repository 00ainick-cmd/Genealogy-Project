# Testing the Narrative Engine

This guide shows you how to test the AI narrative generation feature.

## Quick Start (5 minutes)

### 1. Set Up Your API Key

Get an Anthropic API key from https://console.anthropic.com/

Add it to your `.env` file:
```bash
ANTHROPIC_API_KEY="sk-ant-api03-your-actual-key-here"
ENABLE_AI_GENERATION=true
```

### 2. Make Sure Database is Running

Start your PostgreSQL database (if using Docker):
```bash
docker-compose up -d
```

Or make sure your DATABASE_URL in `.env` points to a running PostgreSQL instance.

### 3. Set Up Database Schema

```bash
npm run db:push
npm run db:generate
```

### 4. Create Test Data

This creates a test user, project, and a sample person (Joshua Brown, 1826-1896):

```bash
npm run seed
```

You'll see output like:
```
Created user: clx123...
Created project: clx456...
Created individual: clx789...

✅ Test data created successfully!

Test Individual ID (use this for API calls): clx789abc...
Test Project ID: clx456def...
```

**Copy the Individual ID** - you'll need it for the next step!

### 5. Generate Your First Narrative

```bash
npm run test-narrative clx789abc...
```
(Replace `clx789abc...` with your actual individual ID from step 4)

You'll see:
```
🔍 Fetching individual data...
✅ Found: Joshua Brown
   Born: 1826-01-01
   Died: 1896-01-01

📝 Preparing narrative input...
✅ Input prepared
   Events: 3
   Related people: 1
   Historical contexts: 2

🤖 Generating narrative with Claude AI...
   (This may take 10-30 seconds)

✅ Narrative generated successfully!
   Time: 12.3s

═══════════════════════════════════════════════════════════════════
📖 GENERATED NARRATIVE
═══════════════════════════════════════════════════════════════════

Title: Joshua and Nancy on the Hills of Monroe Township
Episode ID: episode_joshua_brown_monroe_township_1826_1896
Time Span: 1826 - 1896
Word Count: ~650 words

─────────────────────────────────────────────────────────────────
SUMMARY
─────────────────────────────────────────────────────────────────
Joshua Brown lived his entire life in Monroe Township...

[Full narrative content displayed here]

💾 Saving to database...
✅ Narrative saved to database!

🎉 Test completed successfully!
```

## What Just Happened?

The narrative engine:
1. ✅ Fetched Joshua Brown's data from your database
2. ✅ Gathered related people (spouse Nancy), events (census records), and family info
3. ✅ Added historical context (Civil War, Industrial Revolution)
4. ✅ Sent it all to Claude AI with your custom Ken Burns-style prompt
5. ✅ Received a beautiful documentary-style narrative
6. ✅ Saved it to the database

## Testing via API (Alternative Method)

If you want to test via HTTP API instead:

### Start the dev server:
```bash
npm run dev
```

### Create a user and log in:
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "password": "your-password",
    "name": "Your Name"
  }'

# Login via the web interface at http://localhost:3000/auth/login
# Then get your session token from browser cookies
```

### Call the narrative API:
```bash
curl -X POST http://localhost:3000/api/narratives/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "individualId": "clx789abc...",
    "generationPrefs": {
      "detail_level": "medium",
      "max_words": 700,
      "include_spouse": true
    }
  }'
```

## Customizing the Test Data

Edit `scripts/seed-test-data.ts` to create your own test people:

```typescript
const myAncestor = await prisma.individual.create({
  data: {
    projectId: project.id,
    gedcomId: 'I003',
    givenName: 'Mary',
    surname: 'Smith',
    gender: 'F',
    birthDate: '1850-03-15',
    birthPlace: 'Boston, Massachusetts, USA',
    deathDate: '1920-11-02',
    deathPlace: 'Chicago, Illinois, USA',
    occupation: 'Teacher',
    notes: 'Immigrated from Ireland in 1848',
  },
});
```

## Next Steps

Once you've tested the narrative engine:

1. **Build the UI** - Create a React component to display narratives
2. **Add a "Generate Story" button** - Trigger the API from your family tree view
3. **Upload real GEDCOM data** - Use the parse-gedcom library to import actual genealogy files
4. **Customize historical context** - Add more events in `lib/narrative-helpers.ts`

## Troubleshooting

### "AI generation is not enabled"
Make sure both are set in `.env`:
```bash
ANTHROPIC_API_KEY="sk-ant-api03-..."
ENABLE_AI_GENERATION=true
```

### "Individual not found"
Run `npm run seed` again to create test data, or check the individual ID you're using.

### Database connection errors
Make sure PostgreSQL is running and DATABASE_URL is correct in `.env`.

### "Claude API returned invalid JSON"
- Check your API key is valid
- You might be rate limited - wait a minute and try again
- Check the server logs for the actual error

## Need Help?

See the full documentation: [docs/NARRATIVE_ENGINE.md](../docs/NARRATIVE_ENGINE.md)
