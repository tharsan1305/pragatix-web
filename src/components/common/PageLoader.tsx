import logoImg from '../../assets/sg-logo.jpg';

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export default function PageLoader({ message = 'Loading...', fullScreen = true }: PageLoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
      {/* Logo with pulsing glow & spinner ring */}
      <div className="relative mb-5">
        {/* Glow backdrop */}
        <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-amber-500/30 to-red-500/30 blur-lg animate-pulse" />
        
        {/* Logo Card */}
        <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white shadow-xl p-3 border border-orange-100 flex items-center justify-center overflow-hidden">
          <img 
            src={logoImg} 
            alt="PragatiX Logo" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Orbiting spinner ring */}
        <div className="absolute -inset-2 rounded-2xl border-2 border-transparent border-t-orange-500 border-r-indigo-600 animate-spin" />
      </div>

      {/* Loading Title & Message */}
      <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-1">
        PragatiX
      </h3>
      <p className="text-sm font-medium text-slate-500 animate-pulse">
        {message}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md transition-opacity duration-300">
        <div className="bg-white/95 rounded-3xl p-6 shadow-2xl border border-white/20 max-w-xs w-full mx-4">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
