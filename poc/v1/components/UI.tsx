import React, { ReactNode } from 'react';


interface GlassCardProps {
 children: ReactNode;
 className?: string;
 onClick?: () => void;
 noPadding?: boolean;
}


export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick, noPadding = false }) => {
 return (
   <div
     onClick={onClick}
     className={`glass-panel rounded-[28px] ${noPadding ? '' : 'p-6'} shadow-soft ${className}`}
   >
     {children}
   </div>
 );
};


interface AvatarProps {
 src: string;
 size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
 hasRing?: boolean;
}


export const Avatar: React.FC<AvatarProps> = ({ src, size = 'md', hasRing = false }) => {
 const sizeClasses = {
   xs: 'w-6 h-6',
   sm: 'w-8 h-8',
   md: 'w-12 h-12',
   lg: 'w-16 h-16',
   xl: 'w-24 h-24'
 };


 return (
   <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden shrink-0 ${hasRing ? 'ring-1 ring-hyve-gold/50 ring-offset-2 ring-offset-[#060607]' : ''}`}>
     <img src={src} alt="Avatar" className="w-full h-full object-cover" />
   </div>
 );
};


interface ButtonProps {
 label: string;
 onClick?: () => void;
 variant?: 'primary' | 'secondary' | 'ghost';
 icon?: ReactNode;
 fullWidth?: boolean;
}


export const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary', icon, fullWidth = false }) => {
 const baseStyles = "rounded-full py-4 px-6 font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95";
  const variants = {
   primary: "bg-hyve-surface2 border border-hyve-surfaceBorder text-hyve-text1 hover:bg-white/10 hover:border-hyve-gold/30",
   secondary: "bg-transparent border border-hyve-surfaceBorder text-hyve-text2 hover:text-hyve-text1 hover:bg-white/5",
   ghost: "bg-transparent text-hyve-gold hover:text-hyve-text1"
 };


 return (
   <button
     onClick={onClick}
     className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}
   >
     {icon}
     <span>{label}</span>
   </button>
 );
};


export const NavIcon: React.FC<{ icon: ReactNode; isActive: boolean; label: string; onClick: () => void }> = ({ icon, isActive, label, onClick }) => {
 return (
   <button onClick={onClick} className="flex flex-col items-center justify-center gap-1 w-14 group">
     <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${isActive ? 'bg-white/10 text-hyve-gold drop-shadow-[0_0_8px_rgba(201,168,106,0.4)]' : 'text-hyve-text3 group-hover:text-hyve-text2'}`}>
       {icon}
     </div>
     <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'text-hyve-text1' : 'text-hyve-text3'}`}>{label}</span>
   </button>
 );
};


export const ScreenWrapper: React.FC<{ children: ReactNode; className?: string; noPadding?: boolean }> = ({ children, className = '', noPadding = false }) => (
 <div className={`h-full flex flex-col ${noPadding ? 'bg-hyve-bg0' : 'bg-hyve-bg1'} text-hyve-text2 ${noPadding ? '' : 'pb-24'} ${className}`}>
   {children}
 </div>
);

export const ScrollIndicator = ({ opacity }: { opacity: number }) => (
  <div 
    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-all duration-300 pointer-events-none"
    style={{ opacity }}
  >
    <span className="text-[9px] font-bold text-hyve-text3 uppercase tracking-widest animate-pulse">Scroll</span>
    <div className="w-[1px] h-8 bg-gradient-to-b from-hyve-text3 to-transparent"></div>
  </div>
);