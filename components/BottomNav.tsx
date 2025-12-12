import React from 'react';
import { Home, MessageCircle, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: number;
  onTabChange: (index: number) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="absolute bottom-6 left-6 right-6 z-[200] bg-zinc-900/90 backdrop-blur-xl rounded-full border border-zinc-800/50 shadow-2xl flex items-center justify-between px-2 py-2 safe-area-bottom">
       <button 
         onClick={() => onTabChange(0)}
         className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-full transition-all duration-300 ${activeTab === 0 ? 'bg-zinc-800 shadow-md' : 'hover:bg-zinc-800/50'}`}
       >
         <MessageCircle className={`w-5 h-5 ${activeTab === 0 ? 'text-white fill-white' : 'text-zinc-500'}`} />
       </button>
       
       <button 
         onClick={() => onTabChange(1)}
         className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-full transition-all duration-300 ${activeTab === 1 ? 'bg-zinc-800 shadow-md' : 'hover:bg-zinc-800/50'}`}
       >
         <Home className={`w-5 h-5 ${activeTab === 1 ? 'text-rose-400 fill-rose-400' : 'text-zinc-500'}`} />
       </button>
       
       <button 
         onClick={() => onTabChange(2)}
         className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-full transition-all duration-300 ${activeTab === 2 ? 'bg-zinc-800 shadow-md' : 'hover:bg-zinc-800/50'}`}
       >
         <User className={`w-5 h-5 ${activeTab === 2 ? 'text-white fill-white' : 'text-zinc-500'}`} />
       </button>
    </div>
  );
};

export default BottomNav;

