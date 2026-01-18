import { getFriendListService } from '@/modules/friends/service';
import { getWeeklyFocusMinutesService } from '@/modules/sessions/service';
import { getUserWithPosts } from '@/modules/users/repository';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await auth();
  
  // If no session, redirect to login
  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;
  const [friends, chartData, user] = await Promise.all([
    getFriendListService(userId),
    getWeeklyFocusMinutesService(userId),
    getUserWithPosts(userId),
  ]);

  return <DashboardClient friends={friends} chartData={chartData} userId={userId} user={user} />;
}
