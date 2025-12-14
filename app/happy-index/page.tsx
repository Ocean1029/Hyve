import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import HappyIndexClient from './HappyIndexClient';
import {
  getWeeklyHappyIndexData,
  getPeakHappinessMemories,
} from '@/modules/memories/service';

export default async function HappyIndexPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;
  const [weeklyData, peakMemories] = await Promise.all([
    getWeeklyHappyIndexData(userId),
    getPeakHappinessMemories(userId, 5),
  ]);

  return (
    <HappyIndexClient
      userId={userId}
      weeklyData={weeklyData}
      peakMemories={peakMemories}
    />
  );
}

