'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, User, Search } from 'lucide-react';

const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="absolute bottom-6 left-6 right-6 z-[200] bg-zinc-900/90 backdrop-blur-xl rounded-full border border-zinc-800/50 shadow-2xl flex items-center justify-between px-2 py-2 safe-area-bottom">
       <Link 
         href="/messages"
         className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-full transition-all duration-300 ${isActive('/messages') ? 'bg-zinc-800 shadow-md' : 'hover:bg-zinc-800/50'}`}
       >
         <MessageCircle className={`w-5 h-5 ${isActive('/messages') ? 'text-white fill-white' : 'text-zinc-500'}`} />
       </Link>
       
       <Link 
         href="/search"
         className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-full transition-all duration-300 ${isActive('/search') ? 'bg-zinc-800 shadow-md' : 'hover:bg-zinc-800/50'}`}
       >
         <Search className={`w-5 h-5 ${isActive('/search') ? 'text-amber-400 fill-amber-400' : 'text-zinc-500'}`} />
       </Link>
       
       <Link 
         href="/"
         className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-full transition-all duration-300 ${isActive('/') ? 'bg-zinc-800 shadow-md' : 'hover:bg-zinc-800/50'}`}
       >
         <Home className={`w-5 h-5 ${isActive('/') ? 'text-rose-400 fill-rose-400' : 'text-zinc-500'}`} />
       </Link>
       
       <Link 
         href="/profile"
         className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-full transition-all duration-300 ${isActive('/profile') ? 'bg-zinc-800 shadow-md' : 'hover:bg-zinc-800/50'}`}
       >
         <User className={`w-5 h-5 ${isActive('/profile') ? 'text-white fill-white' : 'text-zinc-500'}`} />
       </Link>
    </div>
  );
};

export default BottomNav;
