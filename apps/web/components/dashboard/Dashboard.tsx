import React from 'react';
import { 
  Users, 
  History, 
  Search, 
  Flower2, 
  Smile, 
  Flame
} from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Friend, ChartDataPoint } from '@hyve/types';
import { formatMinutesCompact } from '@hyve/utils';
import ChartPeakDot from '@/components/common/ChartPeakDot';

interface DashboardProps {
  friends: Friend[];
  chartData: ChartDataPoint[];
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  onOpenHappyIndex: () => void;
  onFriendClick: (friend: Friend) => void;
  onSearch: () => void;
  onSpringRecap: () => void;
  onStartSession: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  friends, 
  chartData,
  user,
  onOpenHappyIndex, 
  onFriendClick, 
  onSearch, 
  onSpringRecap, 
  onStartSession 
}) => {
  // Get first name from full name
  const firstName = user?.name?.split(' ')[0] || 'User';
  return (
    <div className="relative w-full h-full flex flex-col bg-zinc-950 overflow-hidden">
       {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-40">
        
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 flex justify-between items-center px-6 py-6 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900/50">
          <div>
            <h1 className="text-3xl font-light text-stone-200 tracking-tight">
              Hello, <span className="font-bold text-rose-200">{firstName}</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-1 font-medium">Ready to disconnect?</p>
          </div>
          <div className="flex items-center gap-3 pointer-events-auto">
            {/* Spring Bloom Button (Seasonal) - Moved from Grid */}
            <button 
              onClick={onSpringRecap}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-400/30 flex items-center justify-center hover:bg-emerald-500/30 transition-all group shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 relative overflow-hidden"
            >
              <Flower2 className="w-5 h-5 text-emerald-300 group-hover:scale-110 group-hover:rotate-45 transition-all duration-500" />
            </button>
          </div>
        </header>

        <div className="px-6 pt-6">
            {/* Action Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
            
            {/* Happy Index (Weekly Vibe) - Moved from Header to Main Block */}
            <div 
                onClick={onOpenHappyIndex}
                className="relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-[28px] p-5 cursor-pointer hover:border-amber-500/30 transition-all active:scale-95 h-48 flex flex-col justify-end group shadow-lg shadow-black/20"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition-opacity duration-500">
                    <Smile className="w-24 h-24 text-amber-400 -rotate-12" />
                </div>

                <div className="relative z-10">
                   <h2 className="text-3xl font-black text-white leading-none mb-1">Happy<br/>Index</h2>
                   <p className="text-zinc-500 text-xs font-medium">Your vibe check</p>
                </div>
            </div>

            {/* Find Friends Button */}
            <div 
                onClick={onSearch}
                className="relative bg-zinc-900 border border-zinc-800 rounded-[28px] p-5 cursor-pointer hover:border-rose-500/30 transition-all active:scale-95 h-48 flex flex-col justify-between overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-amber-500/10 opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex justify-end">
                <div className="bg-gradient-to-tr from-rose-200 to-amber-200 w-12 h-12 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(253,186,116,0.3)]">
                    <Search className="text-zinc-900 w-6 h-6" strokeWidth={3} />
                </div>
                </div>
                <div className="relative z-10">
                <h2 className="text-xl font-bold text-stone-200 leading-tight">Find<br/>Friends</h2>
                <p className="text-zinc-500 text-xs mt-1 font-medium">Sync via Radar</p>
                </div>
            </div>
            </div>

            {/* Chart Section */}
            <section className="mb-10">
            <h3 className="text-md font-bold text-stone-300 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
                <History className="w-4 h-4 text-rose-300" />
                Weekly Focus
            </h3>
            <div className="w-full bg-zinc-900/50 rounded-3xl px-2 py-4 border border-zinc-800/50 relative">
                <div className="w-full h-48 min-h-[192px]">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    initialDimension={{ width: 400, height: 192 }}
                  >
                  <LineChart data={chartData} margin={{ top: 40, right: 20, left: 20, bottom: 20 }}>
                    <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#fb7185" />
                        <stop offset="100%" stopColor="#fcd34d" />
                    </linearGradient>
                    </defs>
                    
                    {/* Vertical blurred dotted lines */}
                    <CartesianGrid 
                        vertical={true} 
                        horizontal={false} 
                        stroke="#52525b" 
                        strokeDasharray="4 4" 
                        strokeOpacity={0.2} 
                    />

                    <XAxis 
                        dataKey="day" 
                        stroke="#71717a" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={35} 
                        fontWeight={600}
                        interval={0} // Force show all days
                        padding={{ left: 0, right: 0 }}
                        domain={['dataMin - 0.5', 'dataMax + 0.5']} // Extend domain to hide edge grid lines
                    />

                    <Line 
                        type="monotone" 
                        dataKey="minutes" 
                        stroke="url(#colorGradient)" 
                        strokeWidth={3} 
                        dot={<ChartPeakDot data={chartData} valueKey="minutes" formatValue={formatMinutesCompact} />}
                        activeDot={false}
                        isAnimationActive={true}
                    />
                </LineChart>
                </ResponsiveContainer>
                </div>
            </div>
            </section>

            {/* Friends List */}
            <section>
            <h3 className="text-md font-bold text-stone-300 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
                <Users className="w-4 h-4 text-amber-300" />
                Your Circle
            </h3>
            <div className="space-y-3">
                {friends.length > 0 ? (
                    friends.map(friend => (
                    <div 
                        key={friend.id} 
                        onClick={() => onFriendClick(friend)}
                        className="bg-zinc-900/30 p-4 rounded-3xl flex items-center justify-between border border-zinc-800/50 hover:bg-zinc-900 transition-all active:scale-[0.98] cursor-pointer group"
                    >
                        <div className="flex items-center gap-4">
                        <img src={friend.avatar} alt={friend.name} className="w-14 h-14 rounded-full border-2 border-zinc-800 group-hover:border-rose-400/50 transition-colors" />
                        <div>
                            <h4 className="font-bold text-stone-200 text-lg">{friend.name}</h4>
                            <p className="text-xs text-zinc-500 font-medium">🔥 {friend.streak} day streak</p>
                        </div>
                        </div>
                        <div className="text-right">
                        <div className="text-xl font-black text-stone-200">{friend.totalHours}h</div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Hours this week</div>
                        </div>
                    </div>
                    ))
                ) : (
                    <div className="bg-zinc-900/20 rounded-3xl p-8 flex flex-col items-center justify-center border border-zinc-800/30">
                        <p className="text-zinc-500 text-sm font-medium text-center">
                            Add friends to unlock this feature
                        </p>
                    </div>
                )}
            </div>
            </section>
        </div>
      </div>
      
      {/* Floating Focus Button (Bottom Right) */}
      <div className="absolute bottom-24 right-6 z-50 pointer-events-none">
        <button 
          onClick={onStartSession}
          className="pointer-events-auto w-14 h-14 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(251,113,133,0.5)] hover:scale-110 active:scale-95 transition-all border border-rose-300/20"
        >
          <Flame className="w-7 h-7 text-white fill-white" />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
