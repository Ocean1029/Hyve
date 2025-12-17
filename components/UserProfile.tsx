'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Calendar, UserPlus, Check, Clock, Users } from 'lucide-react';
import { checkFriendRequestStatus } from '@/modules/friend-requests/actions';
import { sendFriendRequest } from '@/modules/friend-requests/actions';
import { acceptFriendRequest, rejectFriendRequest } from '@/modules/friend-requests/actions';

interface UserProfileProps {
  user: {
    id: string;
    userId?: string;
    name: string | null;
    email?: string | null;
    image?: string | null;
    avatar?: string | null;
    createdAt: Date;
    friendCount?: number;
    _count?: {
      focusSessions?: number;
    };
  };
  onClose: () => void;
  onAddFriend?: (userId: string) => Promise<{ success: boolean; error?: string; alreadyExists?: boolean }>;
  isAlreadyFriend?: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onClose, onAddFriend, isAlreadyFriend = false }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(isAlreadyFriend);
  const [requestStatus, setRequestStatus] = useState<'none' | 'sent' | 'received' | 'accepted' | 'rejected'>('none');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Get the correct user ID (userId if available, otherwise id)
  const targetUserId = user.userId || user.id;

  // Check friend request status on mount
  useEffect(() => {
    const checkStatus = async () => {
      setIsLoadingStatus(true);
      const status = await checkFriendRequestStatus(targetUserId);
      setRequestStatus(status.status as 'none' | 'sent' | 'received' | 'accepted' | 'rejected');
      if ('requestId' in status && status.requestId) {
        setRequestId(status.requestId);
      }
      setIsLoadingStatus(false);
    };
    checkStatus();
  }, [targetUserId]);

  const handleAddFriend = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    console.log('handleAddFriend called', { isAdding, isAdded, requestStatus, targetUserId });
    
    if (isAdding || isAdded || requestStatus !== 'none') {
      console.log('Request blocked by condition:', { isAdding, isAdded, requestStatus });
      return;
    }
    
    setIsAdding(true);
    console.log('Sending friend request to:', targetUserId);
    
    try {
      const result = await sendFriendRequest(targetUserId);
      console.log('Friend request result:', result);
      
      if (result.success) {
        setRequestStatus('sent');
        if (result.request?.id) {
          setRequestId(result.request.id);
        }
      } else {
        // Log error for debugging
        console.error('Failed to send friend request:', result.error);
        alert(result.error || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Failed to send friend request:', error);
      alert('An error occurred while sending the friend request');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!requestId || isAdding) return;
    
    setIsAdding(true);
    try {
      const result = await acceptFriendRequest(requestId);
      if (result.success) {
        setRequestStatus('accepted');
        setIsAdded(true);
        // Refresh the page to show updated friend list
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!requestId || isAdding) return;
    
    setIsAdding(true);
    try {
      const result = await rejectFriendRequest(requestId);
      if (result.success) {
        setRequestStatus('rejected');
        setRequestId(null);
      }
    } catch (error) {
      console.error('Failed to reject friend request:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="absolute inset-0 z-[250] bg-zinc-950/95 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-br from-rose-500/20 via-purple-500/20 to-amber-500/20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-zinc-900/80 backdrop-blur-sm rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Avatar */}
        <div className="relative -mt-16 flex justify-center">
          {user.image ? (
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-zinc-900 bg-zinc-800">
              <Image
                src={user.image}
                alt={user.name || 'User'}
                fill
                className="object-cover"
                sizes="(max-width: 414px) 112px, 112px"
                quality={100}
                unoptimized={!user.image.includes('googleusercontent.com')}
              />
            </div>
          ) : (
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center border-4 border-zinc-900">
              <span className="text-white font-bold text-4xl">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Name and User ID */}
          <div className="text-center">
            <h2 className="text-2xl font-black text-white mb-2">
              {user.name || 'Unknown User'}
            </h2>
            <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
              <span>{user.userId || user.id}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-800/50 rounded-2xl p-4 text-center border border-zinc-800">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-2xl font-black text-white">
                  {user.friendCount ?? 0}
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Friends</p>
            </div>
            <div className="bg-zinc-800/50 rounded-2xl p-4 text-center border border-zinc-800">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-2xl font-black text-white">
                  {user._count?.focusSessions || 0}
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Sessions</p>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <div className="bg-zinc-800/30 rounded-2xl p-4 border border-zinc-800">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-zinc-500" />
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">
                    Joined
                  </p>
                  <p className="text-sm text-white font-medium">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Friend Action Buttons */}
          <div className="space-y-2">
            {isLoadingStatus ? (
              <button
                disabled
                className="w-full py-4 rounded-2xl font-bold text-base bg-zinc-800 text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Loading...
              </button>
            ) : isAdded || isAlreadyFriend ? (
                <button
                  disabled
                  className="w-full py-4 rounded-2xl font-bold text-base bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" />
                    Already Friends
                  </span>
                </button>
              ) : requestStatus === 'sent' ? (
                <button
                  disabled
                  className="w-full py-4 rounded-2xl font-bold text-base bg-amber-500/20 text-amber-400 border-2 border-amber-500/50 disabled:opacity-100 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5" />
                    Request Sent
                  </span>
                </button>
              ) : requestStatus === 'received' && requestId ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleAcceptRequest}
                    disabled={isAdding}
                    className="flex-1 py-4 rounded-2xl font-bold text-base bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdding ? 'Accepting...' : (
                      <span className="flex items-center justify-center gap-2">
                        <Check className="w-5 h-5" />
                        Accept
                      </span>
                    )}
                  </button>
                  <button
                    onClick={handleRejectRequest}
                    disabled={isAdding}
                    className="flex-1 py-4 rounded-2xl font-bold text-base bg-zinc-800 text-zinc-400 hover:bg-zinc-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-5 h-5 mx-auto" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddFriend}
                  disabled={isAdding || requestStatus !== 'none'}
                  className="w-full py-4 rounded-2xl font-bold text-base bg-white text-black hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {isAdding ? (
                    <span className="flex items-center justify-center gap-2">
                      <Clock className="w-5 h-5 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Send Friend Request
                    </span>
                  )}
                </button>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

