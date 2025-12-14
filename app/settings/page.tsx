import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import SettingsClient from '@/components/SettingsClient';
import { getUserWithPosts } from '@/modules/users/repository';

export default async function SettingsPage() {
  const session = await auth();
  
  // If no session, redirect to login
  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;
  const user = await getUserWithPosts(userId);

  if (!user) {
    redirect('/login');
  }

  return <SettingsClient user={user} />;
}

