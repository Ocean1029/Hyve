import React, { useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import * as L from 'leaflet';
import { PlaceAggregate, Layer } from '../types';


interface MapVisualizationProps {
 building?: PlaceAggregate;
 variant?: 'full' | 'wedge' | 'marker';
 onClick?: () => void;
}


// --- UTILS ---
function hexToRgb(hex: string) {
 let c = hex.replace("#", "");
 if (c.length === 3) c = c.split('').map(x => x + x).join('');
 const r = parseInt(c.substring(0, 2), 16);
 const g = parseInt(c.substring(2, 4), 16);
 const b = parseInt(c.substring(4, 6), 16);
 return { r, g, b };
}


function rgb(r: number, g: number, b: number) {
 const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
 return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`;
}


// --- ARCHITECTURAL COLOR ENGINE ---
function getArchitecturalColor(hex: string, brightnessOffset = 0, grayscale = false) {
 const base = { r: 28, g: 30, b: 34 }; // Deeper charcoal base
 const friend = hexToRgb(hex);


 // Less gray, more color (but still grounded)
 const mixRatio = 0.62;


 let mixed = {
   r: base.r * mixRatio + friend.r * (1 - mixRatio),
   g: base.g * mixRatio + friend.g * (1 - mixRatio),
   b: base.b * mixRatio + friend.b * (1 - mixRatio),
 };

 if (grayscale) {
    const lum = 0.2126 * mixed.r + 0.7152 * mixed.g + 0.0722 * mixed.b;
    mixed = { r: lum, g: lum, b: lum };
 }


 // Distinct faces: Top (Lightest), Left (Mid), Right (Shadow)
 const top = rgb(mixed.r + 18 + brightnessOffset, mixed.g + 18 + brightnessOffset, mixed.b + 18 + brightnessOffset);
 const left = rgb(mixed.r + 6 + brightnessOffset, mixed.g + 6 + brightnessOffset, mixed.b + 6 + brightnessOffset);
 const right = rgb(mixed.r - 10 + brightnessOffset, mixed.g - 10 + brightnessOffset, mixed.b - 10 + brightnessOffset);


 return { top, left, right };
}


function clamp(num: number, min: number, max: number) {
 return Math.min(Math.max(num, min), max);
}


// --- COMPONENT ---
export const MapVisualization: React.FC<MapVisualizationProps> = ({ building, variant = 'full', onClick }) => {
 const isMarker = variant === 'marker';
  if (isMarker && building) {
   const size = 32;
   // Calculate total visual height for shadow
   const totalHeight = building.layers.reduce((sum, l) => sum + l.heightPx, 0);
   const shadowScale = clamp(totalHeight / 80, 0.8, 1.3);
   const isMonochrome = !building.isActiveToday && building.type !== 'ad';
   const isAd = building.type === 'ad';
  
   return (
     <div
       onClick={(e) => {
         e.stopPropagation();
         onClick && onClick();
       }}
       className="relative group cursor-pointer flex items-center justify-center"
       style={{ width: size, height: 0 }}
     >
       {/* Ad Price Tag */}
       {isAd && building.price && (
          <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-20 animate-float">
             <div className="bg-hyve-gold text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-hyve-gold/20 border border-white/20 whitespace-nowrap">
                {building.price}
             </div>
             <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[3px] border-t-hyve-gold"></div>
          </div>
       )}


       {/* 1. GROUND SHADOW (Warm glow if active today or Ad) */}
       <div
            className="absolute"
            style={{
               top: -4,
               left: -size * 0.2,
               width: size * 1.4,
               height: size * 0.5,
               background: (building.isActiveToday || isAd)
                ? 'radial-gradient(ellipse at center, rgba(201, 168, 106, 0.4), transparent 70%)' 
                : 'radial-gradient(ellipse at center, rgba(0,0,0,0.3), transparent 70%)',
               opacity: 0.6,
               transform: `scale(${shadowScale})`,
               pointerEvents: 'none',
               transition: 'all 0.5s ease'
            }}
       />


       {/* 2. THE BUILDING STACK */}
       <div
         className="absolute bottom-0 left-0 transition-transform duration-300 ease-out group-active:translate-y-1 group-active:scale-[0.98]"
       >
          <BuildingStack layers={building.layers} size={size} grayscale={isMonochrome} isAd={isAd} />
       </div>
     </div>
   );
 }


 return null;
};


// Stack absolute positioned layers from bottom to top
const BuildingStack: React.FC<{ layers: Layer[], size: number, grayscale: boolean, isAd: boolean }> = ({ layers, size, grayscale, isAd }) => {
 let currentY = 0;
 
 // If it's an ad and has no layers, we show a default placeholder layer
 const renderLayers = (layers.length === 0 && isAd) 
    ? [{ friendId: 'ad', minutes: 60, heightPx: 40, color: '#C9A86A', isToday: true }]
    : layers;


 return (
   <div className="relative" style={{ width: size }}>
     {renderLayers.map((layer, idx) => {
       const h = layer.heightPx;
       const bottomPos = currentY;
       currentY += h;


       return (
           <div
             key={`${layer.friendId}-${idx}`}
             className="absolute left-0 transition-all duration-500 ease-in-out"
             style={{
                bottom: bottomPos,
                zIndex: idx
             }}
           >
              <ArchitecturalPrism
                color={layer.color}
                size={size}
                height={h}
                highlight={!grayscale && (layer.isToday || isAd)}
                grayscale={grayscale}
              />
           </div>
     );
     })}
   </div>
 );
};


export const ArchitecturalPrism: React.FC<{
 color: string;     
 size: number;      
 height: number;
 highlight?: boolean;
 grayscale?: boolean;
}> = ({ color, size, height, highlight, grayscale = false }) => {
  const palette = getArchitecturalColor(color, 0, grayscale);


 // Visual isometric constants
 const skew = 30;             
 const depth = size * 0.36; // Visual depth of top face


 return (
   <div
     style={{
       width: size,
       height: height + depth,
       position: 'relative',
       pointerEvents: 'none',
     }}
   >
       {/* TOP FACE */}
       <div
           className="absolute"
           style={{
               width: size,
               height: depth,
               left: 0,
               top: 0,
               backgroundColor: palette.top,
               transform: `skewX(-30deg) scaleY(0.86)`,
               transformOrigin: "top left",
               zIndex: 2,
               outline: '1px solid rgba(255,255,255,0.1)',
               boxShadow: highlight
                   ? `inset 0 0 0 1px rgba(255,235,210,0.5), 0 0 15px rgba(201,168,106,0.4)`
                   : undefined,
               transition: 'background-color 0.3s ease, box-shadow 0.3s ease'
           }}
       />


       {/* LEFT FACE */}
       <div
           className="absolute"
           style={{
               width: size * 0.5,
               height: height,
               left: 0,
               top: depth * 0.55,
               backgroundColor: palette.left,
               transform: `skewY(${skew}deg)`,
               transformOrigin: "top left",
               zIndex: 1,
               outline: '1px solid rgba(255,255,255,0.06)',
           }}
       />


       {/* RIGHT FACE */}
       <div
           className="absolute"
           style={{
               width: size * 0.5,
               height: height,
               left: size * 0.5,
               top: depth * 0.55,
               backgroundColor: palette.right,
               transform: `skewY(-${skew}deg)`,
               transformOrigin: "top left",
               zIndex: 1,
               outline: '1px solid rgba(255,255,255,0.04)',
           }}
       />
   </div>
 );
};

// --- LEAFLET MARKER COMPONENT ---
export const Leaflet3DMarker: React.FC<{ map: L.Map | null, building: PlaceAggregate, onClick: (b: PlaceAggregate) => void }> = ({ map, building, onClick }) => {
 const [container, setContainer] = useState<HTMLElement | null>(null);

 useLayoutEffect(() => {
   if (!map) return;
   const icon = L.divIcon({
     className: 'bg-transparent border-none',
     iconSize: [0, 0], // CSS handles size
     iconAnchor: [32, 32]
   });
   const marker = L.marker([building.lat, building.lng], { icon }).addTo(map);
   const el = marker.getElement();
   if (el) {
     el.style.pointerEvents = 'auto';
     el.style.overflow = 'visible';
     setContainer(el);
   }
   marker.on('click', (e) => {
     L.DomEvent.stopPropagation(e);
     onClick(building);
   });
   return () => { marker.remove(); };
 }, [map, building, onClick]);


 if (!container) return null;


 return createPortal(
   <div className="absolute bottom-0 left-0" style={{ pointerEvents: 'none' }}>
     <MapVisualization building={building} variant="marker" onClick={() => onClick(building)} />
   </div>,
   container
 );
};
