import prisma from '@/lib/prisma';

/**
 * Get user by ID with basic profile fields (id = primary key)
 */
export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      name: true,
      email: true,
      image: true,
      privacy: true,
    },
  });
}

/**
 * Get user by userId (custom ID field)
 */
export async function getUserByUserId(userId: string) {
  return prisma.user.findUnique({
    where: { userId },
  });
}

/**
 * Get user stats: session count, memory count, total minutes
 */
export async function getUserStats(userId: string) {
  const [totalSessions, totalMemories, totalMinutes] = await Promise.all([
    prisma.focusSession.count({
      where: {
        users: { some: { userId } },
      },
    }),
    prisma.memory.count({ where: { userId } }),
    prisma.focusSession.aggregate({
      where: {
        users: { some: { userId } },
      },
      _sum: { minutes: true },
    }),
  ]);

  return {
    totalSessions,
    totalMemories,
    totalMinutes: totalMinutes._sum.minutes || 0,
  };
}


/**
 * Update user by ID
 */
export async function updateUserById(
  userId: string,
  data: {
    name?: string;
    email?: string;
    image?: string;
    userId?: string;
    privacy?: string;
  }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}



