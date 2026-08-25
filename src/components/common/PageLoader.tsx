import logoImg from '../../assets/sg-logo.jpg';

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export default function PageLoader({ message = 'Loading...', fullScreen = true }: PageLoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center animate-fadeIn text-text-primary">
      {/* Logo with spinner ring */}
      <div className="relative mb-5">
        {/* Logo Card */}
        <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-card shadow-sm p-3 border border-border flex items-center justify-center overflow-hidden">
          <img 
            src={logoImg} 
            alt="PragatiX Logo" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Orbiting spinner ring */}
        <div className="absolute -inset-2 rounded-xl border-2 border-transparent border-t-accent border-r-text-primary/20 animate-spin" />
      </div>

      {/* Loading Title & Message */}
      <h3 className="type-h4 font-bold text-text-primary mb-1">
        PragatiX
      </h3>
      <p className="type-body-sm font-medium text-text-secondary animate-pulse">
        {message}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-text-primary/40 backdrop-blur-xs transition-opacity duration-300">
        <div className="bg-card text-text-primary rounded-lg p-6 shadow-2xl border border-border max-w-xs w-full mx-4">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
