import React from 'react';
import { Friend } from '@hyve/types';

interface FoundProps {
  friend: Friend | null;
  onClose: () => void;
}

const Found: React.FC<FoundProps> = ({ friend, onClose }) => {
  return (
    <div className="flex flex-col h-full bg-zinc-950 items-center justify-center px-6 animate-in fade-in duration-500">
      <div className="bg-zinc-900 p-8 rounded-[40px] w-full border border-zinc-800 flex flex-col items-center shadow-2xl shadow-rose-900/10">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl"></div>
          <img
            src={friend?.avatar}
            className="w-32 h-32 rounded-full border-4 border-zinc-800 relative z-10"
            alt="Friend"
          />
          <div className="absolute -bottom-2 -right-2 bg-zinc-950 p-2 rounded-full z-20 border border-zinc-800">
             <div className="bg-emerald-500 w-5 h-5 rounded-full animate-bounce"></div>
          </div>
        </div>

        <h2 className="text-3xl font-black text-stone-100 mb-1">{friend?.name}</h2>
        <p className="text-emerald-400 text-xs font-bold mb-10 tracking-[0.2em] uppercase">Connected!</p>

        <div className="text-center mb-8">
            <p className="text-stone-300 text-sm">{friend?.name} is nearby.</p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-zinc-800 text-stone-300 hover:text-white font-bold py-5 rounded-3xl text-lg transition-all active:scale-95"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Found;


