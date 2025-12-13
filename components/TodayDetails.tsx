
import React from 'react';
import { X, Clock, MapPin, Users } from 'lucide-react';
import { Interaction } from '../lib/types';

interface TodayDetailsProps {
  onClose: () => void;
}

const MOCK_TODAY_SESSIONS: Interaction[] = [
  { 
    id: 't1', 
    activity: 'Deep Work Studio', 
    date: 'Today', 
    duration: '1h 57m',
    startTime: '13:00',
    endTime: '14:57',
    location: 'Design Library',
    participants: ['Kai', 'Sarah']
  },
  { 
    id: 't2', 
    activity: 'Coffee Break', 
    date: 'Today', 
    duration: '45m',
    startTime: '10:15',
    endTime: '11:00',
    location: 'Blue Bottle',
    participants: ['Leo']
  }
];

const TodayDetails: React.FC<TodayDetailsProps> = ({ onClose }) => {
  const totalHours = "2h 42m";

  return (
    <div className="absolute inset-0 flex flex-col h-full bg-zinc-950 overflow-y-auto animate-in slide-in-from-bottom duration-300 z-[60]">
      
      {/* Header */}
      <div className="p-6 flex justify-between items-center bg-zinc-950 sticky top-0 z-20 border-b border-zinc-900">
        <div>
          <h2 className="text-xl font-bold text-stone-200">Today's Focus</h2>
          <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">October 24</p>
        </div>
        <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
          <X className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Total Summary */}
        <div className="text-center py-4">
          <div className="text-5xl font-mono font-light text-white tracking-tighter mb-2">{totalHours}</div>
          <p className="text-zinc-500 font-medium text-sm">Total time disconnected</p>
        </div>

        {/* Timeline */}
        <div className="relative border-l-2 border-zinc-800 ml-4 space-y-8 pb-12">
          {MOCK_TODAY_SESSIONS.map((session, index) => (
            <div key={session.id} className="relative pl-8">
              {/* Timeline Dot */}
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-zinc-950 border-2 border-rose-500 ring-4 ring-zinc-950"></div>
              
              <div className="flex flex-col gap-1 mb-2">
                <span className="text-rose-400 font-mono text-sm font-bold">
                  {session.startTime} - {session.endTime}
                </span>
                <h3 className="text-xl font-bold text-stone-200">{session.activity}</h3>
              </div>

              <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800/50 space-y-3">
                
                <div className="flex items-center gap-3 text-zinc-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">{session.duration}</span>
                </div>
                
                <div className="flex items-center gap-3 text-zinc-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">{session.location}</span>
                </div>

                <div className="flex items-center gap-3 text-zinc-400 pt-2 border-t border-zinc-800/50">
                  <Users className="w-4 h-4" />
                  <div className="flex -space-x-2">
                    {session.participants?.map((p, i) => (
                       <div key={i} className="w-6 h-6 rounded-full bg-zinc-700 border border-zinc-800 flex items-center justify-center text-[10px] text-white font-bold">
                         {p[0]}
                       </div>
                    ))}
                    <span className="ml-3 text-sm font-medium text-stone-300">
                      With {session.participants?.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default TodayDetails;
