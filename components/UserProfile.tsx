'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Calendar, Image as ImageIcon, UserPlus, Check } from 'lucide-react';

interface UserProfileProps {
  user: {
    id: string;
    userId?: string;
    name: string | null;
    email?: string | null;
    image?: string | null;
    createdAt: Date;
    _count?: {
      posts: number;
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

  const handleAddFriend = async () => {
    if (!onAddFriend || isAdding || isAdded) return;
    
    setIsAdding(true);
    try {
      const result = await onAddFriend(user.id);
      if (result.success) {
        setIsAdded(true);
      } else if (result.alreadyExists) {
        setIsAdded(true);
      }
    } catch (error) {
      console.error('Failed to add friend:', error);
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
          {user._count && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-800/50 rounded-2xl p-4 text-center border border-zinc-800">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <ImageIcon className="w-4 h-4 text-rose-400" />
                  <span className="text-2xl font-black text-white">
                    {user._count.posts}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Posts</p>
              </div>
              <div className="bg-zinc-800/50 rounded-2xl p-4 text-center border border-zinc-800">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-2xl font-black text-white">
                    {user._count.focusSessions || 0}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Sessions</p>
              </div>
            </div>
          )}

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

          {/* Add Friend Button */}
          {onAddFriend && (
            <button
              onClick={handleAddFriend}
              disabled={isAdding || isAdded}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
                isAdded
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-black hover:bg-zinc-200 active:scale-[0.98]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isAdding ? (
                'Adding...'
              ) : isAdded || isAlreadyFriend ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
                  {isAlreadyFriend ? 'Already Friends' : 'Added as Friend'}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Add as Friend
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

