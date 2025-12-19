'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppState, FocusStatus, Friend, ChartDataPoint } from '@/lib/types';
import SpringRecap from '@/components/SpringRecap';
import FriendProfile from '@/components/FriendProfile';
import Dashboard from '@/components/Dashboard';
import PostMemory from '@/components/PostMemory';
import BottomNav from '@/components/BottomNav';
import Searching from '@/components/Searching';
import Found from '@/components/Found';
import FocusMode from '@/components/FocusMode';
import SessionSummary from '@/components/SessionSummary';
import { generateIceBreaker } from '@/lib/services/geminiService';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { useSensorPermission } from '@/components/SensorPermissionProvider';
import SensorPermissionBanner from '@/components/SensorPermissionBanner';
import { createFocusSession, getActiveFocusSessions } from '@/modules/sessions/actions';
import { createMemoryWithPhoto } from '@/modules/memories/actions';
import { getSpringBloomDataAction } from '@/modules/friends/actions';
import { SpringBloomEntry } from '@/modules/friends/service';
import SwipePreviewWrapper from '@/components/SwipePreviewWrapper';

interface DashboardClientProps {
  friends: Friend[];
  chartData: ChartDataPoint[];
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
}

const DashboardClient: React.FC<DashboardClientProps> = ({ friends, chartData, userId, user }) => {
  const router = useRouter();
  // --- State ---
  const [appState, setAppState] = useState<AppState>(AppState.DASHBOARD);
  
  // Enable swipe navigation only in DASHBOARD state
  useSwipeNavigation({ 
    currentPath: '/', 
    enabled: appState === AppState.DASHBOARD 
  });
  const [focusStatus, setFocusStatus] = useState<FocusStatus>(FocusStatus.PAUSED);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null); // Track when pause started
  const [totalPausedSeconds, setTotalPausedSeconds] = useState(0); // Track total paused time
  const [sessionEndTime, setSessionEndTime] = useState<Date | null>(null);
  const [iceBreaker, setIceBreaker] = useState<string | null>(null);
  const [loadingIceBreaker, setLoadingIceBreaker] = useState(false);
  const [isPhoneFaceDown, setIsPhoneFaceDown] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionRecorded, setSessionRecorded] = useState(false);
  const [currentFocusSessionId, setCurrentFocusSessionId] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const [springBloomData, setSpringBloomData] = useState<SpringBloomEntry[]>([]);
  const [springBloomLoading, setSpringBloomLoading] = useState(false);
  const activeSessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isSessionPausedByOthers, setIsSessionPausedByOthers] = useState(false); // Track if session is paused by other users
  const userManuallyExitedRef = useRef(false); // Track if user manually exited from session
  const prevFocusStatusRef = useRef<FocusStatus>(FocusStatus.PAUSED); // Track previous focusStatus for transition detection

  // Device orientation sensor from global context
  const { 
    isFaceDown: sensorIsFaceDown, 
    permissionStatus, 
    sensorAvailable, 
    requestPermission,
    showBanner: showSensorBanner,
    dismissBanner: dismissSensorBanner
  } = useSensorPermission();

  // Integrate sensor data with simulation button: prioritize sensor, fallback to false (face up/PAUSED) to avoid false positives
  // When sensor is unavailable or state is unknown (null), default to false (face up) to prevent incorrect timing
  const isFaceDown = sensorAvailable && sensorIsFaceDown !== null 
    ? sensorIsFaceDown 
    : false; // Default to false (face up/PAUSED) when sensor state is unknown

  // --- Effects ---
  useEffect(() => {
    if (appState === AppState.FOCUS && focusStatus === FocusStatus.ACTIVE) {
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [appState, focusStatus]);

  // Update focusStatus based on device orientation (sensor or simulation) and other users' pause status
  // This effect handles both initial state when entering FOCUS mode and ongoing state synchronization
  // When isFaceDown changes from null to an actual value, this will correctly update the status
  useEffect(() => {
    if (appState === AppState.FOCUS) {
      // Session is paused if:
      // 1. Current user picks up phone (isFaceDown = false), OR
      // 2. Any other user has paused the session
      // Only resume to ACTIVE when current user puts phone down AND no other users have paused
      const currentUserPaused = !isFaceDown; // Current user picked up phone
      const shouldBePaused = currentUserPaused || isSessionPausedByOthers;
      const newStatus = shouldBePaused ? FocusStatus.PAUSED : FocusStatus.ACTIVE;
      
      // Track pause time: when transitioning to PAUSED, record start time
      // When transitioning to ACTIVE, calculate and add to total paused time
      const prevStatus = prevFocusStatusRef.current;
      if (newStatus === FocusStatus.PAUSED && prevStatus === FocusStatus.ACTIVE) {
        // Just paused - record pause start time
        setPauseStartTime(new Date());
      } else if (newStatus === FocusStatus.ACTIVE && prevStatus === FocusStatus.PAUSED) {
        // Just resumed - calculate paused duration and add to total
        if (pauseStartTime) {
          const pauseDuration = Math.floor((new Date().getTime() - pauseStartTime.getTime()) / 1000);
          setTotalPausedSeconds(prev => prev + pauseDuration);
          setPauseStartTime(null);
        }
      }
      
      // Only update if status actually changed to avoid unnecessary re-renders
      // Use ref to get current focusStatus to avoid dependency issues
      setFocusStatus((currentStatus) => {
        if (newStatus !== currentStatus) {
          console.log('Updating focusStatus:', {
            isFaceDown,
            currentUserPaused,
            isSessionPausedByOthers,
            shouldBePaused,
            newStatus,
            currentStatus: currentStatus,
            prevStatus: prevStatus
          });
          prevFocusStatusRef.current = newStatus;
          return newStatus;
        }
        return currentStatus;
      });
    }
  }, [isFaceDown, appState, isSessionPausedByOthers]);

  // Sync pause status with server when phone is picked up or put down
  useEffect(() => {
    if (appState === AppState.FOCUS && currentFocusSessionId) {
      const syncPauseStatus = async () => {
        try {
          // isFaceDown = false means phone is picked up (paused)
          // isFaceDown = true means phone is put down (active)
          const isPaused = !isFaceDown;
          
          const response = await fetch(`/api/sessions/${currentFocusSessionId}/pause`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isPaused }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log('Pause status sync response:', result);
            // Update isSessionPausedByOthers based on server response
            // Check if any other user has paused
            if (result.users) {
              const otherUserPaused = result.users.some(
                (u: any) => u.userId !== userId && u.isPaused
              );
              console.log('Other user paused:', otherUserPaused, 'Current isFaceDown:', isFaceDown);
              // Update isSessionPausedByOthers state
              // Don't immediately update focusStatus here - let the main useEffect handle it
              // This avoids race conditions with isFaceDown state
              setIsSessionPausedByOthers(otherUserPaused);
            }
          } else {
            console.error('Failed to sync pause status');
          }
        } catch (error) {
          console.error('Error syncing pause status:', error);
        }
      };

      // Debounce to avoid too many API calls
      const timeoutId = setTimeout(syncPauseStatus, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [isFaceDown, appState, currentFocusSessionId, userId]);

  // Listen to session stream for real-time status updates
  // Listen in both DASHBOARD and FOCUS states to detect new sessions
  useEffect(() => {
    // Only skip if we're in a state that doesn't need session updates
    if (appState === AppState.SUMMARY || appState === AppState.POST_MEMORY || appState === AppState.QUARTERLY_FEEDBACK) {
      return;
    }

    const eventSource = new EventSource('/api/sessions/stream');
    
    eventSource.onmessage = (event) => {
      try {
        // Skip empty or invalid messages
        if (!event.data || event.data.trim() === '') {
          return;
        }
        
        const data = JSON.parse(event.data);
        
        if (data.type === 'session_status' && data.sessions) {
          // Check if there's a new active session that we're not tracking yet
          if (!currentFocusSessionId && data.sessions.length > 0) {
            // Find the first active session
            const newActiveSession = data.sessions.find(
              (s: any) => s.status === 'active'
            );
            
            if (newActiveSession && appState !== AppState.FOCUS && !sessionStartTime && !userManuallyExitedRef.current) {
              // New session detected, auto-enter Focus Mode
              console.log('New active session detected from stream:', newActiveSession);
              
              // Calculate elapsed seconds from session start time
              // Note: This is initial time, actual active time will be tracked by timer
              const sessionStart = new Date(newActiveSession.startTime);
              const now = new Date();
              const elapsedMs = now.getTime() - sessionStart.getTime();
              const elapsedSec = Math.floor(elapsedMs / 1000);
              
              // Set up the focus session state
              setCurrentFocusSessionId(newActiveSession.sessionId);
              setSessionStartTime(sessionStart);
              setElapsedSeconds(Math.max(0, elapsedSec));
              // Reset pause tracking when entering new session
              setTotalPausedSeconds(0);
              setPauseStartTime(null);
              
              // Find the friend from the session participants
              const otherUsers = newActiveSession.users.filter(
                (u: any) => u.userId !== userId
              );
              if (otherUsers.length > 0) {
                // Try to find the friend in the friends list
                const friendUserId = otherUsers[0].userId;
                const friend = friends.find(f => f.userId === friendUserId);
                if (friend) {
                  setSelectedFriend(friend);
                }
              }
              
              // Enter Focus Mode
              // Set initial focusStatus based on actual isFaceDown state
              // If sensor is not ready or phone is face up, start as PAUSED
              // The useEffect at line 98 will handle state synchronization
              setAppState(AppState.FOCUS);
              // Default to PAUSED, let the useEffect handle the actual state based on isFaceDown
              setFocusStatus(FocusStatus.PAUSED);
              return;
            }
          }
          
          // Find the current session
          const currentSession = data.sessions.find(
            (s: any) => s.sessionId === currentFocusSessionId
          );
          
          if (currentSession) {
            // Check if session was ended by another user
            if (currentSession.status !== 'active') {
              // Session ended by another user, update state with session information from stream
              console.log('Session ended by another user:', currentSession);
              
              // Calculate elapsed seconds from session minutes
              const sessionMinutes = currentSession.minutes || 0;
              const calculatedElapsedSeconds = sessionMinutes * 60;
              
              // Update state with session end information
              if (sessionStartTime) {
                // Use session endTime if available, otherwise use current time
                const endTime = currentSession.endTime 
                  ? new Date(currentSession.endTime) 
                  : new Date();
                setSessionEndTime(endTime);
                
                // Use calculated elapsed seconds if available, otherwise keep current
                if (calculatedElapsedSeconds > 0) {
                  setElapsedSeconds(calculatedElapsedSeconds);
                }
              } else {
                // If no sessionStartTime, set it from session startTime
                if (currentSession.startTime) {
                  setSessionStartTime(new Date(currentSession.startTime));
                }
                const endTime = currentSession.endTime 
                  ? new Date(currentSession.endTime) 
                  : new Date();
                setSessionEndTime(endTime);
                if (calculatedElapsedSeconds > 0) {
                  setElapsedSeconds(calculatedElapsedSeconds);
                }
              }
              
              setSessionRecorded(true);
              console.log('Entering SUMMARY state with session info:', {
                elapsedSeconds: calculatedElapsedSeconds || elapsedSeconds,
                endTime: currentSession.endTime,
                minutes: sessionMinutes
              });
              setAppState(AppState.SUMMARY);
              return;
            }
            
            // Check if any other user has paused the session
            // Find if any user other than current user has paused
            const otherUserPaused = currentSession.users.some(
              (u: any) => u.userId !== userId && u.isPaused
            );
            
            console.log('Stream update - otherUserPaused:', otherUserPaused, 'Current isFaceDown:', isFaceDown, 'Current focusStatus:', focusStatus);
            // Update isSessionPausedByOthers state
            // Don't immediately update focusStatus here - let the main useEffect handle it
            // This avoids race conditions with isFaceDown state
            setIsSessionPausedByOthers(otherUserPaused);
          }
        }
      } catch (error) {
        console.error('Error parsing session stream message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Session stream error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [appState, currentFocusSessionId, userId, sessionStartTime, friends]);

  // Check for active focus sessions and auto-enter Focus Mode
  useEffect(() => {
    const checkActiveSessions = async () => {
      try {
        const result = await getActiveFocusSessions(userId);
        if (result.success && result.sessions && result.sessions.length > 0) {
          // User should only have one active session at a time
          const activeSession = result.sessions[0];
          
          // Check if this is the same session we're tracking
          const isSameSession = currentFocusSessionId === activeSession.id;
          
          // Only auto-enter Focus Mode if we're not already in FOCUS state
          // and we don't have a manually started session (no sessionStartTime means no manual session)
          // and user hasn't manually exited from a session
          if (appState !== AppState.FOCUS && !sessionStartTime && !userManuallyExitedRef.current) {
            // Calculate elapsed seconds from session start time
            // Note: This is initial time, actual active time will be tracked by timer
            const sessionStart = new Date(activeSession.startTime);
            const now = new Date();
            const elapsedMs = now.getTime() - sessionStart.getTime();
            const elapsedSec = Math.floor(elapsedMs / 1000);
            
            // Set up the focus session state for auto-created session
            setCurrentFocusSessionId(activeSession.id);
            setSessionStartTime(sessionStart);
            setElapsedSeconds(Math.max(0, elapsedSec));
            // Reset pause tracking when entering new session
            setTotalPausedSeconds(0);
            setPauseStartTime(null);
            
            // Find the friend from the session participants
            const otherUsers = activeSession.users.filter((u: any) => u.user.id !== userId);
            if (otherUsers.length > 0) {
              // Try to find the friend in the friends list
              const friendUserId = otherUsers[0].user.id;
              const friend = friends.find(f => f.userId === friendUserId);
              if (friend) {
                setSelectedFriend(friend);
              }
            }
            
            // Enter Focus Mode
            // Set initial focusStatus based on actual isFaceDown state
            // If sensor is not ready or phone is face up, start as PAUSED
            // The useEffect at line 98 will handle state synchronization
            setAppState(AppState.FOCUS);
            // Default to PAUSED, let the useEffect handle the actual state based on isFaceDown
            setFocusStatus(FocusStatus.PAUSED);
          } else if (appState === AppState.FOCUS && isSameSession) {
            // Check if any other user has paused the session
            const otherUserPaused = activeSession.users.some(
              (u: any) => u.userId !== userId && u.isPaused
            );
            
            // Update isSessionPausedByOthers - use functional update to ensure we use latest value
            setIsSessionPausedByOthers((currentValue) => {
              if (otherUserPaused !== currentValue) {
                console.log('checkActiveSessions - Updating isSessionPausedByOthers:', {
                  from: currentValue,
                  to: otherUserPaused,
                  activeSessionUsers: activeSession.users.map((u: any) => ({
                    userId: u.userId,
                    isPaused: u.isPaused
                  }))
                });
                return otherUserPaused;
              }
              return currentValue;
            });
            
            // Only update elapsed time if session is active (not paused)
            // Calculate actual active time by subtracting paused time
            if (focusStatus === FocusStatus.ACTIVE) {
              const sessionStart = new Date(activeSession.startTime);
              const now = new Date();
              const totalElapsedMs = now.getTime() - sessionStart.getTime();
              const totalElapsedSec = Math.floor(totalElapsedMs / 1000);
              // Subtract total paused time to get actual active time
              const activeElapsedSec = Math.max(0, totalElapsedSec - totalPausedSeconds);
              // Update elapsed time to sync with server only when active
              setElapsedSeconds(activeElapsedSec);
            }
            // Don't update elapsed time when paused - timer is already stopped
          }
        } else {
          // No active sessions - if we're in Focus Mode due to auto-created session, exit
          // Check if we have a currentFocusSessionId (means it was auto-created)
          if (appState === AppState.FOCUS && currentFocusSessionId) {
            // Session ended, go back to dashboard
            setAppState(AppState.DASHBOARD);
            setCurrentFocusSessionId(null);
            setElapsedSeconds(0);
            setSessionStartTime(null);
            setSelectedFriend(null);
          }
        }
      } catch (error) {
        console.error('Failed to check active sessions:', error);
      }
    };

    // Check immediately on mount
    checkActiveSessions();

    // Check every 3 seconds for active sessions (more frequent for better UX and faster detection)
    activeSessionCheckIntervalRef.current = setInterval(checkActiveSessions, 3000);

    return () => {
      if (activeSessionCheckIntervalRef.current) {
        clearInterval(activeSessionCheckIntervalRef.current);
      }
    };
  }, [userId, appState, sessionStartTime, currentFocusSessionId, friends]);

  // --- Handlers ---
  const startSearch = () => {
    router.push('/find-friends');
  };

  const startSession = () => {
    // Reset manual exit flag when user starts a new session
    userManuallyExitedRef.current = false;
    setAppState(AppState.FOCUS);
    setElapsedSeconds(0);
    setSessionStartTime(new Date()); // Record actual start time
    setSessionEndTime(null);
    setIceBreaker(null);
    setIsPhoneFaceDown(false);
    setSessionRecorded(false); // Reset session recorded flag when starting new session
    setCurrentFocusSessionId(null); // Reset focus session ID when starting new session
    // Reset pause tracking when starting new session
    setTotalPausedSeconds(0);
    setPauseStartTime(null);
    // Set initial focusStatus based on actual isFaceDown state
    // Default to PAUSED, let the useEffect handle the actual state based on isFaceDown
    setFocusStatus(FocusStatus.PAUSED);
  };

  const endSession = async () => {
    const endTime = new Date();
    setSessionEndTime(endTime);
    
    setIsSaving(true);
    try {
      // If session already exists (auto-created or previously created), end it for all participants
      if (currentFocusSessionId) {
        const response = await fetch(`/api/sessions/${currentFocusSessionId}/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endTime: endTime.toISOString(),
            minutes: Math.floor(elapsedSeconds / 60),
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setSessionRecorded(true);
            console.log('Focus session ended successfully:', result.session);
            // Switch to SUMMARY state
            setAppState(AppState.SUMMARY);
            return;
          }
        }
      }
      
      // If no existing session, create a new one
      // Support multiple friends in a session (friendIds can be empty array)
      // Allow 0 second sessions to be recorded
      if (elapsedSeconds >= 0 && sessionStartTime) {
        // Pass userIds: current user + friend's userId if friend is selected
        const userIds = selectedFriend && selectedFriend.userId
          ? [userId, selectedFriend.userId].sort() // Sort to ensure consistent ordering
          : [userId];
        const result = await createFocusSession(
          userIds, 
          elapsedSeconds,
          sessionStartTime,
          endTime
        );
        if (result.success) {
          setSessionRecorded(true);
          setCurrentFocusSessionId(result.session.id);
          console.log('Focus session recorded successfully:', result.session);
        } else {
          console.error('Failed to save focus session:', result.error);
        }
      } else {
        if (!sessionStartTime) {
          console.warn('Session not recorded: sessionStartTime is missing');
        }
      }
    } catch (error) {
      console.error('Failed to end/save focus session:', error);
    } finally {
      setIsSaving(false);
    }
    
    // Only switch to SUMMARY state after attempting to save
    setAppState(AppState.SUMMARY);
  };

  // Ensure session is recorded when SessionSummary is displayed (backup mechanism)
  // Allow 0 second sessions to be recorded
  useEffect(() => {
    if (appState === AppState.SUMMARY && !sessionRecorded && elapsedSeconds >= 0 && sessionStartTime) {
      const ensureSessionRecorded = async () => {
        setIsSaving(true);
        try {
          // Pass userIds: current user + friend's userId if friend is selected
          const userIds = selectedFriend && selectedFriend.userId
            ? [userId, selectedFriend.userId].sort() // Sort to ensure consistent ordering
            : [userId];
          const endTime = sessionEndTime || new Date();
          const result = await createFocusSession(
            userIds, 
            elapsedSeconds,
            sessionStartTime,
            endTime
          );
          if (result.success) {
            setSessionRecorded(true);
            setCurrentFocusSessionId(result.session.id);
            console.log('Focus session recorded successfully (backup):', result.session);
          } else {
            console.error('Failed to save focus session (backup):', result.error);
          }
        } catch (error) {
          console.error('Failed to save focus session (backup):', error);
        } finally {
          setIsSaving(false);
        }
      };
      // Small delay to ensure endSession has completed
      const timeoutId = setTimeout(ensureSessionRecorded, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [appState, sessionRecorded, selectedFriend, elapsedSeconds, userId, sessionStartTime, sessionEndTime]);

  const handleUnlockPhotoMoment = () => {
    if (!sessionEndTime) setSessionEndTime(new Date()); // Fallback if missing
    setAppState(AppState.POST_MEMORY);
  };

  const handleCreateMemory = async (photoUrl?: string | string[], eventName?: string, caption?: string, location?: string, mood?: string, happyIndex?: number) => {
    setIsSaving(true);
    try {
      // Check if focus session ID exists
      if (!currentFocusSessionId) {
        alert('Focus session not found. Please complete a focus session first.');
        setAppState(AppState.DASHBOARD);
        return;
      }

      // Create memory with photo
      // eventName is stored as content, caption is for additional description
      const result = await createMemoryWithPhoto(
        currentFocusSessionId,
        photoUrl,
        eventName, // eventName goes to content field
        location,
        happyIndex,
        mood // Pass vibe check value as type
      );

      if (result.success) {
        setAppState(AppState.DASHBOARD);
        // Reset selected friend after creating memory
        setSelectedFriend(null);
      } else {
        console.error('Failed to create memory:', result.error);
        alert(result.error || 'Failed to create memory. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create memory:', error);
      alert('An error occurred while creating the memory. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSparkConversation = async () => {
    if (loadingIceBreaker) return;
    setLoadingIceBreaker(true);
    const question = await generateIceBreaker();
    setIceBreaker(question);
    setLoadingIceBreaker(false);
  };

  const handleFriendClick = (friend: Friend) => {
    setSelectedFriend(friend);
    setAppState(AppState.FRIEND_PROFILE);
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Load Spring Bloom data when QUARTERLY_FEEDBACK state is activated
  useEffect(() => {
    if (appState === AppState.QUARTERLY_FEEDBACK && springBloomData.length === 0 && !springBloomLoading) {
      const loadSpringBloomData = async () => {
        setSpringBloomLoading(true);
        try {
          console.log('Loading Spring Bloom data...');
          const result = await getSpringBloomDataAction();
          console.log('Spring Bloom data result:', result);
          if (result.success && result.data) {
            setSpringBloomData(result.data);
            console.log('Spring Bloom data loaded:', result.data.length, 'friends');
          } else {
            console.error('Failed to load Spring Bloom data:', result.error);
            setSpringBloomData([]);
          }
        } catch (error) {
          console.error('Error loading Spring Bloom data:', error);
          setSpringBloomData([]);
        } finally {
          setSpringBloomLoading(false);
        }
      };
      loadSpringBloomData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState]);

  return (
    // Main Container ensuring iPhone dimensions on Desktop
    <div className="w-full h-dvh bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-[414px] bg-zinc-950 relative overflow-hidden shadow-2xl border-x border-zinc-900/50">
        {/* Sensor Permission Banner - Only show on dashboard */}
        {appState === AppState.DASHBOARD && showSensorBanner && (
          <div className="absolute top-0 left-0 right-0 z-50">
            <SensorPermissionBanner
              onRequestPermission={requestPermission}
              onDismiss={dismissSensorBanner}
            />
          </div>
        )}
        
        <SwipePreviewWrapper currentPath="/">
          {/* Dashboard Content */}
          <div className="w-full h-full">
              <Dashboard
                friends={friends}
                chartData={chartData}
                user={user}
                onOpenHappyIndex={() => router.push('/happy-index')}
                onFriendClick={handleFriendClick}
                onSearch={startSearch}
                onSpringRecap={() => setAppState(AppState.QUARTERLY_FEEDBACK)}
                onStartSession={startSession}
              />
          </div>
        </SwipePreviewWrapper>

        {/* Bottom Navigation - Hidden during Focus, Summary, Post Memory, and Spring Bloom modes */}
        {appState !== AppState.FOCUS && 
         appState !== AppState.SUMMARY && 
         appState !== AppState.POST_MEMORY &&
         appState !== AppState.QUARTERLY_FEEDBACK && (
          <BottomNav />
        )}

        {/* Global Modals */}
        {appState === AppState.FRIEND_PROFILE && selectedFriend && (
          <div className="absolute inset-0 z-50">
            <FriendProfile friend={selectedFriend} onBack={() => setAppState(AppState.DASHBOARD)} />
          </div>
        )}

        {/* Other Full Screen Overlays */}
        {appState === AppState.SEARCHING && (
          <div className="absolute inset-0 z-[70] bg-zinc-950">
            <Searching onCancel={() => setAppState(AppState.DASHBOARD)} />
          </div>
        )}
        
        {appState === AppState.FOUND && (
          <div className="absolute inset-0 z-[70] bg-zinc-950">
            <Found friend={selectedFriend} onClose={() => setAppState(AppState.DASHBOARD)} />
          </div>
        )}
        
        {appState === AppState.FOCUS && (
          <FocusMode
            focusStatus={focusStatus}
            elapsedSeconds={elapsedSeconds}
            isPhoneFaceDown={isPhoneFaceDown}
            iceBreaker={iceBreaker}
            loadingIceBreaker={loadingIceBreaker}
            onToggleSimulation={() => setIsPhoneFaceDown(!isPhoneFaceDown)}
            onSparkConversation={handleSparkConversation}
            onDismissIceBreaker={() => setIceBreaker(null)}
            onEndSession={endSession}
            formatTime={formatTime}
            sensorAvailable={sensorAvailable}
            permissionStatus={permissionStatus}
            onRequestPermission={requestPermission}
          />
        )}
        
        {appState === AppState.SUMMARY && (
          <div className="absolute inset-0 z-[70] bg-zinc-950">
            <SessionSummary
              elapsedSeconds={elapsedSeconds}
              formatTime={formatTime}
              onUnlockPhotoMoment={handleUnlockPhotoMoment}
              onReturnHome={() => {
                // Mark that user manually exited, prevent auto-reentry
                userManuallyExitedRef.current = true;
                // Clear all session-related state when returning home
                setAppState(AppState.DASHBOARD);
                setCurrentFocusSessionId(null);
                setSessionStartTime(null);
                setSessionEndTime(null);
                setElapsedSeconds(0);
                setSelectedFriend(null);
                setSessionRecorded(false);
                setIsSessionPausedByOthers(false);
              }}
            />
          </div>
        )}
        
        {appState === AppState.QUARTERLY_FEEDBACK && (
          <SpringRecap 
            onClose={() => {
              setAppState(AppState.DASHBOARD);
              // Reset Spring Bloom data when closing
              setSpringBloomData([]);
            }} 
            data={springBloomData}
            loading={springBloomLoading}
          />
        )}
        
        {appState === AppState.POST_MEMORY && (
          <div className="absolute inset-0 z-[70] bg-zinc-950">
            <PostMemory
              durationSeconds={elapsedSeconds}
              sessionEndTime={sessionEndTime || new Date()}
              friend={selectedFriend}
              onBack={() => setAppState(AppState.SUMMARY)}
              onPost={handleCreateMemory}
              isSaving={isSaving}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default DashboardClient;

