import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Music, Image as ImageIcon, Plus, MapPin, ChevronRight, Star, Loader2, Calendar } from 'lucide-react';
import { Friend } from '@/lib/types';

interface PostMemoryProps {
  durationSeconds: number;
  sessionEndTime: Date;
  friend: Friend | null;
  onBack: () => void;
  onPost: (photoUrl?: string | string[], eventName?: string, caption?: string, location?: string, mood?: string, happyIndex?: number) => void;
  isSaving?: boolean;
  initialHappyIndex?: number;
  title?: string;
  // Initial values for editing existing memory
  initialEventName?: string;
  initialCaption?: string;
  initialLocation?: string;
  initialPhotos?: string[];
  initialCategory?: string;
  // Whether this is edit mode
  isEditMode?: boolean;
}

const CATEGORIES = ['📚 Study', '🍔 Eat', '🏋️ Gym', '🚗 Drive', '☕ Chill', '🎮 Game', '🎨 Create'];

const PostMemory: React.FC<PostMemoryProps> = ({ 
  durationSeconds, 
  sessionEndTime, 
  friend, 
  onBack, 
  onPost, 
  isSaving = false, 
  initialHappyIndex = 5, 
  title = 'New Memory',
  initialEventName = '',
  initialCaption = '',
  initialLocation = '',
  initialPhotos = [],
  initialCategory = CATEGORIES[0],
  isEditMode = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [rating, setRating] = useState(initialHappyIndex);
  const [eventName, setEventName] = useState(initialEventName);
  const [caption, setCaption] = useState(initialCaption);
  const [location, setLocation] = useState(initialLocation);
  // Initialize with initialPhotos, but use a key or effect to update when they change
  const [photoUrls, setPhotoUrls] = useState<string[]>(() => initialPhotos);
  const [previewUrls, setPreviewUrls] = useState<string[]>(() => initialPhotos);
  // Track which URLs are blob URLs (created by URL.createObjectURL) vs regular URLs
  const [blobUrls, setBlobUrls] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Calculate time details
  const timeDetails = useMemo(() => {
    const end = sessionEndTime;
    const start = new Date(end.getTime() - durationSeconds * 1000);
    
    // Format Date: "Oct 21"
    const dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Format Time Range: "13:53-15:42"
    const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const timeRange = `${formatTime(start)}-${formatTime(end)}`;
    
    // Format Duration: "1hr 59min"
    const h = Math.floor(durationSeconds / 3600);
    const m = Math.floor((durationSeconds % 3600) / 60);
    // If less than a minute, show seconds or < 1 min, but strictly sticking to user format request
    let durationStr = '';
    if (h > 0) durationStr += `${h}hr `;
    if (m > 0 || h === 0) durationStr += `${m}min`; // Show min if 0 hours, even if 0 min (handled as 0min)

    return { dateStr, timeRange, durationStr };
  }, [durationSeconds, sessionEndTime]);

  // Update rating when initialHappyIndex changes
  useEffect(() => {
    setRating(initialHappyIndex);
  }, [initialHappyIndex]);

  // Update form fields when initial values change (for editing mode)
  useEffect(() => {
    setEventName(initialEventName);
    setCaption(initialCaption);
    setLocation(initialLocation);
    setSelectedCategory(initialCategory);
  }, [initialEventName, initialCaption, initialLocation, initialCategory]);

  // Separate effect for photos to ensure they update correctly
  // Use a ref to track previous photos to avoid unnecessary updates
  const prevPhotosRef = useRef<string>('');
  useEffect(() => {
    // Create a stable key from initialPhotos
    const currentPhotosKey = initialPhotos.join(',');
    
    // Only update if photos actually changed
    if (currentPhotosKey !== prevPhotosRef.current) {
      // Set photo URLs - these are already uploaded URLs, not blob URLs
      setPhotoUrls([...initialPhotos]);
      setPreviewUrls([...initialPhotos]);
      prevPhotosRef.current = currentPhotosKey;
    }
    // Don't add initial photos to blobUrls set since they're not blob URLs
  }, [initialPhotos]);

  // Clean up blob URLs on component unmount
  // Only revoke URLs that were created by URL.createObjectURL (blob URLs)
  useEffect(() => {
    return () => {
      blobUrls.forEach(url => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [blobUrls]);

  // Handle file selection
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Handle file input change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate all files
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Invalid file type. Please select image files only.');
        return;
      }
      if (file.size > maxSize) {
        setUploadError('File size exceeds 10MB limit.');
        return;
      }
    }

    setUploadError('');
    setUploading(true);

    // Create preview URLs for all files (these are blob URLs)
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    // Track these as blob URLs for cleanup
    setBlobUrls(prev => {
      const newSet = new Set(prev);
      newPreviewUrls.forEach(url => newSet.add(url));
      return newSet;
    });

    // Upload all files
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (result.success && result.url) {
          return result.url;
        } else {
          throw new Error(result.error || 'Failed to upload image');
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setPhotoUrls(prev => [...prev, ...uploadedUrls]);
      setUploadError('');
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'An error occurred while uploading images');
      // Clean up preview URLs on error
      newPreviewUrls.forEach(url => {
        URL.revokeObjectURL(url);
        setBlobUrls(prev => {
          const newSet = new Set(prev);
          newSet.delete(url);
          return newSet;
        });
      });
      setPreviewUrls(prev => prev.filter(url => !newPreviewUrls.includes(url)));
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle removing a photo
  const handleRemovePhoto = (index: number) => {
    // Clean up preview URL if it's a blob URL
    const previewUrlToRemove = previewUrls[index];
    if (previewUrlToRemove && blobUrls.has(previewUrlToRemove)) {
      URL.revokeObjectURL(previewUrlToRemove);
      setBlobUrls(prev => {
        const newSet = new Set(prev);
        newSet.delete(previewUrlToRemove);
        return newSet;
      });
    }
    
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 relative z-50">
      
      {/* Header */}
      <div className="px-6 py-3 flex justify-between items-center bg-zinc-950/90 backdrop-blur-md z-30 border-b border-zinc-900">
        <h2 className="text-xs font-medium text-zinc-600">{title}</h2>
        <button onClick={onBack} className="p-1 bg-transparent hover:bg-zinc-900 rounded-full transition-colors">
          <X className="w-4 h-4 text-zinc-600" />
        </button>
      </div>

      {/* Event Name - Fixed at top, prominent */}
      <div className="px-6 pt-5 text-center bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-2xl mx-auto">
          <input 
            type="text" 
            placeholder="What happened in this moment?" 
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
            className="w-full bg-transparent text-white text-xl font-black text-center placeholder-zinc-400 focus:outline-none focus:placeholder-transparent border-b-2 border-zinc-700 focus:border-rose-400 pb-4 focus:scale-[1.02]"
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-32 space-y-8 pt-6">
        
        {/* 1. Time Info */}
        <section>
          <div className="flex items-center gap-2 text-rose-400 font-mono text-sm font-medium">
            <Calendar className="w-4 h-4" />
            <span>{timeDetails.dateStr}</span>
            <span>{timeDetails.timeRange}</span>
          </div>
          <div className="flex items-center gap-2 text-white text-sm font-medium">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-600">Location automatically tagged</span>
          </div>
        </section>

        {/* 3. Happy Index */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Rate Experience</label>
            <div className="text-lg font-black text-amber-400 tabular-nums">
              {rating}<span className="text-sm text-amber-500/60 ml-0.5">/10</span>
            </div>
          </div>
           
           <div className="flex items-center justify-center gap-1.5 mb-3">
             {/* Stars Buttons */}
             {[...Array(10)].map((_, i) => {
               const val = i + 1;
               const isActive = val <= rating;
               return (
                 <button 
                    key={val}
                    onClick={() => setRating(val)}
                    className={`relative z-10 w-7 h-7 flex items-center justify-center transition-all duration-200 ${isActive ? 'scale-105' : 'opacity-30 hover:opacity-60'}`}
                 >
                    <Star 
                      className={`w-full h-full transition-colors ${isActive ? 'fill-amber-400 text-amber-400' : 'fill-zinc-600 text-zinc-600'}`} 
                    />
                 </button>
               );
             })}
           </div>
           <div className="flex justify-between text-[10px] font-medium text-zinc-700 tracking-wider">
              <span>Meh</span>
              <span>Life Changing</span>
           </div>
        </section>

        {/* 4. Vibe Check */}
        <section>
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 block">Vibe Check</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedCategory === cat 
                    ? 'bg-zinc-700 text-white border-zinc-600 shadow-lg shadow-zinc-700/20 scale-105' 
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* 7. Photos */}
        <section className="relative">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
          />
          
          {/* Add photo button - Fixed in bottom right corner */}
          <button
            onClick={handleFileSelect}
            disabled={uploading}
            className={`absolute bottom-4 right-4 w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 hover:border-zinc-600 hover:scale-110 transition-all shadow-lg z-10 disabled:opacity-50 disabled:cursor-not-allowed ${
              uploading ? 'cursor-not-allowed' : ''
            }`}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
            ) : (
              <div className="relative">
                <ImageIcon className="w-6 h-6 text-zinc-300" />
                <Plus className="w-4 h-4 text-zinc-300 absolute -bottom-0.5 -right-0.5 bg-zinc-800 rounded-full p-0.6" />
              </div>
            )}
          </button>

          {/* Photos display area - Dashed border */}
          <div className="w-full min-h-[200px] rounded-3xl border-2 border-dashed border-zinc-700 bg-zinc-900/30 p-4">
            {previewUrls.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {previewUrls.map((previewUrl, index) => (
                  <div key={index} className="relative aspect-[4/3] rounded-2xl overflow-hidden group">
                    <img
                      src={previewUrl}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto(index);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {/* Uploaded badge */}
                    {photoUrls[index] && (
                      <div className="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Uploaded
                      </div>
                    )}
                    {/* Uploading overlay */}
                    {uploading && index === previewUrls.length - 1 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="text-center">
                  <p className="text-zinc-500 text-sm font-medium">Your photos will appear here</p>
                </div>
              </div>
            )}
          </div>
          {uploadError && (
            <p className="mt-2 text-xs text-red-400 font-medium">{uploadError}</p>
          )}
        </section>

        {/* 5. Caption */}
        <section>
          <textarea 
            placeholder="Write a caption..." 
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-white text-sm font-medium placeholder-zinc-600 focus:outline-none focus:border-zinc-700 min-h-[100px] resize-none"
          />
        </section>

      </div>

      {/* Footer CTA */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent z-40">
        <button 
          onClick={() => {
            if (!eventName.trim()) {
              alert('Event Name is required');
              return;
            }
            onPost(photoUrls.length > 0 ? photoUrls : undefined, eventName, caption, location, selectedCategory, rating);
          }}
          disabled={isSaving || !eventName.trim()}
          className="w-full bg-white text-black font-bold text-lg py-5 rounded-3xl shadow-lg shadow-white/10 hover:bg-stone-200 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving 
            ? (isEditMode ? 'Updating...' : 'Posting...') 
            : (isEditMode ? 'Update Memory' : 'Lock this Moment')
          }
        </button>
      </div>

    </div>
  );
};

export default PostMemory;