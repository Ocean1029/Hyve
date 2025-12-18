
'use client';

import React, { useEffect, useState } from 'react';
import { Clock, MapPin, Users, Activity, Flame, Camera, Edit, Star } from 'lucide-react';
import { getTodayFocusSessions } from '@/modules/sessions/actions';
import PostMemory from './PostMemory';
import { createMemoryWithPhoto } from '@/modules/memories/actions';

interface TodayDetailsProps {
  userId: string;
  onClose?: () => void;
}

interface TodaySession {
  id: string;
  startTime: Date;
  endTime: Date;
  minutes: number;
  friends: Array<{
    friend: {
      id: string;
      user: {
        name: string | null;
        image: string | null;
      };
    };
  }>;
  memories: Array<{
    id: string;
    content: string | null;
    location: string | null;
    happyIndex: number | null;
    photos: Array<{
      id: string;
      photoUrl: string;
    }>;
  }>;
}

const TodayDetails: React.FC<TodayDetailsProps> = ({ userId, onClose }) => {
  const [sessions, setSessions] = useState<TodaySession[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSession, setEditingSession] = useState<TodaySession | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadTodaySessions = async () => {
    setIsLoading(true);
    try {
      const result = await getTodayFocusSessions(userId);
      if (result.success && result.sessions) {
        setSessions(result.sessions as TodaySession[]);
        setTotalMinutes(result.totalMinutes || 0);
      }
    } catch (error) {
      console.error('Failed to load today sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTodaySessions();
  }, [userId]);

  const handleEditSession = (session: TodaySession) => {
    setEditingSession(session);
  };

  const handleCreateMemory = async (
    photoUrl?: string | string[],
    eventName?: string,
    caption?: string,
    location?: string,
    mood?: string,
    happyIndex?: number
  ) => {
    if (!editingSession) return;

    setIsSaving(true);
    try {
      // Create memory with photo
      // eventName is stored as content, caption is for additional description
      const result = await createMemoryWithPhoto(
        editingSession.id,
        photoUrl,
        eventName, // eventName goes to content field
        location,
        happyIndex
      );

      if (result.success) {
        setEditingSession(null);
        loadTodaySessions();
      } else {
        console.error('Failed to create memory:', result.error);
        alert(result.error || 'Failed to create memory. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create memory:', error);
      alert('An error occurred while creating the memory. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate score based on duration and participants
  // Base score: 10 points
  // Duration: up to 60 points (1 point per minute, capped at 60)
  // Participants: up to 30 points (10 points per participant, capped at 30)
  const calculateScore = (minutes: number, friendsCount: number): number => {
    const baseScore = 10;
    const durationScore = Math.min(60, minutes);
    const participantScore = Math.min(30, friendsCount * 10);
    return Math.min(100, baseScore + durationScore + participantScore);
  };

  // Calculate total score for all sessions
  const calculateTotalScore = (): number => {
    if (sessions.length === 0) return 0;
    const totalScore = sessions.reduce((sum, session) => {
      return sum + calculateScore(session.minutes, session.friends.length);
    }, 0);
    return Math.round(totalScore / sessions.length);
  };

  // Format time display in 24-hour format
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Format total time
  const formatTotalTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Get today's date string (e.g., "October 24")
  const todayDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  const totalScore = calculateTotalScore();

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 overflow-y-auto scrollbar-hide">
      
      {/* Immersive Header */}
      <div className="relative h-64 flex-shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-rose-900/40 via-zinc-950 to-zinc-950"></div>
        
        <div className="absolute top-0 left-0 right-0 pt-12 pb-6 px-6 flex justify-center items-center z-20">
          <div className="flex flex-col items-center text-center">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">{todayDate}</span>
            <h1 className="text-3xl font-black text-white tracking-tight">Today's Focus</h1>
          </div>
        </div>

        {/* Daily Stats Overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 z-20 flex gap-4">
          <div className="flex-1 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-4 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center gap-2 text-rose-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Time</span>
            </div>
            <span className="text-2xl font-mono font-bold text-white tracking-tighter">
              {isLoading ? '...' : formatTotalTime(totalMinutes)}
            </span>
          </div>
          <div className="flex-1 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-4 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Score</span>
            </div>
            <span className="text-2xl font-mono font-bold text-white tracking-tighter">
              {isLoading ? '...' : `${totalScore}/100`}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Timeline */}
      <div className="flex-1 px-6 pt-4 pb-24 relative">
        <div className="absolute top-0 bottom-0 left-[29px] w-[2px] bg-gradient-to-b from-rose-500 via-zinc-800 to-zinc-900"></div>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-zinc-500 text-sm">Loading sessions...</p>
          </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-10">
            {sessions.map((session) => {
              const participants = session.friends.map(f => f.friend.user.name || 'Unknown');
              // Get activity name from first memory's content, or use default
              const activityName = session.memories?.[0]?.content || 'Focus Session';
              // Get location from first memory that has location
              const location = session.memories?.find(m => m.location)?.location || null;
              // Get last memory's happyIndex
              const lastMemory = session.memories?.[session.memories.length - 1];
              const happyIndex = lastMemory?.happyIndex ?? null;
              // Get photos from all memories (max 2)
              const allPhotos = session.memories?.flatMap(m => m.photos || []) || [];
              const displayPhotos = allPhotos.slice(0, 2);
              
              return (
                <div key={session.id} className="relative pl-10 group">
                  {/* Time Marker */}
                  <div className="absolute -left-[2px] top-0 w-4 h-4 rounded-full bg-zinc-950 border-[3px] border-rose-500 z-10 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                  
                  <div className="mb-4">
                    <span className="text-rose-400 font-mono text-xs font-bold bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                      {formatTime(session.startTime)} - {formatTime(session.endTime)}
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-zinc-700 transition-colors">
                    <div className="p-5 border-b border-zinc-800/50">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-black text-stone-200">{activityName}</h3>
                        <button
                          onClick={() => handleEditSession(session)}
                          className="p-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-zinc-400" />
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 mt-3">
                        {location && (
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">{location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold">{formatDuration(session.minutes)}</span>
                        </div>
                        {happyIndex !== null && (
                          <div className="flex items-center gap-1.5 text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span className="text-xs font-bold">{happyIndex}/10</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Participants & Photos */}
                    <div className="bg-zinc-950/30 p-4 space-y-4">
                      {/* Participants */}
                      {participants.length > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {session.friends.map((f) => (
                              <div
                                key={f.friend.id}
                                className="w-8 h-8 rounded-full border-2 border-zinc-900 overflow-hidden"
                              >
                                {f.friend.user.image ? (
                                  <img 
                                    src={f.friend.user.image} 
                                    alt={f.friend.user.name || ''}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-xs text-white font-bold">
                                    {(f.friend.user.name || 'U')[0].toUpperCase()}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="text-xs font-bold text-zinc-500">
                            with {participants.join(', ')}
                          </div>
                        </div>
                      )}

                      {/* Photos */}
                      {displayPhotos.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {displayPhotos.map((photo) => (
                            <div 
                              key={photo.id} 
                              className="relative aspect-video rounded-xl overflow-hidden group/photo"
                            >
                              <img 
                                src={photo.photoUrl} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover/photo:scale-110" 
                                alt="Memory" 
                              />
                              <div className="absolute inset-0 bg-black/20 group-hover/photo:bg-transparent transition-colors"></div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-dashed border-zinc-800 rounded-xl p-3 flex items-center justify-center gap-2 text-zinc-600">
                          <Camera className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase">No photos taken</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* End of Day Marker */}
            <div className="relative pl-10 pb-4">
              <div className="absolute -left-[3px] top-1 w-2 h-2 rounded-full bg-zinc-800 z-10"></div>
              <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest italic">End of timeline</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-sm font-medium">No focus sessions today</p>
            <p className="text-zinc-600 text-xs mt-2">Start a session to see it here</p>
          </div>
        )}
      </div>

      {/* Post Memory Modal */}
      {editingSession && (() => {
        // Get last memory's happyIndex for initial value
        const lastMemory = editingSession.memories?.[editingSession.memories.length - 1];
        const initialHappyIndex = lastMemory?.happyIndex ?? 10;
        const hasExistingMemory = editingSession.memories && editingSession.memories.length > 0;
        
        return (
          <div className="absolute inset-0 z-[250] bg-zinc-950">
            <PostMemory
              durationSeconds={Math.floor(editingSession.minutes * 60)}
              sessionEndTime={new Date(editingSession.endTime)}
              friend={null}
              onBack={() => setEditingSession(null)}
              onPost={handleCreateMemory}
              isSaving={isSaving}
              initialHappyIndex={initialHappyIndex}
              title={hasExistingMemory ? 'Add Memory' : 'New Memory'}
            />
          </div>
        );
      })()}
    </div>
  );
};

export default TodayDetails;
