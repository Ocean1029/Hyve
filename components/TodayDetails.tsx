
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Clock, MapPin, Users, Activity, Flame, Camera, Edit, Star, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTodayFocusSessions } from '@/modules/sessions/actions';
import PostMemory from './PostMemory';
import { createMemoryWithPhoto, updateMemoryWithPhoto } from '@/modules/memories/actions';

interface TodayDetailsProps {
  userId: string;
  onClose?: () => void;
}

interface TodaySession {
  id: string;
  startTime: Date;
  endTime: Date;
  minutes: number;
  users: Array<{
    user: {
      id: string;
      name: string | null;
      image: string | null;
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
  // Image viewer state
  const [viewingPhotos, setViewingPhotos] = useState<Array<{ id: string; photoUrl: string }>>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

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
    // Reset saving state when opening edit modal
    setIsSaving(false);
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
      // Store the session ID and memory info before async operations
      const sessionId = editingSession.id;
      const existingMemory = editingSession.memories?.[0];
      
      if (existingMemory) {
        // Update existing memory
        const result = await updateMemoryWithPhoto(
          existingMemory.id,
          photoUrl,
          eventName, // eventName goes to content field
          location,
          happyIndex,
          mood // Pass vibe check value as type
        );

        if (result.success) {
          // Reset saving state before closing modal
          setIsSaving(false);
          setEditingSession(null);
          // Reload sessions after a short delay to ensure state is updated
          await loadTodaySessions();
        } else {
          console.error('Failed to update memory:', result.error);
          alert(result.error || 'Failed to update memory. Please try again.');
          setIsSaving(false);
        }
      } else {
        // Create new memory with photo
        // eventName is stored as content, caption is for additional description
        const result = await createMemoryWithPhoto(
          sessionId,
          photoUrl,
          eventName, // eventName goes to content field
          location,
          happyIndex,
          mood // Pass vibe check value as type
        );

        if (result.success) {
          // Reset saving state before closing modal
          setIsSaving(false);
          setEditingSession(null);
          // Reload sessions after a short delay to ensure state is updated
          await loadTodaySessions();
        } else {
          console.error('Failed to create memory:', result.error);
          alert(result.error || 'Failed to create memory. Please try again.');
          setIsSaving(false);
        }
      }
    } catch (error) {
      console.error('Failed to save memory:', error);
      alert('An error occurred while saving the memory. Please try again.');
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
      // Count users (excluding current user if needed, or count all)
      const userCount = session.users?.length || 0;
      return sum + calculateScore(session.minutes, userCount);
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

  // Handle photo click to open viewer
  const handlePhotoClick = (photos: Array<{ id: string; photoUrl: string }>, index: number) => {
    setViewingPhotos(photos);
    setCurrentPhotoIndex(index);
  };

  // Handle close image viewer
  const handleCloseViewer = useCallback(() => {
    setViewingPhotos([]);
    setCurrentPhotoIndex(0);
  }, []);

  // Handle next photo
  const handleNextPhoto = useCallback(() => {
    setCurrentPhotoIndex((prev) => {
      if (viewingPhotos.length === 0) return prev;
      return (prev + 1) % viewingPhotos.length;
    });
  }, [viewingPhotos.length]);

  // Handle previous photo
  const handlePrevPhoto = useCallback(() => {
    setCurrentPhotoIndex((prev) => {
      if (viewingPhotos.length === 0) return prev;
      return (prev - 1 + viewingPhotos.length) % viewingPhotos.length;
    });
  }, [viewingPhotos.length]);

  // Handle keyboard navigation
  useEffect(() => {
    if (viewingPhotos.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseViewer();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPhoto();
      } else if (e.key === 'ArrowRight') {
        handleNextPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingPhotos.length, handleCloseViewer, handlePrevPhoto, handleNextPhoto]);

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
              const participants = session.users?.map(u => u.user.name || 'Unknown') || [];
              // Get activity name from first memory's content, or use default
              const activityName = session.memories?.[0]?.content || 'Focus Session';
              // Get location from first memory that has location
              const location = session.memories?.find(m => m.location)?.location || null;
              // Get last memory's happyIndex
              const lastMemory = session.memories?.[session.memories.length - 1];
              const happyIndex = lastMemory?.happyIndex ?? null;
              // Get photos from all memories
              const allPhotos = session.memories?.flatMap(m => m.photos || []) || [];
              const displayPhotos = allPhotos;
              
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
                            {session.users?.map((u) => (
                              <div
                                key={u.user.id}
                                className="w-8 h-8 rounded-full border-2 border-zinc-900 overflow-hidden"
                              >
                                {u.user.image ? (
                                  <img 
                                    src={u.user.image} 
                                    alt={u.user.name || ''}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-xs text-white font-bold">
                                    {(u.user.name || 'U')[0].toUpperCase()}
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

                      {/* Photos - Horizontal Scrollable */}
                      {displayPhotos.length > 0 ? (
                        <div className="overflow-x-auto -mx-4 px-4 mt-2 scrollbar-hide snap-x snap-mandatory">
                          <div className="flex gap-2">
                            {displayPhotos.map((photo, photoIndex) => (
                              <div 
                                key={photo.id} 
                                onClick={() => handlePhotoClick(displayPhotos, photoIndex)}
                                className="relative flex-shrink-0 w-[calc((100%-0.5rem))] aspect-[3/4] rounded-xl overflow-hidden group/photo snap-start cursor-pointer"
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

      {/* Image Viewer Modal */}
      {viewingPhotos.length > 0 && (
        <div 
          className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center"
          onClick={handleCloseViewer}
        >
          {/* Close Button */}
          <button
            onClick={handleCloseViewer}
            className="absolute top-4 right-4 z-10 p-3 bg-zinc-900/80 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Navigation Buttons */}
          {viewingPhotos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevPhoto();
                }}
                className="absolute left-4 z-10 p-3 bg-zinc-900/80 hover:bg-zinc-800 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextPhoto();
                }}
                className="absolute right-4 z-10 p-3 bg-zinc-900/80 hover:bg-zinc-800 rounded-full transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          {/* Image Container */}
          <div 
            className="relative w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={viewingPhotos[currentPhotoIndex]?.photoUrl} 
              alt={`Photo ${currentPhotoIndex + 1} of ${viewingPhotos.length}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Photo Counter */}
          {viewingPhotos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-zinc-900/80 rounded-full">
              <span className="text-white text-sm font-medium">
                {currentPhotoIndex + 1} / {viewingPhotos.length}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Post Memory Modal */}
      {editingSession && (() => {
        // Get existing memory data for initial values
        const existingMemory = editingSession.memories?.[0];
        const hasExistingMemory = existingMemory !== undefined;
        
        // Extract initial values from existing memory
        const initialHappyIndex = existingMemory?.happyIndex ?? 10;
        const initialEventName = existingMemory?.content ?? '';
        const initialLocation = existingMemory?.location ?? '';
        // Extract photos - ensure we get all photos from the memory
        const initialPhotos = existingMemory?.photos 
          ? existingMemory.photos.map(p => p.photoUrl).filter(url => url && url.trim() !== '')
          : [];
        // Note: caption and category are not stored in memory model, so they default to empty
        const initialCaption = '';
        const initialCategory = '📚 Study'; // Default category, matching PostMemory's CATEGORIES[0]
        
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
              initialEventName={initialEventName}
              initialCaption={initialCaption}
              initialLocation={initialLocation}
              initialPhotos={initialPhotos}
              initialCategory={initialCategory}
              isEditMode={hasExistingMemory}
              title={hasExistingMemory ? 'Edit Memory' : 'New Memory'}
            />
          </div>
        );
      })()}
    </div>
  );
};

export default TodayDetails;
