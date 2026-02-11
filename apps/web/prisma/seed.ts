import prisma from '../lib/prisma';

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

  // 2. Create Focus Sessions (Simulating Chart Data) - only if they don't exist
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
    
    // Use fixed session IDs: session-1, session-2, etc.
    const sessionId = `session-${i + 1}`;
    
    // Check if session with this ID already exists
    const existingSession = await prisma.focusSession.findUnique({
      where: { id: sessionId },
      include: {
        users: true,
      },
    });

    if (!existingSession) {
      const session = await prisma.focusSession.create({
        data: {
          id: sessionId,
          minutes: chartData[i],
          startTime: date,
          endTime: new Date(date.getTime() + chartData[i] * 60 * 1000),
          status: 'completed',
          users: {
            create: {
              userId: alex.id,
            },
          },
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
      id: 'kai-user',
      name: 'Kai',
      email: 'kai@example.com',
      image: 'https://picsum.photos/100/100?random=1',
      totalHours: 42,
      streak: 5,
      interactions: [
        { activity: 'Studio Late Night', date: 'Yesterday', duration: '3h 15m' },
        { activity: 'Lunch', date: '2 days ago', duration: '45m' }
      ],
    },
    {
      id: 'sarah-user',
      name: 'Sarah',
      email: 'sarah@example.com',
      image: 'https://picsum.photos/100/100?random=2',
      totalHours: 28,
      streak: 2,
      interactions: [
        { activity: 'Morning Hike', date: 'Sunday', duration: '2h 30m' }
      ],
    },
    {
      id: 'leo-user',
      name: 'Leo',
      email: 'leo@example.com',
      image: 'https://picsum.photos/100/100?random=3',
      totalHours: 12,
      streak: 0,
      interactions: [],
    }
  ];

  let createdFriendsCount = 0;
  for (const f of friendsData) {
    // Create or get User for this friend with fixed ID
    // First, check if user exists by email (in case it was created with a different ID)
    const existingByEmail = await prisma.user.findUnique({
      where: { email: f.email },
    });

    // If user exists with different ID, we need to delete it first to recreate with fixed ID
    if (existingByEmail && existingByEmail.id !== f.id) {
      // Delete the existing user (cascade will handle related records)
      await prisma.user.delete({
        where: { id: existingByEmail.id },
      });
    }

    // Now upsert with fixed ID
    const friendUser = await prisma.user.upsert({
      where: { id: f.id },
      update: {
        // Update if user exists but fields are missing
        name: f.name,
        email: f.email,
        image: f.image,
        userId: f.id, // Ensure userId matches id
      },
      create: {
        id: f.id,
        name: f.name,
        email: f.email,
        image: f.image,
        userId: f.id, // Set to id, will be handled by Prisma extension in lib/prisma.ts
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

    // Create FocusSessionUser relationships and Memories
    // For each interaction, create a focus session and link it to the users
    for (const interaction of f.interactions) {
      // Find or create a focus session for this interaction
      // Use the most recent session or create a new one
      let focusSession = createdSessions[createdSessions.length - 1]; // Use the most recent session
      
      if (!focusSession) {
        // Create a new focus session if none exists
        // Use a fixed ID based on friend and interaction index
        const sessionDate = new Date();
        sessionDate.setDate(sessionDate.getDate() - 1); // Yesterday
        const sharedSessionId = `session-shared-${friendUser.id}-${createdFriendsCount}`;
        focusSession = await prisma.focusSession.upsert({
          where: { id: sharedSessionId },
          update: {},
          create: {
            id: sharedSessionId,
            minutes: 30, // Default duration
            startTime: sessionDate,
            endTime: new Date(sessionDate.getTime() + 30 * 60 * 1000),
            status: 'completed',
          },
        });
        
        // Add users to the session if not already added
        const existingUser1 = await prisma.focusSessionUser.findUnique({
          where: {
            focusSessionId_userId: {
              focusSessionId: focusSession.id,
              userId: alex.id,
            },
          },
        });
        if (!existingUser1) {
          await prisma.focusSessionUser.create({
            data: {
              focusSessionId: focusSession.id,
              userId: alex.id,
            },
          });
        }
        
        const existingUser2 = await prisma.focusSessionUser.findUnique({
          where: {
            focusSessionId_userId: {
              focusSessionId: focusSession.id,
              userId: friend.userId,
            },
          },
        });
        if (!existingUser2) {
          await prisma.focusSessionUser.create({
            data: {
              focusSessionId: focusSession.id,
              userId: friend.userId,
            },
          });
        }
        
        createdSessions.push(focusSession);
      }
      
      // Ensure both users are in the session
      const existingUsers = await prisma.focusSessionUser.findMany({
        where: {
          focusSessionId: focusSession.id,
        },
      });
      
      const userIds = existingUsers.map((u: typeof existingUsers[0]) => u.userId);
      if (!userIds.includes(alex.id)) {
        await prisma.focusSessionUser.create({
          data: {
            focusSessionId: focusSession.id,
            userId: alex.id,
          },
        });
      }
      if (!userIds.includes(friend.userId)) {
        await prisma.focusSessionUser.create({
          data: {
            focusSessionId: focusSession.id,
            userId: friend.userId,
          },
        });
      }
      
      // Create Memory for this interaction
      // Note: Memory type should use vibe check values (e.g., '📚 Study') instead of 'note'
      const existingMemory = await prisma.memory.findFirst({
        where: {
          focusSessionId: focusSession.id,
          userId: alex.id, // Memories belong to specific users
          content: interaction.activity,
        },
      });
      
      if (!existingMemory) {
        await prisma.memory.create({
          data: {
            type: '📚 Study', // Use vibe check value instead of 'note'
            content: interaction.activity,
            timestamp: focusSession.startTime,
            focusSessionId: focusSession.id,
            userId: alex.id, // Assign to alex
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

