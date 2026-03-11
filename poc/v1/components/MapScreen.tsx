import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as L from 'leaflet';
import { Filter, Check, MapPin, Star, Building } from 'lucide-react';
import { AppScreen, User, PlaceAggregate } from '../types';
import { Avatar } from './UI';
import { MapVisualization, Leaflet3DMarker } from './MapVisualization';

export const MapScreen = ({ buildings, onSelectBuilding, selectedBuilding, friends, isActive, focusedFriendId }: { buildings: PlaceAggregate[], onSelectBuilding: (b: PlaceAggregate | null) => void, selectedBuilding: PlaceAggregate | null, friends: User[], isActive: boolean, focusedFriendId?: string | null }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [leafletMap, setLeafletMap] = useState<L.Map | null>(null);
  const [activeFilter, setActiveFilter] = useState<'T' | 'W' | 'M'>('T');
  
  // Friend Filter State
  const [showFriendFilter, setShowFriendFilter] = useState(false);
  const [selectedFriendsFilter, setSelectedFriendsFilter] = useState<Set<string>>(new Set());

  // Auto-select friend if navigated from profile
  useEffect(() => {
     if (focusedFriendId && isActive) {
        setSelectedFriendsFilter(new Set([focusedFriendId]));
        setShowFriendFilter(true);
     }
  }, [focusedFriendId, isActive]);


  useEffect(() => {
    let mapInstance: L.Map | null = null;
    if (mapRef.current && !leafletMap) {
      mapInstance = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([25.0339, 121.5645], 16);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20, opacity: 0.8 }).addTo(mapInstance);
      setLeafletMap(mapInstance);
    }
    return () => { if (mapInstance) { mapInstance.remove(); setLeafletMap(null); } };
  }, []);


  useEffect(() => {
    if (isActive && leafletMap) {
      setTimeout(() => { leafletMap.invalidateSize(); }, 100);
    }
  }, [isActive, leafletMap]);

  const toggleFriendFilter = (id: string) => {
     const next = new Set(selectedFriendsFilter);
     if (next.has(id)) next.delete(id);
     else next.add(id);
     setSelectedFriendsFilter(next);
  };

  return (
     <div className="absolute inset-0 z-0 bg-hyve-bg1">
       <div ref={mapRef} className="absolute inset-0 z-0" />
       
       {/* RIGHT VERTICAL FILTER BAR */}
       <div className="absolute top-24 right-4 flex flex-col gap-4 z-[400] pointer-events-auto items-center">
         
         {/* Time Filters Group */}
         <div className="glass-panel p-1.5 rounded-full flex flex-col gap-2 bg-black/40 backdrop-blur-md border-white/10 shadow-soft">
           {(['T', 'W', 'M'] as const).map(filter => (
             <button
               key={filter}
               onClick={() => setActiveFilter(filter)}
               className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                 activeFilter === filter 
                   ? 'bg-hyve-gold text-hyve-bg0 shadow-gold-glow scale-110' 
                   : 'text-hyve-text3 hover:text-white hover:bg-white/10'
               }`}
             >
               {filter}
             </button>
           ))}
         </div>
         
         {/* Friend Filter Toggle */}
         <button 
           onClick={() => setShowFriendFilter(!showFriendFilter)}
           className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border shadow-soft active:scale-95 ${
             showFriendFilter || selectedFriendsFilter.size > 0 
               ? 'bg-hyve-text1 text-hyve-bg0 border-white' 
               : 'glass-panel text-hyve-text1 border-white/10 bg-black/40'
           }`}
         >
           <Filter size={18} />
           {selectedFriendsFilter.size > 0 && (
             <div className="absolute top-0 right-0 w-3 h-3 bg-hyve-gold rounded-full border-2 border-black" />
           )}
         </button>
       </div>
       
       {/* FRIEND FILTER POPOVER (Left of bar) */}
       {showFriendFilter && (
         <div className="absolute top-24 right-20 w-48 glass-panel rounded-2xl p-2 z-[400] animate-flip-in origin-top-right bg-black/60 backdrop-blur-xl border-white/10 shadow-2xl">
            <div className="flex justify-between items-center px-3 py-2 mb-1 border-b border-white/5">
               <h4 className="text-[9px] font-black text-hyve-text3 uppercase tracking-widest">Filter By Friend</h4>
               <button onClick={() => setSelectedFriendsFilter(new Set())} className="text-[8px] text-hyve-gold font-bold uppercase hover:underline">Clear</button>
            </div>
            <div className="max-h-56 overflow-y-auto no-scrollbar space-y-1 p-1">
              {friends.map(f => {
                const isActive = selectedFriendsFilter.has(f.id);
                return (
                  <button 
                   key={f.id}
                   onClick={() => toggleFriendFilter(f.id)}
                   className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200 ${isActive ? 'bg-hyve-gold/20 border border-hyve-gold/30' : 'hover:bg-white/5 border border-transparent'}`}
                  >
                     <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${isActive ? 'border-hyve-gold bg-hyve-gold' : 'border-white/30'}`}>
                       {isActive && <Check size={8} className="text-black" />}
                     </div>
                     <Avatar src={f.avatarUrl} size="sm" />
                     <span className={`text-xs ${isActive ? 'font-bold text-hyve-text1' : 'font-medium text-hyve-text2'}`}>{f.name}</span>
                  </button>
                )
              })}
            </div>
         </div>
       )}

       {/* BOTTOM SCROLLABLE SHEET (Ads/Places) */}
       <div className="absolute bottom-[88px] left-0 right-0 z-[400] pointer-events-none">
          <div className="flex overflow-x-auto px-6 gap-3 no-scrollbar pb-4 pointer-events-auto snap-x snap-mandatory">
             {/* Mocking some nearby data mixed with buildings */}
             {buildings.map((b, i) => {
                const isAd = b.type === 'ad';
                return (
                   <div 
                     key={b.placeId}
                     onClick={() => {
                         if (leafletMap) leafletMap.flyTo([b.lat, b.lng], 18);
                         onSelectBuilding(b);
                     }}
                     className={`snap-center shrink-0 w-52 p-2.5 rounded-3xl backdrop-blur-xl border transition-all active:scale-95 cursor-pointer flex gap-3 items-center ${
                         isAd 
                         ? 'bg-hyve-gold/10 border-hyve-gold/30 shadow-[0_8px_32px_rgba(201,168,106,0.15)]' 
                         : 'bg-black/60 border-white/10 shadow-soft'
                     }`}
                   >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isAd ? 'bg-hyve-gold text-black' : 'bg-white/10 text-white'}`}>
                         {isAd ? <Star size={20} fill="currentColor" /> : <Building size={20} />}
                      </div>
                      <div className="min-w-0 flex-1">
                         <div className="flex justify-between items-start">
                            <h3 className={`text-xs font-bold truncate mb-0.5 ${isAd ? 'text-hyve-gold' : 'text-hyve-text1'}`}>{b.name}</h3>
                            {isAd && <span className="text-[8px] font-black bg-hyve-gold text-black px-1.5 py-0.5 rounded-md">AD</span>}
                         </div>
                         <p className="text-[10px] text-hyve-text3 truncate">{isAd ? 'Sponsored Sanctum' : `${Math.round(b.totalMinutes)} mins total`}</p>
                         <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1 text-[9px] text-hyve-text2">
                               <MapPin size={10} />
                               <span>0.{i + 2}km</span>
                            </div>
                            {b.price && (
                               <div className="flex items-center gap-1 text-[9px] text-hyve-text2">
                                  <span className="text-hyve-gold font-bold">{b.price}</span>
                               </div>
                            )}
                         </div>
                      </div>
                   </div>
                );
             })}
          </div>
       </div>

       {/* Markers */}
       {leafletMap && buildings.map(b => (
          <Leaflet3DMarker key={b.placeId} map={leafletMap} building={b} onClick={onSelectBuilding} />
       ))}
    </div>
 );
};
