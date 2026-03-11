import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Send, Camera, Smile, MoreVertical } from 'lucide-react';
import { AppScreen, User } from '../types';
import { Avatar } from './UI';

export const MessageScreen = ({ friend, onClose }: { friend: User, onClose: () => void }) => {
  const [message, setMessage] = useState('');
  
  // Mock messages based on SearchScreen data
  const initialMessages = [
    { id: '1', text: 'Hey! How are you?', isMe: false, time: 'Yesterday 8:30 PM' },
    { id: '2', text: 'Doing great, just finished a session.', isMe: true, time: 'Yesterday 8:35 PM' },
    { id: '3', text: friend.id === '2' ? 'Leg day was brutal yesterday lol' : 'See you at the archive?', isMe: false, time: 'Yesterday 8:42 PM' }
  ];

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
      text: message,
      isMe: true,
      time: 'Just now'
    };
    setChatMessages([...chatMessages, newMessage]);
    setMessage('');
  };

  return (
    <div className="h-full w-full bg-hyve-bg0 flex flex-col">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-10 pb-4 border-b border-white/5 bg-hyve-bg1/80 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1 -ml-1 text-hyve-text2 active:scale-90 transition-transform">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Avatar src={friend.avatarUrl} size="xs" hasRing={friend.isOnline} />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-hyve-text1 leading-tight">{friend.name}</span>
              <span className="text-[8px] text-green-500 font-medium">{friend.isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
        <button className="text-hyve-text3 p-1">
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        <div className="text-center py-4">
          <span className="text-[9px] font-bold text-hyve-text3 uppercase tracking-widest">Yesterday</span>
        </div>
        
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[11px] leading-relaxed ${
              msg.isMe 
                ? 'bg-hyve-gold text-hyve-bg0 rounded-tr-none font-medium' 
                : 'bg-white/5 border border-white/5 text-hyve-text1 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
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
