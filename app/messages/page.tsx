import { getFriendListService } from '@/modules/friends/service';
import MessagesClient from '@/components/MessagesClient';

export default async function MessagesPage() {
  const friends = await getFriendListService();

  return <MessagesClient friends={friends} />;
}

