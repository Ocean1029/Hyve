import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import HappyIndexClient from './HappyIndexClient';
import {
  getWeeklyHappyIndexData,
  getPeakHappinessMemories,
} from '@/modules/memories/actions';

export default async function HappyIndexPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;
  const [weeklyResult, peakResult] = await Promise.all([
    getWeeklyHappyIndexData(),
    getPeakHappinessMemories(5),
  ]);

  const weeklyData = weeklyResult.success ? weeklyResult.data : [];
  const peakMemories = peakResult.success ? peakResult.data : [];

  return (
    <HappyIndexClient
      userId={userId}
      weeklyData={weeklyData}
      peakMemories={peakMemories}
    />
  );
}

