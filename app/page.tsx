import { getFriendListService } from '@/modules/friends/service';
import { getWeeklyFocusChartData } from '@/modules/sessions/service';
import DashboardClient from '@/components/DashboardClient';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await auth();
  
  // If no session, redirect to login (though middleware should handle this)
  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;
  const friends = await getFriendListService();
  const chartData = await getWeeklyFocusChartData(userId);

  return <DashboardClient friends={friends} chartData={chartData} userId={userId} />;
}
