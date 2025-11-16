import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestData() {
  try {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: '$2a$10$X1234567890', // dummy hash
        name: 'Test User',
      },
    });

    console.log('Created user:', user.id);

    // Create a test project
    const project = await prisma.project.create({
      data: {
        name: 'The Brown Family',
        description: 'A test genealogy project',
        userId: user.id,
        stats: {
          totalIndividuals: 2,
          totalFamilies: 1,
          dateRange: {
            earliest: '1826-01-01',
            latest: '1896-01-01',
          },
          topSurnames: [{ surname: 'Brown', count: 1 }],
          topLocations: [
            { location: 'Monroe Township, Harrison County, Ohio, USA', count: 2 },
          ],
          generations: 2,
        },
      },
    });

    console.log('Created project:', project.id);

    // Create test individual (Joshua Brown)
    const joshua = await prisma.individual.create({
      data: {
        projectId: project.id,
        gedcomId: 'I001',
        givenName: 'Joshua',
        surname: 'Brown',
        fullName: 'Joshua Brown',
        gender: 'M',
        birthDate: '1826-01-01',
        birthPlace: 'Monroe Township, Harrison County, Ohio, USA',
        deathDate: '1896-01-01',
        deathPlace: 'Monroe Township, Harrison County, Ohio, USA',
        occupation: 'Farmer',
        notes: 'Local family tradition says the Browns came from Pennsylvania.',
      },
    });

    console.log('Created individual:', joshua.id);

    // Create spouse (Nancy Chaney)
    const nancy = await prisma.individual.create({
      data: {
        projectId: project.id,
        gedcomId: 'I002',
        givenName: 'Nancy',
        surname: 'Chaney',
        fullName: 'Nancy Chaney',
        gender: 'F',
        birthDate: '1828-01-01',
        birthPlace: 'Harrison County, Ohio, USA',
      },
    });

    console.log('Created spouse:', nancy.id);

    // Create family relationship
    const family = await prisma.family.create({
      data: {
        projectId: project.id,
        gedcomId: 'F001',
        husbandId: joshua.id,
        wifeId: nancy.id,
        marriageDate: '1849-01-01',
        marriagePlace: 'Harrison County, Ohio, USA',
      },
    });

    console.log('Created family:', family.id);

    // Create some events
    await prisma.event.create({
      data: {
        projectId: project.id,
        individualId: joshua.id,
        type: 'census',
        date: '1870-06-01',
        place: 'Monroe Township, Harrison County, Ohio, USA',
        description: 'Census record showing Joshua as farmer with household of 8',
      },
    });

    console.log('Created census event');

    console.log('\n✅ Test data created successfully!');
    console.log('\nTest Individual ID (use this for API calls):', joshua.id);
    console.log('Test Project ID:', project.id);

    return { userId: user.id, projectId: project.id, individualId: joshua.id };
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData();
