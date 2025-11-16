# StoryTree

Transform your family history into interactive, documentary-style stories.

## Overview

StoryTree is a web-based genealogy storytelling platform that converts GEDCOM files into engaging, AI-generated narratives with interactive visualizations.

## Features (MVP v0.1)

- 📤 **GEDCOM Import**: Upload genealogy data from Ancestry.com and other platforms
- 🌳 **Interactive Family Tree**: Explore your family with a zoomable, interactive tree visualization
- 📖 **AI-Generated Narratives**: Documentary-style stories about your ancestors powered by Claude AI (✅ **Implemented**)
- 📅 **Timeline View**: See family events across history
- 🗺️ **Map View**: Visualize your family's geographic journey
- ✏️ **Story Editing**: Customize and personalize AI-generated narratives
- 🔗 **Sharing**: Create secure, read-only links to share with family

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Visualization**: React Flow, D3.js, Leaflet
- **AI**: OpenAI API / Anthropic Claude API
- **GEDCOM Parsing**: parse-gedcom

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- OpenAI or Anthropic API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Genealogy-Project
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your database URL and API keys.

4. Set up the database:
```bash
npm run db:push
npm run db:generate
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── projects/          # Project views
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── tree/             # Family tree components
│   ├── timeline/         # Timeline components
│   ├── map/              # Map components
│   └── ui/               # Reusable UI components
├── lib/                   # Utility functions
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # NextAuth configuration
│   ├── narrative-engine.ts    # AI narrative generation (Claude)
│   ├── narrative-helpers.ts   # Data transformation for narratives
│   └── gedcom-parser.ts  # GEDCOM parsing logic (planned)
├── prisma/               # Database schema
│   └── schema.prisma     # Prisma schema
├── types/                # TypeScript type definitions
└── public/               # Static assets

```

## Database Schema

Key models:
- **User**: User accounts
- **Project**: Family tree projects
- **Individual**: People in the family tree
- **Family**: Family relationships
- **Event**: Life events (birth, death, marriage, etc.)
- **Narrative**: AI-generated stories
- **Chapter**: Story organization
- **ShareLink**: Shareable project links

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push Prisma schema to database
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio

## Documentation

- **[Narrative Engine](docs/NARRATIVE_ENGINE.md)** - Complete guide to the AI narrative generation system

## Development Roadmap

### Phase 1: Foundation ✅
- [x] Project setup
- [x] Database schema
- [ ] Basic UI structure

### Phase 2: Core Features (In Progress)
- [x] User authentication ✅
- [ ] GEDCOM upload and parsing
- [ ] Project management
- [ ] Family tree visualization

### Phase 3: AI & Stories ⚡ (In Progress)
- [x] AI narrative generation (Claude integration) ✅
- [x] Historical context engine ✅
- [ ] Story editing interface
- [ ] Chapter organization

### Phase 4: Additional Views
- [ ] Timeline view
- [ ] Map view with geocoding
- [ ] Advanced filtering

### Phase 5: Sharing & Polish
- [ ] Share link system
- [ ] PDF export
- [ ] Performance optimization
- [ ] Mobile responsiveness

## Contributing

This is an MVP project. Contributions and feedback are welcome!

## License

[License TBD]

## Support

For questions or issues, please open a GitHub issue.
