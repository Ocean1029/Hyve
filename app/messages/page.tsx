import { getFriendsForMessagesService } from '@/modules/friends/service';
import MessagesClient from '@/components/MessagesClient';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function MessagesPage() {
  const session = await auth();
  
  // If no session, redirect to login
  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;
  const friends = await getFriendsForMessagesService(userId);

  return <MessagesClient friends={friends} />;
}

