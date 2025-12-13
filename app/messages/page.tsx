import { getFriendsForMessagesService } from '@/modules/friends/service';
import MessagesClient from '@/components/MessagesClient';

export default async function MessagesPage() {
  const friends = await getFriendsForMessagesService();

  return <MessagesClient friends={friends} />;
}

