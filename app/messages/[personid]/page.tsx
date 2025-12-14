import { getFriendByIdService } from '@/modules/friends/service';
import ChatInterfaceClient from '@/components/ChatInterfaceClient';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

interface ChatPageProps {
  params: Promise<{
    personid: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const session = await auth();
  
  // If no session, redirect to login
  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;
  const { personid: friendId } = await params;

  // Get friend data and verify it belongs to the current user
  const friend = await getFriendByIdService(friendId, userId);

  if (!friend) {
    // Friend not found or doesn't belong to current user
    notFound();
  }

  return <ChatInterfaceClient friend={friend} userId={userId} />;
}
