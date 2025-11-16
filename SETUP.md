# StoryTree Setup Guide

## Prerequisites

Before running the application, ensure you have:

- Node.js 18+ installed
- PostgreSQL database (local or remote)
- npm or yarn package manager

## Environment Setup

1. **Copy environment variables**:
   ```bash
   cp .env.example .env
   ```

2. **Configure your `.env` file**:
   ```env
   # Database - Update with your PostgreSQL connection string
   DATABASE_URL="postgresql://user:password@localhost:5432/storytree?schema=public"

   # NextAuth - Generate a secret with: openssl rand -base64 32
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-generated-secret-here"

   # AI Service (Optional for MVP)
   OPENAI_API_KEY="your-openai-key"
   # OR
   ANTHROPIC_API_KEY="your-anthropic-key"
   ```

## Database Setup

### Option 1: Using Docker Compose (Recommended for Development)

```bash
# Start PostgreSQL container
docker-compose up -d

# The database will be available at:
# postgresql://storytree:storytree_dev_password@localhost:5432/storytree
```

### Option 2: Using Existing PostgreSQL

Update the `DATABASE_URL` in your `.env` file with your PostgreSQL connection string.

## Initialize the Database

Once your database is running:

```bash
# Generate Prisma Client
npm run db:generate

# Push the schema to your database (creates tables)
npm run db:push

# Optional: Open Prisma Studio to view/edit data
npm run db:studio
```

## Install Dependencies

```bash
npm install
```

## Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Troubleshooting

### Prisma Client Not Generated

If you see errors about `@prisma/client not initialized`:

```bash
npm run db:generate
```

### Database Connection Issues

1. Ensure PostgreSQL is running
2. Verify your DATABASE_URL is correct
3. Check that the database user has appropriate permissions

### Edge Runtime Warnings

The bcryptjs warnings about Edge Runtime are expected and can be ignored. The authentication routes use Node.js runtime explicitly.

## Development Workflow

1. Make changes to the code
2. The development server will hot-reload automatically
3. Database schema changes require running `npm run db:push`
4. After schema changes, run `npm run db:generate` to update Prisma Client

## Next Steps

- Create your account at `/auth/register`
- Upload a GEDCOM file (feature coming in next phase)
- Generate AI narratives for your ancestors
- Share your family story

For more information, see the [README.md](README.md).
