import { getMyProfileService } from '@/modules/users/service';
import ProfileClient from '@/components/ProfileClient';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const profileData = await getMyProfileService(session.user.id);

  return <ProfileClient user={profileData} posts={profileData?.posts || []} />;
}

