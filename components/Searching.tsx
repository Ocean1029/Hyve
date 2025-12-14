import React from 'react';
import Radar from './Radar';

interface SearchingProps {
  onCancel: () => void;
}

const Searching: React.FC<SearchingProps> = ({ onCancel }) => {
  return (
    <div className="flex flex-col h-full bg-zinc-950 items-center justify-center relative">
      <div className="absolute top-24 text-center">
        <h2 className="text-2xl font-bold text-stone-200 animate-pulse tracking-tight">Scanning...</h2>
        <p className="text-sm text-zinc-600 mt-2 font-medium">Looking for nearby campfires</p>
      </div>
      <Radar />
      <button
        onClick={onCancel}
        className="absolute bottom-20 text-zinc-500 hover:text-white transition-colors text-xs font-bold tracking-widest uppercase"
      >
        Cancel
      </button>
    </div>
  );
};

export default Searching;



