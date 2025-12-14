import SearchClient from '@/components/SearchClient';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function SearchPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  return <SearchClient />;
}



