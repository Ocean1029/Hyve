'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Loader2, AlertCircle, Users, Send } from 'lucide-react';
import { findNearbyOnlineUsers, updateUserLocation } from '@/modules/locations/actions';
import { sendFriendRequest, checkFriendRequestStatus } from '@/modules/friend-requests/actions';
import { checkIfUserIsFriend } from '@/modules/friends/actions';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { formatDistance } from '@hyve/utils';
import BottomNav from '@/components/common/BottomNav';
import UserProfile from '@/components/profile/UserProfile';

type NearbyUser = {
  id: string;
  userId: string;
  name: string | null;
  image: string | null;
  distance: number;
  isOnline: boolean;
  lastSeenAt: Date | null;
};

const FindFriendsClient: React.FC = () => {
  const router = useRouter();
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    'idle' | 'requesting' | 'granted' | 'denied'
  >('idle');
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [requestStatuses, setRequestStatuses] = useState<Record<string, string>>({});
  const [friendStatuses, setFriendStatuses] = useState<Record<string, boolean>>({});

  useSwipeNavigation({
    currentPath: '/find-friends',
    enabled: true,
  });

  // Function to update location and find nearby users
  const updateLocationAndFindUsers = async (showLoading: boolean = false) => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    if (showLoading) {
      setPermissionStatus('requesting');
      setIsLoading(true);
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setPermissionStatus('granted');
        const { latitude, longitude } = position.coords;

        // Create a new location record
        await updateUserLocation(latitude, longitude);

        // Find nearby online users
        const result = await findNearbyOnlineUsers(latitude, longitude, 1);
        if (result.success && result.users) {
          setNearbyUsers(result.users);

          // Check friend request statuses and friend statuses for each user
          const statusPromises = result.users.map(async (user: NearbyUser) => {
            const [requestStatus, friendStatus] = await Promise.all([
              checkFriendRequestStatus(user.id),
              checkIfUserIsFriend(user.id),
            ]);
            return {
              userId: user.id,
              requestStatus: requestStatus.status,
              isFriend: friendStatus.isFriend,
            };
          });

          const statuses = await Promise.all(statusPromises);
          const requestStatusMap: Record<string, string> = {};
          const friendStatusMap: Record<string, boolean> = {};

          statuses.forEach(({ userId, requestStatus, isFriend }) => {
            requestStatusMap[userId] = requestStatus;
            friendStatusMap[userId] = isFriend;
          });

          setRequestStatuses(requestStatusMap);
          setFriendStatuses(friendStatusMap);
        }
        setIsLoading(false);
      },
      (error) => {
        setPermissionStatus('denied');
        setIsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied. Please enable location access to find nearby friends.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Initial location request and find nearby users
  // Location tracking is handled globally by LocationTracker component
  useEffect(() => {
    updateLocationAndFindUsers(true);
  }, []);

  const handleSendRequest = async (userId: string): Promise<{ success: boolean; error?: string; alreadyExists?: boolean }> => {
    const result = await sendFriendRequest(userId);
    if (result.success) {
      setRequestStatuses((prev) => ({ ...prev, [userId]: 'sent' }));
      router.refresh();
    }
    return result;
  };

  const handleUserClick = (user: NearbyUser) => {
    setSelectedUser(user);
  };

  return (
    <div className="w-full h-dvh bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-[414px] bg-zinc-950 relative overflow-hidden shadow-2xl border-x border-zinc-900/50">
        {/* Header */}
        <div className="p-6 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md">
          <h1 className="text-2xl font-black text-white mb-2">Find Friends</h1>
          <p className="text-zinc-500 text-sm font-medium">
            Discover people nearby who are online
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-40">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-zinc-500 animate-spin mb-3" />
              <p className="text-zinc-500 text-sm font-medium">
                {permissionStatus === 'requesting'
                  ? 'Requesting location...'
                  : 'Finding nearby friends...'}
              </p>
            </div>
          ) : locationError ? (
            <div className="flex flex-col items-center justify-center h-64 px-6">
              <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
              <p className="text-rose-400 text-sm font-medium text-center mb-2">
                {locationError}
              </p>
              <button
                onClick={() => {
                  setLocationError(null);
                  setPermissionStatus('idle');
                  window.location.reload();
                }}
                className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-full text-sm font-bold hover:bg-rose-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : nearbyUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Users className="w-12 h-12 text-zinc-700 mb-3" />
              <p className="text-zinc-500 text-sm font-medium">
                No nearby friends found
              </p>
              <p className="text-zinc-700 text-xs mt-1">
                Make sure location services are enabled
              </p>
            </div>
          ) : (
            <div className="px-6 pt-4 space-y-3">
              {nearbyUsers.map((user) => {
                const requestStatus = requestStatuses[user.id] || 'none';
                const isFriend = friendStatuses[user.id] || false;
                const canSendRequest =
                  !isFriend && requestStatus === 'none';

                return (
                  <div
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all cursor-pointer group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0 relative">
                        {user.image ? (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-zinc-800 group-hover:border-zinc-700">
                            <Image
                              src={user.image}
                              alt={user.name || 'User'}
                              fill
                              className="object-cover"
                              sizes="48px"
                              unoptimized={!user.image.includes('googleusercontent.com')}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {(user.name || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {/* Online indicator */}
                        {user.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-zinc-950"></div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-sm truncate">
                          {user.name || 'Unknown User'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-3 h-3 text-zinc-500" />
                          <p className="text-zinc-500 text-xs font-medium">
                            {formatDistance(user.distance)}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        {isFriend ? (
                          <div className="px-3 py-1.5 bg-zinc-800 text-zinc-400 text-xs font-bold rounded-full">
                            Friend
                          </div>
                        ) : requestStatus === 'sent' ? (
                          <div className="px-3 py-1.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full border border-amber-500/30">
                            Sent
                          </div>
                        ) : canSendRequest ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendRequest(user.id);
                            }}
                            className="px-3 py-1.5 bg-rose-500 text-white text-xs font-bold rounded-full hover:bg-rose-600 transition-colors flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            Invite
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* User Profile Modal */}
        {selectedUser && (
          <UserProfile
            user={{
              id: selectedUser.id,
              userId: selectedUser.userId,
              name: selectedUser.name,
              email: null,
              image: selectedUser.image,
              avatar: selectedUser.image,
              createdAt: new Date(),
            }}
            onClose={() => setSelectedUser(null)}
            onAddFriend={handleSendRequest}
            isAlreadyFriend={friendStatuses[selectedUser.id] || false}
          />
        )}

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
};

export default FindFriendsClient;

