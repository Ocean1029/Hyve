// apps/web/modules/profile/service.ts
import prisma from '@/lib/prisma';

interface LatestHangout {
  friendName: string;
  date: string;
  location: string;
  durationMinutes: number;
  imageUrl: string | null;
}

interface SpotRanking {
  name: string;
  visits: number;
}

interface ActivityBreakdown {
  label: string;
  hours: number;
}

export interface ProfileInsights {
  latestHangout: LatestHangout | null;
  spotRanking: SpotRanking[];
  activityBreakdown: ActivityBreakdown[];
}

/**
 * Get the user's most recent completed session.
 * Prefers multi-user sessions, falls back to solo sessions.
 */
async function getLatestHangout(userId: string): Promise<LatestHangout | null> {
  const session = await prisma.focusSession.findFirst({
    where: {
      status: 'completed',
      users: { some: { userId } },
    },
    orderBy: { endTime: 'desc' },
    include: {
      users: {
        include: {
          user: { select: { name: true } },
        },
      },
      memories: {
        where: { userId },
        select: {
          location: true,
          photos: { select: { photoUrl: true }, take: 1 },
        },
        take: 1,
      },
    },
  });

  if (!session) return null;

  const otherUser = session.users.find((u) => u.userId !== userId);
  const friendName = otherUser?.user.name ?? 'Solo';
  const memory = session.memories[0] ?? null;

  return {
    friendName,
    date: session.endTime.toISOString(),
    location: memory?.location ?? 'Unknown',
    durationMinutes: session.minutes,
    imageUrl: memory?.photos?.[0]?.photoUrl ?? null,
  };
}

/**
 * Get top locations by visit count.
 * Tries Memory.location first, falls back to counting sessions per Memory.type.
 */
async function getSpotRanking(userId: string): Promise<SpotRanking[]> {
  // Primary: group by Memory.location
  const locationRows = await prisma.memory.groupBy({
    by: ['location'],
    where: {
      userId,
      location: { not: null },
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  });

  const fromLocation = locationRows
    .filter((r) => r.location)
    .map((r) => ({
      name: r.location!,
      visits: r._count.id,
    }));

  if (fromLocation.length > 0) return fromLocation;

  // Fallback: group by Memory.type (activity category) as proxy
  const typeRows = await prisma.memory.groupBy({
    by: ['type'],
    where: { userId },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  });

  return typeRows.map((r) => ({
    name: stripEmoji(r.type),
    visits: r._count.id,
  }));
}

/**
 * Get activity type breakdown with total hours from user's memories.
 */
async function getActivityBreakdown(userId: string): Promise<ActivityBreakdown[]> {
  const rows = await prisma.$queryRaw<
    { label: string; totalMinutes: bigint }[]
  >`
    SELECT m."type" AS label, COALESCE(SUM(fs."minutes"), 0) AS "totalMinutes"
    FROM "Memory" m
    JOIN "FocusSession" fs ON fs."id" = m."focusSessionId"
    WHERE m."userId" = ${userId}
    GROUP BY m."type"
    ORDER BY "totalMinutes" DESC
    LIMIT 5
  `;

  return rows.map((r) => ({
    label: stripEmoji(r.label),
    hours: Math.round(Number(r.totalMinutes) / 60),
  }));
}

/**
 * Strip leading emoji from Memory.type values like "📚 Study" → "Study"
 */
function stripEmoji(text: string): string {
  return text.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, '').trim() || text;
}

/**
 * Aggregate all profile insight data for a user.
 */
export async function getProfileInsights(userId: string): Promise<ProfileInsights> {
  const [latestHangout, spotRanking, activityBreakdown] = await Promise.all([
    getLatestHangout(userId),
    getSpotRanking(userId),
    getActivityBreakdown(userId),
  ]);

  return { latestHangout, spotRanking, activityBreakdown };
}
