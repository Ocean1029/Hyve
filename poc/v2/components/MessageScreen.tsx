import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Send, Camera, Smile, MoreVertical, Coffee, Book, Dumbbell, Utensils, MapPin, Clock } from 'lucide-react';
import { AppScreen, User, SessionLog } from '../types';
import { Avatar } from './UI';
import { SESSION_LOGS } from '../data';

const SessionLogBubble = ({ log, onNavigate }: { log: SessionLog, onNavigate: (s: AppScreen, data?: any) => void }) => {
  return (
    <div 
      onClick={() => onNavigate(AppScreen.SESSION_LOG, log)}
      className="w-full max-w-[280px] glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-xl animate-flip-in cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="relative h-32">
        <img src={log.photoUrl} className="w-full h-full object-cover" alt="Session" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
           <div className="bg-hyve-gold p-1.5 rounded-lg text-hyve-bg0">
              {log.tags.some(t => t.toLowerCase().includes('coffee')) ? <Coffee size={14} /> : 
               log.tags.some(t => t.toLowerCase().includes('gym')) ? <Dumbbell size={14} /> : <Book size={14} />}
           </div>
           <span className="text-[10px] font-black text-white uppercase tracking-widest">Session Log</span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-hyve-text1 mb-0.5">
              <MapPin size={10} className="text-hyve-gold" />
              <span className="text-[11px] font-bold">{log.location}</span>
            </div>
            <div className="flex items-center gap-1.5 text-hyve-text3">
              <Clock size={10} />
              <span className="text-[9px] font-medium">{log.duration}</span>
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold text-hyve-text3 opacity-60">{log.date}</span>
        </div>
        <p className="text-[11px] text-hyve-text2 leading-relaxed italic">"{log.description}"</p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {log.tags.map(tag => (
            <span key={tag} className="text-[8px] font-bold px-2 py-0.5 bg-white/5 rounded-full text-hyve-text3 border border-white/5">#{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export const MessageScreen = ({ friend, onClose, onNavigate }: { friend: User, onClose: () => void, onNavigate: (s: AppScreen, data?: any) => void }) => {
  const [message, setMessage] = useState('');
  
  // Mock messages based on SearchScreen data
  const initialMessages = [
    { id: '1', type: 'text', text: 'Hey! How are you?', isMe: false, time: 'Yesterday 8:30 PM' },
    { id: '2', type: 'text', text: 'Doing great, just finished a session.', isMe: true, time: 'Yesterday 8:35 PM' },
  ];

  // Add session log if applicable
  const lastSession = SESSION_LOGS.find(s => s.friendId === friend.id);
  if (lastSession && (friend.id === 'u2' || friend.id === 'u3')) {
    initialMessages.push({ 
      id: '3', 
      type: 'session_log', 
      text: '', // Not used for session_log
      log: lastSession,
      isMe: false, 
      time: 'Yesterday 8:42 PM' 
    } as any);
  } else {
    initialMessages.push({ 
      id: '3', 
      type: 'text', 
      text: friend.id === 'u2' ? 'Leg day was brutal yesterday lol' : 'See you at the archive?', 
      isMe: false, 
      time: 'Yesterday 8:42 PM' 
    } as any);
  }

  const [chatMessages, setChatMessages] = useState(initialMessages);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = () => {
    if (!message.trim()) return;
    const newMessage = {
      id: Date.now().toString(),
      type: 'text',
      text: message,
      isMe: true,
      time: 'Just now'
    };
    setChatMessages([...chatMessages, newMessage]);
    setMessage('');
  };

  return (
    <div className="h-full w-full bg-hyve-bg0 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-10 pb-4 border-b border-white/5 bg-hyve-bg1/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1 -ml-1 text-hyve-text2 active:scale-90 transition-transform">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Avatar src={friend.avatarUrl} size="xs" hasRing={friend.isOnline} />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-hyve-text1 leading-tight">{friend.name}</span>
              <span className="text-[8px] text-blue-500 font-medium">{friend.isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
        <button className="text-hyve-text3 p-1">
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar z-10">
        <div className="text-center py-4">
          <span className="text-[9px] font-bold text-hyve-text3 uppercase tracking-widest">Yesterday</span>
        </div>
        
        {chatMessages.map((msg: any) => (
          <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
            {msg.type === 'session_log' ? (
              <SessionLogBubble log={msg.log} onNavigate={onNavigate} />
            ) : (
              <div 
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[11px] leading-relaxed ${
                  msg.isMe 
                    ? 'bg-hyve-gold text-hyve-bg0 rounded-tr-none font-medium' 
                    : 'rounded-tl-none text-hyve-text1 border border-white/5'
                }`}
                style={!msg.isMe ? { backgroundColor: `${friend.color}25` } : {}}
              >
                {msg.text}
              </div>
            )}
            <span className="text-[8px] text-hyve-text3 mt-1 px-1">{msg.time}</span>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-4 pb-10 bg-hyve-bg0 border-t border-white/5">
        <div className="flex items-center gap-3">
          <button className="text-hyve-text3 active:scale-90 transition-transform">
            <Camera size={20} strokeWidth={1.5} />
          </button>
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Message..." 
              className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-5 pr-12 text-[12px] text-hyve-text1 focus:outline-none focus:border-hyve-gold/30 transition-colors"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-hyve-text3 hover:text-hyve-gold transition-colors">
              <Smile size={18} strokeWidth={1.5} />
            </button>
          </div>
          <button 
            onClick={handleSend}
            disabled={!message.trim()}
            className={`transition-all active:scale-90 ${message.trim() ? 'text-hyve-gold' : 'text-hyve-text3'}`}
          >
            <Send size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
};
