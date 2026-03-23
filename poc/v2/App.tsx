import React, { useState, useMemo } from 'react';
import { Search, Home, Map as MapIcon, UserPlus } from 'lucide-react';
import { AppScreen, PlaceAggregate, User, SessionLog, Widget } from './types';
import { SESSION_LOGS } from './data';
import { ScreenWrapper, NavIcon, ErrorBoundary } from './components/UI';
import { StatusBar } from './components/StatusBar';
import { useEffect } from 'react';
import { SessionRecapModal } from './components/SessionRecapModal';
import { UserProfileScreen, FriendProfileScreen } from './components/ProfileScreens';
import { RadarScreen } from './components/RadarScreen';
import { SearchScreen } from './components/SearchScreen';
import { MessageScreen } from './components/MessageScreen';
import { HomeScreen } from './components/HomeScreen';
import { MapScreen } from './components/MapScreen';
import { SessionLogScreen } from './components/SessionLogScreen';
import { SessionJourneyContainer } from './components/PostSessionScreen';
import { WidgetHomeScreen } from './components/WidgetHomeScreen';
import { CURRENT_USER, FRIENDS_DATA, MOCK_SESSIONS } from './src/data_constants';
import { aggregateSessions } from './src/utils';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<AppScreen>(AppScreen.HOME);
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  const [friends, setFriends] = useState<User[]>(FRIENDS_DATA);
  const [focusedFriend, setFocusedFriend] = useState<User | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<PlaceAggregate | null>(null);
  const [recapFriend, setRecapFriend] = useState<User | null>(null);
  const [selectedSessionLog, setSelectedSessionLog] = useState<SessionLog | null>(null);
  const [activeChatFriend, setActiveChatFriend] = useState<User | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<AppScreen[]>([]);
  const [isLightMode, setIsLightMode] = useState(false);
  const [widgets, setWidgets] = useState<Widget[]>(() => {
    const saved = localStorage.getItem('hyve_widgets');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', type: 'today_focus', size: 3, position: 0 },
      { id: '2', type: 'messages', size: 2, position: 4 },
      { id: '3', type: 'map', size: 4, position: 6 },
      { id: '4', type: 'profile', size: 1, position: 8 },
      { id: '5', type: 'radar', size: 1, position: 9 },
    ];
  });

  useEffect(() => {
    localStorage.setItem('hyve_widgets', JSON.stringify(widgets));
  }, [widgets]);

  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      if (isLightMode) {
        root.classList.add('light-mode');
      } else {
        root.classList.remove('light-mode');
      }
    }
  }, [isLightMode]);

  const takenColors = useMemo(() => {
    return [currentUser.color, ...friends.map(f => f.color)];
  }, [currentUser.color, friends]);

  const buildings = useMemo(() => aggregateSessions(MOCK_SESSIONS, friends), [friends]);

  // Handle pending building selection from home widget
  useEffect(() => {
    if (activeScreen === AppScreen.MAP && (window as any).pendingBuildingSelect) {
      setSelectedBuilding((window as any).pendingBuildingSelect);
      delete (window as any).pendingBuildingSelect;
    }
  }, [activeScreen]);

  const handleNavigate = (screen: AppScreen, user?: User, sessionLog?: SessionLog) => {
    setNavigationHistory(prev => [...prev, activeScreen]);
    setActiveScreen(screen);
    if (sessionLog) {
      setSelectedSessionLog(sessionLog);
    }
    if (user) {
      if (screen === AppScreen.PROFILE) {
         setFocusedFriend(user.id === currentUser.id ? null : user);
      } else if (screen === AppScreen.MAP) {
         setFocusedFriend(user);
      } else if (screen === AppScreen.SESSION_LOG || screen === AppScreen.RECAP) {
         setRecapFriend(user || null);
         // If no session log provided, default to the last one for this friend
         if (!sessionLog && user) {
            const lastLog = SESSION_LOGS.find((s: SessionLog) => s.friendId === user.id);
            setSelectedSessionLog(lastLog || null);
         }
      } else if (screen === AppScreen.MESSAGES) {
         setActiveChatFriend(user);
      }
    }
  };

  const handleColorChange = (newColor: string) => {
    setCurrentUser(prev => ({ ...prev, color: newColor }));
  };

  const handleFriendColorChange = (friendId: string, newColor: string) => {
    setFriends(prev => prev.map(f => f.id === friendId ? { ...f, color: newColor } : f));
    if (focusedFriend?.id === friendId) {
      setFocusedFriend(prev => prev ? { ...prev, color: newColor } : null);
    }
  };

  const isPostSession = [
    AppScreen.SESSION_LIVE, 
    AppScreen.POST_SESSION_1, 
    AppScreen.POST_SESSION_2, 
    AppScreen.POST_SESSION_3, 
    AppScreen.POST_SESSION_4
  ].includes(activeScreen);

  const isFullScreen = isPostSession || [
    AppScreen.PROFILE,
    AppScreen.SESSION_LOG,
    AppScreen.RECAP,
    AppScreen.MESSAGES,
    AppScreen.RADAR,
    AppScreen.MAP,
    AppScreen.WIDGET_HOME
  ].includes(activeScreen);

  return (
    <ScreenWrapper noPadding={isFullScreen}>
      <StatusBar />
      
      {/* MAIN CONTENT AREA */}
      <div className="flex-1 relative min-h-0">
        <ErrorBoundary>
          {activeScreen === AppScreen.HOME && (
            <HomeScreen 
              onNavigate={handleNavigate} 
              buildings={buildings} 
              onStartRitual={() => setActiveScreen(AppScreen.SESSION_LIVE)}
              friends={friends}
              currentUser={currentUser}
              isLightMode={isLightMode}
            />
          )}
          
          {activeScreen === AppScreen.SEARCH && (
            <SearchScreen onNavigate={handleNavigate} friends={friends} isLightMode={isLightMode} />
          )}

          {/* --- NEW: RADAR SCREEN --- */}
          {activeScreen === AppScreen.RADAR && (
            <RadarScreen onNavigate={handleNavigate} onClose={() => setActiveScreen(AppScreen.SEARCH)} />
          )}
          
          {activeScreen === AppScreen.MAP && (
            <MapScreen 
               buildings={buildings} 
               onSelectBuilding={setSelectedBuilding} 
               selectedBuilding={selectedBuilding}
               friends={friends}
               isActive={true}
               focusedFriendId={focusedFriend?.id}
               isLightMode={isLightMode}
            />
          )}

          {activeScreen === AppScreen.WIDGET_HOME && (
            <WidgetHomeScreen 
              currentUser={currentUser} 
              onNavigate={handleNavigate}
              friends={friends}
              buildings={buildings}
              isLightMode={isLightMode}
              widgets={widgets}
              setWidgets={setWidgets}
            />
          )}

          {/* OVERLAYS */}
          {activeScreen === AppScreen.PROFILE && focusedFriend && (
             <FriendProfileScreen 
                user={focusedFriend} 
                onClose={() => {
                  const lastScreen = navigationHistory[navigationHistory.length - 1] || AppScreen.HOME;
                  setActiveScreen(lastScreen);
                  setNavigationHistory(prev => prev.slice(0, -1));
                }} 
                currentUser={currentUser}
                takenColors={takenColors}
                onColorChange={(color) => handleFriendColorChange(focusedFriend.id, color)}
                isLightMode={isLightMode}
                onNavigate={handleNavigate}
             />
          )}
          
          {activeScreen === AppScreen.PROFILE && !focusedFriend && (
             <UserProfileScreen 
                user={currentUser} 
                onClose={() => {
                  const lastScreen = navigationHistory[navigationHistory.length - 1] || AppScreen.HOME;
                  setActiveScreen(lastScreen);
                  setNavigationHistory(prev => prev.slice(0, -1));
                }} 
                currentUser={currentUser}
                takenColors={takenColors}
                onColorChange={handleColorChange}
                isLightMode={isLightMode}
                onToggleTheme={() => setIsLightMode(!isLightMode)}
                onNavigate={handleNavigate}
             />
          )}

          {(activeScreen === AppScreen.SESSION_LOG || activeScreen === AppScreen.RECAP) && selectedSessionLog && (
             <SessionLogScreen 
                sessionLog={selectedSessionLog}
                friend={friends.find(f => f.id === selectedSessionLog.friendId) || friends[0]}
                onClose={() => {
                  const lastScreen = navigationHistory[navigationHistory.length - 1] || AppScreen.HOME;
                  setActiveScreen(lastScreen);
                  setNavigationHistory(prev => prev.slice(0, -1));
                }}
                isLightMode={isLightMode}
             />
          )}

          {activeScreen === AppScreen.MESSAGES && activeChatFriend && (
             <MessageScreen 
                friend={activeChatFriend} 
                onClose={() => setActiveScreen(AppScreen.SEARCH)} 
                onNavigate={setActiveScreen}
             />
          )}

          {isPostSession && (
            <SessionJourneyContainer 
               currentScreen={activeScreen}
               currentUser={currentUser}
               friends={friends}
               onNavigate={setActiveScreen}
               onClose={() => setActiveScreen(AppScreen.HOME)}
            />
          )}
        </ErrorBoundary>
      </div>

      {/* BOTTOM NAVIGATION */}
      {[AppScreen.HOME, AppScreen.SEARCH, AppScreen.MAP, AppScreen.WIDGET_HOME].includes(activeScreen) && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[220px] h-14 glass-panel rounded-full flex items-center justify-around px-2 z-[900] shadow-soft border border-white/5">
          <NavIcon 
            icon={<UserPlus size={20} />} 
            isActive={activeScreen === AppScreen.SEARCH || activeScreen === AppScreen.RADAR} 
            onClick={() => setActiveScreen(AppScreen.SEARCH)} 
          />
          <NavIcon 
            icon={<Home size={20} />} 
            isActive={activeScreen === AppScreen.HOME} 
            onClick={() => setActiveScreen(AppScreen.HOME)} 
          />
          <NavIcon 
            icon={<MapIcon size={20} />} 
            isActive={activeScreen === AppScreen.MAP} 
            onClick={() => setActiveScreen(AppScreen.MAP)} 
          />
        </div>
      )}
    </ScreenWrapper>
  );
}
