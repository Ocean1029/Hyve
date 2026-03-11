import React, { useState, useMemo } from 'react';
import { Search, Home, Map as MapIcon, UserPlus } from 'lucide-react';
import { AppScreen, PlaceAggregate, User } from './types';
import { ScreenWrapper, NavIcon } from './components/UI';
import { StatusBar } from './components/StatusBar';
import { useEffect } from 'react';
import { SessionRecapModal } from './components/SessionRecapModal';
import { UserProfileScreen, FriendProfileScreen } from './components/ProfileScreens';
import { RadarScreen } from './components/RadarScreen';
import { SearchScreen } from './components/SearchScreen';
import { MessageScreen } from './components/MessageScreen';
import { HomeScreen } from './components/HomeScreen';
import { MapScreen } from './components/MapScreen';
import { SessionJourneyContainer } from './components/PostSessionScreen';
import { CURRENT_USER, FRIENDS_DATA, MOCK_SESSIONS } from './src/data_constants';
import { aggregateSessions } from './src/utils';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<AppScreen>(AppScreen.HOME);
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  const [takenColors, setTakenColors] = useState<string[]>([]);
  const [focusedFriend, setFocusedFriend] = useState<User | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<PlaceAggregate | null>(null);
  const [recapFriend, setRecapFriend] = useState<User | null>(null);
  const [activeChatFriend, setActiveChatFriend] = useState<User | null>(null);
  const [isLightMode, setIsLightMode] = useState(false);

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

  const friends = useMemo(() => FRIENDS_DATA, []);
  const buildings = useMemo(() => aggregateSessions(MOCK_SESSIONS, friends), [friends]);

  const handleNavigate = (screen: AppScreen, user?: User) => {
    setActiveScreen(screen);
    if (user) {
      if (screen === AppScreen.PROFILE) {
         setFocusedFriend(user.id === currentUser.id ? null : user);
      } else if (screen === AppScreen.MAP) {
         setFocusedFriend(user);
      } else if (screen === AppScreen.RECAP) {
         setRecapFriend(user);
      } else if (screen === AppScreen.MESSAGES) {
         setActiveChatFriend(user);
      }
    }
  };

  const handleColorChange = (newColor: string) => {
    setCurrentUser(prev => ({ ...prev, color: newColor }));
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
    AppScreen.RECAP,
    AppScreen.MESSAGES,
    AppScreen.RADAR,
    AppScreen.MAP
  ].includes(activeScreen);

  return (
    <ScreenWrapper noPadding={isFullScreen}>
      <StatusBar />
      
      {/* MAIN CONTENT AREA */}
      <div className="flex-1 relative min-h-0">
        {activeScreen === AppScreen.HOME && (
          <HomeScreen 
            onNavigate={handleNavigate} 
            buildings={buildings} 
            onStartRitual={() => setActiveScreen(AppScreen.SESSION_LIVE)}
            friends={friends}
            currentUser={currentUser}
          />
        )}
        
        {activeScreen === AppScreen.SEARCH && (
          <SearchScreen onNavigate={handleNavigate} friends={friends} />
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
          />
        )}

        {/* OVERLAYS */}
        {activeScreen === AppScreen.PROFILE && focusedFriend && (
           <FriendProfileScreen 
              user={focusedFriend} 
              onClose={() => setActiveScreen(AppScreen.HOME)} 
              currentUser={currentUser}
              takenColors={takenColors}
              onColorChange={() => {}}
              isLightMode={isLightMode}
           />
        )}
        
        {activeScreen === AppScreen.PROFILE && !focusedFriend && (
           <UserProfileScreen 
              user={currentUser} 
              onClose={() => setActiveScreen(AppScreen.HOME)} 
              currentUser={currentUser}
              takenColors={takenColors}
              onColorChange={handleColorChange}
              isLightMode={isLightMode}
              onToggleTheme={() => setIsLightMode(!isLightMode)}
           />
        )}

        {activeScreen === AppScreen.RECAP && recapFriend && (
           <SessionRecapModal 
              friend={recapFriend} 
              onClose={() => setActiveScreen(AppScreen.HOME)} 
              onProfileClick={() => handleNavigate(AppScreen.PROFILE, recapFriend)}
           />
        )}

        {activeScreen === AppScreen.MESSAGES && activeChatFriend && (
           <MessageScreen 
              friend={activeChatFriend} 
              onClose={() => setActiveScreen(AppScreen.SEARCH)} 
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
      </div>

      {/* BOTTOM NAVIGATION */}
      {[AppScreen.HOME, AppScreen.SEARCH, AppScreen.MAP].includes(activeScreen) && (
        <div className="absolute bottom-6 left-6 right-6 h-16 glass-panel rounded-full flex items-center justify-between px-6 z-[900] shadow-soft">
          <NavIcon 
            icon={<UserPlus size={20} />} 
            label="Friends" 
            isActive={activeScreen === AppScreen.SEARCH || activeScreen === AppScreen.RADAR} 
            onClick={() => setActiveScreen(AppScreen.SEARCH)} 
          />
          <NavIcon 
            icon={<Home size={20} />} 
            label="Home" 
            isActive={activeScreen === AppScreen.HOME} 
            onClick={() => setActiveScreen(AppScreen.HOME)} 
          />
          <NavIcon 
            icon={<MapIcon size={20} />} 
            label="Map" 
            isActive={activeScreen === AppScreen.MAP} 
            onClick={() => setActiveScreen(AppScreen.MAP)} 
          />
        </div>
      )}
    </ScreenWrapper>
  );
}
