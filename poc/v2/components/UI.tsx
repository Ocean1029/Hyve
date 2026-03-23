import React, { ReactNode, Component, ErrorInfo } from 'react';


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
     className={`glass-panel rounded-[28px] ${noPadding ? '' : 'p-6'} shadow-soft border border-hyve-surfaceBorder ${className}`}
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
   <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden shrink-0 ${hasRing ? 'ring-1 ring-hyve-gold/50 ring-offset-2 ring-offset-hyve-bg0' : 'border border-hyve-surfaceBorder'}`}>
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


export const NavIcon: React.FC<{ icon: ReactNode; isActive: boolean; onClick: () => void }> = ({ icon, isActive, onClick }) => {
 return (
   <button onClick={onClick} className="flex flex-col items-center justify-center group transition-all duration-300">
     <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 border ${isActive ? 'bg-hyve-surface2 border-hyve-gold/30 text-hyve-gold drop-shadow-[0_0_8px_rgba(201,168,106,0.4)] scale-110' : 'text-hyve-text3 border-transparent group-hover:text-hyve-text2 group-hover:bg-hyve-surface1 group-hover:border-hyve-surfaceBorder'}`}>
       {icon}
     </div>
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

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-hyve-bg0">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-hyve-text1 mb-2">Something went wrong</h2>
          <p className="text-hyve-text2 mb-8 max-w-xs">
            We encountered an unexpected error. Please try refreshing the app.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-hyve-surface2 border border-hyve-surfaceBorder rounded-full text-hyve-text1 font-medium"
          >
            Reload App
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-8 p-4 bg-black/40 rounded-xl text-left text-xs text-red-400 overflow-auto max-w-full">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}