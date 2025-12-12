import { getMyProfileService } from '@/modules/users/service';
import ProfileClient from '@/components/ProfileClient';

export default async function ProfilePage() {
  // Hardcoded user ID for now
  const profileData = await getMyProfileService('alex-chen');

  return <ProfileClient user={profileData} posts={profileData?.posts || []} />;
}

