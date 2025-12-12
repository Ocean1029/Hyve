import { getFriendListService } from '@/modules/friends/service';
import { getWeeklyFocusChartData } from '@/modules/sessions/service';
import DashboardClient from '@/components/DashboardClient';

export default async function Page() {
  const friends = await getFriendListService();
  const chartData = await getWeeklyFocusChartData('alex-chen');

  return <DashboardClient friends={friends} chartData={chartData} />;
}
