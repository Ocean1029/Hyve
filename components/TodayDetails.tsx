
import React, { useEffect, useState } from 'react';
import { X, Clock, MapPin, Users } from 'lucide-react';
import { getTodayFocusSessions } from '@/modules/sessions/actions';

interface TodayDetailsProps {
  userId: string;
  onClose: () => void;
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
}

const TodayDetails: React.FC<TodayDetailsProps> = ({ userId, onClose }) => {
  const [sessions, setSessions] = useState<TodaySession[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

    loadTodaySessions();
  }, [userId]);

  // Format time display
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

  // Get today's date string
  const todayDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="absolute inset-0 flex flex-col h-full bg-zinc-950 overflow-y-auto animate-in slide-in-from-bottom duration-300 z-[60]">
      
      {/* Header */}
      <div className="p-6 flex justify-between items-center bg-zinc-950 sticky top-0 z-20 border-b border-zinc-900">
        <div>
          <h2 className="text-xl font-bold text-stone-200">Today's Focus</h2>
          <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{todayDate}</p>
        </div>
        <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
          <X className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Total Summary */}
        <div className="text-center py-4">
          <div className="text-5xl font-mono font-light text-white tracking-tighter mb-2">
            {isLoading ? '...' : formatTotalTime(totalMinutes)}
          </div>
          <p className="text-zinc-500 font-medium text-sm">Total time disconnected</p>
        </div>

        {/* Timeline */}
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-zinc-500 text-sm">Loading sessions...</p>
          </div>
        ) : sessions.length > 0 ? (
          <div className="relative border-l-2 border-zinc-800 ml-4 space-y-8 pb-12">
            {sessions.map((session) => {
              const participants = session.friends.map(f => f.friend.user.name || 'Unknown');
              
              return (
                <div key={session.id} className="relative pl-8">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-zinc-950 border-2 border-rose-500 ring-4 ring-zinc-950"></div>
                  
                  <div className="flex flex-col gap-1 mb-2">
                    <span className="text-rose-400 font-mono text-sm font-bold">
                      {formatTime(session.startTime)} - {formatTime(session.endTime)}
                    </span>
                    <h3 className="text-xl font-bold text-stone-200">
                      Focus Session
                    </h3>
                  </div>

                  <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800/50 space-y-3">
                    
                    <div className="flex items-center gap-3 text-zinc-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">{formatDuration(session.minutes)}</span>
                    </div>

                    {participants.length > 0 && (
                      <div className="flex items-center gap-3 text-zinc-400 pt-2 border-t border-zinc-800/50">
                        <Users className="w-4 h-4" />
                        <div className="flex -space-x-2">
                          {session.friends.map((f, i) => (
                            <div 
                              key={f.friend.id} 
                              className="w-6 h-6 rounded-full bg-zinc-700 border border-zinc-800 flex items-center justify-center text-[10px] text-white font-bold overflow-hidden"
                            >
                              {f.friend.user.image ? (
                                <img 
                                  src={f.friend.user.image} 
                                  alt={f.friend.user.name || ''}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{(f.friend.user.name || 'U')[0].toUpperCase()}</span>
                              )}
                            </div>
                          ))}
                          <span className="ml-3 text-sm font-medium text-stone-300">
                            With {participants.join(', ')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-sm font-medium">No focus sessions today</p>
            <p className="text-zinc-600 text-xs mt-2">Start a session to see it here</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default TodayDetails;
