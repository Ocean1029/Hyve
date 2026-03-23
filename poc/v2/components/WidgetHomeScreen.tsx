import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, GripVertical, Home, Check, Search, ChevronDown, ChevronRight, UserPlus, Zap, Map as MapIcon, ArrowRight, Sparkles, ChevronUp } from 'lucide-react';
import { AppScreen, User as UserType, PlaceAggregate, Widget } from '../types';
import { Avatar, NavIcon } from './UI';
import { MOCK_SESSIONS } from '../src/data_constants';
import { WIDGET_TYPES, SIZE_CONFIG, EXPANDED_SIZE_MAP, WidgetContent, WidgetTypeSection } from './Widgets';

export const WidgetHomeScreen = ({ 
  currentUser, 
  onNavigate, 
  friends, 
  buildings, 
  isLightMode,
  widgets,
  setWidgets
}: { 
  currentUser: UserType, 
  onNavigate: (s: AppScreen) => void, 
  friends: UserType[], 
  buildings: PlaceAggregate[], 
  isLightMode: boolean,
  widgets: Widget[],
  setWidgets: React.Dispatch<React.SetStateAction<Widget[]>>
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPicker, setShowPicker] = useState<{ position: number } | null>(null);
  const toggleExpand = (id: string) => {
    const widget = widgets.find(w => w.id === id);
    if (!widget) return;

    const isExpanding = !widget.isExpanded;
    const baseSize = widget.size;
    const targetSize = isExpanding ? (EXPANDED_SIZE_MAP[baseSize] || baseSize) : baseSize;

    // We need to find a reflow that accommodates the new size at the same position
    // Use the current widgets as the base for reflow
    const reflowed = findReflow(id, widget.position, targetSize);
    
    if (reflowed) {
      const updatedWidgets = reflowed.map(w => 
        w.id === id ? { ...w, isExpanded: isExpanding, size: targetSize } : w
      );
      setWidgets(updatedWidgets);
      setDisplayWidgets(updatedWidgets);
      committedWidgets.current = updatedWidgets;
    }
  };
  
  // Advanced Drag State
  const [dragState, setDragState] = useState<{
    id: string;
    initialPos: number;
    currentPos: number;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
  } | null>(null);
  
  const [displayWidgets, setDisplayWidgets] = useState<Widget[]>(widgets);
  const committedWidgets = useRef<Widget[]>(widgets);
  const longPressTimer = useRef<any>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!dragState) {
      setDisplayWidgets(widgets);
      committedWidgets.current = widgets;
    }
  }, [widgets, dragState]);

  // Occupancy Grid Helper
  const getOccupancy = (widgetList: Widget[]) => {
    const grid = Array(15).fill(null);
    widgetList.forEach(w => {
      const config = SIZE_CONFIG[w.size];
      const col = w.position % 3;
      const row = Math.floor(w.position / 3);
      for (let r = 0; r < config.h; r++) {
        for (let c = 0; c < config.w; c++) {
          const currentCol = col + c;
          const currentRow = row + r;
          if (currentCol < 3 && currentRow < 5) {
            const idx = currentRow * 3 + currentCol;
            grid[idx] = w.id;
          }
        }
      }
    });
    return grid;
  };

  const isPosValid = (pos: number, size: number, excludeId?: string, currentWidgets: Widget[] = widgets) => {
    const config = SIZE_CONFIG[size];
    const col = pos % 3;
    const row = Math.floor(pos / 3);
    if (col + config.w > 3 || row + config.h > 5 || pos < 0) return false;

    const occupancy = getOccupancy(currentWidgets.filter(w => w.id !== excludeId));
    for (let r = 0; r < config.h; r++) {
      for (let c = 0; c < config.w; c++) {
        const idx = (row + r) * 3 + (col + c);
        if (idx >= 15 || occupancy[idx]) return false;
      }
    }
    return true;
  };

  const findReflow = (draggedId: string, targetPos: number, size: number) => {
    const config = SIZE_CONFIG[size];
    const targetCol = targetPos % 3;
    const targetRow = Math.floor(targetPos / 3);
    
    if (targetCol + config.w > 3 || targetRow + config.h > 5) return null;

    let newWidgets = [...committedWidgets.current.filter(w => w.id !== draggedId)];
    const occupancy = getOccupancy(newWidgets);
    
    const collidingIds = new Set<string>();
    for (let r = 0; r < config.h; r++) {
      for (let c = 0; c < config.w; c++) {
        const idx = (targetRow + r) * 3 + (targetCol + c);
        if (idx < 15 && occupancy[idx]) collidingIds.add(occupancy[idx]);
      }
    }

    if (collidingIds.size === 0) return newWidgets;

    // BFS to shift colliding widgets
    const shiftWidget = (wId: string, currentList: Widget[]): Widget[] | null => {
      const w = currentList.find(item => item.id === wId);
      if (!w) return currentList;
      
      const directions = [
        { r: 0, c: 1 }, { r: 0, c: -1 }, // Lateral
        { r: -1, c: 0 }, // Up
        { r: 1, c: 0 }   // Down
      ];

      for (const dir of directions) {
        const nextPos = w.position + dir.r * 3 + dir.c;
        if (isPosValid(nextPos, w.size, wId, currentList)) {
          return currentList.map(item => item.id === wId ? { ...item, position: nextPos } : item);
        }
      }
      
      // If no immediate spot, try pushing down (last resort)
      for (let r = 1; r < 5; r++) {
        const nextPos = w.position + r * 3;
        if (isPosValid(nextPos, w.size, wId, currentList)) {
          return currentList.map(item => item.id === wId ? { ...item, position: nextPos } : item);
        }
      }

      return null;
    };

    let resultList: Widget[] | null = [...newWidgets];
    for (const cId of collidingIds) {
      if (resultList) {
        const shifted = shiftWidget(cId, resultList);
        if (shifted) resultList = shifted;
        else return null; // Can't reflow
      }
    }

    return resultList;
  };

  const handlePointerDown = (e: React.PointerEvent, id: string, initialPos: number) => {
    if (!isEditMode) {
      handleTouchStart();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setDragState({
      id,
      initialPos,
      currentPos: initialPos,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
    
    // Immediately remove from display list so it doesn't overlap with itself/ghost
    setDisplayWidgets(prev => prev.filter(w => w.id !== id));
    
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState || !gridRef.current) return;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    
    // Only start visual drag after 6px movement
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const cellW = gridRect.width / 3;
    const cellH = gridRect.height / 5;

    const x = e.clientX - gridRect.left - dragState.offsetX;
    const y = e.clientY - gridRect.top - dragState.offsetY;

    const col = Math.round(x / cellW);
    const row = Math.round(y / cellH);
    const targetPos = Math.max(0, Math.min(14, row * 3 + col));

    const widget = widgets.find(w => w.id === dragState.id);
    if (widget && targetPos !== dragState.currentPos) {
      const reflowed = findReflow(dragState.id, targetPos, widget.size);
      if (reflowed) {
        setDisplayWidgets(reflowed);
        setDragState(prev => prev ? { ...prev, currentPos: targetPos } : null);
      }
    }

    // Update visual position via RAF for smoothness
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = document.getElementById(`drag-${dragState.id}`);
      if (el) {
        el.style.transform = `translate3d(${e.clientX - dragState.startX}px, ${e.clientY - dragState.startY}px, 0) scale(1.06)`;
      }
    });
  };

  const handlePointerUp = () => {
    if (!dragState) return;
    
    const widget = widgets.find(w => w.id === dragState.id);
    if (widget) {
      // Ensure we don't have duplicates and use the latest reflowed positions
      const otherWidgets = displayWidgets.filter(w => w.id !== dragState.id);
      const finalWidgets = [...otherWidgets, { ...widget, position: dragState.currentPos }];
      setWidgets(finalWidgets);
      committedWidgets.current = finalWidgets;
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setDragState(null);
  };

  const handleTouchStart = (pos?: number) => {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setIsEditMode(true);
      if (pos !== undefined) {
        setShowPicker({ position: pos });
      }
      if (navigator.vibrate) navigator.vibrate(50);
    }, 1500); // Long press 1.5s
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  const findNearestValidPos = (pos: number, size: number) => {
    if (isPosValid(pos, size)) return pos;
    
    // Search outward
    const startCol = pos % 3;
    const startRow = Math.floor(pos / 3);
    
    for (let dist = 1; dist < 5; dist++) {
      for (let r = -dist; r <= dist; r++) {
        for (let c = -dist; c <= dist; c++) {
          const testCol = startCol + c;
          const testRow = startRow + r;
          if (testCol >= 0 && testCol < 3 && testRow >= 0 && testRow < 5) {
            const testPos = testRow * 3 + testCol;
            if (isPosValid(testPos, size)) return testPos;
          }
        }
      }
    }
    return null;
  };

  const addWidget = (type: string, size: number) => {
    if (showPicker === null) return;
    
    const validPos = findNearestValidPos(showPicker.position, size);
    if (validPos === null) return;

    const newWidget: Widget = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      size,
      position: validPos,
    };
    setWidgets([...widgets, newWidget]);
    setShowPicker(null);
  };

  const removeWidget = (id: string) => {
    const updated = widgets.filter(w => w.id !== id);
    setWidgets(updated);
    setDisplayWidgets(updated);
    committedWidgets.current = updated;
  };

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

  return (
    <div 
      className={`h-full w-full flex flex-col pt-10 px-4 pb-24 overflow-y-auto no-scrollbar relative transition-colors duration-300 ${isLightMode ? 'bg-white' : 'bg-hyve-bg0'}`}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={() => !isEditMode && handleTouchStart()}
      onPointerUp={handleTouchEnd}
      onPointerLeave={handleTouchEnd}
    >
      {/* Header - Moved Higher */}
      <div className="flex justify-between items-center shrink-0 pt-0 px-2 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative active:scale-95 transition-transform">
            <div 
              className="absolute -inset-[1.5px] rounded-full animate-rainbow-border opacity-100" 
              style={{ 
                backgroundImage: `linear-gradient(to right, ${currentUser.color}, white, ${currentUser.color})`,
                backgroundSize: '200% 200%'
              }}
            />
            <div className="relative w-11 h-11 rounded-full border-[1px] border-white/20 overflow-hidden bg-hyve-bg2">
              <img src={currentUser.avatarUrl} className="w-full h-full object-cover" alt="Me" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className={`text-[7px] font-black tracking-[0.2em] uppercase mb-0.5 ${isLightMode ? 'text-black/40' : 'text-hyve-text3'}`}>{dateStr}</span>
            <div className="flex items-center gap-2">
              <h1 className={`text-lg font-light tracking-tight leading-none ${isLightMode ? 'text-black' : 'text-hyve-text1'}`}>Hi, {currentUser.name}</h1>
              {!isEditMode && (
                <button 
                  onClick={() => onNavigate(AppScreen.HOME)}
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isLightMode ? 'bg-black/5 border-black/10 hover:bg-black/10' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  title="Back to Home"
                >
                  <Home size={10} className={isLightMode ? 'text-black/40' : 'text-hyve-text3'} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Widget Grid Container - Adjusted to fit space between header and nav bar */}
      <div 
        ref={gridRef} 
        className="relative w-full flex-1 mb-2 touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Background Grid (Imaginary Blocks) */}
        <div key="grid-bg-layer" className="absolute inset-0 grid grid-cols-3 grid-rows-5 gap-2 pointer-events-none">
          {Array.from({ length: 15 }).map((_, i) => {
            const isOccupiedByDisplay = displayWidgets.some(w => {
              const config = SIZE_CONFIG[w.size];
              const wCol = w.position % 3;
              const wRow = Math.floor(w.position / 3);
              const iCol = i % 3;
              const iRow = Math.floor(i / 3);
              return iCol >= wCol && iCol < wCol + config.w && iRow >= wRow && iRow < wRow + config.h;
            });

            return (
              <div 
                key={`bg-${i}`}
                className={`rounded-2xl border border-dashed transition-all duration-300 ${
                  isLightMode ? 'border-black/5 bg-black/[0.02]' : 'border-white/5 bg-white/[0.02]'
                } ${isEditMode && !isOccupiedByDisplay ? 'opacity-10' : 'opacity-0'}`}
              />
            );
          })}
        </div>

        {/* Interaction Layer (Add Buttons) */}
        <div key="grid-interaction-layer" className="absolute inset-0 grid grid-cols-3 grid-rows-5 gap-2">
          {Array.from({ length: 15 }).map((_, i) => {
            const isOccupied = displayWidgets.some(w => {
              const config = SIZE_CONFIG[w.size];
              const wCol = w.position % 3;
              const wRow = Math.floor(w.position / 3);
              const iCol = i % 3;
              const iRow = Math.floor(i / 3);
              return iCol >= wCol && iCol < wCol + config.w && iRow >= wRow && iRow < wRow + config.h;
            });

            return (
              <button 
                key={`add-${i}`}
                onClick={() => isEditMode && setShowPicker({ position: i })}
                onPointerDown={(e) => {
                  if (!isEditMode && !isOccupied) {
                    handleTouchStart(i);
                  }
                }}
                onPointerUp={handleTouchEnd}
                onPointerLeave={handleTouchEnd}
                disabled={isOccupied || dragState !== null}
                className={`rounded-2xl transition-all flex items-center justify-center ${
                  isEditMode && !isOccupied
                    ? 'bg-white/5 animate-pulse' 
                    : 'pointer-events-none'
                }`}
              >
                {isEditMode && !isOccupied && <Plus size={20} className="text-hyve-gold/40" />}
              </button>
            );
          })}
        </div>

        {/* Ghost Snapshot Layer */}
        {dragState && widgets.find(w => w.id === dragState.id) && (() => {
          const w = widgets.find(item => item.id === dragState.id)!;
          const config = SIZE_CONFIG[w.size];
          const col = dragState.currentPos % 3;
          const row = Math.floor(dragState.currentPos / 3);
          
          return (
            <div
              key="ghost-snapshot"
              style={{
                position: 'absolute',
                top: `calc(${(row / 5) * 100}% + 4px)`,
                left: `calc(${(col / 3) * 100}% + 4px)`,
                width: `calc(${(config.w / 3) * 100}% - 8px)`,
                height: `calc(${(config.h / 5) * 100}% - 8px)`,
                zIndex: 5,
                pointerEvents: 'none',
              }}
              className={`rounded-2xl border border-dashed opacity-30 ${
                isLightMode ? 'bg-black/10 border-black/20' : 'bg-white/10 border-white/20'
              }`}
            />
          );
        })()}

        {/* Widgets Layer */}
        {displayWidgets.map((w) => {
          const config = SIZE_CONFIG[w.size];
          const col = w.position % 3;
          const row = Math.floor(w.position / 3);

          return (
            <motion.div
              key={w.id}
              layout
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'absolute',
                top: `calc(${(row / 5) * 100}% + 4px)`,
                left: `calc(${(col / 3) * 100}% + 4px)`,
                width: `calc(${(config.w / 3) * 100}% - 8px)`,
                height: `calc(${(config.h / 5) * 100}% - 8px)`,
                zIndex: 10,
              }}
              className={`rounded-2xl border backdrop-blur-md overflow-hidden group ${
                isLightMode ? 'bg-white/80 border-black/10' : 'bg-hyve-bg2/80 border-white/10'
              } ${isEditMode ? 'animate-wiggle' : ''}`}
              onPointerDown={(e) => handlePointerDown(e, w.id, w.position)}
              onPointerUp={handleTouchEnd}
              onPointerLeave={handleTouchEnd}
            >
              <WidgetContent 
                widget={w} 
                currentUser={currentUser} 
                friends={friends} 
                buildings={buildings}
                isLightMode={isLightMode}
                isExpanded={w.isExpanded}
                onToggleExpand={() => toggleExpand(w.id)}
                onNavigate={onNavigate}
              />
              
              {isEditMode && (
                <button 
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); removeWidget(w.id); }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform z-50"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              )}
            </motion.div>
          );
        })}

        {/* Dragging Widget Overlay */}
        {dragState && widgets.find(w => w.id === dragState.id) && (() => {
          const w = widgets.find(item => item.id === dragState.id)!;
          const config = SIZE_CONFIG[w.size];
          const col = w.position % 3;
          const row = Math.floor(w.position / 3);
          
          return (
            <div
              id={`drag-${w.id}`}
              key={`dragging-overlay-${w.id}`}
              style={{
                position: 'absolute',
                top: `calc(${(row / 5) * 100}% + 4px)`,
                left: `calc(${(col / 3) * 100}% + 4px)`,
                width: `calc(${(config.w / 3) * 100}% - 8px)`,
                height: `calc(${(config.h / 5) * 100}% - 8px)`,
                zIndex: 2000,
                pointerEvents: 'none',
                willChange: 'transform',
              }}
              className={`rounded-2xl border backdrop-blur-md overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,0.20)] ${
                isLightMode ? 'bg-white/90 border-black/10' : 'bg-hyve-bg2/90 border-white/10'
              }`}
            >
              <WidgetContent 
                widget={w} 
                currentUser={currentUser} 
                friends={friends} 
                buildings={buildings}
                isLightMode={isLightMode}
                isExpanded={w.isExpanded}
                onToggleExpand={() => toggleExpand(w.id)}
                onNavigate={onNavigate}
              />
            </div>
          );
        })()}
      </div>

      {/* Done Button - Repositioned to the right on top of navigation bar area */}
      {isEditMode && (
        <motion.button
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={() => setIsEditMode(false)}
          className="absolute bottom-8 right-6 w-14 h-14 bg-hyve-gold text-hyve-bg0 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(201,168,106,0.6)] z-[1000] active:scale-90 transition-transform"
        >
          <Check size={28} strokeWidth={3} />
        </motion.button>
      )}

      {/* Widget Picker Modal - Redesigned and Bounded */}
      <AnimatePresence>
        {showPicker && (
          <motion.div 
            key="widget-picker-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[1100] bg-black/60 backdrop-blur-md overflow-hidden rounded-[40px]"
            onClick={() => setShowPicker(null)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`absolute inset-x-0 bottom-0 h-[80%] rounded-t-[40px] flex flex-col overflow-hidden ${
                isLightMode ? 'bg-white' : 'bg-hyve-bg1'
              }`}
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 shrink-0" />
              
              <div className="px-6 py-4 flex justify-between items-center shrink-0">
                <h2 className={`text-xl font-black uppercase tracking-[0.2em] ${isLightMode ? 'text-black' : 'text-white'}`}>Add Widget</h2>
                <button onClick={() => setShowPicker(null)} className="p-2 rounded-full bg-white/5 text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-12 space-y-10">
                {/* Recommended Section */}
                <section>
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles size={16} className="text-hyve-gold" />
                    <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${isLightMode ? 'text-black/40' : 'text-hyve-text3'}`}>Recommended</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {WIDGET_TYPES.slice(0, 2).map(type => (
                      <div
                        key={`rec-${type.id}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => addWidget(type.id, 4)}
                        onKeyDown={(e) => e.key === 'Enter' && addWidget(type.id, 4)}
                        className={`group relative aspect-square rounded-3xl border overflow-hidden transition-all active:scale-95 cursor-pointer ${
                          isLightMode ? 'bg-black/5 border-black/5' : 'bg-white/5 border-white/5'
                        }`}
                      >
                        <WidgetContent 
                          widget={{ type: type.id, size: 4 }} 
                          currentUser={currentUser} 
                          friends={friends} 
                          buildings={buildings}
                          isPreview={true}
                          isLightMode={isLightMode}
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <Plus size={24} className="text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Categorized Sections */}
                {WIDGET_TYPES.map(type => (
                  <WidgetTypeSection 
                    key={type.id}
                    type={type}
                    isLightMode={isLightMode}
                    currentUser={currentUser}
                    friends={friends}
                    buildings={buildings}
                    addWidget={addWidget}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes rainbow-border {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-rainbow-border {
          background-size: 200% 200%;
          animation: rainbow-border 3s ease infinite;
        }
        @keyframes wiggle {
          0% { transform: rotate(-1.2deg); }
          50% { transform: rotate(1.2deg); }
          100% { transform: rotate(-1.2deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.25s infinite ease-in-out;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

