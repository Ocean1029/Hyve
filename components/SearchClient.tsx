'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, User, Users, X, Loader2, Copy, Check } from 'lucide-react';
import { searchUsers, searchFriends } from '@/modules/search/actions';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { useRouter } from 'next/navigation';
import BottomNav from './BottomNav';

type SearchResult = {
  id: string;
  name: string | null;
  email?: string | null;
  image?: string | null;
  bio?: string | null;
  avatar?: string | null;
  createdAt: Date;
  _count?: {
    posts: number;
    focusSessions?: number;
    interactions?: number;
  };
};

type SearchType = 'users' | 'friends';

const SearchClient: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('users');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useSwipeNavigation({ 
    currentPath: '/search', 
    enabled: true 
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
      } else {
        setResults([]);
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchType]);

  const performSearch = async () => {
    setIsSearching(true);
    setHasSearched(true);

    try {
      if (searchType === 'users') {
        const result = await searchUsers(searchQuery);
        if (result.success) {
          setResults(result.users as SearchResult[]);
        }
      } else {
        const result = await searchFriends(searchQuery);
        if (result.success) {
          setResults(result.friends as SearchResult[]);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setHasSearched(false);
  };

  const handleResultClick = async (result: SearchResult) => {
    if (searchType === 'users') {
      // For users, copy their ID to clipboard
      try {
        await navigator.clipboard.writeText(result.id);
        setCopiedId(result.id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch (error) {
        console.error('Failed to copy ID:', error);
      }
    } else {
      // For friends, you could navigate to their profile or messages
      // For now, let's copy the ID as well
      try {
        await navigator.clipboard.writeText(result.id);
        setCopiedId(result.id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch (error) {
        console.error('Failed to copy ID:', error);
      }
    }
  };

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-[414px] bg-zinc-950 relative overflow-hidden shadow-2xl border-x border-zinc-900/50">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md">
          <h1 className="text-2xl font-black text-white mb-4">Search</h1>
          
          {/* Search Type Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSearchType('users')}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                searchType === 'users'
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Users
            </button>
            <button
              onClick={() => setSearchType('friends')}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                searchType === 'friends'
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Friends
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search by ID, name${searchType === 'users' ? ', email' : ', bio'}...`}
              className="w-full bg-zinc-900 text-white pl-12 pr-12 py-4 rounded-2xl border border-zinc-800 focus:outline-none focus:border-zinc-700 placeholder-zinc-600"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto pb-32">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-zinc-500 animate-spin mb-3" />
              <p className="text-zinc-500 text-sm font-medium">Searching...</p>
            </div>
          ) : hasSearched && results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Search className="w-12 h-12 text-zinc-700 mb-3" />
              <p className="text-zinc-500 text-sm font-medium">No results found</p>
              <p className="text-zinc-700 text-xs mt-1">Try a different search term</p>
            </div>
          ) : results.length > 0 ? (
            <div className="px-6 pt-4 space-y-3">
              {results.map((result) => (
                <div
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all cursor-pointer group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {(result.image || result.avatar) ? (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-zinc-800 group-hover:border-zinc-700">
                          <Image
                            src={result.image || result.avatar || ''}
                            alt={result.name || 'User'}
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized={!(result.image || result.avatar)?.includes('googleusercontent.com')}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {(result.name || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-sm truncate">
                        {result.name || 'Unknown User'}
                      </h3>
                      {result.email && (
                        <p className="text-zinc-500 text-xs truncate">{result.email}</p>
                      )}
                      {result.bio && (
                        <p className="text-zinc-500 text-xs truncate">{result.bio}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-zinc-700 text-xs font-mono">ID: {result.id}</p>
                        {copiedId === result.id ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    {result._count && (
                      <div className="flex flex-col items-end gap-1">
                        {result._count.posts !== undefined && (
                          <div className="text-xs text-zinc-500">
                            <span className="font-bold text-white">{result._count.posts}</span> posts
                          </div>
                        )}
                        {result._count.focusSessions !== undefined && (
                          <div className="text-xs text-zinc-500">
                            <span className="font-bold text-white">{result._count.focusSessions}</span> sessions
                          </div>
                        )}
                        {result._count.interactions !== undefined && (
                          <div className="text-xs text-zinc-500">
                            <span className="font-bold text-white">{result._count.interactions}</span> interactions
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <Search className="w-12 h-12 text-zinc-700 mb-3" />
              <p className="text-zinc-500 text-sm font-medium">Start searching</p>
              <p className="text-zinc-700 text-xs mt-1">
                Enter ID, name, or {searchType === 'users' ? 'email' : 'bio'} to find {searchType}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
};

export default SearchClient;

