import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Send, Flame, MapPin, Clock } from 'lucide-react';
import { Friend, ChatMessage, SendMessageSchema } from '@hyve/types';
import { sendMessage, getConversation, getFriendFocusSessions } from '@/modules/messages/actions';

interface ChatInterfaceProps {
  friend: Friend;
  userId: string;
  onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ friend, userId, onBack }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [messageError, setMessageError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from database
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Load conversation history from database on mount
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoadingMessages(true);
      try {
        // Load both regular messages and focus sessions in parallel
        const [messagesResult, sessionsResult] = await Promise.all([
          getConversation(friend.id),
          getFriendFocusSessions(friend.id),
        ]);
        
        const allMessages: ChatMessage[] = [];
        
        // Convert database messages to ChatMessage format
        if (messagesResult.success && messagesResult.messages) {
          const textMessages: ChatMessage[] = messagesResult.messages.map((msg: any) => ({
            id: msg.id,
            senderId: msg.senderId === userId ? 'user' : friend.id,
            text: msg.content,
            timestamp: msg.timestamp, // Keep as Date for sorting
            timestampDisplay: formatMessageTime(msg.timestamp),
            type: 'text' as const,
          }));
          allMessages.push(...textMessages);
        }

        // Create system messages for each FocusSession
        if (sessionsResult.success && sessionsResult.sessions) {
          const systemMessages: ChatMessage[] = sessionsResult.sessions.map((session: any) => {
            // Find the first memory for this session (if any) for photos and location
            const firstMemory = session.memories && session.memories.length > 0 
              ? session.memories[0] 
              : null;
            
            // Get all photos from all memories in this session
            const allPhotoUrls: string[] = [];
            if (session.memories && session.memories.length > 0) {
              session.memories.forEach((mem: any) => {
                if (mem.photos && mem.photos.length > 0) {
                  allPhotoUrls.push(...mem.photos);
                }
              });
            }
            
            // Use photos from memory, or fallback to placeholder
            const photoUrls = allPhotoUrls.length > 0 
              ? allPhotoUrls 
              : ['https://picsum.photos/200/200?random=201', 'https://picsum.photos/200/200?random=202'];
            
            // Format duration
            const durationMinutes = session.minutes ?? 0;
            const formattedDuration = durationMinutes > 0 
              ? durationMinutes >= 60 
                ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
                : `${durationMinutes}m`
              : 'N/A';
            
            // Get location from memory if available, otherwise use default
            const location = firstMemory?.location || 'Unknown Location';
            
            // Use session endTime as the timestamp for the system message
            const sessionTimestamp = new Date(session.endTime || session.createdAt);
            
            return {
              id: `session-${session.id}`,
              senderId: 'system',
              text: 'Session Complete',
              timestamp: sessionTimestamp, // Keep as Date for sorting
              timestampDisplay: formatMessageTime(sessionTimestamp),
              type: 'system' as const,
              systemMetadata: {
                duration: formattedDuration,
                location: location,
                posts: photoUrls,
                memoryType: firstMemory?.type || 'Memory',
              },
            };
          });
          
          allMessages.push(...systemMessages);
        }

        // Sort all messages by timestamp (oldest first for chronological display)
        allMessages.sort((a, b) => {
          const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
          const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
          return timeA - timeB;
        });

        // Convert timestamp to display format for all messages
        const finalMessages: ChatMessage[] = allMessages.map(msg => ({
          ...msg,
          timestamp: msg.timestampDisplay || formatMessageTime(msg.timestamp),
        }));

        setMessages(finalMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
        // On error, show empty messages list
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [friend.id, userId]);

  // Helper to format timestamp to relative time string
  const formatMessageTime = (timestamp: Date | string): string => {
    const now = new Date();
    const messageDate = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return 'Yesterday';
    }
    
    if (diffInDays < 7) {
      return `${diffInDays}d`;
    }
    
    // For older messages, show date
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    setMessageError(null);
    
    // Validate message using Zod schema
    const validation = SendMessageSchema.safeParse({ message: inputValue });
    if (!validation.success) {
      const errorMessage = validation.error.errors
        .map((e) => e.message)
        .join(', ');
      setMessageError(errorMessage);
      return;
    }

    const userText = validation.data.message;
    const tempId = Date.now().toString();

    // Optimistically add user message to UI
    const newUserMsg: ChatMessage = {
      id: tempId,
      senderId: 'user',
      text: userText,
      timestamp: 'Just now',
      type: 'text'
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');

    try {
      // Save user message to database
      const saveResult = await sendMessage(friend.id, userId, userText);
      
      if (saveResult.success && saveResult.message) {
        // Update message with database ID
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, id: saveResult.message.id }
            : msg
        ));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="w-full h-full bg-zinc-950 flex flex-col">
      
      {/* Header - Fixed Height, High Z-Index, Solid Background */}
      <div className="flex-none px-4 py-4 flex items-center gap-3 border-b border-zinc-900 bg-zinc-950 z-50 shadow-sm relative">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="relative">
          <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full border border-zinc-800 object-cover" />
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-950"></div>
        </div>
        <div className="flex-1">
          <h2 className="text-stone-200 font-bold leading-tight">{friend.name}</h2>
          <p className="text-zinc-500 text-xs font-medium">Online</p>
        </div>
      </div>

      {/* Messages Area - Flex Grow, Scrolls independently */}
      <div className="flex-1 overflow-y-auto p-4 pb-40 space-y-4 relative z-0">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-zinc-500 text-sm font-medium">Loading messages...</div>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isMe = msg.senderId === 'user';
              const isSystem = msg.type === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex flex-col items-center my-6 animate-in zoom-in-95 duration-500">
                    {/* Gradient border wrapper */}
                    <div className="w-full max-w-xs bg-gradient-to-r from-rose-500 to-amber-500 p-[2px] rounded-3xl shadow-[0_0_30px_rgba(251,146,60,0.1)]">
                      {/* Inner content container */}
                      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-[22px] overflow-hidden">
                        {/* Header section */}
                        <div className="px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                            <span className="text-amber-500 text-xs font-black uppercase tracking-wider">Session Complete</span>
                          </div>
                          <span className="text-zinc-500 text-[10px] font-bold">{typeof msg.timestamp === 'string' ? msg.timestamp : formatMessageTime(msg.timestamp)}</span>
                        </div>
                        {/* Separator line */}
                        <div className="h-[1px] bg-gradient-to-r from-rose-500 to-amber-500"></div>
                        
                        <div className="p-5">
                        <h3 className="text-white font-bold text-lg mb-4 text-center">
                          The fire is out, but the<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">vibes remain!</span> 🔥
                        </h3>
                        
                        <div className="flex items-center justify-center gap-4 mb-5">
                          <div className="flex items-center gap-1.5 text-zinc-400 bg-zinc-950/50 px-3 py-1.5 rounded-lg border border-zinc-800">
                            <Clock className="w-3.5 h-3.5 text-rose-400" />
                            <span className="text-xs font-bold font-mono">{msg.systemMetadata?.duration}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-400 bg-zinc-950/50 px-3 py-1.5 rounded-lg border border-zinc-800">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-xs font-bold">{msg.systemMetadata?.location}</span>
                          </div>
                        </div>

                        <div className="text-center text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wide capitalize">{msg.systemMetadata?.memoryType || 'Memory'}</div>

                        {msg.systemMetadata?.posts && msg.systemMetadata.posts.length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                             {msg.systemMetadata.posts.map((post, idx) => (
                               <img key={idx} src={post} className="w-full h-20 object-cover rounded-xl border border-zinc-800 opacity-80 hover:opacity-100 transition-opacity" alt="Memory" />
                             ))}
                          </div>
                        )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed
                      ${isMe 
                        ? 'bg-stone-100 text-black rounded-tr-sm' 
                        : 'bg-zinc-800 text-stone-200 rounded-tl-sm'
                      }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="flex-none p-4 bg-zinc-950 border-t border-zinc-900 safe-area-bottom z-50">
        {messageError && (
          <div className="mb-2 p-2 bg-rose-500/20 border border-rose-500/50 rounded-lg">
            <p className="text-xs text-rose-400 font-medium">{messageError}</p>
          </div>
        )}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setMessageError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${friend.name}...`}
            className="flex-1 bg-zinc-900 text-white placeholder-zinc-500 text-sm px-5 py-3.5 rounded-full focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all border border-zinc-800"
          />
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="p-3.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 disabled:opacity-50 disabled:hover:bg-rose-500 transition-colors shadow-lg shadow-rose-900/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};

export default ChatInterface;

