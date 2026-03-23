import { Session, User, PlaceAggregate } from '../types';
import { PX_PER_MINUTE, MIN_LAYER_HEIGHT, MAX_LAYER_HEIGHT } from './constants';

export const formatSeconds = (totalSeconds: number) => {
 const h = Math.floor(totalSeconds / 3600);
 const m = Math.floor((totalSeconds % 3600) / 60);
 const s = totalSeconds % 60;
 return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const PLACE_META: Record<string, { name: string, lat: number, lng: number, type: 'friend'|'ad'|'public', price?: string, imageUrl?: string, address?: string }> = {
 'b1': { name: 'Taipei 101 Sanctum', lat: 25.0339, lng: 121.5645, type: 'public', imageUrl: 'https://picsum.photos/seed/101/400/400', address: 'No. 7, Sec. 5, Xinyi Rd, Taipei' },
 'p1': { name: 'Xinyi Eslite Cafe', lat: 25.0390, lng: 121.5660, type: 'ad', price: '$5', imageUrl: 'https://picsum.photos/seed/eslite/400/400', address: 'No. 11, Songgao Rd, Taipei' },
 'p2': { name: 'Sun Yat-sen Park', lat: 25.0395, lng: 121.5600, type: 'friend', imageUrl: 'https://picsum.photos/seed/park/400/400', address: 'No. 505, Sec. 4, Ren’ai Rd, Taipei' },
 'c1': { name: 'Da Vinci Coffee', lat: 25.0420, lng: 121.5630, type: 'public', address: 'No. 123, Songren Rd, Taipei' },
 'g1': { name: 'Gym Center', lat: 25.0350, lng: 121.5580, type: 'public', address: 'No. 45, Sec. 4, Xinyi Rd, Taipei' },
 'gh1': { name: 'Glass House', lat: 25.0410, lng: 121.5680, type: 'public', address: 'No. 88, Songgao Rd, Taipei' },
 'a1': { name: 'The Archive', lat: 25.0380, lng: 121.5610, type: 'public', address: 'No. 200, Sec. 5, Xinyi Rd, Taipei' },
 'l1': { name: 'Central Library', lat: 25.0300, lng: 121.5400, type: 'public', address: 'No. 20, Sec. 3, Xinyi Rd, Taipei' }
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
       placeId: s.placeId, 
       name: meta.name, 
       lat: meta.lat, 
       lng: meta.lng, 
       type: meta.type, 
       totalMinutes: 0, 
       layers: [], 
       isActiveToday: false, 
       price: meta.price,
       imageUrl: meta.imageUrl,
       address: meta.address
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
