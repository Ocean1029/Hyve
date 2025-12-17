'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Loader2, Copy, Check } from 'lucide-react';
import { searchUsers, getRecommendedUsers } from '@/modules/search/actions';
import { addFriendFromUser, checkIfUserIsFriend } from '@/modules/friends/actions';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import BottomNav from './BottomNav';
import UserProfile from './UserProfile';
import SearchBar from './SearchBar';
import SwipePreviewWrapper from './SwipePreviewWrapper';

type SearchResult = {
  id: string;
  userId?: string;
  name: string | null;
  email?: string | null;
  image?: string | null;
  avatar?: string | null;
  createdAt: Date;
  friendCount?: number;
  _count?: {
    focusSessions?: number;
  };
};

const SearchClient: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recommendedUsers, setRecommendedUsers] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [isAlreadyFriend, setIsAlreadyFriend] = useState(false);
  const router = useRouter();

  useSwipeNavigation({ 
    currentPath: '/search', 
    enabled: true 
  });

  // Load recommended users on component mount and when search is cleared
  useEffect(() => {
    const loadRecommendations = async () => {
      if (searchQuery.trim().length === 0 && !hasSearched) {
        setIsLoadingRecommendations(true);
        try {
          const result = await getRecommendedUsers();
          if (result.success) {
            setRecommendedUsers(result.users as SearchResult[]);
          }
        } catch (error) {
          console.error('Failed to load recommendations:', error);
        } finally {
          setIsLoadingRecommendations(false);
        }
      }
    };

    loadRecommendations();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
      } else {
        setResults([]);
        setHasSearched(false);
        // Reload recommendations when search is cleared
        const loadRecommendations = async () => {
          setIsLoadingRecommendations(true);
          try {
            const result = await getRecommendedUsers();
            if (result.success) {
              setRecommendedUsers(result.users as SearchResult[]);
            }
          } catch (error) {
            console.error('Failed to load recommendations:', error);
          } finally {
            setIsLoadingRecommendations(false);
          }
        };
        loadRecommendations();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    setHasSearched(true);

    try {
      const result = await searchUsers(searchQuery);
      if (result.success) {
        setResults(result.users as SearchResult[]);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = async (result: SearchResult, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if user is already a friend
    const checkResult = await checkIfUserIsFriend(result.id);
    setIsAlreadyFriend(checkResult.isFriend);
    
    // Open user profile modal
    setSelectedUser(result);
  };

  const handleAddFriend = async (userId: string) => {
    const result = await addFriendFromUser(userId);
    if (result.success) {
      // Update the friend status
      setIsAlreadyFriend(true);
      // Refresh pages to show the new friend
      router.refresh();
      // Optionally close the modal or show success message
      setTimeout(() => setSelectedUser(null), 1500);
    }
    return result;
  };

  return (
    <div className="w-full h-dvh bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-[414px] bg-zinc-950 relative overflow-hidden shadow-2xl border-x border-zinc-900/50">
        <SwipePreviewWrapper currentPath="/search">
          {/* Header */}
          <div className="p-6 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md">
            <h1 className="text-2xl font-black text-white mb-4">Search</h1>
            
            {/* Search Input */}
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by ID or name"
              showClearButton={true}
              showGradient={true}
              inputClassName="rounded-3xl"
            />
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto pb-40">
          {isSearching || isLoadingRecommendations ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-zinc-500 animate-spin mb-3" />
              <p className="text-zinc-500 text-sm font-medium">
                {isSearching ? 'Searching...' : 'Loading recommendations...'}
              </p>
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
                  onClick={(e) => handleResultClick(result, e)}
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
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-zinc-700 text-xs font-mono">{result.userId || result.id}</p>
                        {copiedId === result.id ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : recommendedUsers.length > 0 ? (
            <div className="px-6 pt-4 space-y-3">
              <div className="mb-3">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Recommended</h2>
              </div>
              {recommendedUsers.map((result) => (
                <div
                  key={result.id}
                  onClick={(e) => handleResultClick(result, e)}
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
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-zinc-700 text-xs font-mono">{result.userId || result.id}</p>
                        {copiedId === result.id ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <Search className="w-12 h-12 text-zinc-700 mb-3" />
              <p className="text-zinc-500 text-sm font-medium">Start searching</p>
            </div>
          )}
          </div>

          {/* User Profile Modal */}
          {selectedUser && (
            <UserProfile
              user={selectedUser}
              onClose={() => {
                setSelectedUser(null);
                setIsAlreadyFriend(false);
              }}
              onAddFriend={handleAddFriend}
              isAlreadyFriend={isAlreadyFriend}
            />
          )}

          {/* Bottom Navigation */}
          <BottomNav />
        </SwipePreviewWrapper>
      </div>
    </div>
  );
};

export default SearchClient;

