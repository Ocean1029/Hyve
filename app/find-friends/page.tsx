import FindFriendsClient from '@/components/friends/FindFriendsClient';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function FindFriendsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return <FindFriendsClient />;
}

