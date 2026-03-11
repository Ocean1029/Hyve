import { Session, User, PlaceAggregate } from '../types';
import { PX_PER_MINUTE, MIN_LAYER_HEIGHT, MAX_LAYER_HEIGHT } from './constants';

export const formatSeconds = (totalSeconds: number) => {
 const h = Math.floor(totalSeconds / 3600);
 const m = Math.floor((totalSeconds % 3600) / 60);
 const s = totalSeconds % 60;
 return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const PLACE_META: Record<string, { name: string, lat: number, lng: number, type: 'friend'|'ad'|'public', price?: string }> = {
 'b1': { name: 'Taipei 101 Sanctum', lat: 25.0339, lng: 121.5645, type: 'public' },
 'p1': { name: 'Xinyi Eslite Cafe', lat: 25.0390, lng: 121.5660, type: 'ad', price: '$5' },
 'p2': { name: 'Sun Yat-sen Park', lat: 25.0395, lng: 121.5600, type: 'friend' }
};

export function aggregateSessions(sessions: Session[], friends: User[]): PlaceAggregate[] {
 const friendMap = new Map(friends.map(f => [f.id, f]));
 const placesMap = new Map<string, PlaceAggregate>();
 const now = Date.now();
 const oneDay = 24 * 60 * 60 * 1000;


 for (const s of sessions) {
   if (!placesMap.has(s.placeId)) {
     const meta = PLACE_META[s.placeId];
     if (!meta) continue;
     placesMap.set(s.placeId, {
       placeId: s.placeId, name: meta.name, lat: meta.lat, lng: meta.lng, type: meta.type, totalMinutes: 0, layers: [], isActiveToday: false, price: meta.price
     });
   }
   const place = placesMap.get(s.placeId)!;
   place.totalMinutes += s.focusedMinutes;
  
   const isToday = (now - s.endTime) < oneDay;
   if (isToday) place.isActiveToday = true;


   let layer = place.layers.find(l => l.friendId === s.friendId);
   if (!layer) {
     const friend = friendMap.get(s.friendId);
     layer = { friendId: s.friendId, minutes: 0, heightPx: 0, color: friend?.color || '#888888', isToday: false };
     place.layers.push(layer);
   }
   layer.minutes += s.focusedMinutes;
   if (isToday) layer.isToday = true;
 }
 return Array.from(placesMap.values()).map(place => {
   const computedLayers = place.layers.map(l => ({ ...l, heightPx: Math.max(MIN_LAYER_HEIGHT, Math.min(l.minutes * PX_PER_MINUTE, MAX_LAYER_HEIGHT)) }));
   return { ...place, layers: computedLayers };
 });
}
