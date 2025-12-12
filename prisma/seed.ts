import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Clear existing data
  await prisma.interaction.deleteMany();
  await prisma.post.deleteMany();
  await prisma.focusSession.deleteMany();
  await prisma.friend.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Main User (Alex)
  const alex = await prisma.user.create({
    data: {
      id: 'alex-chen',
      name: 'Alex Chen',
      email: 'alex@example.com',
      image: 'https://picsum.photos/100/100?random=99',
    },
  });

  console.log(`Created user: ${alex.name}`);

  // 2. Create My Vault Posts (from MyProfile.tsx)
  const myPosts = [
    { imageUrl: 'https://picsum.photos/300/300?random=101', caption: 'Deep work session' },
    { imageUrl: 'https://picsum.photos/300/300?random=102', caption: 'Library vibes' },
    { imageUrl: 'https://picsum.photos/300/300?random=103', caption: 'Coffee break' },
    { imageUrl: 'https://picsum.photos/300/300?random=104', caption: 'Sunday reset' },
    { imageUrl: 'https://picsum.photos/300/300?random=105', caption: 'Late night study' },
    { imageUrl: 'https://picsum.photos/300/300?random=106', caption: 'Planning' },
    { imageUrl: 'https://picsum.photos/300/300?random=107', caption: 'Sketching' },
    { imageUrl: 'https://picsum.photos/300/300?random=108', caption: 'Finals week' },
    { imageUrl: 'https://picsum.photos/300/300?random=109', caption: 'Focus mode' },
  ];

  for (const post of myPosts) {
    await prisma.post.create({
      data: {
        ...post,
        userId: alex.id,
      },
    });
  }
  console.log(`Created ${myPosts.length} posts for Alex`);

  // 3. Create Focus Sessions (Simulating Chart Data)
  // MOCK_CHART_DATA: Mon: 45, Tue: 120, Wed: 30, Thu: 90, Fri: 180, Sat: 240, Sun: 60
  // We will create one session per day for simplicity
  const today = new Date();
  // Assume today is Sunday to match the chart ending on Sunday? Or just map relative days.
  // Let's create sessions for the last 7 days.
  const chartData = [45, 120, 30, 90, 180, 240, 60]; // Mon to Sun
  
  for (let i = 0; i < 7; i++) {
    const dayOffset = 6 - i; // 0 is today (Sun), 6 is Mon
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    
    await prisma.focusSession.create({
      data: {
        minutes: chartData[i],
        date: date,
        userId: alex.id,
      },
    });
  }
  console.log('Created focus sessions');

  // 4. Create Friends (from page.tsx MOCK_FRIENDS)
  const friendsData = [
    {
      name: 'Kai',
      avatar: 'https://picsum.photos/100/100?random=1',
      totalHours: 42,
      streak: 5,
      bio: 'Architecture student. Coffee addict.',
      interactions: [
        { activity: 'Studio Late Night', date: 'Yesterday', duration: '3h 15m' },
        { activity: 'Lunch', date: '2 days ago', duration: '45m' }
      ],
      posts: [
        { imageUrl: 'https://picsum.photos/300/300?random=11', caption: 'Studio vibes' },
        { imageUrl: 'https://picsum.photos/300/300?random=12', caption: 'Coffee run' }
      ]
    },
    {
      name: 'Sarah',
      avatar: 'https://picsum.photos/100/100?random=2',
      totalHours: 28,
      streak: 2,
      bio: 'Hiking & Photography.',
      interactions: [
        { activity: 'Morning Hike', date: 'Sunday', duration: '2h 30m' }
      ],
      posts: [
        { imageUrl: 'https://picsum.photos/300/300?random=13', caption: 'Sunrise' }
      ]
    },
    {
      name: 'Leo',
      avatar: 'https://picsum.photos/100/100?random=3',
      totalHours: 12,
      streak: 0,
      bio: 'Music production.',
      interactions: [],
      posts: []
    }
  ];

  for (const f of friendsData) {
    const friend = await prisma.friend.create({
      data: {
        name: f.name,
        avatar: f.avatar,
        bio: f.bio,
        totalHours: f.totalHours,
        streak: f.streak,
      },
    });

    // Create Interactions
    for (const interaction of f.interactions) {
      await prisma.interaction.create({
        data: {
          ...interaction,
          friendId: friend.id,
        },
      });
    }

    // Create Friend Posts
    for (const post of f.posts) {
      await prisma.post.create({
        data: {
          ...post,
          friendId: friend.id,
        },
      });
    }
  }
  console.log(`Created ${friendsData.length} friends`);

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

