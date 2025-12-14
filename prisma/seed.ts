import prisma from '@/lib/prisma';

async function main() {
  console.log('Start seeding ...');

  // 1. Create or get Main User (Alex) - using upsert to avoid deleting existing data
  const alex = await prisma.user.upsert({
    where: { id: 'alex-chen' },
    update: {
      // Only update if user exists but fields are missing
      name: 'Alex Chen',
      email: 'alex@example.com',
      image: 'https://picsum.photos/100/100?random=99',
    },
    create: {
      id: 'alex-chen',
      name: 'Alex Chen',
      email: 'alex@example.com',
      image: 'https://picsum.photos/100/100?random=99',
      userId: 'alex-chen', // Set to id, will be handled by Prisma extension in lib/prisma.ts
    },
  });

  console.log(`User ${alex.name} ready (existing or created)`);

  // 2. Create My Vault Posts (from MyProfile.tsx) - only if they don't exist
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

  let createdPostsCount = 0;
  for (const post of myPosts) {
    // Check if post with same imageUrl and userId already exists
    const existingPost = await prisma.post.findFirst({
      where: {
        userId: alex.id,
        imageUrl: post.imageUrl,
      },
    });

    if (!existingPost) {
      await prisma.post.create({
        data: {
          ...post,
          userId: alex.id,
        },
      });
      createdPostsCount++;
    }
  }
  console.log(`Created ${createdPostsCount} new posts for Alex (${myPosts.length - createdPostsCount} already existed)`);

  // 3. Create Focus Sessions (Simulating Chart Data) - only if they don't exist
  // MOCK_CHART_DATA: Mon: 45, Tue: 120, Wed: 30, Thu: 90, Fri: 180, Sat: 240, Sun: 60
  // We will create one session per day for simplicity
  const today = new Date();
  const chartData = [45, 120, 30, 90, 180, 240, 60]; // Mon to Sun
  
  // Store created sessions for later use in creating memories
  const createdSessions: any[] = [];
  let createdSessionsCount = 0;
  
  for (let i = 0; i < 7; i++) {
    const dayOffset = 6 - i; // 0 is today (Sun), 6 is Mon
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    date.setHours(14, 0, 0, 0); // Set to 2 PM
    
    // Check if session for this date and user already exists
    const existingSession = await prisma.focusSession.findFirst({
      where: {
        userId: alex.id,
        startTime: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
      },
    });

    if (!existingSession) {
      const session = await prisma.focusSession.create({
        data: {
          minutes: chartData[i],
          startTime: date,
          endTime: new Date(date.getTime() + chartData[i] * 60 * 1000),
          userId: alex.id,
        },
      });
      createdSessions.push(session);
      createdSessionsCount++;
    } else {
      createdSessions.push(existingSession);
    }
  }
  console.log(`Created ${createdSessionsCount} new focus sessions (${7 - createdSessionsCount} already existed)`);

  // 4. Create Friends (from page.tsx MOCK_FRIENDS)
  // First, create User records for each friend
  const friendsData = [
    {
      name: 'Kai',
      email: 'kai@example.com',
      image: 'https://picsum.photos/100/100?random=1',
      totalHours: 42,
      streak: 5,
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
      email: 'sarah@example.com',
      image: 'https://picsum.photos/100/100?random=2',
      totalHours: 28,
      streak: 2,
      interactions: [
        { activity: 'Morning Hike', date: 'Sunday', duration: '2h 30m' }
      ],
      posts: [
        { imageUrl: 'https://picsum.photos/300/300?random=13', caption: 'Sunrise' }
      ]
    },
    {
      name: 'Leo',
      email: 'leo@example.com',
      image: 'https://picsum.photos/100/100?random=3',
      totalHours: 12,
      streak: 0,
      interactions: [],
      posts: []
    }
  ];

  let createdFriendsCount = 0;
  for (const f of friendsData) {
    // Create or get User for this friend
    const friendUser = await prisma.user.upsert({
      where: { email: f.email },
      update: {
        // Update if user exists but fields are missing
        name: f.name,
        image: f.image,
      },
      create: {
        name: f.name,
        email: f.email,
        image: f.image,
        userId: '', // Temporary value, will be set to id by Prisma extension in lib/prisma.ts
      },
    });

    // Create or get Friend relationship (Alex added this user as a friend)
    const friend = await prisma.friend.upsert({
      where: {
        userId_sourceUserId: {
          userId: friendUser.id,
          sourceUserId: alex.id,
        },
      },
      update: {
        // Update if friend relationship exists
        totalHours: f.totalHours,
        streak: f.streak,
      },
      create: {
        userId: friendUser.id,
        sourceUserId: alex.id, // Alex is the one who added these friends
        totalHours: f.totalHours,
        streak: f.streak,
      },
    });

    // Create FocusSessionFriend relationships and Memories
    // For each interaction, create a focus session and link it to the friend
    for (const interaction of f.interactions) {
      // Find or create a focus session for this interaction
      // Use the most recent session or create a new one
      let focusSession = createdSessions[createdSessions.length - 1]; // Use the most recent session
      
      if (!focusSession) {
        // Create a new focus session if none exists
        const sessionDate = new Date();
        sessionDate.setDate(sessionDate.getDate() - 1); // Yesterday
        focusSession = await prisma.focusSession.create({
          data: {
            minutes: 30, // Default duration
            startTime: sessionDate,
            endTime: new Date(sessionDate.getTime() + 30 * 60 * 1000),
            userId: alex.id,
          },
        });
        createdSessions.push(focusSession);
      }
      
      // Create FocusSessionFriend relationship if it doesn't exist
      const existingFSF = await prisma.focusSessionFriend.findFirst({
        where: {
          focusSessionId: focusSession.id,
          friendId: friend.id,
        },
      });
      
      if (!existingFSF) {
        await prisma.focusSessionFriend.create({
          data: {
            focusSessionId: focusSession.id,
            friendId: friend.id,
          },
        });
      }
      
      // Create Memory for this interaction
      const existingMemory = await prisma.memory.findFirst({
        where: {
          focusSessionId: focusSession.id,
          type: 'note',
          content: interaction.activity,
        },
      });
      
      if (!existingMemory) {
        await prisma.memory.create({
          data: {
            type: 'note',
            content: interaction.activity,
            timestamp: focusSession.startTime,
            focusSessionId: focusSession.id,
          },
        });
      }
    }

    // Create Friend Posts - only if they don't exist
    for (const post of f.posts) {
      const existingPost = await prisma.post.findFirst({
        where: {
          friendId: friend.id,
          imageUrl: post.imageUrl,
        },
      });

      if (!existingPost) {
        await prisma.post.create({
          data: {
            ...post,
            friendId: friend.id,
          },
        });
      }
    }

    createdFriendsCount++;
  }
  console.log(`Processed ${createdFriendsCount} friends (created or updated)`);

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

