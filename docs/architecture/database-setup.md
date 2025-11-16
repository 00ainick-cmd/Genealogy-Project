# Database Setup and Migration Guide

This document describes the database schema for StoryTree and how to set up and migrate the database.

## Overview

StoryTree uses PostgreSQL as its primary database, managed through Prisma ORM. The schema is designed to support the complete genealogy narrative platform as defined in the system architecture.

## Database Models

The schema includes the following core models:

### Core Entities

1. **User** - User accounts and authentication
2. **Project** - Genealogy projects (one per GEDCOM upload)
3. **Individual** - People in the family tree
4. **Family** - Family units (spouses and children)
5. **Relationship** - Explicit parent-child relationships
6. **Event** - Life events (birth, death, marriage, residence, etc.)
7. **Narrative** - AI-generated or user-edited story narratives
8. **Chapter** - Organized collections of narratives
9. **ShareLink** - Public sharing tokens for projects
10. **HistoricalContext** - Historical context snippets for narrative enrichment

## Recent Schema Enhancements (v0.1)

The following enhancements align the schema with the System Architecture v0.1:

### Project Model
- Added `coverImageUrl` - Project cover image
- Added `dateRangeStart` and `dateRangeEnd` - Year range for the project timeline
- Added relations to `Relationship` and `HistoricalContext` models

### Individual Model
- Added `otherFacts` (JSON) - Flexible field for additional GEDCOM data
- Added indexes on `birthDate` and `deathDate` for timeline queries
- Added relations to `Relationship` model for explicit parent-child tracking

### New Models

#### Relationship
Provides explicit parent-child relationship tracking, complementing the Family model:
- `type` - Relationship type (primarily "parent-child")
- `parentId` and `childId` - References to Individual records
- Properly indexed for efficient tree traversal

#### HistoricalContext
Stores historical context data for enriching narratives:
- `regionKey` - Geographic region (e.g., "US-CA", "UK-London")
- `startYear` and `endYear` - Time range
- `type` - Context type (war, economic, cultural, migration, political)
- `title` and `description` - Context details
- `isGlobal` - Whether this context applies to all projects
- Can be project-specific or global

## Local Setup

### Prerequisites

- Docker and Docker Compose (for PostgreSQL)
- Node.js 18+ and npm
- Prisma CLI (installed via npm)

### Steps

1. **Start the PostgreSQL database:**

```bash
docker-compose up -d
```

This starts a PostgreSQL 16 container with:
- Database: `storytree`
- User: `storytree`
- Password: `storytree_dev_password`
- Port: `5432`

2. **Verify the database is running:**

```bash
docker ps | grep storytree-db
```

3. **Ensure `.env` file exists:**

The `.env` file should contain:
```env
DATABASE_URL="postgresql://storytree:storytree_dev_password@localhost:5432/storytree?schema=public"
```

4. **Create and apply migrations:**

```bash
# Create a new migration
npx prisma migrate dev --name enhanced_schema_architecture_v01

# Or if migration already exists, just apply it
npx prisma migrate deploy
```

5. **Generate Prisma Client:**

```bash
npx prisma generate
```

6. **Verify the schema:**

```bash
npx prisma studio
```

This opens a web UI to browse your database schema and data.

## Migration Notes

### First-Time Setup

If this is the first time setting up the database, Prisma will:
1. Create all tables based on the schema
2. Set up all relationships and indexes
3. Generate the Prisma Client for TypeScript

### Updating Existing Database

If you have an existing database from a previous schema version:
1. Backup your data first
2. Run `npx prisma migrate dev` to create a migration
3. Prisma will detect schema changes and generate appropriate SQL
4. Review the generated migration SQL in `prisma/migrations/`
5. Apply the migration

## Schema Diagram

```
User
  └── Projects (1:many)
       ├── Individuals (1:many)
       │    ├── Events (1:many)
       │    ├── Narrative (1:1)
       │    └── Relationships (many:many via Relationship table)
       ├── Families (1:many)
       ├── Relationships (1:many)
       ├── Events (1:many)
       ├── Narratives (1:many)
       ├── Chapters (1:many)
       ├── ShareLinks (1:many)
       └── HistoricalContext (1:many)
```

## Indexes

The schema includes indexes on frequently queried fields:

- **Project**: `userId`
- **Individual**: `projectId`, `surname`, `birthDate`, `deathDate`
- **Family**: `projectId`
- **Event**: `projectId`, `individualId`, `type`
- **Narrative**: `projectId`
- **Relationship**: `projectId`, `parentId`, `childId`, `type`
- **HistoricalContext**: `regionKey`, `startYear`, `endYear`, `type`, `isGlobal`, `projectId`

## Troubleshooting

### Database Connection Issues

If you get connection errors:
1. Check that Docker is running: `docker ps`
2. Check that the database container is healthy: `docker logs storytree-db`
3. Verify DATABASE_URL in `.env` matches docker-compose settings

### Migration Conflicts

If you get migration conflicts:
1. Check current migration status: `npx prisma migrate status`
2. Reset the database (WARNING: destroys data): `npx prisma migrate reset`
3. Apply all migrations: `npx prisma migrate deploy`

### Prisma Client Out of Sync

If TypeScript complains about missing fields:
1. Regenerate the client: `npx prisma generate`
2. Restart your TypeScript server in your IDE

## Next Steps

After setting up the database:
1. Implement GEDCOM parser to populate Individual, Family, Relationship, and Event tables
2. Create API routes for CRUD operations on all entities
3. Implement the AI narrative generation service
4. Seed HistoricalContext table with initial historical data
5. Build the frontend components to display and edit data

## Reference

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [System Architecture v0.1](./system-architecture-v0.1.md)
